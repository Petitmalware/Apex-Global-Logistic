import "server-only";

import type { Prisma } from "@prisma/client";

import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import type {
  ShipmentAddressView,
  ShipmentDetail,
  ShipmentListItem,
  ShipmentPackageView,
  ShipmentTrackingSnapshot,
} from "@/features/shipments/types";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { PERMISSIONS, hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

function formatDate(value: Date | null) {
  return value ? value.toISOString() : null;
}

function decimalToString(value: Prisma.Decimal | null) {
  return value === null ? null : value.toString();
}

function numberToWeightString(value: number) {
  return (Math.round(value * 1000) / 1000).toString();
}

function getVolumetricWeightKg(shipmentPackage: {
  heightCm: Prisma.Decimal | null;
  lengthCm: Prisma.Decimal | null;
  widthCm: Prisma.Decimal | null;
}) {
  if (!shipmentPackage.lengthCm || !shipmentPackage.widthCm || !shipmentPackage.heightCm) {
    return 0;
  }

  return (
    (shipmentPackage.lengthCm.toNumber() *
      shipmentPackage.widthCm.toNumber() *
      shipmentPackage.heightCm.toNumber()) /
    5000
  );
}

function mapAddress(address: {
  city: string;
  countryCode: string;
  line1: string;
  line2: string | null;
  name: string | null;
  postalCode: string | null;
  state: string | null;
}): ShipmentAddressView {
  return {
    city: address.city,
    countryCode: address.countryCode,
    line1: address.line1,
    line2: address.line2,
    name: address.name,
    postalCode: address.postalCode,
    state: address.state,
  };
}

function mapPackage(shipmentPackage: {
  barcode: string | null;
  currency: string;
  declaredValue: Prisma.Decimal | null;
  description: string | null;
  fragile: boolean;
  hazardous: boolean;
  heightCm: Prisma.Decimal | null;
  id: string;
  lengthCm: Prisma.Decimal | null;
  packageNumber: string;
  status: ShipmentPackageView["status"];
  type: ShipmentPackageView["type"];
  weightKg: Prisma.Decimal | null;
  widthCm: Prisma.Decimal | null;
  photos: Array<{
    caption: string | null;
    createdAt: Date;
    fileName: string;
    fileSizeBytes: number;
    id: string;
    mimeType: string;
    uploadedBy: {
      name: string;
    } | null;
  }>;
}): ShipmentPackageView {
  return {
    barcode: shipmentPackage.barcode,
    currency: shipmentPackage.currency,
    declaredValue: decimalToString(shipmentPackage.declaredValue),
    description: shipmentPackage.description,
    fragile: shipmentPackage.fragile,
    hazardous: shipmentPackage.hazardous,
    heightCm: decimalToString(shipmentPackage.heightCm),
    id: shipmentPackage.id,
    lengthCm: decimalToString(shipmentPackage.lengthCm),
    packageNumber: shipmentPackage.packageNumber,
    photos: shipmentPackage.photos.map((photo) => ({
      caption: photo.caption,
      createdAt: photo.createdAt.toISOString(),
      fileName: photo.fileName,
      fileSizeBytes: photo.fileSizeBytes,
      id: photo.id,
      mimeType: photo.mimeType,
      uploadedBy: photo.uploadedBy?.name ?? null,
    })),
    status: shipmentPackage.status,
    type: shipmentPackage.type,
    volumetricWeightKg: numberToWeightString(getVolumetricWeightKg(shipmentPackage)),
    weightKg: decimalToString(shipmentPackage.weightKg),
    widthCm: decimalToString(shipmentPackage.widthCm),
  };
}

function mapTimelineEvent(event: {
  eventType: ShipmentTrackingSnapshot["timeline"][number]["eventType"];
  id: string;
  message: string | null;
  occurredAt: Date;
  package?: {
    packageNumber: string;
  } | null;
  recordedBy?: {
    name: string;
  } | null;
  shipmentStatus: ShipmentTrackingSnapshot["timeline"][number]["shipmentStatus"];
}): ShipmentTrackingSnapshot["timeline"][number] {
  return {
    eventType: event.eventType,
    id: event.id,
    message: event.message,
    occurredAt: event.occurredAt.toISOString(),
    packageNumber: event.package?.packageNumber ?? null,
    recordedBy: event.recordedBy?.name ?? null,
    shipmentStatus: event.shipmentStatus,
  };
}

function mapTrackingSnapshot(shipment: {
  deliveryWindowEnd: Date | null;
  deliveryWindowStart: Date | null;
  destinationAddress: {
    city: string;
  };
  id: string;
  mode: ShipmentTrackingSnapshot["mode"];
  originAddress: {
    city: string;
  };
  pickupWindowEnd: Date | null;
  pickupWindowStart: Date | null;
  serviceLevel: string | null;
  shipmentNumber: string;
  status: ShipmentTrackingSnapshot["status"];
  trackingEvents: Array<Parameters<typeof mapTimelineEvent>[0]>;
  updatedAt: Date;
}): ShipmentTrackingSnapshot {
  return {
    deliveryWindowEnd: formatDate(shipment.deliveryWindowEnd),
    deliveryWindowStart: formatDate(shipment.deliveryWindowStart),
    destinationCity: shipment.destinationAddress.city,
    id: shipment.id,
    mode: shipment.mode,
    originCity: shipment.originAddress.city,
    pickupWindowEnd: formatDate(shipment.pickupWindowEnd),
    pickupWindowStart: formatDate(shipment.pickupWindowStart),
    serviceLevel: shipment.serviceLevel,
    shipmentNumber: shipment.shipmentNumber,
    status: shipment.status,
    timeline: shipment.trackingEvents.map(mapTimelineEvent),
    updatedAt: shipment.updatedAt.toISOString(),
  };
}

function getShipmentWhere(user: AuthSessionUser) {
  if (user.roles.includes(AUTH_ROLES.SUPER_ADMIN)) {
    return {
      deletedAt: null,
    };
  }

  const canViewOrganizationShipments =
    hasPermission(user, PERMISSIONS.SHIPMENTS_MANAGE) ||
    hasPermission(user, PERMISSIONS.SHIPMENTS_ASSIGN) ||
    hasPermission(user, PERMISSIONS.SHIPMENTS_UPDATE);

  if (canViewOrganizationShipments && user.organizationId) {
    return {
      deletedAt: null,
      organizationId: user.organizationId,
    };
  }

  return {
    deletedAt: null,
    OR: [
      {
        createdById: user.id,
      },
      {
        customerId: user.id,
      },
    ],
  };
}

export async function getShipmentsForUser(user: AuthSessionUser): Promise<ShipmentListItem[]> {
  const shipments = await prisma.shipment.findMany({
    select: {
      _count: {
        select: {
          packages: true,
        },
      },
      createdAt: true,
      destinationAddress: {
        select: {
          city: true,
        },
      },
      id: true,
      mode: true,
      originAddress: {
        select: {
          city: true,
        },
      },
      priority: true,
      referenceNumber: true,
      shipmentNumber: true,
      status: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 50,
    where: getShipmentWhere(user),
  });

  return shipments.map((shipment) => ({
    createdAt: shipment.createdAt.toISOString(),
    destinationCity: shipment.destinationAddress.city,
    id: shipment.id,
    mode: shipment.mode,
    originCity: shipment.originAddress.city,
    packageCount: shipment._count.packages,
    priority: shipment.priority,
    referenceNumber: shipment.referenceNumber,
    shipmentNumber: shipment.shipmentNumber,
    status: shipment.status,
    updatedAt: shipment.updatedAt.toISOString(),
  }));
}

export async function getShipmentForUser(
  shipmentId: string,
  user: AuthSessionUser,
): Promise<ShipmentDetail | null> {
  const shipment = await prisma.shipment.findFirst({
    include: {
      destinationAddress: true,
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
      originAddress: true,
      packages: {
        include: {
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
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      invoices: {
        include: {
          lineItems: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        where: {
          deletedAt: null,
        },
      },
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
    where: {
      ...getShipmentWhere(user),
      id: shipmentId,
    },
  });

  if (!shipment) {
    return null;
  }

  const history = await prisma.activityLog.findMany({
    include: {
      actor: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      occurredAt: "desc",
    },
    where: {
      entityId: shipment.id,
      entityType: "shipment",
    },
  });
  const actualWeightKg = shipment.packages.reduce(
    (sum, shipmentPackage) => sum + (shipmentPackage.weightKg?.toNumber() ?? 0),
    0,
  );
  const dimensionalWeightKg = shipment.packages.reduce(
    (sum, shipmentPackage) => sum + getVolumetricWeightKg(shipmentPackage),
    0,
  );
  const chargeableWeightKg = Math.max(1, actualWeightKg, dimensionalWeightKg);
  const invoice = shipment.invoices[0] ?? null;

  return {
    cancelledAt: formatDate(shipment.cancelledAt),
    cancellationReason: shipment.cancellationReason,
    createdAt: shipment.createdAt.toISOString(),
    deliveredAt: formatDate(shipment.deliveredAt),
    deliveryWindowEnd: formatDate(shipment.deliveryWindowEnd),
    deliveryWindowStart: formatDate(shipment.deliveryWindowStart),
    destination: mapAddress(shipment.destinationAddress),
    destinationCity: shipment.destinationAddress.city,
    documents: shipment.documents.map((document) => ({
      createdAt: document.createdAt.toISOString(),
      documentType: document.documentType,
      fileName: document.fileName,
      fileSizeBytes: document.fileSizeBytes,
      id: document.id,
      mimeType: document.mimeType,
      notes: document.notes,
      uploadedBy: document.uploadedBy?.name ?? null,
      verifiedAt: formatDate(document.verifiedAt),
    })),
    invoice: invoice
      ? {
          amountPaid: invoice.amountPaid.toString(),
          currency: invoice.currency,
          dueDate: formatDate(invoice.dueDate),
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          issuedAt: formatDate(invoice.issuedAt),
          lineItems: invoice.lineItems.map((lineItem) => ({
            description: lineItem.description,
            id: lineItem.id,
            quantity: lineItem.quantity.toString(),
            sortOrder: lineItem.sortOrder,
            total: lineItem.total.toString(),
            unitPrice: lineItem.unitPrice.toString(),
          })),
          status: invoice.status,
          subtotal: invoice.subtotal.toString(),
          taxTotal: invoice.taxTotal.toString(),
          total: invoice.total.toString(),
        }
      : null,
    history: history.map((item) => ({
      action: item.action,
      actorName: item.actor?.name ?? null,
      id: item.id,
      metadata: item.metadata,
      occurredAt: item.occurredAt.toISOString(),
    })),
    id: shipment.id,
    mode: shipment.mode,
    notes: shipment.notes,
    origin: mapAddress(shipment.originAddress),
    originCity: shipment.originAddress.city,
    packageCount: shipment.packages.length,
    packages: shipment.packages.map(mapPackage),
    pickupWindowEnd: formatDate(shipment.pickupWindowEnd),
    pickupWindowStart: formatDate(shipment.pickupWindowStart),
    priority: shipment.priority,
    referenceNumber: shipment.referenceNumber,
    serviceLevel: shipment.serviceLevel,
    shipmentNumber: shipment.shipmentNumber,
    status: shipment.status,
    weightSummary: {
      actualWeightKg: numberToWeightString(actualWeightKg),
      chargeableWeightKg: numberToWeightString(chargeableWeightKg),
      dimensionalWeightKg: numberToWeightString(dimensionalWeightKg),
    },
    timeline: shipment.trackingEvents.map((event) => ({
      ...mapTimelineEvent(event),
    })),
    updatedAt: shipment.updatedAt.toISOString(),
  };
}

export async function getShipmentTrackingSnapshotForUser(
  shipmentId: string,
  user: AuthSessionUser,
): Promise<ShipmentTrackingSnapshot | null> {
  const shipment = await prisma.shipment.findFirst({
    include: {
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
    where: {
      ...getShipmentWhere(user),
      id: shipmentId,
    },
  });

  return shipment ? mapTrackingSnapshot(shipment) : null;
}

export async function getPublicShipmentTrackingSnapshot(
  reference: string,
): Promise<ShipmentTrackingSnapshot | null> {
  const normalizedReference = reference.trim();

  if (!normalizedReference) {
    return null;
  }

  const shipment = await prisma.shipment.findFirst({
    include: {
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
      trackingEvents: {
        include: {
          package: {
            select: {
              packageNumber: true,
            },
          },
        },
        orderBy: {
          occurredAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    where: {
      deletedAt: null,
      OR: [
        {
          shipmentNumber: normalizedReference,
        },
        {
          referenceNumber: normalizedReference,
        },
      ],
    },
  });

  if (!shipment) {
    return null;
  }

  return mapTrackingSnapshot({
    ...shipment,
    trackingEvents: shipment.trackingEvents.map((event) => ({
      ...event,
      recordedBy: null,
    })),
  });
}
