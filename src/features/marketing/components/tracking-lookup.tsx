"use client";

import Link from "next/link";
import type { Route as NextRoute } from "next";
import { useEffect, useState, type FormEvent } from "react";
import {
  Boxes,
  CheckCircle2,
  ChevronRight,
  CirclePause,
  FileText,
  LockKeyhole,
  MapPinned,
  PackageSearch,
  PawPrint,
  Radio,
  Route,
  Truck,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notification } from "@/components/ui/notification";
import { ShipmentLiveMap } from "@/features/shipments/components/shipment-live-map";
import { formatShipmentStatus, formatTrackingEventType } from "@/features/shipments/status-labels";
import type {
  PublicTrackingParty,
  ShipmentAddressView,
  ShipmentTrackingSnapshot,
} from "@/features/shipments/types";

type LookupStatus = "idle" | "loading" | "ready" | "error";

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
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

function formatPetAge(ageMonths: number | null) {
  if (ageMonths === null) {
    return null;
  }

  if (ageMonths < 12) {
    return `${ageMonths} ${ageMonths === 1 ? "month" : "months"}`;
  }

  const years = Math.floor(ageMonths / 12);
  const remainingMonths = ageMonths % 12;
  const yearLabel = `${years} ${years === 1 ? "year" : "years"}`;

  return remainingMonths
    ? `${yearLabel}, ${remainingMonths} ${remainingMonths === 1 ? "month" : "months"}`
    : yearLabel;
}

function formatAddress(address: ShipmentAddressView) {
  const locality = [address.city, address.state, address.postalCode]
    .filter((value): value is string => Boolean(value))
    .join(", ");

  return [address.line1, address.line2, locality, address.countryCode]
    .filter((value): value is string => Boolean(value))
    .join(", ");
}

function statusVariant(status: ShipmentTrackingSnapshot["status"]) {
  if (status === "DELIVERED") {
    return "success";
  }

  if (status === "CANCELLED" || status === "RETURNED") {
    return "danger";
  }

  if (status === "HELD" || status === "PENDING_PICKUP" || status === "DELAYED") {
    return "warning";
  }

  return "accent";
}

function getStatusMessage(status: ShipmentTrackingSnapshot["status"]) {
  const messages = {
    BOOKED: "The shipment is registered and Apex is preparing the next operational step.",
    CANCELLED:
      "Movement has stopped. Contact Apex support with this tracking number for assistance.",
    DELAYED: "The delivery schedule is being adjusted. Review the latest update for the next step.",
    DELIVERED: "Delivery is complete. Keep the receipt and signed delivery records for reference.",
    DRAFT: "The shipment record is being prepared and has not entered active movement.",
    HELD: "Movement is temporarily paused. Review the latest checkpoint for the next step.",
    IN_TRANSIT: "The shipment is moving through the Apex transport network.",
    PENDING_PICKUP: "The shipment is waiting for collection or release from the current facility.",
    PROCESSING: "Apex is preparing handling, routing, or required shipment documentation.",
    READY_FOR_DISPATCH: "The shipment is cleared and waiting for its departure handoff.",
    RETURNED: "The shipment is being returned to the sender. Contact support for the return plan.",
  } satisfies Record<ShipmentTrackingSnapshot["status"], string>;

  return messages[status];
}

function TrackingStatusIcon({ status }: { status: ShipmentTrackingSnapshot["status"] }) {
  if (status === "DELIVERED") {
    return <CheckCircle2 aria-hidden="true" className="size-5" />;
  }

  if (
    status === "HELD" ||
    status === "DELAYED" ||
    status === "CANCELLED" ||
    status === "RETURNED"
  ) {
    return <CirclePause aria-hidden="true" className="size-5" />;
  }

  return <Truck aria-hidden="true" className="size-5" />;
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) {
    return null;
  }

  return (
    <div>
      <dt className="text-muted-foreground text-xs font-semibold uppercase">{label}</dt>
      <dd className="mt-1 font-medium break-words">{value}</dd>
    </div>
  );
}

