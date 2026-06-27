# Whispr 🔒

A full-stack messaging application inspired by Signal, built with Next.js 16 and FastAPI.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)
![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?logo=tailwind-css)

---

## Features

- **Phone + OTP auth** (OTP mocked as `123456` for demo)
- **Direct & group conversations** with auto-detect existing direct pairs
- **Real-time messaging** via WebSocket with per-conversation fan-out
- **Typing indicators** — see when someone is typing
- **Online/offline presence** — live green dot next to active users
- **Message status** — sent ✓ / delivered ✓✓ / read ✓✓ (teal)
- **Reply to messages** — tap any message to reply, tap reply to scroll to original
- **Group management** — admin controls, add/remove members, editable name & avatar
- **End-to-end encryption banner** — Signal-style notification (UI only)
- **Dark theme** — Signal-inspired color palette
- **Responsive** — mobile-first with sidebar toggle
- **Settings** — profile edit, avatar upload, dark/light toggle
- **Notifications** — in-app toast system + conversation banners

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 |
| UI Components | shadcn/ui, Radix UI, Lucide Icons |
| State | Zustand (persisted to localStorage) |
| HTTP | Axios with JWT interceptor |
| Real-time | Native WebSocket with auto-reconnect |
| Backend | FastAPI, Python 3.11+ |
| ORM | SQLAlchemy 2.0 (async) |
| Database | SQLite via aiosqlite |
| Auth | python-jose (JWT), passlib (bcrypt) |
| Migrations | Alembic |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Browser                          │
│  ┌──────────┐    ┌──────────┐    ┌────────────┐  │
│  │ Next.js  │    │ Zustand  │    │ WhisprSocket│  │
│  │ Pages    │◄──►│ Stores   │◄──►│ (WS client) │  │
│  └────┬─────┘    └──────────┘    └──────┬───────┘  │
│       │ HTTP (Axios)                     │ WS       │
└───────┼──────────────────────────────────┼──────────┘
        │                                  │
┌───────┴──────────────────────────────────┴──────────┐
│                 FastAPI Server                        │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ REST API │  │ WebSocket    │  │ ConnectionMgr   │ │
│  │ Routers  │◄─┤ /ws          │◄─┤ (fan-out,       │ │
│  │          │  │ ?token=jwt   │  │  online track)  │ │
│  └────┬─────┘  └──────────────┘  └────────────────┘ │
│       │                                               │
│  ┌────┴──────────────────────────────────────────┐    │
│  │         SQLAlchemy 2.0 (async)                 │    │
│  │              SQLite                            │    │
│  └─────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
```

### WebSocket Flow

```
1. Client connects:  ws://host:8000/ws?token={JWT}
2. Server verifies JWT, extracts user_id, marks user online
3. Client sends:     {"type": "subscribe", "conversation_id": "..."}
4. Server fans out messages to all subscribed users in a conversation
5. Typing events broadcast to other conversation members only
6. On disconnect: marks user offline, notifies conversation partners
7. Auto-reconnect: exponential backoff (1s → 2s → 4s → max 30s)
8. Heartbeat ping every 25s keeps connection alive
```

---

## Database Schema

```
┌─────────────────────┐       ┌──────────────────────────┐
│       users          │       │    conversations           │
│─────────────────────│       │──────────────────────────│
│ id (PK, UUID)       │       │ id (PK, UUID)             │
│ phone (UNIQUE)      │       │ type: direct | group      │
│ display_name        │       │ name (nullable)           │
│ avatar_url          │       │ avatar_url (nullable)     │
│ bio                 │       │ created_by (FK→users)     │
│ is_online           │       │ created_at                │
│ last_seen           │       └────────────┬─────────────┘
│ hashed_password     │                    │
│ created_at          │       ┌────────────┴─────────────┐
└──────────┬──────────┘       │  conversation_members      │
           │                  │──────────────────────────│
           │                  │ conversation_id (FK)      │
           │                  │ user_id (FK)              │
           │                  │ role: admin | member      │
           │                  │ joined_at                 │
           │                  │ last_read_at              │
           │                  └────────────┬─────────────┘
           │                               │
