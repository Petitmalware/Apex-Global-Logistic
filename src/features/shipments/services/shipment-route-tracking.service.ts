import "server-only";

import {
  Prisma,
  ShipmentRouteSimulationMode,
  ShipmentRouteTravelMode,
  ShipmentStatus,
  type ShipmentRoute,
} from "@prisma/client";

import { env } from "@/config/env.server";
import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import { geocodeShipmentLocation } from "@/features/shipments/services/maptiler-geocoding.service";
import {
  clamp,
  getRouteState,
  isRouteCoordinate,
  numericValue,
  parseRouteGeometry,
  resolveRouteProgress,
  secondsBetween,
  type RouteGeometry,
} from "@/features/shipments/services/shipment-route-progress";
import type { ShipmentRouteTrackingView } from "@/features/shipments/types";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { PERMISSIONS, hasPermission } from "@/lib/auth/rbac";
import { AuthError } from "@/lib/auth/errors";
import { prisma } from "@/lib/db";

type Coordinate = {
  latitude: number;
  longitude: number;
};

type RouteTrackingRecord = Pick<
  ShipmentRoute,
  | "activeTransitSeconds"
  | "currentLatitude"
  | "currentLongitude"
  | "deliveredAt"
  | "destinationLabel"
  | "destinationLatitude"
  | "destinationLongitude"
  | "estimatedArrivalAt"
  | "geometry"
  | "lastPausedAt"
  | "lastProgressUpdatedAt"
  | "lastResumedAt"
  | "originLabel"
  | "originLatitude"
  | "originLongitude"
  | "progressPercent"
  | "provider"
  | "routePositionIndex"
  | "simulationMode"
  | "simulationSpeed"
  | "totalDistanceMeters"
  | "totalDurationSeconds"
  | "totalPausedSeconds"
  | "travelMode"
>;

function round(value: number, precision = 3) {
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
}

export function getShipmentRouteTrackingView(
  route: RouteTrackingRecord | null | undefined,
  status: ShipmentStatus,
  now = new Date(),
): ShipmentRouteTrackingView | null {
  if (!route) {
    return null;
  }

  const geometry = parseRouteGeometry(route.geometry);
  const progress = resolveRouteProgress(route, status, now);

  if (!geometry || !progress) {
    return null;
  }

  const state = getRouteState(status);
  const speed = Math.max(0.001, numericValue(route.simulationSpeed));
  const remainingDurationSeconds =
    state === "MOVING"
      ? Math.max(
          0,
          Math.ceil((route.totalDurationSeconds * (1 - progress.progressPercent / 100)) / speed),
        )
      : null;
  const estimatedArrivalAt =
    state === "MOVING" && remainingDurationSeconds !== null
      ? new Date(now.getTime() + remainingDurationSeconds * 1000).toISOString()
      : (route.estimatedArrivalAt?.toISOString() ?? null);

  return {
    currentPosition: progress.currentPosition,
    deliveredAt: route.deliveredAt?.toISOString() ?? null,
    destination: {
      label: route.destinationLabel,
      latitude: numericValue(route.destinationLatitude),
      longitude: numericValue(route.destinationLongitude),
    },
    estimatedArrivalAt,
    geometry: geometry.coordinates,
    lastPausedAt: route.lastPausedAt?.toISOString() ?? null,
    lastProgressUpdatedAt: route.lastProgressUpdatedAt?.toISOString() ?? null,
    origin: {
      label: route.originLabel,
      latitude: numericValue(route.originLatitude),
      longitude: numericValue(route.originLongitude),
    },
    progressPercent: round(progress.progressPercent, 1),
    provider: route.provider,
    remainingDistanceMeters: Math.max(
      0,
      route.totalDistanceMeters - progress.traveledDistanceMeters,
    ),
    remainingDurationSeconds,
    routePositionIndex: progress.routePositionIndex,
    simulationMode: route.simulationMode,
    simulationSpeed: speed,
    state,
    totalDistanceMeters: route.totalDistanceMeters,
    totalDurationSeconds: route.totalDurationSeconds,
    travelMode: route.travelMode,
    traveledDistanceMeters: progress.traveledDistanceMeters,
  };
}

