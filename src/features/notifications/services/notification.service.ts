import "server-only";

import {
  ActivityAction,
  EmailLogStatus,
  EmailTemplateCategory,
  EmailTemplateStatus,
  NotificationChannel,
  NotificationStatus,
  Prisma,
  SettingScope,
} from "@prisma/client";

import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import {
  notificationPreferencesSchema,
  notificationToneSchema,
  notificationTopicSchema,
  updateNotificationPreferencesSchema,
  type NotificationPreferencesInput,
  type NotificationToneInput,
  type NotificationTopicInput,
} from "@/features/notifications/schemas/notification.schemas";
import { publishNotificationUpdate } from "@/features/notifications/services/notification-realtime.service";
import type { NotificationPreferences } from "@/features/notifications/types";
import {
  queueBrandedEmail,
  sendSystemTemplateEmail,
} from "@/features/emails/services/email.service";
import { AuthError } from "@/lib/auth/errors";
import { prisma } from "@/lib/db";

const NOTIFICATION_PREFERENCES_KEY = "notifications.preferences";

export const defaultNotificationPreferences = notificationPreferencesSchema.parse({});

type SupportedNotificationChannel = keyof NotificationPreferences["channels"];

type CreateUserNotificationInput = {
  actionUrl?: string;
  body?: string;
  channels?: SupportedNotificationChannel[];
  invoiceId?: string;
  organizationId?: string | null;
  scheduledAt?: Date;
  shipmentId?: string;
  templateKey?: string;
  templateVariables?: Record<string, string | number | boolean | null>;
  title: string;
  tone?: NotificationToneInput;
  topic?: NotificationTopicInput;
  userId: string;
};

type EmailDispatchResult = {
  failed: number;
  sent: number;
};

