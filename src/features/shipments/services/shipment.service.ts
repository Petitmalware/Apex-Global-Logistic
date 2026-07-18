import "server-only";

import { randomUUID } from "node:crypto";
import {
  ActivityAction,
  AddressType,
  EmailTemplateCategory,
  InvoiceLineType,
  InvoiceStatus,
  PackageStatus,
  ShipmentStatus,
  TrackingEventType,
  UserStatus,
  type Prisma,
} from "@prisma/client";

import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import type {
  PackagePhotoInput,
  ParcelBookingOptionsInput,
  ShipmentDocumentInput,
  ShipmentFormInput,
  ShipmentStatusUpdateInput,
} from "@/features/shipments/schemas/shipment.schemas";
import {
  calculateParcelQuote,
  type ParcelQuote,
} from "@/features/shipments/services/parcel-pricing";
import { notifyShipmentStatusChanged } from "@/features/notifications/services/notification.service";
import { queueBrandedEmail } from "@/features/emails/services/email.service";
import { publishShipmentTrackingUpdate } from "@/features/shipments/services/shipment-realtime.service";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { PERMISSIONS, hasPermission } from "@/lib/auth/rbac";
import { AuthError } from "@/lib/auth/errors";
import { prisma } from "@/lib/db";
import { kilogramsToPounds } from "@/lib/measurements";
import {
  DOCUMENT_EXTENSIONS,
  DOCUMENT_MIME_TYPES,
  IMAGE_EXTENSIONS,
  IMAGE_MIME_TYPES,
  persistValidatedUpload,
} from "@/lib/security/file-validation";

const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_PACKAGE_PHOTO_SIZE_BYTES = 8 * 1024 * 1024;
const shipmentDocumentUploadRules = {
  acceptedMimeTypes: DOCUMENT_MIME_TYPES,
  allowedExtensions: DOCUMENT_EXTENSIONS,
  emptyFileMessage: "Attach a document before uploading.",
  maxSizeBytes: MAX_DOCUMENT_SIZE_BYTES,
  tooLargeMessage: "Documents must be 10MB or smaller.",
  unsupportedTypeMessage: "Unsupported document type.",
};
const packagePhotoUploadRules = {
  acceptedMimeTypes: IMAGE_MIME_TYPES,
  allowedExtensions: IMAGE_EXTENSIONS,
  emptyFileMessage: "Attach a package photo before uploading.",
  maxSizeBytes: MAX_PACKAGE_PHOTO_SIZE_BYTES,
  tooLargeMessage: "Package photos must be 8MB or smaller.",
  unsupportedTypeMessage: "Package photos must be JPG, PNG, or WebP.",
};
const REMOTE_DATABASE_TRANSACTION_OPTIONS = {
  maxWait: 20_000,
  timeout: 60_000,
};

type ManualRecipientMetadata = {
  email: string | null;
  name: string | null;
  phone: string | null;
};

type OfficeDetailsMetadata = NonNullable<ShipmentFormInput["officeDetails"]>;

function toDecimal(value?: number) {
  return value === undefined ? undefined : value;
}

function hasShipmentMutationAccess(user: AuthSessionUser) {
  return (
    hasPermission(user, PERMISSIONS.SHIPMENTS_MANAGE) ||
    hasPermission(user, PERMISSIONS.SHIPMENTS_UPDATE)
  );
}

function hasTrackingMutationAccess(user: AuthSessionUser) {
  return (
    hasPermission(user, PERMISSIONS.SHIPMENTS_MANAGE) ||
    hasPermission(user, PERMISSIONS.SHIPMENTS_UPDATE) ||
    hasPermission(user, PERMISSIONS.TRACKING_CREATE)
  );
}

function canAccessOrganization(user: AuthSessionUser, organizationId: string) {
  return user.roles.includes(AUTH_ROLES.SUPER_ADMIN) || user.organizationId === organizationId;
}

