ALTER TYPE "ShipmentStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';
ALTER TYPE "ShipmentStatus" ADD VALUE IF NOT EXISTS 'READY_FOR_DISPATCH';
ALTER TYPE "ShipmentStatus" ADD VALUE IF NOT EXISTS 'DELAYED';

CREATE TYPE "ShipmentRouteTravelMode" AS ENUM ('DRIVING', 'CYCLING', 'WALKING');
CREATE TYPE "ShipmentRouteSimulationMode" AS ENUM ('REALTIME', 'ACCELERATED', 'MANUAL');

CREATE TABLE "ShipmentRoute" (
    "id" UUID NOT NULL,
    "shipmentId" UUID NOT NULL,
    "provider" VARCHAR(40) NOT NULL DEFAULT 'osrm',
    "travelMode" "ShipmentRouteTravelMode" NOT NULL DEFAULT 'DRIVING',
    "simulationMode" "ShipmentRouteSimulationMode" NOT NULL DEFAULT 'REALTIME',
    "simulationSpeed" DECIMAL(10,3) NOT NULL DEFAULT 1,
    "originLabel" VARCHAR(500) NOT NULL,
    "destinationLabel" VARCHAR(500) NOT NULL,
    "originLatitude" DECIMAL(9,6) NOT NULL,
    "originLongitude" DECIMAL(9,6) NOT NULL,
    "destinationLatitude" DECIMAL(9,6) NOT NULL,
    "destinationLongitude" DECIMAL(9,6) NOT NULL,
    "geometry" JSONB NOT NULL,
    "totalDistanceMeters" INTEGER NOT NULL,
    "totalDurationSeconds" INTEGER NOT NULL,
    "progressPercent" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "traveledDistanceMeters" INTEGER NOT NULL DEFAULT 0,
    "routePositionIndex" INTEGER NOT NULL DEFAULT 0,
    "currentLatitude" DECIMAL(9,6) NOT NULL,
    "currentLongitude" DECIMAL(9,6) NOT NULL,
    "transitStartedAt" TIMESTAMPTZ(6),
    "lastResumedAt" TIMESTAMPTZ(6),
    "lastPausedAt" TIMESTAMPTZ(6),
    "activeTransitSeconds" INTEGER NOT NULL DEFAULT 0,
    "totalPausedSeconds" INTEGER NOT NULL DEFAULT 0,
    "lastProgressUpdatedAt" TIMESTAMPTZ(6),
    "estimatedArrivalAt" TIMESTAMPTZ(6),
    "deliveredAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ShipmentRoute_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShipmentRoute_shipmentId_key" ON "ShipmentRoute"("shipmentId");
CREATE INDEX "idx_shipment_routes_simulation_updated_at" ON "ShipmentRoute"("simulationMode", "updatedAt");
CREATE INDEX "idx_shipment_routes_last_resumed_at" ON "ShipmentRoute"("lastResumedAt");

ALTER TABLE "ShipmentRoute"
  ADD CONSTRAINT "ShipmentRoute_shipmentId_fkey"
  FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