┌──────────┴──────────┐       ┌────────────┴─────────────┐
│      messages        │       │    message_status         │
│─────────────────────│       │──────────────────────────│
│ id (PK, UUID)       │       │ message_id (FK)          │
│ conversation_id (FK)│       │ user_id (FK)             │
│ sender_id (FK)      │       │ status: sent|delivered|read│
│ content (TEXT)      │       │ updated_at               │
│ type: text|image|   │       └──────────────────────────┘
│        file|system   │
│ reply_to_id (FK)    │
│ is_deleted          │
│ created_at          │
│ updated_at          │
└─────────────────────┘
```

---

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register` | Register with phone + OTP | No |
| POST | `/api/auth/login` | Login with phone + OTP | No |
| POST | `/api/auth/logout` | Logout | Yes |
| GET | `/api/users/me` | Get current user | Yes |
| PUT | `/api/users/me` | Update display_name, bio | Yes |
| PUT | `/api/users/me/avatar` | Upload avatar (multipart) | Yes |
| GET | `/api/users/search?q=` | Search users | Yes |
| GET | `/api/users/{id}` | Get user public profile | Yes |
| GET | `/api/conversations/` | List user's conversations | Yes |
| POST | `/api/conversations/` | Create direct or group chat | Yes |
| GET | `/api/conversations/{id}` | Conversation detail with members | Yes |
| PUT | `/api/conversations/{id}` | Update name/avatar (admin) | Yes |
| POST | `/api/conversations/{id}/members` | Add members (admin) | Yes |
| DELETE | `/api/conversations/{id}/members/{uid}` | Remove member / self-exit | Yes |
| GET | `/api/chats/{id}/messages?limit=&before=` | Paginated messages | Yes |
| POST | `/api/chats/{id}/messages` | Send message | Yes |
| PUT | `/api/chats/{id}/read` | Mark conversation as read | Yes |
| PUT | `/api/chats/messages/{id}/status` | Update message status | Yes |
| WS | `/ws?token={jwt}` | WebSocket (messaging, typing, presence) | Token |

---

## Local Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- pip

### Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Seed demo data
python -c "import sys; sys.path.insert(0, '.'); from seed import seed; import asyncio; asyncio.run(seed())"

# Start server
python -m uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with any seed phone + OTP `123456`.

### Seed Accounts

| Phone | Name | OTP |
|-------|------|-----|
| +919876543210 | Alex Chen | 123456 |
| +919876543211 | Priya Sharma | 123456 |
| +919876543212 | Marcus Williams | 123456 |
| +919876543213 | Sofia Rodriguez | 123456 |
| +919876543214 | James Park | 123456 |
| +919876543215 | Aisha Patel | 123456 |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `whispr-dev-secret` | Secret key for JWT tokens |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api` | Backend API URL |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8000/ws` | WebSocket URL |

---

## Deployment

### Frontend (Vercel)

1. Push frontend to a GitHub repo
2. Import into Vercel
3. Set env vars: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`
4. Deploy

### Backend (Render)

1. Push backend to a GitHub repo
2. Create a new Web Service on Render
3. Set:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Env Var**: `JWT_SECRET` (auto-generated)
4. Deploy and update CORS origins in `main.py`

---

## Assumptions & Known Limitations

- **OTP is mocked**: All users use `123456`. No real SMS sent.
- **SQLite**: Not suitable for production-scale. Swap to PostgreSQL via SQLAlchemy URL change.
- **File uploads**: Stored locally on disk. For production, use S3/Cloudinary.
- **No push notifications**: Requires Firebase / APNs integration.
- **No end-to-end encryption**: The encryption banner is cosmetic. Real e2ee would need the Web Crypto API and key exchange.
- **Single-server WebSocket**: Doesn't scale horizontally without a pub/sub layer (Redis).
- **No message search**: Full-text search is not implemented.
- **No message deletion**: Only soft-delete (is_deleted flag) is supported.
- **No media gallery**: Image/file messages are text-only with type stub.

---

## License

MIT
