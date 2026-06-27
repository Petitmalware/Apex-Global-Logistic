# Security Audit

This project has a production hardening baseline for Apex Global Logistics. Security controls live in small reusable modules so new features can opt into the same patterns instead of creating separate local protections.

## Request Protection

- `src/middleware.ts` applies global security headers, CSRF/origin checks, API body limits, role-aware auth routing, and route-specific rate limits.
- Unsafe same-origin API calls use double-submit CSRF protection through `apex_csrf_token` and `x-csrf-token`.
- Unsafe page/server-action requests are protected with same-origin `Origin`/`Referer` validation.
- API request bodies are capped at 1MB in middleware. Large user files should continue to use server actions with explicit feature-level file validation.
- Public tracking, auth, AI, email send, general API, and server-action paths have separate rate-limit buckets.

## Browser Security Headers

Middleware sets:

- `Content-Security-Policy`
- `Strict-Transport-Security` in production
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Cross-Origin-Opener-Policy`
- `Cross-Origin-Resource-Policy`
- `X-Permitted-Cross-Domain-Policies`

The CSP keeps `unsafe-inline` for compatibility with the current Next.js rendering model and rich UI previews. Tighten this with nonces before accepting untrusted third-party scripts.

## Authentication And Passwords

- Access and refresh tokens are stored in `HttpOnly`, `SameSite=Lax` cookies.
- Refresh tokens are hashed in the database and rotated on refresh.
- Refresh-token reuse revokes the token family and creates an audit event.
- Passwords use PBKDF2-SHA256 with per-password salts, timing-safe verification, and 310,000 iterations.
- Registration and reset schemas require long mixed-case numeric passwords and cap password length.
- Login, registration, password reset, email verification, logout, and token-reuse events are written to `AuditLog`.

## Upload Validation

File upload validation is centralized in `src/lib/security/file-validation.ts`.

- Shipment documents, package photos, pet records/photos, and freight documents validate file size, MIME type, safe filename, allowed extension, and SHA-256 checksum.
- Files are persisted under scoped `storage/` prefixes after validation.
- Feature services keep their existing permission checks before accepting uploads.

## API And Permission Protection

- Protected API routes call `requirePermission`.
- Dashboard and role pages call `requireRole` or `requireAuthenticatedUser`.
- Middleware blocks unauthenticated protected APIs before route handlers run.
- Admin Email Studio and AI endpoints retain feature permissions and now also inherit CSRF/rate-limit/header protections.

## Operational Notes

- The in-memory rate limiter is safe as a baseline and works in local/single-instance deployments. Use Redis or a platform rate limiter for multi-instance production enforcement.
- Keep provider keys server-only. Never expose `OPENAI_API_KEY`, `RESEND_API_KEY`, `BREVO_API_KEY`, SMTP credentials, or `AUTH_JWT_SECRET` to client code.
- Review CSP before adding external analytics, maps, chat widgets, or file CDN domains.
- Run `npm run check` before release and review `AuditLog` storage/retention requirements for compliance.
