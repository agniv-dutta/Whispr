import uuid
import datetime
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session, engine, Base
from app.models import (
    User, Contact, Conversation, ConversationMember, Message,
    MessageStatus,
    ConversationType, MemberRole, MessageStatusValue,
)
from passlib.context import CryptContext

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
PASSWORD = _pwd.hash("password123")

now = datetime.datetime.utcnow


def dt(days: float = 0, minutes: float = 0) -> datetime.datetime:
    return now() - datetime.timedelta(days=days, minutes=minutes)


def make_id() -> str:
    return str(uuid.uuid4())


USER_DATA = [
    dict(
        id=make_id(), phone="+919876543210", username="priyasharma",
        display_name="Priya Sharma",
        avatar_url="https://ui-avatars.com/api/?name=Priya+Sharma&background=3AB5A0&color=fff&size=200",
        bio="Product designer @ Swiggy. Building things that matter.",
        last_seen=dt(minutes=2), is_online=True,
    ),
    dict(
        id=make_id(), phone="+15550101", username="marcuschen",
        display_name="Marcus Chen",
        avatar_url="https://ui-avatars.com/api/?name=Marcus+Chen&background=2C2C2C&color=fff&size=200",
        bio="Full-stack dev. React by day, Rust by night.",
        last_seen=dt(minutes=15), is_online=False,
    ),
    dict(
        id=make_id(), phone="+2348012345678", username="amaraokafor",
        display_name="Amara Okafor",
        avatar_url="https://ui-avatars.com/api/?name=Amara+Okafor&background=E91E63&color=fff&size=200",
        bio="Data scientist @ Flutterwave. ML enthusiast.",
        last_seen=dt(minutes=60), is_online=False,
    ),
    dict(
        id=make_id(), phone="+491701234567", username="lukasweber",
        display_name="Lukas Weber",
        avatar_url="https://ui-avatars.com/api/?name=Lukas+Weber&background=2196F3&color=fff&size=200",
        bio="DevOps engineer. K8s, Terraform, and automation.",
        last_seen=dt(minutes=180), is_online=False,
    ),
    dict(
        id=make_id(), phone="+819012345678", username="yukitanaka",
        display_name="Yuki Tanaka",
        avatar_url="https://ui-avatars.com/api/?name=Yuki+Tanaka&background=FF9800&color=fff&size=200",
        bio="UX researcher. Previously @ Sony.",
        last_seen=dt(days=1), is_online=False,
    ),
    dict(
        id=make_id(), phone="+34612345678", username="sofiarodriguez",
        display_name="Sofia Rodriguez",
        avatar_url="https://ui-avatars.com/api/?name=Sofia+Rodriguez&background=9C27B0&color=fff&size=200",
        bio="Product manager turned founder.",
        last_seen=dt(minutes=0.5), is_online=True,
    ),
]

PASSWORD = _pwd.hash("password123")


async def create_users(db: AsyncSession) -> dict[str, User]:
    users = {}
    for data in USER_DATA:
        user = User(
            id=data["id"],
            phone=data["phone"],
            username=data["username"],
            display_name=data["display_name"],
            avatar_url=data["avatar_url"],
            bio=data["bio"],
            last_seen=data["last_seen"],
            is_online=data["is_online"],
            hashed_password=PASSWORD,
        )
        db.add(user)
        users[data["username"]] = user
    await db.commit()
    return users


async def create_contacts(db: AsyncSession, users: dict[str, User]):
    pairs = [
        ("marcuschen", "priyasharma"),
        ("amaraokafor", "lukasweber"),
        ("yukitanaka", "sofiarodriguez"),
        ("priyasharma", "sofiarodriguez"),
        ("priyasharma", "yukitanaka"),
        ("marcuschen", "lukasweber"),
        ("marcuschen", "amaraokafor"),
    ]
    for owner_key, contact_key in pairs:
        db.add(Contact(owner_id=users[owner_key].id, contact_id=users[contact_key].id))
    await db.commit()