async function getSelectedCustomerId(customerId: string | undefined) {
  if (!customerId) {
    return null;
  }

  const customer = await prisma.user.findFirst({
    select: {
      id: true,
    },
    where: {
      deletedAt: null,
      id: customerId,
      status: {
        in: [UserStatus.ACTIVE, UserStatus.INVITED],
      },
      userRoles: {
        some: {
          role: {
            key: AUTH_ROLES.CUSTOMER,
            organizationId: null,
          },
        },
      },
    },
  });

  if (!customer) {
    throw new AuthError(
      "Selected customer account was not found. Ask the customer to create an account first.",
      404,
      "CUSTOMER_NOT_FOUND",
    );
  }

  return customer.id;
}

function getManualRecipientMetadata(
  manualRecipient: ShipmentFormInput["manualRecipient"] | undefined,
): ManualRecipientMetadata | null {
  const name = manualRecipient?.name?.trim();
  const email = manualRecipient?.email?.trim().toLowerCase();
  const phone = manualRecipient?.phone?.trim();

  if (!name && !email && !phone) {
    return null;
  }

  return {
    email: email || null,
    name: name || null,
    phone: phone || null,
  };
}

function getOfficeDetailsMetadata(
  officeDetails: ShipmentFormInput["officeDetails"] | undefined,
): OfficeDetailsMetadata | null {
  if (!officeDetails) {
    return null;
  }

  const normalized = Object.fromEntries(
    Object.entries(officeDetails).map(([key, value]) => [
      key,
      typeof value === "string" && value.trim() ? value.trim() : null,
    ]),
  ) as OfficeDetailsMetadata;

  return Object.values(normalized).some(Boolean) ? normalized : null;
}

function getJsonObject(value: Prisma.JsonValue | null): Prisma.InputJsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Prisma.InputJsonObject)
    : {};
}

function getManualRecipientFromMetadata(
  metadata: Prisma.JsonValue | null,
): ManualRecipientMetadata | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const value = "manualRecipient" in metadata ? metadata.manualRecipient : null;

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const email = "email" in value && typeof value.email === "string" ? value.email : null;
  const name = "name" in value && typeof value.name === "string" ? value.name : null;
  const phone = "phone" in value && typeof value.phone === "string" ? value.phone : null;

  return email || name || phone ? { email, name, phone } : null;
}

function getPublicTrackingMetadata(
  publicTracking: ShipmentFormInput["publicTracking"],
  existingMetadata?: Prisma.JsonValue | null,
) {
  const existing = getJsonObject(existingMetadata ?? null);
  const existingPreferences =
    "publicTracking" in existing &&
    existing.publicTracking &&
    typeof existing.publicTracking === "object" &&
    !Array.isArray(existing.publicTracking)
      ? (existing.publicTracking as Record<string, unknown>)
      : {};
  const shareContactDetails =
    publicTracking.shareContactDetails ??
    (typeof existingPreferences.shareContactDetails === "boolean"
      ? existingPreferences.shareContactDetails
      : true);
  const shareParties =
    publicTracking.shareParties ??
    (typeof existingPreferences.shareParties === "boolean"
      ? existingPreferences.shareParties
      : true);
  const sharePetDetails =
    publicTracking.sharePetDetails ??
    (typeof existingPreferences.sharePetDetails === "boolean"
      ? existingPreferences.sharePetDetails
      : true);

  return { shareContactDetails, shareParties, sharePetDetails };
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
      entityType: "shipment",
      metadata,
      organizationId,
    },
  });
}

export async function ensureShipmentOrganization(user: AuthSessionUser) {
  if (user.organizationId) {
    return user.organizationId;
  }

  const organization = await prisma.organization.upsert({
    create: {
      email: user.email,
      name: `${user.name}'s Workspace`,
      slug: `apex-${user.id.slice(0, 8)}`,
    },
    update: {},
    where: {
      slug: `apex-${user.id.slice(0, 8)}`,
    },
  });

  await prisma.user.update({
    data: {
      organizationId: organization.id,
    },
    where: {
      id: user.id,
    },
  });

  return organization.id;
}

async function getCustomerBookingOrganizationId(user: AuthSessionUser) {
  if (user.organizationId) {
    return user.organizationId;
  }

  const organization = await prisma.organization.findFirst({
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
    },
    where: {
      deletedAt: null,
      users: {
        some: {
          userRoles: {
            some: {
              role: {
                key: AUTH_ROLES.ADMIN,
              },
            },
          },
        },
      },
    },
  });

  return organization?.id ?? ensureShipmentOrganization(user);
}

