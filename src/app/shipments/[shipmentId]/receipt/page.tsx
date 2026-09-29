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
  title: "Shipment Receipt | Apex Global Logistics",
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

function AddressBlock({ address, title }: { address: ShipmentDetail["origin"]; title: string }) {
  return (
    <div>
      <p className="text-xs font-bold tracking-[0.18em] text-slate-500 uppercase">{title}</p>
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

  const profile = await getCompanyProfile();

  if (format === "thermal") {
    return <CompactShipmentReceipt profile={profile} shipment={shipment} />;
  }

  const companyName = profile.legalName || "Apex Global Logistics";
  const shipmentNote = shipment.officeDetails?.comments ?? shipment.notes;

  return (
    <main
      id="main-content"
      className="min-h-svh bg-slate-100 px-4 py-6 text-slate-950 print:bg-white print:p-0"
    >
      <LiveDocumentRefresh initialUpdatedAt={shipment.updatedAt} shipmentId={shipment.id} />
      <style>
        {`
          @media print {
            @page { size: A4; margin: 8mm; }
            .shipment-receipt-sheet { box-shadow: none !important; }
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
              <Link href={`/shipments/${shipment.id}/receipt?format=thermal` as Route}>
                Thermal receipt
              </Link>
            </Button>
            <PrintButton label="Print receipt" />
          </div>
        </div>

        <section className="shipment-receipt-sheet border-border shadow-panel rounded-lg border bg-white p-8 print:rounded-none print:border-0 print:p-0 print:text-[10px] print:shadow-none">
          <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-slate-950 pb-6 print:pb-4">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-md bg-slate-950 text-sm font-black text-white">
                AG
              </div>
              <div>
                <p className="text-lg font-black">{companyName}</p>
                <p className="mt-1 text-xs font-bold tracking-[0.18em] text-slate-500 uppercase">
                  Shipment receipt
                </p>
              </div>
            </div>
            <div className="text-left text-sm sm:text-right">
              <p className="text-xs font-bold tracking-[0.16em] text-slate-500 uppercase">
                Tracking number
              </p>
              <p className="mt-2 font-black break-all">{shipment.shipmentNumber}</p>
              <p className="mt-1 text-xs text-slate-600">Issued {formatDate(shipment.createdAt)}</p>
            </div>
          </header>

          <div className="grid gap-6 border-b border-slate-300 py-6 md:grid-cols-2 print:gap-4 print:py-4">
            <AddressBlock address={shipment.origin} title="Sender / pickup" />
            <AddressBlock address={shipment.destination} title="Recipient / delivery" />
          </div>

          <div className="grid gap-3 border-b border-slate-300 py-5 sm:grid-cols-2 lg:grid-cols-4 print:gap-2 print:py-3">
            {[
              { label: "Status", value: formatShipmentStatus(shipment.status) },
              { label: "Service", value: shipment.serviceLevel ?? "Standard" },
              { label: "Pieces", value: String(shipment.packageCount) },
              {
                label: "Weight",
                value: `${kilogramsToPoundsString(shipment.weightSummary.actualWeightKg) || "0"} lb`,
              },
            ].map((item) => (
              <div className="rounded-md border border-slate-300 p-3 print:p-2" key={item.label}>
                <p className="text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase">
                  {item.label}
                </p>
                <p className="mt-1.5 text-sm font-bold">{item.value}</p>
              </div>
            ))}
          </div>

          {shipment.packages.length ? (
            <section className="border-b border-slate-300 py-5 print:py-3">
              <h2 className="text-xs font-bold tracking-[0.16em] text-slate-500 uppercase">
                Contents summary
              </h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {shipment.packages.slice(0, 4).map((shipmentPackage) => (
                  <div
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                    key={shipmentPackage.id}
                  >
                    <p className="font-semibold">
                      {shipmentPackage.description ?? shipmentPackage.type}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {shipmentPackage.packageNumber}
                      {shipmentPackage.weightKg
                        ? ` | ${kilogramsToPoundsString(shipmentPackage.weightKg)} lb`
                        : ""}
                    </p>
                  </div>
                ))}
              </div>
              {shipment.packages.length > 4 ? (
                <p className="mt-2 text-xs text-slate-600">
                  Additional pieces are recorded in the shipment file.
                </p>
              ) : null}
            </section>
          ) : null}

          {shipmentNote ? (
            <section className="border-b border-slate-300 py-5 print:py-3">
              <h2 className="text-xs font-bold tracking-[0.16em] text-slate-500 uppercase">
                Shipment note
              </h2>
              <p className="mt-2 text-sm leading-6 whitespace-pre-wrap">{shipmentNote}</p>
            </section>
          ) : null}

          <footer className="pt-5 text-center text-sm font-black">
            Thank you for choosing Apex.
          </footer>
        </section>
      </div>
    </main>
  );
}
