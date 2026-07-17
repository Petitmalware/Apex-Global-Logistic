"use client";

import { Clock3, MapPinned, Radio, Route } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatShipmentStatus } from "@/features/shipments/status-labels";
import type {
  ShipmentTrackingSnapshot,
  ShipmentTrackingTimelineEvent,
} from "@/features/shipments/types";

type TrackingConnectionState = "idle" | "live" | "reconnecting";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getLatestCoordinates(snapshot: ShipmentTrackingSnapshot) {
  return (
    snapshot.timeline.find((event) => {
      const latitude = Number(event.latitude);
      const longitude = Number(event.longitude);

      return (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
      );
    }) ?? null
  );
}

function createOpenStreetMapEmbedUrl(event: ShipmentTrackingTimelineEvent) {
  const latitude = Number(event.latitude);
  const longitude = Number(event.longitude);
  const latitudeDelta = 0.035;
  const longitudeDelta = 0.05;
  const url = new URL("https://www.openstreetmap.org/export/embed.html");

  url.searchParams.set(
    "bbox",
    [
      longitude - longitudeDelta,
      latitude - latitudeDelta,
      longitude + longitudeDelta,
      latitude + latitudeDelta,
    ].join(","),
  );
  url.searchParams.set("layer", "mapnik");
  url.searchParams.set("marker", `${latitude},${longitude}`);

  return url.toString();
}

function ConnectionBadge({ state }: { state: TrackingConnectionState }) {
  if (state === "live") {
    return (
      <Badge variant="success">
        <Radio aria-hidden="true" className="size-3.5" />
        Live updates
      </Badge>
    );
  }

  if (state === "reconnecting") {
    return <Badge variant="warning">Reconnecting</Badge>;
  }

  return <Badge variant="outline">Latest recorded position</Badge>;
}

export function ShipmentLiveMap({
  connectionState = "idle",
  snapshot,
}: {
  connectionState?: TrackingConnectionState;
  snapshot: ShipmentTrackingSnapshot;
}) {
  const latestCoordinates = getLatestCoordinates(snapshot);
  const latestEvent = snapshot.timeline[0] ?? null;
  const mapUrl = latestCoordinates ? createOpenStreetMapEmbedUrl(latestCoordinates) : null;

  return (
    <section className="border-border bg-card shadow-panel overflow-hidden rounded-lg border">
      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="bg-accent/15 text-accent-foreground grid size-10 shrink-0 place-items-center rounded-md">
            <MapPinned aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold">Shipment location</h3>
            <p className="text-muted-foreground truncate text-sm">
              {snapshot.originCity} to {snapshot.destinationCity}
            </p>
          </div>
        </div>
        <ConnectionBadge state={connectionState} />
      </div>

      {mapUrl && latestCoordinates ? (
        <div className="relative">
          <iframe
            className="h-80 w-full border-0 sm:h-96"
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin"
            src={mapUrl}
            title={`Last reported map position for ${snapshot.shipmentNumber}`}
          />
          <div className="border-border bg-background/95 absolute right-4 bottom-4 left-4 rounded-md border p-3 shadow-sm backdrop-blur">
            <p className="text-sm font-semibold">
              {latestCoordinates.currentLocation ?? "GPS checkpoint"}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Last reported {formatDate(latestCoordinates.occurredAt)}. This marker moves when Apex
              publishes another verified coordinate.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-surface p-5 sm:p-6">
          <div className="border-border bg-background rounded-lg border p-5">
            <div className="flex items-start gap-3">
              <Route aria-hidden="true" className="text-accent mt-0.5 size-5 shrink-0" />
              <div>
                <p className="font-semibold">Manual milestone tracking is active</p>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  No verified GPS coordinate has been reported yet. The location and timeline below
                  still update immediately whenever an admin publishes a checkpoint.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="border-border rounded-md border p-3">
                <p className="text-muted-foreground text-xs font-semibold uppercase">
                  Current status
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {formatShipmentStatus(snapshot.status)}
                </p>
              </div>
              <div className="border-border rounded-md border p-3">
                <p className="text-muted-foreground text-xs font-semibold uppercase">
                  Last location
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {latestEvent?.currentLocation ?? "Awaiting the first location update"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="border-border grid gap-3 border-t p-4 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <Clock3 aria-hidden="true" className="text-accent mt-0.5 size-4 shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase">Last system update</p>
            <p className="text-muted-foreground mt-1 text-sm">{formatDate(snapshot.updatedAt)}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 sm:justify-end sm:text-right">
          <MapPinned aria-hidden="true" className="text-accent mt-0.5 size-4 shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase">Map source</p>
            <p className="text-muted-foreground mt-1 text-sm">OpenStreetMap</p>
          </div>
        </div>
      </div>
    </section>
  );
}
