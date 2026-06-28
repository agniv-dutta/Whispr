# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2024-12-15

### Added

#### Core Messaging
- One-on-one and group conversations with real-time message delivery
- WebSocket-based messaging with per-conversation fan-out
- Message status tracking: sent ✓ / delivered ✓✓ / read ✓✓ (teal)
- Reply to messages — tap any message to reply; tap reply bubble to scroll to original with flash highlight
- Disappearing messages — configurable timer per conversation (30s, 1m, 1h, 1d, 1w)
- Image sharing with lightbox viewer (click to open, close + download)
- File attachments with type icons, filename truncation, and formatted size
- Link previews — URL extraction and metadata card

#### User Experience
- Phone + OTP authentication flow (OTP mocked as `123456`)
- Auto-create user on first login
- 3-frame onboarding animation (Framer Motion) with localStorage gate
- Signal-accurate dark theme with CSS variables and next-themes
- Dark/light theme toggle in Settings
- Typing indicators — live "typing..." below group/chat names
- Online/offline presence — pulsing green dot next to active users
- Reply indicator in MessageInput with quoted preview
- Loading skeletons (react-loading-skeleton) for conversations and messages
- Empty state SVG illustrations (NoConversations, NoMessages)
- Toast notifications (sonner) on all key actions with coral/red styling

#### Contact Management
- User search by name or phone
- Direct conversation creation with auto-detect existing pairs
- Group creation with name, member selection, avatar upload
- Contact card popover on sender name hover — shows bio, phone, online status, last seen

#### Settings & Analytics
- Settings page with profile card, privacy, notifications, and appearance sections
- Analytics dashboard (`/settings/analytics`):
  - Messages sent (total + weekly count)
  - Active days this week
  - Average message delivery time (last 100 messages)
  - Estimated storage usage (MB)
  - Login count
  - Top search queries (pill list)
  - Weekly bar chart (Recharts)
  - Activity heatmap (24-hour grid)
  - Clear cache button

#### Keyboard Shortcuts
- `Cmd/Ctrl+N` — New conversation
- `Escape` — Close modal / deselect

#### Notifications & Sound
- Sound notification on incoming messages (useSound hook, `/sounds/message.mp3`)
- In-app toast alerts for send success, errors, group events

#### Disappearing Messages
- Timer selector in ChatHeader bottom sheet
- Timer values: Off, 30s, 1m, 1h, 1d, 1w
- System message when timer is set/changed
- Background task deletes expired messages every 60 seconds
- WebSocket broadcast of timer changes to conversation members

#### Deployment & Infrastructure
- Vercel configuration (`vercel.json`) for frontend deployment
- Render configuration (`render.yaml` + `Procfile` + `runtime.txt`) for backend deployment
- GitHub Actions CI/CD pipeline (`.github/workflows/test.yml`) — lint, build, test on push
- Sentry error tracking (frontend: `@sentry/nextjs`, backend: `sentry-sdk`)
- Health endpoint (`GET /health`) for uptime monitoring
- CORS configuration via `CORS_ORIGINS` environment variable
- Python logging with structured format

#### Legal & Community
- MIT License (`LICENSE`)
- Code of Conduct (`CODE_OF_CONDUCT.md`)
- Contributing guide (`CONTRIBUTING.md`)
- Security policy (`SECURITY.md`)
- Privacy policy (`PRIVACY.md`)
- Authors file (`AUTHORS.md`)
- Issue templates (bug report, feature request)
- Pull request template

#### Documentation
- Comprehensive README with architecture diagram, WebSocket flow, DB schema, API reference, design system, deployment guide
- API reference with 18 documented endpoints + WebSocket events
- Database schema with ER diagram and indexes
- Full design system (color palette, typography, components, accessibility)
- Known limitations section

### Fixed

- Auth store migration from custom `useAuth` to Zustand persist (`useAuthStore`)
- Root page routing — `app/page.tsx` removed, `/` flows through `(main)` layout with auth guard
- Next.js version pinned to 16.2.9 (was incorrectly resolving to 9.3.3 via npm audit fix)
- CORS origins now configurable via env var instead of hardcoded
- Upload endpoint — file saved with UUID prefix to avoid name collisions

### Known Issues

- OTP is mocked — all accounts use `123456`; no real SMS gateway integrated
- SQLite used in development — not suitable for production scale
- Local file storage — no S3/Cloudinary integration
- No push notifications — requires Firebase Cloud Messaging
- End-to-end encryption banner is cosmetic only
- Single-server WebSocket — no Redis pub/sub for horizontal scaling
- No full-text message search
- No media gallery view
- Message deletion is soft-delete only (`is_deleted` flag)

---

## [0.1.0] — 2024-11-01

### Added

- Initial project scaffold
- FastAPI backend with SQLAlchemy async models
- Basic WebSocket connection manager
- Next.js frontend with Tailwind CSS
- Auth endpoints (register, login, logout)
- Conversation and message CRUD
- Seed script with demo data (6 users, 5 conversations, 47 messages)
- Alembic migrations for initial schema
