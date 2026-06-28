import sys; sys.path.insert(0, '.')
import asyncio
from app.database import async_session
from app.models import User, Message, ConversationMember
from sqlalchemy import select
from app.routers.chats import _message_to_out

async def test():
    async with async_session() as db:
        r = await db.execute(select(User).limit(1))
        user = r.scalar_one()
        print(f"User: {user.display_name}")

        r2 = await db.execute(select(ConversationMember).where(ConversationMember.user_id == user.id).limit(1))
        member = r2.scalar_one()
        print(f"Conversation: {member.conversation_id}")

        r3 = await db.execute(select(Message).where(Message.conversation_id == member.conversation_id).limit(5))
        msgs = r3.scalars().all()
        print(f"Messages: {len(msgs)}")
        
        for msg in msgs:
            try:
                out = await _message_to_out(msg, db)
                print(f"  OK: {out.id[:8]}... content={out.content[:30]}")
            except Exception as e:
                print(f"  ERROR for msg {msg.id}: {e}")
                import traceback
                traceback.print_exc()

asyncio.run(test())
