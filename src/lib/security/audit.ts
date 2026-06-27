import "server-only";

import { AuditAction, type Prisma } from "@prisma/client";

import type { RequestMeta } from "@/lib/auth/request";
import { prisma } from "@/lib/db";

type AuditLogInput = {
  action: AuditAction;
  actorId?: string | null;
  after?: unknown;
  before?: unknown;
  correlationId?: string | null;
  entityId?: string | null;
  entityType: string;
  meta?: RequestMeta;
  organizationId?: string | null;
};

function toJsonValue(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function writeAuditLog({
  action,
  actorId,
  after,
  before,
  correlationId,
  entityId,
  entityType,
  meta,
  organizationId,
}: AuditLogInput) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        actorId,
        after: toJsonValue(after),
        before: toJsonValue(before),
        correlationId,
        entityId,
        entityType,
        ipAddress: meta?.ipAddress,
        organizationId,
        userAgent: meta?.userAgent,
      },
    });
  } catch (error) {
    console.warn("Unable to write audit log", error);
  }
}

export { AuditAction };
