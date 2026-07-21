import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { PrintButton } from "@/features/shipments/components/print-button";
import { formatShipmentStatus } from "@/features/shipments/status-labels";
import type {
  PublicTrackingParty,
  ShipmentAddressView,
  ShipmentTrackingSnapshot,
} from "@/features/shipments/types";

function formatDate(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatEnum(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^./, (character) => character.toUpperCase());
}

function formatDeliveryWindow(snapshot: ShipmentTrackingSnapshot) {
  if (!snapshot.deliveryWindowStart && !snapshot.deliveryWindowEnd) {
    return "Awaiting delivery estimate";
  }

  if (!snapshot.deliveryWindowEnd) {
    return formatDate(snapshot.deliveryWindowStart);
  }

  if (!snapshot.deliveryWindowStart) {
    return `By ${formatDate(snapshot.deliveryWindowEnd)}`;
  }

  return `${formatDate(snapshot.deliveryWindowStart)} - ${formatDate(snapshot.deliveryWindowEnd)}`;
}

function formatAddress(address: ShipmentAddressView) {
  const locality = [address.city, address.state, address.postalCode]
    .filter((value): value is string => Boolean(value))
    .join(", ");

  return [address.line1, address.line2, locality, address.countryCode]
    .filter((value): value is string => Boolean(value))
    .join(", ");
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) {
    return null;
  }

  return (
    <div className="border-b border-slate-200 py-2 last:border-b-0">
      <dt className="text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase">{label}</dt>
      <dd className="mt-1 font-semibold break-words text-slate-950">{value}</dd>
    </div>
  );
}

function Party({ party, title }: { party: PublicTrackingParty; title: string }) {
  return (
    <section className="rounded-md border border-slate-300 p-4">
      <h2 className="text-xs font-black tracking-[0.16em] text-slate-600 uppercase">{title}</h2>
      <dl className="mt-3 text-sm">
        <Detail label="Name" value={party.name} />
        <Detail
          label={title === "Sender" ? "Pickup address" : "Delivery address"}
          value={formatAddress(party.address)}
        />
        <Detail label="Phone" value={party.phone} />
        <Detail label="Email" value={party.email} />
      </dl>
    </section>
  );
}

