"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Boxes,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CirclePause,
  Clock3,
  LocateFixed,
  MapPinned,
  PackageSearch,
  PawPrint,
  Radio,
  Route,
  Scale,
  ShieldCheck,
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
import type { ShipmentTrackingSnapshot } from "@/features/shipments/types";

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

function formatPickupWindow(snapshot: ShipmentTrackingSnapshot) {
  if (!snapshot.pickupWindowStart && !snapshot.pickupWindowEnd) {
    return "Not scheduled";
  }

  if (!snapshot.pickupWindowEnd) {
    return formatDate(snapshot.pickupWindowStart);
  }

  if (!snapshot.pickupWindowStart) {
    return `By ${formatDate(snapshot.pickupWindowEnd)}`;
  }

  return `${formatDate(snapshot.pickupWindowStart)} - ${formatDate(snapshot.pickupWindowEnd)}`;
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

function statusVariant(status: ShipmentTrackingSnapshot["status"]) {
  if (status === "DELIVERED") {
    return "success";
  }

  if (status === "CANCELLED" || status === "RETURNED") {
    return "danger";
  }

  if (status === "HELD" || status === "PENDING_PICKUP") {
    return "warning";
  }

  return "accent";
}

function getStatusMessage(status: ShipmentTrackingSnapshot["status"]) {
  const messages = {
    BOOKED: "The shipment is registered and Apex is preparing the next operational step.",
    CANCELLED:
      "Movement has stopped. Contact Apex support with this tracking number for assistance.",
    DELIVERED: "Delivery is complete. Keep the receipt and signed delivery records for reference.",
    DRAFT: "The shipment record is being prepared and has not entered active movement.",
    HELD: "Movement is temporarily paused. Review the latest checkpoint note for the reason and next step.",
    IN_TRANSIT: "The shipment is moving through the Apex transport network.",
    PENDING_PICKUP: "The shipment is waiting for collection or release from the current facility.",
    RETURNED: "The shipment is being returned to the sender. Contact support for the return plan.",
  } satisfies Record<ShipmentTrackingSnapshot["status"], string>;

  return messages[status];
}

function getNextStep(status: ShipmentTrackingSnapshot["status"]) {
  const nextSteps = {
    BOOKED: "Apex is confirming the next collection or facility handoff.",
    CANCELLED: "No further movement is planned for this shipment.",
    DELIVERED: "Delivery has been completed and the record is retained for reference.",
    DRAFT: "The shipment is still being prepared by Apex operations.",
    HELD: "Apex operations is reviewing the hold before movement can continue.",
    IN_TRANSIT: "The next update will be published when the shipment reaches another checkpoint.",
    PENDING_PICKUP: "The shipment is awaiting collection or release at the current location.",
    RETURNED: "The return journey is being coordinated with the sender.",
  } satisfies Record<ShipmentTrackingSnapshot["status"], string>;

  return nextSteps[status];
}

function TrackingStatusIcon({ status }: { status: ShipmentTrackingSnapshot["status"] }) {
  if (status === "DELIVERED") {
    return <CheckCircle2 aria-hidden="true" className="size-5" />;
  }

  if (status === "HELD" || status === "CANCELLED" || status === "RETURNED") {
    return <CirclePause aria-hidden="true" className="size-5" />;
  }

  return <Truck aria-hidden="true" className="size-5" />;
}

export function TrackingLookup() {
  const [connectionState, setConnectionState] = useState<"live" | "reconnecting" | "idle">("idle");
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState("");
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

    const response = await fetch(`/api/tracking/${encodeURIComponent(normalizedReference)}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      setSnapshot(null);
      setTrackedReference("");
      setStatus("error");
      setError(payload?.message ?? "We could not find a shipment for that reference.");
      return;
    }

    const payload = (await response.json()) as { snapshot: ShipmentTrackingSnapshot };
    setSnapshot(payload.snapshot);
    setTrackedReference(normalizedReference);
    setStatus("ready");
  }

  useEffect(() => {
    if (!trackedReference) {
      return undefined;
    }

    const source = new EventSource(`/api/tracking/${encodeURIComponent(trackedReference)}/stream`);

    source.addEventListener("open", () => {
      setConnectionState("live");
    });
    source.addEventListener("snapshot", (event) => {
      const nextSnapshot = JSON.parse((event as MessageEvent).data) as ShipmentTrackingSnapshot;
      setSnapshot(nextSnapshot);
      setConnectionState("live");
    });
    source.addEventListener("error", () => {
      setConnectionState("reconnecting");
    });

    return () => {
      source.close();
    };
  }, [trackedReference]);

  const latestEvent = snapshot?.timeline[0] ?? null;
  const nextStep = snapshot ? getNextStep(snapshot.status) : null;

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
      <aside className="border-border bg-card shadow-panel rounded-lg border p-5 lg:sticky lg:top-24">
        <div className="flex items-start gap-3">
          <div className="bg-accent/15 text-accent grid size-11 shrink-0 place-items-center rounded-md">
            <PackageSearch aria-hidden="true" className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Find a shipment</h2>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              Enter the exact Apex tracking number or carrier reference shown on your document.
            </p>
          </div>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
          <Button className="w-full" disabled={status === "loading"} type="submit" variant="accent">
            <PackageSearch aria-hidden="true" />
            {status === "loading" ? "Checking shipment..." : "Track shipment"}
          </Button>
        </form>
        {error ? (
          <Notification className="mt-5" title="Tracking unavailable" variant="danger">
            {error}
          </Notification>
        ) : null}
        <div className="border-border mt-6 border-t pt-5">
          <p className="text-sm font-semibold">Public tracking includes</p>
          <ul className="text-muted-foreground mt-3 space-y-2 text-sm leading-6">
            <li className="flex gap-2">
              <ShieldCheck aria-hidden="true" className="text-accent mt-1 size-4 shrink-0" />
              Current agency status and latest checkpoint
            </li>
            <li className="flex gap-2">
              <ShieldCheck aria-hidden="true" className="text-accent mt-1 size-4 shrink-0" />
              Estimated delivery and service lane
            </li>
            <li className="flex gap-2">
              <ShieldCheck aria-hidden="true" className="text-accent mt-1 size-4 shrink-0" />
              Verified map position when GPS is supplied
            </li>
            <li className="flex gap-2">
              <ShieldCheck aria-hidden="true" className="text-accent mt-1 size-4 shrink-0" />
              Shipment parties, consignment details, and basic pet or freight information
            </li>
          </ul>
        </div>
      </aside>

      <div aria-live="polite" className="min-w-0">
        {snapshot ? (
          <div className="space-y-6">
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
                    Last synchronized {formatDate(snapshot.updatedAt)}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Registered {formatDate(snapshot.createdAt)}
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
                      ? "Live updates"
                      : connectionState === "reconnecting"
                        ? "Reconnecting"
                        : "Connecting"}
                  </Badge>
                </div>
              </div>

              <div className="bg-secondary text-secondary-foreground mt-5 flex items-start gap-3 rounded-md p-4">
                <TrackingStatusIcon status={snapshot.status} />
                <div>
                  <p className="font-semibold">{formatShipmentStatus(snapshot.status)}</p>
                  <p className="mt-1 text-sm leading-6">{getStatusMessage(snapshot.status)}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="border-border rounded-md border p-4">
                  <div className="flex items-start gap-3">
                    <MapPinned aria-hidden="true" className="text-accent mt-0.5 size-5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase">Latest operational update</p>
                      <p className="mt-2 font-semibold">
                        {latestEvent
                          ? formatTrackingEventType(latestEvent.eventType)
                          : "Shipment record created"}
                      </p>
                      <p className="text-muted-foreground mt-1 text-sm leading-6">
                        {latestEvent?.message ?? getStatusMessage(snapshot.status)}
                      </p>
                      <p className="text-muted-foreground mt-3 text-xs">
                        {latestEvent?.currentLocation ?? "Location update pending"}
                        {latestEvent ? ` · ${formatDate(latestEvent.occurredAt)}` : null}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="border-border rounded-md border p-4">
                  <div className="flex items-start gap-3">
                    <Clock3 aria-hidden="true" className="text-accent mt-0.5 size-5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold uppercase">What happens next</p>
                      <p className="text-muted-foreground mt-2 text-sm leading-6">{nextStep}</p>
                    </div>
                  </div>
                </div>
              </div>

              <dl className="border-border bg-border mt-5 grid gap-px overflow-hidden rounded-md border sm:grid-cols-2 xl:grid-cols-3">
                {[
                  {
                    icon: Route,
                    label: "Route",
                    value: `${snapshot.originCity}, ${snapshot.originCountryCode} to ${snapshot.destinationCity}, ${snapshot.destinationCountryCode}`,
                  },
                  {
                    icon: LocateFixed,
                    label: "Current location",
                    value: latestEvent?.currentLocation ?? "Awaiting the next checkpoint",
                  },
                  {
                    icon: CalendarClock,
                    label: "Estimated delivery",
                    value: formatDeliveryWindow(snapshot),
                  },
                  {
                    icon: CalendarClock,
                    label: "Pickup window",
                    value: formatPickupWindow(snapshot),
                  },
                  {
                    icon: Truck,
                    label: "Transport mode",
                    value: formatEnum(snapshot.mode),
                  },
                  {
                    icon: ShieldCheck,
                    label: "Service",
                    value: snapshot.serviceLevel ?? "Standard managed service",
                  },
                  {
                    icon: ShieldCheck,
                    label: "Priority",
                    value: formatEnum(snapshot.priority),
                  },
                  {
                    icon: CalendarClock,
                    label: "Dispatch time",
                    value: formatDate(snapshot.dispatchedAt),
                  },
                  {
                    icon: CheckCircle2,
                    label: "Delivered time",
                    value: formatDate(snapshot.deliveredAt),
                  },
                  {
                    icon: Clock3,
                    label: "Latest checkpoint",
                    value: latestEvent ? formatDate(latestEvent.occurredAt) : "No checkpoint yet",
                  },
                  {
                    icon: Boxes,
                    label: "Pieces recorded",
                    value: snapshot.packageCount
                      ? `${snapshot.packageCount} piece${snapshot.packageCount === 1 ? "" : "s"}`
                      : "Not recorded",
                  },
                  {
                    icon: Scale,
                    label: "Recorded weight",
                    value: snapshot.totalWeightLb ? `${snapshot.totalWeightLb} lb` : "Not recorded",
                  },
                ].map((item) => (
                  <div className="bg-background p-4" key={item.label}>
                    <item.icon aria-hidden="true" className="text-accent size-5" />
                    <dt className="mt-3 text-xs font-semibold uppercase">{item.label}</dt>
                    <dd className="text-muted-foreground mt-1 text-sm leading-6">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="border-border bg-card shadow-panel rounded-lg border p-5 sm:p-6">
              <div className="border-border flex flex-wrap items-end justify-between gap-3 border-b pb-4">
                <div>
                  <h3 className="text-lg font-semibold">Journey overview</h3>
                  <p className="text-muted-foreground mt-1 text-sm leading-6">
                    The route is summarized from the shipment record and the latest verified
                    checkpoint.
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
                  <p className="text-muted-foreground mt-1 text-sm">Shipment origin</p>
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
                  <p className="text-muted-foreground mt-1 text-sm">Final delivery location</p>
                </div>
              </div>
            </section>

            <ShipmentLiveMap connectionState={connectionState} snapshot={snapshot} />

            {snapshot.publicDetails ? (
              <section className="border-border bg-card shadow-panel rounded-lg border p-5 sm:p-6">
                <div className="border-border border-b pb-4">
                  <h3 className="text-lg font-semibold">Shipment details</h3>
                  <p className="text-muted-foreground mt-1 text-sm leading-6">
                    A valid tracking reference opens this operational record without a customer
                    account.
                  </p>
                </div>
                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  {snapshot.publicDetails.carrier ||
                  snapshot.publicDetails.courier ||
                  snapshot.publicDetails.carrierReference ||
                  snapshot.publicDetails.productName ||
                  snapshot.publicDetails.quantity ? (
                    <article className="border-border rounded-md border p-4">
                      <div className="flex items-center gap-2">
                        <Truck aria-hidden="true" className="text-accent size-5" />
                        <h4 className="font-semibold">Transport record</h4>
                      </div>
                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        {snapshot.publicDetails.carrier ? (
                          <div>
                            <dt className="text-muted-foreground text-xs font-semibold uppercase">
                              Carrier
                            </dt>
                            <dd className="mt-1 font-medium">{snapshot.publicDetails.carrier}</dd>
                          </div>
                        ) : null}
                        {snapshot.publicDetails.courier ? (
                          <div>
                            <dt className="text-muted-foreground text-xs font-semibold uppercase">
                              Courier
                            </dt>
                            <dd className="mt-1 font-medium">{snapshot.publicDetails.courier}</dd>
                          </div>
                        ) : null}
                        {snapshot.publicDetails.carrierReference ? (
                          <div>
                            <dt className="text-muted-foreground text-xs font-semibold uppercase">
                              Carrier reference
                            </dt>
                            <dd className="mt-1 font-medium break-all">
                              {snapshot.publicDetails.carrierReference}
                            </dd>
                          </div>
                        ) : null}
                        {snapshot.publicDetails.productName ? (
                          <div>
                            <dt className="text-muted-foreground text-xs font-semibold uppercase">
                              Shipment item
                            </dt>
                            <dd className="mt-1 font-medium">
                              {snapshot.publicDetails.productName}
                            </dd>
                          </div>
                        ) : null}
                        {snapshot.publicDetails.quantity ? (
                          <div>
                            <dt className="text-muted-foreground text-xs font-semibold uppercase">
                              Quantity
                            </dt>
                            <dd className="mt-1 font-medium">{snapshot.publicDetails.quantity}</dd>
                          </div>
                        ) : null}
                      </dl>
                    </article>
                  ) : null}

                  {snapshot.publicDetails.senderName || snapshot.publicDetails.recipientName ? (
                    <article className="border-border rounded-md border p-4">
                      <div className="flex items-center gap-2">
                        <UserRound aria-hidden="true" className="text-accent size-5" />
                        <h4 className="font-semibold">Shipment parties</h4>
                      </div>
                      <dl className="mt-4 grid gap-3 text-sm">
                        {snapshot.publicDetails.senderName ? (
                          <div>
                            <dt className="text-muted-foreground text-xs font-semibold uppercase">
                              Sender
                            </dt>
                            <dd className="mt-1 font-medium">
                              {snapshot.publicDetails.senderName}
                            </dd>
                          </div>
                        ) : null}
                        {snapshot.publicDetails.recipientName ? (
                          <div>
                            <dt className="text-muted-foreground text-xs font-semibold uppercase">
                              Recipient
                            </dt>
                            <dd className="mt-1 font-medium">
                              {snapshot.publicDetails.recipientName}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    </article>
                  ) : null}

                  {snapshot.publicDetails.consignment ? (
                    <article className="border-border rounded-md border p-4">
                      <div className="flex items-center gap-2">
                        <Boxes aria-hidden="true" className="text-accent size-5" />
                        <h4 className="font-semibold">Consignment details</h4>
                      </div>
                      <div className="mt-4 space-y-3">
                        {snapshot.publicDetails.consignment.packages.map(
                          (shipmentPackage, index) => (
                            <div
                              className="border-border bg-secondary/45 rounded-md border p-3 text-sm"
                              key={`${shipmentPackage.type}-${shipmentPackage.description ?? index}`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="font-semibold">Piece {index + 1}</p>
                                <Badge variant="outline">
                                  {formatEnum(shipmentPackage.status)}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground mt-2 leading-6">
                                {shipmentPackage.description ?? formatEnum(shipmentPackage.type)}
                              </p>
                              <p className="text-muted-foreground mt-1 text-xs">
                                {formatEnum(shipmentPackage.type)}
                                {shipmentPackage.weightLb
                                  ? ` · ${shipmentPackage.weightLb} lb`
                                  : null}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </article>
                  ) : null}

                  {snapshot.publicDetails.pet ? (
                    <article className="border-border rounded-md border p-4">
                      <div className="flex items-center gap-2">
                        <PawPrint aria-hidden="true" className="text-accent size-5" />
                        <h4 className="font-semibold">Pet profile</h4>
                      </div>
                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-muted-foreground text-xs font-semibold uppercase">
                            Pet
                          </dt>
                          <dd className="mt-1 font-medium">{snapshot.publicDetails.pet.name}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground text-xs font-semibold uppercase">
                            Species
                          </dt>
                          <dd className="mt-1 font-medium">
                            {formatEnum(snapshot.publicDetails.pet.species)}
                          </dd>
                        </div>
                        {snapshot.publicDetails.pet.breed ? (
                          <div>
                            <dt className="text-muted-foreground text-xs font-semibold uppercase">
                              Breed
                            </dt>
                            <dd className="mt-1 font-medium">{snapshot.publicDetails.pet.breed}</dd>
                          </div>
                        ) : null}
                        {snapshot.publicDetails.pet.color ? (
                          <div>
                            <dt className="text-muted-foreground text-xs font-semibold uppercase">
                              Color
                            </dt>
                            <dd className="mt-1 font-medium">{snapshot.publicDetails.pet.color}</dd>
                          </div>
                        ) : null}
                        {snapshot.publicDetails.pet.sex ? (
                          <div>
                            <dt className="text-muted-foreground text-xs font-semibold uppercase">
                              Sex
                            </dt>
                            <dd className="mt-1 font-medium">{snapshot.publicDetails.pet.sex}</dd>
                          </div>
                        ) : null}
                        {formatPetAge(snapshot.publicDetails.pet.ageMonths) ? (
                          <div>
                            <dt className="text-muted-foreground text-xs font-semibold uppercase">
                              Age
                            </dt>
                            <dd className="mt-1 font-medium">
                              {formatPetAge(snapshot.publicDetails.pet.ageMonths)}
                            </dd>
                          </div>
                        ) : null}
                        {snapshot.publicDetails.pet.weightLb ? (
                          <div>
                            <dt className="text-muted-foreground text-xs font-semibold uppercase">
                              Weight
                            </dt>
                            <dd className="mt-1 font-medium">
                              {snapshot.publicDetails.pet.weightLb} lb
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    </article>
                  ) : null}

                  {snapshot.publicDetails.freight ? (
                    <article className="border-border rounded-md border p-4">
                      <div className="flex items-center gap-2">
                        <Route aria-hidden="true" className="text-accent size-5" />
                        <h4 className="font-semibold">Freight details</h4>
                      </div>
                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-muted-foreground text-xs font-semibold uppercase">
                            Freight type
                          </dt>
                          <dd className="mt-1 font-medium">
                            {formatEnum(snapshot.publicDetails.freight.freightType)}
                          </dd>
                        </div>
                        {snapshot.publicDetails.freight.routeName ? (
                          <div>
                            <dt className="text-muted-foreground text-xs font-semibold uppercase">
                              Route
                            </dt>
                            <dd className="mt-1 font-medium">
                              {snapshot.publicDetails.freight.routeName}
                            </dd>
                          </div>
                        ) : null}
                        {snapshot.publicDetails.freight.containerNumber ? (
                          <div>
                            <dt className="text-muted-foreground text-xs font-semibold uppercase">
                              Container
                            </dt>
                            <dd className="mt-1 font-medium break-all">
                              {snapshot.publicDetails.freight.containerNumber}
                            </dd>
                          </div>
                        ) : null}
                        {snapshot.publicDetails.freight.palletCount !== null ? (
                          <div>
                            <dt className="text-muted-foreground text-xs font-semibold uppercase">
                              Pallets
                            </dt>
                            <dd className="mt-1 font-medium">
                              {snapshot.publicDetails.freight.palletCount}
                            </dd>
                          </div>
                        ) : null}
                        {snapshot.publicDetails.freight.originTerminal ? (
                          <div>
                            <dt className="text-muted-foreground text-xs font-semibold uppercase">
                              Origin terminal
                            </dt>
                            <dd className="mt-1 font-medium">
                              {snapshot.publicDetails.freight.originTerminal}
                            </dd>
                          </div>
                        ) : null}
                        {snapshot.publicDetails.freight.destinationTerminal ? (
                          <div>
                            <dt className="text-muted-foreground text-xs font-semibold uppercase">
                              Destination terminal
                            </dt>
                            <dd className="mt-1 font-medium">
                              {snapshot.publicDetails.freight.destinationTerminal}
                            </dd>
                          </div>
                        ) : null}
                        {snapshot.publicDetails.freight.etaAt ? (
                          <div>
                            <dt className="text-muted-foreground text-xs font-semibold uppercase">
                              Freight ETA
                            </dt>
                            <dd className="mt-1 font-medium">
                              {formatDate(snapshot.publicDetails.freight.etaAt)}
                            </dd>
                          </div>
                        ) : null}
                        {snapshot.publicDetails.freight.commodityDescription ? (
                          <div className="sm:col-span-2">
                            <dt className="text-muted-foreground text-xs font-semibold uppercase">
                              Commodity
                            </dt>
                            <dd className="mt-1 font-medium">
                              {snapshot.publicDetails.freight.commodityDescription}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    </article>
                  ) : null}
                </div>
                <p className="text-muted-foreground mt-5 text-xs leading-5">
                  Public tracking is available without an account. Contact information, street
                  addresses, payment details, health records, and shipment documents remain private.
                </p>
              </section>
            ) : null}

            <section className="border-border bg-card shadow-panel rounded-lg border p-5 sm:p-6">
              <div className="border-border border-b pb-4">
                <h3 className="text-lg font-semibold">Shipment progress</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Every published checkpoint is retained in chronological order.
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
                            {formatTrackingEventType(trackingEvent.eventType)}
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
                            <MapPinned
                              aria-hidden="true"
                              className="text-accent mt-0.5 size-4 shrink-0"
                            />
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
                  <p className="text-muted-foreground text-sm">No shipment milestones yet.</p>
                )}
              </div>
            </section>
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
                email. An account is not required for public tracking.
              </p>
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