async def create_conversations(
    db: AsyncSession, users: dict[str, User]
) -> dict[str, Conversation]:
    convos = {}

    # --- Group: Dev Team ---
    dev_id = make_id()
    dev = Conversation(
        id=dev_id, type=ConversationType.GROUP, name="Dev Team",
        created_by=users["marcuschen"].id, created_at=dt(days=6),
    )
    db.add(dev)
    convos["dev"] = dev

    for username in ("marcuschen", "priyasharma", "lukasweber", "amaraokafor"):
        role = MemberRole.ADMIN if username == "marcuschen" else MemberRole.MEMBER
        db.add(ConversationMember(
            conversation_id=dev_id, user_id=users[username].id,
            role=role, joined_at=dt(days=6),
        ))

    # --- Group: Design Crit ---
    design_id = make_id()
    design = Conversation(
        id=design_id, type=ConversationType.GROUP, name="Design Crit",
        created_by=users["priyasharma"].id, created_at=dt(days=5),
    )
    db.add(design)
    convos["design"] = design

    for username in ("priyasharma", "sofiarodriguez", "yukitanaka"):
        role = MemberRole.ADMIN if username == "priyasharma" else MemberRole.MEMBER
        db.add(ConversationMember(
            conversation_id=design_id, user_id=users[username].id,
            role=role, joined_at=dt(days=5),
        ))

    # --- Direct: Marcus <-> Priya ---
    mp_id = make_id()
    mp = Conversation(
        id=mp_id, type=ConversationType.DIRECT,
        created_by=users["marcuschen"].id, created_at=dt(days=7),
    )
    db.add(mp)
    convos["marcus_priya"] = mp
    for username in ("marcuschen", "priyasharma"):
        db.add(ConversationMember(
            conversation_id=mp_id, user_id=users[username].id,
            joined_at=dt(days=7),
        ))

    # --- Direct: Amara <-> Lukas ---
    al_id = make_id()
    al = Conversation(
        id=al_id, type=ConversationType.DIRECT,
        created_by=users["amaraokafor"].id, created_at=dt(days=6),
    )
    db.add(al)
    convos["amara_lukas"] = al
    for username in ("amaraokafor", "lukasweber"):
        db.add(ConversationMember(
            conversation_id=al_id, user_id=users[username].id,
            joined_at=dt(days=6),
        ))

    # --- Direct: Yuki <-> Sofia ---
    ys_id = make_id()
    ys = Conversation(
        id=ys_id, type=ConversationType.DIRECT,
        created_by=users["yukitanaka"].id, created_at=dt(days=4),
    )
    db.add(ys)
    convos["yuki_sofia"] = ys
    for username in ("yukitanaka", "sofiarodriguez"):
        db.add(ConversationMember(
            conversation_id=ys_id, user_id=users[username].id,
            joined_at=dt(days=4),
        ))

    await db.commit()
    return convos


async def create_messages(db: AsyncSession, users: dict[str, User], convos: dict[str, Conversation]):
    u = users
    msg_ids: dict[str, str] = {}

    def mid(key: str) -> str:
        if key not in msg_ids:
            msg_ids[key] = make_id()
        return msg_ids[key]

    # --- Dev Team messages (ordered oldest to newest) ---
    dev_msgs = [
        ("marcuschen", dt(5.8), "Hey team, pushed the initial API PR. Can someone review?"),
        ("lukasweber", dt(5.7), "Nice! I'll take a look after standup."),
        ("priyasharma", dt(5.6), "The frontend auth flow is ready too, PR incoming."),
        ("amaraokafor", dt(5.5), "Great progress everyone! Should we set up CI next?"),
        ("marcuschen", dt(4.0), "CI is configured. Tests are passing."),
        ("lukasweber", dt(3.9), "Deployment pipeline is green on staging."),
        ("priyasharma", dt(3.8), "Can we add a health check endpoint?"),
        ("amaraokafor", dt(3.7), "Good call. I'll add one to the API gateway."),
        ("marcuschen", dt(2.0), "Design system colors are looking clean on the PR preview"),
        ("priyasharma", dt(1.9), "Thanks! Used the Signal-inspired palette"),
        ("lukasweber", dt(1.8), "Auto-deploy to staging works now"),
        ("amaraokafor", dt(1.7), "Sweet, let's aim for a beta release Friday"),
    ]
    for sender_key, ts, content in dev_msgs:
        db.add(Message(
            id=mid(f"dev_{ts.timestamp()}"),
            conversation_id=convos["dev"].id,
            sender_id=u[sender_key].id,
            content=content,
            created_at=ts, updated_at=ts,
        ))

    # --- Design Crit messages ---
    design_msgs = [
        ("priyasharma", dt(4.8), "Shared the new wireframes in Figma, feedback please!"),
        ("sofiarodriguez", dt(4.7), "Love the message bubble redesign. Very clean."),
        ("yukitanaka", dt(4.6), "The onboarding flow needs more spacing. I'll share references."),
        ("yukitanaka", dt(2.8), "Here are the usability findings from this week's testing"),
        ("sofiarodriguez", dt(2.7), "The navigation structure tested well. Minor issues with settings."),
        ("priyasharma", dt(2.6), "Great data! Let's iterate on the search feature next."),
        ("sofiarodriguez", dt(1.0), "Compiled the research notes. Link in thread."),
        ("priyasharma", dt(0.9), "Perfect, this is super helpful for the next sprint."),
    ]
    for sender_key, ts, content in design_msgs:
        db.add(Message(
            id=mid(f"design_{ts.timestamp()}"),
            conversation_id=convos["design"].id,
            sender_id=u[sender_key].id,
            content=content,
            created_at=ts, updated_at=ts,
        ))

    # --- Marcus <-> Priya direct ---
    mp_msgs = [
        ("marcuschen", dt(6.8), "Hey Priya! Got the invite, excited to work on this."),
        ("priyasharma", dt(6.7), "Hey Marcus! Welcome aboard. Check out the Figma when you get a chance."),
        ("marcuschen", dt(4.5), "The component library is coming along. Using shadcn/ui as base."),
        ("priyasharma", dt(4.4), "Awesome! Let me know if you need any design tokens."),
        ("marcuschen", dt(4.3), "Actually, yes — the color variables for dark mode?"),
        ("priyasharma", dt(4.2), "I'll export them from Figma today."),
        ("marcuschen", dt(2.5), "Colors landed. The dark theme looks amazing."),
        ("priyasharma", dt(2.4), "The real-time sync is working! This is going to be sweet."),
    ]
    for sender_key, ts, content in mp_msgs:
        db.add(Message(
            id=mid(f"mp_{ts.timestamp()}"),
            conversation_id=convos["marcus_priya"].id,
            sender_id=u[sender_key].id,
            content=content,
            created_at=ts, updated_at=ts,
        ))

    # --- Amara <-> Lukas direct ---
    al_msgs = [
        ("lukasweber", dt(5.8), "Hey Amara! Need help setting up the data pipeline?"),
        ("amaraokafor", dt(5.7), "Hey! Yes, the real-time metrics stream. Got a sec?"),
        ("lukasweber", dt(3.8), "Drafted the WebSocket architecture. Here's the doc."),
        ("amaraokafor", dt(3.7), "Looks solid. We'll need to handle reconnection gracefully."),
        ("lukasweber", dt(3.6), "Good point. Added exponential backoff."),
        ("amaraokafor", dt(3.5), "Perfect. Also — monitoring? Grafana dashboard?"),
        ("lukasweber", dt(3.4), "On my list! I'll set it up this weekend."),
        ("amaraokafor", dt(1.5), "Dashboard is live. Check it out: http://localhost:3000/metrics"),
        ("lukasweber", dt(1.4), "Looking good! Alert thresholds configured too."),
        ("amaraokafor", dt(1.3), "Let's demo this to the team on Monday."),
    ]
    for sender_key, ts, content in al_msgs:
        db.add(Message(
            id=mid(f"al_{ts.timestamp()}"),
            conversation_id=convos["amara_lukas"].id,
            sender_id=u[sender_key].id,
            content=content,
            created_at=ts, updated_at=ts,
        ))

    # --- Yuki <-> Sofia direct ---
    ys_msgs = [
        ("yukitanaka", dt(3.8), "Sofia! The user testing sessions are booked."),
        ("sofiarodriguez", dt(3.7), "Awesome! When do we start?"),
        ("sofiarodriguez", dt(1.8), "First session done. Great insights on the chat UI."),
        ("yukitanaka", dt(1.7), "Can't wait to see the results. The recording link?"),
        ("sofiarodriguez", dt(1.6), "Sending it over. Participants loved the speed."),
        ("yukitanaka", dt(1.5), "That WebSocket implementation paying off!"),
        ("sofiarodriguez", dt(1.4), "Right? Real-time is the killer feature."),
    ]
    for sender_key, ts, content in ys_msgs:
        db.add(Message(
            id=mid(f"ys_{ts.timestamp()}"),
            conversation_id=convos["yuki_sofia"].id,
            sender_id=u[sender_key].id,
            content=content,
            created_at=ts, updated_at=ts,
        ))

    await db.commit()
    return msg_ids


