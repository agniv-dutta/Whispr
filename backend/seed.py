"""
Seed script: creates 6 users, 5 conversations, and realistic messages.

Usage:
  cd backend && python -c "import sys; sys.path.insert(0, '.'); from seed import seed; import asyncio; asyncio.run(seed())"
"""
import uuid
import datetime
import asyncio
from app.database import async_session
from app.models import (
    User, Conversation, ConversationMember, Message, MessageStatus,
    ConversationType, MemberRole, MessageType as MsgType, MessageStatusValue,
)
from app.services.auth import create_access_token, SECRET_KEY, ALGORITHM

USERS = [
    {"phone": "+919876543210", "display_name": "Alex Chen", "bio": "Full-stack dev"},
    {"phone": "+919876543211", "display_name": "Priya Sharma", "bio": "Designer @ Whispr"},
    {"phone": "+919876543212", "display_name": "Marcus Williams", "bio": "Backend wizard"},
    {"phone": "+919876543213", "display_name": "Sofia Rodriguez", "bio": "Mobile dev"},
    {"phone": "+919876543214", "display_name": "James Park", "bio": "DevOps engineer"},
    {"phone": "+919876543215", "display_name": "Aisha Patel", "bio": "Product manager"},
]


def _ago(**kwargs):
    return datetime.datetime.utcnow() - datetime.timedelta(**kwargs)


def _make_id():
    return uuid.uuid4().hex[:36]


