"use server";

import { revalidatePath } from "next/cache";
import { ActivityAction, UserStatus } from "@prisma/client";

import { createAdminUserSchema } from "@/features/admin-users/schemas/admin-user.schemas";
import type { AdminUserActionState } from "@/features/admin-users/types/admin-user.types";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { AuthError } from "@/lib/auth/errors";
import { hashPassword } from "@/lib/auth/password";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

async function getAdminRoleId() {
  const role = await prisma.role.findFirst({
    select: {
      id: true,
    },
    where: {
      key: AUTH_ROLES.ADMIN,
      organizationId: null,
    },
  });

  if (!role) {
    throw new AuthError("Admin role is not seeded. Run npm run db:seed.", 500);
  }

  return role.id;
}

export async function createAdminUserAction(
  _previousState: AdminUserActionState,
  formData: FormData,
): Promise<AdminUserActionState> {
  const actor = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);
  const parsed = createAdminUserSchema.safeParse({
    email: getString(formData, "email"),
    name: getString(formData, "name"),
    password: getString(formData, "password"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please fix the highlighted admin details.",
      status: "error",
    };
  }

  const existingUser = await prisma.user.findUnique({
    select: {
      id: true,
    },
    where: {
      email: parsed.data.email,
    },
  });

  if (existingUser) {
    return {
      message: "An account with this email already exists.",
      status: "error",
    };
  }

  const roleId = await getAdminRoleId();
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      emailVerifiedAt: new Date(),
      hashedPassword: hashPassword(parsed.data.password),
      name: parsed.data.name,
      organizationId: actor.organizationId,
      status: UserStatus.ACTIVE,
      userRoles: {
        create: {
          organizationId: actor.organizationId,
          roleId,
        },
      },
    },
    select: {
      id: true,
    },
  });

  await prisma.activityLog.create({
    data: {
      action: ActivityAction.CREATE,
      actorId: actor.id,
      entityId: user.id,
      entityType: "admin_user",
      metadata: {
        email: parsed.data.email,
      },
      organizationId: actor.organizationId,
    },
  });

  revalidatePath("/admin/users");

  return {
    message: "Admin account created. Share the temporary password securely.",
    status: "success",
  };
}
