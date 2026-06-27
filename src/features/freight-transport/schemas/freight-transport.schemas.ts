import {
  FreightCargoStatus,
  FreightContainerStatus,
  FreightDocumentType,
  FreightRouteStopType,
  FreightTrackingEventType,
  FreightTransportStatus,
  FreightType,
} from "@prisma/client";
import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const optionalString = (max = 255) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

const requiredString = (label: string, max = 255) =>
  z.string().trim().min(1, `${label} is required.`).max(max);

const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());

const requiredDate = (label: string) =>
  z.preprocess(emptyToUndefined, z.coerce.date({ required_error: `${label} is required.` }));

const optionalDecimal = z.preprocess(
  emptyToUndefined,
  z.coerce.number().nonnegative("Value cannot be negative.").optional(),
);

const optionalInteger = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().nonnegative("Value cannot be negative.").optional(),
);

const positiveInteger = (label: string) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ required_error: `${label} is required.` })
      .int()
      .positive(),
  );

const optionalStatus = z.preprocess(
  emptyToUndefined,
  z.nativeEnum(FreightTransportStatus).optional(),
);

export const freightTransportProfileSchema = z
  .object({
    actualArrivalAt: optionalDate,
    actualDepartureAt: optionalDate,
    averageSpeedKph: optionalDecimal,
    commodityCode: optionalString(80),
    commodityDescription: optionalString(2000),
    containerNumber: optionalString(80),
    destinationTerminal: optionalString(160),
    distanceKm: optionalDecimal,
    estimatedDurationHours: optionalInteger,
    freightType: z.nativeEnum(FreightType).default(FreightType.FTL),
    grossWeightKg: optionalDecimal,
    hazmatClass: optionalString(40),
    incoterm: optionalString(16),
    originTerminal: optionalString(160),
    palletCount: optionalInteger,
    plannedArrivalAt: optionalDate,
    plannedDepartureAt: optionalDate,
    refrigeratedRequired: z.coerce.boolean().default(false),
    routeCode: optionalString(80),
    routeName: optionalString(160),
    sealNumber: optionalString(80),
    specialInstructions: optionalString(2000),
    status: z.nativeEnum(FreightTransportStatus).default(FreightTransportStatus.REQUESTED),
    temperatureMaxC: optionalDecimal,
    temperatureMinC: optionalDecimal,
    unNumber: optionalString(40),
    volumeCbm: optionalDecimal,
  })
  .superRefine((value, context) => {
    if (
      value.temperatureMinC !== undefined &&
      value.temperatureMaxC !== undefined &&
      value.temperatureMaxC < value.temperatureMinC
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Maximum temperature must be higher than minimum temperature.",
        path: ["temperatureMaxC"],
      });
    }

    if (
      value.plannedDepartureAt &&
      value.plannedArrivalAt &&
      value.plannedArrivalAt < value.plannedDepartureAt
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Planned arrival must be after planned departure.",
        path: ["plannedArrivalAt"],
      });
    }

    if (
      value.actualDepartureAt &&
      value.actualArrivalAt &&
      value.actualArrivalAt < value.actualDepartureAt
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Actual arrival must be after actual departure.",
        path: ["actualArrivalAt"],
      });
    }
  });

export const freightCargoItemSchema = z.object({
  cargoType: optionalString(120),
  commodityCode: optionalString(80),
  containerId: optionalString(80),
  currency: z
    .preprocess(emptyToUndefined, z.string().trim().length(3).optional())
    .transform((value) => value?.toUpperCase() ?? "USD"),
  declaredValue: optionalDecimal,
  description: requiredString("Cargo description", 255),
  hazardous: z.coerce.boolean().default(false),
  heightCm: optionalDecimal,
  lengthCm: optionalDecimal,
  notes: optionalString(2000),
  quantity: positiveInteger("Quantity").default(1),
  stackable: z.coerce.boolean().default(true),
  status: z.nativeEnum(FreightCargoStatus).default(FreightCargoStatus.PLANNED),
  temperatureControlled: z.coerce.boolean().default(false),
  temperatureMaxC: optionalDecimal,
  temperatureMinC: optionalDecimal,
  unit: z
    .preprocess(emptyToUndefined, z.string().trim().max(40).optional())
    .transform((value) => value ?? "pieces"),
  volumeCbm: optionalDecimal,
  weightKg: optionalDecimal,
  widthCm: optionalDecimal,
});

