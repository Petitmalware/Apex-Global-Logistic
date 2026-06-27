import "server-only";

import { publishRealtimeMessage, subscribeRealtimeMessage } from "@/lib/realtime/redis-pubsub";

export type NotificationRealtimeMessage = {
  emittedAt: string;
  type: "notifications.changed";
  userId: string;
};

function getNotificationChannel(userId: string) {
  return `notifications:${userId}`;
}

export async function publishNotificationUpdate(userId: string) {
  await publishRealtimeMessage(getNotificationChannel(userId), {
    emittedAt: new Date().toISOString(),
    type: "notifications.changed",
    userId,
  } satisfies NotificationRealtimeMessage);
}

export async function subscribeNotificationUpdates(
  userId: string,
  onMessage: (message: NotificationRealtimeMessage) => void,
) {
  return subscribeRealtimeMessage<NotificationRealtimeMessage>(
    getNotificationChannel(userId),
    onMessage,
  );
}
