"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";

import { issueInvoiceSchema } from "@/features/invoices/schemas/invoice.schemas";
import { issueInvoice } from "@/features/invoices/services/invoice.service";
import type { InvoiceActionState } from "@/features/invoices/types/invoice.types";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { AuthError } from "@/lib/auth/errors";
import { requireRole } from "@/lib/auth/session";
import { getDatabaseUnavailableMessage, isDatabaseUnavailableError } from "@/lib/db-errors";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function hasLineData(formData: FormData, index: number) {
  return ["description", "quantity", "unitPrice"].some((key) =>
    getString(formData, `lineItems.${index}.${key}`).trim(),
  );
}

function parseInvoiceFormData(formData: FormData) {
  const lineItems = [0, 1, 2, 3, 4, 5]
    .filter((index) => index === 0 || hasLineData(formData, index))
    .map((index) => ({
      description: getString(formData, `lineItems.${index}.description`),
      lineType: getString(formData, `lineItems.${index}.lineType`) || "SERVICE",
      quantity: getString(formData, `lineItems.${index}.quantity`) || "1",
      taxRate: getString(formData, `lineItems.${index}.taxRate`) || "0",
      unitPrice: getString(formData, `lineItems.${index}.unitPrice`) || "0",
    }));

  return issueInvoiceSchema.safeParse({
    billingAddress: {
      city: getString(formData, "billingAddress.city"),
      countryCode: getString(formData, "billingAddress.countryCode"),
      line1: getString(formData, "billingAddress.line1"),
      line2: getString(formData, "billingAddress.line2"),
      name: getString(formData, "billingAddress.name"),
      postalCode: getString(formData, "billingAddress.postalCode"),
      state: getString(formData, "billingAddress.state"),
    },
    currency: getString(formData, "currency") || "USD",
    customerId: getString(formData, "customerId"),
    dueDate: getString(formData, "dueDate"),
    lineItems,
    manualBillingContact: {
      email: getString(formData, "manualBillingContact.email"),
      name: getString(formData, "manualBillingContact.name"),
      phone: getString(formData, "manualBillingContact.phone"),
    },
    notes: getString(formData, "notes"),
    shipmentId: getString(formData, "shipmentId"),
  });
}

function errorState(error: unknown): InvoiceActionState {
  if (error instanceof AuthError) {
    return {
      message: error.message,
      status: "error",
    };
  }

  if (isDatabaseUnavailableError(error)) {
    return {
      message: getDatabaseUnavailableMessage(),
      status: "error",
    };
  }

  return {
    message: "Invoice could not be issued. Please review the details and try again.",
    status: "error",
  };
}

export async function issueInvoiceAction(
  _previousState: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  const user = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);
  const parsed = parseInvoiceFormData(formData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please fix the highlighted invoice details.",
      status: "error",
    };
  }

  let invoiceId = "";

  try {
    const invoice = await issueInvoice(parsed.data, user);
    invoiceId = invoice.id;
  } catch (error) {
    return errorState(error);
  }

  revalidatePath("/admin/invoices");
  revalidatePath("/shipments");
  redirect(`/invoices/${invoiceId}` as Route);
}
