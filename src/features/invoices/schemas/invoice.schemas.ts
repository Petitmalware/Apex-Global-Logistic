import { InvoiceLineType } from "@prisma/client";
import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const optionalString = (max = 255) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

const requiredString = (label: string, max = 255) =>
  z.string().trim().min(1, `${label} is required.`).max(max);

const optionalUuid = z.preprocess(
  emptyToUndefined,
  z.string().uuid("Select a valid record.").optional(),
);

const optionalEmail = z.preprocess(
  emptyToUndefined,
  z.string().trim().email("Enter a valid email address.").max(255).optional(),
);

const optionalCountryCode = z
  .preprocess(
    emptyToUndefined,
    z.string().trim().length(2, "Use a 2-letter country code.").optional(),
  )
  .transform((value) => value?.toUpperCase());

const money = z.coerce.number().nonnegative("Amount cannot be negative.");

export const invoiceLineInputSchema = z.object({
  description: requiredString("Description", 500),
  lineType: z.nativeEnum(InvoiceLineType).default(InvoiceLineType.SERVICE),
  quantity: z.coerce.number().positive("Quantity must be greater than 0."),
  taxRate: z.coerce.number().min(0, "Tax rate cannot be negative.").max(100).default(0),
  unitPrice: money,
});

const manualBillingContactSchema = z
  .object({
    email: optionalEmail,
    name: optionalString(160),
    phone: optionalString(80),
  })
  .default({});

const billingAddressSchema = z
  .object({
    city: optionalString(120),
    countryCode: optionalCountryCode,
    line1: optionalString(255),
    line2: optionalString(255),
    name: optionalString(120),
    postalCode: optionalString(32),
    state: optionalString(120),
  })
  .default({});

function hasAddressData(value: z.infer<typeof billingAddressSchema>) {
  return Boolean(
    value.name ||
    value.line1 ||
    value.line2 ||
    value.city ||
    value.state ||
    value.postalCode ||
    value.countryCode,
  );
}

export const issueInvoiceSchema = z
  .object({
    billingAddress: billingAddressSchema,
    currency: z.string().trim().length(3, "Use a 3-letter currency code.").toUpperCase(),
    customerId: optionalUuid,
    dueDate: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
    lineItems: z.array(invoiceLineInputSchema).min(1, "Add at least one invoice line."),
    manualBillingContact: manualBillingContactSchema,
    notes: optionalString(1000),
    shipmentId: optionalUuid,
  })
  .superRefine((value, context) => {
    const isManualCustomer = !value.customerId;
    const addressWasEntered = hasAddressData(value.billingAddress);

    if (isManualCustomer && !value.manualBillingContact.name) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter the bill-to customer name.",
        path: ["manualBillingContact", "name"],
      });
    }

    if (isManualCustomer && !value.manualBillingContact.email) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter the bill-to customer email.",
        path: ["manualBillingContact", "email"],
      });
    }

    if ((isManualCustomer || addressWasEntered) && !value.billingAddress.line1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter the bill-to street address.",
        path: ["billingAddress", "line1"],
      });
    }

    if ((isManualCustomer || addressWasEntered) && !value.billingAddress.city) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter the bill-to city.",
        path: ["billingAddress", "city"],
      });
    }

    if ((isManualCustomer || addressWasEntered) && !value.billingAddress.countryCode) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter the bill-to country code.",
        path: ["billingAddress", "countryCode"],
      });
    }
  });

export type IssueInvoiceInput = z.infer<typeof issueInvoiceSchema>;