export function PublicShipmentReceipt({ snapshot }: { snapshot: ShipmentTrackingSnapshot }) {
  const details = snapshot.publicDetails;
  const latestEvent = snapshot.timeline[0] ?? null;

  return (
    <main className="min-h-svh bg-slate-100 px-4 py-6 text-slate-950 print:bg-white print:p-0">
      <style>
        {`
          @media print {
            @page { size: A4; margin: 10mm; }
            .public-receipt-sheet { box-shadow: none !important; }
          }
        `}
      </style>
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Button asChild variant="outline">
            <Link href={"/tracking" as Route}>
              <ArrowLeft aria-hidden="true" />
              Back to tracking
            </Link>
          </Button>
          <PrintButton label="Print / save receipt" />
        </div>

        <article className="public-receipt-sheet rounded-md bg-white p-6 shadow-sm sm:p-8 print:p-0">
          <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-slate-950 pb-6">
            <div className="flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-md bg-slate-950 text-sm font-black text-white">
                AG
              </div>
              <div>
                <p className="text-lg font-black">{siteConfig.name}</p>
                <p className="mt-1 text-xs font-bold tracking-[0.16em] text-slate-500 uppercase">
                  Shipment receipt
                </p>
              </div>
            </div>
            <div className="text-left text-sm sm:text-right">
              <p className="text-xs font-bold tracking-[0.16em] text-slate-500 uppercase">
                Tracking number
              </p>
              <p className="mt-2 font-black break-all">{snapshot.shipmentNumber}</p>
              {snapshot.referenceNumber ? (
                <p className="mt-1 text-slate-600">Reference {snapshot.referenceNumber}</p>
              ) : null}
            </div>
          </header>

          <section className="grid gap-3 border-b border-slate-300 py-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Current status", value: formatShipmentStatus(snapshot.status) },
              { label: "Latest location", value: latestEvent?.currentLocation ?? "Not recorded" },
              { label: "Expected delivery", value: formatDeliveryWindow(snapshot) },
              { label: "Service", value: snapshot.serviceLevel ?? formatEnum(snapshot.mode) },
            ].map((item) => (
              <div className="rounded-md border border-slate-300 p-3" key={item.label}>
                <p className="text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-bold">{item.value}</p>
              </div>
            ))}
          </section>

          {details?.sender || details?.recipient ? (
            <section className="grid gap-4 border-b border-slate-300 py-5 sm:grid-cols-2">
              {details.sender ? <Party party={details.sender} title="Sender" /> : null}
              {details.recipient ? <Party party={details.recipient} title="Recipient" /> : null}
            </section>
          ) : null}

          <section className="grid gap-4 border-b border-slate-300 py-5 md:grid-cols-2">
            <div>
              <h2 className="text-xs font-black tracking-[0.16em] text-slate-600 uppercase">
                Shipment details
              </h2>
              <dl className="mt-3 text-sm">
                <Detail
                  label="Route"
                  value={`${snapshot.originCity}, ${snapshot.originCountryCode} to ${snapshot.destinationCity}, ${snapshot.destinationCountryCode}`}
                />
                <Detail
                  label="Packages"
                  value={`${snapshot.packageCount} piece${snapshot.packageCount === 1 ? "" : "s"}`}
                />
                <Detail
                  label="Recorded weight"
                  value={snapshot.totalWeightLb ? `${snapshot.totalWeightLb} lb` : null}
                />
                <Detail label="Carrier" value={details?.carrier} />
                <Detail label="Carrier reference" value={details?.carrierReference} />
              </dl>
            </div>

            {details?.consignment ? (
              <div>
                <h2 className="text-xs font-black tracking-[0.16em] text-slate-600 uppercase">
                  Package record
                </h2>
                <div className="mt-3 space-y-2 text-sm">
                  {details.consignment.packages.map((shipmentPackage, index) => (
                    <div
                      className="rounded-md border border-slate-200 p-3"
                      key={`${index}-${shipmentPackage.type}`}
                    >
                      <p className="font-bold">Piece {index + 1}</p>
                      <p className="mt-1 text-slate-700">
                        {shipmentPackage.description ?? formatEnum(shipmentPackage.type)}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {formatEnum(shipmentPackage.type)}
                        {shipmentPackage.weightLb ? ` | ${shipmentPackage.weightLb} lb` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {details?.pet || details?.freight ? (
            <section className="grid gap-4 border-b border-slate-300 py-5 md:grid-cols-2">
              {details.pet ? (
                <div>
                  <h2 className="text-xs font-black tracking-[0.16em] text-slate-600 uppercase">
                    Pet details
                  </h2>
                  <dl className="mt-3 text-sm">
                    <Detail label="Pet" value={details.pet.name} />
                    <Detail label="Species" value={formatEnum(details.pet.species)} />
                    <Detail label="Breed" value={details.pet.breed} />
                    <Detail
                      label="Weight"
                      value={details.pet.weightLb ? `${details.pet.weightLb} lb` : null}
                    />
                  </dl>
                </div>
              ) : null}
              {details.freight ? (
                <div>
                  <h2 className="text-xs font-black tracking-[0.16em] text-slate-600 uppercase">
                    Freight details
                  </h2>
                  <dl className="mt-3 text-sm">
                    <Detail label="Freight type" value={formatEnum(details.freight.freightType)} />
                    <Detail label="Container" value={details.freight.containerNumber} />
                    <Detail label="Origin terminal" value={details.freight.originTerminal} />
                    <Detail
                      label="Destination terminal"
                      value={details.freight.destinationTerminal}
                    />
                  </dl>
                </div>
              ) : null}
            </section>
          ) : null}

          {latestEvent?.message ? (
            <section className="border-b border-slate-300 py-5">
              <h2 className="text-xs font-black tracking-[0.16em] text-slate-600 uppercase">
                Shipment note
              </h2>
              <p className="mt-3 text-sm leading-6 whitespace-pre-wrap">{latestEvent.message}</p>
              <p className="mt-2 text-xs text-slate-600">
                Updated {formatDate(latestEvent.occurredAt)}
              </p>
            </section>
          ) : null}

          <footer className="pt-5 text-center text-sm font-black">
            Thank you for choosing Apex.
          </footer>
        </article>
      </div>
    </main>
  );
}