async function generateShipmentNumber(organizationId: string) {
  const now = new Date();
  const prefix = `AGL-${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  for (let index = 0; index < 8; index += 1) {
    const candidate = `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const existingShipment = await prisma.shipment.findFirst({
      select: { id: true },
      where: {
        organizationId,
        shipmentNumber: candidate,
      },
    });

    if (!existingShipment) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique shipment number.");
}

async function generateInvoiceNumber(organizationId: string) {
  const now = new Date();
  const prefix = `INV-${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  for (let index = 0; index < 8; index += 1) {
    const candidate = `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const existingInvoice = await prisma.invoice.findFirst({
      select: { id: true },
      where: {
        invoiceNumber: candidate,
        organizationId,
      },
    });

    if (!existingInvoice) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique invoice number.");
}

function mapShipmentTimestamps(status: ShipmentStatus) {
  const now = new Date();

  return {
    bookedAt: status === ShipmentStatus.BOOKED ? now : undefined,
    cancelledAt: status === ShipmentStatus.CANCELLED ? now : undefined,
    deliveredAt: status === ShipmentStatus.DELIVERED ? now : undefined,
    dispatchedAt: status === ShipmentStatus.IN_TRANSIT ? now : undefined,
  };
}

function getTrackingEventType(status: ShipmentStatus) {
  const eventMap = {
    [ShipmentStatus.BOOKED]: TrackingEventType.CREATED,
    [ShipmentStatus.CANCELLED]: TrackingEventType.CANCELLED,
    [ShipmentStatus.DELIVERED]: TrackingEventType.DELIVERED,
    [ShipmentStatus.DRAFT]: TrackingEventType.CREATED,
    [ShipmentStatus.HELD]: TrackingEventType.EXCEPTION,
    [ShipmentStatus.IN_TRANSIT]: TrackingEventType.IN_TRANSIT,
    [ShipmentStatus.PENDING_PICKUP]: TrackingEventType.CREATED,
    [ShipmentStatus.RETURNED]: TrackingEventType.EXCEPTION,
  } satisfies Record<ShipmentStatus, TrackingEventType>;

  return eventMap[status];
}

function buildAddressCreateInput(address: ShipmentFormInput["origin"], type: AddressType) {
  return {
    city: address.city || "Location not provided",
    countryCode: address.countryCode || "XX",
    line1: address.line1 || "Address not provided",
    line2: address.line2,
    name: address.name,
    postalCode: address.postalCode,
    state: address.state,
    type,
  };
}

function buildPackageCreateInput(shipmentNumber: string, packages: ShipmentFormInput["packages"]) {
  return packages.map((shipmentPackage, index) => ({
    barcode: shipmentPackage.barcode,
    currency: shipmentPackage.currency,
    declaredValue: toDecimal(shipmentPackage.declaredValue),
    description: shipmentPackage.description,
    fragile: shipmentPackage.fragile,
    hazardous: shipmentPackage.hazardous,
    heightCm: toDecimal(shipmentPackage.heightCm),
    lengthCm: toDecimal(shipmentPackage.lengthCm),
    packageNumber:
      shipmentPackage.packageNumber ??
      `${shipmentNumber}-PKG-${String(index + 1).padStart(2, "0")}`,
    status: shipmentPackage.status,
    type: shipmentPackage.type,
    weightKg: toDecimal(shipmentPackage.weightKg),
    widthCm: toDecimal(shipmentPackage.widthCm),
  }));
}

