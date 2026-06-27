import "server-only";

import {
  ActivityAction,
  PetTransportStatus,
  PetTravelEventType,
  PetVetCheckStatus,
  ShipmentStatus,
  type Prisma,
} from "@prisma/client";

import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import type {
  PetCrateAssignmentInput,
  PetFeedingScheduleInput,
  PetMedicalCertificateInput,
  PetPhotoInput,
  PetTemperatureLogInput,
  PetTransportProfileInput,
  PetVaccinationRecordInput,
  PetVeterinarianCheckInput,
} from "@/features/pet-transport/schemas/pet-transport.schemas";
import { createShipment } from "@/features/shipments/services/shipment.service";
import type { ShipmentFormInput } from "@/features/shipments/schemas/shipment.schemas";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { AuthError } from "@/lib/auth/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import {
  DOCUMENT_EXTENSIONS,
  DOCUMENT_MIME_TYPES,
  IMAGE_EXTENSIONS,
  IMAGE_MIME_TYPES,
  persistValidatedUpload,
} from "@/lib/security/file-validation";

const MAX_PET_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_PET_PHOTO_SIZE_BYTES = 8 * 1024 * 1024;
const petDocumentUploadRules = {
  acceptedMimeTypes: DOCUMENT_MIME_TYPES,
  allowedExtensions: DOCUMENT_EXTENSIONS,
  emptyFileMessage: "Attach a pet transport file before uploading.",
  maxSizeBytes: MAX_PET_DOCUMENT_SIZE_BYTES,
  tooLargeMessage: "Pet transport files are larger than the allowed size.",
  unsupportedTypeMessage: "Unsupported pet transport file type.",
};
const petPhotoUploadRules = {
  acceptedMimeTypes: IMAGE_MIME_TYPES,
  allowedExtensions: IMAGE_EXTENSIONS,
  emptyFileMessage: "Attach a pet photo before uploading.",
  maxSizeBytes: MAX_PET_PHOTO_SIZE_BYTES,
  tooLargeMessage: "Pet transport photos are larger than the allowed size.",
  unsupportedTypeMessage: "Pet photos must be JPG, PNG, or WebP.",
};

function toDecimal(value?: number) {
  return value === undefined ? undefined : value;
}

function canAccessOrganization(user: AuthSessionUser, organizationId: string) {
  return user.roles.includes(AUTH_ROLES.SUPER_ADMIN) || user.organizationId === organizationId;
}

function hasPetMutationAccess(user: AuthSessionUser) {
  return (
    hasPermission(user, PERMISSIONS.PET_TRANSPORT_MANAGE) ||
    hasPermission(user, PERMISSIONS.PET_TRANSPORT_UPDATE) ||
    hasPermission(user, PERMISSIONS.SHIPMENTS_MANAGE)
  );
}

function canMutatePetTransport({
  createdById,
  customerId,
  organizationId,
  user,
}: {
  createdById: string | null;
  customerId: string | null;
  organizationId: string;
  user: AuthSessionUser;
}) {
  if (createdById === user.id || customerId === user.id) {
    return true;
  }

  return canAccessOrganization(user, organizationId) && hasPetMutationAccess(user);
}

async function getPetTransportForMutation(petTransportId: string, user: AuthSessionUser) {
  const petTransport = await prisma.petTransport.findUnique({
    include: {
      shipment: {
        select: {
          createdById: true,
          customerId: true,
          deletedAt: true,
          id: true,
          organizationId: true,
          shipmentNumber: true,
        },
      },
    },
    where: {
      id: petTransportId,
    },
  });

  if (!petTransport || petTransport.shipment.deletedAt) {
    throw new AuthError("Pet transport not found.", 404, "PET_TRANSPORT_NOT_FOUND");
  }

  if (!canMutatePetTransport({ ...petTransport.shipment, user })) {
    throw new AuthError(
      "You do not have permission to update this pet transport.",
      403,
      "FORBIDDEN",
    );
  }

  return petTransport;
}

