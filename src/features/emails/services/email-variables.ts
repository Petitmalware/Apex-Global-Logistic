import "server-only";

import { env } from "@/config/env.server";
import { emailVariableKeys } from "@/features/emails/constants";
import { getCompanyProfile } from "@/features/settings/queries/company-profile.queries";
import { formatShipmentStatus } from "@/features/shipments/status-labels";
import { prisma } from "@/lib/db";

export type EmailVariableMap = Partial<Record<(typeof emailVariableKeys)[number], string>>;

export type ShipmentEmailContext = {
  currentLocation?: string | null;
  destinationCity?: string | null;
  estimatedDeliveryDate?: string | null;
  originCity?: string | null;
  shipmentNumber?: string | null;
  shipmentStatus?: string | null;
  trackingNumber?: string | null;
};

export type EmailBranding = {
  companyName: string;
  supportEmail: string;
  supportPhone: string;
  website: string;
};

export type EmailVariableContext = {
  recipientEmail?: string | null;
  recipientName?: string | null;
  shipment?: ShipmentEmailContext | null;
  variables?: Record<string, string | undefined>;
};

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
      }).format(value)
    : "";
}

function formatDocumentDate(value = new Date()) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "long",
  }).format(value);
}

export function replaceEmailVariables(
  value: string,
  variables: Record<string, string | undefined>,
) {
  return value.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key: string) => {
    const replacement = variables[key];

    return replacement === undefined || replacement === null ? "" : replacement;
  });
}

export async function getShipmentEmailContext(shipmentId?: string) {
  if (!shipmentId) {
    return null;
  }

  const shipment = await prisma.shipment.findUnique({
    include: {
      customer: {
        select: {
          email: true,
          name: true,
        },
      },
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
        orderBy: {
          occurredAt: "desc",
        },
        select: {
          metadata: true,
        },
        take: 1,
      },
    },
    where: {
      id: shipmentId,
    },
  });

  if (!shipment || shipment.deletedAt) {
    return null;
  }

  const latestTrackingMetadata = shipment.trackingEvents[0]?.metadata;
  const currentLocation =
    latestTrackingMetadata &&
    typeof latestTrackingMetadata === "object" &&
    !Array.isArray(latestTrackingMetadata) &&
    "location" in latestTrackingMetadata &&
    typeof latestTrackingMetadata.location === "string"
      ? latestTrackingMetadata.location
      : null;

  return {
    customerEmail: shipment.customer?.email ?? null,
    customerName: shipment.customer?.name ?? null,
    currentLocation,
    destinationCity: shipment.destinationAddress.city,
    estimatedDeliveryDate: formatDate(shipment.deliveryWindowEnd),
    originCity: shipment.originAddress.city,
    shipmentNumber: shipment.shipmentNumber,
    shipmentStatus: formatShipmentStatus(shipment.status),
    trackingNumber: shipment.shipmentNumber,
  };
}

export async function getEmailBranding(): Promise<EmailBranding> {
  const profile = await getCompanyProfile();

  return {
    companyName: profile.legalName || "Apex Global Logistics",
    supportEmail: profile.email || env.SUPPORT_EMAIL,
    supportPhone: profile.phone || env.SUPPORT_PHONE,
    website: profile.website || env.NEXT_PUBLIC_APP_URL,
  };
}

export function buildEmailVariables(
  context: EmailVariableContext,
  branding: EmailBranding,
): EmailVariableMap {
  const recipientName =
    context.variables?.recipientName ??
    context.recipientName ??
    context.variables?.customerName ??
    context.recipientEmail ??
    "Customer";

  return {
    amountDue: context.variables?.amountDue ?? "",
    companyName: context.variables?.companyName ?? branding.companyName,
    currentLocation:
      context.shipment?.currentLocation ??
      context.variables?.currentLocation ??
      context.shipment?.destinationCity ??
      context.shipment?.originCity ??
      "",
    deliveryAddress: context.variables?.deliveryAddress ?? "",
    customerName:
      context.variables?.customerName ??
      context.recipientName ??
      context.recipientEmail ??
      "Customer",
    documentDate: context.variables?.documentDate ?? formatDocumentDate(),
    estimatedDeliveryDate:
      context.shipment?.estimatedDeliveryDate ?? context.variables?.estimatedDeliveryDate ?? "",
    invoiceNumber: context.variables?.invoiceNumber ?? "",
    paymentInstructions:
      context.variables?.paymentInstructions ?? "Use the approved Apex invoice or payment portal.",
    petName: context.variables?.petName ?? "",
    recipientName,
    refundTerms:
      context.variables?.refundTerms ?? "Terms are shown on the approved billing record.",
    // A linked shipment is the source of truth for operational fields. This keeps a
    // previously selected status in the composer from replacing the current status at send time.
    shipmentStatus: context.shipment?.shipmentStatus ?? context.variables?.shipmentStatus ?? "",
    supportEmail: context.variables?.supportEmail ?? branding.supportEmail,
    supportPhone: context.variables?.supportPhone ?? branding.supportPhone,
    trackingNumber:
      context.shipment?.trackingNumber ??
      context.shipment?.shipmentNumber ??
      context.variables?.trackingNumber ??
      "",
    website: context.variables?.website ?? branding.website,
  };
}
