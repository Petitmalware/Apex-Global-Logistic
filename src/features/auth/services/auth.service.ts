import "server-only";
import { randomUUID } from "node:crypto";
import { AuditAction, EmailTemplateCategory, UserStatus } from "@prisma/client";

import { env } from "@/config/env.server";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
  type VerifyEmailInput,
} from "@/features/auth/schemas/auth.schemas";
import { AUTH_ROLES, type AppRole } from "@/lib/auth/constants";
import { AuthError } from "@/lib/auth/errors";
import { signAccessToken } from "@/lib/auth/jwt";
import { createSecureToken, hashPassword, hashToken, verifyPassword } from "@/lib/auth/password";
import { queueBrandedEmail } from "@/features/emails/services/email.service";
import type { RequestMeta } from "@/lib/auth/request";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/security/audit";

export type AuthSessionUser = {
  email: string;
  id: string;
  name: string;
  organizationId: string | null;
  permissions: string[];
  roles: AppRole[];
};

export type IssuedAuthTokens = {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  user: AuthSessionUser;
};

type RolePermissionRecord = {
  permission: {
    key: string;
  };
};

type UserRoleRecord = {
  role: {
    key: string;
    rolePermissions: RolePermissionRecord[];
  };
};

type UserWithAuth = {
  deletedAt: Date | null;
  email: string;
  emailVerifiedAt: Date | null;
  hashedPassword: string | null;
  id: string;
  name: string;
  organizationId: string | null;
  status: UserStatus;
  userRoles: UserRoleRecord[];
};

function getAuthUserInclude() {
  return {
    userRoles: {
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
      where: {
        OR: [
          {
            expiresAt: null,
          },
          {
            expiresAt: {
              gt: new Date(),
            },
          },
        ],
      },
    },
  };
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function isAppRole(role: string): role is AppRole {
  return Object.values(AUTH_ROLES).includes(role as AppRole);
}

function buildSessionUser(user: UserWithAuth): AuthSessionUser {
  const roles = user.userRoles.map((userRole) => userRole.role.key).filter(isAppRole);
  const permissions = new Set<string>();

  for (const userRole of user.userRoles) {
    for (const rolePermission of userRole.role.rolePermissions) {
      permissions.add(rolePermission.permission.key);
    }
  }

  return {
    email: user.email,
    id: user.id,
    name: user.name,
    organizationId: user.organizationId,
    permissions: [...permissions].sort(),
    roles,
  };
}

function assertCanAuthenticate(user: UserWithAuth) {
  if (user.deletedAt || user.status !== UserStatus.ACTIVE) {
    throw new AuthError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
  }

  if (!user.emailVerifiedAt) {
    throw new AuthError("Please verify your email before signing in.", 403, "EMAIL_NOT_VERIFIED");
  }
}

async function findAuthUserById(userId: string) {
  return prisma.user.findUnique({
    include: getAuthUserInclude(),
    where: {
      id: userId,
    },
  });
}

async function findAuthUserByEmail(email: string) {
  return prisma.user.findUnique({
    include: getAuthUserInclude(),
    where: {
      email,
    },
  });
}

async function getCustomerRoleId() {
  const customerRole = await prisma.role.findFirst({
    select: {
      id: true,
    },
    where: {
      key: AUTH_ROLES.CUSTOMER,
      organizationId: null,
    },
  });

  if (!customerRole) {
    throw new AuthError(
      "Customer role is not seeded. Run npm run db:seed.",
      500,
      "ROLE_NOT_SEEDED",
    );
  }

  return customerRole.id;
}

async function queueAuthEmail(userId: string, title: string, body: string, actionUrl: string) {
  const user = await prisma.user.findUnique({
    select: {
      email: true,
      name: true,
      organizationId: true,
    },
    where: {
      id: userId,
    },
  });

  if (!user) {
    return;
  }

  await queueBrandedEmail({
    bodyHtml: `<p>${body}</p><p><a href="${actionUrl}">Open secure link</a></p>`,
    category: EmailTemplateCategory.AUTH,
    organizationId: user.organizationId,
    recipientEmail: user.email,
    recipientName: user.name,
    relatedUserId: userId,
    subject: title,
  });
}

async function writeAuthAudit({
  actorId,
  after,
  entityId,
  entityType = "auth_session",
  meta,
  organizationId,
  action,
}: {
  action: AuditAction;
  actorId?: string | null;
  after?: unknown;
  entityId?: string | null;
  entityType?: string;
  meta?: RequestMeta;
  organizationId?: string | null;
}) {
  await writeAuditLog({
    action,
    actorId,
    after,
    entityId,
    entityType,
    meta,
    organizationId,
  });
}

export async function createEmailVerification(userId: string, meta: RequestMeta) {
  const token = createSecureToken(48);
  const expiresAt = addHours(new Date(), env.AUTH_EMAIL_VERIFICATION_TTL_HOURS);

  await prisma.$transaction([
    prisma.emailVerificationToken.updateMany({
      data: {
        usedAt: new Date(),
      },
      where: {
        userId,
        usedAt: null,
      },
    }),
    prisma.emailVerificationToken.create({
      data: {
        createdByIp: meta.ipAddress,
        expiresAt,
        tokenHash: hashToken(token),
        userId,
      },
    }),
  ]);

  return {
    expiresAt,
    token,
  };
}

export async function createPasswordReset(userId: string, meta: RequestMeta) {
  const token = createSecureToken(48);
  const expiresAt = addMinutes(new Date(), env.AUTH_PASSWORD_RESET_TTL_MINUTES);

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      data: {
        usedAt: new Date(),
      },
      where: {
        userId,
        usedAt: null,
      },
    }),
    prisma.passwordResetToken.create({
      data: {
        createdByIp: meta.ipAddress,
        expiresAt,
        tokenHash: hashToken(token),
        userId,
      },
    }),
  ]);

  return {
    expiresAt,
    token,
  };
}

