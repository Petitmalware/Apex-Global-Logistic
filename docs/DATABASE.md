# Database Design

The Prisma schema in `prisma/schema.prisma` is the first database contract for Apex Global Logistics.

## Core Ownership

`Organization` is the primary tenant boundary. Most operational records carry `organizationId` so future features can enforce tenant isolation in service code, database policies, or both.

`User`, `Role`, `Permission`, `UserRole`, and `RolePermission` model RBAC with scoped roles. A role can be global, organization-scoped, or warehouse-scoped.

`RefreshToken`, `PasswordResetToken`, and `EmailVerificationToken` store hashed token values only. Refresh tokens rotate by family so reuse can revoke the remaining active family.

## Logistics Model

`Shipment` is the central operational aggregate. It connects to:

- origin and destination addresses
- optional origin and destination warehouses
- optional assigned driver and vehicle
- many packages
- many tracking events
- optional pet transport detail
- optional freight transport detail
- invoices, notifications, support tickets, and AI conversations

`PetTransport` and `FreightTransport` are one-to-one extension tables. This keeps the shipment table stable while allowing specialized data to grow independently.

## Financial Model

`Invoice` owns `InvoiceLineItem` and `Payment` rows. Line items and payments cascade when an invoice is removed, while shipment and customer references are nullable so historical invoices can survive user or shipment lifecycle changes.

## Operational History

`TrackingEvent`, `ActivityLog`, and `AuditLog` are append-heavy tables. They are indexed by timestamp and owner fields now, and are candidates for PostgreSQL partitioning once volume requires it.

## Delete Behavior

- Cascades are used for dependent child rows such as role permissions, user roles, packages, invoice lines, ticket messages, AI messages, and notifications owned by a user.
- Auth token rows cascade with their user and store hashed token material only.
- `SetNull` is used for historical actor references so deleting or anonymizing a user does not erase records.
- `Restrict` is used on core business ownership, such as organizations on shipments, warehouses, invoices, and support tickets.

## Future Scalability

When business features start landing, add migrations for database-native constraints that Prisma cannot express directly:

- partial unique indexes for one active driver-vehicle assignment per driver or vehicle
- row-level security policies by `organizationId`
- monthly partitions for tracking, activity, and audit logs
- GIN indexes for JSON metadata fields that become queryable
- full-text indexes for support ticket search and shipment lookup
