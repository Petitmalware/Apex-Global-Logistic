# Environment

Environment variables are validated with Zod in `src/config`.

## Variables

| Name                                | Scope                 | Required | Description                                                                         |
| ----------------------------------- | --------------------- | -------- | ----------------------------------------------------------------------------------- |
| `AI_PROVIDER`                       | Server                | No       | AI provider: `local`, `openai`, `gemini`, `groq`, or `openrouter`.                  |
| `AI_REQUEST_TIMEOUT_MS`             | Server                | No       | AI provider request timeout. Defaults to `30000`.                                   |
| `AI_SEMANTIC_SEARCH_LIMIT`          | Server                | No       | Default semantic search result limit. Defaults to `8`.                              |
| `APP_ENV`                           | Server                | No       | Runtime environment. Defaults to `development`.                                     |
| `AUTH_ACCESS_TOKEN_TTL_SECONDS`     | Server                | No       | Access JWT lifetime in seconds. Defaults to `900`.                                  |
| `AUTH_EMAIL_VERIFICATION_TTL_HOURS` | Server                | No       | Email verification token lifetime. Defaults to `24`.                                |
| `AUTH_JWT_SECRET`                   | Server and middleware | Yes      | HMAC signing secret for access JWTs. Must be at least 32 characters.                |
| `AUTH_PASSWORD_RESET_TTL_MINUTES`   | Server                | No       | Password reset token lifetime. Defaults to `30`.                                    |
| `AUTH_REFRESH_TOKEN_TTL_DAYS`       | Server                | No       | Refresh token lifetime in days. Defaults to `30`.                                   |
| `DATABASE_URL`                      | Server                | Yes      | PostgreSQL connection string used by Prisma.                                        |
| `BREVO_API_KEY`                     | Server                | No       | Brevo API key used when `EMAIL_PROVIDER=brevo`.                                     |
| `EMAIL_FROM`                        | Server                | No       | Sender address for the branded email service.                                       |
| `EMAIL_PROVIDER`                    | Server                | No       | Branded email provider: `console`, `resend`, `brevo`, or `smtp`.                    |
| `EMAIL_RATE_LIMIT_PER_HOUR`         | Server                | No       | Per-admin send/test-send limit. Defaults to `60`.                                   |
| `GEMINI_API_KEY`                    | Server                | No       | Gemini API key used when `AI_PROVIDER=gemini`.                                      |
| `GEMINI_MODEL`                      | Server                | No       | Gemini model name.                                                                  |
| `GROQ_API_KEY`                      | Server                | No       | Groq API key used when `AI_PROVIDER=groq`.                                          |
| `GROQ_BASE_URL`                     | Server                | No       | Groq OpenAI-compatible base URL.                                                    |
| `GROQ_MODEL`                        | Server                | No       | Groq model name.                                                                    |
| `NEXT_PUBLIC_APP_URL`               | Client and server     | No       | Public application URL. Defaults to `http://localhost:3000`.                        |
| `NOTIFICATION_EMAIL_FROM`           | Server                | No       | Reserved sender override for a future separate notification adapter.                |
| `NOTIFICATION_EMAIL_PROVIDER`       | Server                | No       | Reserved adapter setting. Branded notifications currently use `EMAIL_PROVIDER`.     |
| `OPENAI_API_KEY`                    | Server                | No       | OpenAI API key used when `AI_PROVIDER=openai`.                                      |
| `OPENAI_BASE_URL`                   | Server                | No       | OpenAI-compatible base URL.                                                         |
| `OPENAI_MODEL`                      | Server                | No       | OpenAI model name.                                                                  |
| `OPENROUTER_API_KEY`                | Server                | No       | OpenRouter API key used when `AI_PROVIDER=openrouter`.                              |
| `OPENROUTER_BASE_URL`               | Server                | No       | OpenRouter OpenAI-compatible base URL.                                              |
| `OPENROUTER_MODEL`                  | Server                | No       | OpenRouter model name.                                                              |
| `REDIS_URL`                         | Server                | No       | Redis URL for cross-instance realtime pub/sub.                                      |
| `RESEND_API_KEY`                    | Server                | No       | Resend API key used when `EMAIL_PROVIDER=resend`.                                   |
| `SMTP_FROM`                         | Server                | No       | SMTP sender override used when `EMAIL_PROVIDER=smtp`.                               |
| `SMTP_HOST`                         | Server                | No       | SMTP host used when `EMAIL_PROVIDER=smtp`.                                          |
| `SMTP_PASSWORD`                     | Server                | No       | SMTP mailbox password used when `EMAIL_PROVIDER=smtp`.                              |
| `SMTP_PORT`                         | Server                | No       | SMTP port used when `EMAIL_PROVIDER=smtp`; port `465` uses SSL/TLS.                 |
| `SMTP_USERNAME`                     | Server                | No       | SMTP mailbox username used when `EMAIL_PROVIDER=smtp`.                              |
| `STORAGE_DRIVER`                    | Server                | No       | Upload storage driver. Defaults to `local`; `s3` is reserved for MinIO/S3 adapters. |
| `STORAGE_LOCAL_PATH`                | Server                | No       | Local upload storage path relative to the application working directory.            |
| `S3_ACCESS_KEY_ID`                  | Server                | No       | MinIO/S3 access key for future object storage adapters.                             |
| `S3_BUCKET`                         | Server                | No       | MinIO/S3 bucket for uploads and backup targets.                                     |
| `S3_ENDPOINT`                       | Server                | No       | MinIO/S3 endpoint URL.                                                              |
| `S3_FORCE_PATH_STYLE`               | Server                | No       | Use path-style S3 URLs for MinIO. Defaults to `true`.                               |
| `S3_PUBLIC_URL`                     | Server                | No       | Optional public object storage URL.                                                 |
| `S3_REGION`                         | Server                | No       | MinIO/S3 region. Defaults to `us-east-1`.                                           |
| `S3_SECRET_ACCESS_KEY`              | Server                | No       | MinIO/S3 secret key for future object storage adapters.                             |
| `SUPPORT_EMAIL`                     | Server                | No       | Support email rendered in branded emails.                                           |
| `SUPPORT_PHONE`                     | Server                | No       | Support phone rendered in branded emails.                                           |

## Local Setup

```bash
cp .env.example .env
```

Use the Docker Compose PostgreSQL service or provide your own PostgreSQL connection string.

For Apex domain mailbox delivery, keep local development on `EMAIL_PROVIDER=console` until you are ready to send real emails. In production, use `EMAIL_PROVIDER=smtp`, `SMTP_HOST=mail.spacemail.com`, `SMTP_PORT=465`, the full mailbox address as `SMTP_USERNAME`, and the mailbox password as `SMTP_PASSWORD`.

## Production

Set all required variables in the deployment environment. Do not commit `.env` files.

For Ubuntu VPS deployment, copy `deploy/env.production.example` to `.env.production` and follow `docs/DEPLOYMENT.md`.
