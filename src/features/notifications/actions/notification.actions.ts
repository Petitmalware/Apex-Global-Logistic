"use server";

import { revalidatePath } from "next/cache";

import { updateNotificationPreferencesSchema } from "@/features/notifications/schemas/notification.schemas";
import {
  markAllNotificationsRead,
  setNotificationReadState,
  updateNotificationPreferencesForUser,
} from "@/features/notifications/services/notification.service";
import type { NotificationActionState } from "@/features/notifications/types";
import { AuthError } from "@/lib/auth/errors";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function getErrorState(error: unknown): NotificationActionState {
  if (error instanceof AuthError) {
    return {
      message: error.message,
      status: "error",
    };
  }

  return {
    message: "Unable to update notifications. Please try again.",
    status: "error",
  };
}

export async function markNotificationReadAction(notificationId: string) {
  const user = await requirePermission(PERMISSIONS.NOTIFICATIONS_READ);

  await setNotificationReadState({
    notificationId,
    read: true,
    user,
  });
  revalidatePath("/notifications");
}

export async function markNotificationUnreadAction(notificationId: string) {
  const user = await requirePermission(PERMISSIONS.NOTIFICATIONS_READ);

  await setNotificationReadState({
    notificationId,
    read: false,
    user,
  });
  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction() {
  const user = await requirePermission(PERMISSIONS.NOTIFICATIONS_READ);

  await markAllNotificationsRead(user);
  revalidatePath("/notifications");
}

export async function updateNotificationPreferencesAction(
  _previousState: NotificationActionState,
  formData: FormData,
): Promise<NotificationActionState> {
  const user = await requirePermission(PERMISSIONS.NOTIFICATIONS_READ);
  const parsed = updateNotificationPreferencesSchema.safeParse({
    channels: {
      email: getBoolean(formData, "channels.email"),
      inApp: getBoolean(formData, "channels.inApp"),
      sms: getBoolean(formData, "channels.sms"),
      whatsapp: getBoolean(formData, "channels.whatsapp"),
    },
    digestFrequency: getString(formData, "digestFrequency") || "instant",
    quietHours: {
      enabled: getBoolean(formData, "quietHours.enabled"),
      end: getString(formData, "quietHours.end") || "07:00",
      start: getString(formData, "quietHours.start") || "22:00",
    },
    topics: {
      billing: getBoolean(formData, "topics.billing"),
      security: getBoolean(formData, "topics.security"),
      shipment_updates: getBoolean(formData, "topics.shipment_updates"),
      support: getBoolean(formData, "topics.support"),
      system: getBoolean(formData, "topics.system"),
    },
  });

  if (!parsed.success) {
    return {
      message: "Please review your notification preferences.",
      status: "error",
    };
  }

  try {
    await updateNotificationPreferencesForUser(user, parsed.data);
  } catch (error) {
    return getErrorState(error);
  }

  revalidatePath("/notifications");

  return {
    message: "Notification preferences saved.",
    status: "success",
  };
}
