"use client";

import { useActionState, useEffect, useState } from "react";
import type { ShipmentStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CircleCheck,
  CirclePause,
  ClipboardCheck,
  MapPinned,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatShipmentStatus, formatTrackingEventType } from "@/features/shipments/status-labels";
import type { ShipmentActionState } from "@/features/shipments/types";
import { initialShipmentActionState } from "@/features/shipments/types";

const statusOptions = [
  "BOOKED",
  "PENDING_PICKUP",
  "IN_TRANSIT",
  "HELD",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;

const eventTypeOptions = [
  "CREATED",
  "PICKED_UP",
  "CHECKED_IN",
  "IN_TRANSIT",
  "CUSTOMS_HOLD",
  "DELAYED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "EXCEPTION",
] as const;

type ShipmentStatusOption = (typeof statusOptions)[number];
type TrackingEventOption = (typeof eventTypeOptions)[number];

const statusGuidance: Record<ShipmentStatusOption, string> = {
  BOOKED: "Shipment is registered and ready for its first operations step.",
  PENDING_PICKUP: "Shipment is waiting for collection or release from the current facility.",
  IN_TRANSIT: "Shipment is actively moving between checkpoints.",
  HELD: "Movement is temporarily paused while Apex operations reviews the next step.",
  DELIVERED: "Use only after the recipient handoff is complete.",
  CANCELLED: "Movement is stopped and the customer should contact support for assistance.",
  RETURNED: "Shipment is returning to the sender.",
};

const defaultEventByStatus: Record<ShipmentStatusOption, TrackingEventOption> = {
  BOOKED: "CREATED",
  CANCELLED: "CANCELLED",
  DELIVERED: "DELIVERED",
  HELD: "EXCEPTION",
  IN_TRANSIT: "IN_TRANSIT",
  PENDING_PICKUP: "CHECKED_IN",
  RETURNED: "EXCEPTION",
};

const commonUpdates = [
  {
    eventType: "CREATED",
    icon: ClipboardCheck,
    label: "Order confirmed",
    status: "BOOKED",
  },
  {
    eventType: "PICKED_UP",
    icon: Truck,
    label: "Picked up",
    status: "PENDING_PICKUP",
  },
  {
    eventType: "IN_TRANSIT",
    icon: Truck,
    label: "In transit",
    status: "IN_TRANSIT",
  },
  {
    eventType: "EXCEPTION",
    icon: CirclePause,
    label: "Place on hold",
    status: "HELD",
  },
  {
    eventType: "OUT_FOR_DELIVERY",
    icon: Truck,
    label: "Out for delivery",
    status: "IN_TRANSIT",
  },
  {
    eventType: "DELIVERED",
    icon: CircleCheck,
    label: "Delivered",
    status: "DELIVERED",
  },
] as const;

export function ShipmentStatusForm({
  action,
  currentStatus,
}: {
  action: (state: ShipmentActionState, formData: FormData) => Promise<ShipmentActionState>;
  currentStatus: ShipmentStatus;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, initialShipmentActionState);
  const initialStatus = statusOptions.includes(currentStatus as ShipmentStatusOption)
    ? (currentStatus as ShipmentStatusOption)
    : "BOOKED";
  const [selectedStatus, setSelectedStatus] = useState<ShipmentStatusOption>(initialStatus);
  const [selectedEventType, setSelectedEventType] = useState<TrackingEventOption>(
    defaultEventByStatus[initialStatus],
  );

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  function chooseUpdate(status: ShipmentStatusOption, eventType: TrackingEventOption) {
    setSelectedStatus(status);
    setSelectedEventType(eventType);
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="border-border bg-surface rounded-lg border p-4">
        <p className="text-muted-foreground text-xs font-semibold uppercase">
          Current shipment status
        </p>
        <p className="mt-2 text-lg font-semibold">{formatShipmentStatus(currentStatus)}</p>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          Pick the new customer-facing stage, tell the customer where the shipment is, then publish.
        </p>
      </div>

      {state.message ? (
        <p className="border-border bg-secondary text-secondary-foreground rounded-md border px-3 py-2 text-sm">
          {state.message}
        </p>
      ) : null}

      <div>
        <p className="text-sm font-semibold">1. Choose an update</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {commonUpdates.map((update) => (
            <Button
              aria-pressed={
                selectedStatus === update.status && selectedEventType === update.eventType
              }
              className="h-auto min-h-12 justify-start px-3 py-3 text-left"
              key={update.label}
              onClick={() => chooseUpdate(update.status, update.eventType)}
              type="button"
              variant={
                selectedStatus === update.status && selectedEventType === update.eventType
                  ? "secondary"
                  : "outline"
              }
            >
              <update.icon aria-hidden="true" className="size-4 shrink-0" />
              <span>{update.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        <Field>
          <Label htmlFor="location">2. Where is the shipment now?</Label>
          <Input
            id="location"
            name="location"
            placeholder="City, airport, warehouse, checkpoint, or delivery area"
          />
          <FieldHint>
            Enter a city, airport, warehouse, landmark, or full address. When you publish, Apex uses
            Google Maps to save a map pin automatically when coordinates are left blank.
          </FieldHint>
        </Field>
        <Field>
          <Label htmlFor="message">3. What should the customer know?</Label>
          <Textarea
            id="message"
            name="message"
            placeholder="Example: Shipment checked in at the Dallas care facility and is awaiting the next scheduled departure."
            required
          />
          <FieldHint>
            Write one direct sentence that explains the checkpoint or next step.
          </FieldHint>
        </Field>
      </div>

      <details className="border-border rounded-md border">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold">
          <span className="flex items-center gap-2">
            <MapPinned aria-hidden="true" className="text-accent size-4" />
            More tracking options
          </span>
          <span className="text-muted-foreground text-xs font-normal">
            Custom event, date, or coordinate override
          </span>
        </summary>
        <div className="border-border grid gap-4 border-t p-4 sm:grid-cols-2">
          <Field>
            <Label htmlFor="status">Customer-visible status</Label>
            <Select
              id="status"
              name="status"
              onChange={(event) => {
                const nextStatus = event.target.value as ShipmentStatusOption;
                setSelectedStatus(nextStatus);
                setSelectedEventType(defaultEventByStatus[nextStatus]);
              }}
              required
              value={selectedStatus}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {formatShipmentStatus(option)}
                </option>
              ))}
            </Select>
            <FieldHint>{statusGuidance[selectedStatus]}</FieldHint>
          </Field>
          <Field>
            <Label htmlFor="eventType">Timeline event</Label>
            <Select
              id="eventType"
              name="eventType"
              onChange={(event) => setSelectedEventType(event.target.value as TrackingEventOption)}
              required
              value={selectedEventType}
            >
              {eventTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {formatTrackingEventType(option)}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="occurredAt">Date and time (optional)</Label>
            <Input id="occurredAt" name="occurredAt" type="datetime-local" />
            <FieldHint>Leave blank to use the current time.</FieldHint>
          </Field>
          <div className="hidden sm:block" />
          <Field>
            <Label htmlFor="latitude">Verified map latitude (optional)</Label>
            <Input
              id="latitude"
              name="latitude"
              placeholder="GPS latitude"
              step="0.000001"
              type="number"
            />
          </Field>
          <Field>
            <Label htmlFor="longitude">Verified map longitude (optional)</Label>
            <Input
              id="longitude"
              name="longitude"
              placeholder="GPS longitude"
              step="0.000001"
              type="number"
            />
          </Field>
          <p className="text-muted-foreground text-xs leading-5 sm:col-span-2">
            Leave both coordinates blank to let Google Maps resolve the location field
            automatically. Enter both only when operations has a verified GPS point to override the
            result.
          </p>
        </div>
      </details>

      <Button disabled={isPending} type="submit" variant="accent">
        {isPending ? "Publishing update..." : "Publish tracking update"}
        <ArrowRight aria-hidden="true" />
      </Button>
    </form>
  );
}
