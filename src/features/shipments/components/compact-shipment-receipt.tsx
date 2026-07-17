import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import type { CompanyProfileInput } from "@/features/settings/schemas/company-profile.schema";
import { LiveDocumentRefresh } from "@/features/shipments/components/live-document-refresh";
import { PrintButton } from "@/features/shipments/components/print-button";
import { formatShipmentStatus } from "@/features/shipments/status-labels";
import type { ShipmentDetail } from "@/features/shipments/types";
import { kilogramsToPoundsString } from "@/lib/measurements";

function formatDate(value: string | null) {
  if (!value) {
    return null;
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

function formatEnum(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^./, (character) => character.toUpperCase());
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <div className="grid grid-cols-[92px_1fr] gap-2 py-1 text-[11px] leading-4">
      <dt className="font-semibold text-slate-600">{label}</dt>
      <dd className="min-w-0 text-right font-medium break-words text-slate-950">{value}</dd>
    </div>
  );
}

function AddressReceiptBlock({
  address,
  email,
  phone,
  title,
}: {
  address: ShipmentDetail["origin"];
  email?: string | null;
  phone?: string | null;
  title: string;
}) {
  return (
    <section className="border-t border-dashed border-slate-400 py-3">
      <h2 className="text-xs font-black uppercase">{title}</h2>
      <div className="mt-2 text-[11px] leading-4">
        {address.name ? <p className="font-bold">{address.name}</p> : null}
        <p>{address.line1}</p>
        {address.line2 ? <p>{address.line2}</p> : null}
        <p>{[address.city, address.state, address.postalCode].filter(Boolean).join(", ")}</p>
        <p>{address.countryCode}</p>
        {phone ? <p>{phone}</p> : null}
        {email ? <p className="break-all">{email}</p> : null}
      </div>
    </section>
  );
}

function CompanyReceiptHeader({ profile }: { profile: CompanyProfileInput }) {
  const address = [
    profile.addressLine1,
    profile.addressLine2,
    [profile.city, profile.state, profile.postalCode].filter(Boolean).join(", "),
    profile.country,
  ].filter(Boolean);

  return (
    <header className="text-center">
      <div className="mx-auto grid size-11 place-items-center rounded-md bg-slate-950 text-sm font-black text-white">
        AG
      </div>
      <p className="mt-3 text-base font-black">Apex Global Logistics</p>
      {profile.legalName && profile.legalName !== "Apex Global Logistics" ? (
        <p className="mt-1 text-[10px] text-slate-600">{profile.legalName}</p>
      ) : null}
      {address.map((line) => (
        <p className="text-[10px] leading-4 text-slate-600" key={line}>
          {line}
        </p>
      ))}
      <p className="mt-1 text-[10px] text-slate-600">
        {profile.email ?? siteConfig.emails.support}
      </p>
      {profile.phone ? <p className="text-[10px] text-slate-600">{profile.phone}</p> : null}
      {profile.registrationNumber ? (
        <p className="mt-1 text-[10px] text-slate-600">Registration {profile.registrationNumber}</p>
      ) : null}
      <div className="my-3 border-y-2 border-slate-950 py-2">
        <h1 className="text-sm font-black uppercase">Official shipping receipt</h1>
      </div>
    </header>
  );
}