async function logShipmentActivity({
  action,
  entityId,
  metadata,
  organizationId,
  user,
}: {
  action: ActivityAction;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
  organizationId: string;
  user: AuthSessionUser;
}) {
  await prisma.activityLog.create({
    data: {
      action,
      actorId: user.id,
      entityId,
      entityType: "pet_transport",
      metadata,
      organizationId,
    },
  });
}

async function persistPetFile({
  file,
  folder,
  petTransportId,
  photo,
}: {
  file: File;
  folder: string;
  petTransportId: string;
  photo?: boolean;
}) {
  return persistValidatedUpload({
    file,
    folderSegments: ["pet-transports", petTransportId, folder],
    rules: photo ? petPhotoUploadRules : petDocumentUploadRules,
    storageKeyPrefix: `pet-transports/${petTransportId}/${folder}`,
  });
}

function hasUpload(file: File | null | undefined): file is File {
  return file instanceof File && file.size > 0;
}

function buildPetProfileData(input: PetTransportProfileInput) {
  return {
    ageMonths: input.ageMonths,
    breed: input.breed,
    color: input.color,
    crateHeightCm: toDecimal(input.crateHeightCm),
    crateLengthCm: toDecimal(input.crateLengthCm),
    crateRequired: input.crateRequired,
    crateWidthCm: toDecimal(input.crateWidthCm),
    dateOfBirth: input.dateOfBirth,
    feedingInstructions: input.feedingInstructions,
    handlerInstructions: input.handlerInstructions,
    healthCertificateNumber: input.healthCertificateNumber,
    knownAllergies: input.knownAllergies,
    medicationInstructions: input.medicationInstructions,
    microchipNumber: input.microchipNumber,
    ownerEmail: input.ownerEmail,
    ownerName: input.ownerName,
    ownerPhone: input.ownerPhone,
    petName: input.petName,
    sex: input.sex,
    species: input.species,
    status: input.status,
    vaccinationVerified: input.vaccinationVerified,
    weightKg: toDecimal(input.weightKg),
  };
}

export async function createPetTransportBooking({
  pet,
  shipmentInput,
  user,
}: {
  pet: PetTransportProfileInput;
  shipmentInput: ShipmentFormInput;
  user: AuthSessionUser;
}) {
  const shipment = await createShipment(
    {
      ...shipmentInput,
      serviceLevel: shipmentInput.serviceLevel || "Pet Transport Care",
      status: ShipmentStatus.BOOKED,
    },
    user,
  );

  const petTransport = await prisma.$transaction(async (transaction) => {
    await transaction.shipment.update({
      data: {
        metadata: {
          bookingType: "PET_TRANSPORT",
          petName: pet.petName,
          species: pet.species,
        },
      },
      where: {
        id: shipment.id,
      },
    });

    const createdPetTransport = await transaction.petTransport.create({
      data: {
        ...buildPetProfileData(pet),
        shipmentId: shipment.id,
      },
      select: {
        id: true,
      },
    });

    await transaction.petTravelHistory.create({
      data: {
        eventType: PetTravelEventType.PROFILE_CREATED,
        message: "Pet transport profile created and linked to shipment tracking.",
        occurredAt: new Date(),
        petTransportId: createdPetTransport.id,
        recordedById: user.id,
      },
    });

    await transaction.activityLog.create({
      data: {
        action: ActivityAction.CREATE,
        actorId: user.id,
        entityId: createdPetTransport.id,
        entityType: "pet_transport",
        metadata: {
          petName: pet.petName,
          shipmentId: shipment.id,
          species: pet.species,
        },
        organizationId: shipment.organizationId,
      },
    });

    return createdPetTransport;
  });

  return petTransport;
}

