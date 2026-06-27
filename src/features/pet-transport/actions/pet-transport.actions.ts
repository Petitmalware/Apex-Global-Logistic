"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";

import {
  petCrateAssignmentSchema,
  petFeedingScheduleSchema,
  petMedicalCertificateSchema,
  petPhotoSchema,
  petTemperatureLogSchema,
  petTransportProfileSchema,
  petVaccinationRecordSchema,
  petVeterinarianCheckSchema,
} from "@/features/pet-transport/schemas/pet-transport.schemas";
import {
  addPetCrateAssignment,
  addPetFeedingSchedule,
  addPetMedicalCertificate,
  addPetTemperatureLog,
  addPetVaccinationRecord,
  addPetVeterinarianCheck,
  createPetTransportBooking,
  updatePetTransportProfile,
  uploadPetTransportPhoto,
} from "@/features/pet-transport/services/pet-transport.service";
import type { PetTransportActionState } from "@/features/pet-transport/types";
import { shipmentFormSchema } from "@/features/shipments/schemas/shipment.schemas";
import { AuthError } from "@/lib/auth/errors";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requireAuthenticatedUser, requirePermission } from "@/lib/auth/session";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function getOptionalFile(formData: FormData, key: string) {
  const file = formData.get(key);

  return file instanceof File && file.size > 0 ? file : null;
}

function parsePetProfileFormData(formData: FormData) {
  return petTransportProfileSchema.safeParse({
    ageMonths: getString(formData, "ageMonths"),
    breed: getString(formData, "breed"),
    color: getString(formData, "color"),
    crateHeightCm: getString(formData, "crateHeightCm"),
    crateLengthCm: getString(formData, "crateLengthCm"),
    crateRequired: getBoolean(formData, "crateRequired"),
    crateWidthCm: getString(formData, "crateWidthCm"),
    dateOfBirth: getString(formData, "dateOfBirth"),
    feedingInstructions: getString(formData, "feedingInstructions"),
    handlerInstructions: getString(formData, "handlerInstructions"),
    healthCertificateNumber: getString(formData, "healthCertificateNumber"),
    knownAllergies: getString(formData, "knownAllergies"),
    medicationInstructions: getString(formData, "medicationInstructions"),
    microchipNumber: getString(formData, "microchipNumber"),
    ownerEmail: getString(formData, "ownerEmail"),
    ownerName: getString(formData, "ownerName"),
    ownerPhone: getString(formData, "ownerPhone"),
    petName: getString(formData, "petName"),
    sex: getString(formData, "sex"),
    species: getString(formData, "species"),
    status: getString(formData, "status") || "REQUESTED",
    vaccinationVerified: getBoolean(formData, "vaccinationVerified"),
    weightKg: getString(formData, "weightKg"),
  });
}

function parsePetShipmentFormData(formData: FormData) {
  const petName = getString(formData, "petName") || "Pet";

  return shipmentFormSchema.safeParse({
    deliveryWindowEnd: getString(formData, "deliveryWindowEnd"),
    deliveryWindowStart: getString(formData, "deliveryWindowStart"),
    destination: {
      city: getString(formData, "destination.city"),
      countryCode: getString(formData, "destination.countryCode"),
      line1: getString(formData, "destination.line1"),
      line2: getString(formData, "destination.line2"),
      name: getString(formData, "destination.name"),
      postalCode: getString(formData, "destination.postalCode"),
      state: getString(formData, "destination.state"),
    },
    mode: getString(formData, "mode") || "AIR",
    notes: getString(formData, "notes"),
    origin: {
      city: getString(formData, "origin.city"),
      countryCode: getString(formData, "origin.countryCode"),
      line1: getString(formData, "origin.line1"),
      line2: getString(formData, "origin.line2"),
      name: getString(formData, "origin.name"),
      postalCode: getString(formData, "origin.postalCode"),
      state: getString(formData, "origin.state"),
    },
    packages: [
      {
        currency: "USD",
        declaredValue: "",
        description: `Pet transport crate for ${petName}`,
        fragile: true,
        hazardous: false,
        heightCm: getString(formData, "crateHeightCm"),
        lengthCm: getString(formData, "crateLengthCm"),
        status: "PENDING",
        type: "OTHER",
        weightKg: getString(formData, "weightKg"),
        widthCm: getString(formData, "crateWidthCm"),
      },
    ],
    pickupWindowEnd: getString(formData, "pickupWindowEnd"),
    pickupWindowStart: getString(formData, "pickupWindowStart"),
    priority: getString(formData, "priority") || "STANDARD",
    referenceNumber: getString(formData, "referenceNumber"),
    serviceLevel: getString(formData, "serviceLevel") || "Pet Transport Care",
    status: "BOOKED",
  });
}

