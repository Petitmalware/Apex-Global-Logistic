# Apex Global Logistics

Apex Global Logistics is a production-ready Next.js 15 logistics platform foundation with authenticated dashboards, shipment workflows, notification/email systems, and AI-assisted operations. It provides the architecture, tooling, conventions, and infrastructure needed to keep building vertical logistics modules safely.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-compatible component structure
- Prisma ORM
- PostgreSQL
- ESLint and Prettier
- Husky, lint-staged, and Commitlint
- Docker and Docker Compose
- Environment validation with Zod
- Provider-agnostic AI layer for OpenAI, Gemini, Groq, OpenRouter, and local development

## Getting Started

Use Node.js 22, or any Node.js version supported by Next.js 15 and the `engines` field.

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

The app runs at `http://localhost:3000`.

Local seed accounts use the password `ApexDemo12345`:

- `customer@apexgloballogistics.test`
- `agent@apexgloballogistics.test`
- `support@apexgloballogistics.test`
- `admin@apexgloballogistics.test`
- `superadmin@apexgloballogistics.test`

When using Neon with Prisma locally, prefer a pooled connection URL with `sslmode=require`, `sslaccept=accept_invalid_certs`, `connect_timeout=30`, `pool_timeout=30`, and `connection_limit=5`. Remove `channel_binding=require` if Prisma reports that it cannot reach the database even though the host and port are reachable.

## Development Scripts

```bash
npm run dev           # Start the Next.js development server
npm run build         # Generate Prisma client and build for production
npm run start         # Start the production server
npm run lint          # Run ESLint
npm run lint:fix      # Run ESLint with automatic fixes
npm run typecheck     # Run TypeScript checks
npm run format        # Check Prettier formatting
npm run format:write  # Apply Prettier formatting
npm run check         # Run lint, typecheck, and format checks
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Create and apply a Prisma migration
npm run db:push       # Push Prisma schema changes without a migration
npm run db:seed       # Seed RBAC roles and permissions
npm run db:studio     # Open Prisma Studio
npm run docker:up     # Start the app and PostgreSQL with Docker Compose
npm run docker:down   # Stop Docker Compose services
```

## Project Structure

```text
src/
  app/                  App Router entry points and route composition
  components/           Shared reusable UI and layout components
  config/               Environment validation and runtime config
  core/                 Clean architecture domain, application, and infrastructure layers
  features/             Vertical feature modules
  lib/                  Shared framework utilities and service clients
  types/                Shared TypeScript declarations
prisma/                 Prisma schema and database notes
docs/                   Architecture, environment, and coding standards
```

## Docker

Start PostgreSQL and the app:

```bash
cp .env.example .env
npm run docker:up
```

The local PostgreSQL container uses:

```text
postgresql://apex:apex_password@localhost:5432/apex_global_logistics?schema=public
```

## Google Maps Tracking

Shipment status updates can use a city, logistics hub, landmark, or full address. When an
administrator publishes the update with latitude and longitude left blank, the server geocodes
that location and stores the resulting checkpoint coordinates. The public tracker then shows
those recorded checkpoints on Google Maps.

Configure two separate API keys:

```text
NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=  # Browser key, restricted to the website referrers and Maps JavaScript API
GOOGLE_MAPS_GEOCODING_API_KEY=        # Server-only key, restricted to the Geocoding API and server IP
```

Enable billing, Maps JavaScript API, and Geocoding API in the Google Cloud project. The browser
key is intentionally public to the built app, so restrict it to approved website referrers. Keep
the geocoding key in the environment file only; it is never sent to the browser. A map is a
visualisation of manually recorded checkpoints, not an unverified live GPS feed or a turn-by-turn
driving route.

## Architecture Notes

Business features should be added as vertical slices under `src/features/<feature-name>`. Shared domain rules belong under `src/core/domain`, use cases and ports under `src/core/application`, and framework or third-party adapters under `src/core/infrastructure`.

See `docs/ARCHITECTURE.md`, `docs/AUTHENTICATION.md`, `docs/DESIGN_SYSTEM.md`, `docs/AI.md`, `docs/SECURITY_AUDIT.md`, `docs/PRODUCTION_OPTIMIZATION.md`, `docs/DEPLOYMENT.md`, `docs/EMAIL_DELIVERABILITY.md`, and `docs/CODING_STANDARDS.md` before extending the platform.
