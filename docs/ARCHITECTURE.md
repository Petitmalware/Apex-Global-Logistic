# Architecture

Apex Global Logistics starts with a clean architecture boundary and feature-based application structure. The initial repository includes only infrastructure and composition code; no logistics business workflows have been implemented yet.

## Layers

```text
src/app
  Next.js routes, layouts, metadata, and request/response composition.

src/features
  Future vertical modules. Each feature should own its UI, server actions, queries, schemas, and tests.

src/core/domain
  Pure domain concepts and rules with no framework imports.

src/core/application
  Use cases, ports, contracts, and orchestration that coordinates domain behavior.

src/core/infrastructure
  Implementations of application ports, third-party adapters, and persistence integrations.

src/components
  Shared design-system and layout primitives.

src/lib
  Cross-cutting framework utilities such as Prisma clients and class-name helpers.
```

## Dependency Direction

Dependencies should point inward:

```text
app -> features -> core/application -> core/domain
infrastructure -> core/application
components -> lib
```

The domain layer must not import from Next.js, Prisma, React, or any feature module.

## Feature Module Shape

Create new feature modules like this:

```text
src/features/shipments/
  actions/
  components/
  queries/
  schemas/
  services/
  types/
  index.ts
```

Keep feature-specific implementation details inside the feature. Promote code to `src/core` or `src/components` only when it is clearly shared by multiple features.

## Data Access

Prisma access should stay behind server-only modules. UI components should not import Prisma directly. Prefer feature queries, feature services, or application-layer ports for data access.
