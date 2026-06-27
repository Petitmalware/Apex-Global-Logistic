import "server-only";

import {
  ActivityAction,
  FreightTrackingEventType,
  FreightTransportStatus,
  ShipmentStatus,
  TrackingEventType,
  type Prisma,
} from "@prisma/client";

import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import type {
  FreightCargoItemInput,
  FreightContainerInput,
  FreightDispatchInput,
  FreightDocumentInput,
  FreightMachineryItemInput,
  FreightRouteStopInput,
  FreightTrackingEventInput,
  FreightTransportProfileInput,
  FreightVehicleItemInput,
} from "@/features/freight-transport/schemas/freight-transport.schemas";
import { createShipment } from "@/features/shipments/services/shipment.service";
import type { ShipmentFormInput } from "@/features/shipments/schemas/shipment.schemas";
import { publishShipmentTrackingUpdate } from "@/features/shipments/services/shipment-realtime.service";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { AuthError } from "@/lib/auth/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import {
  DOCUMENT_EXTENSIONS,
  DOCUMENT_MIME_TYPES,
  persistValidatedUpload,
} from "@/lib/security/file-validation";

const MAX_FREIGHT_DOCUMENT_SIZE_BYTES = 15 * 1024 * 1024;
const freightDocumentUploadRules = {
  acceptedMimeTypes: DOCUMENT_MIME_TYPES,
  allowedExtensions: DOCUMENT_EXTENSIONS,
  emptyFileMessage: "Attach a freight document before uploading.",
  maxSizeBytes: MAX_FREIGHT_DOCUMENT_SIZE_BYTES,
  tooLargeMessage: "Freight documents are larger than the allowed size.",
  unsupportedTypeMessage: "Unsupported freight document file type.",
};

function toDecimal(value?: number) {
  return value === undefined ? undefined : value;
}

function canAccessOrganization(user: AuthSessionUser, organizationId: string) {
  return user.roles.includes(AUTH_ROLES.SUPER_ADMIN) || user.organizationId === organizationId;
}

function hasFreightMutationAccess(user: AuthSessionUser) {
  return (
    hasPermission(user, PERMISSIONS.FREIGHT_TRANSPORT_MANAGE) ||
    hasPermission(user, PERMISSIONS.FREIGHT_TRANSPORT_UPDATE) ||
    hasPermission(user, PERMISSIONS.SHIPMENTS_MANAGE) ||
    hasPermission(user, PERMISSIONS.SHIPMENTS_ASSIGN)
  );
}

function canMutateFreightTransport({
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

  return canAccessOrganization(user, organizationId) && hasFreightMutationAccess(user);
}

async function getFreightTransportForMutation(freightTransportId: string, user: AuthSessionUser) {
  const freightTransport = await prisma.freightTransport.findUnique({
    include: {
      shipment: {
        select: {
          assignedDriverId: true,
          createdById: true,
          customerId: true,
          deletedAt: true,
          id: true,
          organizationId: true,
          shipmentNumber: true,
          status: true,
          vehicleId: true,
        },
      },
    },
    where: {
      id: freightTransportId,
    },
  });

  if (!freightTransport || freightTransport.shipment.deletedAt) {
    throw new AuthError("Freight transport not found.", 404, "FREIGHT_TRANSPORT_NOT_FOUND");
  }

  if (!canMutateFreightTransport({ ...freightTransport.shipment, user })) {
    throw new AuthError(
      "You do not have permission to update this freight transport.",
      403,
      "FORBIDDEN",
    );
  }

  return freightTransport;
}

async function logFreightActivity({
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
      entityType: "freight_transport",
      metadata,
      organizationId,
    },
  });
}

function hasUpload(file: File | null | undefined): file is File {
  return file instanceof File && file.size > 0;
}

async function persistFreightDocument({
  file,
  freightTransportId,
}: {
  file: File;
  freightTransportId: string;
}) {
  return persistValidatedUpload({
    file,
    folderSegments: ["freight-transports", freightTransportId, "documents"],
    rules: freightDocumentUploadRules,
    storageKeyPrefix: `freight-transports/${freightTransportId}/documents`,
  });
}

