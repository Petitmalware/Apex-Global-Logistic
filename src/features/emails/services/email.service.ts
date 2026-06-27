import "server-only";

import {
  AuditAction,
  EmailLogStatus,
  EmailProvider,
  EmailTemplateCategory,
  EmailTemplateStatus,
  type Prisma,
} from "@prisma/client";

import { env } from "@/config/env.server";
import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import {
  adminEmailComposerSchema,
  adminEmailTestSchema,
  type AdminEmailComposerInput,
  type AdminEmailTestInput,
} from "@/features/emails/schemas/email.schemas";
import { htmlToPlainText, sanitizeEmailHtml } from "@/features/emails/services/email-sanitizer";
import { renderBrandedEmail } from "@/features/emails/services/email-renderer";
import { publishEmailQueueMessage } from "@/features/emails/services/email-queue.service";
import { sendEmailWithConfiguredProvider } from "@/features/emails/services/email-provider.service";
import { assertEmailRateLimit } from "@/features/emails/services/email-rate-limit.service";
import {
  buildEmailVariables,
  getShipmentEmailContext,
  replaceEmailVariables,
  type ShipmentEmailContext,
} from "@/features/emails/services/email-variables";
import type { EmailPreview } from "@/features/emails/types";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { AuthError } from "@/lib/auth/errors";
import { prisma } from "@/lib/db";

type PreparedEmail = {
  bodyHtml: string;
  bodyText: string;
  category: EmailTemplateCategory;
  recipientEmail: string;
  recipientName: string | null;
  renderedHtml: string;
  shipment: ShipmentEmailContext | null;
  shipmentId?: string;
  subject: string;
  templateId?: string;
  trackingNumber: string | null;
};

type QueueBrandedEmailInput = {
  bodyHtml: string;
  category?: EmailTemplateCategory;
  organizationId?: string | null;
  recipientEmail: string;
  recipientName?: string | null;
  relatedUserId?: string | null;
  sentById?: string | null;
  shipmentId?: string | null;
  subject: string;
  templateId?: string | null;
  trackingNumber?: string | null;
  variables?: Record<string, string | undefined>;
};

type SendSystemTemplateEmailInput = {
  bodyHtml?: string;
  category?: EmailTemplateCategory;
  organizationId?: string | null;
  recipientEmail: string;
  recipientName?: string | null;
  relatedUserId?: string | null;
  shipmentId?: string | null;
  subject?: string;
  templateKey?: string;
  trackingNumber?: string | null;
  variables?: Record<string, string | undefined>;
};

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function canAccessOrganization(user: AuthSessionUser, organizationId: string | null) {
  return user.roles.includes(AUTH_ROLES.SUPER_ADMIN) || user.organizationId === organizationId;
}

async function createEmailAudit({
  action,
  actorId,
  after,
  entityId,
  organizationId,
}: {
  action: AuditAction;
  actorId?: string | null;
  after?: Prisma.InputJsonValue;
  entityId?: string | null;
  organizationId?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      action,
      actorId,
      after,
      entityId,
      entityType: "email_log",
      organizationId,
    },
  });
}

async function getRecipient(input: AdminEmailComposerInput, actor: AuthSessionUser) {
  if (input.recipientUserId) {
    const user = await prisma.user.findUnique({
      select: {
        email: true,
        id: true,
        name: true,
        organizationId: true,
      },
      where: {
        id: input.recipientUserId,
      },
    });

    if (!user || !canAccessOrganization(actor, user.organizationId)) {
      throw new AuthError("Recipient not found.", 404, "RECIPIENT_NOT_FOUND");
    }

    return {
      email: user.email,
      id: user.id,
      name: user.name,
      organizationId: user.organizationId,
    };
  }

  if (!input.recipientEmail) {
    throw new AuthError("Choose a recipient or enter an email address.", 400, "RECIPIENT_REQUIRED");
  }

  return {
    email: input.recipientEmail,
    id: null,
    name: input.recipientName || null,
    organizationId: actor.organizationId,
  };
}

async function getTemplateForInput(input: AdminEmailComposerInput, actor: AuthSessionUser) {
  if (!input.templateId) {
    return null;
  }

  const template = await prisma.emailTemplate.findUnique({
    where: {
      id: input.templateId,
    },
  });

  if (!template || template.deletedAt || !canAccessOrganization(actor, template.organizationId)) {
    throw new AuthError("Email template not found.", 404, "EMAIL_TEMPLATE_NOT_FOUND");
  }

  return template;
}

async function getShipmentForInput(shipmentId: string | undefined, actor: AuthSessionUser) {
  if (!shipmentId) {
    return null;
  }

  const shipment = await prisma.shipment.findUnique({
    select: {
      deletedAt: true,
      id: true,
      organizationId: true,
      shipmentNumber: true,
    },
    where: {
      id: shipmentId,
    },
  });

  if (!shipment || shipment.deletedAt || !canAccessOrganization(actor, shipment.organizationId)) {
    throw new AuthError("Shipment not found.", 404, "SHIPMENT_NOT_FOUND");
  }

  return shipment;
}

