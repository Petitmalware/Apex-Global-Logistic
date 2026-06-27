"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import type {
  ShipmentTrackingSnapshot,
  ShipmentTrackingTimelineEvent,
} from "@/features/shipments/types";

type RealtimeShipmentTimelineProps = {
  initialTimeline: ShipmentTrackingTimelineEvent[];
  shipmentId: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function RealtimeShipmentTimeline({
  initialTimeline,
  shipmentId,
}: RealtimeShipmentTimelineProps) {
  const [timeline, setTimeline] = useState(initialTimeline);
  const [state, setState] = useState<"live" | "reconnecting">("live");

  useEffect(() => {
    setTimeline(initialTimeline);
  }, [initialTimeline]);

  useEffect(() => {
    const source = new EventSource(`/api/shipments/${shipmentId}/tracking/stream`);

    source.addEventListener("open", () => {
      setState("live");
    });
    source.addEventListener("snapshot", (event) => {
      const snapshot = JSON.parse((event as MessageEvent).data) as ShipmentTrackingSnapshot;
      setTimeline(snapshot.timeline);
      setState("live");
    });
    source.addEventListener("error", () => {
      setState("reconnecting");
    });

    return () => {
      source.close();
    };
  }, [shipmentId]);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Badge variant={state === "live" ? "success" : "warning"}>
          {state === "live" ? "Live" : "Reconnecting"}
        </Badge>
      </div>
      {timeline.length ? (
        timeline.map((event) => (
          <div className="flex gap-4" key={event.id}>
            <div className="flex flex-col items-center">
              <span className="bg-accent size-3 rounded-full" />
              <span className="bg-border mt-2 h-full w-px" />
            </div>
            <div className="min-w-0 flex-1 pb-5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{event.eventType.replaceAll("_", " ")}</p>
                {event.shipmentStatus ? (
                  <Badge variant="outline">{event.shipmentStatus.replaceAll("_", " ")}</Badge>
                ) : null}
              </div>
              <p className="text-muted-foreground mt-1 text-sm">{formatDate(event.occurredAt)}</p>
              {event.message ? <p className="mt-2 text-sm leading-6">{event.message}</p> : null}
              <p className="text-muted-foreground mt-2 text-xs">
                {event.recordedBy ? `Recorded by ${event.recordedBy}` : "System event"}
                {event.packageNumber ? ` - ${event.packageNumber}` : ""}
              </p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-muted-foreground text-sm">No tracking events yet.</p>
      )}
    </div>
  );
}
