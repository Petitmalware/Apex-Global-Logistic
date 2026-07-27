import assert from "node:assert/strict";
import test from "node:test";

import { ShipmentRouteSimulationMode, ShipmentStatus } from "@prisma/client";

import {
  getRouteProgressPercent,
  getRouteState,
  resolveRouteProgress,
} from "@/features/shipments/services/shipment-route-progress";

const start = new Date("2026-07-26T10:00:00.000Z");

function createRoute(overrides: Partial<Parameters<typeof resolveRouteProgress>[0]> = {}) {
  return {
    activeTransitSeconds: 0,
    deliveredAt: null,
    geometry: {
      coordinates: [
        [-80.0, 35.0],
        [-79.5, 35.25],
        [-79.0, 35.5],
      ],
    },
    lastResumedAt: start,
    progressPercent: 0,
    simulationMode: ShipmentRouteSimulationMode.REALTIME,
    simulationSpeed: 1,
    totalDistanceMeters: 100_000,
    totalDurationSeconds: 3_600,
    ...overrides,
  };
}

test("advances by active in-transit time and remains on the saved road geometry", () => {
  const progress = resolveRouteProgress(
    createRoute(),
    ShipmentStatus.IN_TRANSIT,
    new Date(start.getTime() + 900_000),
  );

  assert.ok(progress);
  assert.equal(progress.progressPercent, 25);
  assert.equal(progress.traveledDistanceMeters, 25_000);
  assert.ok(progress.currentPosition.longitude > -80);
  assert.ok(progress.currentPosition.longitude < -79);
});

test("does not advance while a shipment is on hold", () => {
  const progress = resolveRouteProgress(
    createRoute({ activeTransitSeconds: 900, lastResumedAt: null }),
    ShipmentStatus.HELD,
    new Date(start.getTime() + 3_600_000),
  );

  assert.ok(progress);
  assert.equal(progress.progressPercent, 25);
  assert.equal(getRouteState(ShipmentStatus.HELD), "PAUSED");
});

test("resumes from accumulated active transit time instead of restarting", () => {
  const progress = resolveRouteProgress(
    createRoute({ activeTransitSeconds: 900, lastResumedAt: start }),
    ShipmentStatus.IN_TRANSIT,
    new Date(start.getTime() + 900_000),
  );

  assert.ok(progress);
  assert.equal(progress.progressPercent, 50);
});

test("uses a manually stored position in manual mode", () => {
  const progress = resolveRouteProgress(
    createRoute({
      progressPercent: 62.5,
      simulationMode: ShipmentRouteSimulationMode.MANUAL,
    }),
    ShipmentStatus.IN_TRANSIT,
    new Date(start.getTime() + 3_600_000),
  );

  assert.ok(progress);
  assert.equal(progress.progressPercent, 62.5);
});

test("pins a delivered shipment at exactly 100 percent", () => {
  const route = createRoute({ deliveredAt: new Date(start.getTime() + 1_800_000) });
  const progress = resolveRouteProgress(route, ShipmentStatus.DELIVERED, start);

  assert.ok(progress);
  assert.equal(progress.progressPercent, 100);
  assert.equal(progress.traveledDistanceMeters, 100_000);
  assert.deepEqual(progress.currentPosition, { latitude: 35.5, longitude: -79.0 });
  assert.equal(getRouteProgressPercent(route, ShipmentStatus.DELIVERED, start), 100);
  assert.equal(getRouteState(ShipmentStatus.DELIVERED), "DELIVERED");
});

test("does not mark an in-transit shipment delivered before its status changes", () => {
  assert.equal(getRouteState(ShipmentStatus.IN_TRANSIT), "MOVING");
});

test("rejects malformed route geometry without producing a position", () => {
  const progress = resolveRouteProgress(
    createRoute({ geometry: { coordinates: [[-80, 35]] } }),
    ShipmentStatus.IN_TRANSIT,
    start,
  );

  assert.equal(progress, null);
});