export function calculateFreightEta(input: FreightTransportProfileInput) {
  if (input.plannedArrivalAt) {
    return input.plannedArrivalAt;
  }

  if (!input.plannedDepartureAt) {
    return undefined;
  }

  if (input.estimatedDurationHours && input.estimatedDurationHours > 0) {
    return new Date(
      input.plannedDepartureAt.getTime() + input.estimatedDurationHours * 60 * 60 * 1000,
    );
  }

  if (input.distanceKm && input.averageSpeedKph && input.averageSpeedKph > 0) {
    const durationHours = input.distanceKm / input.averageSpeedKph;

    return new Date(input.plannedDepartureAt.getTime() + durationHours * 60 * 60 * 1000);
  }

  return undefined;
}

function buildFreightProfileData(input: FreightTransportProfileInput) {
  return {
    actualArrivalAt: input.actualArrivalAt,
    actualDepartureAt: input.actualDepartureAt,
    averageSpeedKph: toDecimal(input.averageSpeedKph),
    commodityCode: input.commodityCode,
    commodityDescription: input.commodityDescription,
    containerNumber: input.containerNumber,
    destinationTerminal: input.destinationTerminal,
    distanceKm: toDecimal(input.distanceKm),
    estimatedDurationHours: input.estimatedDurationHours,
    etaAt: calculateFreightEta(input),
    freightType: input.freightType,
    grossWeightKg: toDecimal(input.grossWeightKg),
    hazmatClass: input.hazmatClass,
    incoterm: input.incoterm,
    originTerminal: input.originTerminal,
    palletCount: input.palletCount,
    plannedArrivalAt: input.plannedArrivalAt,
    plannedDepartureAt: input.plannedDepartureAt,
    refrigeratedRequired: input.refrigeratedRequired,
    routeCode: input.routeCode,
    routeName: input.routeName,
    sealNumber: input.sealNumber,
    specialInstructions: input.specialInstructions,
    status: input.status,
    temperatureMaxC: toDecimal(input.temperatureMaxC),
    temperatureMinC: toDecimal(input.temperatureMinC),
    unNumber: input.unNumber,
    volumeCbm: toDecimal(input.volumeCbm),
  };
}

function mapFreightStatusToShipmentStatus(status: FreightTransportStatus) {
  const statusMap = {
    [FreightTransportStatus.ASSIGNED]: ShipmentStatus.BOOKED,
    [FreightTransportStatus.CANCELLED]: ShipmentStatus.CANCELLED,
    [FreightTransportStatus.DELIVERED]: ShipmentStatus.DELIVERED,
    [FreightTransportStatus.IN_TRANSIT]: ShipmentStatus.IN_TRANSIT,
    [FreightTransportStatus.LOADING]: ShipmentStatus.PENDING_PICKUP,
    [FreightTransportStatus.ON_HOLD]: ShipmentStatus.HELD,
    [FreightTransportStatus.PLANNED]: ShipmentStatus.BOOKED,
    [FreightTransportStatus.REQUESTED]: ShipmentStatus.BOOKED,
  } satisfies Record<FreightTransportStatus, ShipmentStatus>;

  return statusMap[status];
}

function mapFreightEventToTrackingEvent(eventType: FreightTrackingEventType) {
  const eventMap = {
    [FreightTrackingEventType.BOOKING_CREATED]: TrackingEventType.CREATED,
    [FreightTrackingEventType.CARGO_LOADED]: TrackingEventType.CHECKED_IN,
    [FreightTrackingEventType.CHECKPOINT_ARRIVED]: TrackingEventType.IN_TRANSIT,
    [FreightTrackingEventType.CHECKPOINT_DEPARTED]: TrackingEventType.IN_TRANSIT,
    [FreightTrackingEventType.DELAYED]: TrackingEventType.DELAYED,
    [FreightTrackingEventType.DELIVERED]: TrackingEventType.DELIVERED,
    [FreightTrackingEventType.DEPARTED]: TrackingEventType.IN_TRANSIT,
    [FreightTrackingEventType.DOCUMENT_UPLOADED]: TrackingEventType.CHECKED_IN,
    [FreightTrackingEventType.DRIVER_ASSIGNED]: TrackingEventType.CHECKED_IN,
    [FreightTrackingEventType.ETA_UPDATED]: TrackingEventType.IN_TRANSIT,
    [FreightTrackingEventType.EXCEPTION]: TrackingEventType.EXCEPTION,
    [FreightTrackingEventType.ROUTE_PLANNED]: TrackingEventType.CHECKED_IN,
  } satisfies Record<FreightTrackingEventType, TrackingEventType>;

  return eventMap[eventType];
}

