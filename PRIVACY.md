# Privacy Policy

**Last updated: December 2024**

## Overview

Whispr is a demonstration/assignment project built for educational purposes.
This privacy policy explains what data is collected, how it is used, and your
rights regarding that data.

## Data Collection

### What We Collect

| Data | Purpose | Stored Where |
|------|---------|-------------|
| Phone number | User authentication and identification | Backend database (SQLite) |
| Display name | User profile display | Backend database |
| Avatar image | User profile picture | Server filesystem |
| Bio text | User profile description | Backend database |
| Message content | Core functionality of the app | Backend database |
| Message timestamps | Message ordering and display | Backend database |
| Online status | Presence feature | In-memory (WebSocket manager) |

### What We Do NOT Collect

- **Real phone numbers** — OTP is mocked; no SMS gateway is connected
- **Location data** — We do not track or store location
- **Device identifiers** — No device fingerprinting
- **Cookies** — We use `localStorage` for JWT tokens only
- **Analytics cookies** — No tracking cookies are used
- **Third-party data** — We do not share data with third parties

## Data Storage

- **Database**: SQLite file stored on the server. For production, migrate to
  PostgreSQL with encryption at rest.
- **Uploads**: Files are stored on the server filesystem. No CDN or external
  storage is used.
- **Local Storage**: JWT tokens are persisted in the browser's `localStorage`.
  This can be cleared at any time by logging out.

## Data Transmission

- **Development**: Data is transmitted over HTTP/WS (unencrypted).
- **Production**: Data is transmitted over HTTPS/WSS (TLS 1.3).
- **WebSocket**: Messages are sent in plaintext over the WebSocket connection.
  No client-side encryption is applied.

## User Rights

You can:

1. **Access your data** — View your profile and messages within the app
2. **Delete your data** — There is no self-service deletion endpoint;
   contact the maintainer to request deletion
3. **Export your data** — Message history can be viewed via the API
4. **Withdraw consent** — Stop using the application at any time

## Data Retention

- Messages are retained indefinitely unless the disappearing message timer
  is enabled (automatic deletion after the configured interval).
- User accounts and profiles persist until manually deleted.

## Security

We use industry-standard security measures:

- Passwords hashed with bcrypt
- JWT tokens with HMAC-SHA256 signing
- CORS restrictions to authorized origins only

However, this is a **demo application**. It does not implement end-to-end
encryption, perfect forward secrecy, or other advanced security features
required for a production messaging platform.

## Third-Party Services

- **Sentry** — Optional error tracking. If `NEXT_PUBLIC_SENTRY_DSN` is set,
  error reports are sent to Sentry. No personal data is included in error reports.
- **Vercel** — Frontend hosting. Vercel may collect standard web traffic data
  (IP address, user agent, etc.) as part of their hosting service.
- **Render** — Backend hosting. Render may collect standard server metrics.

## Changes to This Policy

We may update this privacy policy as the project evolves. Changes will be
reflected in the `PRIVACY.md` file with an updated date.

## Contact

For privacy-related inquiries, open an issue on the GitHub repository.

---

*This is a demo application created for educational purposes as part of a
Scaler SDE assignment. No real user data is collected or processed.*
