import { NextResponse } from "next/server";

import { getPublicShipmentTrackingSnapshot } from "@/features/shipments/queries/shipment.queries";
import { subscribeShipmentTrackingUpdates } from "@/features/shipments/services/shipment-realtime.service";
import { createSseResponse, encodeSseMessage } from "@/lib/realtime/sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PublicTrackingStreamContext = {
  params: Promise<{
    reference: string;
  }>;
};

export async function GET(request: Request, { params }: PublicTrackingStreamContext) {
  const { reference } = await params;
  const decodedReference = decodeURIComponent(reference);
  const initialSnapshot = await getPublicShipmentTrackingSnapshot(decodedReference);

  if (!initialSnapshot) {
    return NextResponse.json({ message: "Shipment not found." }, { status: 404 });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let unsubscribe: (() => void) | undefined;
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
        const snapshot = await getPublicShipmentTrackingSnapshot(decodedReference);

        if (!closed && snapshot) {
          controller.enqueue(encodeSseMessage({ data: snapshot, event: "snapshot" }));
        }
      };
      const heartbeat = setInterval(() => {
        if (!closed) {
          controller.enqueue(
            encodeSseMessage({ data: { now: new Date().toISOString() }, event: "heartbeat" }),
          );
        }
      }, 25000);

      controller.enqueue(encodeSseMessage({ data: initialSnapshot, event: "snapshot" }));
      request.signal.addEventListener("abort", close);

      void subscribeShipmentTrackingUpdates(initialSnapshot.id, () => {
        void sendSnapshot();
      }).then((cleanup) => {
        unsubscribe = cleanup;
      });
    },
  });

  return createSseResponse(stream);
}
