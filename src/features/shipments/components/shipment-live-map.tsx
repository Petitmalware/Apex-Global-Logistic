"use client";

import { MapPinned, Navigation, Radio } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatShipmentStatus, formatTrackingEventType } from "@/features/shipments/status-labels";
import type { ShipmentTrackingSnapshot } from "@/features/shipments/types";

function getProgress(snapshot: ShipmentTrackingSnapshot) {
  if (snapshot.status === "DELIVERED") {
    return 100;
  }

  if (snapshot.status === "IN_TRANSIT") {
    return 62;
  }

  if (snapshot.status === "PENDING_PICKUP") {
    return 24;
  }

  if (snapshot.status === "BOOKED") {
    return 14;
  }

  return 42;
}

function getLatestCoordinates(snapshot: ShipmentTrackingSnapshot) {
  return snapshot.timeline.find((event) => event.latitude && event.longitude) ?? null;
}

export function ShipmentLiveMap({ snapshot }: { snapshot: ShipmentTrackingSnapshot }) {
  const progress = getProgress(snapshot);
  const latestCoordinates = getLatestCoordinates(snapshot);
  const latestEvent = snapshot.timeline[0] ?? null;

  return (
    <div className="border-border bg-card shadow-panel overflow-hidden rounded-lg border">
      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="flex items-center gap-3">
          <div className="bg-accent/15 text-accent-foreground grid size-10 place-items-center rounded-md">
            <MapPinned aria-hidden="true" className="size-5" />
          </div>
          <div>
            <p className="font-semibold">Live route map</p>
            <p className="text-muted-foreground text-sm">
              {snapshot.originCity} to {snapshot.destinationCity}
            </p>
          </div>
        </div>
        <Badge variant="success">
          <Radio aria-hidden="true" className="size-3.5" />
          Live
        </Badge>
      </div>
      <div className="relative min-h-72 overflow-hidden bg-[linear-gradient(135deg,#e0f2fe_0%,#f8fafc_46%,#dcfce7_100%)] p-5">
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(15,23,42,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,.08)_1px,transparent_1px)] [background-size:38px_38px] opacity-60" />
        <div className="absolute top-8 left-8 rounded-full bg-white px-3 py-2 text-xs font-bold shadow-sm">
          {snapshot.originCity}
        </div>
        <div className="absolute right-8 bottom-8 rounded-full bg-white px-3 py-2 text-xs font-bold shadow-sm">
          {snapshot.destinationCity}
        </div>
        <div className="absolute top-1/2 right-14 left-14 h-1 -translate-y-1/2 rounded-full bg-slate-300">
          <div
            className="bg-accent h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
          style={{ left: `calc(3.5rem + (100% - 7rem) * ${progress / 100})` }}
        >
          <div className="bg-primary text-primary-foreground grid size-12 place-items-center rounded-full shadow-lg ring-4 ring-white">
            <Navigation aria-hidden="true" className="size-5" />
          </div>
        </div>
        <div className="absolute right-5 bottom-5 left-5 rounded-lg border border-white/70 bg-white/88 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">
                {latestEvent
                  ? formatTrackingEventType(latestEvent.eventType)
                  : "Awaiting first scan"}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {latestCoordinates
                  ? `GPS ${latestCoordinates.latitude}, ${latestCoordinates.longitude}`
                  : latestEvent?.currentLocation
                    ? latestEvent.currentLocation
                    : "No GPS coordinates yet. Showing route progress from manual shipment milestones."}
              </p>
            </div>
            <Badge variant="outline">{formatShipmentStatus(snapshot.status)}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
