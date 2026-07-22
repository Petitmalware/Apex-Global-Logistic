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

export type ShipmentEstimatedRoute = {
  destination: {
    label: string;
    latitude: number;
    longitude: number;
  };
  estimatedPosition: {
    latitude: number;
    longitude: number;
  };
  origin: {
    label: string;
    latitude: number;
    longitude: number;
  };
  progressPercent: number;
};
