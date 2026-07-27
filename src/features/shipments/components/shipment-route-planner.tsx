"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock3, MapPinned, Route, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ShipmentActionState, ShipmentRouteTrackingView } from "@/features/shipments/types";
import { initialShipmentActionState } from "@/features/shipments/types";

type ShipmentRoutePlannerProps = {
  action: (state: ShipmentActionState, formData: FormData) => Promise<ShipmentActionState>;
  clearAction: (state: ShipmentActionState, formData: FormData) => Promise<ShipmentActionState>;
  destination: string;
  manualProgressAction: (
    state: ShipmentActionState,
    formData: FormData,
  ) => Promise<ShipmentActionState>;
  origin: string;
  route: ShipmentRouteTrackingView | null;
};

function formatDistance(distanceMeters: number) {
  if (distanceMeters >= 1_000) {
    return `${(distanceMeters / 1_000).toFixed(1)} km`;
  }

  return `${distanceMeters} m`;
}

function formatDuration(totalSeconds: number | null) {
  if (totalSeconds === null) {
    return "Paused";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.ceil((totalSeconds % 3600) / 60);

  if (hours) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes} min`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Calculated when transit begins";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ShipmentRoutePlanner({
  action,
  clearAction,
  destination,
  manualProgressAction,
  origin,
  route,
}: ShipmentRoutePlannerProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, initialShipmentActionState);
  const [clearState, clearFormAction, isClearing] = useActionState(
    clearAction,
    initialShipmentActionState,
  );
  const [manualState, manualFormAction, isUpdatingManualProgress] = useActionState(
    manualProgressAction,
    initialShipmentActionState,
  );

  useEffect(() => {
    if (
      state.status === "success" ||
      clearState.status === "success" ||
      manualState.status === "success"
    ) {
      router.refresh();
    }
  }, [clearState.status, manualState.status, router, state.status]);

  const message = state.message ?? clearState.message ?? manualState.message;

  return (
    <div className="space-y-5">
      <div className="border-border bg-surface rounded-lg border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="bg-accent/15 text-accent-foreground grid size-10 place-items-center rounded-md">
              <Route aria-hidden="true" className="size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase">Road route</p>
              <p className="mt-1 font-semibold">
                {route ? "Route is ready" : "Calculate a road route"}
              </p>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                This uses road-routing estimates and scheduled route progress. It is not a hardware
                GPS feed.
              </p>
            </div>
          </div>
          {route ? (
            <Badge variant={route.state === "MOVING" ? "success" : "outline"}>
              {route.state.toLowerCase().replaceAll("_", " ")}
            </Badge>
          ) : null}
        </div>
      </div>

      {message ? (
        <p className="border-border bg-secondary text-secondary-foreground rounded-md border px-3 py-2 text-sm">
          {message}
        </p>
      ) : null}

      <form action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <Label htmlFor="route-origin">Origin</Label>
            <Input
              defaultValue={route?.origin.label ?? origin}
              id="route-origin"
              name="originQuery"
              required
            />
            <FieldHint>Use a full address, city, or airport for a more precise route.</FieldHint>
          </Field>
          <Field>
            <Label htmlFor="route-destination">Destination</Label>
            <Input
              defaultValue={route?.destination.label ?? destination}
              id="route-destination"
              name="destinationQuery"
              required
            />
            <FieldHint>
              Customers see the route only after it has been calculated and saved.
            </FieldHint>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <Label htmlFor="route-travel-mode">Travel mode</Label>
            <Select
              defaultValue={route?.travelMode ?? "DRIVING"}
              id="route-travel-mode"
              name="travelMode"
            >
              <option value="DRIVING">Driving</option>
              <option value="CYCLING">Cycling</option>
              <option value="WALKING">Walking</option>
            </Select>
          </Field>
          <Field>
            <Label htmlFor="route-simulation-mode">Progress mode</Label>
            <Select
              defaultValue={route?.simulationMode ?? "REALTIME"}
              id="route-simulation-mode"
              name="simulationMode"
            >
              <option value="REALTIME">Real-time schedule</option>
              <option value="ACCELERATED">Accelerated demonstration</option>
              <option value="MANUAL">Manual progress</option>
            </Select>
            <FieldHint>
              Use accelerated or manual mode only for a clearly labelled demonstration.
            </FieldHint>
          </Field>
        </div>
        <Button disabled={isPending} type="submit" variant="accent">
          <MapPinned aria-hidden="true" />
          {isPending
            ? "Calculating road route..."
            : route
              ? "Recalculate route"
              : "Calculate route"}
        </Button>
      </form>

      {route ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Distance", value: formatDistance(route.totalDistanceMeters) },
              { label: "Route time", value: formatDuration(route.totalDurationSeconds) },
              { label: "Remaining", value: formatDistance(route.remainingDistanceMeters) },
              { label: "ETA", value: formatDate(route.estimatedArrivalAt) },
            ].map((item) => (
              <div className="border-border bg-surface rounded-md border p-3" key={item.label}>
                <p className="text-muted-foreground text-xs font-semibold uppercase">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          {route.simulationMode === "MANUAL" ? (
            <form action={manualFormAction} className="border-border rounded-lg border p-4">
              <div className="flex flex-wrap items-end gap-3">
                <Field className="max-w-xs flex-1">
                  <Label htmlFor="route-progress">Manual route progress</Label>
                  <Input
                    defaultValue={route.progressPercent}
                    id="route-progress"
                    max="100"
                    min="0"
                    name="progressPercent"
                    step="0.1"
                    type="number"
                  />
                </Field>
                <Button disabled={isUpdatingManualProgress} type="submit" variant="outline">
                  <Clock3 aria-hidden="true" />
                  {isUpdatingManualProgress ? "Updating..." : "Set progress"}
                </Button>
              </div>
            </form>
          ) : null}

          <form action={clearFormAction}>
            <Button disabled={isClearing} type="submit" variant="ghost">
              <Trash2 aria-hidden="true" />
              {isClearing ? "Clearing route..." : "Clear route"}
            </Button>
          </form>
        </>
      ) : null}
    </div>
  );
}
