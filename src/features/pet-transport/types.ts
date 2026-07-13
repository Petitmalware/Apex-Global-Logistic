import type {
  PetCrateStatus,
  PetSpecies,
  PetTransportStatus,
  PetTravelEventType,
  PetVetCheckStatus,
  ShipmentMode,
  ShipmentPriority,
  ShipmentStatus,
  TrackingEventType,
} from "@prisma/client";

export type PetTransportActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  status: "error" | "idle" | "success";
};

export const initialPetTransportActionState: PetTransportActionState = {
  status: "idle",
};

export type PetTransportListItem = {
  destinationCity: string;
  id: string;
  originCity: string;
  petName: string | null;
  shipmentId: string;
  shipmentNumber: string;
  species: PetSpecies;
  breed: string | null;
  status: PetTransportStatus;
  updatedAt: string;
};

export type PetTransportDetail = PetTransportListItem & {
  ageMonths: number | null;
  color: string | null;
  crateHeightCm: string | null;
  crateLengthCm: string | null;
  crateRequired: boolean;
  crateWidthCm: string | null;
  dateOfBirth: string | null;
  feedingInstructions: string | null;
  handlerInstructions: string | null;
  healthCertificateNumber: string | null;
  knownAllergies: string | null;
  medicationInstructions: string | null;
  microchipNumber: string | null;
  mode: ShipmentMode;
  ownerEmail: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  priority: ShipmentPriority;
  sex: string | null;
  shipmentStatus: ShipmentStatus;
  vaccinationVerified: boolean;
  weightKg: string | null;
  vaccinationRecords: Array<{
    administeredAt: string | null;
    certificateNumber: string | null;
    clinicName: string | null;
    createdAt: string;
    expiresAt: string | null;
    fileName: string | null;
    id: string;
    notes: string | null;
    uploadedBy: string | null;
    vaccineName: string;
    veterinarianName: string | null;
    verifiedAt: string | null;
  }>;
  medicalCertificates: Array<{
    certificateNumber: string;
    clinicName: string | null;
    createdAt: string;
    expiresAt: string | null;
    fileName: string | null;
    fitToTravel: boolean;
    id: string;
    issuedAt: string | null;
    notes: string | null;
    uploadedBy: string | null;
    veterinarianName: string | null;
    verifiedAt: string | null;
  }>;
  veterinarianChecks: Array<{
    checkedAt: string;
    clinicName: string | null;
    heartRateBpm: number | null;
    id: string;
    nextCheckAt: string | null;
    notes: string | null;
    recordedBy: string | null;
    respirationBpm: number | null;
    status: PetVetCheckStatus;
    temperatureC: string | null;
    veterinarianName: string;
  }>;
  feedingSchedules: Array<{
    active: boolean;
    createdAt: string;
    createdBy: string | null;
    foodType: string;
    frequencyHours: number;
    id: string;
    instructions: string | null;
    lastFedAt: string | null;
    nextFeedingAt: string | null;
    portion: string;
    waterNotes: string | null;
  }>;
  temperatureLogs: Array<{
    alertTriggered: boolean;
    crateSensorId: string | null;
    humidityPercent: string | null;
    id: string;
    location: string | null;
    notes: string | null;
    recordedAt: string;
    recordedBy: string | null;
    temperatureC: string;
  }>;
  crateAssignments: Array<{
    absorbentLining: boolean;
    assignedAt: string;
    assignedBy: string | null;
    crateCode: string;
    crateType: string | null;
    heightCm: string | null;
    id: string;
    inspectedAt: string | null;
    lengthCm: string | null;
    loadedAt: string | null;
    maxPetWeightKg: string | null;
    notes: string | null;
    releasedAt: string | null;
    sealNumber: string | null;
    status: PetCrateStatus;
    ventilationChecked: boolean;
    waterBowlAttached: boolean;
    widthCm: string | null;
  }>;
  photos: Array<{
    caption: string | null;
    createdAt: string;
    fileName: string;
    fileSizeBytes: number;
    id: string;
    mimeType: string;
    uploadedBy: string | null;
  }>;
  travelHistory: Array<{
    eventType: PetTravelEventType;
    id: string;
    location: string | null;
    message: string | null;
    occurredAt: string;
    recordedBy: string | null;
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
};
