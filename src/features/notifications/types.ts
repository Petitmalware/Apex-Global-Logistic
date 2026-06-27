import type { NotificationChannel, NotificationStatus } from "@prisma/client";

export type NotificationTone = "danger" | "info" | "success" | "warning";

export type NotificationTopic = "billing" | "security" | "shipment_updates" | "support" | "system";

export type NotificationPreferences = {
  channels: {
    email: boolean;
    inApp: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  digestFrequency: "daily" | "hourly" | "instant";
  quietHours: {
    enabled: boolean;
    end: string;
    start: string;
  };
  topics: Record<NotificationTopic, boolean>;
};

export type NotificationItem = {
  actionUrl: string | null;
  body: string | null;
  channel: NotificationChannel;
  createdAt: string;
  id: string;
  invoiceId: string | null;
  isRead: boolean;
  readAt: string | null;
  shipmentId: string | null;
  status: NotificationStatus;
  title: string;
  tone: NotificationTone;
  topic: NotificationTopic;
};

export type NotificationCenterSnapshot = {
  history: NotificationItem[];
  notifications: NotificationItem[];
  unreadCount: number;
  updatedAt: string;
};

export type NotificationActionState = {
  message?: string;
  status: "idle" | "error" | "success";
};

export const initialNotificationActionState: NotificationActionState = {
  status: "idle",
};
