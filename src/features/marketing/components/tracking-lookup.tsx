"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Clock3, MapPinned, PackageSearch, Route } from "lucide-react";

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
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="border-border bg-card shadow-panel rounded-lg border p-5">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="tracking-reference">Tracking reference</Label>
            <Input
              id="tracking-reference"
              onChange={(event) => setReference(event.target.value)}
              placeholder="AGL-202606-ABC12345"
              value={reference}
            />
          </div>
          <Button className="w-full" disabled={status === "loading"} type="submit" variant="accent">
            <PackageSearch aria-hidden="true" />
            {status === "loading" ? "Checking..." : "Track shipment"}
          </Button>
        </form>
        {error ? (
          <Notification className="mt-5" title="Tracking unavailable" variant="danger">
            {error}
          </Notification>
        ) : null}
        {snapshot ? (
          <Notification className="mt-5" title="Tracking active" variant="success">
            Updates appear automatically when Apex receives a new shipment milestone.
          </Notification>
        ) : null}
      </div>

      <div className="border-border bg-card shadow-panel rounded-lg border p-5">
        <div className="border-border flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          <div>
            <p className="text-muted-foreground text-sm">Reference</p>
            <h2 className="text-2xl font-semibold tracking-normal">
              {snapshot?.shipmentNumber ?? "Enter a tracking reference"}
            </h2>
          </div>
          {snapshot ? (
            <div className="flex flex-wrap gap-2">
              <Badge variant={statusVariant(snapshot.status)}>
                {formatShipmentStatus(snapshot.status)}
              </Badge>
              <Badge variant={connectionState === "live" ? "success" : "outline"}>
                {connectionState === "live" ? "Live" : "Waiting"}
              </Badge>
            </div>
          ) : (
            <Badge variant="outline">Ready</Badge>
          )}
        </div>

        {snapshot ? (
          <div className="mt-5 space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  icon: Route,
                  label: "Lane",
                  value: `${snapshot.originCity} to ${snapshot.destinationCity}`,
                },
                {
                  icon: Clock3,
                  label: "Delivery",
                  value: formatDate(snapshot.deliveryWindowStart),
                },
                {
                  icon: PackageSearch,
                  label: "Latest",
                  value: latestEvent ? formatTrackingEventType(latestEvent.eventType) : "No events",
                },
                {
                  icon: MapPinned,
                  label: "Location",
                  value: latestEvent?.currentLocation ?? "Awaiting next manual update",
                },
              ].map((item) => (
                <div className="border-border bg-background rounded-md border p-4" key={item.label}>
                  <item.icon aria-hidden="true" className="text-accent size-5" />
                  <p className="mt-3 font-semibold">{item.label}</p>
                  <p className="text-muted-foreground mt-1 text-sm leading-6">{item.value}</p>
                </div>
              ))}
            </div>
            <ShipmentLiveMap snapshot={snapshot} />
            <div className="space-y-4">
              {snapshot.timeline.length ? (
                snapshot.timeline.map((event) => (
                  <div className="flex gap-4" key={event.id}>
                    <div className="flex flex-col items-center">
                      <span className="bg-accent size-3 rounded-full" />
                      <span className="bg-border mt-2 h-full w-px" />
                    </div>
                    <div className="min-w-0 flex-1 pb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{formatTrackingEventType(event.eventType)}</p>
                        {event.shipmentStatus ? (
                          <Badge variant="outline">
                            {formatShipmentStatus(event.shipmentStatus)}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatDate(event.occurredAt)}
                      </p>
                      {event.currentLocation ? (
                        <p className="text-muted-foreground mt-1 text-xs">
                          {event.currentLocation}
                        </p>
                      ) : null}
                      {event.message ? (
                        <p className="mt-2 text-sm leading-6">{event.message}</p>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No shipment milestones yet.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { icon: PackageSearch, label: "Lookup", value: "Find shipment milestones" },
              { icon: Route, label: "Route", value: "View origin and destination lane" },
              { icon: Clock3, label: "ETA", value: "See delivery windows and latest event" },
            ].map((item) => (
              <div className="border-border bg-background rounded-md border p-4" key={item.label}>
                <item.icon aria-hidden="true" className="text-accent size-5" />
                <p className="mt-3 font-semibold">{item.label}</p>
                <p className="text-muted-foreground mt-1 text-sm leading-6">{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