export async function createShipment(
  input: ShipmentFormInput,
  user: AuthSessionUser,
  options: { customerBooking?: boolean } = {},
) {
  const organizationId = options.customerBooking
    ? await getCustomerBookingOrganizationId(user)
    : await ensureShipmentOrganization(user);
  const customerId = await getSelectedCustomerId(input.customerId);
  const manualRecipient = customerId ? null : getManualRecipientMetadata(input.manualRecipient);
  const destinationInput =
    manualRecipient?.name && !input.destination.name
      ? {
          ...input.destination,
          name: manualRecipient.name,
        }
      : input.destination;
  const shipmentNumber = await generateShipmentNumber(organizationId);
  const status = input.status;
  const officeDetails = getOfficeDetailsMetadata(input.officeDetails);
  const publicTracking = getPublicTrackingMetadata(input.publicTracking);

  const shipment = await prisma.$transaction(async (transaction) => {
    const [originAddress, destinationAddress] = await Promise.all([
      transaction.address.create({
        data: {
          ...buildAddressCreateInput(input.origin, AddressType.PICKUP),
          organizationId,
        },
        select: {
          id: true,
        },
      }),
      transaction.address.create({
        data: {
          ...buildAddressCreateInput(destinationInput, AddressType.DELIVERY),
          organizationId,
        },
        select: {
          id: true,
        },
      }),
    ]);

    const createdShipment = await transaction.shipment.create({
      data: {
        ...mapShipmentTimestamps(status),
        createdById: user.id,
        customerId,
        deliveryWindowEnd: input.deliveryWindowEnd,
        deliveryWindowStart: input.deliveryWindowStart,
        destinationAddressId: destinationAddress.id,
        metadata:
          manualRecipient ||
          officeDetails ||
          options.customerBooking ||
          publicTracking.shareContactDetails ||
          publicTracking.shareParties ||
          publicTracking.sharePetDetails
            ? {
                creationSource: options.customerBooking ? "CUSTOMER_BOOKING" : "ADMIN_CREATED",
                manualRecipient,
                officeDetails,
                publicTracking,
              }
            : undefined,
        mode: input.mode,
        notes: input.notes,
        organizationId,
        originAddressId: originAddress.id,
        pickupWindowEnd: input.pickupWindowEnd,
        pickupWindowStart: input.pickupWindowStart,
        priority: input.priority,
        referenceNumber: input.referenceNumber,
        serviceLevel: input.serviceLevel,
        shipmentNumber,
        status,
      },
      select: {
        customerId: true,
        id: true,
        metadata: true,
        organizationId: true,
        shipmentNumber: true,
      },
    });

    await transaction.shipmentPackage.createMany({
      data: buildPackageCreateInput(shipmentNumber, input.packages).map((shipmentPackage) => ({
        ...shipmentPackage,
        shipmentId: createdShipment.id,
      })),
    });

    await transaction.trackingEvent.create({
      data: {
        eventType: TrackingEventType.CREATED,
        message: "Shipment record created.",
        occurredAt: new Date(),
        recordedById: user.id,
        shipmentId: createdShipment.id,
        shipmentStatus: status,
      },
    });

    await transaction.activityLog.create({
      data: {
        action: ActivityAction.CREATE,
        actorId: user.id,
        entityId: createdShipment.id,
        entityType: "shipment",
        metadata: {
          manualRecipient,
          shipmentNumber,
          status,
        },
        organizationId,
      },
    });

    return createdShipment;
  }, REMOTE_DATABASE_TRANSACTION_OPTIONS);

  const creationMessage =
    status === ShipmentStatus.DRAFT
      ? `Booking request ${shipment.shipmentNumber} was submitted for operations review.`
      : `Shipment ${shipment.shipmentNumber} was created and assigned a tracking number.`;

  await notifyShipmentStatusChanged({
    customerId: shipment.customerId,
    createdById: user.id,
    message: creationMessage,
    organizationId: shipment.organizationId,
    shipmentId: shipment.id,
    shipmentNumber: shipment.shipmentNumber,
    status,
  }).catch(() => null);

  if (manualRecipient?.email) {
    await queueBrandedEmail({
      bodyHtml: `<p>Hello {{customerName}},</p><p>${creationMessage}</p><p>Use tracking number <strong>{{trackingNumber}}</strong> on the Apex Global Logistics tracking page for updates.</p>`,
      category: EmailTemplateCategory.SHIPMENT,
      organizationId: shipment.organizationId,
      recipientEmail: manualRecipient.email,
      recipientName: manualRecipient.name,
      shipmentId: shipment.id,
      subject: `Shipment ${shipment.shipmentNumber} created`,
      trackingNumber: shipment.shipmentNumber,
      variables: {
        customerName: manualRecipient.name ?? "Customer",
      },
    }).catch(() => null);
  }

  return shipment;
}

