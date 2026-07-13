import "server-only";

import type { Prisma } from "@prisma/client";

import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import type {
  InvoiceDetail,
  InvoiceListItem,
  ShipmentInvoiceOption,
} from "@/features/invoices/types/invoice.types";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { PERMISSIONS, hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

function formatDate(value: Date | null) {
  return value ? value.toISOString() : null;
}

function decimalToString(value: Prisma.Decimal) {
  return value.toString();
}

function canManageInvoices(user: AuthSessionUser) {
  return (
    user.roles.includes(AUTH_ROLES.SUPER_ADMIN) || hasPermission(user, PERMISSIONS.INVOICES_MANAGE)
  );
}

function logInvoiceQueryFallback(error: unknown, scope: string) {
  if (process.env.APP_ENV === "development") {
    console.warn(`Unable to load ${scope}`, {
      message: error instanceof Error ? error.message : "Unknown invoice query error",
      name: error instanceof Error ? error.name : typeof error,
    });
  }
}

function getInvoiceBillTo(metadata: Prisma.JsonValue | null) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const value = "billTo" in metadata ? metadata.billTo : null;

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const email = "email" in value && typeof value.email === "string" ? value.email : null;
  const name = "name" in value && typeof value.name === "string" ? value.name : null;
  const phone = "phone" in value && typeof value.phone === "string" ? value.phone : null;

  return email || name || phone ? { email, name, phone } : null;
}

function getManualShipmentRecipient(metadata: Prisma.JsonValue | null) {
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

function invoiceWhereForUser(user: AuthSessionUser): Prisma.InvoiceWhereInput {
  if (user.roles.includes(AUTH_ROLES.SUPER_ADMIN)) {
    return {
      deletedAt: null,
    };
  }

  if (canManageInvoices(user) && user.organizationId) {
    return {
      deletedAt: null,
      organizationId: user.organizationId,
    };
  }

  return {
    customerId: user.id,
    deletedAt: null,
  };
}

function mapInvoiceListItem(invoice: {
  createdAt: Date;
  currency: string;
  customer: {
    email: string;
    name: string;
    phone: string | null;
  } | null;
  dueDate: Date | null;
  id: string;
  invoiceNumber: string;
  metadata: Prisma.JsonValue | null;
  shipment: {
    shipmentNumber: string;
  } | null;
  status: InvoiceListItem["status"];
  total: Prisma.Decimal;
}): InvoiceListItem {
  const billTo = getInvoiceBillTo(invoice.metadata);

  return {
    createdAt: invoice.createdAt.toISOString(),
    currency: invoice.currency,
    customerEmail: billTo?.email ?? invoice.customer?.email ?? null,
    customerName: billTo?.name ?? invoice.customer?.name ?? null,
    customerPhone: billTo?.phone ?? invoice.customer?.phone ?? null,
    dueDate: formatDate(invoice.dueDate),
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    shipmentNumber: invoice.shipment?.shipmentNumber ?? null,
    status: invoice.status,
    total: decimalToString(invoice.total),
  };
}

export async function getInvoicesForUser(user: AuthSessionUser): Promise<InvoiceListItem[]> {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        customer: {
          select: {
            email: true,
            name: true,
            phone: true,
          },
        },
        shipment: {
          select: {
            shipmentNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
      where: invoiceWhereForUser(user),
    });

    return invoices.map(mapInvoiceListItem);
  } catch (error) {
    logInvoiceQueryFallback(error, "invoices");

    return [];
  }
}

export async function getInvoiceForUser(
  invoiceId: string,
  user: AuthSessionUser,
): Promise<InvoiceDetail | null> {
  try {
    const invoice = await prisma.invoice.findFirst({
      include: {
        billingAddress: true,
        customer: {
          select: {
            email: true,
            name: true,
            phone: true,
          },
        },
        lineItems: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        shipment: {
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
          },
        },
      },
      where: {
        ...invoiceWhereForUser(user),
        id: invoiceId,
      },
    });

    if (!invoice) {
      return null;
    }

    return {
      ...mapInvoiceListItem(invoice),
      amountPaid: decimalToString(invoice.amountPaid),
      billingAddress: invoice.billingAddress
        ? {
            city: invoice.billingAddress.city,
            countryCode: invoice.billingAddress.countryCode,
            line1: invoice.billingAddress.line1,
            line2: invoice.billingAddress.line2,
            name: invoice.billingAddress.name,
            postalCode: invoice.billingAddress.postalCode,
            state: invoice.billingAddress.state,
          }
        : null,
      discountTotal: decimalToString(invoice.discountTotal),
      issuedAt: formatDate(invoice.issuedAt),
      lineItems: invoice.lineItems.map((lineItem) => ({
        description: lineItem.description,
        id: lineItem.id,
        lineType: lineItem.lineType,
        quantity: lineItem.quantity.toString(),
        sortOrder: lineItem.sortOrder,
        taxRate: lineItem.taxRate.toString(),
        total: lineItem.total.toString(),
        unitPrice: lineItem.unitPrice.toString(),
      })),
      notes: invoice.notes,
      paidAt: formatDate(invoice.paidAt),
      shipment: invoice.shipment
        ? {
            destinationCity: invoice.shipment.destinationAddress.city,
            id: invoice.shipment.id,
            mode: invoice.shipment.mode,
            originCity: invoice.shipment.originAddress.city,
            serviceLevel: invoice.shipment.serviceLevel,
            shipmentNumber: invoice.shipment.shipmentNumber,
          }
        : null,
      subtotal: decimalToString(invoice.subtotal),
      taxTotal: decimalToString(invoice.taxTotal),
    };
  } catch (error) {
    logInvoiceQueryFallback(error, "invoice details");

    return null;
  }
}

export async function getShipmentInvoiceOptionsForAdmin(
  user: AuthSessionUser,
): Promise<ShipmentInvoiceOption[]> {
  if (!canManageInvoices(user)) {
    return [];
  }

  try {
    const shipments = await prisma.shipment.findMany({
      select: {
        customer: {
          select: {
            email: true,
            id: true,
            name: true,
          },
        },
        destinationAddress: {
          select: {
            city: true,
          },
        },
        id: true,
        metadata: true,
        originAddress: {
          select: {
            city: true,
          },
        },
        shipmentNumber: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
      where: {
        deletedAt: null,
        organizationId: user.roles.includes(AUTH_ROLES.SUPER_ADMIN)
          ? undefined
          : (user.organizationId ?? undefined),
      },
    });

    return shipments.map((shipment) => {
      const manualRecipient = getManualShipmentRecipient(shipment.metadata);

      return {
        customerId: shipment.customer?.id ?? null,
        customerLabel: shipment.customer
          ? `${shipment.customer.name} <${shipment.customer.email}>`
          : `${manualRecipient?.name ?? "Manual recipient"}${
              manualRecipient?.email ? ` <${manualRecipient.email}>` : ""
            }`,
        id: shipment.id,
        label: `${shipment.shipmentNumber} - ${shipment.originAddress.city} to ${shipment.destinationAddress.city}`,
      };
    });
  } catch (error) {
    logInvoiceQueryFallback(error, "shipment invoice options");

    return [];
  }
}