function mapShipmentTimestamps(status: ShipmentStatus) {
  const now = new Date();

  return {
    cancelledAt: status === ShipmentStatus.CANCELLED ? now : undefined,
    deliveredAt: status === ShipmentStatus.DELIVERED ? now : undefined,
    dispatchedAt: status === ShipmentStatus.IN_TRANSIT ? now : undefined,
  };
}

async function createLinkedTrackingEvent({
  eventType,
  freightTransportId,
  latitude,
  location,
  longitude,
  message,
  occurredAt,
  recordedById,
  shipmentId,
  status,
  transaction,
  etaAt,
}: {
  etaAt?: Date;
  eventType: FreightTrackingEventType;
  freightTransportId: string;
  latitude?: number;
  location?: string;
  longitude?: number;
  message?: string;
  occurredAt: Date;
  recordedById: string;
  shipmentId: string;
  status?: FreightTransportStatus;
  transaction: Prisma.TransactionClient;
}) {
  const shipmentStatus = status ? mapFreightStatusToShipmentStatus(status) : undefined;
  const trackingEvent = await transaction.trackingEvent.create({
    data: {
      eventType: mapFreightEventToTrackingEvent(eventType),
      latitude: toDecimal(latitude),
      longitude: toDecimal(longitude),
      message,
      occurredAt,
      recordedById,
      shipmentId,
      shipmentStatus,
    },
    select: {
      id: true,
    },
  });

  await transaction.freightTrackingEvent.create({
    data: {
      etaAt,
      eventType,
      latitude: toDecimal(latitude),
      location,
      longitude: toDecimal(longitude),
      message,
      occurredAt,
      recordedById,
      freightTransportId,
      status,
      trackingEventId: trackingEvent.id,
    },
  });

  if (status) {
    await transaction.shipment.update({
      data: {
        ...mapShipmentTimestamps(shipmentStatus!),
        status: shipmentStatus,
      },
      where: {
        id: shipmentId,
      },
    });

    await transaction.freightTransport.update({
      data: {
        etaAt,
        status,
      },
      where: {
        id: freightTransportId,
      },
    });
  }
}

export async function createFreightTransportBooking({
  freight,
  shipmentInput,
  user,
}: {
  freight: FreightTransportProfileInput;
  shipmentInput: ShipmentFormInput;
  user: AuthSessionUser;
}) {
  const shipment = await createShipment(
    {
      ...shipmentInput,
      serviceLevel: shipmentInput.serviceLevel || "Long-haul Freight",
      status: ShipmentStatus.BOOKED,
    },
    user,
  );

  const freightTransport = await prisma.$transaction(async (transaction) => {
    await transaction.shipment.update({
      data: {
        metadata: {
          bookingType: "FREIGHT_TRANSPORT",
          freightType: freight.freightType,
          routeCode: freight.routeCode ?? null,
        },
      },
      where: {
        id: shipment.id,
      },
    });

    const createdFreightTransport = await transaction.freightTransport.create({
      data: {
        ...buildFreightProfileData(freight),
        shipmentId: shipment.id,
      },
      select: {
        id: true,
      },
    });

    await createLinkedTrackingEvent({
      eventType: FreightTrackingEventType.BOOKING_CREATED,
      freightTransportId: createdFreightTransport.id,
      message: "Freight transport booking created.",
      occurredAt: new Date(),
      recordedById: user.id,
      shipmentId: shipment.id,
      status: FreightTransportStatus.REQUESTED,
      transaction,
    });

    await transaction.activityLog.create({
      data: {
        action: ActivityAction.CREATE,
        actorId: user.id,
        entityId: createdFreightTransport.id,
        entityType: "freight_transport",
        metadata: {
          freightType: freight.freightType,
          shipmentId: shipment.id,
        },
        organizationId: shipment.organizationId,
      },
    });

    return createdFreightTransport;
  });

  await publishShipmentTrackingUpdate(shipment.id);

  return freightTransport;
}

export async function updateFreightTransportProfile(
  freightTransportId: string,
  input: FreightTransportProfileInput,
  user: AuthSessionUser,
) {
  const freightTransport = await getFreightTransportForMutation(freightTransportId, user);
  const etaAt = calculateFreightEta(input);

  await prisma.$transaction(async (transaction) => {
    await transaction.freightTransport.update({
      data: buildFreightProfileData(input),
      where: {
        id: freightTransportId,
      },
    });

    await createLinkedTrackingEvent({
      etaAt,
      eventType: FreightTrackingEventType.ROUTE_PLANNED,
      freightTransportId,
      message: "Freight route and transport profile updated.",
      occurredAt: new Date(),
      recordedById: user.id,
      shipmentId: freightTransport.shipment.id,
      status: input.status,
      transaction,
    });
  });

  await logFreightActivity({
    action: ActivityAction.UPDATE,
    entityId: freightTransportId,
    metadata: {
      etaAt: etaAt?.toISOString() ?? null,
      routeCode: input.routeCode ?? null,
      status: input.status,
    },
    organizationId: freightTransport.shipment.organizationId,
    user,
  });

  await publishShipmentTrackingUpdate(freightTransport.shipment.id);
}

