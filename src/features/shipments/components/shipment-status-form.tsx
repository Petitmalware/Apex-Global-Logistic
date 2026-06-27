"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
];

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
];

export function ShipmentStatusForm({
  action,
}: {
  action: (state: ShipmentActionState, formData: FormData) => Promise<ShipmentActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, initialShipmentActionState);

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? (
        <p className="border-border bg-secondary text-secondary-foreground rounded-md border px-3 py-2 text-sm">
          {state.message}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="status">New status</Label>
          <Select id="status" name="status" required>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="eventType">Timeline event</Label>
          <Select id="eventType" name="eventType" required>
            {eventTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field>
        <Label htmlFor="occurredAt">Occurred at</Label>
        <Input id="occurredAt" name="occurredAt" type="datetime-local" />
      </Field>
      <Field>
        <Label htmlFor="message">Timeline note</Label>
        <Textarea id="message" name="message" required />
      </Field>
      <Button disabled={isPending} type="submit" variant="accent">
        {isPending ? "Updating..." : "Update status"}
        <ArrowRight aria-hidden="true" />
      </Button>
    </form>
  );
}
