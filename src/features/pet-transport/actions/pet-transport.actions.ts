"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import type { ZodError } from "zod";

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
import { AUTH_ROLES } from "@/lib/auth/constants";
import { AuthError } from "@/lib/auth/errors";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { getDatabaseUnavailableMessage, isDatabaseUnavailableError } from "@/lib/db-errors";
import { poundsToKilogramsString } from "@/lib/measurements";

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
    weightKg: poundsToKilogramsString(getString(formData, "weightLb")),
  });
}

function getPetShipmentAddress(formData: FormData, prefix: "destination" | "origin") {
  return {
    city: getString(formData, `${prefix}.city`),
    countryCode: getString(formData, `${prefix}.countryCode`),
    line1: getString(formData, `${prefix}.line1`),
    line2: getString(formData, `${prefix}.line2`),
    name: getString(formData, `${prefix}.name`),
    postalCode: getString(formData, `${prefix}.postalCode`),
    state: getString(formData, `${prefix}.state`),
  };
}

function hasCompleteAddress(address: ReturnType<typeof getPetShipmentAddress>) {
  return Boolean(address.city.trim() && address.countryCode.trim() && address.line1.trim());
}

function getPetShipmentOriginAddress(
  formData: FormData,
  destination: ReturnType<typeof getPetShipmentAddress>,
) {
  const origin = getPetShipmentAddress(formData, "origin");

  if (hasCompleteAddress(origin)) {
    return origin;
  }

  const destinationCountryCode = destination.countryCode.trim();
  const fallbackCountryCode = destinationCountryCode.length === 2 ? destinationCountryCode : "US";

  return {
    city: "Not provided",
    countryCode: fallbackCountryCode,
    line1: "Sender pickup address not provided",
    line2: "",
    name: getString(formData, "ownerName") || "Sender not provided",
    postalCode: "",
    state: "",
  };
}

function parsePetShipmentFormData(
  formData: FormData,
  options: { customerId?: string; customerBooking?: boolean } = {},
) {
  const petName = getString(formData, "petName") || "Pet";
  const destination = getPetShipmentAddress(formData, "destination");

  return shipmentFormSchema.safeParse({
    customerId: options.customerId ?? getString(formData, "customerId"),
    deliveryWindowEnd: getString(formData, "deliveryWindowEnd"),
    deliveryWindowStart: getString(formData, "deliveryWindowStart"),
    destination,
    mode: getString(formData, "mode") || "AIR",
    manualRecipient: {
      email: getString(formData, "manualRecipient.email"),
      name: getString(formData, "manualRecipient.name"),
      phone: getString(formData, "manualRecipient.phone"),
    },
    notes: getString(formData, "notes"),
    origin: getPetShipmentOriginAddress(formData, destination),
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
        weightKg: poundsToKilogramsString(getString(formData, "weightLb")),
        widthCm: getString(formData, "crateWidthCm"),
      },
    ],
    pickupWindowEnd: "",
    pickupWindowStart: "",
    priority: getString(formData, "priority") || "STANDARD",
    publicTracking: {
      shareParties: getBoolean(formData, "publicTracking.shareParties"),
      sharePetDetails: getBoolean(formData, "publicTracking.sharePetDetails"),
    },
    referenceNumber: getString(formData, "referenceNumber"),
    serviceLevel: getString(formData, "serviceLevel") || "Pet Shipment Care",
    status: options.customerBooking ? "DRAFT" : "BOOKED",
  });
}

function getValidationErrors(error: ZodError) {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".");
    const topLevelPath = String(issue.path[0] ?? "form");

    for (const key of new Set([path || "form", topLevelPath])) {
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
  }

  return fieldErrors;
}

function errorState(error: unknown): PetTransportActionState {
  if (error instanceof AuthError) {
    return {
      message: error.message,
      status: "error",
    };
  }

  if (isDatabaseUnavailableError(error)) {
    return {
      message: getDatabaseUnavailableMessage(),
      status: "error",
    };
  }

  return {
    message: "Something went wrong. Please review the pet shipment details and try again.",
    status: "error",
  };
}

export async function createPetTransportBookingAction(
  _previousState: PetTransportActionState,
  formData: FormData,
): Promise<PetTransportActionState> {
  const user = await requireAuthenticatedUser();
  const isAdmin =
    user.roles.includes(AUTH_ROLES.ADMIN) || user.roles.includes(AUTH_ROLES.SUPER_ADMIN);
  const isCustomer = user.roles.includes(AUTH_ROLES.CUSTOMER);

  if (!isAdmin && !isCustomer) {
    return {
      message: "Only customers can submit requests and administrators can create pet shipments.",
      status: "error",
    };
  }

  const parsedPet = parsePetProfileFormData(formData);
  const parsedShipment = parsePetShipmentFormData(formData, {
    customerBooking: isCustomer,
    customerId: isCustomer ? user.id : undefined,
  });

  if (!parsedPet.success) {
    return {
      fieldErrors: getValidationErrors(parsedPet.error),
      message: "Please fix the highlighted pet profile details.",
      status: "error",
    };
  }

  if (!parsedShipment.success) {
    return {
      fieldErrors: getValidationErrors(parsedShipment.error),
      message: "Please correct the highlighted recipient or delivery fields.",
      status: "error",
    };
  }

  let petTransportId = "";

  try {
    const petTransport = await createPetTransportBooking({
      pet: parsedPet.data,
      shipmentInput: parsedShipment.data,
      user,
      workflow: isCustomer ? "customer_booking" : "admin_creation",
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
