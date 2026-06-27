import asyncio
import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select

from app.database import engine, Base, async_session
from app.models import Conversation, Message
from app.routers import auth, users, chats, conversations, websocket, upload


async def delete_expired_messages():
    while True:
        await asyncio.sleep(60)
        try:
            async with async_session() as db:
                now = datetime.datetime.utcnow()
                convs = await db.execute(
                    select(Conversation).where(Conversation.disappearing_message_timer.isnot(None))
                )
                for conv in convs.scalars().all():
                    cutoff = now - datetime.timedelta(seconds=conv.disappearing_message_timer)
                    msgs = await db.execute(
                        select(Message).where(
                            Message.conversation_id == conv.id,
                            Message.created_at < cutoff,
                            Message.is_deleted == False,
                        )
                    )
                    for msg in msgs.scalars().all():
                        msg.is_deleted = True
                await db.commit()
        except Exception:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    task = asyncio.create_task(delete_expired_messages())
    yield
    task.cancel()


app = FastAPI(title="Whispr API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://whispr.vercel.app",
        "https://whispr-backend.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(chats.router, prefix="/api/chats", tags=["chats"])
app.include_router(conversations.router, prefix="/api/conversations", tags=["conversations"])
app.include_router(websocket.router, tags=["websocket"])
app.include_router(upload.router, prefix="/api", tags=["upload"])

import os
os.makedirs("uploads/avatars", exist_ok=True)
os.makedirs("static/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/static", StaticFiles(directory="static"), name="static")