export async function updatePetTransportProfile(
  petTransportId: string,
  input: PetTransportProfileInput,
  user: AuthSessionUser,
) {
  const petTransport = await getPetTransportForMutation(petTransportId, user);

  await prisma.$transaction(async (transaction) => {
    await transaction.petTransport.update({
      data: buildPetProfileData(input),
      where: {
        id: petTransportId,
      },
    });

    await transaction.petTravelHistory.create({
      data: {
        eventType: PetTravelEventType.PROFILE_CREATED,
        message: "Pet transport profile updated.",
        occurredAt: new Date(),
        petTransportId,
        recordedById: user.id,
      },
    });
  });

  await logShipmentActivity({
    action: ActivityAction.UPDATE,
    entityId: petTransportId,
    metadata: {
      petName: input.petName,
      status: input.status,
    },
    organizationId: petTransport.shipment.organizationId,
    user,
  });
}

export async function addPetVaccinationRecord({
  file,
  input,
  petTransportId,
  user,
}: {
  file?: File | null;
  input: PetVaccinationRecordInput;
  petTransportId: string;
  user: AuthSessionUser;
}) {
  const petTransport = await getPetTransportForMutation(petTransportId, user);
  const fileData = hasUpload(file)
    ? await persistPetFile({
        file,
        folder: "vaccinations",
        petTransportId,
      })
    : {};

  await prisma.$transaction(async (transaction) => {
    const record = await transaction.petVaccinationRecord.create({
      data: {
        ...fileData,
        administeredAt: input.administeredAt,
        certificateNumber: input.certificateNumber,
        clinicName: input.clinicName,
        expiresAt: input.expiresAt,
        manufacturer: input.manufacturer,
        notes: input.notes,
        petTransportId,
        uploadedById: user.id,
        vaccineName: input.vaccineName,
        veterinarianName: input.veterinarianName,
      },
      select: {
        id: true,
      },
    });

    await transaction.petTransport.update({
      data: {
        vaccinationVerified: true,
      },
      where: {
        id: petTransportId,
      },
    });

    await transaction.petTravelHistory.create({
      data: {
        eventType: PetTravelEventType.VACCINATION_RECORDED,
        message: `${input.vaccineName} vaccination record added.`,
        occurredAt: new Date(),
        petTransportId,
        recordedById: user.id,
        metadata: {
          recordId: record.id,
        },
      },
    });
  });

  await logShipmentActivity({
    action: ActivityAction.CREATE,
    entityId: petTransportId,
    metadata: {
      vaccineName: input.vaccineName,
    },
    organizationId: petTransport.shipment.organizationId,
    user,
  });
}

export async function addPetMedicalCertificate({
  file,
  input,
  petTransportId,
  user,
}: {
  file?: File | null;
  input: PetMedicalCertificateInput;
  petTransportId: string;
  user: AuthSessionUser;
}) {
  const petTransport = await getPetTransportForMutation(petTransportId, user);
  const fileData = hasUpload(file)
    ? await persistPetFile({
        file,
        folder: "medical-certificates",
        petTransportId,
      })
    : {};

  await prisma.$transaction(async (transaction) => {
    const certificate = await transaction.petMedicalCertificate.create({
      data: {
        ...fileData,
        certificateNumber: input.certificateNumber,
        clinicName: input.clinicName,
        expiresAt: input.expiresAt,
        fitToTravel: input.fitToTravel,
        issuedAt: input.issuedAt,
        notes: input.notes,
        petTransportId,
        uploadedById: user.id,
        veterinarianName: input.veterinarianName,
      },
      select: {
        id: true,
      },
    });

    await transaction.petTransport.update({
      data: {
        healthCertificateNumber: input.certificateNumber,
      },
      where: {
        id: petTransportId,
      },
    });

    await transaction.petTravelHistory.create({
      data: {
        eventType: PetTravelEventType.MEDICAL_CERTIFICATE_RECORDED,
        message: "Medical certificate added.",
        occurredAt: new Date(),
        petTransportId,
        recordedById: user.id,
        metadata: {
          certificateId: certificate.id,
        },
      },
    });
  });

  await logShipmentActivity({
    action: ActivityAction.CREATE,
    entityId: petTransportId,
    metadata: {
      certificateNumber: input.certificateNumber,
    },
    organizationId: petTransport.shipment.organizationId,
    user,
  });
}