function PartyCard({
  addressLabel,
  party,
  title,
}: {
  addressLabel: string;
  party: PublicTrackingParty;
  title: string;
}) {
  return (
    <article className="border-border rounded-md border p-4">
      <p className="text-muted-foreground text-xs font-semibold uppercase">{title}</p>
      <dl className="mt-4 grid gap-4 text-sm">
        <Detail label="Name" value={party.name ?? title} />
        <Detail label={addressLabel} value={formatAddress(party.address)} />
        <Detail label="Phone" value={party.phone} />
        <Detail label="Email" value={party.email} />
      </dl>
    </article>
  );
}

function ShipmentParties({ snapshot }: { snapshot: ShipmentTrackingSnapshot }) {
  const details = snapshot.publicDetails;

  if (snapshot.sensitiveDetailsLocked) {
    return (
      <section className="border-border bg-card shadow-panel rounded-lg border p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="bg-accent/15 text-accent grid size-10 shrink-0 place-items-center rounded-md">
            <LockKeyhole aria-hidden="true" className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Recipient details protected</h3>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              Enter the recipient PIN in the tracking form to view contact details, shipment
              contents, pet information, and the printable receipt.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!details) {
    return null;
  }

  const hasTransportDetails = Boolean(
    details.carrier ||
    details.courier ||
    details.carrierReference ||
    details.productName ||
    details.quantity,
  );

  return (
    <section className="border-border bg-card shadow-panel rounded-lg border p-5 sm:p-6">
      <div className="border-border flex items-center gap-3 border-b pb-4">
        <div className="bg-accent/15 text-accent grid size-10 place-items-center rounded-md">
          <UserRound aria-hidden="true" className="size-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Shipment parties and details</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Shipment information provided by Apex operations.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {details.sender ? (
          <PartyCard addressLabel="Pickup address" party={details.sender} title="Sender" />
        ) : null}
        {details.recipient ? (
          <PartyCard addressLabel="Delivery address" party={details.recipient} title="Receiver" />
        ) : null}

        {details.pet ? (
          <article className="border-border rounded-md border p-4 xl:col-span-2">
            <div className="flex items-center gap-2">
              <PawPrint aria-hidden="true" className="text-accent size-5" />
              <h4 className="font-semibold">Pet profile</h4>
            </div>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
              <Detail label="Pet" value={details.pet.name} />
              <Detail label="Species" value={formatEnum(details.pet.species)} />
              <Detail label="Breed" value={details.pet.breed} />
              <Detail label="Color" value={details.pet.color} />
              <Detail label="Sex" value={details.pet.sex} />
              <Detail label="Age" value={formatPetAge(details.pet.ageMonths)} />
              <Detail
                label="Weight"
                value={details.pet.weightLb ? `${details.pet.weightLb} lb` : null}
              />
            </dl>
          </article>
        ) : null}

        {hasTransportDetails ? (
          <article className="border-border rounded-md border p-4">
            <div className="flex items-center gap-2">
              <Truck aria-hidden="true" className="text-accent size-5" />
              <h4 className="font-semibold">Transport record</h4>
            </div>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <Detail label="Carrier" value={details.carrier} />
              <Detail label="Courier" value={details.courier} />
              <Detail label="Carrier reference" value={details.carrierReference} />
              <Detail label="Shipment item" value={details.productName} />
              <Detail label="Quantity" value={details.quantity} />
            </dl>
          </article>
        ) : null}

        {details.consignment ? (
          <article className="border-border rounded-md border p-4">
            <div className="flex items-center gap-2">
              <Boxes aria-hidden="true" className="text-accent size-5" />
              <h4 className="font-semibold">Consignment details</h4>
            </div>
            <div className="mt-4 space-y-3">
              {details.consignment.packages.map((shipmentPackage, index) => (
                <div
                  className="border-border bg-secondary/45 rounded-md border p-3 text-sm"
                  key={`${shipmentPackage.type}-${shipmentPackage.description ?? index}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">Piece {index + 1}</p>
                    <Badge variant="outline">{formatEnum(shipmentPackage.status)}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-2 leading-6">
                    {shipmentPackage.description ?? formatEnum(shipmentPackage.type)}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatEnum(shipmentPackage.type)}
                    {shipmentPackage.weightLb ? ` | ${shipmentPackage.weightLb} lb` : null}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ) : null}

        {details.freight ? (
          <article className="border-border rounded-md border p-4 xl:col-span-2">
            <div className="flex items-center gap-2">
              <Route aria-hidden="true" className="text-accent size-5" />
              <h4 className="font-semibold">Freight details</h4>
            </div>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
              <Detail label="Freight type" value={formatEnum(details.freight.freightType)} />
              <Detail label="Route" value={details.freight.routeName} />
              <Detail label="Container" value={details.freight.containerNumber} />
              <Detail
                label="Pallets"
                value={
                  details.freight.palletCount === null ? null : String(details.freight.palletCount)
                }
              />
              <Detail label="Origin terminal" value={details.freight.originTerminal} />
              <Detail label="Destination terminal" value={details.freight.destinationTerminal} />
              <Detail label="Freight ETA" value={formatDate(details.freight.etaAt)} />
              <Detail label="Commodity" value={details.freight.commodityDescription} />
            </dl>
          </article>
        ) : null}
      </div>
    </section>
  );
}

function ShipmentTimeline({ snapshot }: { snapshot: ShipmentTrackingSnapshot }) {
  return (
    <section className="border-border bg-card shadow-panel rounded-lg border p-5 sm:p-6">
      <div className="border-border border-b pb-4">
        <h3 className="text-lg font-semibold">Shipment updates</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Published checkpoint history, newest first.
        </p>
      </div>
      <div className="mt-5 space-y-1">
        {snapshot.timeline.length ? (
          snapshot.timeline.map((trackingEvent, index) => (
            <div className="flex gap-4" key={trackingEvent.id}>
              <div className="flex flex-col items-center">
                <span className="bg-accent mt-1 size-3 rounded-full" />
                {index < snapshot.timeline.length - 1 ? (
                  <span className="bg-border mt-2 h-full min-h-14 w-px" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1 pb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">
                    {trackingEvent.shipmentStatus
                      ? formatShipmentStatus(trackingEvent.shipmentStatus)
                      : formatTrackingEventType(trackingEvent.eventType)}
                  </p>
                  {trackingEvent.shipmentStatus ? (
                    <Badge variant="outline">
                      {formatShipmentStatus(trackingEvent.shipmentStatus)}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {formatDate(trackingEvent.occurredAt)}
                </p>
                {trackingEvent.currentLocation ? (
                  <p className="mt-2 flex items-start gap-2 text-sm font-medium">
                    <MapPinned aria-hidden="true" className="text-accent mt-0.5 size-4 shrink-0" />
                    {trackingEvent.currentLocation}
                  </p>
                ) : null}
                {trackingEvent.message ? (
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    {trackingEvent.message}
                  </p>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">
            No shipment milestones have been published yet.
          </p>
        )}
      </div>
    </section>
  );
}

export function TrackingLookup() {
  const [connectionState, setConnectionState] = useState<"live" | "reconnecting" | "idle">("idle");
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [recipientPin, setRecipientPin] = useState("");
  const [snapshot, setSnapshot] = useState<ShipmentTrackingSnapshot | null>(null);
  const [status, setStatus] = useState<LookupStatus>("idle");
  const [trackedReference, setTrackedReference] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedReference = reference.trim();

    if (!normalizedReference) {
      setError("Enter a shipment tracking or reference number.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError(null);
    setConnectionState("idle");

    const query = recipientPin.trim() ? `?pin=${encodeURIComponent(recipientPin.trim())}` : "";
    const response = await fetch(
      `/api/tracking/${encodeURIComponent(normalizedReference)}${query}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      setSnapshot(null);
      setTrackedReference("");
      setStatus("error");
      setError(payload?.message ?? "We could not find a shipment for that reference.");
      return;
    }

    const payload = (await response.json()) as {
      pinError?: string | null;
      snapshot: ShipmentTrackingSnapshot;
    };
    setSnapshot(payload.snapshot);
    setTrackedReference(normalizedReference);
    setStatus("ready");
    setError(payload.pinError ?? null);

    if (!payload.pinError) {
      setRecipientPin("");
    }
  }

  useEffect(() => {
    if (!trackedReference) {
      return undefined;
    }

    const source = new EventSource(`/api/tracking/${encodeURIComponent(trackedReference)}/stream`);

    source.addEventListener("open", () => setConnectionState("live"));
    source.addEventListener("snapshot", (event) => {
      const nextSnapshot = JSON.parse((event as MessageEvent).data) as ShipmentTrackingSnapshot;
      setSnapshot(nextSnapshot);
      setConnectionState("live");
    });
    source.addEventListener("error", () => setConnectionState("reconnecting"));

    return () => source.close();
  }, [trackedReference]);

  const latestEvent = snapshot?.timeline[0] ?? null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <aside className="border-border bg-card shadow-panel rounded-lg border p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.7fr)] lg:items-end">
          <div>
            <div className="flex items-start gap-3">
              <div className="bg-accent/15 text-accent grid size-11 shrink-0 place-items-center rounded-md">
                <PackageSearch aria-hidden="true" className="size-5" />
              </div>
              <div>
                <p className="text-accent text-xs font-semibold uppercase">Shipment tracking</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">
                  Track your shipment
                </h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
                  Enter the tracking number from an Apex notice, invoice, receipt, or dispatch
                  email.
                </p>
              </div>
            </div>
          </div>
          <div>
            <form
              className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(180px,.55fr)_auto]"
              onSubmit={handleSubmit}
            >
              <div className="space-y-2">
                <Label htmlFor="tracking-reference">Tracking reference</Label>
                <Input
                  autoCapitalize="characters"
                  autoComplete="off"
                  id="tracking-reference"
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="AGL-202607-ABC12345"
                  spellCheck={false}
                  value={reference}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tracking-pin">Recipient PIN (if provided)</Label>
                <Input
                  autoComplete="off"
                  id="tracking-pin"
                  inputMode="numeric"
                  maxLength={12}
                  onChange={(event) => setRecipientPin(event.target.value)}
                  pattern="[0-9]{4,12}"
                  placeholder="Optional PIN"
                  type="password"
                  value={recipientPin}
                />
              </div>
              <Button
                className="self-end"
                disabled={status === "loading"}
                type="submit"
                variant="accent"
              >
                <PackageSearch aria-hidden="true" />
                {status === "loading" ? "Checking..." : "Track"}
              </Button>
            </form>
            {error ? (
              <Notification className="mt-4" title="Tracking unavailable" variant="danger">
                {error}
              </Notification>
            ) : null}
          </div>
        </div>
      </aside>

      <div aria-live="polite" className="mt-6 min-w-0">
        {snapshot ? (
          <div className="flex flex-col gap-6">
            <section className="border-border bg-card shadow-panel rounded-lg border p-5 sm:p-6">
              <div className="border-border flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs font-semibold uppercase">
                    Tracking number
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-normal break-all sm:text-3xl">
                    {snapshot.shipmentNumber}
                  </h2>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Last updated {formatDate(snapshot.updatedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={statusVariant(snapshot.status)}>
                    {formatShipmentStatus(snapshot.status)}
                  </Badge>
                  <Badge variant={connectionState === "live" ? "success" : "outline"}>
                    {connectionState === "live" ? (
                      <Radio aria-hidden="true" className="size-3.5" />
                    ) : null}
                    {connectionState === "live"
                      ? "Updates connected"
                      : connectionState === "reconnecting"
                        ? "Reconnecting"
                        : "Connecting"}
                  </Badge>
                  {snapshot.sensitiveDetailsLocked ? (
                    <Badge variant="outline">
                      <LockKeyhole aria-hidden="true" className="size-3.5" />
                      PIN required for receipt
                    </Badge>
                  ) : (
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={
                          `/tracking/${encodeURIComponent(snapshot.shipmentNumber)}/receipt` as NextRoute
                        }
                      >
                        <FileText aria-hidden="true" />
                        View receipt
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              <div className="bg-secondary text-secondary-foreground mt-5 flex items-start gap-3 rounded-md p-4">
                <TrackingStatusIcon status={snapshot.status} />
                <div>
                  <p className="font-semibold">{formatShipmentStatus(snapshot.status)}</p>
                  <p className="mt-1 text-sm leading-6">{getStatusMessage(snapshot.status)}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="border-border rounded-md border p-4">
                  <p className="text-muted-foreground text-xs font-semibold uppercase">
                    Estimated delivery
                  </p>
                  <p className="mt-2 text-lg font-semibold">{formatDeliveryWindow(snapshot)}</p>
                </div>
                <div className="border-border rounded-md border p-4">
                  <p className="text-muted-foreground text-xs font-semibold uppercase">
                    Current location
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    {latestEvent?.currentLocation ?? "Awaiting the next checkpoint"}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {latestEvent
                      ? formatDate(latestEvent.occurredAt)
                      : "No checkpoint published yet"}
                  </p>
                </div>
                <div className="border-border rounded-md border p-4">
                  <p className="text-muted-foreground text-xs font-semibold uppercase">
                    Latest update
                  </p>
                  <p className="mt-2 font-semibold">
                    {latestEvent
                      ? formatTrackingEventType(latestEvent.eventType)
                      : "Shipment record created"}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm leading-6">
                    {latestEvent?.message ?? getStatusMessage(snapshot.status)}
                  </p>
                </div>
              </div>
            </section>

            <ShipmentParties snapshot={snapshot} />

            <ShipmentLiveMap connectionState={connectionState} snapshot={snapshot} />

            <section className="border-border bg-card shadow-panel rounded-lg border p-5 sm:p-6">
              <div className="border-border flex flex-wrap items-end justify-between gap-3 border-b pb-4">
                <div>
                  <h3 className="text-lg font-semibold">Route and shipment record</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Origin, latest checkpoint, and final destination.
                  </p>
                </div>
                <p className="text-muted-foreground text-sm">
                  {snapshot.timeline.length} published checkpoint
                  {snapshot.timeline.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center">
                <div className="border-border rounded-md border p-4">
                  <p className="text-muted-foreground text-xs font-semibold uppercase">Origin</p>
                  <p className="mt-2 font-semibold">
                    {snapshot.originCity}, {snapshot.originCountryCode}
                  </p>
                </div>
                <ChevronRight
                  aria-hidden="true"
                  className="text-accent mx-auto hidden size-5 lg:block"
                />
                <div className="border-accent/40 bg-accent/10 rounded-md border p-4">
                  <p className="text-xs font-semibold uppercase">Latest location</p>
                  <p className="mt-2 font-semibold">
                    {latestEvent?.currentLocation ?? "Awaiting location update"}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {latestEvent
                      ? formatDate(latestEvent.occurredAt)
                      : "No checkpoint published yet"}
                  </p>
                </div>
                <ChevronRight
                  aria-hidden="true"
                  className="text-accent mx-auto hidden size-5 lg:block"
                />
                <div className="border-border rounded-md border p-4">
                  <p className="text-muted-foreground text-xs font-semibold uppercase">
                    Destination
                  </p>
                  <p className="mt-2 font-semibold">
                    {snapshot.destinationCity}, {snapshot.destinationCountryCode}
                  </p>
                </div>
              </div>
              <dl className="border-border bg-border mt-5 grid gap-px overflow-hidden rounded-md border sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Service", value: snapshot.serviceLevel ?? "Standard managed service" },
                  { label: "Transport mode", value: formatEnum(snapshot.mode) },
                  {
                    label: "Pieces",
                    value: snapshot.packageCount
                      ? `${snapshot.packageCount} piece${snapshot.packageCount === 1 ? "" : "s"}`
                      : "Not recorded",
                  },
                  {
                    label: "Recorded weight",
                    value: snapshot.totalWeightLb ? `${snapshot.totalWeightLb} lb` : "Not recorded",
                  },
                ].map((item) => (
                  <div className="bg-background p-4" key={item.label}>
                    <dt className="text-muted-foreground text-xs font-semibold uppercase">
                      {item.label}
                    </dt>
                    <dd className="mt-2 text-sm font-semibold">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <ShipmentTimeline snapshot={snapshot} />
          </div>
        ) : (
          <section className="border-border bg-card shadow-panel grid min-h-[420px] place-items-center rounded-lg border p-6 text-center">
            <div className="max-w-md">
              <div className="bg-accent/15 text-accent mx-auto grid size-14 place-items-center rounded-md">
                <PackageSearch aria-hidden="true" className="size-7" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-normal">
                Shipment details appear here
              </h2>
              <p className="text-muted-foreground mt-3 text-sm leading-6">
                Use the tracking number printed on the Apex shipment notice, invoice, receipt, or
                email.
              </p>
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
