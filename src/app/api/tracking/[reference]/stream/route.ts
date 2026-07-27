import { NextResponse, type NextRequest } from "next/server";

import {
  getPublicShipmentTrackingAccess,
  getPublicShipmentTrackingSnapshot,
} from "@/features/shipments/queries/shipment.queries";
import {
  PUBLIC_TRACKING_ACCESS_COOKIE_NAME,
  hasPublicTrackingAccess,
} from "@/features/shipments/services/public-tracking-access.service";
import { subscribeShipmentTrackingUpdates } from "@/features/shipments/services/shipment-realtime.service";
import { getDatabaseUnavailableMessage, isDatabaseUnavailableError } from "@/lib/db-errors";
import { createSseResponse, encodeSseMessage } from "@/lib/realtime/sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PublicTrackingStreamContext = {
  params: Promise<{
    reference: string;
  }>;
};

export async function GET(request: NextRequest, { params }: PublicTrackingStreamContext) {
  const { reference } = await params;
  const decodedReference = decodeURIComponent(reference);
  let includeSensitiveDetails = false;
  let initialSnapshot;

  try {
    const access = await getPublicShipmentTrackingAccess(decodedReference);

    if (!access) {
      return NextResponse.json({ message: "Shipment not found." }, { status: 404 });
    }

    includeSensitiveDetails =
      !access.publicTrackingPinRequired ||
      hasPublicTrackingAccess(
        request.cookies.get(PUBLIC_TRACKING_ACCESS_COOKIE_NAME)?.value,
        access.shipmentId,
      );
    initialSnapshot = await getPublicShipmentTrackingSnapshot(decodedReference, {
      includeSensitiveDetails,
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ message: getDatabaseUnavailableMessage() }, { status: 503 });
    }

    throw error;
  }

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
        const snapshot = await getPublicShipmentTrackingSnapshot(decodedReference, {
          includeSensitiveDetails,
        }).catch(() => null);

        if (!closed && snapshot) {
          controller.enqueue(encodeSseMessage({ data: snapshot, event: "snapshot" }));
        }
      };
      const heartbeat = setInterval(() => {
        if (!closed) {
          controller.enqueue(
            encodeSseMessage({ data: { now: new Date().toISOString() }, event: "heartbeat" }),
          );
          // Route progress is derived from stored timestamps, so this refreshes the marker without
          // calling geocoding or routing providers again.
          void sendSnapshot();
        }
      }, 25000);

      controller.enqueue(encodeSseMessage({ data: initialSnapshot, event: "snapshot" }));
      request.signal.addEventListener("abort", close);

      void subscribeShipmentTrackingUpdates(initialSnapshot.id, () => {
        void sendSnapshot();
      })
        .then((cleanup) => {
          unsubscribe = cleanup;
        })
        .catch(() => {
          unsubscribe = undefined;
        });
    },
  });

  return createSseResponse(stream);
}
