import "server-only";

import {
  ActivityAction,
  AddressType,
  EmailTemplateCategory,
  InvoiceLineType,
  InvoiceStatus,
  UserStatus,
  type Prisma,
} from "@prisma/client";
import { randomUUID } from "node:crypto";

import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import { env } from "@/config/env.server";
import type { IssueInvoiceInput } from "@/features/invoices/schemas/invoice.schemas";
import { createUserNotification } from "@/features/notifications/services/notification.service";
import { queueBrandedEmail } from "@/features/emails/services/email.service";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { AuthError } from "@/lib/auth/errors";
import { prisma } from "@/lib/db";

const REMOTE_DATABASE_TRANSACTION_OPTIONS = {
  maxWait: 20_000,
  timeout: 60_000,
};

function canManageInvoices(user: AuthSessionUser) {
  return user.roles.includes(AUTH_ROLES.ADMIN) || user.roles.includes(AUTH_ROLES.SUPER_ADMIN);
}

async function ensureInvoiceOrganization(user: AuthSessionUser) {
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

function calculateInvoiceTotals(input: IssueInvoiceInput) {
  const lines = input.lineItems.map((line, index) => {
    const amount = Math.round(line.quantity * line.unitPrice * 100) / 100;
    const isDiscount = line.lineType === InvoiceLineType.DISCOUNT;
    const subtotal = isDiscount ? -amount : amount;
    const tax = isDiscount ? 0 : Math.round(amount * (line.taxRate / 100) * 100) / 100;

    return {
      ...line,
      sortOrder: index + 1,
      subtotal,
      tax,
      total: subtotal + tax,
    };
  });
  const subtotal =
    Math.round(
      lines.reduce((sum, line) => (line.subtotal > 0 ? sum + line.subtotal : sum), 0) * 100,
    ) / 100;
  const discountTotal =
    Math.round(
      lines.reduce((sum, line) => (line.subtotal < 0 ? sum + Math.abs(line.subtotal) : sum), 0) *
        100,
    ) / 100;
  const taxTotal = Math.round(lines.reduce((sum, line) => sum + line.tax, 0) * 100) / 100;
  const total = Math.round((subtotal - discountTotal + taxTotal) * 100) / 100;

  return {
    discountTotal,
    lines,
    subtotal,
    taxTotal,
    total,
  };
}

async function getInvoiceCustomer(customerId: string | undefined) {
  if (!customerId) {
    return null;
  }

  const customer = await prisma.user.findFirst({
    select: {
      email: true,
      id: true,
      name: true,
      organizationId: true,
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
    throw new AuthError("Select a registered customer account before issuing an invoice.", 404);
  }

  return customer;
}

function getManualBillingContact(input: IssueInvoiceInput) {
  const name = input.manualBillingContact.name?.trim();
  const email = input.manualBillingContact.email?.trim().toLowerCase();
  const phone = input.manualBillingContact.phone?.trim();

  if (!name && !email && !phone) {
    return null;
  }

  return {
    email: email || null,
    name: name || null,
    phone: phone || null,
  };
}

type InvoiceShipment = Awaited<ReturnType<typeof getInvoiceShipment>>;

function getManualRecipientFromMetadata(metadata: Prisma.JsonValue | null) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const value = "manualRecipient" in metadata ? metadata.manualRecipient : null;

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return {
    email: "email" in value && typeof value.email === "string" ? value.email : null,
    name: "name" in value && typeof value.name === "string" ? value.name : null,
    phone: "phone" in value && typeof value.phone === "string" ? value.phone : null,
  };
}

function buildBillingAddressCreateInput({
  input,
  organizationId,
  shipment,
}: {
  input: IssueInvoiceInput;
  organizationId: string;
  shipment: InvoiceShipment;
}) {
  const fallback = shipment?.destinationAddress;
  const city = input.billingAddress.city ?? fallback?.city;
  const countryCode = input.billingAddress.countryCode ?? fallback?.countryCode;
  const line1 = input.billingAddress.line1 ?? fallback?.line1;

  if (!line1 || !city || !countryCode) {
    return null;
  }

  return {
    city,
    countryCode,
    line1,
    line2: input.billingAddress.line2 ?? fallback?.line2,
    name:
      input.billingAddress.name ??
      input.manualBillingContact.name ??
      fallback?.name ??
      "Billing recipient",
    organizationId,
    postalCode: input.billingAddress.postalCode ?? fallback?.postalCode,
    state: input.billingAddress.state ?? fallback?.state,
    type: AddressType.BILLING,
  };
}

async function getInvoiceShipment({
  customerId,
  shipmentId,
  user,
}: {
  customerId?: string | null;
  shipmentId?: string;
  user: AuthSessionUser;
}) {
  if (!shipmentId) {
    return null;
  }

  const shipment = await prisma.shipment.findFirst({
    select: {
      customer: {
        select: {
          email: true,
          id: true,
          name: true,
          phone: true,
        },
      },
      customerId: true,
      destinationAddress: {
        select: {
          city: true,
          countryCode: true,
          line1: true,
          line2: true,
          name: true,
          postalCode: true,
          state: true,
        },
      },
      id: true,
      metadata: true,
      organizationId: true,
      shipmentNumber: true,
    },
    where: {
      deletedAt: null,
      id: shipmentId,
    },
  });

  if (!shipment) {
    throw new AuthError("Selected shipment was not found.", 404, "SHIPMENT_NOT_FOUND");
  }

  if (
    !user.roles.includes(AUTH_ROLES.SUPER_ADMIN) &&
    shipment.organizationId !== user.organizationId
  ) {
    throw new AuthError("Selected shipment is outside your organization.", 403, "FORBIDDEN");
  }

  if (customerId && shipment.customerId && shipment.customerId !== customerId) {
    throw new AuthError("Selected shipment does not belong to this customer.", 400);
  }

  return shipment;
}

async function notifyInvoiceIssued({
  customerEmail,
  customerId,
  customerName,
  invoiceId,
  invoiceNumber,
  organizationId,
  shipmentId,
  total,
}: {
  customerEmail: string;
  customerId?: string | null;
  customerName: string;
  invoiceId: string;
  invoiceNumber: string;
  organizationId: string;
  shipmentId?: string | null;
  total: string;
}) {
  try {
    if (customerId) {
      await createUserNotification({
        actionUrl: `/invoices/${invoiceId}`,
        body: `Invoice ${invoiceNumber} is ready for review.`,
        channels: ["inApp"],
        invoiceId,
        organizationId,
        shipmentId: shipmentId ?? undefined,
        title: `Invoice ${invoiceNumber} issued`,
        topic: "billing",
        userId: customerId,
      });
    }

    await queueBrandedEmail({
      bodyHtml: customerId
        ? `<p>Hello {{customerName}},</p><p>Invoice {{invoiceNumber}} for {{amountDue}} is ready for review.</p><p><a href="${env.NEXT_PUBLIC_APP_URL}/invoices/${invoiceId}">View invoice</a></p>`
        : `<p>Hello {{customerName}},</p><p>Invoice {{invoiceNumber}} for {{amountDue}} has been issued by Apex Global Logistics.</p><p>The official invoice document can be sent by the Apex operations team without requiring a customer portal account.</p>`,
      category: EmailTemplateCategory.INVOICE,
      organizationId,
      recipientEmail: customerEmail,
      recipientName: customerName,
      relatedUserId: customerId ?? undefined,
      shipmentId: shipmentId ?? undefined,
      subject: `Invoice ${invoiceNumber} from Apex Global Logistics`,
      variables: {
        amountDue: total,
        customerName,
        invoiceNumber,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      const safeError = error instanceof Error ? { message: error.message, name: error.name } : {};

      console.warn("Invoice notification could not be queued", safeError);
    }
  }
}

export async function issueInvoice(input: IssueInvoiceInput, user: AuthSessionUser) {
  if (!canManageInvoices(user)) {
    throw new AuthError("You do not have permission to issue invoices.", 403, "FORBIDDEN");
  }

  const customer = await getInvoiceCustomer(input.customerId);
  const shipment = await getInvoiceShipment({
    customerId: customer?.id,
    shipmentId: input.shipmentId,
    user,
  });
  const organizationId = shipment?.organizationId ?? (await ensureInvoiceOrganization(user));
  const manualBillingContact = getManualBillingContact(input);
  const shipmentManualRecipient = getManualRecipientFromMetadata(shipment?.metadata ?? null);
  const shipmentCustomer = shipment?.customer;
  const customerEmail =
    manualBillingContact?.email ??
    customer?.email ??
    shipmentCustomer?.email ??
    shipmentManualRecipient?.email;
  const customerName =
    manualBillingContact?.name ??
    customer?.name ??
    shipmentCustomer?.name ??
    shipmentManualRecipient?.name ??
    shipment?.destinationAddress.name;
  const customerPhone =
    manualBillingContact?.phone ??
    shipmentCustomer?.phone ??
    shipmentManualRecipient?.phone ??
    null;

  if (!customerEmail || !customerName) {
    throw new AuthError("Enter a bill-to name and email before issuing this invoice.", 400);
  }

  const invoiceNumber = await generateInvoiceNumber(organizationId);
  const totals = calculateInvoiceTotals(input);

  if (totals.total <= 0) {
    throw new AuthError("Invoice total must be greater than zero after discounts.", 400);
  }
  const dueDate = input.dueDate ?? null;
  const billingAddressData = buildBillingAddressCreateInput({
    input,
    organizationId,
    shipment,
  });

  const invoice = await prisma.$transaction(async (transaction) => {
    const billingAddress = billingAddressData
      ? await transaction.address.create({
          data: billingAddressData,
          select: {
            id: true,
          },
        })
      : null;

    const createdInvoice = await transaction.invoice.create({
      data: {
        billingAddressId: billingAddress?.id,
        currency: input.currency,
        customerId: customer?.id ?? shipmentCustomer?.id,
        discountTotal: totals.discountTotal,
        dueDate,
        invoiceNumber,
        issuedAt: new Date(),
        lineItems: {
          create: totals.lines.map((line) => ({
            description: line.description,
            lineType: line.lineType,
            quantity: line.quantity,
            sortOrder: line.sortOrder,
            taxRate: line.taxRate / 100,
            total: line.total,
            unitPrice: line.unitPrice,
          })),
        },
        metadata: {
          billTo: {
            email: customerEmail,
            name: customerName,
            phone: customerPhone,
            source:
              customer || shipmentCustomer
                ? "registered_customer"
                : shipment
                  ? "shipment_recipient"
                  : "manual_customer",
          },
          issuedBy: user.id,
          source: "admin_invoice_studio",
        } satisfies Prisma.InputJsonObject,
        notes: input.notes,
        organizationId,
        shipmentId: shipment?.id,
        status: InvoiceStatus.ISSUED,
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
      },
      select: {
        id: true,
      },
    });

    await transaction.activityLog.create({
      data: {
        action: ActivityAction.CREATE,
        actorId: user.id,
        entityId: createdInvoice.id,
        entityType: "invoice",
        metadata: {
          customerId: customer?.id ?? shipmentCustomer?.id ?? null,
          manualBillingContact,
          invoiceNumber,
          shipmentId: shipment?.id ?? null,
          total: totals.total,
        },
        organizationId,
      },
    });

    return createdInvoice;
  }, REMOTE_DATABASE_TRANSACTION_OPTIONS);

  await notifyInvoiceIssued({
    customerEmail,
    customerId: customer?.id ?? shipmentCustomer?.id,
    customerName,
    invoiceId: invoice.id,
    invoiceNumber,
    organizationId,
    shipmentId: shipment?.id,
    total: new Intl.NumberFormat("en", {
      currency: input.currency,
      style: "currency",
    }).format(totals.total),
  });

  return invoice;
}