function getInvoiceLines(quote: ParcelQuote) {
  const chargeableWeightLb = kilogramsToPounds(quote.chargeableWeightKg).toFixed(2);

  return [
    {
      description: `Parcel line haul - ${chargeableWeightLb} lb chargeable weight`,
      lineType: InvoiceLineType.SERVICE,
      quantity: quote.chargeableWeightKg,
      sortOrder: 1,
      taxRate: 0,
      total: quote.lineHaul,
      unitPrice: quote.chargeableWeightKg
        ? quote.lineHaul / quote.chargeableWeightKg
        : quote.lineHaul,
    },
    {
      description: "Fuel surcharge",
      lineType: InvoiceLineType.SURCHARGE,
      quantity: 1,
      sortOrder: 2,
      taxRate: 0,
      total: quote.fuelSurcharge,
      unitPrice: quote.fuelSurcharge,
    },
    quote.fragileFee
      ? {
          description: "Fragile package handling",
          lineType: InvoiceLineType.SURCHARGE,
          quantity: 1,
          sortOrder: 3,
          taxRate: 0,
          total: quote.fragileFee,
          unitPrice: quote.fragileFee,
        }
      : null,
    quote.hazardousFee
      ? {
          description: "Hazardous package handling",
          lineType: InvoiceLineType.SURCHARGE,
          quantity: 1,
          sortOrder: 4,
          taxRate: 0,
          total: quote.hazardousFee,
          unitPrice: quote.hazardousFee,
        }
      : null,
    quote.signatureFee
      ? {
          description: "Signature required service",
          lineType: InvoiceLineType.SURCHARGE,
          quantity: 1,
          sortOrder: 5,
          taxRate: 0,
          total: quote.signatureFee,
          unitPrice: quote.signatureFee,
        }
      : null,
    quote.insuranceFee
      ? {
          description: "Declared value protection",
          lineType: InvoiceLineType.SURCHARGE,
          quantity: 1,
          sortOrder: 6,
          taxRate: 0,
          total: quote.insuranceFee,
          unitPrice: quote.insuranceFee,
        }
      : null,
    {
      description: "Estimated tax",
      lineType: InvoiceLineType.TAX,
      quantity: 1,
      sortOrder: 7,
      taxRate: 0,
      total: quote.taxTotal,
      unitPrice: quote.taxTotal,
    },
  ].filter((line) => line !== null);
}

