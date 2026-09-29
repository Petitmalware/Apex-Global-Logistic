import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PrintButton } from "@/features/shipments/components/print-button";
import type { InvoiceDetail } from "@/features/invoices/types/invoice.types";
import type { CompanyProfileInput } from "@/features/settings/schemas/company-profile.schema";
import { LiveDocumentRefresh } from "@/features/shipments/components/live-document-refresh";
import { formatShipmentStatus } from "@/features/shipments/status-labels";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatMoney(value: string | number, currency = "USD") {
  return new Intl.NumberFormat("en", {
    currency,
    style: "currency",
  }).format(Number(value));
}

function getCompanyAddressLines(profile: CompanyProfileInput) {
  return [
    profile.addressLine1,
    profile.addressLine2,
    [profile.city, profile.state, profile.postalCode].filter(Boolean).join(", "),
    profile.country,
  ].filter((line): line is string => Boolean(line));
}

function CompanyBlock({ profile }: { profile: CompanyProfileInput }) {
  const addressLines = getCompanyAddressLines(profile);
  const contactLines = [profile.email, profile.phone, profile.website].filter(
    (line): line is string => Boolean(line),
  );

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="grid size-12 place-items-center rounded-md bg-slate-950 text-sm font-black text-white">
          AG
        </div>
        <div>
          <p className="text-xl font-black">Apex Global Logistics</p>
          <p className="text-sm text-slate-600">Parcel, pet, and freight transportation</p>
        </div>
      </div>
      {addressLines.length || contactLines.length ? (
        <div className="mt-4 text-sm leading-6 text-slate-600">
          {addressLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          {contactLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BillTo({ invoice }: { invoice: InvoiceDetail }) {
  const billToName = invoice.customerName ?? invoice.billingAddress?.name ?? "Customer";

  return (
    <div>
      <p className="text-xs font-bold tracking-[0.24em] text-slate-500 uppercase">Bill to</p>
      <div className="mt-3 text-sm leading-6">
        <p className="font-bold">{billToName}</p>
        {invoice.customerEmail ? <p>{invoice.customerEmail}</p> : null}
        {invoice.customerPhone ? <p>{invoice.customerPhone}</p> : null}
        {invoice.billingAddress ? (
          <>
            <p>{invoice.billingAddress.line1}</p>
            {invoice.billingAddress.line2 ? <p>{invoice.billingAddress.line2}</p> : null}
            <p>
              {invoice.billingAddress.city}
              {invoice.billingAddress.state ? `, ${invoice.billingAddress.state}` : ""}{" "}
              {invoice.billingAddress.postalCode ?? ""}
            </p>
            <p>{invoice.billingAddress.countryCode}</p>
          </>
        ) : null}
      </div>
    </div>
  );
}

function InvoiceMeta({ invoice }: { invoice: InvoiceDetail }) {
  return (
    <div className="grid gap-3 text-sm sm:grid-cols-2 print:gap-1.5 print:text-[10px]">
      {[
        { label: "Invoice number", value: invoice.invoiceNumber },
        { label: "Status", value: invoice.status.replaceAll("_", " ") },
        { label: "Issued", value: formatDate(invoice.issuedAt ?? invoice.createdAt) },
        invoice.dueDate ? { label: "Due", value: formatDate(invoice.dueDate) } : null,
      ]
        .filter((item): item is { label: string; value: string } => Boolean(item))
        .map((item) => (
          <div className="rounded-md border border-slate-300 p-3 print:p-2" key={item.label}>
            <p className="text-xs font-bold tracking-[0.18em] text-slate-500 uppercase print:text-[8px]">
              {item.label}
            </p>
            <p className="mt-2 font-bold">{item.value}</p>
          </div>
        ))}
    </div>
  );
}

export function InvoiceDocument({
  invoice,
  profile,
}: {
  invoice: InvoiceDetail;
  profile: CompanyProfileInput;
}) {
  const balanceDue = Number(invoice.total) - Number(invoice.amountPaid);
  const hasLineTax = invoice.lineItems.some((lineItem) => Number(lineItem.taxRate) > 0);
  const shipmentDetails = invoice.shipment
    ? [
        { label: "Shipment", value: invoice.shipment.shipmentNumber },
        { label: "Shipment status", value: formatShipmentStatus(invoice.shipment.status) },
        invoice.shipment.currentLocation || invoice.shipment.lastTrackingUpdate
          ? {
              label: "Latest checkpoint",
              value: [
                invoice.shipment.currentLocation,
                invoice.shipment.lastTrackingUpdate
                  ? formatDate(invoice.shipment.lastTrackingUpdate)
                  : null,
              ]
                .filter(Boolean)
                .join(" - "),
            }
          : null,
        invoice.shipment.originCity && invoice.shipment.destinationCity
          ? {
              label: "Lane",
              value: `${invoice.shipment.originCity} to ${invoice.shipment.destinationCity}`,
            }
          : invoice.shipment.destinationCity
            ? { label: "Destination", value: invoice.shipment.destinationCity }
            : null,
        { label: "Mode", value: invoice.shipment.mode },
        invoice.shipment.serviceLevel
          ? { label: "Service", value: invoice.shipment.serviceLevel }
          : null,
      ].filter((item): item is { label: string; value: string } => Boolean(item?.value))
    : [];

  return (
    <main
      id="main-content"
      className="invoice-print-shell min-h-svh bg-slate-100 px-4 py-6 text-slate-950 print:bg-white print:p-0"
    >
      {invoice.shipment ? (
        <LiveDocumentRefresh
          initialUpdatedAt={invoice.shipment.updatedAt}
          shipmentId={invoice.shipment.id}
        />
      ) : null}
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 8mm;
            }

            .invoice-sheet {
              page-break-after: avoid;
              page-break-inside: avoid;
            }

            .invoice-compact-table th,
            .invoice-compact-table td {
              padding-bottom: 5px !important;
              padding-top: 5px !important;
            }
          }
        `}
      </style>
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Button asChild variant="outline">
            <Link href={"/admin/invoices" as Route}>
              <ArrowLeft aria-hidden="true" />
              Back to invoices
            </Link>
          </Button>
          <PrintButton label="Print invoice" />
        </div>

        <section className="invoice-sheet rounded-lg border border-slate-300 bg-white p-8 shadow-sm print:rounded-none print:border-0 print:p-0 print:text-[11px] print:shadow-none">
          <header className="grid gap-8 border-b border-slate-300 pb-8 md:grid-cols-[1fr_300px] print:grid-cols-[1fr_64mm] print:gap-4 print:pb-4">
            <CompanyBlock profile={profile} />
            <div className="md:text-right">
              <p className="text-xs font-bold tracking-[0.32em] text-slate-500 uppercase">
                Authorized transportation billing document
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-normal print:text-2xl">Invoice</h1>
              <p className="mt-3 font-mono text-sm text-slate-600">{invoice.invoiceNumber}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                Issued under Apex Global Logistics operating records.
              </p>
            </div>
          </header>

          <div className="grid gap-8 border-b border-slate-300 py-8 md:grid-cols-[1fr_1fr] print:gap-4 print:py-4">
            <BillTo invoice={invoice} />
            <InvoiceMeta invoice={invoice} />
          </div>

          {shipmentDetails.length ? (
            <div className="grid gap-4 border-b border-slate-300 py-8 sm:grid-cols-3 print:grid-cols-3 print:gap-2 print:py-4">
              {shipmentDetails.map((item) => (
                <div className="rounded-md border border-slate-300 p-4 print:p-2" key={item.label}>
                  <p className="text-xs font-bold tracking-[0.18em] text-slate-500 uppercase print:text-[8px]">
                    {item.label}
                  </p>
                  <p className="mt-2 font-bold">{item.value}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="py-8 print:py-4">
            <div className="overflow-hidden border border-slate-300">
              <table className="invoice-compact-table w-full border-collapse text-sm print:text-[10px]">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">Description</th>
                    <th className="px-4 py-3 text-left font-bold">Type</th>
                    <th className="px-4 py-3 text-right font-bold">Qty</th>
                    <th className="px-4 py-3 text-right font-bold">Unit</th>
                    {hasLineTax ? <th className="px-4 py-3 text-right font-bold">Tax</th> : null}
                    <th className="px-4 py-3 text-right font-bold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoice.lineItems.map((lineItem) => (
                    <tr key={lineItem.id}>
                      <td className="px-4 py-3">{lineItem.description}</td>
                      <td className="px-4 py-3">{lineItem.lineType.replaceAll("_", " ")}</td>
                      <td className="px-4 py-3 text-right">{lineItem.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        {formatMoney(lineItem.unitPrice, invoice.currency)}
                      </td>
                      {hasLineTax ? (
                        <td className="px-4 py-3 text-right">
                          {(Number(lineItem.taxRate) * 100).toFixed(2)}%
                        </td>
                      ) : null}
                      <td className="px-4 py-3 text-right font-bold">
                        {formatMoney(lineItem.total, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="ml-auto w-full max-w-sm space-y-3 border-t border-slate-300 p-4 text-sm print:max-w-[62mm] print:space-y-1.5 print:p-3 print:text-[10px]">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-600">Subtotal</span>
                  <span>{formatMoney(invoice.subtotal, invoice.currency)}</span>
                </div>
                {Number(invoice.taxTotal) > 0 ? (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-600">Tax</span>
                    <span>{formatMoney(invoice.taxTotal, invoice.currency)}</span>
                  </div>
                ) : null}
                {Number(invoice.discountTotal) > 0 ? (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-600">Discount</span>
                    <span>-{formatMoney(invoice.discountTotal, invoice.currency)}</span>
                  </div>
                ) : null}
                {Number(invoice.amountPaid) > 0 ? (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-600">Paid</span>
                    <span>{formatMoney(invoice.amountPaid, invoice.currency)}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-4 border-t border-slate-300 pt-3 text-lg font-black">
                  <span>Balance due</span>
                  <span>{formatMoney(balanceDue, invoice.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          <footer className="grid gap-6 border-t border-slate-300 pt-6 text-sm leading-6 text-slate-600 md:grid-cols-2 print:gap-4 print:pt-4 print:text-[10px] print:leading-4">
            <div>
              <p className="font-bold text-slate-950">Official billing statement</p>
              <p className="mt-2">
                This document is issued from Apex Global Logistics records as proof of billed
                transportation services for the shipment or account listed above.
              </p>
              <div className="mt-4 border-t border-slate-300 pt-3">
                <p className="text-xs font-bold tracking-[0.18em] text-slate-500 uppercase">
                  Authorized by
                </p>
                <p className="mt-2 font-semibold text-slate-950">Apex Global Logistics</p>
              </div>
            </div>
            <div>
              <p className="font-bold text-slate-950">Terms and conditions</p>
              <p className="mt-2">
                Charges are subject to route exceptions, customs holds, accessorial services, and
                approved handling requirements recorded by Apex operations.
              </p>
              {invoice.notes ? (
                <p className="mt-2 font-medium text-slate-950">{invoice.notes}</p>
              ) : null}
              {profile.taxId ? (
                <p className="mt-2 flex items-center gap-2">
                  <Building2 aria-hidden="true" className="size-4" />
                  {profile.taxId}
                </p>
              ) : null}
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}
