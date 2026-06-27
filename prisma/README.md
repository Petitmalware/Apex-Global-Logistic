# Prisma

This project uses Prisma with PostgreSQL as the source of truth for the Apex Global Logistics data model.

The initial schema defines the normalized platform database contract for:

- identity, users, roles, and permissions
- organizations, warehouses, drivers, and vehicles
- shipments, packages, tracking events, pet transport, and freight transport
- invoices, invoice line items, and payments
- notifications and email templates
- activity logs, support tickets, AI conversations, settings, and audit logs

## Design Principles

- UUID primary keys are used for safer distributed creation and future data movement.
- Long-lived business records include `createdAt`, `updatedAt`, and where useful `deletedAt`.
- Tenant-oriented tables include `organizationId` to support multi-organization scale.
- Child-only records such as package rows, tracking events, invoice items, ticket messages, and AI messages cascade with their parent.
- Historical records use `SetNull` or `Restrict` where deleting a related user, shipment, warehouse, or organization should not silently erase business history.
- High-cardinality operational lookups have compound indexes by organization, status, assignee, due dates, or event timestamps.

## PostgreSQL Notes

Prisma covers the portable schema. Add PostgreSQL-specific migration SQL when needed for:

- partial unique indexes for active driver or vehicle assignments
- table partitioning for `TrackingEvent`, `ActivityLog`, and `AuditLog`
- row-level security policies for organization isolation
- trigram or full-text search indexes for shipment numbers, support tickets, and addresses
- encrypted columns or external KMS workflows for sensitive settings

Useful commands:

```bash
npm run db:format
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

Run `npm run db:seed` after the first migration to create the platform roles and baseline permissions used by authentication and RBAC.
