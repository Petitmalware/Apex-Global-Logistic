"use client";

import Link from "next/link";
import type { Route } from "next";
import { useActionState } from "react";
import { ArrowRight, Route as RouteIcon, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  FreightTransportActionState,
  FreightTransportDetail,
} from "@/features/freight-transport/types";
import { initialFreightTransportActionState } from "@/features/freight-transport/types";

type FreightTransportFormProps = {
  action: (
    state: FreightTransportActionState,
    formData: FormData,
  ) => Promise<FreightTransportActionState>;
  cancelHref: Route | string;
  initialFreightTransport?: FreightTransportDetail;
  mode: "create" | "edit";
};

function toDateTimeLocal(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

  return date.toISOString().slice(0, 16);
}

function AddressFields({ prefix, title }: { prefix: "destination" | "origin"; title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor={`${prefix}.name`}>Contact or facility</Label>
          <Input id={`${prefix}.name`} name={`${prefix}.name`} placeholder="Apex freight yard" />
        </Field>
        <Field>
          <Label htmlFor={`${prefix}.countryCode`}>Country code</Label>
          <Input
            id={`${prefix}.countryCode`}
            maxLength={2}
            name={`${prefix}.countryCode`}
            placeholder="US"
            required
          />
        </Field>
        <Field className="sm:col-span-2">
          <Label htmlFor={`${prefix}.line1`}>Address line 1</Label>
          <Input id={`${prefix}.line1`} name={`${prefix}.line1`} required />
        </Field>
        <Field className="sm:col-span-2">
          <Label htmlFor={`${prefix}.line2`}>Address line 2</Label>
          <Input id={`${prefix}.line2`} name={`${prefix}.line2`} />
        </Field>
        <Field>
          <Label htmlFor={`${prefix}.city`}>City</Label>
          <Input id={`${prefix}.city`} name={`${prefix}.city`} required />
        </Field>
        <Field>
          <Label htmlFor={`${prefix}.state`}>State / region</Label>
          <Input id={`${prefix}.state`} name={`${prefix}.state`} />
        </Field>
        <Field>
          <Label htmlFor={`${prefix}.postalCode`}>Postal code</Label>
          <Input id={`${prefix}.postalCode`} name={`${prefix}.postalCode`} />
        </Field>
      </CardContent>
    </Card>
  );
}

function ShipmentPlanFields() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipment plan</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field>
          <Label htmlFor="referenceNumber">Reference number</Label>
          <Input id="referenceNumber" name="referenceNumber" placeholder="Optional" />
        </Field>
        <Field>
          <Label htmlFor="serviceLevel">Service level</Label>
          <Input id="serviceLevel" name="serviceLevel" placeholder="Long-haul Freight" />
        </Field>
        <Field>
          <Label htmlFor="priority">Priority</Label>
          <Select defaultValue="STANDARD" id="priority" name="priority">
            <option value="STANDARD">Standard</option>
            <option value="EXPEDITED">Expedited</option>
            <option value="URGENT">Urgent</option>
          </Select>
        </Field>
        <Field>
          <Label htmlFor="mode">Transport mode</Label>
          <Select defaultValue="ROAD" id="mode" name="mode">
            <option value="ROAD">Road</option>
            <option value="RAIL">Rail</option>
            <option value="SEA">Sea</option>
            <option value="AIR">Air</option>
            <option value="MULTIMODAL">Multimodal</option>
          </Select>
        </Field>
        <Field>
          <Label htmlFor="pickupWindowStart">Pickup starts</Label>
          <Input id="pickupWindowStart" name="pickupWindowStart" type="datetime-local" />
        </Field>
        <Field>
          <Label htmlFor="pickupWindowEnd">Pickup ends</Label>
          <Input id="pickupWindowEnd" name="pickupWindowEnd" type="datetime-local" />
        </Field>
        <Field>
          <Label htmlFor="deliveryWindowStart">Delivery starts</Label>
          <Input id="deliveryWindowStart" name="deliveryWindowStart" type="datetime-local" />
        </Field>
        <Field>
          <Label htmlFor="deliveryWindowEnd">Delivery ends</Label>
          <Input id="deliveryWindowEnd" name="deliveryWindowEnd" type="datetime-local" />
        </Field>
        <Field className="sm:col-span-2">
          <Label htmlFor="notes">Shipment notes</Label>
          <Textarea id="notes" name="notes" placeholder="Carrier, route, border, or relay notes" />
        </Field>
      </CardContent>
    </Card>
  );
}