async def seed():
    async with async_session() as db:
        existing = await db.execute(__import__("sqlalchemy").select(User).limit(1))
        if existing.scalar_one_or_none():
            print("Database already has data. Skipping seed.")
            return

        users = []
        for u in USERS:
            from passlib.hash import bcrypt
            user = User(
                id=_make_id(),
                phone=u["phone"],
                display_name=u["display_name"],
                bio=u["bio"],
                is_online=False,
                last_seen=_ago(hours=2),
                hashed_password=bcrypt.hash("password"),
            )
            db.add(user)
            users.append(user)
        await db.commit()
        for u in users:
            await db.refresh(u)

        alex, priya, marcus, sofia, james, aisha = users
        print(f"Created {len(users)} users")

        # Direct: Alex ↔ Priya (lots of messages, last msg < 1hr ago)
        c1 = Conversation(id=_make_id(), type=ConversationType.DIRECT, created_by=alex.id)
        db.add(c1)
        for uid in [alex.id, priya.id]:
            db.add(ConversationMember(conversation_id=c1.id, user_id=uid, role=MemberRole.MEMBER))

        # Direct: Alex ↔ Marcus
        c2 = Conversation(id=_make_id(), type=ConversationType.DIRECT, created_by=alex.id)
        db.add(c2)
        for uid in [alex.id, marcus.id]:
            db.add(ConversationMember(conversation_id=c2.id, user_id=uid, role=MemberRole.MEMBER))

        # Direct: Alex ↔ Sofia
        c3 = Conversation(id=_make_id(), type=ConversationType.DIRECT, created_by=alex.id)
        db.add(c3)
        for uid in [alex.id, sofia.id]:
            db.add(ConversationMember(conversation_id=c3.id, user_id=uid, role=MemberRole.MEMBER))

        # Group: Dev Team (Alex, Priya, Marcus, Sofia)
        c4 = Conversation(id=_make_id(), type=ConversationType.GROUP, name="Dev Team 🚀", created_by=alex.id)
        db.add(c4)
        for uid in [alex.id, priya.id, marcus.id, sofia.id]:
            db.add(ConversationMember(conversation_id=c4.id, user_id=uid, role=MemberRole.ADMIN if uid == alex.id else MemberRole.MEMBER))

        # Group: Weekend Plans (Alex, James, Aisha)
        c5 = Conversation(id=_make_id(), type=ConversationType.GROUP, name="Weekend Plans", created_by=james.id)
        db.add(c5)
        for uid in [alex.id, james.id, aisha.id]:
            db.add(ConversationMember(conversation_id=c5.id, user_id=uid, role=MemberRole.ADMIN if uid == james.id else MemberRole.MEMBER))

        await db.commit()

        # ── Messages for Alex ↔ Priya (8 messages, last 30 min ago) ──
        alex_priya_msgs = [
            ("Hey Priya, how's the new design system coming along?", _ago(hours=48), alex),
            ("Almost done! Just polishing the dark mode palette.", _ago(hours=47, minutes=45), priya),
            ("Love the teal accent you picked. Fits the brand perfectly.", _ago(hours=30), alex),
            ("Thanks! I was inspired by Signal's color scheme actually.", _ago(hours=29, minutes=30), priya),
            ("Have you seen the new shadcn/ui release?", _ago(hours=4), alex),
            ("Not yet, anything good?", _ago(hours=3, minutes=50), priya),
            ("They added a new multi-select component. Super clean.", _ago(hours=1), alex),
            ("Nice, I'll check it out after this sprint.", _ago(minutes=30), priya),
        ]

        # ── Messages for Alex ↔ Marcus (5 messages) ──
        alex_marcus_msgs = [
            ("Marcus, can you review my PR on the auth module?", _ago(hours=72), alex),
            ("On it. The JWT middleware looks solid.", _ago(hours=71), marcus),
            ("Thanks. I used the same pattern from the docs.", _ago(hours=70), alex),
            ("One suggestion — add a refresh token endpoint.", _ago(hours=69, minutes=30), marcus),
            ("Good call. I'll add that in the next iteration.", _ago(hours=68), alex),
        ]

        # ── Messages for Alex ↔ Sofia (4 messages) ──
        alex_sofia_msgs = [
            ("Sofia, can you help debug the WebSocket reconnection?", _ago(hours=24), alex),
            ("Sure, what's the issue?", _ago(hours=23, minutes=30), sofia),
            ("The heartbeat ping isn't firing after reconnect.", _ago(hours=23), alex),
            ("Check the cleanup — you're probably missing an interval clear.", _ago(hours=22, minutes=45), sofia),
        ]

        # ── Dev Team messages (20 messages) ──
        dev_msgs = [
            ("Hey team, standup in 10!", _ago(hours=96), alex),
            ("Here! Working on the chat UI.", _ago(hours=95, minutes=55), priya),
            ("I'll demo the new WebSocket layer today.", _ago(hours=95, minutes=50), marcus),
            ("Awesome, I've been waiting to see that.", _ago(hours=95, minutes=45), sofia),
            ("The test suite is passing at 92% coverage.", _ago(hours=72), alex),
            ("Let's bump it to 95% before next release.", _ago(hours=71, minutes=30), priya),
            ("I can write tests for the conversation endpoints.", _ago(hours=71), marcus),
            ("I'll cover the message status handlers.", _ago(hours=70, minutes=30), sofia),
            ("New build is up on staging. Test it out.", _ago(hours=48), alex),
            ("Dark mode looks incredible on mobile!", _ago(hours=47, minutes=30), marcus),
            ("The typing indicator animation needs tweaking though.", _ago(hours=47), priya),
            ("The bounce feels a bit slow. Let's speed it up.", _ago(hours=46, minutes=45), sofia),
            ("I noticed a bug: unread count doesn't reset after opening chat.", _ago(hours=24), marcus),
            ("Looking into it. Might be a stale closure in the hook.", _ago(hours=23, minutes=30), alex),
            ("The notification banner is working well on desktop.", _ago(hours=12), priya),
            ("Mobile needs the swipe-to-go-back gesture.", _ago(hours=11, minutes=30), sofia),
            ("Agreed. I'll add it next sprint.", _ago(hours=11), alex),
            ("Can someone review my PR for the settings page?", _ago(hours=3), priya),
            ("On it! The profile edit form looks clean.", _ago(hours=2, minutes=30), marcus),
            ("Thanks! Added dark mode toggle too.", _ago(hours=2), priya),
        ]

        # ── Weekend Plans messages (10 messages) ──
        weekend_msgs = [
            ("Anyone free this weekend?", _ago(hours=120), james),
            ("I'm in! What are we thinking?", _ago(hours=119, minutes=30), aisha),
            ("Hiking at Mount Tam? Weather looks great.", _ago(hours=119), james),
            ("Love it! I'll bring snacks.", _ago(hours=118, minutes=30), aisha),
            ("Count me in too. Can I bring a guest?", _ago(hours=100), alex),
            ("Sure, the more the merrier!", _ago(hours=99, minutes=30), james),
            ("I know a great trail with a waterfall.", _ago(hours=72), aisha),
            ("Perfect. Let's meet at the trailhead at 8am.", _ago(hours=48), james),
            ("I'll drive — my car fits 5 people.", _ago(hours=24), alex),
            ("Awesome. Saturday it is! 🌲☀️", _ago(hours=23), aisha),
        ]

        all_conversations = [
            (c1, alex_priya_msgs, [alex, priya]),
            (c2, alex_marcus_msgs, [alex, marcus]),
            (c3, alex_sofia_msgs, [alex, sofia]),
            (c4, dev_msgs, [alex, priya, marcus, sofia]),
            (c5, weekend_msgs, [alex, james, aisha]),
        ]

        total_msgs = 0
        for conv, msg_list, members in all_conversations:
            for content, ts, sender in msg_list:
                mid = _make_id()
                db.add(Message(
                    id=mid, conversation_id=conv.id, sender_id=sender.id,
                    content=content, type=MsgType.TEXT, created_at=ts, updated_at=ts,
                ))
                for m in members:
                    if m.id == sender.id:
                        status = MessageStatusValue.SENT
                    elif ts < _ago(minutes=5):
                        status = MessageStatusValue.READ
                    else:
                        status = MessageStatusValue.DELIVERED
                    db.add(MessageStatus(
                        message_id=mid, user_id=m.id,
                        status=status, updated_at=ts,
                    ))
                total_msgs += 1

        await db.commit()
        print(f"Created {total_msgs} messages across {len(all_conversations)} conversations")

        print("\n── Seed complete ──")
        print("Users (use any phone + OTP 123456):")
        for u in users:
            token = create_access_token({"sub": u.id})
            print(f"  {u.phone} → {u.display_name}")
        print("\nJWT tokens for quick testing:")
        for u in users:
            token = create_access_token({"sub": u.id})
            print(f"  {u.phone}: {token[:60]}...")

if __name__ == "__main__":
    asyncio.run(seed())