const defaultNotificationChannels = ["inApp", "email"] satisfies SupportedNotificationChannel[];

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function renderTemplate(
  value: string,
  variables: Record<string, string | number | boolean | null>,
) {
  return Object.entries(variables).reduce(
    (rendered, [key, variable]) => rendered.replaceAll(`{{${key}}}`, String(variable ?? "")),
    value,
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function textToEmailHtml(value?: string | null) {
  const text = value?.trim() || "You have a new Apex Global Logistics notification.";

  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>`)
    .join("");
}

function getMetadataObject(value: Prisma.JsonValue | null): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function getEmailVariables(value: unknown): Record<string, string | undefined> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, variable]) => [
      key,
      variable === null || variable === undefined ? undefined : String(variable),
    ]),
  );
}

function getNotificationEmailCategory(topic: unknown) {
  if (topic === "billing") {
    return EmailTemplateCategory.BILLING;
  }

  if (topic === "shipment_updates") {
    return EmailTemplateCategory.SHIPMENT;
  }

  if (topic === "support") {
    return EmailTemplateCategory.ADMIN;
  }

  return EmailTemplateCategory.SYSTEM;
}

function parseNotificationPreferences(value: Prisma.JsonValue | null): NotificationPreferences {
  const parsed = notificationPreferencesSchema.safeParse(value);

  return parsed.success ? parsed.data : defaultNotificationPreferences;
}

function getPrismaNotificationChannel(channel: SupportedNotificationChannel) {
  const channelMap = {
    email: NotificationChannel.EMAIL,
    inApp: NotificationChannel.IN_APP,
    sms: NotificationChannel.SMS,
    whatsapp: NotificationChannel.WHATSAPP,
  } satisfies Record<SupportedNotificationChannel, NotificationChannel>;

  return channelMap[channel];
}

async function findActiveTemplate({
  key,
  organizationId,
}: {
  key: string;
  organizationId?: string | null;
}) {
  return prisma.emailTemplate.findFirst({
    orderBy: {
      version: "desc",
    },
    where: {
      key,
      organizationId: organizationId ?? null,
      status: EmailTemplateStatus.ACTIVE,
    },
  });
}

async function logNotificationActivity({
  action,
  actorId,
  entityId,
  metadata,
  organizationId,
}: {
  action: ActivityAction;
  actorId?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  organizationId?: string | null;
}) {
  await prisma.activityLog.create({
    data: {
      action,
      actorId,
      entityId,
      entityType: "notification",
      metadata,
      organizationId,
    },
  });
}

export async function getNotificationPreferencesForUser(
  user: Pick<AuthSessionUser, "id">,
): Promise<NotificationPreferences> {
  let setting: { value: Prisma.JsonValue } | null = null;

  try {
    setting = await prisma.setting.findFirst({
      select: {
        value: true,
      },
      where: {
        key: NOTIFICATION_PREFERENCES_KEY,
        scope: SettingScope.USER,
        userId: user.id,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      const safeError = error instanceof Error ? { message: error.message, name: error.name } : {};

      console.warn("Unable to load notification preferences", safeError);
    }

    return defaultNotificationPreferences;
  }

  return parseNotificationPreferences(setting?.value ?? null);
}

export async function updateNotificationPreferencesForUser(
  user: AuthSessionUser,
  input: NotificationPreferencesInput,
) {
  const preferences = updateNotificationPreferencesSchema.parse(input);
  const existingSetting = await prisma.setting.findFirst({
    select: {
      id: true,
    },
    where: {
      key: NOTIFICATION_PREFERENCES_KEY,
      scope: SettingScope.USER,
      userId: user.id,
    },
  });

  if (existingSetting) {
    await prisma.setting.update({
      data: {
        updatedById: user.id,
        value: toJsonValue(preferences),
      },
      where: {
        id: existingSetting.id,
      },
    });
  } else {
    await prisma.setting.create({
      data: {
        key: NOTIFICATION_PREFERENCES_KEY,
        scope: SettingScope.USER,
        updatedById: user.id,
        userId: user.id,
        value: toJsonValue(preferences),
      },
    });
  }

  await logNotificationActivity({
    action: ActivityAction.UPDATE,
    actorId: user.id,
    metadata: {
      key: NOTIFICATION_PREFERENCES_KEY,
    },
    organizationId: user.organizationId,
  });
  await publishNotificationUpdate(user.id);

  return preferences;
}

export async function createUserNotification(input: CreateUserNotificationInput) {
  const preferences = await getNotificationPreferencesForUser({ id: input.userId });
  const topic = notificationTopicSchema.parse(input.topic ?? "system");
  const tone = notificationToneSchema.parse(input.tone ?? "info");

  if (!preferences.topics[topic]) {
    return [];
  }

  const requestedChannels = unique(input.channels ?? defaultNotificationChannels);
  const enabledChannels = requestedChannels.filter((channel) => preferences.channels[channel]);

  if (enabledChannels.length === 0) {
    return [];
  }

  const template =
    input.templateKey && enabledChannels.includes("email")
      ? await findActiveTemplate({
          key: input.templateKey,
          organizationId: input.organizationId,
        })
      : null;
  const templateVariables = input.templateVariables ?? {};
  const emailTitle = template ? renderTemplate(template.subject, templateVariables) : input.title;
  const emailBody = template?.bodyText
    ? renderTemplate(template.bodyText, templateVariables)
    : input.body;
  const notifications = await prisma.$transaction(
    enabledChannels.map((channel) => {
      const metadata = {
        deliveryProvider: channel === "email" ? "queued" : undefined,
        templateKey: input.templateKey,
        templateVariables,
        tone,
        topic,
      };

      return prisma.notification.create({
        data: {
          actionUrl: input.actionUrl,
          body: channel === "email" ? emailBody : input.body,
          channel: getPrismaNotificationChannel(channel),
          emailTemplateId: channel === "email" ? template?.id : undefined,
          invoiceId: input.invoiceId,
          metadata: toJsonValue(metadata),
          organizationId: input.organizationId,
          scheduledAt: input.scheduledAt,
          shipmentId: input.shipmentId,
          status: channel === "inApp" ? NotificationStatus.SENT : NotificationStatus.PENDING,
          title: channel === "email" ? emailTitle : input.title,
          userId: input.userId,
        },
      });
    }),
  );

  await publishNotificationUpdate(input.userId);

  return notifications;
}

export async function setNotificationReadState({
  notificationId,
  read,
  user,
}: {
  notificationId: string;
  read: boolean;
  user: AuthSessionUser;
}) {
  const notification = await prisma.notification.findFirst({
    select: {
      id: true,
      organizationId: true,
      userId: true,
    },
    where: {
      id: notificationId,
      userId: user.id,
    },
  });

  if (!notification) {
    throw new AuthError("Notification not found.", 404, "NOTIFICATION_NOT_FOUND");
  }

  await prisma.notification.update({
    data: {
      readAt: read ? new Date() : null,
      status: read ? NotificationStatus.READ : NotificationStatus.SENT,
    },
    where: {
      id: notification.id,
    },
  });
  await logNotificationActivity({
    action: ActivityAction.UPDATE,
    actorId: user.id,
    entityId: notification.id,
    metadata: {
      read,
    },
    organizationId: notification.organizationId,
  });
  await publishNotificationUpdate(user.id);
}

export async function markAllNotificationsRead(user: AuthSessionUser) {
  await prisma.notification.updateMany({
    data: {
      readAt: new Date(),
      status: NotificationStatus.READ,
    },
    where: {
      channel: NotificationChannel.IN_APP,
      readAt: null,
      userId: user.id,
    },
  });
  await logNotificationActivity({
    action: ActivityAction.UPDATE,
    actorId: user.id,
    metadata: {
      readAll: true,
    },
    organizationId: user.organizationId,
  });
  await publishNotificationUpdate(user.id);
}

export async function dispatchPendingEmailNotifications(take = 25): Promise<EmailDispatchResult> {
  const pendingNotifications = await prisma.notification.findMany({
    include: {
      user: {
        select: {
          email: true,
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take,
    where: {
      channel: NotificationChannel.EMAIL,
      OR: [
        {
          scheduledAt: null,
        },
        {
          scheduledAt: {
            lte: new Date(),
          },
        },
      ],
      status: NotificationStatus.PENDING,
    },
  });

  let sent = 0;
  let failed = 0;

  for (const notification of pendingNotifications) {
    try {
      if (!notification.user?.email) {
        throw new Error("Notification recipient does not have an email address.");
      }

      const metadata = getMetadataObject(notification.metadata);
      const variables = getEmailVariables(metadata.templateVariables);
      const emailLog = await queueBrandedEmail({
        bodyHtml: textToEmailHtml(notification.body),
        category: getNotificationEmailCategory(metadata.topic),
        organizationId: notification.organizationId,
        recipientEmail: notification.user.email,
        recipientName: notification.user.name,
        relatedUserId: notification.user.id,
        shipmentId: notification.shipmentId,
        subject: notification.title,
        templateId: notification.emailTemplateId,
        trackingNumber: getString(metadata.trackingNumber) ?? variables.trackingNumber,
        variables,
      });

      if (!emailLog || emailLog.status !== EmailLogStatus.SENT) {
        throw new Error(emailLog?.failureReason ?? "Email delivery failed.");
      }

      await prisma.notification.update({
        data: {
          metadata: toJsonValue({
            ...metadata,
            deliveryProvider: emailLog.provider,
            emailLogId: emailLog.id,
          }),
          providerMessageId: emailLog.providerMessageId,
          sentAt: new Date(),
          status: NotificationStatus.SENT,
        },
        where: {
          id: notification.id,
        },
      });
      sent += 1;

      if (notification.userId) {
        await publishNotificationUpdate(notification.userId);
      }
    } catch (error) {
      await prisma.notification.update({
        data: {
          failedAt: new Date(),
          failureReason: error instanceof Error ? error.message : "Email notification failed.",
          status: NotificationStatus.FAILED,
        },
        where: {
          id: notification.id,
        },
      });
      failed += 1;

      if (notification.userId) {
        await publishNotificationUpdate(notification.userId);
      }
    }
  }

  return {
    failed,
    sent,
  };
}

export async function notifyShipmentStatusChanged({
  customerId,
  createdById,
  message,
  organizationId,
  shipmentId,
  shipmentNumber,
  status,
}: {
  customerId: string | null;
  createdById: string | null;
  message?: string | null;
  organizationId: string;
  shipmentId: string;
  shipmentNumber: string;
  status: string;
}) {
  const recipientIds = unique([customerId, createdById].filter(Boolean) as string[]);
  const recipients = recipientIds.length
    ? await prisma.user.findMany({
        select: {
          email: true,
          id: true,
          name: true,
        },
        where: {
          id: {
            in: recipientIds,
          },
        },
      })
    : [];
  const templateKey =
    status === "DELIVERED"
      ? "delivered"
      : status === "OUT_FOR_DELIVERY"
        ? "out-for-delivery"
        : status === "HELD"
          ? "customs-hold"
          : status === "IN_TRANSIT"
            ? "shipment-in-transit"
            : "shipment-created";

  await Promise.all(
    recipientIds.map((userId) =>
      createUserNotification({
        actionUrl: `/shipments/${shipmentId}`,
        body: message ?? `Shipment ${shipmentNumber} moved to ${status.replaceAll("_", " ")}.`,
        channels: ["inApp"],
        organizationId,
        shipmentId,
        templateKey: "shipment-status-updated",
        templateVariables: {
          message: message ?? "",
          shipmentNumber,
          status: status.replaceAll("_", " "),
        },
        title: `Shipment ${shipmentNumber} updated`,
        tone: status === "DELIVERED" ? "success" : status === "HELD" ? "warning" : "info",
        topic: "shipment_updates",
        userId,
      }),
    ),
  );
  await Promise.all(
    recipients.map((recipient) =>
      sendSystemTemplateEmail({
        bodyHtml: message ?? `<p>Your shipment {{trackingNumber}} moved to {{shipmentStatus}}.</p>`,
        category: EmailTemplateCategory.SHIPMENT,
        organizationId,
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        relatedUserId: recipient.id,
        shipmentId,
        templateKey,
        trackingNumber: shipmentNumber,
        variables: {
          customerName: recipient.name,
          shipmentStatus: status.replaceAll("_", " "),
          trackingNumber: shipmentNumber,
        },
      }),
    ),
  );
}