export async function createParcelBooking({
  input,
  options,
  user,
  workflow = "admin_creation",
}: {
  input: ShipmentFormInput;
  options: ParcelBookingOptionsInput;
  user: AuthSessionUser;
  workflow?: "admin_creation" | "customer_booking";
}) {
  const isCustomerBooking = workflow === "customer_booking";
  const parcelInput: ShipmentFormInput = {
    ...input,
    mode: input.mode,
    serviceLevel: input.serviceLevel || "Parcel Standard",
    status: isCustomerBooking ? ShipmentStatus.DRAFT : ShipmentStatus.BOOKED,
  };
  const shipment = await createShipment(parcelInput, user, {
    customerBooking: isCustomerBooking,
  });
  const manualRecipient = getManualRecipientFromMetadata(shipment.metadata);
  const quote = calculateParcelQuote(parcelInput, options);

  if (isCustomerBooking) {
    await prisma.shipment.update({
      data: {
        metadata: {
          ...getJsonObject(shipment.metadata),
          bookingType: "PARCEL",
          insuranceRequested: options.insuranceRequested,
          parcelQuote: quote,
          receiptEmail: options.receiptEmail,
          signatureRequired: options.signatureRequired,
          workflow,
        },
      },
      where: {
        id: shipment.id,
      },
    });

    return shipment;
  }

  const invoiceNumber = await generateInvoiceNumber(shipment.organizationId);
  const dueDate = new Date();

  dueDate.setDate(dueDate.getDate() + 7);

  await prisma.$transaction(async (transaction) => {
    await transaction.shipment.update({
      data: {
        metadata: {
          ...getJsonObject(shipment.metadata),
          bookingType: "PARCEL",
          insuranceRequested: options.insuranceRequested,
          parcelQuote: quote,
          receiptEmail: options.receiptEmail,
          signatureRequired: options.signatureRequired,
          workflow,
        },
      },
      where: {
        id: shipment.id,
      },
    });

    const invoice = await transaction.invoice.create({
      data: {
        currency: quote.currency,
        customerId: shipment.customerId,
        dueDate,
        invoiceNumber,
        issuedAt: new Date(),
        lineItems: {
          create: getInvoiceLines(quote).map((line) => ({
            description: line.description,
            lineType: line.lineType,
            quantity: line.quantity,
            sortOrder: line.sortOrder,
            taxRate: line.taxRate,
            total: line.total,
            unitPrice: line.unitPrice,
          })),
        },
        metadata: {
          billTo: manualRecipient
            ? {
                email: manualRecipient.email,
                name: manualRecipient.name,
                phone: manualRecipient.phone,
                source: "manual_shipment_recipient",
              }
            : undefined,
          bookingType: "PARCEL",
          quote,
        },
        notes: "Automatically generated from parcel booking.",
        organizationId: shipment.organizationId,
        shipmentId: shipment.id,
        status: InvoiceStatus.ISSUED,
        subtotal: quote.subtotal,
        taxTotal: quote.taxTotal,
        total: quote.total,
      },
      select: {
        id: true,
      },
    });

    await transaction.activityLog.create({
      data: {
        action: ActivityAction.CREATE,
        actorId: user.id,
        entityId: shipment.id,
        entityType: "shipment",
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber,
          total: quote.total,
        },
        organizationId: shipment.organizationId,
      },
    });
  });

  return shipment;
}

export async function updateShipment(
  shipmentId: string,
  input: ShipmentFormInput,
  user: AuthSessionUser,
) {
  const officeDetails = getOfficeDetailsMetadata(input.officeDetails);
  const existingShipment = await prisma.shipment.findUnique({
    include: {
      packages: true,
    },
    where: {
      id: shipmentId,
    },
  });

  if (!existingShipment || existingShipment.deletedAt) {
    throw new AuthError("Shipment not found.", 404, "SHIPMENT_NOT_FOUND");
  }

  const publicTracking = getPublicTrackingMetadata(input.publicTracking, existingShipment.metadata);

  const isOwner =
    existingShipment.customerId === user.id || existingShipment.createdById === user.id;
  const canEditOwnedDraft =
    isOwner &&
    (
      [
        ShipmentStatus.DRAFT,
        ShipmentStatus.BOOKED,
        ShipmentStatus.PENDING_PICKUP,
      ] as ShipmentStatus[]
    ).includes(existingShipment.status);

  const canEditWithStaffAccess =
    hasShipmentMutationAccess(user) && canAccessOrganization(user, existingShipment.organizationId);

  if (!canEditWithStaffAccess && !canEditOwnedDraft) {
    throw new AuthError("You do not have permission to edit this shipment.", 403, "FORBIDDEN");
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.address.update({
      data: buildAddressCreateInput(input.origin, AddressType.PICKUP),
      where: {
        id: existingShipment.originAddressId,
      },
    });

    await transaction.address.update({
      data: buildAddressCreateInput(input.destination, AddressType.DELIVERY),
      where: {
        id: existingShipment.destinationAddressId,
      },
    });

    await transaction.shipment.update({
      data: {
        deliveryWindowEnd: input.deliveryWindowEnd,
        deliveryWindowStart: input.deliveryWindowStart,
        mode: input.mode,
        metadata: {
          ...getJsonObject(existingShipment.metadata),
          officeDetails,
          publicTracking,
        },
        notes: input.notes,
        pickupWindowEnd: input.pickupWindowEnd,
        pickupWindowStart: input.pickupWindowStart,
        priority: input.priority,
        referenceNumber: input.referenceNumber,
        serviceLevel: input.serviceLevel,
      },
      where: {
        id: shipmentId,
      },
    });

    const submittedPackageIds = input.packages
      .map((shipmentPackage) => shipmentPackage.id)
      .filter((id): id is string => Boolean(id));
    const packageIdsToDelete = existingShipment.packages
      .map((shipmentPackage) => shipmentPackage.id)
      .filter((packageId) => !submittedPackageIds.includes(packageId));

    for (const [index, shipmentPackage] of input.packages.entries()) {
      const packageData = buildPackageCreateInput(existingShipment.shipmentNumber, [
        shipmentPackage,
      ])[0];

      if (shipmentPackage.id) {
        await transaction.shipmentPackage.update({
          data: packageData!,
          where: {
            id: shipmentPackage.id,
          },
        });
        continue;
      }

      await transaction.shipmentPackage.create({
        data: {
          ...packageData!,
          packageNumber:
            shipmentPackage.packageNumber ??
            `${existingShipment.shipmentNumber}-PKG-${String(index + 1).padStart(2, "0")}`,
          shipmentId,
        },
      });
    }

    if (packageIdsToDelete.length) {
      await transaction.shipmentPackage.deleteMany({
        where: {
          id: {
            in: packageIdsToDelete,
          },
          shipmentId,
        },
      });
    }

    await transaction.activityLog.create({
      data: {
        action: ActivityAction.UPDATE,
        actorId: user.id,
        entityId: shipmentId,
        entityType: "shipment",
        metadata: {
          packageCount: input.packages.length,
        },
        organizationId: existingShipment.organizationId,
      },
    });
  });
}