export const freightContainerSchema = z.object({
  containerNumber: requiredString("Container number", 80),
  containerType: optionalString(80),
  currentWeightKg: optionalDecimal,
  loadedAt: optionalDate,
  maxGrossWeightKg: optionalDecimal,
  notes: optionalString(2000),
  releasedAt: optionalDate,
  sealNumber: optionalString(80),
  status: z.nativeEnum(FreightContainerStatus).default(FreightContainerStatus.ASSIGNED),
  tareWeightKg: optionalDecimal,
  temperatureSetC: optionalDecimal,
  volumeCbm: optionalDecimal,
});

export const freightMachineryItemSchema = z.object({
  category: optionalString(120),
  condition: optionalString(120),
  heightCm: optionalDecimal,
  lengthCm: optionalDecimal,
  loadingInstructions: optionalString(2000),
  manufacturer: optionalString(120),
  model: optionalString(120),
  name: requiredString("Machine name", 160),
  notes: optionalString(2000),
  operatingWeightKg: optionalDecimal,
  oversizePermitRequired: z.coerce.boolean().default(false),
  serialNumber: optionalString(120),
  status: z.nativeEnum(FreightCargoStatus).default(FreightCargoStatus.PLANNED),
  widthCm: optionalDecimal,
});

export const freightVehicleItemSchema = z.object({
  color: optionalString(80),
  condition: optionalString(120),
  keysAvailable: z.coerce.boolean().default(true),
  make: requiredString("Vehicle make", 120),
  model: requiredString("Vehicle model", 120),
  notes: optionalString(2000),
  odometerKm: optionalInteger,
  operable: z.coerce.boolean().default(true),
  plateNumber: optionalString(80),
  status: z.nativeEnum(FreightCargoStatus).default(FreightCargoStatus.PLANNED),
  vin: optionalString(80),
  year: optionalInteger,
});

export const freightRouteStopSchema = z.object({
  actualArrivalAt: optionalDate,
  actualDepartureAt: optionalDate,
  addressLine1: optionalString(255),
  city: optionalString(120),
  contactName: optionalString(160),
  contactPhone: optionalString(40),
  countryCode: z
    .preprocess(emptyToUndefined, z.string().trim().length(2).optional())
    .transform((value) => value?.toUpperCase()),
  latitude: optionalDecimal,
  longitude: optionalDecimal,
  name: requiredString("Stop name", 160),
  notes: optionalString(2000),
  plannedArrivalAt: optionalDate,
  plannedDepartureAt: optionalDate,
  sequence: positiveInteger("Sequence"),
  stopType: z.nativeEnum(FreightRouteStopType).default(FreightRouteStopType.WAREHOUSE),
});

export const freightDocumentSchema = z.object({
  documentType: z.nativeEnum(FreightDocumentType).default(FreightDocumentType.BILL_OF_LADING),
  expiresAt: optionalDate,
  notes: optionalString(2000),
});

export const freightDispatchSchema = z.object({
  driverId: optionalString(80),
  message: optionalString(1000),
  status: z.nativeEnum(FreightTransportStatus).default(FreightTransportStatus.ASSIGNED),
  vehicleId: optionalString(80),
});

export const freightTrackingEventSchema = z.object({
  etaAt: optionalDate,
  eventType: z
    .nativeEnum(FreightTrackingEventType)
    .default(FreightTrackingEventType.CHECKPOINT_ARRIVED),
  latitude: optionalDecimal,
  location: optionalString(160),
  longitude: optionalDecimal,
  message: requiredString("Tracking message", 1000),
  occurredAt: requiredDate("Event time"),
  status: optionalStatus,
});

export type FreightTransportProfileInput = z.infer<typeof freightTransportProfileSchema>;
export type FreightCargoItemInput = z.infer<typeof freightCargoItemSchema>;
export type FreightContainerInput = z.infer<typeof freightContainerSchema>;
export type FreightMachineryItemInput = z.infer<typeof freightMachineryItemSchema>;
export type FreightVehicleItemInput = z.infer<typeof freightVehicleItemSchema>;
export type FreightRouteStopInput = z.infer<typeof freightRouteStopSchema>;
export type FreightDocumentInput = z.infer<typeof freightDocumentSchema>;
export type FreightDispatchInput = z.infer<typeof freightDispatchSchema>;
export type FreightTrackingEventInput = z.infer<typeof freightTrackingEventSchema>;