async function prepareAdminEmail(
  rawInput: AdminEmailComposerInput,
  actor: AuthSessionUser,
): Promise<PreparedEmail> {
  const input = adminEmailComposerSchema.parse(rawInput);
  const [recipient, template, shipmentRecord] = await Promise.all([
    getRecipient(input, actor),
    getTemplateForInput(input, actor),
    getShipmentForInput(input.shipmentId, actor),
  ]);
  const shipmentContext = shipmentRecord ? await getShipmentEmailContext(shipmentRecord.id) : null;
  const trackingNumber =
    input.trackingNumber ||
    shipmentContext?.trackingNumber ||
    shipmentRecord?.shipmentNumber ||
    null;
  const variables = buildEmailVariables({
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    shipment: shipmentContext,
    variables: input.variables,
  });
  const subject = replaceEmailVariables(input.subject || template?.subject || "", variables);
  const rawBody = replaceEmailVariables(input.bodyHtml || template?.bodyHtml || "", variables);
  const bodyHtml = sanitizeEmailHtml(rawBody);
  const bodyText = htmlToPlainText(bodyHtml);
  const shipment = shipmentContext
    ? {
        destinationCity: shipmentContext.destinationCity,
        estimatedDeliveryDate: shipmentContext.estimatedDeliveryDate,
        originCity: shipmentContext.originCity,
        shipmentNumber: trackingNumber,
        shipmentStatus: shipmentContext.shipmentStatus,
      }
    : null;

  return {
    bodyHtml,
    bodyText,
    category: input.category,
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    renderedHtml: renderBrandedEmail({
      contentHtml: bodyHtml,
      shipment,
      subject,
      trackingNumber,
    }),
    shipment,
    shipmentId: shipmentRecord?.id,
    subject,
    templateId: template?.id,
    trackingNumber,
  };
}

async function processQueuedEmailLog(emailLogId: string) {
  const emailLog = await prisma.emailLog.findUnique({
    where: {
      id: emailLogId,
    },
  });

  if (!emailLog || emailLog.status !== EmailLogStatus.QUEUED) {
    return emailLog;
  }

  try {
    const result = await sendEmailWithConfiguredProvider({
      html: emailLog.bodyHtml,
      recipientEmail: emailLog.recipientEmail,
      recipientName: emailLog.recipientName,
      subject: emailLog.subject,
      text: emailLog.bodyText,
    });

    const sentLog = await prisma.emailLog.update({
      data: {
        provider: result.provider,
        providerMessageId: result.messageId,
        providerResponse: toJsonValue(result.response),
        sentAt: new Date(),
        status: EmailLogStatus.SENT,
      },
      where: {
        id: emailLog.id,
      },
    });

    await createEmailAudit({
      action: AuditAction.SYSTEM,
      actorId: emailLog.sentById,
      after: {
        provider: result.provider,
        providerMessageId: result.messageId,
        status: EmailLogStatus.SENT,
      },
      entityId: emailLog.id,
      organizationId: emailLog.organizationId,
    });

    return sentLog;
  } catch (error) {
    const failedLog = await prisma.emailLog.update({
      data: {
        failedAt: new Date(),
        failureReason: error instanceof Error ? error.message : "Email delivery failed.",
        status: EmailLogStatus.FAILED,
      },
      where: {
        id: emailLog.id,
      },
    });

    await createEmailAudit({
      action: AuditAction.SYSTEM,
      actorId: emailLog.sentById,
      after: {
        failureReason: failedLog.failureReason,
        status: EmailLogStatus.FAILED,
      },
      entityId: emailLog.id,
      organizationId: emailLog.organizationId,
    });

    return failedLog;
  }
}

async function queuePreparedEmail({
  actor,
  isTest = false,
  prepared,
}: {
  actor?: AuthSessionUser;
  isTest?: boolean;
  prepared: PreparedEmail;
}) {
  if (actor) {
    assertEmailRateLimit(actor.id);
  }

  const emailLog = await prisma.emailLog.create({
    data: {
      bodyHtml: prepared.renderedHtml,
      bodyText: prepared.bodyText,
      category: prepared.category,
      metadata: toJsonValue({
        isTest,
        source: actor ? "admin-email-studio" : "system",
      }),
      organizationId: actor?.organizationId,
      provider: EmailProvider.CONSOLE,
      queuedAt: new Date(),
      recipientEmail: prepared.recipientEmail,
      recipientName: prepared.recipientName,
      sentById: actor?.id,
      shipmentId: prepared.shipmentId,
      status: EmailLogStatus.QUEUED,
      subject: isTest ? `[Test] ${prepared.subject}` : prepared.subject,
      templateId: prepared.templateId,
      trackingNumber: prepared.trackingNumber,
    },
  });

  await createEmailAudit({
    action: AuditAction.CREATE,
    actorId: actor?.id,
    after: {
      isTest,
      recipientEmail: prepared.recipientEmail,
      status: EmailLogStatus.QUEUED,
      subject: emailLog.subject,
    },
    entityId: emailLog.id,
    organizationId: actor?.organizationId,
  });
  await publishEmailQueueMessage(emailLog.id);

  return processQueuedEmailLog(emailLog.id);
}

