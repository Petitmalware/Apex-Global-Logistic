export const emailCategoryValues = [
  "ADMIN",
  "AUTH",
  "BILLING",
  "FREIGHT",
  "INVOICE",
  "MANUAL",
  "PACKAGE",
  "PAYMENT",
  "PET",
  "SHIPMENT",
  "SYSTEM",
] as const;

export const emailLogStatusValues = ["DRAFT", "QUEUED", "SENT", "FAILED"] as const;

export const emailProviderValues = ["BREVO", "CONSOLE", "RESEND", "SMTP"] as const;

export const emailVariableKeys = [
  "customerName",
  "trackingNumber",
  "shipmentStatus",
  "currentLocation",
  "estimatedDeliveryDate",
  "petName",
  "companyName",
  "supportEmail",
  "supportPhone",
  "invoiceNumber",
  "amountDue",
] as const;

export const emailCategoryLabels = {
  ADMIN: "Admin",
  AUTH: "Authentication",
  BILLING: "Billing",
  FREIGHT: "Freight",
  INVOICE: "Invoice",
  MANUAL: "Manual",
  PACKAGE: "Package",
  PAYMENT: "Payment",
  PET: "Pet Transport",
  SHIPMENT: "Shipment",
  SYSTEM: "System",
} satisfies Record<(typeof emailCategoryValues)[number], string>;

export type EmailCategoryValue = (typeof emailCategoryValues)[number];

export const emailLogStatusLabels = {
  DRAFT: "Draft",
  FAILED: "Failed",
  QUEUED: "Queued",
  SENT: "Sent",
} satisfies Record<(typeof emailLogStatusValues)[number], string>;
