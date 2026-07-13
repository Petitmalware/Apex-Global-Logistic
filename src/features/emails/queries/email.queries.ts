import "server-only";

import { EmailLogStatus, EmailTemplateStatus, type Prisma } from "@prisma/client";

import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import type {
  EmailComposerOptions,
  EmailLogListItem,
  EmailTemplateDetail,
  EmailTemplateListItem,
} from "@/features/emails/types";
import {
  getBuiltInClientEmailTemplates,
  type BuiltInClientEmailTemplate,
} from "@/features/emails/data/built-in-client-email-templates";
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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function getManualRecipient(metadata: Prisma.JsonValue | null) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const value = "manualRecipient" in metadata ? metadata.manualRecipient : null;

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const email = "email" in value && typeof value.email === "string" ? value.email : null;
  const name = "name" in value && typeof value.name === "string" ? value.name : null;

  return email || name ? { email, name } : null;
}

function builtInClientEmailToComposerOption(template: BuiltInClientEmailTemplate) {
  return {
    bodyHtml: template.bodyHtml,
    category: template.category,
    defaultVariables: template.defaultVariables,
    id: `built-in:${template.id}`,
    label: `Built-in mail - ${template.name}`,
    slug: `built-in-${template.slug}`,
    source: "built_in_client_email" as const,
    subject: template.subject,
    templateId: null,
    variables: template.variables,
  };
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
    canEdit: true,
    category: template.category,
    composeTemplateId: template.id,
    id: template.id,
    isActive: template.isActive,
    name: template.name,
    slug: template.slug ?? template.key,
    source: "database",
    subject: template.subject,
    updatedAt: template.updatedAt.toISOString(),
    version: template.version,
  };
}

function builtInClientEmailToTemplateListItem(
  template: BuiltInClientEmailTemplate,
): EmailTemplateListItem {
  return {
    canEdit: false,
    category: template.category,
    composeTemplateId: `built-in:${template.id}`,
    id: `built-in:${template.id}`,
    isActive: template.isActive,
    name: `Built-in mail - ${template.name}`,
    slug: `built-in-${template.slug}`,
    source: "built_in_client_email",
    subject: template.subject,
    updatedAt: new Date(0).toISOString(),
    version: 1,
  };
}

export async function getEmailStudioOverview(user: AuthSessionUser) {
  const where = getOrganizationFilter(user);
  const builtInTemplateCount = getBuiltInClientEmailTemplates().length;
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
    templateCount: templateCount + builtInTemplateCount,
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
            email: true,
            name: true,
          },
        },
        id: true,
        metadata: true,
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
  const builtInTemplates = getBuiltInClientEmailTemplates();

  return {
    recipients: recipients.map((recipient) => ({
      email: recipient.email,
      id: recipient.id,
      label: `${recipient.name} <${recipient.email}>`,
      name: recipient.name,
    })),
    shipments: shipments.map((shipment) => {
      const manualRecipient = getManualRecipient(shipment.metadata);
      const customerName =
        shipment.customer?.name ?? manualRecipient?.name ?? manualRecipient?.email ?? null;

      return {
        customerEmail: shipment.customer?.email ?? manualRecipient?.email ?? null,
        customerName,
        id: shipment.id,
        label: `${shipment.shipmentNumber} - ${
          customerName ?? shipment.status.replaceAll("_", " ")
        }`,
        shipmentNumber: shipment.shipmentNumber,
        status: shipment.status,
      };
    }),
    templates: [
      ...builtInTemplates.map(builtInClientEmailToComposerOption),
      ...templates.map((template) => ({
        bodyHtml: template.bodyHtml,
        category: template.category,
        id: template.id,
        label: template.name,
        slug: template.slug ?? template.key,
        source: "email" as const,
        subject: template.subject,
        templateId: template.id,
        variables: parseVariables(template.variables),
      })),
    ],
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
  const builtInTemplates = getBuiltInClientEmailTemplates();

  return [
    ...builtInTemplates
      .filter((template) => template.isActive)
      .map(builtInClientEmailToTemplateListItem),
    ...templates.map(mapTemplate),
  ];
}

export async function getEditableEmailTemplatesForAdmin(
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
  if (!isUuid(templateId)) {
    return null;
  }

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
