import sys; sys.path.insert(0, '.')
import asyncio
from app.database import async_session
from app.models import User, Conversation
from sqlalchemy import select

async def c():
    async with async_session() as db:
        r = await db.execute(select(User))
        users = r.scalars().all()
        print(f'{len(users)} users')
        for u in users:
            print(f'  {u.display_name} - {u.phone}')
        r2 = await db.execute(select(Conversation))
        convs = r2.scalars().all()
        print(f'{len(convs)} conversations')
        for c in convs:
            print(f'  {c.id[:8]}... type={c.type} name={c.name}')

asyncio.run(c())