function errorState(error: unknown): PetTransportActionState {
  if (error instanceof AuthError) {
    return {
      message: error.message,
      status: "error",
    };
  }

  return {
    message: "Something went wrong. Please review the pet transport details and try again.",
    status: "error",
  };
}

export async function createPetTransportBookingAction(
  _previousState: PetTransportActionState,
  formData: FormData,
): Promise<PetTransportActionState> {
  const user = await requirePermission(PERMISSIONS.PET_TRANSPORT_CREATE);
  const parsedPet = parsePetProfileFormData(formData);
  const parsedShipment = parsePetShipmentFormData(formData);

  if (!parsedPet.success) {
    return {
      fieldErrors: parsedPet.error.flatten().fieldErrors,
      message: "Please fix the highlighted pet profile details.",
      status: "error",
    };
  }

  if (!parsedShipment.success) {
    return {
      fieldErrors: parsedShipment.error.flatten().fieldErrors,
      message: "Please fix the pickup and delivery details.",
      status: "error",
    };
  }

  let petTransportId = "";

  try {
    const petTransport = await createPetTransportBooking({
      pet: parsedPet.data,
      shipmentInput: parsedShipment.data,
      user,
    });
    petTransportId = petTransport.id;
  } catch (error) {
    return errorState(error);
  }

  revalidatePath("/pet-transport");
  redirect(`/pet-transport/${petTransportId}` as Route);
}

export async function updatePetTransportProfileAction(
  petTransportId: string,
  _previousState: PetTransportActionState,
  formData: FormData,
): Promise<PetTransportActionState> {
  const user = await requireAuthenticatedUser();
  const parsed = parsePetProfileFormData(formData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please fix the highlighted pet profile details.",
      status: "error",
    };
  }

  try {
    await updatePetTransportProfile(petTransportId, parsed.data, user);
  } catch (error) {
    return errorState(error);
  }

  revalidatePath("/pet-transport");
  revalidatePath(`/pet-transport/${petTransportId}`);
  redirect(`/pet-transport/${petTransportId}` as Route);
}

