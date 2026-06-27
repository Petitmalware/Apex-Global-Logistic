import "server-only";

import { env } from "@/config/env.server";
import { emailVariableKeys } from "@/features/emails/constants";
import { prisma } from "@/lib/db";

export type EmailVariableMap = Partial<Record<(typeof emailVariableKeys)[number], string>>;

export type ShipmentEmailContext = {
  destinationCity?: string | null;
  estimatedDeliveryDate?: string | null;
  originCity?: string | null;
  shipmentNumber?: string | null;
  shipmentStatus?: string | null;
  trackingNumber?: string | null;
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
    },
    where: {
      id: shipmentId,
    },
  });

  if (!shipment || shipment.deletedAt) {
    return null;
  }

  return {
    customerEmail: shipment.customer?.email ?? null,
    customerName: shipment.customer?.name ?? null,
    destinationCity: shipment.destinationAddress.city,
    estimatedDeliveryDate: formatDate(shipment.deliveryWindowEnd),
    originCity: shipment.originAddress.city,
    shipmentNumber: shipment.shipmentNumber,
    shipmentStatus: shipment.status.replaceAll("_", " "),
    trackingNumber: shipment.shipmentNumber,
  };
}

export function buildEmailVariables(context: EmailVariableContext): EmailVariableMap {
  return {
    amountDue: context.variables?.amountDue ?? "",
    companyName: "Apex Global Logistics",
    currentLocation:
      context.variables?.currentLocation ??
      context.shipment?.destinationCity ??
      context.shipment?.originCity ??
      "",
    customerName:
      context.variables?.customerName ??
      context.recipientName ??
      context.recipientEmail ??
      "Customer",
    estimatedDeliveryDate:
      context.variables?.estimatedDeliveryDate ?? context.shipment?.estimatedDeliveryDate ?? "",
    invoiceNumber: context.variables?.invoiceNumber ?? "",
    petName: context.variables?.petName ?? "",
    shipmentStatus: context.variables?.shipmentStatus ?? context.shipment?.shipmentStatus ?? "",
    supportEmail: env.SUPPORT_EMAIL,
    supportPhone: env.SUPPORT_PHONE,
    trackingNumber:
      context.variables?.trackingNumber ??
      context.shipment?.trackingNumber ??
      context.shipment?.shipmentNumber ??
      "",
  };
}
