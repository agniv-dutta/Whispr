import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models import (
    User, Conversation, ConversationMember, Message,
    MessageStatus, MessageStatusValue, MessageType as MsgType,
    MediaAttachment,
)
from app.schemas import (
    MessageOut, MessageSend, MessageStatusOut,
    MessageReplyPreview, UserPublic, MessageStatusUpdate,
    MessageAttachment,
)
from app.services.auth import get_current_user
from app.websocket_manager import manager

router = APIRouter()


async def _message_to_out(msg: Message, db: AsyncSession) -> MessageOut:
    sender = await db.get(User, msg.sender_id)

    reply_to = None
    if msg.reply_to_id:
        reply_msg = await db.get(Message, msg.reply_to_id)
        if reply_msg:
            reply_sender = await db.get(User, reply_msg.sender_id)
            reply_to = MessageReplyPreview(
                id=reply_msg.id,
                content=reply_msg.content,
                sender_name=reply_sender.display_name if reply_sender else "Unknown",
                type=reply_msg.type.value,
                created_at=reply_msg.created_at,
            )

    attachment = None
    if msg.attachments:
        att = msg.attachments[0]
        attachment = MessageAttachment(
            url=att.url,
            file_type=att.file_type,
            file_size=att.file_size,
            file_name=att.file_name,
        )

    statuses_q = await db.execute(
        select(MessageStatus).where(MessageStatus.message_id == msg.id)
    )
    statuses = [
        MessageStatusOut(
            user_id=s.user_id,
            status=s.status.value,
            updated_at=s.updated_at,
        )
        for s in statuses_q.scalars().all()
    ]

    return MessageOut(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender=UserPublic(
            id=sender.id,
            username=sender.username,
            display_name=sender.display_name,
            avatar_url=sender.avatar_url,
            bio=sender.bio,
            last_seen=sender.last_seen,
            is_online=sender.is_online,
        ) if sender else UserPublic(id="", display_name="Unknown", is_online=False),
        content=msg.content,
        type=msg.type.value,
        reply_to=reply_to,
        attachment=attachment,
        is_deleted=msg.is_deleted,
        created_at=msg.created_at,
        updated_at=msg.updated_at,
        statuses=statuses,
    )


@router.get("/{conversation_id}/messages", response_model=list[MessageOut])
async def get_messages(
    conversation_id: str,
    limit: int = Query(50, ge=1, le=200),
    before: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.id,
        )
    )
    if not membership.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a member")

    q = select(Message).where(Message.conversation_id == conversation_id)

    if before:
        before_msg = await db.get(Message, before)
        if before_msg:
            q = q.where(Message.created_at < before_msg.created_at)

    q = q.order_by(Message.created_at.desc()).limit(limit)
    result = await db.execute(q)
    msgs = list(result.scalars().all())
    msgs.reverse()

    out = []
    for msg in msgs:
        out.append(await _message_to_out(msg, db))
    return out


@router.post("/{conversation_id}/messages", response_model=MessageOut, status_code=201)
async def send_message(
    conversation_id: str,
    payload: MessageSend,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.id,
        )
    )
    if not membership.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a member")

    now = datetime.datetime.utcnow()
    msg_id = uuid.uuid4().hex[:36]

    msg_type = MsgType(payload.type) if payload.type in ("text", "image", "file", "system") else MsgType.TEXT
    if payload.attachment and payload.type == "text":
        is_img = payload.attachment.file_type.startswith("image/")
        msg_type = MsgType.IMAGE if is_img else MsgType.FILE

    msg = Message(
        id=msg_id,
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=payload.content,
        type=msg_type,
        reply_to_id=payload.reply_to_id,
        created_at=now,
        updated_at=now,
    )
    db.add(msg)

    if payload.attachment:
        db.add(MediaAttachment(
            message_id=msg_id,
            url=payload.attachment.url,
            file_type=payload.attachment.file_type,
            file_size=payload.attachment.file_size,
            file_name=payload.attachment.file_name,
        ))

    db.add(MessageStatus(
        message_id=msg_id,
        user_id=current_user.id,
        status=MessageStatusValue.SENT,
        updated_at=now,
    ))

    members_q = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id != current_user.id,
        )
    )
    other_members = members_q.scalars().all()

    for member in other_members:
        initial_status = MessageStatusValue.DELIVERED
        db.add(MessageStatus(
            message_id=msg_id,
            user_id=member.user_id,
            status=initial_status,
            updated_at=now,
        ))

    await db.commit()
    await db.refresh(msg)

    out = await _message_to_out(msg, db)

    await manager.broadcast_to_conversation(
        conversation_id,
        {"type": "new_message", "message": out.model_dump(mode="json")},
    )

    return out


@router.put("/{conversation_id}/read", status_code=200)
async def mark_conversation_read(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.id,
        )
    )
    member = membership.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member")

    msgs_q = await db.execute(
        select(Message.id).where(
            Message.conversation_id == conversation_id,
            Message.sender_id != current_user.id,
        )
    )
    msg_ids = [r[0] for r in msgs_q.all()]

    if msg_ids:
        existing_q = await db.execute(
            select(MessageStatus).where(
                MessageStatus.message_id.in_(msg_ids),
                MessageStatus.user_id == current_user.id,
                MessageStatus.status == MessageStatusValue.READ,
            )
        )
        existing_read = {s.message_id for s in existing_q.scalars().all()}

        now = datetime.datetime.utcnow()
        for mid in msg_ids:
            if mid not in existing_read:
                status = await db.execute(
                    select(MessageStatus).where(
                        MessageStatus.message_id == mid,
                        MessageStatus.user_id == current_user.id,
                    )
                )
                s = status.scalar_one_or_none()
                if s:
                    s.status = MessageStatusValue.READ
                    s.updated_at = now
                else:
                    db.add(MessageStatus(
                        message_id=mid,
                        user_id=current_user.id,
                        status=MessageStatusValue.READ,
                        updated_at=now,
                    ))

        member.last_read_at = now

    await db.commit()

    await manager.broadcast_to_conversation(
        conversation_id,
        {
            "type": "status_update",
            "conversation_id": conversation_id,
            "user_id": current_user.id,
            "status": "read",
        },
    )

    return {"ok": True}


@router.put("/messages/{message_id}/status", status_code=200)
async def update_message_status(
    message_id: str,
    payload: MessageStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    msg = await db.get(Message, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    membership = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == msg.conversation_id,
            ConversationMember.user_id == current_user.id,
        )
    )
    if not membership.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a member")

    target_user_id = payload.user_id or current_user.id

    if payload.status not in ("delivered", "read"):
        raise HTTPException(status_code=400, detail="Invalid status")

    status_val = MessageStatusValue(payload.status)

    s_q = await db.execute(
        select(MessageStatus).where(
            MessageStatus.message_id == message_id,
            MessageStatus.user_id == target_user_id,
        )
    )
    s = s_q.scalar_one_or_none()
    now = datetime.datetime.utcnow()
    if s:
        s.status = status_val
        s.updated_at = now
    else:
        db.add(MessageStatus(
            message_id=message_id,
            user_id=target_user_id,
            status=status_val,
            updated_at=now,
        ))
    await db.commit()

    await manager.broadcast_to_conversation(
        msg.conversation_id,
        {
            "type": "status_update",
            "message_id": message_id,
            "user_id": target_user_id,
            "conversation_id": msg.conversation_id,
            "status": payload.status,
        },
    )

    return {"ok": True}