export function FreightTransportForm({
  action,
  cancelHref,
  initialFreightTransport,
  mode,
}: FreightTransportFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialFreightTransportActionState);
  const isEdit = mode === "edit";

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? (
        <p className="border-border bg-secondary text-secondary-foreground rounded-md border px-3 py-2 text-sm">
          {state.message}
        </p>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-start gap-3">
          <div className="bg-accent/15 text-accent-foreground grid size-10 place-items-center rounded-md">
            <Truck aria-hidden="true" className="size-5" />
          </div>
          <div>
            <CardTitle>Freight profile</CardTitle>
            <FieldHint>
              Commodity, cargo class, long-haul handling, and compliance details.
            </FieldHint>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field>
            <Label htmlFor="freightType">Freight type</Label>
            <Select
              defaultValue={initialFreightTransport?.freightType ?? "FTL"}
              id="freightType"
              name="freightType"
            >
              <option value="FTL">Full truckload</option>
              <option value="LTL">Less than truckload</option>
              <option value="CONTAINER">Container</option>
              <option value="OVERSIZED">Oversized</option>
              <option value="HAZMAT">Hazmat</option>
              <option value="REFRIGERATED">Refrigerated</option>
              <option value="FLATBED">Flatbed</option>
              <option value="OTHER">Other</option>
            </Select>
          </Field>
          <Field>
            <Label htmlFor="status">Freight status</Label>
            <Select
              defaultValue={initialFreightTransport?.status ?? "REQUESTED"}
              id="status"
              name="status"
            >
              <option value="REQUESTED">Requested</option>
              <option value="PLANNED">Planned</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="LOADING">Loading</option>
              <option value="IN_TRANSIT">In transit</option>
              <option value="ON_HOLD">On hold</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </Field>
          <Field>
            <Label htmlFor="incoterm">Incoterm</Label>
            <Input
              id="incoterm"
              name="incoterm"
              placeholder="EXW, FOB, DDP"
              defaultValue={initialFreightTransport?.incoterm ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="commodityCode">Commodity code</Label>
            <Input
              id="commodityCode"
              name="commodityCode"
              defaultValue={initialFreightTransport?.commodityCode ?? ""}
            />
          </Field>
          <Field className="sm:col-span-2">
            <Label htmlFor="commodityDescription">Commodity description</Label>
            <Input
              id="commodityDescription"
              name="commodityDescription"
              placeholder="Industrial parts, retail pallets, vehicle shipment..."
              defaultValue={initialFreightTransport?.commodityDescription ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="grossWeightKg">Gross weight kg</Label>
            <Input
              id="grossWeightKg"
              min="0"
              name="grossWeightKg"
              step="0.001"
              type="number"
              defaultValue={initialFreightTransport?.grossWeightKg ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="volumeCbm">Volume cbm</Label>
            <Input
              id="volumeCbm"
              min="0"
              name="volumeCbm"
              step="0.001"
              type="number"
              defaultValue={initialFreightTransport?.volumeCbm ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="palletCount">Pallet count</Label>
            <Input
              id="palletCount"
              min="0"
              name="palletCount"
              type="number"
              defaultValue={initialFreightTransport?.palletCount ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="containerNumber">Container number</Label>
            <Input
              id="containerNumber"
              name="containerNumber"
              defaultValue={initialFreightTransport?.containerNumber ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="sealNumber">Seal number</Label>
            <Input
              id="sealNumber"
              name="sealNumber"
              defaultValue={initialFreightTransport?.sealNumber ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="hazmatClass">Hazmat class</Label>
            <Input
              id="hazmatClass"
              name="hazmatClass"
              defaultValue={initialFreightTransport?.hazmatClass ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="unNumber">UN number</Label>
            <Input
              id="unNumber"
              name="unNumber"
              defaultValue={initialFreightTransport?.unNumber ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="temperatureMinC">Temp min C</Label>
            <Input
              id="temperatureMinC"
              name="temperatureMinC"
              step="0.01"
              type="number"
              defaultValue={initialFreightTransport?.temperatureMinC ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="temperatureMaxC">Temp max C</Label>
            <Input
              id="temperatureMaxC"
              name="temperatureMaxC"
              step="0.01"
              type="number"
              defaultValue={initialFreightTransport?.temperatureMaxC ?? ""}
            />
          </Field>
          <label className="flex items-center gap-2 pt-6 text-sm font-medium">
            <input
              defaultChecked={initialFreightTransport?.refrigeratedRequired ?? false}
              name="refrigeratedRequired"
              type="checkbox"
            />
            Refrigerated required
          </label>
          <Field className="sm:col-span-2 lg:col-span-3">
            <Label htmlFor="specialInstructions">Special instructions</Label>
            <Textarea
              id="specialInstructions"
              name="specialInstructions"
              defaultValue={initialFreightTransport?.specialInstructions ?? ""}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start gap-3">
          <div className="bg-info/10 text-info grid size-10 place-items-center rounded-md">
            <RouteIcon aria-hidden="true" className="size-5" />
          </div>
          <div>
            <CardTitle>Route and ETA</CardTitle>
            <FieldHint>
              ETA is calculated from planned departure plus duration, or distance divided by average
              speed when no arrival time is provided.
            </FieldHint>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field>
            <Label htmlFor="routeName">Route name</Label>
            <Input
              id="routeName"
              name="routeName"
              placeholder="Lagos to Accra corridor"
              defaultValue={initialFreightTransport?.routeName ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="routeCode">Route code</Label>
            <Input
              id="routeCode"
              name="routeCode"
              placeholder="RTE-WA-014"
              defaultValue={initialFreightTransport?.routeCode ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="distanceKm">Distance km</Label>
            <Input
              id="distanceKm"
              min="0"
              name="distanceKm"
              step="0.001"
              type="number"
              defaultValue={initialFreightTransport?.distanceKm ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="averageSpeedKph">Average speed kph</Label>
            <Input
              id="averageSpeedKph"
              min="0"
              name="averageSpeedKph"
              step="0.01"
              type="number"
              defaultValue={initialFreightTransport?.averageSpeedKph ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="estimatedDurationHours">Duration hours</Label>
            <Input
              id="estimatedDurationHours"
              min="0"
              name="estimatedDurationHours"
              type="number"
              defaultValue={initialFreightTransport?.estimatedDurationHours ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="plannedDepartureAt">Planned departure</Label>
            <Input
              id="plannedDepartureAt"
              name="plannedDepartureAt"
              type="datetime-local"
              defaultValue={toDateTimeLocal(initialFreightTransport?.plannedDepartureAt)}
            />
          </Field>
          <Field>
            <Label htmlFor="plannedArrivalAt">Planned arrival</Label>
            <Input
              id="plannedArrivalAt"
              name="plannedArrivalAt"
              type="datetime-local"
              defaultValue={toDateTimeLocal(initialFreightTransport?.plannedArrivalAt)}
            />
          </Field>
          <Field>
            <Label htmlFor="actualDepartureAt">Actual departure</Label>
            <Input
              id="actualDepartureAt"
              name="actualDepartureAt"
              type="datetime-local"
              defaultValue={toDateTimeLocal(initialFreightTransport?.actualDepartureAt)}
            />
          </Field>
          <Field>
            <Label htmlFor="actualArrivalAt">Actual arrival</Label>
            <Input
              id="actualArrivalAt"
              name="actualArrivalAt"
              type="datetime-local"
              defaultValue={toDateTimeLocal(initialFreightTransport?.actualArrivalAt)}
            />
          </Field>
          <Field>
            <Label htmlFor="originTerminal">Origin terminal</Label>
            <Input
              id="originTerminal"
              name="originTerminal"
              defaultValue={initialFreightTransport?.originTerminal ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="destinationTerminal">Destination terminal</Label>
            <Input
              id="destinationTerminal"
              name="destinationTerminal"
              defaultValue={initialFreightTransport?.destinationTerminal ?? ""}
            />
          </Field>
        </CardContent>
      </Card>

      {!isEdit ? (
        <>
          <ShipmentPlanFields />
          <div className="grid gap-6 lg:grid-cols-2">
            <AddressFields prefix="origin" title="Pickup address" />
            <AddressFields prefix="destination" title="Delivery address" />
          </div>
        </>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        <Button asChild variant="outline">
          <Link href={cancelHref as Route}>Cancel</Link>
        </Button>
        <Button disabled={isPending} type="submit" variant="accent">
          {isPending ? "Saving..." : isEdit ? "Save freight" : "Book freight"}
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}
