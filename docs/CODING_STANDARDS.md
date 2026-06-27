# Coding Standards

## TypeScript

- Use strict TypeScript and avoid `any`.
- Model external input with validation schemas before it reaches application code.
- Prefer explicit return types for exported functions.
- Keep domain code framework-free.

## React and Next.js

- Use Server Components by default.
- Add `"use client"` only for state, effects, browser APIs, or event handlers.
- Keep route files thin and move reusable UI into `src/components` or feature components.
- Do not import server-only code into Client Components.

## Styling

- Use Tailwind utility classes and shadcn/ui primitives.
- Keep shared UI primitives in `src/components/ui`.
- Use `cn` from `src/lib/utils.ts` for conditional class names.
- Prefer accessible native semantics before adding custom interaction patterns.

## Database

- Update `prisma/schema.prisma` first, then create migrations with `npm run db:migrate`.
- Commit Prisma migrations with the code that depends on them.
- Keep Prisma calls on the server.

## Commits

Use Conventional Commits:

```text
feat: add shipment intake shell
fix: correct database health check
chore: update eslint config
```

Pre-commit hooks run lint-staged, and commit messages are checked with Commitlint.

## Review Checklist

- `npm run check` passes.
- New environment variables are documented in `.env.example` and `docs/ENVIRONMENT.md`.
- New shared abstractions have at least two real consumers or a clear ownership boundary.
- Business behavior is covered with focused tests once business features are added.