export async function updateFreightDispatch({
  freightTransportId,
  input,
  user,
}: {
  freightTransportId: string;
  input: FreightDispatchInput;
  user: AuthSessionUser;
}) {
  const freightTransport = await getFreightTransportForMutation(freightTransportId, user);

  if (input.driverId) {
    const driver = await prisma.driver.findFirst({
      select: { id: true },
      where: {
        deletedAt: null,
        id: input.driverId,
        organizationId: freightTransport.shipment.organizationId,
      },
    });

    if (!driver) {
      throw new AuthError("Driver not found for this organization.", 404, "DRIVER_NOT_FOUND");
    }
  }

  if (input.vehicleId) {
    const vehicle = await prisma.vehicle.findFirst({
      select: { id: true },
      where: {
        deletedAt: null,
        id: input.vehicleId,
        organizationId: freightTransport.shipment.organizationId,
      },
    });

    if (!vehicle) {
      throw new AuthError("Vehicle not found for this organization.", 404, "VEHICLE_NOT_FOUND");
    }
  }

  await prisma.$transaction(async (transaction) => {
    const shipmentStatus = mapFreightStatusToShipmentStatus(input.status);

    await transaction.shipment.update({
      data: {
        ...mapShipmentTimestamps(shipmentStatus),
        assignedDriverId: input.driverId ?? null,
        status: shipmentStatus,
        vehicleId: input.vehicleId ?? null,
      },
      where: {
        id: freightTransport.shipment.id,
      },
    });

    await transaction.freightTransport.update({
      data: {
        actualDepartureAt:
          input.status === FreightTransportStatus.IN_TRANSIT
            ? (freightTransport.actualDepartureAt ?? new Date())
            : undefined,
        actualArrivalAt:
          input.status === FreightTransportStatus.DELIVERED
            ? (freightTransport.actualArrivalAt ?? new Date())
            : undefined,
        status: input.status,
      },
      where: {
        id: freightTransportId,
      },
    });

    if (input.driverId && input.vehicleId) {
      await transaction.driverVehicleAssignment.create({
        data: {
          assignedById: user.id,
          driverId: input.driverId,
          notes: input.message ?? null,
          vehicleId: input.vehicleId,
        },
      });
    }

    await createLinkedTrackingEvent({
      eventType: FreightTrackingEventType.DRIVER_ASSIGNED,
      freightTransportId,
      message: input.message || "Freight dispatch assignment updated.",
      occurredAt: new Date(),
      recordedById: user.id,
      shipmentId: freightTransport.shipment.id,
      status: input.status,
      transaction,
    });
  });

  await logFreightActivity({
    action: ActivityAction.UPDATE,
    entityId: freightTransportId,
    metadata: {
      driverId: input.driverId ?? null,
      status: input.status,
      vehicleId: input.vehicleId ?? null,
    },
    organizationId: freightTransport.shipment.organizationId,
    user,
  });

  await publishShipmentTrackingUpdate(freightTransport.shipment.id);
}

export async function addFreightCargoItem({
  freightTransportId,
  input,
  user,
}: {
  freightTransportId: string;
  input: FreightCargoItemInput;
  user: AuthSessionUser;
}) {
  const freightTransport = await getFreightTransportForMutation(freightTransportId, user);

  if (input.containerId) {
    const container = await prisma.freightContainer.findFirst({
      select: { id: true },
      where: {
        freightTransportId,
        id: input.containerId,
      },
    });

    if (!container) {
      throw new AuthError(
        "Container not found for this freight transport.",
        404,
        "CONTAINER_NOT_FOUND",
      );
    }
  }

  const cargoItem = await prisma.freightCargoItem.create({
    data: {
      cargoType: input.cargoType,
      commodityCode: input.commodityCode,
      containerId: input.containerId,
      currency: input.currency,
      declaredValue: toDecimal(input.declaredValue),
      description: input.description,
      hazardous: input.hazardous,
      heightCm: toDecimal(input.heightCm),
      lengthCm: toDecimal(input.lengthCm),
      notes: input.notes,
      quantity: input.quantity,
      stackable: input.stackable,
      status: input.status,
      temperatureControlled: input.temperatureControlled,
      temperatureMaxC: toDecimal(input.temperatureMaxC),
      temperatureMinC: toDecimal(input.temperatureMinC),
      unit: input.unit,
      volumeCbm: toDecimal(input.volumeCbm),
      weightKg: toDecimal(input.weightKg),
      widthCm: toDecimal(input.widthCm),
      freightTransportId,
    },
    select: {
      id: true,
    },
  });

  await logFreightActivity({
    action: ActivityAction.CREATE,
    entityId: freightTransportId,
    metadata: {
      cargoItemId: cargoItem.id,
      description: input.description,
      status: input.status,
    },
    organizationId: freightTransport.shipment.organizationId,
    user,
  });
}

