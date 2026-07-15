import type { PetTransportStatus, ShipmentStatus, TrackingEventType } from "@prisma/client";

export const shipmentStatusLabels = {
  BOOKED: "Order received",
  CANCELLED: "Cancelled",
  DELIVERED: "Delivered",
  DRAFT: "Draft",
  HELD: "On hold",
  IN_TRANSIT: "In transit",
  PENDING_PICKUP: "Pending pickup",
  RETURNED: "Returned to sender",
} satisfies Record<ShipmentStatus, string>;

export const trackingEventLabels = {
  CANCELLED: "Cancelled",
  CHECKED_IN: "Facility check-in",
  CREATED: "Shipment created",
  CUSTOMS_HOLD: "Customs hold",
  DELAYED: "Delayed",
  DELIVERED: "Delivered",
  EXCEPTION: "Exception",
  IN_TRANSIT: "In transit",
  OUT_FOR_DELIVERY: "Out for delivery",
  PICKED_UP: "Picked up",
} satisfies Record<TrackingEventType, string>;

export const petTransportStatusLabels = {
  AWAITING_PAYMENT: "Awaiting payment",
  CANCELLED: "Cancelled",
  CLEARED: "Cleared for travel",
  DELIVERED: "Delivered",
  DOCUMENTATION_PENDING: "Documentation pending",
  IN_TRANSIT: "In transit",
  ON_HOLD: "On hold",
  OUT_FOR_DELIVERY: "Out for delivery",
  READY_FOR_TRANSPORT: "Ready for transport",
  REQUESTED: "Pending review",
} satisfies Record<PetTransportStatus, string>;

export function formatShipmentStatus(status: ShipmentStatus) {
  return shipmentStatusLabels[status];
}

export function formatTrackingEventType(eventType: TrackingEventType) {
  return trackingEventLabels[eventType];
}

export function formatPetTransportStatus(status: PetTransportStatus) {
  return petTransportStatusLabels[status];
}