export function CompactShipmentReceipt({
  profile,
  shipment,
}: {
  profile: CompanyProfileInput;
  shipment: ShipmentDetail;
}) {
  const invoice = shipment.invoice;
  const balanceDue = invoice ? Number(invoice.total) - Number(invoice.amountPaid) : null;
  const issuedAt = formatDate(invoice?.issuedAt ?? shipment.createdAt);
  const recipientPhone = shipment.manualRecipient?.phone ?? null;
  const officeDetails = shipment.officeDetails;

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
              size: 80mm auto;
              margin: 4mm;
            }

            .compact-receipt-sheet {
              width: 72mm !important;
              max-width: 72mm !important;
              box-shadow: none !important;
            }
          }
        `}
      </style>
      <div className="mx-auto max-w-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Button asChild variant="outline">
            <Link href={`/shipments/${shipment.id}` as Route}>
              <ArrowLeft aria-hidden="true" />
              Back to shipment
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/shipments/${shipment.id}/receipt?format=a4` as Route}>A4 receipt</Link>
            </Button>
            <PrintButton label="Print / save receipt" />
          </div>
        </div>

        <article className="compact-receipt-sheet mx-auto w-[80mm] max-w-full rounded-md bg-white px-5 py-6 font-mono shadow-sm print:rounded-none print:px-0 print:py-0">
          <CompanyReceiptHeader profile={profile} />

          <dl>
            <DetailRow label="Receipt" value={`RCT-${shipment.shipmentNumber}`} />
            <DetailRow label="Issued" value={issuedAt} />
            <DetailRow label="Tracking" value={shipment.shipmentNumber} />
            <DetailRow label="Reference" value={shipment.referenceNumber} />
            <DetailRow label="Status" value={formatShipmentStatus(shipment.status)} />
            <DetailRow label="Location" value={shipment.timeline[0]?.currentLocation} />
            <DetailRow
              label="Updated"
              value={formatDate(shipment.timeline[0]?.occurredAt ?? null)}
            />
            <DetailRow label="Mode" value={formatEnum(shipment.mode)} />
            <DetailRow label="Service" value={shipment.serviceLevel} />
            <DetailRow label="Priority" value={formatEnum(shipment.priority)} />
            <DetailRow label="Carrier" value={officeDetails?.carrier} />
            <DetailRow label="Carrier ref" value={officeDetails?.carrierReference} />
            <DetailRow label="Courier" value={officeDetails?.courier} />
            <DetailRow label="Payment" value={officeDetails?.paymentMode} />
            <DetailRow label="Packages" value={String(shipment.packageCount)} />
            <DetailRow
              label="Weight"
              value={`${kilogramsToPoundsString(shipment.weightSummary.chargeableWeightKg)} lb`}
            />
          </dl>

          <AddressReceiptBlock
            address={shipment.origin}
            email={officeDetails?.shipperEmail}
            phone={officeDetails?.shipperPhone}
            title="Sender / pickup"
          />
          <AddressReceiptBlock
            address={{
              ...shipment.destination,
              name: shipment.recipientName ?? shipment.destination.name,
            }}
            email={shipment.recipientEmail}
            phone={recipientPhone}
            title="Recipient / delivery"
          />

          {shipment.packages.length ? (
            <section className="border-t border-dashed border-slate-400 py-3">
              <h2 className="text-xs font-black uppercase">Package details</h2>
              <div className="mt-2 space-y-3">
                {shipment.packages.map((shipmentPackage) => (
                  <div key={shipmentPackage.id}>
                    <p className="text-[11px] font-bold">{shipmentPackage.packageNumber}</p>
                    <DetailRow label="Type" value={formatEnum(shipmentPackage.type)} />
                    <DetailRow label="Description" value={shipmentPackage.description} />
                    <DetailRow
                      label="Weight"
                      value={
                        shipmentPackage.weightKg
                          ? `${kilogramsToPoundsString(shipmentPackage.weightKg)} lb`
                          : null
                      }
                    />
                    <DetailRow
                      label="Declared"
                      value={
                        shipmentPackage.declaredValue
                          ? formatMoney(shipmentPackage.declaredValue, shipmentPackage.currency)
                          : null
                      }
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="border-t border-dashed border-slate-400 py-3">
            <h2 className="text-xs font-black uppercase">Billing summary</h2>
            {invoice ? (
              <dl className="mt-2">
                <DetailRow label="Invoice" value={invoice.invoiceNumber} />
                <DetailRow label="Status" value={formatEnum(invoice.status)} />
                <DetailRow
                  label="Subtotal"
                  value={formatMoney(invoice.subtotal, invoice.currency)}
                />
                {Number(invoice.taxTotal) > 0 ? (
                  <DetailRow label="Tax" value={formatMoney(invoice.taxTotal, invoice.currency)} />
                ) : null}
                {Number(invoice.amountPaid) > 0 ? (
                  <DetailRow
                    label="Paid"
                    value={formatMoney(invoice.amountPaid, invoice.currency)}
                  />
                ) : null}
                <div className="mt-2 flex items-center justify-between border-y-2 border-slate-950 py-2 text-sm font-black">
                  <dt>Balance due</dt>
                  <dd>{formatMoney(balanceDue ?? 0, invoice.currency)}</dd>
                </div>
              </dl>
            ) : officeDetails?.totalFreight ? (
              <dl className="mt-2">
                <DetailRow label="Freight total" value={officeDetails.totalFreight} />
                <p className="mt-2 text-[10px] leading-4 text-slate-600">
                  No invoice is attached. Verify any payment request against an official invoice
                  before paying.
                </p>
              </dl>
            ) : (
              <p className="mt-2 text-[10px] leading-4 text-slate-600">
                No invoice or payment total is recorded for this shipment.
              </p>
            )}
          </section>

          {officeDetails?.comments || shipment.notes ? (
            <section className="border-t border-dashed border-slate-400 py-3">
              <h2 className="text-xs font-black uppercase">Shipment notes</h2>
              <p className="mt-2 text-[10px] leading-4 whitespace-pre-wrap">
                {officeDetails?.comments ?? shipment.notes}
              </p>
            </section>
          ) : null}

          <footer className="border-t border-dashed border-slate-400 pt-4 text-center text-[9px] leading-4 text-slate-600">
            <p className="font-bold text-slate-950">Verify this receipt before payment</p>
            <p className="mt-1 break-all">
              Enter tracking number {shipment.shipmentNumber} at {siteConfig.url}/tracking
            </p>
            <p className="mt-2">
              This receipt reflects the shipment and billing information stored in Apex operating
              records when issued. It is not a government license or insurance certificate.
            </p>
            <div className="mt-7 grid grid-cols-2 gap-4 text-left">
              <div className="border-t border-slate-500 pt-1">Issued by</div>
              <div className="border-t border-slate-500 pt-1">Recipient signature</div>
            </div>
            <p className="mt-6 font-black text-slate-950">Thank you for choosing Apex.</p>
          </footer>
        </article>
      </div>
    </main>
  );
}
