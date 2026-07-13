"use client";

import { useActionState, useState } from "react";
import type { ShipmentStatus } from "@prisma/client";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldHint } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  BOOKED: "Use when the shipment has been created but pickup has not started.",
  PENDING_PICKUP: "Use when the shipment is waiting for collection from the sender or facility.",
  IN_TRANSIT: "Use when the package, pet, or freight is actively moving between checkpoints.",
  HELD: "Use when movement is paused for review, documents, customs, care, or payment handling.",
  DELIVERED: "Use only when the shipment has been handed over to the recipient.",
  CANCELLED: "Use when the shipment will not continue and the customer should contact support.",
  RETURNED: "Use when the shipment is being sent back to the sender.",
};

const eventGuidance: Record<TrackingEventOption, string> = {
  CREATED: "A new shipment record was opened.",
  PICKED_UP: "The shipment was collected from the sender or pickup location.",
  CHECKED_IN: "The shipment arrived at a warehouse, hub, checkpoint, clinic, or care facility.",
  IN_TRANSIT: "The shipment departed a checkpoint and is moving toward the next stop.",
  CUSTOMS_HOLD: "Customs or compliance review is delaying movement.",
  DELAYED: "Use when timing changed but the shipment is still active.",
  OUT_FOR_DELIVERY: "The shipment is on the final route to the recipient.",
  DELIVERED: "The shipment was delivered and signed or confirmed.",
  CANCELLED: "The movement has stopped permanently.",
  EXCEPTION: "Use for anything that needs extra customer or operations attention.",
};

export function ShipmentStatusForm({
  action,
  currentStatus,
}: {
  action: (state: ShipmentActionState, formData: FormData) => Promise<ShipmentActionState>;
  currentStatus: ShipmentStatus;
}) {
  const [state, formAction, isPending] = useActionState(action, initialShipmentActionState);
  const initialStatus = statusOptions.includes(currentStatus as ShipmentStatusOption)
    ? (currentStatus as ShipmentStatusOption)
    : "BOOKED";
  const [selectedStatus, setSelectedStatus] = useState<ShipmentStatusOption>(initialStatus);
  const [selectedEventType, setSelectedEventType] = useState<TrackingEventOption>("CREATED");

  return (
    <form action={formAction} className="space-y-4">
      <div className="border-border bg-surface rounded-lg border p-4">
        <p className="font-semibold">Current status: {formatShipmentStatus(currentStatus)}</p>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          Use this panel to add a new customer-facing checkpoint, delivery note, or manual location
          update when the map is not available.
        </p>
      </div>
      <div className="border-border bg-surface rounded-lg border p-4">
        <p className="text-sm font-semibold">What this update does</p>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          Status controls the customer-facing shipment state. Timeline event explains what happened
          at this checkpoint. Add the clearest location and one practical note so the customer knows
          whether they should wait, contact support, or expect delivery.
        </p>
      </div>
      {state.message ? (
        <p className="border-border bg-secondary text-secondary-foreground rounded-md border px-3 py-2 text-sm">
          {state.message}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="status">Customer-visible shipment status</Label>
          <Select
            id="status"
            name="status"
            onChange={(event) => setSelectedStatus(event.target.value as ShipmentStatusOption)}
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
          <Label htmlFor="eventType">Timeline event that happened</Label>
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
          <FieldHint>{eventGuidance[selectedEventType]}</FieldHint>
        </Field>
      </div>
      <Field>
        <Label htmlFor="occurredAt">When this happened</Label>
        <Input id="occurredAt" name="occurredAt" type="datetime-local" />
        <FieldHint>Leave blank to use the current time.</FieldHint>
      </Field>
      <Field>
        <Label htmlFor="location">Current customer-facing location</Label>
        <Input
          id="location"
          name="location"
          placeholder="Memphis animal care facility, customs hold, driver handoff..."
        />
        <FieldHint>
          Use a city, hub, facility, airport, checkpoint, or driver handoff point the customer can
          recognize.
        </FieldHint>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="latitude">Map latitude</Label>
          <Input
            id="latitude"
            name="latitude"
            placeholder="Optional GPS"
            step="0.000001"
            type="number"
          />
          <FieldHint>Optional. Add this only when the map position is known.</FieldHint>
        </Field>
        <Field>
          <Label htmlFor="longitude">Map longitude</Label>
          <Input
            id="longitude"
            name="longitude"
            placeholder="Optional GPS"
            step="0.000001"
            type="number"
          />
          <FieldHint>Optional. Pair this with latitude for live map placement.</FieldHint>
        </Field>
      </div>
      <Field>
        <Label htmlFor="message">Customer update message</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="Example: Puppy checked in by handler and resting in climate-controlled crate."
          required
        />
        <FieldHint>
          Write one clear sentence. Example: Your pet has arrived at the Dallas care checkpoint and
          is resting in a climate-controlled crate before the next route.
        </FieldHint>
      </Field>
      <Button disabled={isPending} type="submit" variant="accent">
        {isPending ? "Updating..." : "Update status"}
        <ArrowRight aria-hidden="true" />
      </Button>
    </form>
  );
}
