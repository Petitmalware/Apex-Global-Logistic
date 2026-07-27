import { ShipmentRouteSimulationMode, ShipmentStatus } from "@prisma/client";

export type RouteCoordinate = [number, number];

export type RouteGeometry = {
  coordinates: RouteCoordinate[];
};

export type RouteProgressInput = {
  activeTransitSeconds: number;
  deliveredAt: Date | null;
  geometry: unknown;
  lastResumedAt: Date | null;
  progressPercent: number | { toNumber(): number };
  simulationMode: ShipmentRouteSimulationMode;
  simulationSpeed: number | { toNumber(): number };
  totalDistanceMeters: number;
  totalDurationSeconds: number;
};

export type RouteProgress = {
  activeTransitSeconds: number;
  currentPosition: {
    latitude: number;
    longitude: number;
  };
  progressPercent: number;
  routePositionIndex: number;
  traveledDistanceMeters: number;
};

const EARTH_RADIUS_METERS = 6_371_000;

export function numericValue(value: number | { toNumber(): number }) {
  return typeof value === "number" ? value : value.toNumber();
}

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function secondsBetween(start: Date, end: Date) {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
}

export function isRouteCoordinate(value: unknown): value is RouteCoordinate {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "number" &&
    Number.isFinite(value[0]) &&
    typeof value[1] === "number" &&
    Number.isFinite(value[1]) &&
    value[0] >= -180 &&
    value[0] <= 180 &&
    value[1] >= -90 &&
    value[1] <= 90
  );
}

export function parseRouteGeometry(value: unknown): RouteGeometry | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const coordinates = "coordinates" in value ? value.coordinates : null;

  if (!Array.isArray(coordinates)) {
    return null;
  }

  const validCoordinates = coordinates.filter(isRouteCoordinate);

  return validCoordinates.length >= 2 ? { coordinates: validCoordinates } : null;
}

function haversineMeters(first: RouteCoordinate, second: RouteCoordinate) {
  const longitudeDelta = ((second[0] - first[0]) * Math.PI) / 180;
  const latitudeDelta = ((second[1] - first[1]) * Math.PI) / 180;
  const firstLatitude = (first[1] * Math.PI) / 180;
  const secondLatitude = (second[1] * Math.PI) / 180;
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(value));
}

function pointAlongGeometry(geometry: RouteGeometry, progressPercent: number) {
  const targetProgress = clamp(progressPercent, 0, 100) / 100;
  const segments = geometry.coordinates.slice(1).map((coordinate, index) => ({
    distance: haversineMeters(geometry.coordinates[index]!, coordinate),
    from: geometry.coordinates[index]!,
    index,
    to: coordinate,
  }));
  const totalDistance = segments.reduce((total, segment) => total + segment.distance, 0);

  if (totalDistance <= 0 || targetProgress >= 1) {
    const endpoint = geometry.coordinates.at(-1)!;
    return {
      coordinate: endpoint,
      routePositionIndex: geometry.coordinates.length - 1,
    };
  }

  const targetDistance = totalDistance * targetProgress;
  let traveled = 0;

  for (const segment of segments) {
    if (traveled + segment.distance >= targetDistance) {
      const segmentProgress =
        segment.distance > 0 ? (targetDistance - traveled) / segment.distance : 0;

      return {
        coordinate: [
          segment.from[0] + (segment.to[0] - segment.from[0]) * segmentProgress,
          segment.from[1] + (segment.to[1] - segment.from[1]) * segmentProgress,
        ] as RouteCoordinate,
        routePositionIndex: segment.index,
      };
    }

    traveled += segment.distance;
  }

  const endpoint = geometry.coordinates.at(-1)!;
  return {
    coordinate: endpoint,
    routePositionIndex: geometry.coordinates.length - 1,
  };
}

export function getActiveTransitSeconds(
  route: RouteProgressInput,
  status: ShipmentStatus,
  now: Date,
) {
  if (status !== ShipmentStatus.IN_TRANSIT || !route.lastResumedAt) {
    return route.activeTransitSeconds;
  }

  return route.activeTransitSeconds + secondsBetween(route.lastResumedAt, now);
}

export function getRouteProgressPercent(
  route: RouteProgressInput,
  status: ShipmentStatus,
  now: Date,
) {
  if (status === ShipmentStatus.DELIVERED || route.deliveredAt) {
    return 100;
  }

  if (route.simulationMode === ShipmentRouteSimulationMode.MANUAL) {
    return clamp(numericValue(route.progressPercent), 0, 100);
  }

  if (!route.totalDurationSeconds || route.totalDurationSeconds <= 0) {
    return clamp(numericValue(route.progressPercent), 0, 100);
  }

  const speed = Math.max(0.001, numericValue(route.simulationSpeed));
  const elapsed = getActiveTransitSeconds(route, status, now) * speed;

  return clamp((elapsed / route.totalDurationSeconds) * 100, 0, 100);
}

export function resolveRouteProgress(
  route: RouteProgressInput,
  status: ShipmentStatus,
  now: Date,
): RouteProgress | null {
  const geometry = parseRouteGeometry(route.geometry);

  if (!geometry) {
    return null;
  }

  const progressPercent = getRouteProgressPercent(route, status, now);
  const point = pointAlongGeometry(geometry, progressPercent);

  return {
    activeTransitSeconds: getActiveTransitSeconds(route, status, now),
    currentPosition: {
      latitude: point.coordinate[1],
      longitude: point.coordinate[0],
    },
    progressPercent,
    routePositionIndex: point.routePositionIndex,
    traveledDistanceMeters: Math.round((route.totalDistanceMeters * progressPercent) / 100),
  };
}

export function getRouteState(status: ShipmentStatus) {
  if (status === ShipmentStatus.DELIVERED) {
    return "DELIVERED" as const;
  }

  if (status === ShipmentStatus.IN_TRANSIT) {
    return "MOVING" as const;
  }

  if (
    status === ShipmentStatus.DRAFT ||
    status === ShipmentStatus.BOOKED ||
    status === ShipmentStatus.PROCESSING ||
    status === ShipmentStatus.READY_FOR_DISPATCH ||
    status === ShipmentStatus.PENDING_PICKUP
  ) {
    return "NOT_STARTED" as const;
  }

  return "PAUSED" as const;
}
