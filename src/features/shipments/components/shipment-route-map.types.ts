import type { ShipmentTrackingTimelineEvent } from "@/features/shipments/types";

export type ShipmentRouteCheckpoint = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  message: string | null;
  occurredAt: string;
  status: ShipmentTrackingTimelineEvent["shipmentStatus"];
};