export async function updateShipmentStatus(
  shipmentId: string,
  input: ShipmentStatusUpdateInput,
  user: AuthSessionUser,
) {
  if (!hasTrackingMutationAccess(user)) {
    throw new AuthError("You do not have permission to update tracking.", 403, "FORBIDDEN");
  }

  const shipment = await prisma.shipment.findUnique({
    select: {
      createdById: true,
      customerId: true,
      deletedAt: true,
      id: true,
      organizationId: true,
      shipmentNumber: true,
      status: true,
    },
    where: {
      id: shipmentId,
    },
  });

  if (!shipment || shipment.deletedAt) {
    throw new AuthError("Shipment not found.", 404, "SHIPMENT_NOT_FOUND");
  }

  if (!canAccessOrganization(user, shipment.organizationId)) {
    throw new AuthError("You do not have permission to update this shipment.", 403, "FORBIDDEN");
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.shipment.update({
      data: {
        ...mapShipmentTimestamps(input.status),
        cancellationReason: input.status === ShipmentStatus.CANCELLED ? input.message : undefined,
        status: input.status,
      },
      where: {
        id: shipmentId,
      },
    });

    if (input.status === ShipmentStatus.DELIVERED) {
      await transaction.shipmentPackage.updateMany({
        data: {
          status: PackageStatus.DELIVERED,
        },
        where: {
          shipmentId,
        },
      });
    }

    if (input.status === ShipmentStatus.IN_TRANSIT) {
      await transaction.shipmentPackage.updateMany({
        data: {
          status: PackageStatus.IN_TRANSIT,
        },
        where: {
          shipmentId,
          status: {
            in: [PackageStatus.PENDING, PackageStatus.LOADED],
          },
        },
      });
    }

    await transaction.trackingEvent.create({
      data: {
        eventType: input.eventType || getTrackingEventType(input.status),
        latitude: input.latitude,
        longitude: input.longitude,
        message: input.message,
        metadata: input.location
          ? {
              location: input.location,
            }
          : undefined,
        occurredAt: input.occurredAt ?? new Date(),
        recordedById: user.id,
        shipmentId,
        shipmentStatus: input.status,
      },
    });

    await transaction.activityLog.create({
      data: {
        action: ActivityAction.UPDATE,
        actorId: user.id,
        entityId: shipmentId,
        entityType: "shipment",
        metadata: {
          fromStatus: shipment.status,
          location: input.location,
          message: input.message,
          toStatus: input.status,
        },
        organizationId: shipment.organizationId,
      },
    });
  });

  await publishShipmentTrackingUpdate(shipmentId).catch(() => null);
  await notifyShipmentStatusChanged({
    createdById: shipment.createdById,
    customerId: shipment.customerId,
    message: input.message,
    organizationId: shipment.organizationId,
    shipmentId,
    shipmentNumber: shipment.shipmentNumber,
    status: input.status,
  }).catch(() => null);
}

