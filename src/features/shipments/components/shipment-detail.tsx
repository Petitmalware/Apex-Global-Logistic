import Link from "next/link";
import type { Route } from "next";
import Image from "next/image";
import {
  Box,
  CalendarClock,
  Camera,
  Clock3,
  FileText,
  History,
  MapPin,
  Package,
  Pencil,
  Printer,
  ReceiptText,
  Scale,
  Truck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PackagePhotoForm } from "@/features/shipments/components/package-photo-form";
import { ShipmentDocumentForm } from "@/features/shipments/components/shipment-document-form";
import { ShipmentStatusBadge } from "@/features/shipments/components/shipment-list";
import { RealtimeShipmentTimeline } from "@/features/shipments/components/realtime-shipment-timeline";
import { ShipmentLiveMap } from "@/features/shipments/components/shipment-live-map";
import { ShipmentStatusForm } from "@/features/shipments/components/shipment-status-form";
import {
  updateShipmentStatusAction,
  uploadPackagePhotoAction,
  uploadShipmentDocumentAction,
} from "@/features/shipments/actions/shipment.actions";
import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import type { ShipmentDetail } from "@/features/shipments/types";
import type { ShipmentTrackingSnapshot } from "@/features/shipments/types";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { kilogramsToPoundsString } from "@/lib/measurements";

function canManageShipmentWorkspace(user: AuthSessionUser) {
  return user.roles.includes(AUTH_ROLES.ADMIN) || user.roles.includes(AUTH_ROLES.SUPER_ADMIN);
}