export async function addPetVaccinationRecordAction(
  petTransportId: string,
  _previousState: PetTransportActionState,
  formData: FormData,
): Promise<PetTransportActionState> {
  const user = await requireAuthenticatedUser();
  const parsed = petVaccinationRecordSchema.safeParse({
    administeredAt: getString(formData, "administeredAt"),
    certificateNumber: getString(formData, "certificateNumber"),
    clinicName: getString(formData, "clinicName"),
    expiresAt: getString(formData, "expiresAt"),
    manufacturer: getString(formData, "manufacturer"),
    notes: getString(formData, "notes"),
    vaccineName: getString(formData, "vaccineName"),
    veterinarianName: getString(formData, "veterinarianName"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please add valid vaccination details.",
      status: "error",
    };
  }

  try {
    await addPetVaccinationRecord({
      file: getOptionalFile(formData, "file"),
      input: parsed.data,
      petTransportId,
      user,
    });
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(`/pet-transport/${petTransportId}`);

  return {
    message: "Vaccination record added.",
    status: "success",
  };
}

export async function addPetMedicalCertificateAction(
  petTransportId: string,
  _previousState: PetTransportActionState,
  formData: FormData,
): Promise<PetTransportActionState> {
  const user = await requireAuthenticatedUser();
  const parsed = petMedicalCertificateSchema.safeParse({
    certificateNumber: getString(formData, "certificateNumber"),
    clinicName: getString(formData, "clinicName"),
    expiresAt: getString(formData, "expiresAt"),
    fitToTravel: getBoolean(formData, "fitToTravel"),
    issuedAt: getString(formData, "issuedAt"),
    notes: getString(formData, "notes"),
    veterinarianName: getString(formData, "veterinarianName"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please add valid medical certificate details.",
      status: "error",
    };
  }

  try {
    await addPetMedicalCertificate({
      file: getOptionalFile(formData, "file"),
      input: parsed.data,
      petTransportId,
      user,
    });
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(`/pet-transport/${petTransportId}`);

  return {
    message: "Medical certificate added.",
    status: "success",
  };
}

export async function addPetVeterinarianCheckAction(
  petTransportId: string,
  _previousState: PetTransportActionState,
  formData: FormData,
): Promise<PetTransportActionState> {
  const user = await requireAuthenticatedUser();
  const parsed = petVeterinarianCheckSchema.safeParse({
    checkedAt: getString(formData, "checkedAt"),
    clinicName: getString(formData, "clinicName"),
    heartRateBpm: getString(formData, "heartRateBpm"),
    nextCheckAt: getString(formData, "nextCheckAt"),
    notes: getString(formData, "notes"),
    respirationBpm: getString(formData, "respirationBpm"),
    status: getString(formData, "status") || "SCHEDULED",
    temperatureC: getString(formData, "temperatureC"),
    veterinarianName: getString(formData, "veterinarianName"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please add valid veterinarian check details.",
      status: "error",
    };
  }

  try {
    await addPetVeterinarianCheck({
      input: parsed.data,
      petTransportId,
      user,
    });
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(`/pet-transport/${petTransportId}`);

  return {
    message: "Veterinarian check added.",
    status: "success",
  };
}

export async function addPetFeedingScheduleAction(
  petTransportId: string,
  _previousState: PetTransportActionState,
  formData: FormData,
): Promise<PetTransportActionState> {
  const user = await requireAuthenticatedUser();
  const parsed = petFeedingScheduleSchema.safeParse({
    active: getBoolean(formData, "active"),
    foodType: getString(formData, "foodType"),
    frequencyHours: getString(formData, "frequencyHours"),
    instructions: getString(formData, "instructions"),
    lastFedAt: getString(formData, "lastFedAt"),
    nextFeedingAt: getString(formData, "nextFeedingAt"),
    portion: getString(formData, "portion"),
    waterNotes: getString(formData, "waterNotes"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please add valid feeding schedule details.",
      status: "error",
    };
  }

  try {
    await addPetFeedingSchedule({
      input: parsed.data,
      petTransportId,
      user,
    });
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(`/pet-transport/${petTransportId}`);

  return {
    message: "Feeding schedule added.",
    status: "success",
  };
}

export async function addPetTemperatureLogAction(
  petTransportId: string,
  _previousState: PetTransportActionState,
  formData: FormData,
): Promise<PetTransportActionState> {
  const user = await requireAuthenticatedUser();
  const parsed = petTemperatureLogSchema.safeParse({
    alertTriggered: getBoolean(formData, "alertTriggered"),
    crateSensorId: getString(formData, "crateSensorId"),
    humidityPercent: getString(formData, "humidityPercent"),
    location: getString(formData, "location"),
    notes: getString(formData, "notes"),
    recordedAt: getString(formData, "recordedAt"),
    temperatureC: getString(formData, "temperatureC"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please add a valid temperature log.",
      status: "error",
    };
  }

  try {
    await addPetTemperatureLog({
      input: parsed.data,
      petTransportId,
      user,
    });
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(`/pet-transport/${petTransportId}`);

  return {
    message: "Temperature log added.",
    status: "success",
  };
}

export async function addPetCrateAssignmentAction(
  petTransportId: string,
  _previousState: PetTransportActionState,
  formData: FormData,
): Promise<PetTransportActionState> {
  const user = await requireAuthenticatedUser();
  const parsed = petCrateAssignmentSchema.safeParse({
    absorbentLining: getBoolean(formData, "absorbentLining"),
    assignedAt: getString(formData, "assignedAt"),
    crateCode: getString(formData, "crateCode"),
    crateType: getString(formData, "crateType"),
    heightCm: getString(formData, "heightCm"),
    inspectedAt: getString(formData, "inspectedAt"),
    lengthCm: getString(formData, "lengthCm"),
    loadedAt: getString(formData, "loadedAt"),
    maxPetWeightKg: getString(formData, "maxPetWeightKg"),
    notes: getString(formData, "notes"),
    releasedAt: getString(formData, "releasedAt"),
    sealNumber: getString(formData, "sealNumber"),
    status: getString(formData, "status") || "ASSIGNED",
    ventilationChecked: getBoolean(formData, "ventilationChecked"),
    waterBowlAttached: getBoolean(formData, "waterBowlAttached"),
    widthCm: getString(formData, "widthCm"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please add valid crate assignment details.",
      status: "error",
    };
  }

  try {
    await addPetCrateAssignment({
      input: parsed.data,
      petTransportId,
      user,
    });
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(`/pet-transport/${petTransportId}`);

  return {
    message: "Crate assignment added.",
    status: "success",
  };
}

export async function uploadPetPhotoAction(
  petTransportId: string,
  _previousState: PetTransportActionState,
  formData: FormData,
): Promise<PetTransportActionState> {
  const user = await requireAuthenticatedUser();
  const file = getOptionalFile(formData, "file");
  const parsed = petPhotoSchema.safeParse({
    caption: getString(formData, "caption"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please add valid photo details.",
      status: "error",
    };
  }

  if (!file) {
    return {
      fieldErrors: {
        file: ["Choose a pet photo to upload."],
      },
      message: "Choose a pet photo to upload.",
      status: "error",
    };
  }

  try {
    await uploadPetTransportPhoto({
      file,
      input: parsed.data,
      petTransportId,
      user,
    });
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(`/pet-transport/${petTransportId}`);

  return {
    message: "Pet photo uploaded.",
    status: "success",
  };
}
