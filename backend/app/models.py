import uuid
import datetime
from enum import Enum as PyEnum
from sqlalchemy import (
    String, Text, Boolean, DateTime, ForeignKey, Integer,
    Enum as SAEnum, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ConversationType(PyEnum):
    DIRECT = "direct"
    GROUP = "group"


class MemberRole(PyEnum):
    ADMIN = "admin"
    MEMBER = "member"


class MessageType(PyEnum):
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    SYSTEM = "system"


class MessageStatusValue(PyEnum):
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    username: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True, index=True
    )
    display_name: Mapped[str] = mapped_column(String(100))
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    bio: Mapped[str | None] = mapped_column(String(500), nullable=True)
    last_seen: Mapped[datetime.datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    is_online: Mapped[bool] = mapped_column(Boolean, default=False)
    hashed_password: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )

    owned_contacts: Mapped[list["Contact"]] = relationship(
        foreign_keys="Contact.owner_id", back_populates="owner"
    )
    contact_of: Mapped[list["Contact"]] = relationship(
        foreign_keys="Contact.contact_id", back_populates="contact"
    )
    conversations_created: Mapped[list["Conversation"]] = relationship(
        back_populates="created_by_user"
    )
    memberships: Mapped[list["ConversationMember"]] = relationship(
        back_populates="user"
    )
    sent_messages: Mapped[list["Message"]] = relationship(
        back_populates="sender"
    )
    message_statuses: Mapped[list["MessageStatus"]] = relationship(
        back_populates="user"
    )


class Contact(Base):
    __tablename__ = "contacts"
    __table_args__ = (
        UniqueConstraint("owner_id", "contact_id", name="uq_owner_contact"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), index=True
    )
    contact_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), index=True
    )
    nickname: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )

    owner: Mapped["User"] = relationship(
        foreign_keys=[owner_id], back_populates="owned_contacts"
    )
    contact: Mapped["User"] = relationship(
        foreign_keys=[contact_id], back_populates="contact_of"
    )


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    type: Mapped[ConversationType] = mapped_column(
        SAEnum(ConversationType), default=ConversationType.DIRECT
    )
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    disappearing_message_timer: Mapped[int | None] = mapped_column(Integer, nullable=True, default=None)

    created_by_user: Mapped["User"] = relationship(back_populates="conversations_created")
    members: Mapped[list["ConversationMember"]] = relationship(
        back_populates="conversation"
    )
    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation", order_by="Message.created_at"
    )


class ConversationMember(Base):
    __tablename__ = "conversation_members"
    __table_args__ = (
        UniqueConstraint("conversation_id", "user_id", name="uq_conv_member"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    conversation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("conversations.id"), index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), index=True
    )
    role: Mapped[MemberRole] = mapped_column(
        SAEnum(MemberRole), default=MemberRole.MEMBER
    )
    joined_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    last_read_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime, nullable=True
    )

    conversation: Mapped["Conversation"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship(back_populates="memberships")


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    conversation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("conversations.id"), index=True
    )
    sender_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), index=True
    )
    content: Mapped[str] = mapped_column(Text)
    type: Mapped[MessageType] = mapped_column(
        SAEnum(MessageType), default=MessageType.TEXT
    )
    reply_to_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("messages.id"), nullable=True
    )
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")
    sender: Mapped["User"] = relationship(back_populates="sent_messages")
    reply_to: Mapped["Message | None"] = relationship(
        foreign_keys=[reply_to_id],
        remote_side="Message.id",
        back_populates="replies",
    )
    replies: Mapped[list["Message"]] = relationship(
        foreign_keys=[reply_to_id],
        back_populates="reply_to",
    )
    statuses: Mapped[list["MessageStatus"]] = relationship(back_populates="message")
    attachments: Mapped[list["MediaAttachment"]] = relationship(back_populates="message")


class MessageStatus(Base):
    __tablename__ = "message_status"
    __table_args__ = (
        UniqueConstraint("message_id", "user_id", name="uq_msg_user"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    message_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("messages.id"), index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), index=True
    )
    status: Mapped[MessageStatusValue] = mapped_column(SAEnum(MessageStatusValue))
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )

    message: Mapped["Message"] = relationship(back_populates="statuses")
    user: Mapped["User"] = relationship(back_populates="message_statuses")


class MediaAttachment(Base):
    __tablename__ = "media_attachments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    message_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("messages.id"), index=True
    )
    url: Mapped[str] = mapped_column(String(500))
    file_type: Mapped[str] = mapped_column(String(100))
    file_size: Mapped[int] = mapped_column(Integer)
    file_name: Mapped[str] = mapped_column(String(255))

    message: Mapped["Message"] = relationship(back_populates="attachments")
