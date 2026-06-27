# Authentication

Apex Global Logistics uses short-lived JWT access tokens, rotating refresh tokens, email verification, password reset tokens, secure HTTP-only cookies, and RBAC backed by Prisma.

## Roles

Seeded platform roles:

- Customer
- Agent
- Support
- Admin
- Super Admin

Run:

```bash
npm run db:seed
```

Public registration creates Customer accounts only. Staff and administrative roles should be assigned by an authenticated administrative workflow when that feature is built.

## Cookies

| Cookie               | Purpose                | Path        | Security                                       |
| -------------------- | ---------------------- | ----------- | ---------------------------------------------- |
| `apex_access_token`  | Short-lived access JWT | `/`         | HTTP-only, same-site lax, secure in production |
| `apex_refresh_token` | Rotating refresh token | `/api/auth` | HTTP-only, same-site lax, secure in production |

## API Routes

| Route                       | Method | Purpose                                                |
| --------------------------- | ------ | ------------------------------------------------------ |
| `/api/auth/register`        | `POST` | Create a Customer account and queue verification email |
| `/api/auth/login`           | `POST` | Verify credentials and set auth cookies                |
| `/api/auth/refresh`         | `POST` | Rotate refresh token and set new cookies               |
| `/api/auth/logout`          | `POST` | Revoke current refresh token and clear cookies         |
| `/api/auth/forgot-password` | `POST` | Queue reset email without revealing account existence  |
| `/api/auth/reset-password`  | `POST` | Reset password and revoke active refresh tokens        |
| `/api/auth/verify-email`    | `POST` | Activate account email                                 |
| `/api/auth/me`              | `GET`  | Return current session user                            |

## Route Protection

`src/middleware.ts` validates access JWTs before protected routes render. Role-specific route prefixes:

- `/customer` requires Customer, Admin, or Super Admin
- `/agent` requires Agent, Admin, or Super Admin
- `/support` requires Support, Admin, or Super Admin
- `/admin` requires Admin or Super Admin
- `/super-admin` requires Super Admin

Server components and route handlers can also use:

```ts
await requireAuthenticatedUser();
await requireRole([AUTH_ROLES.ADMIN]);
await requirePermission(PERMISSIONS.SHIPMENTS_READ);
```

## Email Delivery

Verification and reset flows create queued `Notification` records with channel `EMAIL`. A delivery worker/provider can consume those records when outbound email infrastructure is added. In development, API responses include the generated token for local testing.
