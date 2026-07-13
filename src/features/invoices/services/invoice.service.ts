import "server-only";

import {
  ActivityAction,
  AddressType,
  EmailTemplateCategory,
  InvoiceStatus,
  UserStatus,
  type Prisma,
} from "@prisma/client";
import { randomUUID } from "node:crypto";

import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import type { IssueInvoiceInput } from "@/features/invoices/schemas/invoice.schemas";
import { createUserNotification } from "@/features/notifications/services/notification.service";
import { queueBrandedEmail } from "@/features/emails/services/email.service";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { AuthError } from "@/lib/auth/errors";
import { prisma } from "@/lib/db";

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
    const subtotal = Math.round(line.quantity * line.unitPrice * 100) / 100;
    const tax = Math.round(subtotal * (line.taxRate / 100) * 100) / 100;

    return {
      ...line,
      sortOrder: index + 1,
      subtotal,
      tax,
      total: subtotal + tax,
    };
  });
  const subtotal = Math.round(lines.reduce((sum, line) => sum + line.subtotal, 0) * 100) / 100;
  const taxTotal = Math.round(lines.reduce((sum, line) => sum + line.tax, 0) * 100) / 100;
  const total = Math.round((subtotal + taxTotal) * 100) / 100;

  return {
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

function hasBillingAddress(input: IssueInvoiceInput["billingAddress"]) {
  return Boolean(input.line1 && input.city && input.countryCode);
}

function buildBillingAddressCreateInput({
  input,
  organizationId,
}: {
  input: IssueInvoiceInput;
  organizationId: string;
}) {
  if (!hasBillingAddress(input.billingAddress)) {
    return null;
  }

  return {
    city: input.billingAddress.city!,
    countryCode: input.billingAddress.countryCode!,
    line1: input.billingAddress.line1!,
    line2: input.billingAddress.line2,
    name: input.billingAddress.name ?? input.manualBillingContact.name ?? "Billing recipient",
    organizationId,
    postalCode: input.billingAddress.postalCode,
    state: input.billingAddress.state,
    type: AddressType.BILLING,
  };
}

async function getInvoiceShipment({
  customerId,
  organizationId,
  shipmentId,
}: {
  customerId?: string | null;
  organizationId: string;
  shipmentId?: string;
}) {
  if (!shipmentId) {
    return null;
  }

  const shipment = await prisma.shipment.findFirst({
    select: {
      customerId: true,
      id: true,
      organizationId: true,
      shipmentNumber: true,
    },
    where: {
      deletedAt: null,
      id: shipmentId,
      organizationId,
    },
  });

  if (!shipment) {
    throw new AuthError("Selected shipment was not found.", 404, "SHIPMENT_NOT_FOUND");
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
        ? `<p>Hello {{customerName}},</p><p>Invoice {{invoiceNumber}} for {{amountDue}} is ready for review.</p><p><a href="/invoices/${invoiceId}">View invoice</a></p>`
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

  const organizationId = await ensureInvoiceOrganization(user);
  const customer = await getInvoiceCustomer(input.customerId);
  const manualBillingContact = getManualBillingContact(input);
  const customerEmail = manualBillingContact?.email ?? customer?.email;
  const customerName = manualBillingContact?.name ?? customer?.name;
  const customerPhone = manualBillingContact?.phone ?? null;

  if (!customerEmail || !customerName) {
    throw new AuthError("Enter a bill-to name and email before issuing this invoice.", 400);
  }

  const shipment = await getInvoiceShipment({
    customerId: customer?.id,
    organizationId,
    shipmentId: input.shipmentId,
  });
  const invoiceNumber = await generateInvoiceNumber(organizationId);
  const totals = calculateInvoiceTotals(input);
  const dueDate = input.dueDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const billingAddressData = buildBillingAddressCreateInput({ input, organizationId });

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
        customerId: customer?.id,
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
            source: customer ? "registered_customer" : "manual_customer",
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
          customerId: customer?.id ?? null,
          manualBillingContact,
          invoiceNumber,
          shipmentId: shipment?.id ?? null,
          total: totals.total,
        },
        organizationId,
      },
    });

    return createdInvoice;
  });

  await notifyInvoiceIssued({
    customerEmail,
    customerId: customer?.id,
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
