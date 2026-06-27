import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models import (
    User, Conversation, ConversationMember, Message,
    MessageStatus, MessageStatusValue, ConversationType, MemberRole,
    MessageType as MsgType,
)
from app.schemas import (
    ConversationCreate, ConversationOut, LastMessageOut, UserPublic,
    ConversationUpdate, ConversationDetail, MemberOut, AddMembersRequest,
    DisappearingTimerRequest,
)
from app.websocket_manager import manager
from app.services.auth import get_current_user

router = APIRouter()


async def _build_conversation(
    db: AsyncSession, conv: Conversation, current_user: User
) -> ConversationOut:
    last_msg_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at.desc())
        .limit(1)
    )
    last_msg = last_msg_result.scalar_one_or_none()

    last_message = None
    if last_msg:
        sender = await db.get(User, last_msg.sender_id)
        last_message = LastMessageOut(
            id=last_msg.id,
            sender_id=last_msg.sender_id,
            sender_name=sender.display_name if sender else "Unknown",
            content=last_msg.content,
            type=last_msg.type.value,
            created_at=last_msg.created_at,
        )

    read_ids_q = select(MessageStatus.message_id).where(
        MessageStatus.user_id == current_user.id,
        MessageStatus.status == MessageStatusValue.READ,
    )
    read_ids = (await db.execute(read_ids_q)).scalars().all()

    unread_q = select(func.count()).select_from(Message).where(
        Message.conversation_id == conv.id,
        Message.sender_id != current_user.id,
    )
    if read_ids:
        unread_q = unread_q.where(Message.id.notin_(read_ids))
    unread_count = (await db.execute(unread_q)).scalar() or 0

    members_q = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conv.id
        )
    )
    members = members_q.scalars().all()
    member_count = len(members)

    other_user = None
    if conv.type == ConversationType.DIRECT:
        for m in members:
            if m.user_id != current_user.id:
                user = await db.get(User, m.user_id)
                if user:
                    other_user = UserPublic.model_validate(user)
                break

    return ConversationOut(
        id=conv.id,
        type=conv.type.value,
        name=conv.name,
        avatar_url=conv.avatar_url,
        created_by=conv.created_by,
        created_at=conv.created_at,
        last_message=last_message,
        unread_count=unread_count,
        other_user=other_user,
        member_count=member_count,
        timer_seconds=conv.disappearing_message_timer,
    )


@router.get("/", response_model=list[ConversationOut])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member_conversations = await db.execute(
        select(ConversationMember.conversation_id).where(
            ConversationMember.user_id == current_user.id
        )
    )
    conv_ids = [r[0] for r in member_conversations.all()]

    if not conv_ids:
        return []

    convs_result = await db.execute(
        select(Conversation).where(Conversation.id.in_(conv_ids))
    )
    convs = list(convs_result.scalars().all())

    built = []
    for conv in convs:
        built.append(await _build_conversation(db, conv, current_user))

    built.sort(
        key=lambda c: (
            c.last_message.created_at if c.last_message else c.created_at
        ),
        reverse=True,
    )
    return built


@router.post("/", response_model=ConversationOut, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    payload: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.type not in ("direct", "group"):
        raise HTTPException(status_code=400, detail="Invalid conversation type")

    all_ids = list(set([current_user.id] + payload.member_ids))

    if len(all_ids) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 participants")

    if payload.type == "direct":
        if len(all_ids) != 2:
            raise HTTPException(status_code=400, detail="Direct conversations need exactly 2 participants")

        other_id = [uid for uid in all_ids if uid != current_user.id][0]

        existing = await db.execute(
            select(ConversationMember.conversation_id)
            .where(ConversationMember.user_id == current_user.id)
        )
        user_conv_ids = [r[0] for r in existing.all()]

        other_member = await db.execute(
            select(ConversationMember.conversation_id).where(
                ConversationMember.user_id == other_id,
                ConversationMember.conversation_id.in_(user_conv_ids),
            )
        )
        existing_conv_id = other_member.scalar_one_or_none()
        if existing_conv_id:
            conv = await db.get(Conversation, existing_conv_id)
            return await _build_conversation(db, conv, current_user)

    new_id = uuid.uuid4().hex[:36]
    conv = Conversation(
        id=new_id,
        type=ConversationType(payload.type),
        name=payload.name,
        created_by=current_user.id,
    )
    db.add(conv)

    for uid in all_ids:
        db.add(ConversationMember(
            conversation_id=new_id,
            user_id=uid,
            role=MemberRole.ADMIN if uid == current_user.id else MemberRole.MEMBER,
        ))

    if payload.type == "group":
        sys_msg_id = uuid.uuid4().hex[:36]
        db.add(Message(
            id=sys_msg_id,
            conversation_id=new_id,
            sender_id=current_user.id,
            content=f"{current_user.display_name} created the group",
            type=MsgType.SYSTEM,
        ))

    await db.commit()
    await db.refresh(conv)
    return await _build_conversation(db, conv, current_user)


@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_conversation_detail(
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
    if not membership.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a member")

    conv = await db.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    members_q = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id
        )
    )
    members = members_q.scalars().all()

    out_members = []
    for m in members:
        user = await db.get(User, m.user_id)
        out_members.append(MemberOut(
            id=str(m.id),
            user_id=m.user_id,
            display_name=user.display_name if user else "Unknown",
            avatar_url=user.avatar_url if user else None,
            role=m.role.value,
            joined_at=m.joined_at,
            last_seen=user.last_seen if user else None,
            is_online=user.is_online if user else False,
        ))

    return ConversationDetail(
        id=conv.id,
        type=conv.type.value,
        name=conv.name,
        avatar_url=conv.avatar_url,
        created_by=conv.created_by,
        created_at=conv.created_at,
        members=out_members,
        member_count=len(out_members),
        timer_seconds=conv.disappearing_message_timer,
    )


