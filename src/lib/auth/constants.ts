export const AUTH_COOKIE_NAMES = {
  accessToken: "apex_access_token",
  refreshToken: "apex_refresh_token",
} as const;

export const AUTH_ROLES = {
  CUSTOMER: "customer",
  AGENT: "agent",
  ADMIN: "admin",
  SUPPORT: "support",
  SUPER_ADMIN: "super_admin",
} as const;

export const AUTH_ROLE_LABELS = {
  [AUTH_ROLES.CUSTOMER]: "Customer",
  [AUTH_ROLES.AGENT]: "Agent",
  [AUTH_ROLES.ADMIN]: "Admin",
  [AUTH_ROLES.SUPPORT]: "Support",
  [AUTH_ROLES.SUPER_ADMIN]: "Super Admin",
} as const;

export const AUTH_PUBLIC_PATHS = [
  "/",
  "/about",
  "/contact",
  "/faq",
  "/freight",
  "/login",
  "/parcel-delivery",
  "/pet-transportation",
  "/pricing",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/services",
  "/tracking",
  "/verify-email",
  "/unauthorized",
  "/design-system",
] as const;

export const AUTH_PUBLIC_API_PREFIXES = [
  "/api/auth",
  "/api/health",
  "/api/metrics",
  "/api/tracking",
] as const;

export type AppRole = (typeof AUTH_ROLES)[keyof typeof AUTH_ROLES];
