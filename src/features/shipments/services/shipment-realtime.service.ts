import "server-only";

import type { ShipmentStatus } from "@prisma/client";

import { publishRealtimeMessage, subscribeRealtimeMessage } from "@/lib/realtime/redis-pubsub";
import { prisma } from "@/lib/db";

export type ShipmentTrackingRealtimeMessage = {
  shipmentId: string;
  shipmentNumber: string;
  status: ShipmentStatus;
  type: "shipment.tracking.updated";
  updatedAt: string;
};

function getShipmentTrackingChannel(shipmentId: string) {
  return `shipments:${shipmentId}:tracking`;
}

export async function publishShipmentTrackingUpdate(shipmentId: string) {
  const shipment = await prisma.shipment.findUnique({
    select: {
      deletedAt: true,
      id: true,
      shipmentNumber: true,
      status: true,
      updatedAt: true,
    },
    where: {
      id: shipmentId,
    },
  });

  if (!shipment || shipment.deletedAt) {
    return;
  }

  await publishRealtimeMessage(getShipmentTrackingChannel(shipment.id), {
    shipmentId: shipment.id,
    shipmentNumber: shipment.shipmentNumber,
    status: shipment.status,
    type: "shipment.tracking.updated",
    updatedAt: shipment.updatedAt.toISOString(),
  } satisfies ShipmentTrackingRealtimeMessage);
}

export async function subscribeShipmentTrackingUpdates(
  shipmentId: string,
  onMessage: (message: ShipmentTrackingRealtimeMessage) => void,
) {
  return subscribeRealtimeMessage<ShipmentTrackingRealtimeMessage>(
    getShipmentTrackingChannel(shipmentId),
    onMessage,
  );
}