export async function addFreightContainer({
  freightTransportId,
  input,
  user,
}: {
  freightTransportId: string;
  input: FreightContainerInput;
  user: AuthSessionUser;
}) {
  const freightTransport = await getFreightTransportForMutation(freightTransportId, user);
  const container = await prisma.freightContainer.create({
    data: {
      containerNumber: input.containerNumber,
      containerType: input.containerType,
      currentWeightKg: toDecimal(input.currentWeightKg),
      loadedAt: input.loadedAt,
      maxGrossWeightKg: toDecimal(input.maxGrossWeightKg),
      notes: input.notes,
      releasedAt: input.releasedAt,
      sealNumber: input.sealNumber,
      status: input.status,
      tareWeightKg: toDecimal(input.tareWeightKg),
      temperatureSetC: toDecimal(input.temperatureSetC),
      volumeCbm: toDecimal(input.volumeCbm),
      freightTransportId,
    },
    select: {
      id: true,
    },
  });

  await logFreightActivity({
    action: ActivityAction.CREATE,
    entityId: freightTransportId,
    metadata: {
      containerId: container.id,
      containerNumber: input.containerNumber,
      status: input.status,
    },
    organizationId: freightTransport.shipment.organizationId,
    user,
  });
}

export async function addFreightMachineryItem({
  freightTransportId,
  input,
  user,
}: {
  freightTransportId: string;
  input: FreightMachineryItemInput;
  user: AuthSessionUser;
}) {
  const freightTransport = await getFreightTransportForMutation(freightTransportId, user);
  const machineryItem = await prisma.freightMachineryItem.create({
    data: {
      category: input.category,
      condition: input.condition,
      heightCm: toDecimal(input.heightCm),
      lengthCm: toDecimal(input.lengthCm),
      loadingInstructions: input.loadingInstructions,
      manufacturer: input.manufacturer,
      model: input.model,
      name: input.name,
      notes: input.notes,
      operatingWeightKg: toDecimal(input.operatingWeightKg),
      oversizePermitRequired: input.oversizePermitRequired,
      serialNumber: input.serialNumber,
      status: input.status,
      widthCm: toDecimal(input.widthCm),
      freightTransportId,
    },
    select: {
      id: true,
    },
  });

  await logFreightActivity({
    action: ActivityAction.CREATE,
    entityId: freightTransportId,
    metadata: {
      machineryItemId: machineryItem.id,
      name: input.name,
      oversizePermitRequired: input.oversizePermitRequired,
    },
    organizationId: freightTransport.shipment.organizationId,
    user,
  });
}

export async function addFreightVehicleItem({
  freightTransportId,
  input,
  user,
}: {
  freightTransportId: string;
  input: FreightVehicleItemInput;
  user: AuthSessionUser;
}) {
  const freightTransport = await getFreightTransportForMutation(freightTransportId, user);
  const vehicleItem = await prisma.freightVehicleItem.create({
    data: {
      color: input.color,
      condition: input.condition,
      keysAvailable: input.keysAvailable,
      make: input.make,
      model: input.model,
      notes: input.notes,
      odometerKm: input.odometerKm,
      operable: input.operable,
      plateNumber: input.plateNumber,
      status: input.status,
      vin: input.vin,
      year: input.year,
      freightTransportId,
    },
    select: {
      id: true,
    },
  });

  await logFreightActivity({
    action: ActivityAction.CREATE,
    entityId: freightTransportId,
    metadata: {
      vehicleItemId: vehicleItem.id,
      vehicle: `${input.make} ${input.model}`,
      vin: input.vin ?? null,
    },
    organizationId: freightTransport.shipment.organizationId,
    user,
  });
}

