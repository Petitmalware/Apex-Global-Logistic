"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { MapPinned, Radio, Route } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { clientEnv } from "@/config/env.client";
import type {
  ShipmentEstimatedRoute,
  ShipmentRouteCheckpoint,
} from "@/features/shipments/components/shipment-route-map.types";
import { formatShipmentStatus } from "@/features/shipments/status-labels";
import type { ShipmentTrackingSnapshot } from "@/features/shipments/types";

const MapTilerShipmentRouteMap = dynamic(
  () =>
    import("@/features/shipments/components/maptiler-shipment-route-map").then(
      (module) => module.MapTilerShipmentRouteMap,
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

type MapCoordinate = {
  latitude: number;
  longitude: number;
};

type MapTilerGeocodingResponse = {
  features?: Array<{
    center?: [number, number];
  }>;
};

function getRouteSchedule(
  snapshot: ShipmentTrackingSnapshot,
  latestCheckpoint: ShipmentRouteCheckpoint | null,
) {
  const startsAt =
    latestCheckpoint?.occurredAt ??
    snapshot.dispatchedAt ??
    snapshot.pickupWindowStart ??
    snapshot.createdAt;
  const endsAt = snapshot.deliveryWindowEnd ?? snapshot.deliveryWindowStart;

  if (!endsAt) {
    return null;
  }

  const startTime = new Date(startsAt).getTime();
  const endTime = new Date(endsAt).getTime();

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
    return null;
  }

  return { endTime, startTime };
}

async function geocodePlannedLocation(apiKey: string, location: string, signal: AbortSignal) {
  const response = await fetch(
    `https://api.maptiler.com/geocoding/${encodeURIComponent(location)}.json?key=${encodeURIComponent(apiKey)}&limit=1`,
    { signal },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as MapTilerGeocodingResponse;
  const [longitude, latitude] = payload.features?.[0]?.center ?? [];

  return typeof latitude === "number" && typeof longitude === "number"
    ? { latitude, longitude }
    : null;
}

function getEstimatedProgress({
  destination,
  destinationLabel,
  now,
  origin,
  originLabel,
  schedule,
}: {
  destination: MapCoordinate;
  destinationLabel: string;
  now: number;
  origin: MapCoordinate;
  originLabel: string;
  schedule: { endTime: number; startTime: number };
}): ShipmentEstimatedRoute {
  const elapsed = (now - schedule.startTime) / (schedule.endTime - schedule.startTime);
  // Keep an estimate inside the route until an actual delivered update is published.
  const progress = Math.min(0.95, Math.max(0.02, elapsed));

  return {
    destination: {
      label: destinationLabel,
      ...destination,
    },
    estimatedPosition: {
      latitude: origin.latitude + (destination.latitude - origin.latitude) * progress,
      longitude: origin.longitude + (destination.longitude - origin.longitude) * progress,
    },
    origin: {
      label: originLabel,
      ...origin,
    },
    progressPercent: Math.round(progress * 100),
  };
}

function useEstimatedRoute({
  apiKey,
  enabled,
  latestCheckpoint,
  snapshot,
}: {
  apiKey: string | undefined;
  enabled: boolean;
  latestCheckpoint: ShipmentRouteCheckpoint | null;
  snapshot: ShipmentTrackingSnapshot;
}) {
  const [coordinates, setCoordinates] = useState<{
    destination: MapCoordinate;
    origin: MapCoordinate;
  } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const schedule = useMemo(
    () => getRouteSchedule(snapshot, latestCheckpoint),
    [latestCheckpoint, snapshot],
  );

  useEffect(() => {
    if (!enabled || !apiKey || !schedule) {
      setCoordinates(null);
      return;
    }

    const controller = new AbortController();
    const originQuery = `${snapshot.originCity}, ${snapshot.originCountryCode}`;
    const destinationQuery = `${snapshot.destinationCity}, ${snapshot.destinationCountryCode}`;

    void Promise.all([
      latestCheckpoint
        ? Promise.resolve({
            latitude: latestCheckpoint.latitude,
            longitude: latestCheckpoint.longitude,
          })
        : geocodePlannedLocation(apiKey, originQuery, controller.signal),
      geocodePlannedLocation(apiKey, destinationQuery, controller.signal),
    ]).then(([origin, destination]) => {
      if (!controller.signal.aborted && origin && destination) {
        setCoordinates({ destination, origin });
      }
    });

    return () => controller.abort();
  }, [
    apiKey,
    enabled,
    latestCheckpoint,
    schedule,
    snapshot.destinationCity,
    snapshot.destinationCountryCode,
    snapshot.originCity,
    snapshot.originCountryCode,
  ]);

  useEffect(() => {
    if (!enabled || !coordinates || !schedule) {
      return;
    }

    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);

    return () => window.clearInterval(timer);
  }, [coordinates, enabled, schedule]);

  return useMemo(() => {
    if (!enabled || !coordinates || !schedule) {
      return null;
    }

    return getEstimatedProgress({
      destination: coordinates.destination,
      destinationLabel: "Planned delivery destination",
      now,
      origin: coordinates.origin,
      originLabel: latestCheckpoint?.label ?? "Planned origin",
      schedule,
    });
  }, [coordinates, enabled, latestCheckpoint, now, schedule]);
}

function getRouteCheckpoints(snapshot: ShipmentTrackingSnapshot): ShipmentRouteCheckpoint[] {
  const latestPositionId = snapshot.timeline.find((event) =>
    isValidCoordinate(event.latitude, event.longitude),
  )?.id;

  return snapshot.timeline
    .slice()
    .reverse()
    .flatMap((event) => {
      if (
        (event.shipmentStatus !== "IN_TRANSIT" && event.id !== latestPositionId) ||
        !isValidCoordinate(event.latitude, event.longitude)
      ) {
        return [];
      }

      return [
        {
          id: event.id,
          label: event.currentLocation ?? "Verified shipment checkpoint",
          latitude: Number(event.latitude),
          longitude: Number(event.longitude),
          message: event.message,
          occurredAt: event.occurredAt,
          status: event.shipmentStatus,
        },
      ];
    });
}

function ConnectionBadge({
  hasEstimatedRoute,
  state,
  status,
}: {
  hasEstimatedRoute: boolean;
  state: TrackingConnectionState;
  status: ShipmentTrackingSnapshot["status"];
}) {
  if (status !== "IN_TRANSIT") {
    return <Badge variant="warning">Movement paused</Badge>;
  }

  if (hasEstimatedRoute) {
    return <Badge variant="outline">Schedule estimate</Badge>;
  }

  if (state === "live") {
    return (
      <Badge variant="success">
        <Radio aria-hidden="true" className="size-3.5" />
        Published updates available
      </Badge>
    );
  }

  return <Badge variant="outline">Verified updates</Badge>;
}

export function ShipmentLiveMap({
  connectionState = "idle",
  snapshot,
}: {
  connectionState?: TrackingConnectionState;
  snapshot: ShipmentTrackingSnapshot;
}) {
  const routeCheckpoints = useMemo(() => getRouteCheckpoints(snapshot), [snapshot]);
  const latestCheckpoint = routeCheckpoints.at(-1) ?? null;
  const latestEvent = snapshot.timeline[0] ?? null;
  const mapTilerKey = clientEnv.NEXT_PUBLIC_MAPTILER_API_KEY?.trim();
  const estimatedRoute = useEstimatedRoute({
    apiKey: mapTilerKey,
    enabled: snapshot.status === "IN_TRANSIT",
    latestCheckpoint,
    snapshot,
  });
  const hasMap = Boolean(mapTilerKey && (latestCheckpoint || estimatedRoute));

  return (
    <section className="border-border bg-card shadow-panel overflow-hidden rounded-lg border">
      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="bg-accent/15 text-accent-foreground grid size-10 shrink-0 place-items-center rounded-md">
            <MapPinned aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-semibold uppercase">
              {estimatedRoute ? "Estimated route" : "Shipment location"}
            </p>
            <h3 className="mt-1 font-semibold">
              {estimatedRoute ? "Estimated route progress" : "Current recorded location"}
            </h3>
            <p className="text-muted-foreground truncate text-sm">
              {snapshot.originCity} to {snapshot.destinationCity}
            </p>
          </div>
        </div>
        <ConnectionBadge
          hasEstimatedRoute={Boolean(estimatedRoute)}
          state={connectionState}
          status={snapshot.status}
        />
      </div>

      {hasMap && mapTilerKey ? (
        <div className="relative">
          <MapTilerShipmentRouteMap
            apiKey={mapTilerKey}
            checkpoints={routeCheckpoints}
            estimatedRoute={estimatedRoute}
            shipmentNumber={snapshot.shipmentNumber}
          />
          <div className="border-border bg-background/95 absolute right-3 bottom-3 max-w-[calc(100%-1.5rem)] rounded-md border px-3 py-2 shadow-sm backdrop-blur sm:right-5 sm:bottom-5 sm:max-w-xs">
            {estimatedRoute ? (
              <>
                <p className="text-sm font-semibold">
                  {estimatedRoute.progressPercent}% through planned schedule
                </p>
                <p className="text-muted-foreground mt-1 text-xs leading-5">
                  Estimated schedule-based progress, not live GPS.
                </p>
              </>
            ) : latestCheckpoint ? (
              <>
                <p className="text-sm font-semibold">{latestCheckpoint.label}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Updated {formatDate(latestCheckpoint.occurredAt)}
                </p>
              </>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="bg-surface p-5 sm:p-6">
          <div className="border-border bg-background rounded-lg border p-5">
            <div className="flex items-start gap-3">
              <Route aria-hidden="true" className="text-accent mt-0.5 size-5 shrink-0" />
              <div>
                <p className="font-semibold">
                  {mapTilerKey ? "Location update pending" : "Map location unavailable"}
                </p>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {mapTilerKey
                    ? "Publish an in-transit location for a verified map pin, or add a delivery window to enable the clearly labelled route estimate while the shipment is moving."
                    : "Apex has not published a map location for this shipment yet. The latest verified location and status remain available above."}
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
    </section>
  );
}
