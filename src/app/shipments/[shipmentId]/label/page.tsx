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

type ShipmentLabelPageProps = {
  params: Promise<{
    shipmentId: string;
  }>;
};

export const metadata: Metadata = {
  title: "Shipping Label | Apex Global Logistics",
};

function AddressBlock({ address, title }: { address: ShipmentDetail["origin"]; title: string }) {
  return (
    <div>
      <p className="text-xs font-bold tracking-[0.24em] text-slate-500 uppercase">{title}</p>
      <div className="mt-3 text-sm leading-6">
        <p className="text-base font-bold text-slate-950">{address.name ?? address.city}</p>
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

function BarcodeMark({ value }: { value: string }) {
  return (
    <div>
      <div aria-hidden="true" className="mt-3 flex h-16 items-stretch gap-1 overflow-hidden">
        {Array.from({ length: 34 }).map((_, index) => (
          <span
            className="bg-slate-950"
            key={index}
            style={{ width: index % 5 === 0 ? 5 : index % 2 === 0 ? 2 : 3 }}
          />
        ))}
      </div>
      <p className="mt-2 font-mono text-xs tracking-[0.22em] break-all text-slate-700">{value}</p>
    </div>
  );
}

export default async function ShipmentLabelPage({ params }: ShipmentLabelPageProps) {
  const { shipmentId } = await params;
  const user = await requirePermission(PERMISSIONS.SHIPMENTS_READ);
  const shipment = await getShipmentForUser(shipmentId, user);

  if (!shipment) {
    notFound();
  }

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
          <PrintButton label="Print label" />
        </div>
        <section className="border-border shadow-panel rounded-lg border bg-white p-8 print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-6 border-b-4 border-slate-950 pb-6">
            <div>
              <p className="text-sm font-bold tracking-[0.32em] text-slate-500 uppercase">
                Apex Global Logistics
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-normal">Shipping Label</h1>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold tracking-[0.24em] text-slate-500 uppercase">
                Tracking number
              </p>
              <p className="mt-2 font-mono text-xl font-bold">{shipment.shipmentNumber}</p>
            </div>
          </div>

          <div className="grid gap-8 border-b border-slate-300 py-8 md:grid-cols-2">
            <AddressBlock address={shipment.origin} title="From" />
            <AddressBlock address={shipment.destination} title="Ship to" />
          </div>

          <div className="grid gap-8 py-8 md:grid-cols-[1fr_280px]">
            <div>
              <p className="text-xs font-bold tracking-[0.24em] text-slate-500 uppercase">
                Service
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-slate-300 p-4">
                  <p className="text-xs text-slate-500">Mode</p>
                  <p className="mt-1 font-bold">{shipment.mode}</p>
                </div>
                <div className="rounded-md border border-slate-300 p-4">
                  <p className="text-xs text-slate-500">Priority</p>
                  <p className="mt-1 font-bold">{shipment.priority}</p>
                </div>
                <div className="rounded-md border border-slate-300 p-4">
                  <p className="text-xs text-slate-500">Packages</p>
                  <p className="mt-1 font-bold">{shipment.packageCount}</p>
                </div>
                <div className="rounded-md border border-slate-300 p-4">
                  <p className="text-xs text-slate-500">Chargeable weight</p>
                  <p className="mt-1 font-bold">{shipment.weightSummary.chargeableWeightKg} kg</p>
                </div>
              </div>
            </div>
            <BarcodeMark value={shipment.shipmentNumber} />
          </div>

          <div className="border-t border-slate-300 pt-6">
            <p className="text-xs font-bold tracking-[0.24em] text-slate-500 uppercase">
              Package manifest
            </p>
            <div className="mt-4 divide-y divide-slate-200 border border-slate-300">
              {shipment.packages.map((shipmentPackage) => (
                <div className="grid gap-3 p-4 text-sm sm:grid-cols-4" key={shipmentPackage.id}>
                  <p className="font-bold">{shipmentPackage.packageNumber}</p>
                  <p>{shipmentPackage.type}</p>
                  <p>{shipmentPackage.weightKg ?? "0"} kg actual</p>
                  <p>{shipmentPackage.volumetricWeightKg} kg dimensional</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