async def create_message_statuses(
    db: AsyncSession, users: dict[str, User], convos: dict[str, Conversation],
):
    conv_to_members = {
        convos["dev"].id: ["marcuschen", "priyasharma", "lukasweber", "amaraokafor"],
        convos["design"].id: ["priyasharma", "sofiarodriguez", "yukitanaka"],
        convos["marcus_priya"].id: ["marcuschen", "priyasharma"],
        convos["amara_lukas"].id: ["amaraokafor", "lukasweber"],
        convos["yuki_sofia"].id: ["yukitanaka", "sofiarodriguez"],
    }

    result = await db.execute(select(Message))
    messages = result.scalars().all()

    for msg in messages:
        member_keys = conv_to_members.get(msg.conversation_id, [])

        for member_key in member_keys:
            member = users[member_key]
            if member.id == msg.sender_id:
                continue

            age = (now() - msg.created_at).total_seconds()
            if age < 3600:
                status_val = MessageStatusValue.SENT
            elif age < 7200:
                status_val = MessageStatusValue.DELIVERED
            else:
                status_val = MessageStatusValue.READ

            db.add(MessageStatus(
                message_id=msg.id,
                user_id=member.id,
                status=status_val,
                updated_at=msg.created_at + datetime.timedelta(seconds=age * 0.5),
            ))

    await db.commit()


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        existing = await db.execute(select(User).limit(1))
        if existing.scalar_one_or_none():
            print("Database already seeded. Skipping.")
            return

        print("Creating users...")
        users = await create_users(db)

        print("Creating contacts...")
        await create_contacts(db, users)

        print("Creating conversations...")
        convos = await create_conversations(db, users)

        print("Creating messages...")
        await create_messages(db, users, convos)

        print("Creating message statuses...")
        await create_message_statuses(db, users, convos)

        print(f"Seeded {len(users)} users, {len(convos)} conversations.")


if __name__ == "__main__":
    asyncio.run(seed())
