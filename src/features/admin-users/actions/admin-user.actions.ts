"use server";

import { revalidatePath } from "next/cache";
import { ActivityAction, EmailLogStatus, UserStatus } from "@prisma/client";

import { createAdminUserSchema } from "@/features/admin-users/schemas/admin-user.schemas";
import type { AdminUserActionState } from "@/features/admin-users/types/admin-user.types";
import { createPasswordReset } from "@/features/auth/services/auth.service";
import { queueBrandedEmail } from "@/features/emails/services/email.service";
import { env } from "@/config/env.server";
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
      email: true,
      id: true,
      name: true,
      organizationId: true,
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
  const setup = await createPasswordReset(user.id, {});
  const setupUrl = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${setup.token}`;

  const emailLog = await queueBrandedEmail({
    bodyHtml: `
      <p>Hello ${user.name},</p>
      <p>An Apex Global Logistics admin account has been created for you by ${actor.name}.</p>
      <p>Use the secure setup link below to choose your password and access the admin dashboard.</p>
      <p><a href="${setupUrl}">Set up admin access</a></p>
      <p>This link expires automatically. If it expires, ask an existing admin to send a new password reset link.</p>
    `,
    organizationId: user.organizationId,
    recipientEmail: user.email,
    recipientName: user.name,
    relatedUserId: user.id,
    sentById: actor.id,
    subject: "Your Apex Global Logistics admin account is ready",
  });

  if (!emailLog || emailLog.status === EmailLogStatus.FAILED) {
    console.error("Admin setup email delivery failed", {
      emailLogId: emailLog?.id,
      failureReason: emailLog?.failureReason ?? "Email log was not available after queueing.",
      recipientEmail: user.email,
    });

    return {
      message:
        "Admin account was created, but the setup email could not be sent. Check email settings, then send a password reset link.",
      status: "error",
    };
  }

  revalidatePath("/admin/users");

  return {
    message: "Admin account created and setup email sent.",
    status: "success",
  };
}
