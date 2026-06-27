# Admin Email Studio

The Admin Email Studio provides branded email composition, editable templates, preview, queueing, provider adapters, and audit logging.

## Routes

- `/admin/emails`
- `/admin/emails/compose`
- `/admin/emails/templates`
- `/admin/emails/templates/[id]`
- `/admin/emails/logs`

## Architecture

- `src/features/emails/templates/branded-logistics-email.tsx` defines the React Email wrapper.
- `src/features/emails/services/email.service.ts` prepares, previews, queues, sends, and audits email.
- `src/features/emails/services/email-provider.service.ts` contains console, Resend, Brevo, and SMTP adapter structure.
- `src/features/emails/services/email-sanitizer.ts` sanitizes rich HTML before preview, logging, or delivery.
- `EmailLog` stores recipient, subject, body, template, status, provider response, sender, shipment, and failure details.

## Delivery

Email sends are first written as `EmailLog` records with status `QUEUED`. A Redis queue signal is emitted when Redis is configured, and the current application instance also processes the queued log immediately. This keeps local development simple while preserving a queue boundary for future BullMQ workers.

## Security

Only users with email permissions can access the studio. Email provider keys remain server-only. Rich text is sanitized on the server, send/test-send calls are rate limited, and preview/send actions write audit records.