type NominatimRouteResponse = {
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: {
      coordinates?: unknown;
    };
  }>;
};

function getRoutingProfile(travelMode: ShipmentRouteTravelMode) {
  switch (travelMode) {
    case ShipmentRouteTravelMode.CYCLING:
      return "cycling";
    case ShipmentRouteTravelMode.WALKING:
      return "foot";
    default:
      return "driving";
  }
}

async function requestRoadRoute({
  destination,
  origin,
  travelMode,
}: {
  destination: Coordinate;
  origin: Coordinate;
  travelMode: ShipmentRouteTravelMode;
}) {
  const routeUrl = new URL(
    `/route/v1/${getRoutingProfile(travelMode)}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`,
    env.MAP_OSRM_BASE_URL,
  );
  routeUrl.searchParams.set("alternatives", "false");
  routeUrl.searchParams.set("geometries", "geojson");
  routeUrl.searchParams.set("overview", "full");
  routeUrl.searchParams.set("steps", "false");

  let response: Response;

  try {
    response = await fetch(routeUrl, {
      cache: "no-store",
      headers: {
        "User-Agent": env.MAP_GEOCODING_USER_AGENT,
      },
      signal: AbortSignal.timeout(env.MAP_REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new AuthError(
      "The road-routing service is temporarily unavailable. Please try again.",
      503,
      "ROUTING_UNAVAILABLE",
    );
  }

  if (!response.ok) {
    throw new AuthError(
      "A road route could not be calculated for those locations.",
      422,
      "ROUTE_NOT_FOUND",
    );
  }

  const payload = (await response.json()) as NominatimRouteResponse;
  const route = payload.routes?.[0];
  const coordinates = route?.geometry?.coordinates;

  if (
    !route ||
    typeof route.distance !== "number" ||
    !Number.isFinite(route.distance) ||
    typeof route.duration !== "number" ||
    !Number.isFinite(route.duration) ||
    !Array.isArray(coordinates) ||
    coordinates.filter(isRouteCoordinate).length < 2
  ) {
    throw new AuthError("No drivable route was found for those locations.", 422, "ROUTE_NOT_FOUND");
  }

  return {
    distanceMeters: Math.max(1, Math.round(route.distance)),
    durationSeconds: Math.max(1, Math.round(route.duration)),
    geometry: {
      coordinates: coordinates.filter(isRouteCoordinate),
    } satisfies RouteGeometry,
  };
}

function canManageShipmentRoute(user: AuthSessionUser) {
  return (
    (user.roles.includes(AUTH_ROLES.ADMIN) || user.roles.includes(AUTH_ROLES.SUPER_ADMIN)) &&
    (hasPermission(user, PERMISSIONS.SHIPMENTS_MANAGE) ||
      hasPermission(user, PERMISSIONS.SHIPMENTS_UPDATE))
  );
}

async function getRouteShipment(shipmentId: string, user: AuthSessionUser) {
  if (!canManageShipmentRoute(user)) {
    throw new AuthError("You do not have permission to manage shipment routes.", 403, "FORBIDDEN");
  }

  const shipment = await prisma.shipment.findUnique({
    select: {
      deletedAt: true,
      id: true,
      organizationId: true,
      status: true,
    },
    where: { id: shipmentId },
  });

  if (!shipment || shipment.deletedAt) {
    throw new AuthError("Shipment not found.", 404, "SHIPMENT_NOT_FOUND");
  }

  if (user.organizationId && user.organizationId !== shipment.organizationId) {
    throw new AuthError(
      "You do not have permission to manage this shipment route.",
      403,
      "FORBIDDEN",
    );
  }

  return shipment;
}

export async function configureShipmentRoute({
  destinationQuery,
  originQuery,
  shipmentId,
  simulationMode,
  travelMode,
  user,
}: {
  destinationQuery: string;
  originQuery: string;
  shipmentId: string;
  simulationMode: ShipmentRouteSimulationMode;
  travelMode: ShipmentRouteTravelMode;
  user: AuthSessionUser;
}) {
  const shipment = await getRouteShipment(shipmentId, user);
  const [originResult, destinationResult] = await Promise.all([
    geocodeShipmentLocation(originQuery),
    geocodeShipmentLocation(destinationQuery),
  ]);

  if (!originResult.coordinates) {
    throw new AuthError(
      "The origin could not be located. Use a fuller address, city, or postal code.",
      422,
      "ORIGIN_NOT_FOUND",
    );
  }

  if (!destinationResult.coordinates) {
    throw new AuthError(
      "The destination could not be located. Use a fuller address, city, or postal code.",
      422,
      "DESTINATION_NOT_FOUND",
    );
  }

  const route = await requestRoadRoute({
    destination: destinationResult.coordinates,
    origin: originResult.coordinates,
    travelMode,
  });
  const now = new Date();
  const simulationSpeed =
    simulationMode === ShipmentRouteSimulationMode.ACCELERATED ? env.MAP_ROUTE_SIMULATION_SPEED : 1;
  const startsInTransit = shipment.status === ShipmentStatus.IN_TRANSIT;
  const eta = startsInTransit
    ? new Date(now.getTime() + (route.durationSeconds / simulationSpeed) * 1000)
    : null;

  return prisma.shipmentRoute.upsert({
    create: {
      currentLatitude: originResult.coordinates.latitude,
      currentLongitude: originResult.coordinates.longitude,
      destinationLabel: destinationResult.formattedAddress ?? destinationQuery.trim(),
      destinationLatitude: destinationResult.coordinates.latitude,
      destinationLongitude: destinationResult.coordinates.longitude,
      estimatedArrivalAt: eta,
      geometry: route.geometry,
      lastProgressUpdatedAt: now,
      lastResumedAt: startsInTransit ? now : null,
      originLabel: originResult.formattedAddress ?? originQuery.trim(),
      originLatitude: originResult.coordinates.latitude,
      originLongitude: originResult.coordinates.longitude,
      provider: "osrm",
      shipmentId,
      simulationMode,
      simulationSpeed,
      totalDistanceMeters: route.distanceMeters,
      totalDurationSeconds: route.durationSeconds,
      transitStartedAt: startsInTransit ? now : null,
      travelMode,
    },
    update: {
      activeTransitSeconds: 0,
      currentLatitude: originResult.coordinates.latitude,
      currentLongitude: originResult.coordinates.longitude,
      deliveredAt: null,
      destinationLabel: destinationResult.formattedAddress ?? destinationQuery.trim(),
      destinationLatitude: destinationResult.coordinates.latitude,
      destinationLongitude: destinationResult.coordinates.longitude,
      estimatedArrivalAt: eta,
      geometry: route.geometry,
      lastPausedAt: startsInTransit ? null : now,
      lastProgressUpdatedAt: now,
      lastResumedAt: startsInTransit ? now : null,
      originLabel: originResult.formattedAddress ?? originQuery.trim(),
      originLatitude: originResult.coordinates.latitude,
      originLongitude: originResult.coordinates.longitude,
      progressPercent: 0,
      provider: "osrm",
      routePositionIndex: 0,
      simulationMode,
      simulationSpeed,
      totalDistanceMeters: route.distanceMeters,
      totalDurationSeconds: route.durationSeconds,
      totalPausedSeconds: 0,
      transitStartedAt: startsInTransit ? now : null,
      travelMode,
      traveledDistanceMeters: 0,
    },
    where: { shipmentId },
  });
}

export async function clearShipmentRoute(shipmentId: string, user: AuthSessionUser) {
  await getRouteShipment(shipmentId, user);
  await prisma.shipmentRoute.deleteMany({ where: { shipmentId } });
}

export async function setManualShipmentRouteProgress({
  progressPercent,
  shipmentId,
  user,
}: {
  progressPercent: number;
  shipmentId: string;
  user: AuthSessionUser;
}) {
  await getRouteShipment(shipmentId, user);
  const route = await prisma.shipmentRoute.findUnique({ where: { shipmentId } });

  if (!route) {
    throw new AuthError(
      "Calculate a route before setting manual progress.",
      422,
      "ROUTE_NOT_CONFIGURED",
    );
  }

  if (route.simulationMode !== ShipmentRouteSimulationMode.MANUAL) {
    throw new AuthError(
      "Manual progress is available only for a manual route simulation.",
      422,
      "MANUAL_ROUTE_REQUIRED",
    );
  }

  const progress = resolveRouteProgress(
    {
      ...route,
      progressPercent: new Prisma.Decimal(progressPercent),
    },
    ShipmentStatus.IN_TRANSIT,
    new Date(),
  );

  if (!progress) {
    throw new AuthError(
      "The stored route is invalid. Recalculate the route.",
      422,
      "INVALID_ROUTE",
    );
  }

  const now = new Date();
  await prisma.shipmentRoute.update({
    data: {
      currentLatitude: progress.currentPosition.latitude,
      currentLongitude: progress.currentPosition.longitude,
      lastProgressUpdatedAt: now,
      progressPercent: clamp(progressPercent, 0, 100),
      routePositionIndex: progress.routePositionIndex,
      traveledDistanceMeters: progress.traveledDistanceMeters,
    },
    where: { shipmentId },
  });
}

export async function synchronizeShipmentRouteStatus({
  nextStatus,
  previousStatus,
  shipmentId,
  transaction,
}: {
  nextStatus: ShipmentStatus;
  previousStatus: ShipmentStatus;
  shipmentId: string;
  transaction: Prisma.TransactionClient;
}) {
  const route = await transaction.shipmentRoute.findUnique({ where: { shipmentId } });

  if (!route) {
    return;
  }

  const now = new Date();
  const progress = resolveRouteProgress(route, previousStatus, now);

  if (!progress) {
    return;
  }

  if (nextStatus === ShipmentStatus.DELIVERED) {
    await transaction.shipmentRoute.update({
      data: {
        currentLatitude: route.destinationLatitude,
        currentLongitude: route.destinationLongitude,
        deliveredAt: now,
        estimatedArrivalAt: now,
        lastPausedAt: null,
        lastProgressUpdatedAt: now,
        lastResumedAt: null,
        progressPercent: 100,
        routePositionIndex: parseRouteGeometry(route.geometry)?.coordinates.length
          ? parseRouteGeometry(route.geometry)!.coordinates.length - 1
          : route.routePositionIndex,
        traveledDistanceMeters: route.totalDistanceMeters,
      },
      where: { shipmentId },
    });
    return;
  }

  const movedFromTransit = previousStatus === ShipmentStatus.IN_TRANSIT;
  const entersTransit = nextStatus === ShipmentStatus.IN_TRANSIT;
  const pausedSeconds =
    entersTransit && route.lastPausedAt ? secondsBetween(route.lastPausedAt, now) : 0;
  const speed = Math.max(0.001, numericValue(route.simulationSpeed));
  const remainingSeconds = Math.max(
    0,
    Math.ceil((route.totalDurationSeconds * (1 - progress.progressPercent / 100)) / speed),
  );

  await transaction.shipmentRoute.update({
    data: {
      activeTransitSeconds: progress.activeTransitSeconds,
      currentLatitude: progress.currentPosition.latitude,
      currentLongitude: progress.currentPosition.longitude,
      deliveredAt: null,
      estimatedArrivalAt: entersTransit ? new Date(now.getTime() + remainingSeconds * 1000) : null,
      lastPausedAt: entersTransit ? null : movedFromTransit ? now : (route.lastPausedAt ?? now),
      lastProgressUpdatedAt: now,
      lastResumedAt: entersTransit ? (movedFromTransit ? (route.lastResumedAt ?? now) : now) : null,
      progressPercent: progress.progressPercent,
      routePositionIndex: progress.routePositionIndex,
      totalPausedSeconds: route.totalPausedSeconds + pausedSeconds,
      transitStartedAt: route.transitStartedAt ?? (entersTransit ? now : null),
      traveledDistanceMeters: progress.traveledDistanceMeters,
    },
    where: { shipmentId },
  });
}