export async function addFreightRouteStop({
  freightTransportId,
  input,
  user,
}: {
  freightTransportId: string;
  input: FreightRouteStopInput;
  user: AuthSessionUser;
}) {
  const freightTransport = await getFreightTransportForMutation(freightTransportId, user);
  const stop = await prisma.freightRouteStop.create({
    data: {
      actualArrivalAt: input.actualArrivalAt,
      actualDepartureAt: input.actualDepartureAt,
      addressLine1: input.addressLine1,
      city: input.city,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      countryCode: input.countryCode,
      latitude: toDecimal(input.latitude),
      longitude: toDecimal(input.longitude),
      name: input.name,
      notes: input.notes,
      plannedArrivalAt: input.plannedArrivalAt,
      plannedDepartureAt: input.plannedDepartureAt,
      sequence: input.sequence,
      stopType: input.stopType,
      freightTransportId,
    },
    select: {
      id: true,
    },
  });

  await logFreightActivity({
    action: ActivityAction.CREATE,
    entityId: freightTransportId,
    metadata: {
      sequence: input.sequence,
      stopId: stop.id,
      stopType: input.stopType,
    },
    organizationId: freightTransport.shipment.organizationId,
    user,
  });
}

export async function uploadFreightDocument({
  file,
  freightTransportId,
  input,
  user,
}: {
  file?: File | null;
  freightTransportId: string;
  input: FreightDocumentInput;
  user: AuthSessionUser;
}) {
  if (!hasUpload(file)) {
    throw new AuthError("Attach a freight document before uploading.", 400, "DOCUMENT_REQUIRED");
  }

  const freightTransport = await getFreightTransportForMutation(freightTransportId, user);
  const fileData = await persistFreightDocument({ file, freightTransportId });

  await prisma.$transaction(async (transaction) => {
    const document = await transaction.freightDocument.create({
      data: {
        ...fileData,
        documentType: input.documentType,
        expiresAt: input.expiresAt,
        freightTransportId,
        notes: input.notes,
        uploadedById: user.id,
      },
      select: {
        id: true,
      },
    });

    await createLinkedTrackingEvent({
      eventType: FreightTrackingEventType.DOCUMENT_UPLOADED,
      freightTransportId,
      message: `${input.documentType.replaceAll("_", " ").toLowerCase()} document uploaded.`,
      occurredAt: new Date(),
      recordedById: user.id,
      shipmentId: freightTransport.shipment.id,
      transaction,
    });

    await transaction.activityLog.create({
      data: {
        action: ActivityAction.CREATE,
        actorId: user.id,
        entityId: freightTransportId,
        entityType: "freight_transport",
        metadata: {
          documentId: document.id,
          documentType: input.documentType,
        },
        organizationId: freightTransport.shipment.organizationId,
      },
    });
  });

  await publishShipmentTrackingUpdate(freightTransport.shipment.id);
}

export async function addFreightTrackingEvent({
  freightTransportId,
  input,
  user,
}: {
  freightTransportId: string;
  input: FreightTrackingEventInput;
  user: AuthSessionUser;
}) {
  const freightTransport = await getFreightTransportForMutation(freightTransportId, user);
  const nextStatus =
    input.status ??
    (input.eventType === FreightTrackingEventType.DELIVERED
      ? FreightTransportStatus.DELIVERED
      : input.eventType === FreightTrackingEventType.DEPARTED ||
          input.eventType === FreightTrackingEventType.CHECKPOINT_ARRIVED ||
          input.eventType === FreightTrackingEventType.CHECKPOINT_DEPARTED
        ? FreightTransportStatus.IN_TRANSIT
        : undefined);

  await prisma.$transaction(async (transaction) => {
    await createLinkedTrackingEvent({
      etaAt: input.etaAt,
      eventType: input.eventType,
      freightTransportId,
      latitude: input.latitude,
      location: input.location,
      longitude: input.longitude,
      message: input.message,
      occurredAt: input.occurredAt,
      recordedById: user.id,
      shipmentId: freightTransport.shipment.id,
      status: nextStatus,
      transaction,
    });
  });

  await logFreightActivity({
    action: ActivityAction.CREATE,
    entityId: freightTransportId,
    metadata: {
      eventType: input.eventType,
      location: input.location ?? null,
      status: nextStatus ?? null,
    },
    organizationId: freightTransport.shipment.organizationId,
    user,
  });

  await publishShipmentTrackingUpdate(freightTransport.shipment.id);
}
