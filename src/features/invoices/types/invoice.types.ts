import type { InvoiceStatus, ShipmentStatus } from "@prisma/client";

export type InvoiceActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  status: "error" | "idle" | "success";
};

export const initialInvoiceActionState: InvoiceActionState = {
  status: "idle",
};

export type ShipmentInvoiceOption = {
  customerId: string | null;
  customerLabel: string;
  id: string;
  label: string;
};

export type InvoiceListItem = {
  createdAt: string;
  currency: string;
  customerEmail: string | null;
  customerName: string | null;
  customerPhone: string | null;
  dueDate: string | null;
  id: string;
  invoiceNumber: string;
  shipmentNumber: string | null;
  status: InvoiceStatus;
  total: string;
};

export type InvoiceDetail = InvoiceListItem & {
  amountPaid: string;
  billingAddress: {
    city: string;
    countryCode: string;
    line1: string;
    line2: string | null;
    name: string | null;
    postalCode: string | null;
    state: string | null;
  } | null;
  discountTotal: string;
  issuedAt: string | null;
  lineItems: Array<{
    description: string;
    id: string;
    lineType: string;
    quantity: string;
    sortOrder: number;
    taxRate: string;
    total: string;
    unitPrice: string;
  }>;
  notes: string | null;
  paidAt: string | null;
  shipment: {
    destinationCity: string | null;
    currentLocation: string | null;
    id: string;
    lastTrackingUpdate: string | null;
    mode: string;
    originCity: string | null;
    serviceLevel: string | null;
    shipmentNumber: string;
    status: ShipmentStatus;
    updatedAt: string;
  } | null;
  subtotal: string;
  taxTotal: string;
};
