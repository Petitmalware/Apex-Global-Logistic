import "server-only";

import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import type { AdminUserListItem } from "@/features/admin-users/types/admin-user.types";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";

export async function getAdminUsers(user: AuthSessionUser): Promise<AdminUserListItem[]> {
  const admins = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      createdAt: true,
      email: true,
      id: true,
      lastLoginAt: true,
      name: true,
      status: true,
    },
    where: {
      deletedAt: null,
      organizationId: user.roles.includes(AUTH_ROLES.SUPER_ADMIN)
        ? undefined
        : (user.organizationId ?? undefined),
      userRoles: {
        some: {
          role: {
            key: AUTH_ROLES.ADMIN,
            organizationId: null,
          },
        },
      },
    },
  });

  return admins.map((admin) => ({
    createdAt: admin.createdAt.toISOString(),
    email: admin.email,
    id: admin.id,
    lastLoginAt: admin.lastLoginAt?.toISOString() ?? null,
    name: admin.name,
    status: admin.status,
  }));
}
