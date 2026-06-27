import { AUTH_ROLES, type AppRole } from "@/lib/auth/constants";

export const PERMISSIONS = {
  AI_CREATE: "ai:create",
  AI_READ: "ai:read",
  AUDIT_EXPORT: "audit:export",
  AUDIT_READ: "audit:read",
  DRIVERS_MANAGE: "drivers:manage",
  DRIVERS_READ: "drivers:read",
  EMAILS_CREATE: "emails:create",
  EMAILS_MANAGE: "emails:manage",
  EMAILS_READ: "emails:read",
  FREIGHT_TRANSPORT_CREATE: "freight_transport:create",
  FREIGHT_TRANSPORT_MANAGE: "freight_transport:manage",
  FREIGHT_TRANSPORT_READ: "freight_transport:read",
  FREIGHT_TRANSPORT_UPDATE: "freight_transport:update",
  INVOICES_MANAGE: "invoices:manage",
  INVOICES_READ: "invoices:read",
  NOTIFICATIONS_MANAGE: "notifications:manage",
  NOTIFICATIONS_READ: "notifications:read",
  PACKAGES_UPDATE: "packages:update",
  PET_TRANSPORT_CREATE: "pet_transport:create",
  PET_TRANSPORT_MANAGE: "pet_transport:manage",
  PET_TRANSPORT_READ: "pet_transport:read",
  PET_TRANSPORT_UPDATE: "pet_transport:update",
  ROLES_MANAGE: "roles:manage",
  ROLES_READ: "roles:read",
  SETTINGS_MANAGE: "settings:manage",
  SETTINGS_READ: "settings:read",
  SHIPMENTS_ASSIGN: "shipments:assign",
  SHIPMENTS_CREATE: "shipments:create",
  SHIPMENTS_MANAGE: "shipments:manage",
  SHIPMENTS_READ: "shipments:read",
  SHIPMENTS_UPDATE: "shipments:update",
  SUPPORT_MANAGE: "support:manage",
  SUPPORT_READ: "support:read",
  TRACKING_CREATE: "tracking:create",
  TRACKING_READ: "tracking:read",
  USERS_MANAGE: "users:manage",
  USERS_READ: "users:read",
  VEHICLES_MANAGE: "vehicles:manage",
  VEHICLES_READ: "vehicles:read",
  WAREHOUSES_MANAGE: "warehouses:manage",
  WAREHOUSES_READ: "warehouses:read",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type RbacSubject = {
  permissions: string[];
  roles: AppRole[];
};

export function hasRole(subject: RbacSubject, allowedRoles: AppRole[]) {
  return (
    subject.roles.includes(AUTH_ROLES.SUPER_ADMIN) ||
    allowedRoles.some((role) => subject.roles.includes(role))
  );
}

export function hasPermission(subject: RbacSubject, permission: Permission | string) {
  return subject.roles.includes(AUTH_ROLES.SUPER_ADMIN) || subject.permissions.includes(permission);
}

export function hasEveryPermission(subject: RbacSubject, permissions: Array<Permission | string>) {
  return permissions.every((permission) => hasPermission(subject, permission));
}

export function hasAnyPermission(subject: RbacSubject, permissions: Array<Permission | string>) {
  return permissions.some((permission) => hasPermission(subject, permission));
}
