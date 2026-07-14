import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import { AUTH_COOKIE_NAMES, type AppRole } from "@/lib/auth/constants";
import { AuthError } from "@/lib/auth/errors";
import { verifyAccessToken, type AccessTokenPayload } from "@/lib/auth/jwt";
import { hasPermission, hasRole, type Permission } from "@/lib/auth/rbac";

function getSessionUserFromToken(payload: AccessTokenPayload): AuthSessionUser {
  return {
    email: payload.email,
    id: payload.sub,
    name: payload.name,
    organizationId: payload.organizationId,
    permissions: payload.permissions,
    roles: payload.roles,
  };
}

export async function getCurrentSessionUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIE_NAMES.accessToken)?.value;

  if (!accessToken) {
    return null;
  }

  const payload = await verifyAccessToken(accessToken);

  if (!payload) {
    return null;
  }

  return getSessionUserFromToken(payload);
}

export async function requireAuthenticatedUser() {
  const user = await getCurrentSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(allowedRoles: AppRole[]) {
  const user = await requireAuthenticatedUser();

  if (!hasRole(user, allowedRoles)) {
    redirect("/unauthorized");
  }

  return user;
}

export async function requirePermission(permission: Permission | string) {
  const user = await requireAuthenticatedUser();

  if (!hasPermission(user, permission)) {
    redirect("/unauthorized");
  }

  return user;
}

export function assertPermission(user: AuthSessionUser, permission: Permission | string) {
  if (!hasPermission(user, permission)) {
    throw new AuthError("You do not have permission to perform this action.", 403, "FORBIDDEN");
  }
}

export function assertRole(user: AuthSessionUser, allowedRoles: AppRole[]) {
  if (!hasRole(user, allowedRoles)) {
    throw new AuthError("You do not have permission to perform this action.", 403, "FORBIDDEN");
  }
}