def _format_duration(seconds: int) -> str:
    if seconds < 60:
        return f"{seconds} seconds"
    if seconds < 3600:
        mins = seconds // 60
        return f"{mins} minute{'s' if mins > 1 else ''}"
    if seconds < 86400:
        hours = seconds // 3600
        return f"{hours} hour{'s' if hours > 1 else ''}"
    if seconds < 604800:
        days = seconds // 86400
        return f"{days} day{'s' if days > 1 else ''}"
    weeks = seconds // 604800
    return f"{weeks} week{'s' if weeks > 1 else ''}"


@router.put("/{conversation_id}/disappearing", response_model=ConversationOut)
async def set_disappearing_timer(
    conversation_id: str,
    payload: DisappearingTimerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = await db.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    membership = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.id,
        )
    )
    if not membership.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a member")

    conv.disappearing_message_timer = payload.timer_seconds

    if payload.timer_seconds:
        duration_str = _format_duration(payload.timer_seconds)
        sys_msg_id = uuid.uuid4().hex[:36]
        db.add(Message(
            id=sys_msg_id,
            conversation_id=conversation_id,
            sender_id=current_user.id,
            content=f"{current_user.display_name} set messages to disappear after {duration_str}",
            type=MsgType.SYSTEM,
        ))

    await db.commit()
    await db.refresh(conv)

    out = await _build_conversation(db, conv, current_user)

    # broadcast the timer change to all members via WS
    await manager.broadcast_to_conversation(
        conversation_id,
        {"type": "timer_update", "conversation_id": conversation_id, "timer_seconds": payload.timer_seconds},
    )

    return out


@router.put("/{conversation_id}", response_model=ConversationOut)
async def update_conversation(
    conversation_id: str,
    payload: ConversationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = await db.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    membership = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.id,
        )
    )
    member = membership.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member")
    if member.role != MemberRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")

    if payload.name is not None:
        conv.name = payload.name
    if payload.avatar_url is not None:
        conv.avatar_url = payload.avatar_url
    await db.commit()
    await db.refresh(conv)
    return await _build_conversation(db, conv, current_user)


@router.post("/{conversation_id}/members", response_model=ConversationDetail, status_code=201)
async def add_members(
    conversation_id: str,
    payload: AddMembersRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = await db.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    membership = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.id,
        )
    )
    member = membership.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member")
    if member.role != MemberRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")

    existing_q = await db.execute(
        select(ConversationMember.user_id).where(
            ConversationMember.conversation_id == conversation_id,
        )
    )
    existing_ids = {r[0] for r in existing_q.all()}

    added = []
    for uid in payload.member_ids:
        if uid in existing_ids:
            continue
        user = await db.get(User, uid)
        if not user:
            continue
        m = ConversationMember(
            conversation_id=conversation_id,
            user_id=uid,
            role=MemberRole.MEMBER,
        )
        db.add(m)
        added.append(uid)

    if added:
        sys_msg_id = uuid.uuid4().hex[:36]
        names = []
        for uid in added:
            u = await db.get(User, uid)
            names.append(u.display_name if u else "Unknown")
        db.add(Message(
            id=sys_msg_id,
            conversation_id=conversation_id,
            sender_id=current_user.id,
            content=f"{current_user.display_name} added {', '.join(names)}",
            type=MsgType.SYSTEM,
        ))

    await db.commit()

    members_q = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id
        )
    )
    out_members = []
    for m in members_q.scalars().all():
        u = await db.get(User, m.user_id)
        out_members.append(MemberOut(
            id=str(m.id),
            user_id=m.user_id,
            display_name=u.display_name if u else "Unknown",
            avatar_url=u.avatar_url if u else None,
            role=m.role.value,
            joined_at=m.joined_at,
            last_seen=u.last_seen if u else None,
            is_online=u.is_online if u else False,
        ))

    await db.refresh(conv)
    return ConversationDetail(
        id=conv.id,
        type=conv.type.value,
        name=conv.name,
        avatar_url=conv.avatar_url,
        created_by=conv.created_by,
        created_at=conv.created_at,
        members=out_members,
        member_count=len(out_members),
    )


@router.delete("/{conversation_id}/members/{user_id}", status_code=200)
async def remove_member(
    conversation_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = await db.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    is_self = user_id == current_user.id

    membership = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.id,
        )
    )
    current_member = membership.scalar_one_or_none()
    if not current_member:
        raise HTTPException(status_code=403, detail="Not a member")

    if not is_self and current_member.role != MemberRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")

    target = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id,
        )
    )
    target_member = target.scalar_one_or_none()
    if not target_member:
        raise HTTPException(status_code=404, detail="Member not found")

    await db.delete(target_member)

    target_user = await db.get(User, user_id)
    target_name = target_user.display_name if target_user else "Unknown"

    sys_msg_id = uuid.uuid4().hex[:36]
    if is_self:
        db.add(Message(
            id=sys_msg_id,
            conversation_id=conversation_id,
            sender_id=current_user.id,
            content=f"{current_user.display_name} left the group",
            type=MsgType.SYSTEM,
        ))
    else:
        db.add(Message(
            id=sys_msg_id,
            conversation_id=conversation_id,
            sender_id=current_user.id,
            content=f"{current_user.display_name} removed {target_name}",
            type=MsgType.SYSTEM,
        ))

    await db.commit()
    return {"ok": True}
