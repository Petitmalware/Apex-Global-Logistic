import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PrintButton } from "@/features/shipments/components/print-button";
import { getShipmentForUser } from "@/features/shipments/queries/shipment.queries";
import type { ShipmentDetail } from "@/features/shipments/types";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

type ShipmentReceiptPageProps = {
  params: Promise<{
    shipmentId: string;
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

export default async function ShipmentReceiptPage({ params }: ShipmentReceiptPageProps) {
  const { shipmentId } = await params;
  const user = await requirePermission(PERMISSIONS.SHIPMENTS_READ);
  const shipment = await getShipmentForUser(shipmentId, user);

  if (!shipment) {
    notFound();
  }

  const invoice = shipment.invoice;

  return (
    <main
      id="main-content"
      className="min-h-svh bg-slate-100 px-4 py-6 text-slate-950 print:bg-white print:p-0"
    >
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Button asChild variant="outline">
            <Link href={`/shipments/${shipment.id}` as Route}>
              <ArrowLeft aria-hidden="true" />
              Back to shipment
            </Link>
          </Button>
          <PrintButton label="Print receipt" />
        </div>
        <section className="border-border shadow-panel rounded-lg border bg-white p-8 print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <header className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-300 pb-8">
            <div>
              <p className="text-sm font-bold tracking-[0.32em] text-slate-500 uppercase">
                Apex Global Logistics
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

          <div className="grid gap-8 border-b border-slate-300 py-8 md:grid-cols-2">
            <AddressBlock address={shipment.origin} title="Pickup" />
            <AddressBlock address={shipment.destination} title="Delivery" />
          </div>

          <div className="grid gap-4 border-b border-slate-300 py-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Status", value: shipment.status.replaceAll("_", " ") },
              { label: "Service", value: shipment.serviceLevel ?? "Parcel Standard" },
              { label: "Packages", value: String(shipment.packageCount) },
              { label: "Chargeable", value: `${shipment.weightSummary.chargeableWeightKg} kg` },
            ].map((item) => (
              <div className="rounded-md border border-slate-300 p-4" key={item.label}>
                <p className="text-xs font-bold tracking-[0.16em] text-slate-500 uppercase">
                  {item.label}
                </p>
                <p className="mt-2 font-bold">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="py-8">
            <p className="text-xs font-bold tracking-[0.24em] text-slate-500 uppercase">
              Invoice lines
            </p>
            {invoice ? (
              <div className="mt-4 overflow-hidden border border-slate-300">
                <table className="w-full border-collapse text-sm">
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
                <div className="ml-auto w-full max-w-sm space-y-3 border-t border-slate-300 p-4 text-sm">
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
        </section>
      </div>
    </main>
  );
}
