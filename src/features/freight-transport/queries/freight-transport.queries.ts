import "server-only";

import type { Prisma } from "@prisma/client";

import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import type {
  FreightDispatchOptions,
  FreightTransportDetail,
  FreightTransportListItem,
} from "@/features/freight-transport/types";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { PERMISSIONS, hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

function formatDate(value: Date | null) {
  return value ? value.toISOString() : null;
}

function decimalToString(value: Prisma.Decimal | null) {
  return value === null ? null : value.toString();
}

function formatDimensions({
  heightCm,
  lengthCm,
  widthCm,
}: {
  heightCm: Prisma.Decimal | null;
  lengthCm: Prisma.Decimal | null;
  widthCm: Prisma.Decimal | null;
}) {
  if (!lengthCm || !widthCm || !heightCm) {
    return null;
  }

  return `${lengthCm.toString()} x ${widthCm.toString()} x ${heightCm.toString()} cm`;
}

function getFreightTransportWhere(user: AuthSessionUser) {
  if (user.roles.includes(AUTH_ROLES.SUPER_ADMIN)) {
    return {
      shipment: {
        deletedAt: null,
      },
    };
  }

  const canViewOrganizationFreight =
    hasPermission(user, PERMISSIONS.FREIGHT_TRANSPORT_MANAGE) ||
    hasPermission(user, PERMISSIONS.FREIGHT_TRANSPORT_UPDATE) ||
    hasPermission(user, PERMISSIONS.SHIPMENTS_MANAGE) ||
    hasPermission(user, PERMISSIONS.SHIPMENTS_ASSIGN) ||
    hasPermission(user, PERMISSIONS.SHIPMENTS_UPDATE);

  if (canViewOrganizationFreight && user.organizationId) {
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

export async function getFreightTransportsForUser(
  user: AuthSessionUser,
): Promise<FreightTransportListItem[]> {
  const freightTransports = await prisma.freightTransport.findMany({
    select: {
      etaAt: true,
      freightType: true,
      grossWeightKg: true,
      id: true,
      routeName: true,
      shipment: {
        select: {
          destinationAddress: {
            select: {
              city: true,
            },
          },
          mode: true,
          originAddress: {
            select: {
              city: true,
            },
          },
          shipmentNumber: true,
          status: true,
        },
      },
      shipmentId: true,
      status: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 50,
    where: getFreightTransportWhere(user),
  });

  return freightTransports.map((freightTransport) => ({
    destinationCity: freightTransport.shipment.destinationAddress.city,
    etaAt: formatDate(freightTransport.etaAt),
    freightType: freightTransport.freightType,
    grossWeightKg: decimalToString(freightTransport.grossWeightKg),
    id: freightTransport.id,
    originCity: freightTransport.shipment.originAddress.city,
    routeName: freightTransport.routeName,
    shipmentId: freightTransport.shipmentId,
    shipmentNumber: freightTransport.shipment.shipmentNumber,
    shipmentStatus: freightTransport.shipment.status,
    status: freightTransport.status,
    updatedAt: freightTransport.updatedAt.toISOString(),
  }));
}

export async function getFreightDispatchOptions(
  user: AuthSessionUser,
): Promise<FreightDispatchOptions> {
  const organizationWhere = user.roles.includes(AUTH_ROLES.SUPER_ADMIN)
    ? {}
    : {
        organizationId: user.organizationId ?? "",
      };

  const [drivers, vehicles] = await Promise.all([
    prisma.driver.findMany({
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        employeeNumber: "asc",
      },
      take: 100,
      where: {
        deletedAt: null,
        ...organizationWhere,
      },
    }),
    prisma.vehicle.findMany({
      orderBy: {
        registrationNumber: "asc",
      },
      take: 100,
      where: {
        deletedAt: null,
        ...organizationWhere,
      },
    }),
  ]);

  return {
    drivers: drivers.map((driver) => ({
      id: driver.id,
      label: `${driver.user?.name ?? driver.employeeNumber} - ${driver.status}`,
    })),
    vehicles: vehicles.map((vehicle) => ({
      id: vehicle.id,
      label: `${vehicle.registrationNumber} - ${vehicle.type} - ${vehicle.status}`,
    })),
  };
}

export async function getFreightTransportForUser(
  freightTransportId: string,
  user: AuthSessionUser,
): Promise<FreightTransportDetail | null> {
  const freightTransport = await prisma.freightTransport.findFirst({
    include: {
      cargoItems: {
        include: {
          container: {
            select: {
              containerNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      containers: {
        orderBy: {
          createdAt: "desc",
        },
      },
      documents: {
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
      machineryItems: {
        orderBy: {
          createdAt: "desc",
        },
      },
      routeStops: {
        orderBy: {
          sequence: "asc",
        },
      },
      shipment: {
        include: {
          assignedDriver: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
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
          vehicle: true,
        },
      },
      trackingEvents: {
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
      vehicleItems: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    where: {
      ...getFreightTransportWhere(user),
      id: freightTransportId,
    },
  });

  if (!freightTransport) {
    return null;
  }

  return {
    actualArrivalAt: formatDate(freightTransport.actualArrivalAt),
    actualDepartureAt: formatDate(freightTransport.actualDepartureAt),
    assignedDriver:
      freightTransport.shipment.assignedDriver?.user?.name ??
      freightTransport.shipment.assignedDriver?.employeeNumber ??
      null,
    assignedVehicle: freightTransport.shipment.vehicle?.registrationNumber ?? null,
    averageSpeedKph: decimalToString(freightTransport.averageSpeedKph),
    cargoItems: freightTransport.cargoItems.map((cargoItem) => ({
      cargoType: cargoItem.cargoType,
      commodityCode: cargoItem.commodityCode,
      containerNumber: cargoItem.container?.containerNumber ?? null,
      currency: cargoItem.currency,
      declaredValue: decimalToString(cargoItem.declaredValue),
      description: cargoItem.description,
      dimensions: formatDimensions(cargoItem),
      hazardous: cargoItem.hazardous,
      id: cargoItem.id,
      notes: cargoItem.notes,
      quantity: cargoItem.quantity,
      stackable: cargoItem.stackable,
      status: cargoItem.status,
      temperatureControlled: cargoItem.temperatureControlled,
      unit: cargoItem.unit,
      volumeCbm: decimalToString(cargoItem.volumeCbm),
      weightKg: decimalToString(cargoItem.weightKg),
    })),
    commodityCode: freightTransport.commodityCode,
    commodityDescription: freightTransport.commodityDescription,
    containerNumber: freightTransport.containerNumber,
    containers: freightTransport.containers.map((container) => ({
      containerNumber: container.containerNumber,
      containerType: container.containerType,
      currentWeightKg: decimalToString(container.currentWeightKg),
      id: container.id,
      loadedAt: formatDate(container.loadedAt),
      maxGrossWeightKg: decimalToString(container.maxGrossWeightKg),
      notes: container.notes,
      releasedAt: formatDate(container.releasedAt),
      sealNumber: container.sealNumber,
      status: container.status,
      tareWeightKg: decimalToString(container.tareWeightKg),
      temperatureSetC: decimalToString(container.temperatureSetC),
      volumeCbm: decimalToString(container.volumeCbm),
    })),
    destinationCity: freightTransport.shipment.destinationAddress.city,
    destinationTerminal: freightTransport.destinationTerminal,
    distanceKm: decimalToString(freightTransport.distanceKm),
    documents: freightTransport.documents.map((document) => ({
      createdAt: document.createdAt.toISOString(),
      documentType: document.documentType,
      expiresAt: formatDate(document.expiresAt),
      fileName: document.fileName,
      fileSizeBytes: document.fileSizeBytes,
      id: document.id,
      notes: document.notes,
      uploadedBy: document.uploadedBy?.name ?? null,
      verifiedAt: formatDate(document.verifiedAt),
    })),
    estimatedDurationHours: freightTransport.estimatedDurationHours,
    etaAt: formatDate(freightTransport.etaAt),
    freightType: freightTransport.freightType,
    grossWeightKg: decimalToString(freightTransport.grossWeightKg),
    hazmatClass: freightTransport.hazmatClass,
    id: freightTransport.id,
    incoterm: freightTransport.incoterm,
    machineryItems: freightTransport.machineryItems.map((item) => ({
      category: item.category,
      condition: item.condition,
      dimensions: formatDimensions(item),
      id: item.id,
      loadingInstructions: item.loadingInstructions,
      machine: [item.manufacturer, item.model, item.name].filter(Boolean).join(" ") || item.name,
      operatingWeightKg: decimalToString(item.operatingWeightKg),
      oversizePermitRequired: item.oversizePermitRequired,
      serialNumber: item.serialNumber,
      status: item.status,
    })),
    mode: freightTransport.shipment.mode,
    originCity: freightTransport.shipment.originAddress.city,
    originTerminal: freightTransport.originTerminal,
    palletCount: freightTransport.palletCount,
    plannedArrivalAt: formatDate(freightTransport.plannedArrivalAt),
    plannedDepartureAt: formatDate(freightTransport.plannedDepartureAt),
    priority: freightTransport.shipment.priority,
    refrigeratedRequired: freightTransport.refrigeratedRequired,
    routeCode: freightTransport.routeCode,
    routeName: freightTransport.routeName,
    routeStops: freightTransport.routeStops.map((stop) => ({
      actualArrivalAt: formatDate(stop.actualArrivalAt),
      actualDepartureAt: formatDate(stop.actualDepartureAt),
      city: stop.city,
      contactName: stop.contactName,
      countryCode: stop.countryCode,
      id: stop.id,
      name: stop.name,
      plannedArrivalAt: formatDate(stop.plannedArrivalAt),
      plannedDepartureAt: formatDate(stop.plannedDepartureAt),
      sequence: stop.sequence,
      stopType: stop.stopType,
    })),
    sealNumber: freightTransport.sealNumber,
    serviceLevel: freightTransport.shipment.serviceLevel,
    shipmentId: freightTransport.shipmentId,
    shipmentNumber: freightTransport.shipment.shipmentNumber,
    shipmentStatus: freightTransport.shipment.status,
    shipmentTimeline: freightTransport.shipment.trackingEvents.map((event) => ({
      eventType: event.eventType,
      id: event.id,
      message: event.message,
      occurredAt: event.occurredAt.toISOString(),
      packageNumber: event.package?.packageNumber ?? null,
      recordedBy: event.recordedBy?.name ?? null,
      shipmentStatus: event.shipmentStatus,
    })),
    specialInstructions: freightTransport.specialInstructions,
    status: freightTransport.status,
    temperatureMaxC: decimalToString(freightTransport.temperatureMaxC),
    temperatureMinC: decimalToString(freightTransport.temperatureMinC),
    trackingEvents: freightTransport.trackingEvents.map((event) => ({
      etaAt: formatDate(event.etaAt),
      eventType: event.eventType,
      id: event.id,
      location: event.location,
      message: event.message,
      occurredAt: event.occurredAt.toISOString(),
      recordedBy: event.recordedBy?.name ?? null,
      status: event.status,
    })),
    unNumber: freightTransport.unNumber,
    updatedAt: freightTransport.updatedAt.toISOString(),
    vehicleItems: freightTransport.vehicleItems.map((item) => ({
      condition: item.condition,
      id: item.id,
      keysAvailable: item.keysAvailable,
      odometerKm: item.odometerKm,
      operable: item.operable,
      plateNumber: item.plateNumber,
      status: item.status,
      vehicle: [item.year, item.make, item.model].filter(Boolean).join(" "),
      vin: item.vin,
    })),
    volumeCbm: decimalToString(freightTransport.volumeCbm),
  };
}