export async function addPetVeterinarianCheck({
  input,
  petTransportId,
  user,
}: {
  input: PetVeterinarianCheckInput;
  petTransportId: string;
  user: AuthSessionUser;
}) {
  const petTransport = await getPetTransportForMutation(petTransportId, user);

  await prisma.$transaction(async (transaction) => {
    const check = await transaction.petVeterinarianCheck.create({
      data: {
        checkedAt: input.checkedAt,
        clinicName: input.clinicName,
        heartRateBpm: input.heartRateBpm,
        nextCheckAt: input.nextCheckAt,
        notes: input.notes,
        petTransportId,
        recordedById: user.id,
        respirationBpm: input.respirationBpm,
        status: input.status,
        temperatureC: toDecimal(input.temperatureC),
        veterinarianName: input.veterinarianName,
      },
      select: {
        id: true,
      },
    });

    if (input.status === PetVetCheckStatus.CLEARED) {
      await transaction.petTransport.update({
        data: {
          status: PetTransportStatus.CLEARED,
        },
        where: {
          id: petTransportId,
        },
      });
    }

    await transaction.petTravelHistory.create({
      data: {
        eventType: PetTravelEventType.VET_CHECK_COMPLETED,
        message: `Veterinarian check ${input.status.toLowerCase().replaceAll("_", " ")}.`,
        occurredAt: input.checkedAt,
        petTransportId,
        recordedById: user.id,
        metadata: {
          checkId: check.id,
        },
      },
    });
  });

  await logShipmentActivity({
    action: ActivityAction.CREATE,
    entityId: petTransportId,
    metadata: {
      status: input.status,
      veterinarianName: input.veterinarianName,
    },
    organizationId: petTransport.shipment.organizationId,
    user,
  });
}

export async function addPetFeedingSchedule({
  input,
  petTransportId,
  user,
}: {
  input: PetFeedingScheduleInput;
  petTransportId: string;
  user: AuthSessionUser;
}) {
  const petTransport = await getPetTransportForMutation(petTransportId, user);

  await prisma.$transaction(async (transaction) => {
    const schedule = await transaction.petFeedingSchedule.create({
      data: {
        active: input.active,
        createdById: user.id,
        foodType: input.foodType,
        frequencyHours: input.frequencyHours,
        instructions: input.instructions,
        lastFedAt: input.lastFedAt,
        nextFeedingAt: input.nextFeedingAt,
        petTransportId,
        portion: input.portion,
        waterNotes: input.waterNotes,
      },
      select: {
        id: true,
      },
    });

    await transaction.petTravelHistory.create({
      data: {
        eventType: PetTravelEventType.FEEDING_SCHEDULED,
        message: `${input.foodType} feeding schedule added.`,
        occurredAt: new Date(),
        petTransportId,
        recordedById: user.id,
        metadata: {
          scheduleId: schedule.id,
        },
      },
    });
  });

  await logShipmentActivity({
    action: ActivityAction.CREATE,
    entityId: petTransportId,
    metadata: {
      foodType: input.foodType,
      frequencyHours: input.frequencyHours,
    },
    organizationId: petTransport.shipment.organizationId,
    user,
  });
}

export async function addPetTemperatureLog({
  input,
  petTransportId,
  user,
}: {
  input: PetTemperatureLogInput;
  petTransportId: string;
  user: AuthSessionUser;
}) {
  const petTransport = await getPetTransportForMutation(petTransportId, user);

  await prisma.$transaction(async (transaction) => {
    const log = await transaction.petTemperatureLog.create({
      data: {
        alertTriggered: input.alertTriggered,
        crateSensorId: input.crateSensorId,
        humidityPercent: toDecimal(input.humidityPercent),
        location: input.location,
        notes: input.notes,
        petTransportId,
        recordedAt: input.recordedAt,
        recordedById: user.id,
        temperatureC: input.temperatureC,
      },
      select: {
        id: true,
      },
    });

    await transaction.petTravelHistory.create({
      data: {
        eventType: input.alertTriggered
          ? PetTravelEventType.EXCEPTION
          : PetTravelEventType.TEMPERATURE_LOGGED,
        location: input.location,
        message: `Temperature recorded at ${input.temperatureC} C.`,
        occurredAt: input.recordedAt,
        petTransportId,
        recordedById: user.id,
        metadata: {
          logId: log.id,
        },
      },
    });
  });

  await logShipmentActivity({
    action: ActivityAction.CREATE,
    entityId: petTransportId,
    metadata: {
      alertTriggered: input.alertTriggered,
      temperatureC: input.temperatureC,
    },
    organizationId: petTransport.shipment.organizationId,
    user,
  });
}

