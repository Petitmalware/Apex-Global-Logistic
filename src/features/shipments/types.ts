import type {
  PackageStatus,
  PackageType,
  ShipmentMode,
  ShipmentPriority,
  ShipmentStatus,
  TrackingEventType,
} from "@prisma/client";

export type ShipmentActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  status: "error" | "idle" | "success";
};

export const initialShipmentActionState: ShipmentActionState = {
  status: "idle",
};

export type ShipmentPackageView = {
  barcode: string | null;
  currency: string;
  declaredValue: string | null;
  description: string | null;
  fragile: boolean;
  hazardous: boolean;
  heightCm: string | null;
  id: string;
  lengthCm: string | null;
  packageNumber: string;
  photos: Array<{
    caption: string | null;
    createdAt: string;
    fileName: string;
    fileSizeBytes: number;
    id: string;
    mimeType: string;
    uploadedBy: string | null;
  }>;
  status: PackageStatus;
  type: PackageType;
  volumetricWeightKg: string;
  weightKg: string | null;
  widthCm: string | null;
};

export type ShipmentAddressView = {
  city: string;
  countryCode: string;
  line1: string;
  line2: string | null;
  name: string | null;
  postalCode: string | null;
  state: string | null;
};

export type ShipmentListItem = {
  createdAt: string;
  destinationCity: string;
  id: string;
  mode: ShipmentMode;
  originCity: string;
  packageCount: number;
  priority: ShipmentPriority;
  referenceNumber: string | null;
  shipmentNumber: string;
  status: ShipmentStatus;
  updatedAt: string;
};

export type ShipmentDetail = ShipmentListItem & {
  cancelledAt: string | null;
  cancellationReason: string | null;
  deliveredAt: string | null;
  deliveryWindowEnd: string | null;
  deliveryWindowStart: string | null;
  destination: ShipmentAddressView;
  documents: Array<{
    createdAt: string;
    documentType: string;
    fileName: string;
    fileSizeBytes: number;
    id: string;
    mimeType: string;
    notes: string | null;
    uploadedBy: string | null;
    verifiedAt: string | null;
  }>;
  invoice: {
    amountPaid: string;
    currency: string;
    dueDate: string | null;
    id: string;
    invoiceNumber: string;
    issuedAt: string | null;
    lineItems: Array<{
      description: string;
      id: string;
      quantity: string;
      sortOrder: number;
      total: string;
      unitPrice: string;
    }>;
    status: string;
    subtotal: string;
    taxTotal: string;
    total: string;
  } | null;
  history: Array<{
    action: string;
    actorName: string | null;
    id: string;
    metadata: unknown;
    occurredAt: string;
  }>;
  notes: string | null;
  origin: ShipmentAddressView;
  packages: ShipmentPackageView[];
  pickupWindowEnd: string | null;
  pickupWindowStart: string | null;
  serviceLevel: string | null;
  weightSummary: {
    actualWeightKg: string;
    chargeableWeightKg: string;
    dimensionalWeightKg: string;
  };
  timeline: Array<{
    eventType: TrackingEventType;
    id: string;
    message: string | null;
    occurredAt: string;
    packageNumber: string | null;
    recordedBy: string | null;
    shipmentStatus: ShipmentStatus | null;
  }>;
};

export type ShipmentTrackingTimelineEvent = ShipmentDetail["timeline"][number];

export type ShipmentTrackingSnapshot = {
  deliveryWindowEnd: string | null;
  deliveryWindowStart: string | null;
  destinationCity: string;
  id: string;
  mode: ShipmentMode;
  originCity: string;
  pickupWindowEnd: string | null;
  pickupWindowStart: string | null;
  serviceLevel: string | null;
  shipmentNumber: string;
  status: ShipmentStatus;
  timeline: ShipmentTrackingTimelineEvent[];
  updatedAt: string;
};
