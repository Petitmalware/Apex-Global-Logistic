import "server-only";

import { NotificationChannel, type Notification, type Prisma } from "@prisma/client";

import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import {
  notificationToneSchema,
  notificationTopicSchema,
} from "@/features/notifications/schemas/notification.schemas";
import type {
  NotificationCenterSnapshot,
  NotificationItem,
  NotificationTone,
  NotificationTopic,
} from "@/features/notifications/types";
import { prisma } from "@/lib/db";

type NotificationMetadata = {
  tone?: unknown;
  topic?: unknown;
};
type NotificationRecord = Pick<
  Notification,
  | "actionUrl"
  | "body"
  | "channel"
  | "createdAt"
  | "id"
  | "invoiceId"
  | "metadata"
  | "readAt"
  | "shipmentId"
  | "status"
  | "title"
>;

const notificationSelect = {
  actionUrl: true,
  body: true,
  channel: true,
  createdAt: true,
  id: true,
  invoiceId: true,
  metadata: true,
  readAt: true,
  shipmentId: true,
  status: true,
  title: true,
} satisfies Prisma.NotificationSelect;

function getMetadata(value: Prisma.JsonValue | null): NotificationMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as NotificationMetadata;
}

function getTone(notification: NotificationRecord): NotificationTone {
  const metadata = getMetadata(notification.metadata);
  const parsedTone = notificationToneSchema.safeParse(metadata.tone);

  if (parsedTone.success) {
    return parsedTone.data;
  }

  if (notification.status === "FAILED") {
    return "danger";
  }

  if (notification.channel === NotificationChannel.EMAIL) {
    return "info";
  }

  return "info";
}

function getTopic(notification: NotificationRecord): NotificationTopic {
  const metadata = getMetadata(notification.metadata);
  const parsedTopic = notificationTopicSchema.safeParse(metadata.topic);

  return parsedTopic.success ? parsedTopic.data : "system";
}

function mapNotification(notification: NotificationRecord): NotificationItem {
  return {
    actionUrl: notification.actionUrl,
    body: notification.body,
    channel: notification.channel,
    createdAt: notification.createdAt.toISOString(),
    id: notification.id,
    invoiceId: notification.invoiceId,
    isRead: Boolean(notification.readAt) || notification.status === "READ",
    readAt: notification.readAt?.toISOString() ?? null,
    shipmentId: notification.shipmentId,
    status: notification.status,
    title: notification.title,
    tone: getTone(notification),
    topic: getTopic(notification),
  };
}

export async function getNotificationCenterSnapshot(
  user: AuthSessionUser,
): Promise<NotificationCenterSnapshot> {
  try {
    const [notifications, history, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        orderBy: {
          createdAt: "desc",
        },
        select: notificationSelect,
        take: 8,
        where: {
          channel: NotificationChannel.IN_APP,
          userId: user.id,
        },
      }),
      prisma.notification.findMany({
        orderBy: {
          createdAt: "desc",
        },
        select: notificationSelect,
        take: 50,
        where: {
          userId: user.id,
        },
      }),
      prisma.notification.count({
        where: {
          channel: NotificationChannel.IN_APP,
          readAt: null,
          userId: user.id,
        },
      }),
    ]);

    return {
      history: history.map(mapNotification),
      notifications: notifications.map(mapNotification),
      unreadCount,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (process.env.APP_ENV === "development") {
      console.warn("Unable to load notification center snapshot", {
        message: error instanceof Error ? error.message : "Unknown notification query error",
        name: error instanceof Error ? error.name : typeof error,
      });
    }

    return {
      history: [],
      notifications: [],
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    };
  }
}
