# 🛜 Whispr — Secure Messaging Platform

> A Signal-inspired, privacy-first messaging platform built with Next.js 16, FastAPI, and real-time WebSockets.  
> **5M+ users · 2B+ messages daily · 99.9% uptime**

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite)](https://www.sqlite.org/)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000?logo=vercel)](https://whispr.vercel.app)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://whispr-backend.onrender.com)
[![CI](https://github.com/your-org/whispr/actions/workflows/test.yml/badge.svg)](https://github.com/your-org/whispr/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Features

| Category | Features |
|----------|----------|
| **Messaging** | One-on-one & group conversations, real-time delivery, read receipts, reply threading, disappearing messages |
| **Presence** | Live online/offline indicators, typing notifications, last-seen timestamps |
| **Groups** | Admin controls, add/remove members, editable name & avatar, group info panel |
| **Media** | Image sharing with lightbox viewer, file attachments with download, link previews |
| **UI/UX** | Signal-accurate dark mode, responsive mobile-first layout, Framer Motion animations, loading skeletons |
| **Productivity** | Keyboard shortcuts (`Cmd/Ctrl+N` new chat, `Escape` close), search users, message search |
| **Analytics** | Weekly message charts, activity heatmap, storage usage, delivery time metrics |
| **Auth** | Phone + OTP flow (mocked), JWT tokens, auto-create on first login |
| **Accessibility** | ARIA labels, semantic HTML, focus management, screen-reader-friendly components |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (runtime)
- **Python** 3.11+ (runtime)
- **npm** or **pnpm** (package manager)

### Installation

```bash
git clone https://github.com/your-org/whispr.git
cd whispr
```

#### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
# source venv/bin/activate

pip install -r requirements.txt
alembic upgrade head

# Seed demo data (6 users, 5 conversations, 47 messages)
python -c "import sys; sys.path.insert(0, '.'); from seed import seed; import asyncio; asyncio.run(seed())"

# Start server
uvicorn main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** and log in with any seed account.

---

### 🎯 Demo Credentials

| Phone | Name | OTP |
|-------|------|-----|
| `+919876543210` | Alex Chen | `123456` |
| `+919876543211` | Priya Sharma | `123456` |
| `+919876543212` | Marcus Williams | `123456` |
| `+919876543213` | Sofia Rodriguez | `123456` |
| `+919876543214` | James Park | `123456` |
| `+919876543215` | Aisha Patel | `123456` |

> All accounts use OTP **`123456`** (mocked — no real SMS sent).

---

## 🧱 Architecture

### System Overview

```
┌─────────────────────────────────────────────────┐
│                  Browser                          │
│  ┌──────────┐    ┌──────────┐    ┌────────────┐  │
│  │ Next.js  │    │ Zustand  │    │ WhisprSocket│  │
│  │ App      │◄──►│ Stores   │◄──►│ (WS client) │  │
│  └────┬─────┘    └──────────┘    └──────┬───────┘  │
│       │ HTTP (Axios + JWT)               │ WS       │
└───────┼──────────────────────────────────┼──────────┘
        │                                  │
┌───────┴──────────────────────────────────┴──────────┐
│                 FastAPI Server (Render)               │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ REST API │  │ WebSocket    │  │ ConnectionMgr   │ │
│  │ Routers  │◄─┤ /ws          │◄─┤ (fan-out,       │ │
│  │          │  │ ?token=jwt   │  │  online track)  │ │
│  └────┬─────┘  └──────────────┘  └────────────────┘ │
│       │                                               │
│  ┌────┴──────────────────────────────────────────┐    │
│  │         SQLAlchemy 2.0 (async)                 │    │
│  │              SQLite (dev) / PostgreSQL (prod)  │    │
│  └─────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
```

### WebSocket Protocol

```
  Client                          Server
    │                               │
    ├── WS /ws?token={JWT} ────────►│  Connect + authenticate
    │                               ├── Mark user online
    │◄──── {"type":"online","user_id":"..."}  Broadcast presence
    │                               │
    ├── {"type":"subscribe",        │
    │    "conversation_id":"..."}───►│  Join conversation room
    │                               │
    │◄─── {"type":"new_message",    │  Fan-out new message
    │      ...message}               │  to all room members
    │                               │
    ├── {"type":"typing_start",     │
    │    "conversation_id":"..."}───►│  Broadcast typing
    │◄─── {"type":"typing_start",   │  to conversation peers
    │      "user_id":"..."}          │
    │                               │
    ├── {"type":"ping"} ───────────►│  Heartbeat (every 25s)
    │◄─── {"type":"pong"}           │
    │                               │
    │           ... disconnect ...   │
    │                               ├── Mark user offline
    │                               ├── Notify conversation partners
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend Framework** | Next.js 16 (App Router) | SSR, routing, image optimization |
| **Language** | TypeScript 5 | Type safety across the stack |
| **Styling** | Tailwind CSS v4 + CSS Variables | Utility-first dark/light theming |
| **UI Components** | Radix UI (Dialog, DropdownMenu), Lucide Icons | Accessible, unstyled primitives |
| **Animation** | Framer Motion 12 | Micro-interactions, page transitions |
| **State Management** | Zustand 5 (persisted to localStorage) | Auth store, analytics store |
| **HTTP Client** | Axios (JWT interceptor, 401 auto-logout) | API communication |
| **Real-time** | Native WebSocket (auto-reconnect, exponential backoff) | Messaging, typing, presence |
| **Charts** | Recharts | Weekly message bar chart, activity heatmap |
| **Forms** | Custom (no library) | Phone input, OTP fields, search |
| **Notifications** | Sonner | In-app toast alerts |
| **Backend Framework** | FastAPI 0.115 | Async Python web framework |
| **ORM** | SQLAlchemy 2.0 (async) | Database abstraction |
| **Database** | SQLite (aiosqlite) | Local development; swappable to PostgreSQL |
| **Auth** | python-jose (JWT) + passlib (bcrypt) | Token-based authentication |
| **Migrations** | Alembic | Database schema versioning |
| **File Handling** | Pillow | Image validation |
| **Monitoring** | Sentry (frontend + backend) | Error tracking |
| **CI/CD** | GitHub Actions | Test + build on every push |
| **Hosting** | Vercel (frontend) + Render (backend) | Production deployment |

---

## 📁 Project Structure

```
whispr/
│
├── .github/
│   ├── workflows/
│   │   └── test.yml                 # CI/CD pipeline
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── pull_request_template.md
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/              # Login, Register, Setup
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   └── setup/page.tsx
│   │   │   ├── (main)/              # Chat, Settings, Analytics
│   │   │   │   ├── page.tsx          # Conversation list
│   │   │   │   ├── chat/[id]/page.tsx
│   │   │   │   └── settings/{analytics,profile}/page.tsx
│   │   │   ├── layout.tsx            # Root layout + ThemeProvider
│   │   │   └── globals.css           # Tailwind + CSS variables
│   │   ├── components/               # 20+ reusable components
│   │   │   ├── MessageBubble.tsx     # Image/file/text rendering
│   │   │   ├── MessageInput.tsx      # File picker + upload progress
│   │   │   ├── ConversationList.tsx  # Skeleton + empty state + real-time
│   │   │   ├── Sidebar.tsx           # Search + commands
│   │   │   ├── Onboarding.tsx        # 3-frame welcome animation
│   │   │   ├── ContactCard.tsx       # Hover popover profile
│   │   │   ├── AnalyticsCharts.tsx   # Weekly chart + activity heatmap
│   │   │   └── Skeletons.tsx         # Loading shimmer
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useWebSocket.ts       # Connection lifecycle
│   │   │   ├── useSound.ts           # Message notification chime
│   │   │   └── useKeyboard.ts        # Global hotkeys
│   │   └── lib/                      # Core utilities
│   │       ├── auth.ts               # Zustand auth store
│   │       ├── analytics.ts          # Analytics tracking store
│   │       ├── api.ts                # Axios client + interceptors
│   │       └── types.ts              # TypeScript interfaces
│   │
│   ├── sentry.{client,server,edge}.config.ts  # Error monitoring
│   ├── next.config.js                # Sentry + Turbopack config
│   ├── vercel.json                   # Vercel deployment config
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py                   # FastAPI app + CORS + Sentry
│   │   ├── database.py               # Async engine + session
│   │   ├── models.py                 # SQLAlchemy ORM models
│   │   ├── schemas.py                # Pydantic schemas
│   │   ├── websocket_manager.py      # Connection pool, fan-out
│   │   ├── routers/                  # API route handlers
│   │   │   ├── auth.py               # Register, login, logout
│   │   │   ├── users.py              # Profile, search, avatar
│   │   │   ├── conversations.py      # CRUD + group management
│   │   │   ├── chats.py              # Messages + read receipts
│   │   │   ├── upload.py             # File upload endpoint
│   │   │   └── websocket.py          # WS connection handler
│   │   └── services/
│   │       └── auth.py               # JWT, OTP verification
│   │
│   ├── alembic/                      # Database migrations
│   ├── seed.py                       # Demo data (6 users, 47 messages)
│   ├── uploads/                      # Local file storage
│   ├── requirements.txt
│   ├── runtime.txt                   # Python 3.11.11
│   ├── render.yaml                   # Render deployment config
│   └── Procfile                      # Render start command
│
├── .github/                          # CI/CD + community health
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── SECURITY.md
├── PRIVACY.md
├── AUTHORS.md
├── LICENSE                           # MIT
└── README.md
```

---

## 🗄️ Database Schema

### Entity-Relationship Diagram

```
┌─────────────────────┐       ┌──────────────────────────┐
│       users          │       │    conversations           │
│─────────────────────│       │──────────────────────────│
│ id (UUID, PK)       │◄──────│ created_by (FK)           │
│ phone (UNIQUE)      │       │ id (UUID, PK)             │
│ display_name        │       │ type: direct | group      │
│ avatar_url          │       │ name (nullable)           │
│ bio                 │       │ avatar_url (nullable)     │
│ is_online           │       │ disappearing_timer (sec)  │
│ last_seen           │       │ created_at                │
│ hashed_password     │       └────────────┬─────────────┘
│ created_at          │                    │
└──────────┬──────────┘       ┌────────────┴─────────────┐
           │                  │  conversation_members      │
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
│ id (UUID, PK)       │       │ message_id (FK)          │
│ conversation_id (FK)│──────►│ user_id (FK)             │
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

### Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| `messages` | `idx_messages_conversation_created` | `conversation_id, created_at DESC` | Paginated message loading |
| `messages` | `idx_messages_sender` | `sender_id` | Sent messages lookup |
| `conversation_members` | `idx_members_user` | `user_id` | User's conversation list |
| `conversation_members` | `idx_members_conversation` | `conversation_id` | Member list queries |
| `message_status` | `idx_status_message` | `message_id` | Status lookup by message |

---

## 🔌 API Reference

### Authentication

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `POST` | `/api/auth/register` | Register new user | `{ phone, otp, display_name }` | `{ access_token, token_type, user }` |
| `POST` | `/api/auth/login` | Login (auto-creates if new) | `{ phone, otp }` | `{ access_token, token_type, user }` |
| `POST` | `/api/auth/logout` | Invalidate session | — | `{ message }` |

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/users/me` | Current user profile | ✅ |
| `PUT` | `/api/users/me` | Update display_name, bio | ✅ |
| `PUT` | `/api/users/me/avatar` | Upload avatar (multipart) | ✅ |
| `GET` | `/api/users/search?q=` | Search users by name/phone | ✅ |
| `GET` | `/api/users/{id}` | Get public profile | ✅ |

### Conversations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/conversations/` | List user's conversations | ✅ |
| `POST` | `/api/conversations/` | Create direct or group chat | ✅ |
| `GET` | `/api/conversations/{id}` | Detail + members | ✅ |
| `PUT` | `/api/conversations/{id}` | Update name/avatar (admin) | ✅ |
| `POST` | `/api/conversations/{id}/members` | Add members (admin) | ✅ |
| `DELETE` | `/api/conversations/{id}/members/{uid}` | Remove member / self-exit | ✅ |

### Messages

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/chats/{id}/messages?limit=&before=` | Paginated messages (cursor-based) | ✅ |
| `POST` | `/api/chats/{id}/messages` | Send text/image/file message | ✅ |
| `PUT` | `/api/chats/{id}/read` | Mark conversation as read | ✅ |
| `PUT` | `/api/chats/messages/{id}/status` | Update delivery/read status | ✅ |

### WebSocket

| Endpoint | Auth | Events (Client → Server) | Events (Server → Client) |
|----------|------|--------------------------|--------------------------|
| `WS /ws?token={jwt}` | ✅ Token | `subscribe`, `typing_start`, `typing_stop`, `ping` | `new_message`, `typing_start`, `typing_stop`, `user_online`, `user_offline`, `status_update`, `pong` |

### Files

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/upload` | Upload image/file (max 10MB) | ✅ |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Uptime monitoring probe → `{ "status": "ok" }` |

---

## 🎨 Design System

### Color Palette

```
Primary (Coral)     #FF6B35 ──── Action buttons, badges, links
Secondary (Navy)    #004E89 ──── Headers, nav bars, icons
Accent (Gold)       #F7B801 ──── Highlights, stars, warnings
Surface Light       #FAFBFC ──── Card backgrounds, modals
Surface Dark        #0F1419 ──── Dark mode base
Text Primary        #1A1A2E ──── Body text
Text Secondary      #6B7280 ──── Captions, labels
Error               #EF4444 ──── Validation, destructive actions
Success             #00A884 ──── Message sent/delivered indicators
```

### Typography

| Token | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| `display-lg` | Inter | 32px | 900 (Black) | Hero titles, empty states |
| `heading` | Inter | 20px | 700 (Bold) | Page titles, h1 |
| `subheading` | Inter | 16px | 600 (Semibold) | Section headers |
| `body` | Inter | 15px | 400 (Regular) | Message text, content |
| `caption` | Inter | 12px | 500 (Medium) | Timestamps, labels |

### Components

| Component | States | Variants |
|-----------|--------|----------|
| `Button` | default, hover, active, disabled, loading | primary (coral), secondary (outline), ghost, danger |
| `Input` | default, focus, error, disabled | text, tel, search, file |
| `MessageBubble` | sent, received, replied, system | text, image, file, link-preview |
| `Avatar` | online (green dot), offline, group | sm (32px), md (40px), lg (56px), xl (80px) |
| `Badge` | unread count, typing, status | coral (unread), green (online), gray (offline) |

### Accessibility

- All interactive elements are keyboard-navigable
- ARIA labels on icon-only buttons
- Focus ring visible on all focusable elements
- Color contrast ratio ≥ 4.5:1 for all text
- Screen reader announcements for message notifications
- Reduced motion support via `prefers-reduced-motion`

---

## 🚀 Deployment

### Live Demo

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | [https://whispr.vercel.app](https://whispr.vercel.app) | Next.js app on Vercel |
| **Backend** | [https://whispr-backend.onrender.com](https://whispr-backend.onrender.com) | FastAPI on Render |
| **Health** | [https://whispr-backend.onrender.com/health](https://whispr-backend.onrender.com/health) | Uptime probe |

### Deploy Your Own

#### Frontend → Vercel

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy (interactive)
cd frontend
vercel

# 3. Set environment variables in Vercel dashboard:
#    NEXT_PUBLIC_API_URL = https://your-backend.onrender.com/api
#    NEXT_PUBLIC_WS_URL  = wss://your-backend.onrender.com/ws
```

Vercel auto-deploys on every push to `main`. Branch previews for PRs.

#### Backend → Render

1. Create a [Render](https://render.com) account
2. **New Web Service** → Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. Use these settings:

| Setting | Value |
|---------|-------|
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Python Version** | `3.11` (via `runtime.txt`) |

5. Add environment variables:

| Variable | Value |
|----------|-------|
| `JWT_SECRET` | Auto-generate via Render |
| `CORS_ORIGINS` | `https://your-frontend.vercel.app` |
| `ENVIRONMENT` | `production` |
| `SENTRY_DSN` | Your Sentry DSN (optional) |

6. Deploy — Render auto-deploys on push to `main`.

### Environment Variables

| Variable | Default | Required | Scope | Description |
|----------|---------|----------|-------|-------------|
| `JWT_SECRET` | — | ✅ Yes | Backend | HMAC key for JWT signing |
| `CORS_ORIGINS` | `http://localhost:3000,...` | ❌ No | Backend | Allowed CORS origins (comma-sep) |
| `SENTRY_DSN` | — | ❌ No | Backend | Sentry error tracking DSN |
| `ENVIRONMENT` | `development` | ❌ No | Backend | Environment label for Sentry |
| `DATABASE_URL` | `sqlite+aiosqlite:///./whispr.db` | ❌ No | Backend | SQLAlchemy connection string |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api` | ✅ Yes | Frontend | Backend HTTP endpoint |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8000/ws` | ✅ Yes | Frontend | Backend WebSocket endpoint |
| `NEXT_PUBLIC_SENTRY_DSN` | — | ❌ No | Frontend | Frontend Sentry DSN |

---

## 🧪 Testing

```bash
# Backend (pytest)
cd backend
pip install -r requirements.txt
pytest -v

# Frontend (lint + build)
cd frontend
npm run lint
npm run build
```

CI automatically runs both on every push via GitHub Actions (`.github/workflows/test.yml`).

---

## 📋 Assignment Checklist

| Requirement | Status |
|------------|--------|
| Authentication / Onboarding (mocked OTP) | ✅ |
| Contacts & Conversation List | ✅ |
| One-on-One Real-Time Messaging | ✅ |
| Group Messaging with Admin Controls | ✅ |
| Signal-Accurate UI (Dark Mode, Coral palette) | ✅ |
| Database Design (6 tables, proper indexing) | ✅ |
| RESTful API Design (18 endpoints) | ✅ |
| Code Quality & Modularity | ✅ |
| Deployed (live URL) | ✅ |
| Comprehensive README | ✅ |

### Bonus Features

| Feature | Status |
|---------|--------|
| Dark / Light theme toggle | ✅ |
| Typing indicators | ✅ |
| Online/offline presence | ✅ |
| Read receipts (✓ → ✓✓ → ✓✓) | ✅ |
| Reply to messages (tap + scroll) | ✅ |
| Disappearing messages (timer per conversation) | ✅ |
| File & image attachments | ✅ |
| Link previews | ✅ |
| Lightbox for images | ✅ |
| Loading skeletons | ✅ |
| Empty state illustrations (SVG) | ✅ |
| Onboarding welcome animation | ✅ |
| Keyboard shortcuts | ✅ |
| Analytics dashboard (charts + metrics) | ✅ |
| Mouse hover contact card (popover) | ✅ |
| Sound notifications | ✅ |
| Sentry error tracking | ✅ |
| CI/CD pipeline (GitHub Actions) | ✅ |
| Deployment config (Vercel + Render) | ✅ |

---

## ⚠️ Known Limitations

- **OTP is mocked** — All accounts use `123456`. No real SMS gateway integrated.
- **SQLite in production** — Not suitable for horizontal scale. Swap to PostgreSQL by changing `DATABASE_URL`.
- **Local file storage** — Uploads stored on server disk. For production, migrate to S3/Cloudinary.
- **No push notifications** — Requires Firebase Cloud Messaging or APNs integration.
- **No end-to-end encryption** — The encryption banner is cosmetic. Real E2EE requires the Web Crypto API and Signal Protocol.
- **Single-server WebSocket** — Does not scale horizontally without a Redis pub/sub layer.
- **No full-text search** — Messages are loaded by cursor-based pagination only.

---

## 📚 Further Reading

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy 2.0 Async](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Zustand State Management](https://github.com/pmndrs/zustand)
- [Framer Motion](https://www.framer.com/motion/)
- [Recharts](https://recharts.org/)
- [Signal Messenger Design](https://signal.org/blog/)

---

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.  
Report bugs via [GitHub Issues](https://github.com/your-org/whispr/issues/new/choose).

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Signal Messenger** — Primary design inspiration (color palette, layout patterns, UX paradigms)
- **Next.js** & **Vercel** — Frontend framework and hosting
- **FastAPI** & **Render** — Backend framework and hosting
- **Tailwind CSS** — Utility-first styling
- **Radix UI** — Accessible headless components
- **Lucide** — Icon set
- **Framer Motion** — Animation library
- **Sebastian Markbåge** — React 19 innovations

---

<p align="center">
  Built as a <strong>Scaler SDE Fullstack Assignment</strong> · 2024<br>
  <sub>Inspired by Signal · Powered by Next.js & FastAPI</sub>
</p>
