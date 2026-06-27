import datetime
from pydantic import BaseModel


class RegisterRequest(BaseModel):
    phone: str
    display_name: str
    otp: str


class LoginRequest(BaseModel):
    phone: str
    otp: str


class UserOut(BaseModel):
    id: str
    phone: str
    username: str | None
    display_name: str
    avatar_url: str | None
    bio: str | None
    last_seen: datetime.datetime | None
    is_online: bool
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class UserPublic(BaseModel):
    id: str
    username: str | None
    display_name: str
    avatar_url: str | None
    bio: str | None
    last_seen: datetime.datetime | None
    is_online: bool

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UpdateUserRequest(BaseModel):
    display_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None


class ConversationCreate(BaseModel):
    type: str
    name: str | None = None
    member_ids: list[str]


class LastMessageOut(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    content: str
    type: str
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id: str
    type: str
    name: str | None
    avatar_url: str | None
    created_by: str
    created_at: datetime.datetime
    last_message: LastMessageOut | None = None
    unread_count: int = 0
    other_user: UserPublic | None = None
    member_count: int = 0
    timer_seconds: int | None = None

    model_config = {"from_attributes": True}


class MessageStatusOut(BaseModel):
    user_id: str
    status: str
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


class MessageReplyPreview(BaseModel):
    id: str
    content: str
    sender_name: str
    type: str
    created_at: datetime.datetime


class MessageAttachment(BaseModel):
    url: str
    file_type: str
    file_size: int
    file_name: str


class MessageSend(BaseModel):
    content: str
    reply_to_id: str | None = None
    type: str = "text"
    attachment: MessageAttachment | None = None


class MessageOut(BaseModel):
    id: str
    conversation_id: str
    sender: UserPublic
    content: str
    type: str
    reply_to: MessageReplyPreview | None = None
    attachment: MessageAttachment | None = None
    is_deleted: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime
    statuses: list[MessageStatusOut] = []

    model_config = {"from_attributes": True}


class MessageStatusUpdate(BaseModel):
    status: str
    user_id: str | None = None


class ConversationUpdate(BaseModel):
    name: str | None = None
    avatar_url: str | None = None


class DisappearingTimerRequest(BaseModel):
    timer_seconds: int | None


class MemberOut(BaseModel):
    id: str
    user_id: str
    display_name: str
    avatar_url: str | None
    role: str
    joined_at: datetime.datetime
    last_seen: datetime.datetime | None
    is_online: bool

    model_config = {"from_attributes": True}


class ConversationDetail(BaseModel):
    id: str
    type: str
    name: str | None
    avatar_url: str | None
    created_by: str
    created_at: datetime.datetime
    members: list[MemberOut]
    member_count: int
    timer_seconds: int | None = None

    model_config = {"from_attributes": True}


class AddMembersRequest(BaseModel):
    member_ids: list[str]
