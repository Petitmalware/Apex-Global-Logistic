import { getNotificationCenterSnapshot } from "@/features/notifications/queries/notification.queries";
import { subscribeNotificationUpdates } from "@/features/notifications/services/notification-realtime.service";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";
import { createSseResponse, encodeSseMessage } from "@/lib/realtime/sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await requirePermission(PERMISSIONS.NOTIFICATIONS_READ);
  const initialSnapshot = await getNotificationCenterSnapshot(user);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let unsubscribe: (() => void) | undefined;
      const heartbeat = setInterval(() => {
        if (!closed) {
          controller.enqueue(
            encodeSseMessage({ data: { now: new Date().toISOString() }, event: "heartbeat" }),
          );
        }
      }, 25000);
      const close = () => {
        if (closed) {
          return;
        }

        closed = true;
        clearInterval(heartbeat);
        unsubscribe?.();
        controller.close();
      };
      const sendSnapshot = async () => {
        const snapshot = await getNotificationCenterSnapshot(user);

        if (!closed) {
          controller.enqueue(encodeSseMessage({ data: snapshot, event: "snapshot" }));
        }
      };

      controller.enqueue(encodeSseMessage({ data: initialSnapshot, event: "snapshot" }));
      request.signal.addEventListener("abort", close);

      void subscribeNotificationUpdates(user.id, () => {
        void sendSnapshot();
      }).then((cleanup) => {
        unsubscribe = cleanup;
      });
    },
  });

  return createSseResponse(stream);
}
