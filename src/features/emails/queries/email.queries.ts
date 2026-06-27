import "server-only";

import { EmailLogStatus, EmailTemplateStatus, type Prisma } from "@prisma/client";

import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import type {
  EmailComposerOptions,
  EmailLogListItem,
  EmailTemplateDetail,
  EmailTemplateListItem,
} from "@/features/emails/types";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";

function canSeeAllOrganizations(user: AuthSessionUser) {
  return user.roles.includes(AUTH_ROLES.SUPER_ADMIN);
}

function getOrganizationFilter(user: AuthSessionUser) {
  if (canSeeAllOrganizations(user)) {
    return {};
  }

  return {
    OR: [
      {
        organizationId: user.organizationId,
      },
      {
        organizationId: null,
      },
    ],
  };
}

function parseVariables(value: Prisma.JsonValue | null) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function mapTemplate(template: {
  category: EmailTemplateListItem["category"];
  id: string;
  isActive: boolean;
  key: string;
  name: string;
  slug: string | null;
  subject: string;
  updatedAt: Date;
  version: number;
}): EmailTemplateListItem {
  return {
    category: template.category,
    id: template.id,
    isActive: template.isActive,
    name: template.name,
    slug: template.slug ?? template.key,
    subject: template.subject,
    updatedAt: template.updatedAt.toISOString(),
    version: template.version,
  };
}

export async function getEmailStudioOverview(user: AuthSessionUser) {
  const where = getOrganizationFilter(user);
  const [templateCount, queuedCount, sentCount, failedCount, recentLogs] = await Promise.all([
    prisma.emailTemplate.count({
      where: {
        ...where,
        deletedAt: null,
      },
    }),
    prisma.emailLog.count({
      where: {
        ...where,
        status: EmailLogStatus.QUEUED,
      },
    }),
    prisma.emailLog.count({
      where: {
        ...where,
        status: EmailLogStatus.SENT,
      },
    }),
    prisma.emailLog.count({
      where: {
        ...where,
        status: EmailLogStatus.FAILED,
      },
    }),
    getEmailLogsForAdmin(user, 6),
  ]);

  return {
    failedCount,
    queuedCount,
    recentLogs,
    sentCount,
    templateCount,
  };
}

export async function getEmailComposerOptions(
  user: AuthSessionUser,
): Promise<EmailComposerOptions> {
  const [recipients, shipments, templates] = await Promise.all([
    prisma.user.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        email: true,
        id: true,
        name: true,
      },
      take: 100,
      where: canSeeAllOrganizations(user)
        ? {
            deletedAt: null,
          }
        : {
            deletedAt: null,
            organizationId: user.organizationId,
          },
    }),
    prisma.shipment.findMany({
      select: {
        customer: {
          select: {
            name: true,
          },
        },
        id: true,
        shipmentNumber: true,
        status: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 100,
      where: canSeeAllOrganizations(user)
        ? {
            deletedAt: null,
          }
        : {
            deletedAt: null,
            organizationId: user.organizationId ?? "00000000-0000-0000-0000-000000000000",
          },
    }),
    prisma.emailTemplate.findMany({
      orderBy: [
        {
          category: "asc",
        },
        {
          name: "asc",
        },
      ],
      where: {
        ...getOrganizationFilter(user),
        deletedAt: null,
        isActive: true,
        status: EmailTemplateStatus.ACTIVE,
      },
    }),
  ]);

  return {
    recipients: recipients.map((recipient) => ({
      email: recipient.email,
      id: recipient.id,
      label: `${recipient.name} <${recipient.email}>`,
      name: recipient.name,
    })),
    shipments: shipments.map((shipment) => ({
      customerName: shipment.customer?.name ?? null,
      id: shipment.id,
      label: `${shipment.shipmentNumber} - ${shipment.status.replaceAll("_", " ")}`,
      shipmentNumber: shipment.shipmentNumber,
      status: shipment.status,
    })),
    templates: templates.map((template) => ({
      bodyHtml: template.bodyHtml,
      category: template.category,
      id: template.id,
      label: template.name,
      slug: template.slug ?? template.key,
      subject: template.subject,
      variables: parseVariables(template.variables),
    })),
  };
}

export async function getEmailTemplatesForAdmin(
  user: AuthSessionUser,
): Promise<EmailTemplateListItem[]> {
  const templates = await prisma.emailTemplate.findMany({
    orderBy: [
      {
        category: "asc",
      },
      {
        name: "asc",
      },
    ],
    select: {
      category: true,
      id: true,
      isActive: true,
      key: true,
      name: true,
      slug: true,
      subject: true,
      updatedAt: true,
      version: true,
    },
    where: {
      ...getOrganizationFilter(user),
      deletedAt: null,
    },
  });

  return templates.map(mapTemplate);
}

export async function getEmailTemplateForAdmin(
  templateId: string,
  user: AuthSessionUser,
): Promise<EmailTemplateDetail | null> {
  const template = await prisma.emailTemplate.findFirst({
    where: {
      ...getOrganizationFilter(user),
      deletedAt: null,
      id: templateId,
    },
  });

  if (!template) {
    return null;
  }

  return {
    ...mapTemplate(template),
    bodyHtml: template.bodyHtml,
    bodyText: template.bodyText,
    preheader: template.preheader,
    variables: parseVariables(template.variables),
  };
}

export async function getEmailLogsForAdmin(
  user: AuthSessionUser,
  take = 50,
): Promise<EmailLogListItem[]> {
  const logs = await prisma.emailLog.findMany({
    select: {
      category: true,
      createdAt: true,
      failureReason: true,
      id: true,
      provider: true,
      recipientEmail: true,
      recipientName: true,
      sentAt: true,
      sentBy: {
        select: {
          name: true,
        },
      },
      shipment: {
        select: {
          shipmentNumber: true,
        },
      },
      template: {
        select: {
          name: true,
        },
      },
      status: true,
      subject: true,
      trackingNumber: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take,
    where: getOrganizationFilter(user),
  });

  return logs.map((log) => ({
    category: log.category,
    createdAt: log.createdAt.toISOString(),
    failureReason: log.failureReason,
    id: log.id,
    provider: log.provider,
    recipientEmail: log.recipientEmail,
    recipientName: log.recipientName,
    sentAt: log.sentAt?.toISOString() ?? null,
    sentBy: log.sentBy?.name ?? null,
    shipmentNumber: log.shipment?.shipmentNumber ?? null,
    status: log.status,
    subject: log.subject,
    templateName: log.template?.name ?? null,
    trackingNumber: log.trackingNumber,
  }));
}
