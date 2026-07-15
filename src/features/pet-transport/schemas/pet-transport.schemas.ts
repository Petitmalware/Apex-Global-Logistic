import { PetCrateStatus, PetSpecies, PetTransportStatus, PetVetCheckStatus } from "@prisma/client";
import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const optionalString = (max = 255) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

const optionalEmail = z.preprocess(
  emptyToUndefined,
  z.string().trim().email("Enter a valid sender email address.").max(255).optional(),
);

const requiredString = (label: string, max = 255) =>
  z.string().trim().min(1, `${label} is required.`).max(max);

const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());

const requiredDate = (label: string) =>
  z.preprocess(emptyToUndefined, z.coerce.date({ required_error: `${label} is required.` }));

const optionalDecimal = z.preprocess(
  emptyToUndefined,
  z.coerce.number().nonnegative("Value cannot be negative.").optional(),
);

const requiredDecimal = (label: string) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce.number({ required_error: `${label} is required.` }).nonnegative(),
  );

const optionalInteger = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().nonnegative("Value cannot be negative.").optional(),
);

export const petTransportProfileSchema = z.object({
  ageMonths: optionalInteger,
  breed: optionalString(120),
  color: optionalString(80),
  crateHeightCm: optionalDecimal,
  crateLengthCm: optionalDecimal,
  crateRequired: z.coerce.boolean().default(true),
  crateWidthCm: optionalDecimal,
  dateOfBirth: optionalDate,
  feedingInstructions: optionalString(2000),
  handlerInstructions: optionalString(2000),
  healthCertificateNumber: optionalString(120),
  knownAllergies: optionalString(2000),
  medicationInstructions: optionalString(2000),
  microchipNumber: optionalString(120),
  ownerEmail: optionalEmail,
  ownerName: optionalString(160),
  ownerPhone: optionalString(40),
  petName: requiredString("Pet name", 120),
  sex: optionalString(40),
  species: z.nativeEnum(PetSpecies),
  status: z.nativeEnum(PetTransportStatus).default(PetTransportStatus.REQUESTED),
  vaccinationVerified: z.coerce.boolean().default(false),
  weightKg: optionalDecimal,
});

export const petVaccinationRecordSchema = z.object({
  administeredAt: optionalDate,
  certificateNumber: optionalString(120),
  clinicName: optionalString(160),
  expiresAt: optionalDate,
  manufacturer: optionalString(160),
  notes: optionalString(2000),
  vaccineName: requiredString("Vaccine name", 160),
  veterinarianName: optionalString(160),
});

export const petMedicalCertificateSchema = z.object({
  certificateNumber: requiredString("Certificate number", 120),
  clinicName: optionalString(160),
  expiresAt: optionalDate,
  fitToTravel: z.coerce.boolean().default(false),
  issuedAt: optionalDate,
  notes: optionalString(2000),
  veterinarianName: optionalString(160),
});

export const petVeterinarianCheckSchema = z.object({
  checkedAt: requiredDate("Check time"),
  clinicName: optionalString(160),
  heartRateBpm: optionalInteger,
  nextCheckAt: optionalDate,
  notes: optionalString(2000),
  respirationBpm: optionalInteger,
  status: z.nativeEnum(PetVetCheckStatus).default(PetVetCheckStatus.SCHEDULED),
  temperatureC: optionalDecimal,
  veterinarianName: requiredString("Veterinarian", 160),
});

export const petFeedingScheduleSchema = z.object({
  active: z.coerce.boolean().default(true),
  foodType: requiredString("Food type", 160),
  frequencyHours: z.coerce.number().int().positive("Frequency must be at least 1 hour."),
  instructions: optionalString(2000),
  lastFedAt: optionalDate,
  nextFeedingAt: optionalDate,
  portion: requiredString("Portion", 120),
  waterNotes: optionalString(2000),
});

export const petTemperatureLogSchema = z.object({
  alertTriggered: z.coerce.boolean().default(false),
  crateSensorId: optionalString(120),
  humidityPercent: optionalDecimal,
  location: optionalString(160),
  notes: optionalString(2000),
  recordedAt: requiredDate("Recorded time"),
  temperatureC: requiredDecimal("Temperature"),
});

export const petCrateAssignmentSchema = z.object({
  absorbentLining: z.coerce.boolean().default(false),
  assignedAt: requiredDate("Assignment time"),
  crateCode: requiredString("Crate code", 120),
  crateType: optionalString(120),
  heightCm: optionalDecimal,
  inspectedAt: optionalDate,
  lengthCm: optionalDecimal,
  loadedAt: optionalDate,
  maxPetWeightKg: optionalDecimal,
  notes: optionalString(2000),
  releasedAt: optionalDate,
  sealNumber: optionalString(120),
  status: z.nativeEnum(PetCrateStatus).default(PetCrateStatus.ASSIGNED),
  ventilationChecked: z.coerce.boolean().default(false),
  waterBowlAttached: z.coerce.boolean().default(false),
  widthCm: optionalDecimal,
});

export const petPhotoSchema = z.object({
  caption: optionalString(255),
});

export type PetTransportProfileInput = z.infer<typeof petTransportProfileSchema>;
export type PetVaccinationRecordInput = z.infer<typeof petVaccinationRecordSchema>;
export type PetMedicalCertificateInput = z.infer<typeof petMedicalCertificateSchema>;
export type PetVeterinarianCheckInput = z.infer<typeof petVeterinarianCheckSchema>;
export type PetFeedingScheduleInput = z.infer<typeof petFeedingScheduleSchema>;
export type PetTemperatureLogInput = z.infer<typeof petTemperatureLogSchema>;
export type PetCrateAssignmentInput = z.infer<typeof petCrateAssignmentSchema>;
export type PetPhotoInput = z.infer<typeof petPhotoSchema>;
