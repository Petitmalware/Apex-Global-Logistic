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

export type CustomerOption = {
  email: string;
  id: string;
  label: string;
  name: string;
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

export type ManualRecipientView = {
  email: string | null;
  name: string | null;
  phone: string | null;
};

export type ShipmentOfficeDetails = {
  carrier: string | null;
  carrierReference: string | null;
  comments: string | null;
  courier: string | null;
  departureTime: string | null;
  paymentMode: string | null;
  pickupTime: string | null;
  productName: string | null;
  quantity: string | null;
  shipperEmail: string | null;
  shipperPhone: string | null;
  totalFreight: string | null;
};

export type PublicTrackingPreferences = {
  shareParties: boolean;
  sharePetDetails: boolean;
};

export type PublicShipmentTrackingDetails = {
  pet: {
    ageMonths: number | null;
    breed: string | null;
    name: string;
    species: string;
    weightLb: string | null;
  } | null;
  recipientName: string | null;
  senderName: string | null;
};

export type ShipmentListItem = {
  createdAt: string;
  destinationCity: string;
  id: string;
  manualRecipient: ManualRecipientView | null;
  mode: ShipmentMode;
  originCity: string;
  packageCount: number;
  priority: ShipmentPriority;
  recipientEmail: string | null;
  recipientName: string | null;
  referenceNumber: string | null;
  shipmentNumber: string;
  status: ShipmentStatus;
  updatedAt: string;
};

export type ShipmentDocumentListItem = {
  createdAt: string;
  documentType: string;
  fileName: string;
  fileSizeBytes: number;
  id: string;
  shipmentId: string;
  shipmentNumber: string;
  shipmentStatus: ShipmentStatus;
  uploadedBy: string | null;
  verifiedAt: string | null;
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
  officeDetails: ShipmentOfficeDetails | null;
  origin: ShipmentAddressView;
  packages: ShipmentPackageView[];
  pickupWindowEnd: string | null;
  pickupWindowStart: string | null;
  publicTracking: PublicTrackingPreferences;
  serviceLevel: string | null;
  weightSummary: {
    actualWeightKg: string;
    chargeableWeightKg: string;
    dimensionalWeightKg: string;
  };
  timeline: Array<{
    currentLocation: string | null;
    eventType: TrackingEventType;
    id: string;
    latitude: string | null;
    longitude: string | null;
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
  publicDetails: PublicShipmentTrackingDetails | null;
  serviceLevel: string | null;
  shipmentNumber: string;
  status: ShipmentStatus;
  timeline: ShipmentTrackingTimelineEvent[];
  updatedAt: string;
};