export async function previewAdminEmail(
  rawInput: AdminEmailComposerInput,
  actor: AuthSessionUser,
): Promise<EmailPreview> {
  const prepared = await prepareAdminEmail(rawInput, actor);

  await createEmailAudit({
    action: AuditAction.SYSTEM,
    actorId: actor.id,
    after: {
      recipientEmail: prepared.recipientEmail,
      subject: prepared.subject,
      type: "preview",
    },
    organizationId: actor.organizationId,
  });

  return {
    bodyHtml: prepared.renderedHtml,
    recipient: prepared.recipientName
      ? `${prepared.recipientName} <${prepared.recipientEmail}>`
      : prepared.recipientEmail,
    subject: prepared.subject,
  };
}

export async function sendAdminEmail(rawInput: AdminEmailComposerInput, actor: AuthSessionUser) {
  const prepared = await prepareAdminEmail(rawInput, actor);

  return queuePreparedEmail({
    actor,
    prepared,
  });
}

export async function sendAdminTestEmail(rawInput: AdminEmailTestInput, actor: AuthSessionUser) {
  const input = adminEmailTestSchema.parse(rawInput);
  const prepared = await prepareAdminEmail(
    {
      ...input,
      recipientEmail: input.testRecipientEmail,
      recipientName: "Test recipient",
      recipientUserId: undefined,
    },
    actor,
  );

  return queuePreparedEmail({
    actor,
    isTest: true,
    prepared,
  });
}

export async function queueBrandedEmail(input: QueueBrandedEmailInput) {
  const shipmentContext = await getShipmentEmailContext(input.shipmentId ?? undefined);
  const variables = buildEmailVariables({
    recipientEmail: input.recipientEmail,
    recipientName: input.recipientName,
    shipment: shipmentContext,
    variables: input.variables,
  });
  const subject = replaceEmailVariables(input.subject, variables);
  const bodyHtml = sanitizeEmailHtml(replaceEmailVariables(input.bodyHtml, variables));
  const bodyText = htmlToPlainText(bodyHtml);
  const trackingNumber =
    input.trackingNumber ||
    shipmentContext?.trackingNumber ||
    shipmentContext?.shipmentNumber ||
    null;
  const renderedHtml = renderBrandedEmail({
    contentHtml: bodyHtml,
    shipment: shipmentContext
      ? {
          destinationCity: shipmentContext.destinationCity,
          estimatedDeliveryDate: shipmentContext.estimatedDeliveryDate,
          originCity: shipmentContext.originCity,
          shipmentNumber: trackingNumber,
          shipmentStatus: shipmentContext.shipmentStatus,
        }
      : null,
    subject,
    trackingNumber,
  });
  const emailLog = await prisma.emailLog.create({
    data: {
      bodyHtml: renderedHtml,
      bodyText,
      category: input.category ?? EmailTemplateCategory.SYSTEM,
      metadata: toJsonValue({
        source: "system",
      }),
      organizationId: input.organizationId,
      provider: EmailProvider.CONSOLE,
      queuedAt: new Date(),
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName,
      relatedUserId: input.relatedUserId,
      sentById: input.sentById,
      shipmentId: input.shipmentId,
      status: EmailLogStatus.QUEUED,
      subject,
      templateId: input.templateId,
      trackingNumber,
    },
  });

  await createEmailAudit({
    action: AuditAction.CREATE,
    actorId: input.sentById,
    after: {
      recipientEmail: input.recipientEmail,
      source: "system",
      status: EmailLogStatus.QUEUED,
      subject,
    },
    entityId: emailLog.id,
    organizationId: input.organizationId,
  });
  await publishEmailQueueMessage(emailLog.id);

  return processQueuedEmailLog(emailLog.id);
}

export async function sendSystemTemplateEmail(input: SendSystemTemplateEmailInput) {
  const template = input.templateKey
    ? await prisma.emailTemplate.findFirst({
        orderBy: {
          version: "desc",
        },
        where: {
          key: input.templateKey,
          organizationId: input.organizationId ?? null,
          status: EmailTemplateStatus.ACTIVE,
        },
      })
    : null;

  return queueBrandedEmail({
    bodyHtml: input.bodyHtml ?? template?.bodyHtml ?? "<p>You have a new update.</p>",
    category: input.category ?? template?.category ?? EmailTemplateCategory.SYSTEM,
    organizationId: input.organizationId,
    recipientEmail: input.recipientEmail,
    recipientName: input.recipientName,
    relatedUserId: input.relatedUserId,
    shipmentId: input.shipmentId,
    subject: input.subject ?? template?.subject ?? "Apex Global Logistics update",
    templateId: template?.id,
    trackingNumber: input.trackingNumber,
    variables: input.variables,
  });
}

export function getEmailSenderAddress() {
  return env.EMAIL_FROM;
}
