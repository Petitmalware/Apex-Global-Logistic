import type {
  FreightCargoStatus,
  FreightContainerStatus,
  FreightDocumentType,
  FreightRouteStopType,
  FreightTrackingEventType,
  FreightTransportStatus,
  FreightType,
  ShipmentMode,
  ShipmentPriority,
  ShipmentStatus,
  TrackingEventType,
} from "@prisma/client";

export type FreightTransportActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  status: "error" | "idle" | "success";
};

export const initialFreightTransportActionState: FreightTransportActionState = {
  status: "idle",
};

export type FreightTransportListItem = {
  destinationCity: string;
  etaAt: string | null;
  freightType: FreightType;
  grossWeightKg: string | null;
  id: string;
  originCity: string;
  routeName: string | null;
  shipmentId: string;
  shipmentNumber: string;
  shipmentStatus: ShipmentStatus;
  status: FreightTransportStatus;
  updatedAt: string;
};

export type FreightDispatchOption = {
  id: string;
  label: string;
};

export type FreightDispatchOptions = {
  drivers: FreightDispatchOption[];
  vehicles: FreightDispatchOption[];
};

export type FreightTransportDetail = FreightTransportListItem & {
  actualArrivalAt: string | null;
  actualDepartureAt: string | null;
  averageSpeedKph: string | null;
  assignedDriver: string | null;
  assignedVehicle: string | null;
  commodityCode: string | null;
  commodityDescription: string | null;
  containerNumber: string | null;
  destinationTerminal: string | null;
  distanceKm: string | null;
  estimatedDurationHours: number | null;
  hazmatClass: string | null;
  incoterm: string | null;
  mode: ShipmentMode;
  originTerminal: string | null;
  palletCount: number | null;
  plannedArrivalAt: string | null;
  plannedDepartureAt: string | null;
  priority: ShipmentPriority;
  refrigeratedRequired: boolean;
  routeCode: string | null;
  sealNumber: string | null;
  serviceLevel: string | null;
  specialInstructions: string | null;
  temperatureMaxC: string | null;
  temperatureMinC: string | null;
  unNumber: string | null;
  volumeCbm: string | null;
  cargoItems: Array<{
    cargoType: string | null;
    commodityCode: string | null;
    containerNumber: string | null;
    currency: string;
    declaredValue: string | null;
    description: string;
    dimensions: string | null;
    hazardous: boolean;
    id: string;
    notes: string | null;
    quantity: number;
    stackable: boolean;
    status: FreightCargoStatus;
    temperatureControlled: boolean;
    unit: string;
    volumeCbm: string | null;
    weightKg: string | null;
  }>;
  containers: Array<{
    containerNumber: string;
    containerType: string | null;
    currentWeightKg: string | null;
    id: string;
    loadedAt: string | null;
    maxGrossWeightKg: string | null;
    notes: string | null;
    releasedAt: string | null;
    sealNumber: string | null;
    status: FreightContainerStatus;
    tareWeightKg: string | null;
    temperatureSetC: string | null;
    volumeCbm: string | null;
  }>;
  documents: Array<{
    createdAt: string;
    documentType: FreightDocumentType;
    expiresAt: string | null;
    fileName: string;
    fileSizeBytes: number;
    id: string;
    notes: string | null;
    uploadedBy: string | null;
    verifiedAt: string | null;
  }>;
  machineryItems: Array<{
    category: string | null;
    condition: string | null;
    dimensions: string | null;
    id: string;
    loadingInstructions: string | null;
    machine: string;
    operatingWeightKg: string | null;
    oversizePermitRequired: boolean;
    serialNumber: string | null;
    status: FreightCargoStatus;
  }>;
  routeStops: Array<{
    actualArrivalAt: string | null;
    actualDepartureAt: string | null;
    city: string | null;
    contactName: string | null;
    countryCode: string | null;
    id: string;
    name: string;
    plannedArrivalAt: string | null;
    plannedDepartureAt: string | null;
    sequence: number;
    stopType: FreightRouteStopType;
  }>;
  shipmentTimeline: Array<{
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
  trackingEvents: Array<{
    etaAt: string | null;
    eventType: FreightTrackingEventType;
    id: string;
    location: string | null;
    message: string | null;
    occurredAt: string;
    recordedBy: string | null;
    status: FreightTransportStatus | null;
  }>;
  vehicleItems: Array<{
    condition: string | null;
    id: string;
    keysAvailable: boolean;
    odometerKm: number | null;
    operable: boolean;
    plateNumber: string | null;
    status: FreightCargoStatus;
    vehicle: string;
    vin: string | null;
  }>;
};
