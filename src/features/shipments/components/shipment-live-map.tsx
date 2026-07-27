"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { MapPinned, Route } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type {
  ShipmentRouteTrackingView,
  ShipmentTrackingSnapshot,
} from "@/features/shipments/types";
import { formatShipmentStatus } from "@/features/shipments/status-labels";

const MapTilerShipmentRouteMap = dynamic(
  () =>
    import("@/features/shipments/components/maptiler-shipment-route-map").then(
      (module) => module.MapTilerShipmentRouteMap,
    ),
  {
    loading: () => (
      <div className="bg-surface flex h-[22rem] items-center justify-center sm:h-[30rem]">
        <p className="text-muted-foreground text-sm">Loading road route...</p>
      </div>
    ),
    ssr: false,
  },
);

type TrackingConnectionState = "idle" | "live" | "reconnecting";

function formatDistance(distanceMeters: number) {
  if (distanceMeters >= 1_000) {
    return `${(distanceMeters / 1_000).toFixed(1)} km`;
  }

  return `${distanceMeters} m`;
}

function formatDuration(seconds: number | null) {
  if (seconds === null) {
    return "Paused";
  }

  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.ceil((seconds % 3_600) / 60);

  return hours ? `${hours}h ${minutes}m` : `${minutes} min`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Available when transit begins";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getDistance(first: [number, number], second: [number, number]) {
  const longitudeDelta = ((second[0] - first[0]) * Math.PI) / 180;
  const latitudeDelta = ((second[1] - first[1]) * Math.PI) / 180;
  const firstLatitude = (first[1] * Math.PI) / 180;
  const secondLatitude = (second[1] * Math.PI) / 180;
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * 6_371_000 * Math.asin(Math.sqrt(value));
}

function getPositionAtProgress(geometry: Array<[number, number]>, progressPercent: number) {
  const segments = geometry.slice(1).map((point, index) => ({
    distance: getDistance(geometry[index]!, point),
    from: geometry[index]!,
    to: point,
  }));
  const totalDistance = segments.reduce((total, segment) => total + segment.distance, 0);
  const targetDistance = totalDistance * Math.min(1, Math.max(0, progressPercent / 100));
  let traveled = 0;

  for (const segment of segments) {
    if (traveled + segment.distance >= targetDistance) {
      const ratio = segment.distance ? (targetDistance - traveled) / segment.distance : 0;

      return {
        latitude: segment.from[1] + (segment.to[1] - segment.from[1]) * ratio,
        longitude: segment.from[0] + (segment.to[0] - segment.from[0]) * ratio,
      };
    }

    traveled += segment.distance;
  }

  const destination = geometry.at(-1)!;
  return { latitude: destination[1], longitude: destination[0] };
}

function useAnimatedRoute(route: ShipmentRouteTrackingView | null) {
  const [receivedAt, setReceivedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setReceivedAt(Date.now());
    setNow(Date.now());
  }, [route?.lastProgressUpdatedAt, route?.progressPercent, route?.state]);

  useEffect(() => {
    if (!route || route.state !== "MOVING" || route.simulationMode === "MANUAL") {
      return undefined;
    }

    const interval = window.setInterval(() => setNow(Date.now()), 1_000);

    return () => window.clearInterval(interval);
  }, [route]);

  return useMemo(() => {
    if (!route || route.state !== "MOVING" || route.simulationMode === "MANUAL") {
      return route;
    }

    const additionalProgress =
      ((now - receivedAt) / 1000 / route.totalDurationSeconds) * route.simulationSpeed * 100;
    const progressPercent = Math.min(100, route.progressPercent + additionalProgress);
    const currentPosition = getPositionAtProgress(route.geometry, progressPercent);
    const traveledDistanceMeters = Math.round((route.totalDistanceMeters * progressPercent) / 100);

    return {
      ...route,
      currentPosition,
      progressPercent: Math.round(progressPercent * 10) / 10,
      remainingDistanceMeters: Math.max(0, route.totalDistanceMeters - traveledDistanceMeters),
      remainingDurationSeconds: Math.max(
        0,
        Math.ceil(
          (route.totalDurationSeconds * (1 - progressPercent / 100)) / route.simulationSpeed,
        ),
      ),
      traveledDistanceMeters,
    };
  }, [now, receivedAt, route]);
}

function getConnectionBadge(
  connectionState: TrackingConnectionState,
  snapshot: ShipmentTrackingSnapshot,
) {
  if (snapshot.route?.state === "MOVING") {
    return <Badge variant="success">Route progress active</Badge>;
  }

  if (snapshot.route?.state === "PAUSED") {
    return <Badge variant="warning">Route progress paused</Badge>;
  }

  if (snapshot.route?.state === "DELIVERED") {
    return <Badge variant="success">Delivered</Badge>;
  }

  if (connectionState === "live") {
    return <Badge variant="outline">Updates connected</Badge>;
  }

  return <Badge variant="outline">Route pending</Badge>;
}

export function ShipmentLiveMap({
  connectionState = "idle",
  snapshot,
}: {
  connectionState?: TrackingConnectionState;
  snapshot: ShipmentTrackingSnapshot;
}) {
  const route = snapshot.route;
  const animatedRoute = useAnimatedRoute(route);
  const latestEvent = snapshot.timeline[0] ?? null;

  return (
    <section className="border-border bg-card shadow-panel overflow-hidden rounded-lg border">
      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="bg-accent/15 text-accent-foreground grid size-10 shrink-0 place-items-center rounded-md">
            <MapPinned aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-semibold uppercase">
              Road route tracking
            </p>
            <h3 className="mt-1 font-semibold">
              {route ? "Estimated route progress" : "Route not calculated"}
            </h3>
            <p className="text-muted-foreground truncate text-sm">
              {route
                ? `${route.origin.label} to ${route.destination.label}`
                : `${snapshot.originCity} to ${snapshot.destinationCity}`}
            </p>
          </div>
        </div>
        {getConnectionBadge(connectionState, snapshot)}
      </div>

      {animatedRoute ? (
        <>
          <MapTilerShipmentRouteMap
            route={animatedRoute}
            shipmentNumber={snapshot.shipmentNumber}
          />
          <div className="border-border bg-border grid gap-px border-t sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Progress", value: `${animatedRoute.progressPercent}%` },
              {
                label: "Remaining distance",
                value: formatDistance(animatedRoute.remainingDistanceMeters),
              },
              {
                label: "Remaining time",
                value: formatDuration(animatedRoute.remainingDurationSeconds),
              },
              { label: "Estimated arrival", value: formatDate(animatedRoute.estimatedArrivalAt) },
            ].map((item) => (
              <div className="bg-card px-4 py-3 sm:px-5" key={item.label}>
                <p className="text-muted-foreground text-xs font-semibold uppercase">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-surface p-5 sm:p-6">
          <div className="border-border bg-background rounded-lg border p-5">
            <div className="flex items-start gap-3">
              <Route aria-hidden="true" className="text-accent mt-0.5 size-5 shrink-0" />
              <div>
                <p className="font-semibold">Road route is not available yet</p>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  Apex has not calculated a road route for this shipment. The current status and the
                  latest published operational update remain available below.
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
                  Latest update
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {latestEvent?.currentLocation ??
                    latestEvent?.message ??
                    "Awaiting the first update"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