export async function addPetCrateAssignment({
  input,
  petTransportId,
  user,
}: {
  input: PetCrateAssignmentInput;
  petTransportId: string;
  user: AuthSessionUser;
}) {
  const petTransport = await getPetTransportForMutation(petTransportId, user);

  await prisma.$transaction(async (transaction) => {
    const crate = await transaction.petCrateAssignment.create({
      data: {
        absorbentLining: input.absorbentLining,
        assignedAt: input.assignedAt,
        assignedById: user.id,
        crateCode: input.crateCode,
        crateType: input.crateType,
        heightCm: toDecimal(input.heightCm),
        inspectedAt: input.inspectedAt,
        lengthCm: toDecimal(input.lengthCm),
        loadedAt: input.loadedAt,
        maxPetWeightKg: toDecimal(input.maxPetWeightKg),
        notes: input.notes,
        petTransportId,
        releasedAt: input.releasedAt,
        sealNumber: input.sealNumber,
        status: input.status,
        ventilationChecked: input.ventilationChecked,
        waterBowlAttached: input.waterBowlAttached,
        widthCm: toDecimal(input.widthCm),
      },
      select: {
        id: true,
      },
    });

    await transaction.petTransport.update({
      data: {
        crateHeightCm: toDecimal(input.heightCm),
        crateLengthCm: toDecimal(input.lengthCm),
        crateRequired: true,
        crateWidthCm: toDecimal(input.widthCm),
      },
      where: {
        id: petTransportId,
      },
    });

    await transaction.petTravelHistory.create({
      data: {
        eventType: PetTravelEventType.CRATE_ASSIGNED,
        message: `Crate ${input.crateCode} assigned.`,
        occurredAt: input.assignedAt,
        petTransportId,
        recordedById: user.id,
        metadata: {
          crateAssignmentId: crate.id,
        },
      },
    });
  });

  await logShipmentActivity({
    action: ActivityAction.CREATE,
    entityId: petTransportId,
    metadata: {
      crateCode: input.crateCode,
      status: input.status,
    },
    organizationId: petTransport.shipment.organizationId,
    user,
  });
}

export async function uploadPetTransportPhoto({
  file,
  input,
  petTransportId,
  user,
}: {
  file: File;
  input: PetPhotoInput;
  petTransportId: string;
  user: AuthSessionUser;
}) {
  const petTransport = await getPetTransportForMutation(petTransportId, user);
  const fileData = await persistPetFile({
    file,
    folder: "photos",
    petTransportId,
    photo: true,
  });

  await prisma.$transaction(async (transaction) => {
    const photo = await transaction.petTransportPhoto.create({
      data: {
        ...fileData,
        caption: input.caption,
        petTransportId,
        uploadedById: user.id,
      },
      select: {
        id: true,
      },
    });

    await transaction.petTravelHistory.create({
      data: {
        eventType: PetTravelEventType.DOCUMENT_UPLOADED,
        message: "Pet photo uploaded.",
        occurredAt: new Date(),
        petTransportId,
        recordedById: user.id,
        metadata: {
          photoId: photo.id,
        },
      },
    });
  });

  await logShipmentActivity({
    action: ActivityAction.CREATE,
    entityId: petTransportId,
    metadata: {
      fileName: file.name,
    },
    organizationId: petTransport.shipment.organizationId,
    user,
  });
}