function getTrackingSnapshotFromDetail(shipment: ShipmentDetail): ShipmentTrackingSnapshot {
  return {
    createdAt: shipment.createdAt,
    deliveryWindowEnd: shipment.deliveryWindowEnd,
    deliveryWindowStart: shipment.deliveryWindowStart,
    deliveredAt: shipment.deliveredAt,
    destinationCity: shipment.destinationCity,
    destinationCountryCode: shipment.destination.countryCode,
    dispatchedAt: null,
    id: shipment.id,
    mode: shipment.mode,
    originCity: shipment.originCity,
    originCountryCode: shipment.origin.countryCode,
    packageCount: shipment.packages.length,
    pickupWindowEnd: shipment.pickupWindowEnd,
    pickupWindowStart: shipment.pickupWindowStart,
    priority: shipment.priority,
    publicDetails: null,
    referenceNumber: shipment.referenceNumber,
    serviceLevel: shipment.serviceLevel,
    shipmentNumber: shipment.shipmentNumber,
    status: shipment.status,
    timeline: shipment.timeline,
    totalWeightLb: kilogramsToPoundsString(shipment.weightSummary.actualWeightKg) || null,
    updatedAt: shipment.updatedAt,
  };
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatMoney(value: string | number, currency = "USD") {
  return new Intl.NumberFormat("en", {
    currency,
    style: "currency",
  }).format(Number(value));
}

function AddressCard({ address, title }: { address: ShipmentDetail["origin"]; title: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="bg-accent/15 text-accent-foreground grid size-10 place-items-center rounded-md">
          <MapPin aria-hidden="true" className="size-5" />
        </div>
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">{address.name ?? address.city}</p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6">
          {address.line1}
          {address.line2 ? `, ${address.line2}` : ""}
          <br />
          {address.city}
          {address.state ? `, ${address.state}` : ""} {address.postalCode ?? ""}
          <br />
          {address.countryCode}
        </p>
      </CardContent>
    </Card>
  );
}

function getVisibleOfficeDetails(shipment: ShipmentDetail) {
  const details = shipment.officeDetails;

  if (!details) {
    return [];
  }

  return [
    { label: "Courier", value: details.courier },
    { label: "Carrier", value: details.carrier },
    { label: "Carrier reference", value: details.carrierReference },
    { label: "Payment mode", value: details.paymentMode },
    { label: "Total freight", value: details.totalFreight },
    { label: "Quantity", value: details.quantity },
    { label: "Departure time", value: details.departureTime },
    { label: "Pickup time", value: details.pickupTime },
    { label: "Shipper phone", value: details.shipperPhone },
    { label: "Shipper email", value: details.shipperEmail },
  ].filter((item) => item.value);
}

function OfficeDetailsCard({ shipment }: { shipment: ShipmentDetail }) {
  const officeDetails = getVisibleOfficeDetails(shipment);

  if (!officeDetails.length && !shipment.officeDetails?.comments) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="bg-info/10 text-info grid size-10 place-items-center rounded-md">
          <Truck aria-hidden="true" className="size-5" />
        </div>
        <div>
          <CardTitle>Agency shipment details</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Carrier, billing, schedule, and office notes captured by the admin team.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {officeDetails.map((item) => (
            <div className="border-border bg-surface rounded-lg border p-3" key={item.label}>
              <p className="text-muted-foreground text-xs font-semibold uppercase">{item.label}</p>
              <p className="mt-2 text-sm font-medium">{item.value}</p>
            </div>
          ))}
        </div>
        {shipment.officeDetails?.comments ? (
          <div className="border-border bg-surface rounded-lg border p-4">
            <p className="text-muted-foreground text-xs font-semibold uppercase">Comments</p>
            <p className="mt-2 text-sm leading-6">{shipment.officeDetails.comments}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ShipmentOverview({
  canManage,
  shipment,
}: {
  canManage: boolean;
  shipment: ShipmentDetail;
}) {
  return (
    <section className="bg-primary text-primary-foreground shadow-panel overflow-hidden rounded-lg p-6 md:p-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <Badge className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground">
            {shipment.shipmentNumber}
          </Badge>
          <h2 className="mt-5 text-3xl font-semibold tracking-normal md:text-4xl">
            {shipment.originCity} to {shipment.destinationCity}
          </h2>
          <p className="text-primary-foreground/72 mt-3 max-w-2xl text-sm leading-6">
            {shipment.referenceNumber
              ? `Reference ${shipment.referenceNumber}`
              : "Shipment management workspace with packages, timeline, documents, and history."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          <ShipmentStatusBadge status={shipment.status} />
          <Button
            asChild
            className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/15"
            variant="outline"
          >
            <Link href={`/shipments/${shipment.id}/label` as Route}>
              <Printer aria-hidden="true" />
              Label
            </Link>
          </Button>
          <Button
            asChild
            className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/15"
            variant="outline"
          >
            <Link href={`/shipments/${shipment.id}/receipt` as Route}>
              <ReceiptText aria-hidden="true" />
              Receipt
            </Link>
          </Button>
          {canManage ? (
            <Button asChild variant="accent">
              <Link href={`/shipments/${shipment.id}/edit` as Route}>
                <Pencil aria-hidden="true" />
                Edit shipment
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          {
            label: "Recipient",
            value: shipment.recipientName ?? shipment.recipientEmail ?? "Manual tracking",
          },
          { label: "Mode", value: shipment.mode },
          { label: "Priority", value: shipment.priority },
          { label: "Packages", value: String(shipment.packageCount) },
          { label: "Updated", value: formatDate(shipment.updatedAt) },
        ].map((item) => (
          <div
            className="border-primary-foreground/15 bg-primary-foreground/8 rounded-lg border p-4"
            key={item.label}
          >
            <p className="text-primary-foreground/60 text-xs font-semibold uppercase">
              {item.label}
            </p>
            <p className="mt-2 font-semibold">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function WeightSummary({ shipment }: { shipment: ShipmentDetail }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="bg-accent/15 text-accent-foreground grid size-10 place-items-center rounded-md">
          <Scale aria-hidden="true" className="size-5" />
        </div>
        <div>
          <CardTitle>Weight calculation</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Billing uses the greater of actual and dimensional weight.
          </p>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Actual",
            value: kilogramsToPoundsString(shipment.weightSummary.actualWeightKg),
          },
          {
            label: "Dimensional",
            value: kilogramsToPoundsString(shipment.weightSummary.dimensionalWeightKg),
          },
          {
            label: "Chargeable",
            value: kilogramsToPoundsString(shipment.weightSummary.chargeableWeightKg),
          },
        ].map((item) => (
          <div className="border-border bg-surface rounded-lg border p-4" key={item.label}>
            <p className="text-muted-foreground text-xs font-semibold uppercase">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold">{item.value} lb</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function InvoiceSummary({
  canIssue,
  invoice,
}: {
  canIssue: boolean;
  invoice: ShipmentDetail["invoice"];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="bg-success/10 text-success grid size-10 place-items-center rounded-md">
          <ReceiptText aria-hidden="true" className="size-5" />
        </div>
        <div>
          <CardTitle>Invoice</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Parcel booking totals and billing line items.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {invoice ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{invoice.invoiceNumber}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Issued {formatDate(invoice.issuedAt)}
                </p>
              </div>
              <Badge variant="outline">{invoice.status.replaceAll("_", " ")}</Badge>
            </div>
            <Button asChild variant="outline">
              <Link href={`/invoices/${invoice.id}` as Route}>
                <ReceiptText aria-hidden="true" />
                View invoice
              </Link>
            </Button>
            <div className="space-y-2">
              {invoice.lineItems.map((lineItem) => (
                <div className="flex items-start justify-between gap-4 text-sm" key={lineItem.id}>
                  <span className="text-muted-foreground">{lineItem.description}</span>
                  <span className="font-medium">
                    {formatMoney(lineItem.total, invoice.currency)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-border space-y-2 border-t pt-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(invoice.subtotal, invoice.currency)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatMoney(invoice.taxTotal, invoice.currency)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-base font-semibold">
                <span>Total</span>
                <span>{formatMoney(invoice.total, invoice.currency)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">No invoice has been generated yet.</p>
            {canIssue ? (
              <Button asChild variant="accent">
                <Link href={"/admin/invoices/new" as Route}>
                  <ReceiptText aria-hidden="true" />
                  Issue invoice
                </Link>
              </Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PackageCards({ shipment }: { shipment: ShipmentDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Package details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        {shipment.packages.map((shipmentPackage) => (
          <div className="border-border bg-surface rounded-lg border p-4" key={shipmentPackage.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="bg-secondary text-secondary-foreground grid size-10 place-items-center rounded-md">
                  <Package aria-hidden="true" className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">{shipmentPackage.packageNumber}</p>
                  <p className="text-muted-foreground text-sm">{shipmentPackage.type}</p>
                </div>
              </div>
              <Badge variant="outline">{shipmentPackage.status.replaceAll("_", " ")}</Badge>
            </div>
            <p className="text-muted-foreground mt-4 text-sm leading-6">
              {shipmentPackage.description ?? "No package description provided."}
            </p>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <span>Weight: {kilogramsToPoundsString(shipmentPackage.weightKg) || "n/a"} lb</span>
              <span>
                Dimensional: {kilogramsToPoundsString(shipmentPackage.volumetricWeightKg)} lb
              </span>
              <span>
                Dimensions:{" "}
                {shipmentPackage.lengthCm && shipmentPackage.widthCm && shipmentPackage.heightCm
                  ? `${shipmentPackage.lengthCm} x ${shipmentPackage.widthCm} x ${shipmentPackage.heightCm} cm`
                  : "n/a"}
              </span>
              <span>
                Value: {shipmentPackage.declaredValue ?? "n/a"} {shipmentPackage.currency}
              </span>
              <span>Fragile: {shipmentPackage.fragile ? "Yes" : "No"}</span>
              <span>Hazardous: {shipmentPackage.hazardous ? "Yes" : "No"}</span>
            </div>
            {shipmentPackage.photos.length ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {shipmentPackage.photos.map((photo) => (
                  <figure className="min-w-0" key={photo.id}>
                    <Image
                      alt={photo.caption ?? `Photo for ${shipmentPackage.packageNumber}`}
                      className="border-border aspect-[4/3] w-full rounded-md border object-cover"
                      height={180}
                      sizes="(min-width: 640px) 240px, 50vw"
                      src={`/shipments/${shipment.id}/packages/${shipmentPackage.id}/photos/${photo.id}`}
                      unoptimized
                      width={240}
                    />
                    <figcaption className="text-muted-foreground mt-1 truncate text-xs">
                      {photo.caption ?? photo.fileName}
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PackagePhotos({ canManage, shipment }: { canManage: boolean; shipment: ShipmentDetail }) {
  const photoCount = shipment.packages.reduce(
    (sum, shipmentPackage) => sum + shipmentPackage.photos.length,
    0,
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="bg-info/10 text-info grid size-10 place-items-center rounded-md">
          <Camera aria-hidden="true" className="size-5" />
        </div>
        <div>
          <CardTitle>Package photos</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            {photoCount
              ? `${photoCount} package photos uploaded.`
              : "Capture package condition evidence."}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {canManage ? (
          <PackagePhotoForm
            action={uploadPackagePhotoAction.bind(null, shipment.id)}
            packages={shipment.packages}
          />
        ) : (
          <p className="text-muted-foreground text-sm">
            Package photos uploaded by the Apex team appear in the package cards.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Timeline({ shipment }: { shipment: ShipmentDetail }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="bg-info/10 text-info grid size-10 place-items-center rounded-md">
          <Clock3 aria-hidden="true" className="size-5" />
        </div>
        <div>
          <CardTitle>Shipment timeline</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Tracking events ordered by occurrence.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <RealtimeShipmentTimeline initialTimeline={shipment.timeline} shipmentId={shipment.id} />
      </CardContent>
    </Card>
  );
}

function Documents({ canManage, shipment }: { canManage: boolean; shipment: ShipmentDetail }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="bg-warning/15 text-warning-foreground grid size-10 place-items-center rounded-md">
          <FileText aria-hidden="true" className="size-5" />
        </div>
        <div>
          <CardTitle>Documents</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">Upload and track shipment files.</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {canManage ? (
          <ShipmentDocumentForm action={uploadShipmentDocumentAction.bind(null, shipment.id)} />
        ) : null}
        <div className="space-y-3">
          {shipment.documents.length ? (
            shipment.documents.map((document) => (
              <div className="border-border rounded-lg border p-3" key={document.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{document.fileName}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {document.documentType} - {formatBytes(document.fileSizeBytes)}
                    </p>
                  </div>
                  <Badge variant={document.verifiedAt ? "success" : "outline"}>
                    {document.verifiedAt ? "Verified" : "Uploaded"}
                  </Badge>
                </div>
                {document.notes ? (
                  <p className="text-muted-foreground mt-2 text-sm leading-6">{document.notes}</p>
                ) : null}
                <p className="text-muted-foreground mt-2 text-xs">
                  Uploaded {formatDate(document.createdAt)}
                  {document.uploadedBy ? ` by ${document.uploadedBy}` : ""}
                </p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No documents uploaded yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function HistoryPanel({ shipment }: { shipment: ShipmentDetail }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="bg-secondary text-secondary-foreground grid size-10 place-items-center rounded-md">
          <History aria-hidden="true" className="size-5" />
        </div>
        <div>
          <CardTitle>Shipment history</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Audit-style activity for this shipment.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {shipment.history.map((item) => (
            <div className="border-border border-b pb-4 last:border-b-0 last:pb-0" key={item.id}>
              <p className="text-sm font-semibold">{item.action}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {formatDate(item.occurredAt)}
                {item.actorName ? ` by ${item.actorName}` : ""}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ShipmentDetailView({
  shipment,
  user,
}: {
  shipment: ShipmentDetail;
  user: AuthSessionUser;
}) {
  const canManage = canManageShipmentWorkspace(user);

  return (
    <div className="space-y-6">
      <ShipmentOverview canManage={canManage} shipment={shipment} />
      <div className="grid gap-6 lg:grid-cols-2">
        <AddressCard address={shipment.origin} title="Origin" />
        <AddressCard address={shipment.destination} title="Destination" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CalendarClock aria-hidden="true" className="text-accent size-5" />
            <CardTitle>Pickup window</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{formatDate(shipment.pickupWindowStart)}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {formatDate(shipment.pickupWindowEnd)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CalendarClock aria-hidden="true" className="text-accent size-5" />
            <CardTitle>Delivery window</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{formatDate(shipment.deliveryWindowStart)}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {formatDate(shipment.deliveryWindowEnd)}
            </p>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2">
          <CardHeader>
            <Box aria-hidden="true" className="text-accent size-5" />
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-6">
              {shipment.notes ?? "No internal notes recorded."}
            </p>
          </CardContent>
        </Card>
      </div>
      <OfficeDetailsCard shipment={shipment} />
      <WeightSummary shipment={shipment} />
      <PackageCards shipment={shipment} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <ShipmentLiveMap snapshot={getTrackingSnapshotFromDetail(shipment)} />
          <Timeline shipment={shipment} />
          <HistoryPanel shipment={shipment} />
        </div>
        <div className="space-y-6">
          <InvoiceSummary canIssue={canManage} invoice={shipment.invoice} />
          {canManage ? (
            <Card>
              <CardHeader>
                <CardTitle>Status update</CardTitle>
              </CardHeader>
              <CardContent>
                <ShipmentStatusForm
                  action={updateShipmentStatusAction.bind(null, shipment.id)}
                  currentStatus={shipment.status}
                />
              </CardContent>
            </Card>
          ) : null}
          <PackagePhotos canManage={canManage} shipment={shipment} />
          <Documents canManage={canManage} shipment={shipment} />
        </div>
      </div>
    </div>
  );
}
