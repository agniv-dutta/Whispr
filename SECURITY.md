# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅ |

## Reporting a Vulnerability

This is a demo/assignment project. If you discover a security vulnerability,
please report it by opening an issue with the label `security`.

We aim to acknowledge receipt within 48 hours and provide a fix timeline
within 7 days.

## Security Considerations

### End-to-End Encryption

**Whispr does NOT implement true end-to-end encryption.** The encryption
banner displayed in the UI is cosmetic only. Messages are stored as plaintext
in the SQLite database and transmitted over the WebSocket connection.

For a production messaging application, you must integrate the
[Signal Protocol](https://signal.org/docs/) or similar E2EE library using
the Web Crypto API for key exchange and message encryption.

### Transport Security

- **Development**: HTTP/WS (unencrypted) — for local development only
- **Production**: HTTPS/WSS (TLS) — enforced by Vercel (frontend) and
  Render (backend) with automatic SSL certificate provisioning

### Authentication

- JWT tokens are signed with HMAC-SHA256 using the `JWT_SECRET` environment variable
- Tokens are stored in `localStorage` — vulnerable to XSS. For production, use
  HTTP-only cookies with CSRF protection.
- OTP is mocked (`123456`) — not a real authentication mechanism

### Data Storage

- Passwords are hashed with bcrypt via `passlib`
- SQLite database file should not be exposed publicly
- Uploaded files are stored on server disk — no access control in the current
  implementation

### Responsible Disclosure

If you find a security issue, please:

1. **Do not** open a public issue immediately
2. Email the maintainer or open a draft security advisory
3. Allow a reasonable timeframe for a fix before disclosure

### Production Hardening Checklist

Before deploying to production:

- [ ] Replace SQLite with PostgreSQL
- [ ] Use external object storage (S3/Cloudinary) for file uploads
- [ ] Migrate from localStorage to HTTP-only cookies for JWT
- [ ] Implement rate limiting on auth endpoints
- [ ] Add CSRF protection
- [ ] Enable Helmet.js security headers
- [ ] Implement real OTP via SMS gateway (Twilio, Vonage)
- [ ] Add IP-based rate limiting
- [ ] Set up database encryption at rest
- [ ] Implement proper audit logging