export async function issueAuthTokens(
  user: AuthSessionUser,
  meta: RequestMeta,
  familyId = randomUUID(),
) {
  const accessToken = await signAccessToken(
    {
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      permissions: user.permissions,
      roles: user.roles,
      sub: user.id,
    },
    env.AUTH_ACCESS_TOKEN_TTL_SECONDS,
  );
  const refreshToken = createSecureToken(64);
  const refreshTokenExpiresAt = addDays(new Date(), env.AUTH_REFRESH_TOKEN_TTL_DAYS);

  await prisma.refreshToken.create({
    data: {
      createdByIp: meta.ipAddress,
      expiresAt: refreshTokenExpiresAt,
      familyId,
      tokenHash: hashToken(refreshToken),
      userAgent: meta.userAgent,
      userId: user.id,
    },
  });

  return {
    accessToken,
    refreshToken,
    refreshTokenExpiresAt,
    user,
  };
}

export async function registerUser(input: RegisterInput, meta: RequestMeta) {
  const data = registerSchema.parse(input);
  const existingUser = await prisma.user.findUnique({
    select: {
      id: true,
    },
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
    throw new AuthError(
      "An account with this email already exists.",
      409,
      "EMAIL_ALREADY_REGISTERED",
    );
  }

  const customerRoleId = await getCustomerRoleId();
  const user = await prisma.user.create({
    data: {
      email: data.email,
      hashedPassword: hashPassword(data.password),
      name: data.name,
      status: UserStatus.INVITED,
      userRoles: {
        create: {
          roleId: customerRoleId,
        },
      },
    },
    include: getAuthUserInclude(),
  });
  const verification = await createEmailVerification(user.id, meta);
  const verificationUrl = `${env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verification.token}`;

  await queueAuthEmail(
    user.id,
    "Verify your Apex Global Logistics email",
    "Confirm your email address to activate your Apex Global Logistics account.",
    verificationUrl,
  );

  await writeAuthAudit({
    action: AuditAction.CREATE,
    actorId: user.id,
    after: {
      email: data.email,
      event: "registration_requested",
      status: UserStatus.INVITED,
    },
    entityId: user.id,
    entityType: "user",
    meta,
    organizationId: user.organizationId,
  });

  return {
    developmentVerificationToken: env.APP_ENV === "development" ? verification.token : undefined,
    message: "Registration successful. Please verify your email before signing in.",
    user: buildSessionUser(user),
  };
}

export async function loginUser(input: LoginInput, meta: RequestMeta) {
  const data = loginSchema.parse(input);
  const user = await findAuthUserByEmail(data.email);

  if (!user?.hashedPassword || !verifyPassword(data.password, user.hashedPassword)) {
    await writeAuthAudit({
      action: AuditAction.LOGIN,
      after: {
        email: data.email,
        event: "login_attempt",
        outcome: "failed",
        reason: "invalid_credentials",
      },
      entityId: user?.id,
      meta,
      organizationId: user?.organizationId,
    });
    throw new AuthError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
  }

  try {
    assertCanAuthenticate(user);
  } catch (error) {
    await writeAuthAudit({
      action: AuditAction.LOGIN,
      actorId: user.id,
      after: {
        email: data.email,
        event: "login_attempt",
        outcome: "failed",
        reason: error instanceof AuthError ? error.code : "authentication_blocked",
      },
      entityId: user.id,
      meta,
      organizationId: user.organizationId,
    });
    throw error;
  }

  await prisma.user.update({
    data: {
      lastLoginAt: new Date(),
    },
    where: {
      id: user.id,
    },
  });

  const tokens = await issueAuthTokens(buildSessionUser(user), meta);

  await writeAuthAudit({
    action: AuditAction.LOGIN,
    actorId: user.id,
    after: {
      email: data.email,
      event: "login_attempt",
      outcome: "success",
      roles: tokens.user.roles,
    },
    entityId: user.id,
    meta,
    organizationId: user.organizationId,
  });

  return tokens;
}

export async function refreshAuthTokens(refreshToken: string | undefined, meta: RequestMeta) {
  if (!refreshToken) {
    throw new AuthError("Missing refresh token.", 401, "MISSING_REFRESH_TOKEN");
  }

  const tokenHash = hashToken(refreshToken);
  const existingToken = await prisma.refreshToken.findUnique({
    include: {
      user: {
        include: getAuthUserInclude(),
      },
    },
    where: {
      tokenHash,
    },
  });

  if (!existingToken) {
    throw new AuthError("Invalid refresh token.", 401, "INVALID_REFRESH_TOKEN");
  }

  if (existingToken.revokedAt) {
    await prisma.refreshToken.updateMany({
      data: {
        revokedAt: new Date(),
        revokedByIp: meta.ipAddress,
      },
      where: {
        familyId: existingToken.familyId,
        revokedAt: null,
      },
    });
    await writeAuthAudit({
      action: AuditAction.SYSTEM,
      actorId: existingToken.userId,
      after: {
        event: "refresh_token_reuse_detected",
        familyId: existingToken.familyId,
      },
      entityId: existingToken.id,
      entityType: "refresh_token",
      meta,
      organizationId: existingToken.user.organizationId,
    });
    throw new AuthError("Refresh token reuse detected.", 401, "REFRESH_TOKEN_REUSED");
  }

  if (existingToken.expiresAt <= new Date()) {
    throw new AuthError("Refresh token expired.", 401, "REFRESH_TOKEN_EXPIRED");
  }

  assertCanAuthenticate(existingToken.user);

  const user = buildSessionUser(existingToken.user);
  const newRefreshToken = createSecureToken(64);
  const newRefreshTokenExpiresAt = addDays(new Date(), env.AUTH_REFRESH_TOKEN_TTL_DAYS);
  const accessToken = await signAccessToken(
    {
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      permissions: user.permissions,
      roles: user.roles,
      sub: user.id,
    },
    env.AUTH_ACCESS_TOKEN_TTL_SECONDS,
  );

  const createdRefreshToken = await prisma.$transaction(async (transaction) => {
    const created = await transaction.refreshToken.create({
      data: {
        createdByIp: meta.ipAddress,
        expiresAt: newRefreshTokenExpiresAt,
        familyId: existingToken.familyId,
        tokenHash: hashToken(newRefreshToken),
        userAgent: meta.userAgent,
        userId: existingToken.userId,
      },
    });

    await transaction.refreshToken.update({
      data: {
        replacedByTokenId: created.id,
        revokedAt: new Date(),
        revokedByIp: meta.ipAddress,
      },
      where: {
        id: existingToken.id,
      },
    });

    return created;
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
    refreshTokenExpiresAt: createdRefreshToken.expiresAt,
    user,
  };
}

export async function logoutUser(refreshToken: string | undefined, meta: RequestMeta) {
  if (!refreshToken) {
    return;
  }

  const tokenHash = hashToken(refreshToken);
  const existingToken = await prisma.refreshToken.findUnique({
    select: {
      id: true,
      user: {
        select: {
          organizationId: true,
        },
      },
      userId: true,
    },
    where: {
      tokenHash,
    },
  });

  await prisma.refreshToken.updateMany({
    data: {
      revokedAt: new Date(),
      revokedByIp: meta.ipAddress,
    },
    where: {
      revokedAt: null,
      tokenHash,
    },
  });

  if (existingToken) {
    await writeAuthAudit({
      action: AuditAction.LOGOUT,
      actorId: existingToken.userId,
      after: {
        event: "logout",
        outcome: "success",
      },
      entityId: existingToken.userId,
      meta,
      organizationId: existingToken.user.organizationId,
    });
  }
}

export async function requestPasswordReset(input: ForgotPasswordInput, meta: RequestMeta) {
  const data = forgotPasswordSchema.parse(input);
  const user = await prisma.user.findUnique({
    select: {
      deletedAt: true,
      id: true,
      organizationId: true,
    },
    where: {
      email: data.email,
    },
  });

  if (!user || user.deletedAt) {
    return {
      message: "If an account exists, password reset instructions have been queued.",
    };
  }

  const reset = await createPasswordReset(user.id, meta);
  const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${reset.token}`;

  await queueAuthEmail(
    user.id,
    "Reset your Apex Global Logistics password",
    "Use this secure link to reset your password.",
    resetUrl,
  );

  await writeAuthAudit({
    action: AuditAction.SYSTEM,
    actorId: user.id,
    after: {
      email: data.email,
      event: "password_reset_requested",
    },
    entityId: user.id,
    entityType: "password_reset_token",
    meta,
    organizationId: user.organizationId,
  });

  return {
    developmentResetToken: env.APP_ENV === "development" ? reset.token : undefined,
    message: "If an account exists, password reset instructions have been queued.",
  };
}

export async function resetPassword(input: ResetPasswordInput, meta: RequestMeta) {
  const data = resetPasswordSchema.parse(input);
  const tokenHash = hashToken(data.token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    include: {
      user: true,
    },
    where: {
      tokenHash,
    },
  });

  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expiresAt <= new Date() ||
    resetToken.user.deletedAt
  ) {
    throw new AuthError("Invalid or expired password reset token.", 400, "INVALID_RESET_TOKEN");
  }

  await prisma.$transaction([
    prisma.user.update({
      data: {
        hashedPassword: hashPassword(data.password),
        passwordChangedAt: new Date(),
        status: resetToken.user.emailVerifiedAt ? UserStatus.ACTIVE : resetToken.user.status,
      },
      where: {
        id: resetToken.userId,
      },
    }),
    prisma.passwordResetToken.update({
      data: {
        usedAt: new Date(),
      },
      where: {
        id: resetToken.id,
      },
    }),
    prisma.refreshToken.updateMany({
      data: {
        revokedAt: new Date(),
        revokedByIp: meta.ipAddress,
      },
      where: {
        userId: resetToken.userId,
        revokedAt: null,
      },
    }),
  ]);

  await writeAuthAudit({
    action: AuditAction.UPDATE,
    actorId: resetToken.userId,
    after: {
      event: "password_reset_completed",
    },
    entityId: resetToken.userId,
    entityType: "user",
    meta,
    organizationId: resetToken.user.organizationId,
  });

  return {
    message: "Password reset successful. Please sign in with your new password.",
  };
}

export async function verifyEmail(input: VerifyEmailInput, meta?: RequestMeta) {
  const data = verifyEmailSchema.parse(input);
  const tokenHash = hashToken(data.token);
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    include: {
      user: true,
    },
    where: {
      tokenHash,
    },
  });

  if (
    !verificationToken ||
    verificationToken.usedAt ||
    verificationToken.expiresAt <= new Date() ||
    verificationToken.user.deletedAt
  ) {
    throw new AuthError(
      "Invalid or expired email verification token.",
      400,
      "INVALID_VERIFICATION_TOKEN",
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      data: {
        emailVerifiedAt: new Date(),
        status: UserStatus.ACTIVE,
      },
      where: {
        id: verificationToken.userId,
      },
    }),
    prisma.emailVerificationToken.update({
      data: {
        usedAt: new Date(),
      },
      where: {
        id: verificationToken.id,
      },
    }),
  ]);

  await writeAuthAudit({
    action: AuditAction.UPDATE,
    actorId: verificationToken.userId,
    after: {
      email: verificationToken.user.email,
      event: "email_verified",
    },
    entityId: verificationToken.userId,
    entityType: "user",
    meta,
    organizationId: verificationToken.user.organizationId,
  });

  return {
    message: "Email verified. You can now sign in.",
  };
}

export async function getAuthUserById(userId: string) {
  const user = await findAuthUserById(userId);

  if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE || !user.emailVerifiedAt) {
    return null;
  }

  return buildSessionUser(user);
}
