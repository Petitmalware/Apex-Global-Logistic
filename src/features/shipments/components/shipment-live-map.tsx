"use client";

import dynamic from "next/dynamic";
import { Clock3, MapPinned, Radio, Route } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatShipmentStatus } from "@/features/shipments/status-labels";
import type { ShipmentRouteCoordinate } from "@/features/shipments/components/shipment-route-map";
import type { ShipmentTrackingSnapshot } from "@/features/shipments/types";

const ShipmentRouteMap = dynamic(
  () =>
    import("@/features/shipments/components/shipment-route-map").then(
      (module) => module.ShipmentRouteMap,
    ),
  {
    loading: () => (
      <div className="bg-surface flex h-[22rem] items-center justify-center sm:h-[28rem]">
        <p className="text-muted-foreground text-sm">Loading street map...</p>
      </div>
    ),
    ssr: false,
  },
);

type TrackingConnectionState = "idle" | "live" | "reconnecting";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function isValidCoordinate(latitude: string | null, longitude: string | null) {
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  return (
    Number.isFinite(parsedLatitude) &&
    Number.isFinite(parsedLongitude) &&
    parsedLatitude >= -90 &&
    parsedLatitude <= 90 &&
    parsedLongitude >= -180 &&
    parsedLongitude <= 180
  );
}

function getRouteCoordinates(snapshot: ShipmentTrackingSnapshot): ShipmentRouteCoordinate[] {
  const route = snapshot.timeline
    .slice()
    .reverse()
    .flatMap((event) => {
      if (!isValidCoordinate(event.latitude, event.longitude)) {
        return [];
      }

      return [
        {
          label: event.currentLocation ?? "Verified shipment checkpoint",
          latitude: Number(event.latitude),
          longitude: Number(event.longitude),
          occurredAt: event.occurredAt,
        },
      ];
    });

  return route.filter(
    (coordinate, index) =>
      index === 0 ||
      coordinate.latitude !== route[index - 1]?.latitude ||
      coordinate.longitude !== route[index - 1]?.longitude,
  );
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

  return <Badge variant="outline">Recorded position</Badge>;
}

export function ShipmentLiveMap({
  connectionState = "idle",
  snapshot,
}: {
  connectionState?: TrackingConnectionState;
  snapshot: ShipmentTrackingSnapshot;
}) {
  const routeCoordinates = getRouteCoordinates(snapshot);
  const latestCoordinates = routeCoordinates.at(-1) ?? null;
  const latestEvent = snapshot.timeline[0] ?? null;

  return (
    <section className="border-border bg-card shadow-panel overflow-hidden rounded-lg border">
      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="bg-accent/15 text-accent-foreground grid size-10 shrink-0 place-items-center rounded-md">
            <MapPinned aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-semibold uppercase">Live route map</p>
            <h3 className="mt-1 font-semibold">Verified location updates</h3>
            <p className="text-muted-foreground truncate text-sm">
              {snapshot.originCity} to {snapshot.destinationCity}
            </p>
          </div>
        </div>
        <ConnectionBadge state={connectionState} />
      </div>

      {latestCoordinates ? (
        <div className="relative">
          <ShipmentRouteMap
            coordinates={routeCoordinates}
            shipmentNumber={snapshot.shipmentNumber}
          />
          <div className="border-border bg-background/95 absolute right-3 bottom-3 left-3 rounded-md border p-3 shadow-sm backdrop-blur sm:right-5 sm:bottom-5 sm:left-auto sm:max-w-sm">
            <p className="text-sm font-semibold">{latestCoordinates.label}</p>
            <p className="text-muted-foreground mt-1 text-xs leading-5">
              Last verified {formatDate(latestCoordinates.occurredAt)}.{" "}
              {routeCoordinates.length > 1
                ? "The line joins recorded checkpoints and is not turn-by-turn navigation."
                : "More map detail appears as verified checkpoints are published."}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-surface p-5 sm:p-6">
          <div className="border-border bg-background rounded-lg border p-5">
            <div className="flex items-start gap-3">
              <Route aria-hidden="true" className="text-accent mt-0.5 size-5 shrink-0" />
              <div>
                <p className="font-semibold">Location updates are active</p>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  The shipment has not received a verified coordinate yet. Apex can still publish
                  the customer-facing location and timeline immediately while a map position is
                  unavailable.
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
                  Latest location
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {latestEvent?.currentLocation ?? "Awaiting the first location update"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="border-border grid gap-3 border-t p-4 sm:grid-cols-2 sm:p-5">
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
            <p className="text-xs font-semibold uppercase">Map data</p>
            <a
              className="text-muted-foreground mt-1 inline-block text-sm underline-offset-4 hover:underline"
              href="https://www.openstreetmap.org/copyright"
              rel="noreferrer"
              target="_blank"
            >
              OpenStreetMap contributors
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
