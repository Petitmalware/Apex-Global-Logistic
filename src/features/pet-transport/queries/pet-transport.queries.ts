import "server-only";

import type { Prisma } from "@prisma/client";

import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import type { PetTransportDetail, PetTransportListItem } from "@/features/pet-transport/types";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { PERMISSIONS, hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

function formatDate(value: Date | null) {
  return value ? value.toISOString() : null;
}

function formatCalendarDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function decimalToString(value: Prisma.Decimal | null) {
  return value === null ? null : value.toString();
}

function getPetTransportWhere(user: AuthSessionUser) {
  if (user.roles.includes(AUTH_ROLES.SUPER_ADMIN)) {
    return {
      shipment: {
        deletedAt: null,
      },
    };
  }

  const canViewOrganizationPetTransport =
    hasPermission(user, PERMISSIONS.PET_TRANSPORT_MANAGE) ||
    hasPermission(user, PERMISSIONS.PET_TRANSPORT_UPDATE) ||
    hasPermission(user, PERMISSIONS.SHIPMENTS_MANAGE) ||
    hasPermission(user, PERMISSIONS.SHIPMENTS_ASSIGN) ||
    hasPermission(user, PERMISSIONS.SHIPMENTS_UPDATE);

  if (canViewOrganizationPetTransport && user.organizationId) {
    return {
      shipment: {
        deletedAt: null,
        organizationId: user.organizationId,
      },
    };
  }

  return {
    shipment: {
      deletedAt: null,
      OR: [
        {
          createdById: user.id,
        },
        {
          customerId: user.id,
        },
      ],
    },
  };
}

export async function getPetTransportsForUser(
  user: AuthSessionUser,
): Promise<PetTransportListItem[]> {
  const petTransports = await prisma.petTransport.findMany({
    select: {
      breed: true,
      id: true,
      petName: true,
      shipment: {
        select: {
          destinationAddress: {
            select: {
              city: true,
            },
          },
          originAddress: {
            select: {
              city: true,
            },
          },
          shipmentNumber: true,
        },
      },
      shipmentId: true,
      species: true,
      status: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 50,
    where: getPetTransportWhere(user),
  });

  return petTransports.map((petTransport) => ({
    breed: petTransport.breed,
    destinationCity: petTransport.shipment.destinationAddress.city,
    id: petTransport.id,
    originCity: petTransport.shipment.originAddress.city,
    petName: petTransport.petName,
    shipmentId: petTransport.shipmentId,
    shipmentNumber: petTransport.shipment.shipmentNumber,
    species: petTransport.species,
    status: petTransport.status,
    updatedAt: petTransport.updatedAt.toISOString(),
  }));
}

export async function getPetTransportForUser(
  petTransportId: string,
  user: AuthSessionUser,
): Promise<PetTransportDetail | null> {
  const petTransport = await prisma.petTransport.findFirst({
    include: {
      crateAssignments: {
        include: {
          assignedBy: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          assignedAt: "desc",
        },
      },
      feedingSchedules: {
        include: {
          createdBy: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      medicalCertificates: {
        include: {
          uploadedBy: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      photos: {
        include: {
          uploadedBy: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      shipment: {
        include: {
          destinationAddress: true,
          originAddress: true,
          trackingEvents: {
            include: {
              package: {
                select: {
                  packageNumber: true,
                },
              },
              recordedBy: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: {
              occurredAt: "desc",
            },
          },
        },
      },
      temperatureLogs: {
        include: {
          recordedBy: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          recordedAt: "desc",
        },
      },
      travelHistory: {
        include: {
          recordedBy: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          occurredAt: "desc",
        },
      },
      vaccinationRecords: {
        include: {
          uploadedBy: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      veterinarianChecks: {
        include: {
          recordedBy: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          checkedAt: "desc",
        },
      },
    },
    where: {
      ...getPetTransportWhere(user),
      id: petTransportId,
    },
  });

  if (!petTransport) {
    return null;
  }

  return {
    ageMonths: petTransport.ageMonths,
    breed: petTransport.breed,
    color: petTransport.color,
    crateAssignments: petTransport.crateAssignments.map((assignment) => ({
      absorbentLining: assignment.absorbentLining,
      assignedAt: assignment.assignedAt.toISOString(),
      assignedBy: assignment.assignedBy?.name ?? null,
      crateCode: assignment.crateCode,
      crateType: assignment.crateType,
      heightCm: decimalToString(assignment.heightCm),
      id: assignment.id,
      inspectedAt: formatDate(assignment.inspectedAt),
      lengthCm: decimalToString(assignment.lengthCm),
      loadedAt: formatDate(assignment.loadedAt),
      maxPetWeightKg: decimalToString(assignment.maxPetWeightKg),
      notes: assignment.notes,
      releasedAt: formatDate(assignment.releasedAt),
      sealNumber: assignment.sealNumber,
      status: assignment.status,
      ventilationChecked: assignment.ventilationChecked,
      waterBowlAttached: assignment.waterBowlAttached,
      widthCm: decimalToString(assignment.widthCm),
    })),
    crateHeightCm: decimalToString(petTransport.crateHeightCm),
    crateLengthCm: decimalToString(petTransport.crateLengthCm),
    crateRequired: petTransport.crateRequired,
    crateWidthCm: decimalToString(petTransport.crateWidthCm),
    dateOfBirth: formatCalendarDate(petTransport.dateOfBirth),
    destinationCity: petTransport.shipment.destinationAddress.city,
    feedingInstructions: petTransport.feedingInstructions,
    feedingSchedules: petTransport.feedingSchedules.map((schedule) => ({
      active: schedule.active,
      createdAt: schedule.createdAt.toISOString(),
      createdBy: schedule.createdBy?.name ?? null,
      foodType: schedule.foodType,
      frequencyHours: schedule.frequencyHours,
      id: schedule.id,
      instructions: schedule.instructions,
      lastFedAt: formatDate(schedule.lastFedAt),
      nextFeedingAt: formatDate(schedule.nextFeedingAt),
      portion: schedule.portion,
      waterNotes: schedule.waterNotes,
    })),
    handlerInstructions: petTransport.handlerInstructions,
    healthCertificateNumber: petTransport.healthCertificateNumber,
    id: petTransport.id,
    knownAllergies: petTransport.knownAllergies,
    medicalCertificates: petTransport.medicalCertificates.map((certificate) => ({
      certificateNumber: certificate.certificateNumber,
      clinicName: certificate.clinicName,
      createdAt: certificate.createdAt.toISOString(),
      expiresAt: formatDate(certificate.expiresAt),
      fileName: certificate.fileName,
      fitToTravel: certificate.fitToTravel,
      id: certificate.id,
      issuedAt: formatDate(certificate.issuedAt),
      notes: certificate.notes,
      uploadedBy: certificate.uploadedBy?.name ?? null,
      veterinarianName: certificate.veterinarianName,
      verifiedAt: formatDate(certificate.verifiedAt),
    })),
    medicationInstructions: petTransport.medicationInstructions,
    microchipNumber: petTransport.microchipNumber,
    mode: petTransport.shipment.mode,
    originCity: petTransport.shipment.originAddress.city,
    ownerEmail: petTransport.ownerEmail,
    ownerName: petTransport.ownerName,
    ownerPhone: petTransport.ownerPhone,
    petName: petTransport.petName,
    photos: petTransport.photos.map((photo) => ({
      caption: photo.caption,
      createdAt: photo.createdAt.toISOString(),
      fileName: photo.fileName,
      fileSizeBytes: photo.fileSizeBytes,
      id: photo.id,
      mimeType: photo.mimeType,
      uploadedBy: photo.uploadedBy?.name ?? null,
    })),
    priority: petTransport.shipment.priority,
    sex: petTransport.sex,
    shipmentId: petTransport.shipmentId,
    shipmentNumber: petTransport.shipment.shipmentNumber,
    shipmentStatus: petTransport.shipment.status,
    shipmentTimeline: petTransport.shipment.trackingEvents.map((event) => ({
      eventType: event.eventType,
      id: event.id,
      message: event.message,
      occurredAt: event.occurredAt.toISOString(),
      packageNumber: event.package?.packageNumber ?? null,
      recordedBy: event.recordedBy?.name ?? null,
      shipmentStatus: event.shipmentStatus,
    })),
    species: petTransport.species,
    status: petTransport.status,
    temperatureLogs: petTransport.temperatureLogs.map((log) => ({
      alertTriggered: log.alertTriggered,
      crateSensorId: log.crateSensorId,
      humidityPercent: decimalToString(log.humidityPercent),
      id: log.id,
      location: log.location,
      notes: log.notes,
      recordedAt: log.recordedAt.toISOString(),
      recordedBy: log.recordedBy?.name ?? null,
      temperatureC: log.temperatureC.toString(),
    })),
    travelHistory: petTransport.travelHistory.map((history) => ({
      eventType: history.eventType,
      id: history.id,
      location: history.location,
      message: history.message,
      occurredAt: history.occurredAt.toISOString(),
      recordedBy: history.recordedBy?.name ?? null,
    })),
    updatedAt: petTransport.updatedAt.toISOString(),
    vaccinationRecords: petTransport.vaccinationRecords.map((record) => ({
      administeredAt: formatDate(record.administeredAt),
      certificateNumber: record.certificateNumber,
      clinicName: record.clinicName,
      createdAt: record.createdAt.toISOString(),
      expiresAt: formatDate(record.expiresAt),
      fileName: record.fileName,
      id: record.id,
      notes: record.notes,
      uploadedBy: record.uploadedBy?.name ?? null,
      vaccineName: record.vaccineName,
      veterinarianName: record.veterinarianName,
      verifiedAt: formatDate(record.verifiedAt),
    })),
    vaccinationVerified: petTransport.vaccinationVerified,
    veterinarianChecks: petTransport.veterinarianChecks.map((check) => ({
      checkedAt: check.checkedAt.toISOString(),
      clinicName: check.clinicName,
      heartRateBpm: check.heartRateBpm,
      id: check.id,
      nextCheckAt: formatDate(check.nextCheckAt),
      notes: check.notes,
      recordedBy: check.recordedBy?.name ?? null,
      respirationBpm: check.respirationBpm,
      status: check.status,
      temperatureC: decimalToString(check.temperatureC),
      veterinarianName: check.veterinarianName,
    })),
    weightKg: decimalToString(petTransport.weightKg),
  };
}
