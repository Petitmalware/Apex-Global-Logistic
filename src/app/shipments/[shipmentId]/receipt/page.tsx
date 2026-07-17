import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCompanyProfile } from "@/features/settings/queries/company-profile.queries";
import { CompactShipmentReceipt } from "@/features/shipments/components/compact-shipment-receipt";
import { LiveDocumentRefresh } from "@/features/shipments/components/live-document-refresh";
import { PrintButton } from "@/features/shipments/components/print-button";
import { getShipmentForUser } from "@/features/shipments/queries/shipment.queries";
import { formatShipmentStatus } from "@/features/shipments/status-labels";
import type { ShipmentDetail } from "@/features/shipments/types";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";
import { kilogramsToPoundsString } from "@/lib/measurements";

type ShipmentReceiptPageProps = {
  params: Promise<{
    shipmentId: string;
  }>;
  searchParams: Promise<{
    format?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Parcel Receipt | Apex Global Logistics",
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMoney(value: string | number, currency = "USD") {
  return new Intl.NumberFormat("en", {
    currency,
    style: "currency",
  }).format(Number(value));
}

function AddressBlock({ address, title }: { address: ShipmentDetail["origin"]; title: string }) {
  return (
    <div>
      <p className="text-xs font-bold tracking-[0.24em] text-slate-500 uppercase">{title}</p>
      <div className="mt-3 text-sm leading-6">
        <p className="font-bold">{address.name ?? address.city}</p>
        <p>{address.line1}</p>
        {address.line2 ? <p>{address.line2}</p> : null}
        <p>
          {address.city}
          {address.state ? `, ${address.state}` : ""} {address.postalCode ?? ""}
        </p>
        <p>{address.countryCode}</p>
      </div>
    </div>
  );
}

export default async function ShipmentReceiptPage({
  params,
  searchParams,
}: ShipmentReceiptPageProps) {
  const { shipmentId } = await params;
  const { format } = await searchParams;
  const user = await requirePermission(PERMISSIONS.SHIPMENTS_READ);
  const shipment = await getShipmentForUser(shipmentId, user);

  if (!shipment) {
    notFound();
  }

  if (format !== "a4") {
    const profile = await getCompanyProfile();

    return <CompactShipmentReceipt profile={profile} shipment={shipment} />;
  }

  const invoice = shipment.invoice;

  return (
    <main
      id="main-content"
      className="min-h-svh bg-slate-100 px-4 py-6 text-slate-950 print:bg-white print:p-0"
    >
      <LiveDocumentRefresh initialUpdatedAt={shipment.updatedAt} shipmentId={shipment.id} />
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 8mm;
            }

            .parcel-receipt-sheet {
              page-break-after: avoid;
              page-break-inside: avoid;
            }

            .parcel-receipt-sheet h1 {
              font-size: 26px !important;
            }

            .parcel-receipt-table th,
            .parcel-receipt-table td {
              padding-bottom: 5px !important;
              padding-top: 5px !important;
            }
          }
        `}
      </style>
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Button asChild variant="outline">
            <Link href={`/shipments/${shipment.id}` as Route}>
              <ArrowLeft aria-hidden="true" />
              Back to shipment
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/shipments/${shipment.id}/receipt` as Route}>80 mm receipt</Link>
            </Button>
            <PrintButton label="Print receipt" />
          </div>
        </div>
        <section className="parcel-receipt-sheet border-border shadow-panel rounded-lg border bg-white p-8 print:rounded-none print:border-0 print:p-0 print:text-[11px] print:shadow-none">
          <header className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-300 pb-8 print:pb-4">
            <div>
              <p className="text-sm font-bold tracking-[0.32em] text-slate-500 uppercase">
                Apex Global Logistics authorized parcel receipt
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-normal">Parcel Receipt</h1>
              <p className="mt-3 text-sm text-slate-600">{shipment.shipmentNumber}</p>
            </div>
            <div className="text-right text-sm">
              <p className="text-xs font-bold tracking-[0.24em] text-slate-500 uppercase">
                Invoice
              </p>
              <p className="mt-2 font-bold">{invoice?.invoiceNumber ?? "Not generated"}</p>
              <p className="mt-1 text-slate-600">Issued {formatDate(invoice?.issuedAt ?? null)}</p>
            </div>
          </header>

          <div className="grid gap-8 border-b border-slate-300 py-8 md:grid-cols-2 print:gap-4 print:py-4">
            <AddressBlock address={shipment.origin} title="Pickup" />
            <AddressBlock address={shipment.destination} title="Delivery" />
          </div>

          <div className="grid gap-4 border-b border-slate-300 py-8 sm:grid-cols-2 lg:grid-cols-4 print:gap-2 print:py-4">
            {[
              { label: "Status", value: formatShipmentStatus(shipment.status) },
              { label: "Service", value: shipment.serviceLevel ?? "Parcel Standard" },
              { label: "Packages", value: String(shipment.packageCount) },
              {
                label: "Chargeable",
                value: `${kilogramsToPoundsString(shipment.weightSummary.chargeableWeightKg)} lb`,
              },
            ].map((item) => (
              <div className="rounded-md border border-slate-300 p-4 print:p-2" key={item.label}>
                <p className="text-xs font-bold tracking-[0.16em] text-slate-500 uppercase">
                  {item.label}
                </p>
                <p className="mt-2 font-bold">{item.value}</p>
              </div>
            ))}
          </div>

          {shipment.timeline[0]?.currentLocation ? (
            <div className="border-b border-slate-300 py-4 text-sm print:py-2 print:text-[10px]">
              <span className="font-bold">Latest recorded location:</span>{" "}
              {shipment.timeline[0].currentLocation}
              <span className="text-slate-500">
                {" "}
                · {formatDate(shipment.timeline[0].occurredAt)}
              </span>
            </div>
          ) : null}

          <div className="py-8 print:py-4">
            <p className="text-xs font-bold tracking-[0.24em] text-slate-500 uppercase">
              Invoice lines
            </p>
            {invoice ? (
              <div className="mt-4 overflow-hidden border border-slate-300">
                <table className="parcel-receipt-table w-full border-collapse text-sm print:text-[10px]">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold">Description</th>
                      <th className="px-4 py-3 text-right font-bold">Qty</th>
                      <th className="px-4 py-3 text-right font-bold">Unit</th>
                      <th className="px-4 py-3 text-right font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoice.lineItems.map((lineItem) => (
                      <tr key={lineItem.id}>
                        <td className="px-4 py-3">{lineItem.description}</td>
                        <td className="px-4 py-3 text-right">{lineItem.quantity}</td>
                        <td className="px-4 py-3 text-right">
                          {formatMoney(lineItem.unitPrice, invoice.currency)}
                        </td>
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
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-600">Tax</span>
                    <span>{formatMoney(invoice.taxTotal, invoice.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-lg font-black">
                    <span>Total</span>
                    <span>{formatMoney(invoice.total, invoice.currency)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 rounded-md border border-slate-300 p-4 text-sm text-slate-600">
                No invoice has been generated for this shipment yet.
              </p>
            )}
          </div>

          <footer className="border-t border-slate-300 pt-5 text-xs leading-5 text-slate-600 print:pt-3 print:text-[9px] print:leading-4">
            <p className="font-bold text-slate-950">Official shipment receipt</p>
            <p className="mt-1">
              This receipt is issued from Apex Global Logistics operating records as proof of the
              shipment intake, route, package count, and billing summary shown above.
            </p>
          </footer>
        </section>
      </div>
    </main>
  );
}
