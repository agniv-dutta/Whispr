import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError, jwt
from sqlalchemy import select

from app.database import async_session
from app.models import User, ConversationMember
from app.websocket_manager import manager
from app.services.auth import SECRET_KEY, ALGORITHM

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=4001)
            return
    except JWTError:
        await websocket.close(code=4001)
        return

    db_session = async_session()
    try:
        async with db_session as db:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user:
                await websocket.close(code=4001)
                return

            was_offline = not manager.is_online(user_id)
            user.is_online = True
            await db.commit()

        if was_offline:
            conv_ids = await _get_user_conversation_ids(user_id)
            partner_ids = await _get_conversation_partner_ids(user_id, conv_ids)
            await manager.broadcast_to_users(
                partner_ids,
                {"type": "user_online", "user_id": user_id},
            )

        await manager.connect(user_id, websocket)

        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "ping":
                await manager.send_to_user(user_id, {"type": "pong"})

            elif msg_type == "subscribe":
                conv_id = data.get("conversation_id")
                if conv_id:
                    manager.subscribe(user_id, conv_id)

            elif msg_type == "unsubscribe":
                conv_id = data.get("conversation_id")
                if conv_id:
                    manager.unsubscribe(user_id, conv_id)

            elif msg_type == "typing_start":
                conv_id = data.get("conversation_id")
                if conv_id:
                    partner_ids = await _get_member_ids(conv_id, exclude=user_id)
                    await manager.broadcast_to_users(
                        partner_ids,
                        {
                            "type": "typing_start",
                            "conversation_id": conv_id,
                            "user_id": user_id,
                            "display_name": user.display_name,
                        },
                    )

            elif msg_type == "typing_stop":
                conv_id = data.get("conversation_id")
                if conv_id:
                    partner_ids = await _get_member_ids(conv_id, exclude=user_id)
                    await manager.broadcast_to_users(
                        partner_ids,
                        {
                            "type": "typing_stop",
                            "conversation_id": conv_id,
                            "user_id": user_id,
                            "display_name": user.display_name,
                        },
                    )

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(user_id, websocket)

        async with async_session() as db:
            if not manager.is_online(user_id):
                result = await db.execute(select(User).where(User.id == user_id))
                u = result.scalar_one_or_none()
                if u:
                    u.is_online = False
                    u.last_seen = datetime.datetime.utcnow()
                    await db.commit()

                conv_ids = await _get_user_conversation_ids(user_id)
                partner_ids = await _get_conversation_partner_ids(user_id, conv_ids)
                await manager.broadcast_to_users(
                    partner_ids,
                    {"type": "user_offline", "user_id": user_id},
                )


async def _get_user_conversation_ids(user_id: str) -> list[str]:
    async with async_session() as db:
        q = await db.execute(
            select(ConversationMember.conversation_id).where(
                ConversationMember.user_id == user_id
            )
        )
        return [r[0] for r in q.all()]


async def _get_conversation_partner_ids(user_id: str, conv_ids: list[str]) -> list[str]:
    if not conv_ids:
        return []
    async with async_session() as db:
        q = await db.execute(
            select(ConversationMember.user_id)
            .where(
                ConversationMember.conversation_id.in_(conv_ids),
                ConversationMember.user_id != user_id,
            )
        )
        all_ids = list(set(r[0] for r in q.all()))
        return all_ids


async def _get_member_ids(conv_id: str, exclude: str) -> list[str]:
    async with async_session() as db:
        q = await db.execute(
            select(ConversationMember.user_id).where(
                ConversationMember.conversation_id == conv_id,
                ConversationMember.user_id != exclude,
            )
        )
        return [r[0] for r in q.all()]
