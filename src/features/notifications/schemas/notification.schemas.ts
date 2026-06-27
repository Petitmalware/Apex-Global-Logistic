import { z } from "zod";

export const notificationTopicSchema = z.enum([
  "billing",
  "security",
  "shipment_updates",
  "support",
  "system",
]);

export const notificationToneSchema = z.enum(["danger", "info", "success", "warning"]);

const defaultNotificationChannels = {
  email: true,
  inApp: true,
  sms: false,
  whatsapp: false,
};

const defaultNotificationQuietHours = {
  enabled: false,
  end: "07:00",
  start: "22:00",
};

const defaultNotificationTopics = {
  billing: true,
  security: true,
  shipment_updates: true,
  support: true,
  system: true,
};

export const notificationPreferencesSchema = z.object({
  channels: z
    .object({
      email: z.boolean().default(true),
      inApp: z.boolean().default(true),
      sms: z.boolean().default(false),
      whatsapp: z.boolean().default(false),
    })
    .default(defaultNotificationChannels),
  digestFrequency: z.enum(["daily", "hourly", "instant"]).default("instant"),
  quietHours: z
    .object({
      enabled: z.boolean().default(false),
      end: z
        .string()
        .regex(/^\d{2}:\d{2}$/)
        .default("07:00"),
      start: z
        .string()
        .regex(/^\d{2}:\d{2}$/)
        .default("22:00"),
    })
    .default(defaultNotificationQuietHours),
  topics: z
    .object({
      billing: z.boolean().default(true),
      security: z.boolean().default(true),
      shipment_updates: z.boolean().default(true),
      support: z.boolean().default(true),
      system: z.boolean().default(true),
    })
    .default(defaultNotificationTopics),
});

export const updateNotificationPreferencesSchema = notificationPreferencesSchema;

export const updateNotificationReadStateSchema = z.object({
  read: z.boolean().default(true),
});

export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type NotificationToneInput = z.infer<typeof notificationToneSchema>;
export type NotificationTopicInput = z.infer<typeof notificationTopicSchema>;
