import "server-only";

import { publishRealtimeMessage } from "@/lib/realtime/redis-pubsub";

const EMAIL_QUEUE_CHANNEL = "emails:queue";

export type EmailQueueMessage = {
  emailLogId: string;
  enqueuedAt: string;
  type: "email.queued";
};

export async function publishEmailQueueMessage(emailLogId: string) {
  await publishRealtimeMessage(EMAIL_QUEUE_CHANNEL, {
    emailLogId,
    enqueuedAt: new Date().toISOString(),
    type: "email.queued",
  } satisfies EmailQueueMessage);
}
