# Notifications

Apex Global Logistics uses the existing `Notification`, `EmailTemplate`, and `Setting` tables for a production-ready notification foundation.

## Capabilities

- In-app notifications with unread/read status and history.
- Redis-backed realtime fanout with local in-process fallback for development.
- Server-Sent Events at `/api/notifications/stream`.
- User preferences stored in `Setting` with channel, topic, digest, and quiet-hour controls.
- Email notifications queued in `Notification` records with optional `EmailTemplate` rendering.
- SMS and WhatsApp channel support in the Prisma enum and preferences for future provider adapters.

## Key Files

- `src/features/notifications/services/notification.service.ts`
- `src/features/notifications/services/notification-realtime.service.ts`
- `src/features/notifications/queries/notification.queries.ts`
- `src/features/notifications/components/notification-center.tsx`
- `src/app/api/notifications/*`
- `src/app/notifications/page.tsx`

## Runtime Notes

`REDIS_URL` enables cross-instance realtime updates. Without Redis, the local event broker keeps a single development server live.

Email dispatch is provider-neutral and uses the branded email service configured by `EMAIL_PROVIDER`. `dispatchPendingEmailNotifications` sends pending email notifications through the active provider, writes the resulting `EmailLog` ID and provider message ID back to the notification record, and is exposed to users with `notifications:manage` at `/api/notifications/email/dispatch`.