export async function uploadShipmentDocument({
  document,
  file,
  shipmentId,
  user,
}: {
  document: ShipmentDocumentInput;
  file: File;
  shipmentId: string;
  user: AuthSessionUser;
}) {
  const shipment = await prisma.shipment.findUnique({
    select: {
      createdById: true,
      customerId: true,
      deletedAt: true,
      id: true,
      organizationId: true,
    },
    where: {
      id: shipmentId,
    },
  });

  if (!shipment || shipment.deletedAt) {
    throw new AuthError("Shipment not found.", 404, "SHIPMENT_NOT_FOUND");
  }

  const canUpload =
    shipment.customerId === user.id ||
    shipment.createdById === user.id ||
    (canAccessOrganization(user, shipment.organizationId) &&
      (hasPermission(user, PERMISSIONS.SHIPMENTS_UPDATE) ||
        hasPermission(user, PERMISSIONS.SHIPMENTS_MANAGE)));

  if (!canUpload) {
    throw new AuthError("You do not have permission to upload documents.", 403, "FORBIDDEN");
  }

  const fileData = await persistValidatedUpload({
    file,
    folderSegments: ["shipments", shipmentId],
    rules: shipmentDocumentUploadRules,
    storageKeyPrefix: `shipments/${shipmentId}`,
  });

  const createdDocument = await prisma.shipmentDocument.create({
    data: {
      ...fileData,
      documentType: document.documentType,
      notes: document.notes,
      shipmentId,
      uploadedById: user.id,
    },
    select: {
      id: true,
    },
  });

  await logShipmentActivity({
    action: ActivityAction.CREATE,
    entityId: shipmentId,
    metadata: {
      documentId: createdDocument.id,
      documentType: document.documentType,
      fileName: file.name,
    },
    organizationId: shipment.organizationId,
    user,
  });
}

export async function uploadPackagePhoto({
  file,
  photo,
  shipmentId,
  user,
}: {
  file: File;
  photo: PackagePhotoInput;
  shipmentId: string;
  user: AuthSessionUser;
}) {
  const shipmentPackage = await prisma.shipmentPackage.findFirst({
    include: {
      shipment: {
        select: {
          createdById: true,
          customerId: true,
          deletedAt: true,
          organizationId: true,
        },
      },
    },
    where: {
      id: photo.packageId,
      shipmentId,
    },
  });

  if (!shipmentPackage || shipmentPackage.shipment.deletedAt) {
    throw new AuthError("Package not found.", 404, "PACKAGE_NOT_FOUND");
  }

  const canUpload =
    shipmentPackage.shipment.customerId === user.id ||
    shipmentPackage.shipment.createdById === user.id ||
    (canAccessOrganization(user, shipmentPackage.shipment.organizationId) &&
      (hasPermission(user, PERMISSIONS.PACKAGES_UPDATE) ||
        hasPermission(user, PERMISSIONS.SHIPMENTS_MANAGE)));

  if (!canUpload) {
    throw new AuthError("You do not have permission to upload package photos.", 403, "FORBIDDEN");
  }

  const fileData = await persistValidatedUpload({
    file,
    folderSegments: ["shipments", shipmentId, "packages", photo.packageId, "photos"],
    rules: packagePhotoUploadRules,
    storageKeyPrefix: `shipments/${shipmentId}/packages/${photo.packageId}/photos`,
  });

  const createdPhoto = await prisma.shipmentPackagePhoto.create({
    data: {
      ...fileData,
      caption: photo.caption,
      packageId: photo.packageId,
      uploadedById: user.id,
    },
    select: {
      id: true,
    },
  });

  await logShipmentActivity({
    action: ActivityAction.CREATE,
    entityId: shipmentId,
    metadata: {
      fileName: file.name,
      packageId: photo.packageId,
      packagePhotoId: createdPhoto.id,
    },
    organizationId: shipmentPackage.shipment.organizationId,
    user,
  });
}
