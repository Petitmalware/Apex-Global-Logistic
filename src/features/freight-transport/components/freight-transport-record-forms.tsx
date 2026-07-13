"use client";

import { useActionState } from "react";
import { Boxes, ClipboardCheck, Container, FilePlus2, Radar, Route, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  FreightDispatchOptions,
  FreightTransportActionState,
  FreightTransportDetail,
} from "@/features/freight-transport/types";
import { initialFreightTransportActionState } from "@/features/freight-transport/types";

type RecordAction = (
  state: FreightTransportActionState,
  formData: FormData,
) => Promise<FreightTransportActionState>;

function localDateTimeValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

  return date.toISOString().slice(0, 16);
}

function FormMessage({ state }: { state: FreightTransportActionState }) {
  return state.message ? (
    <p className="border-border bg-secondary text-secondary-foreground rounded-md border px-3 py-2 text-sm">
      {state.message}
    </p>
  ) : null;
}

function CargoStatusSelect({ id }: { id: string }) {
  return (
    <Select defaultValue="PLANNED" id={id} name="status">
      <option value="PLANNED">Planned</option>
      <option value="LOADED">Loaded</option>
      <option value="IN_TRANSIT">In transit</option>
      <option value="DELIVERED">Delivered</option>
      <option value="DAMAGED">Damaged</option>
      <option value="HELD">Held</option>
    </Select>
  );
}

export function FreightDispatchForm({
  action,
  options,
}: {
  action: RecordAction;
  options: FreightDispatchOptions;
}) {
  const [state, formAction, isPending] = useActionState(action, initialFreightTransportActionState);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="dispatch-driver">Driver</Label>
          <Select id="dispatch-driver" name="driverId">
            <option value="">Unassigned</option>
            {options.drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="dispatch-vehicle">Vehicle</Label>
          <Select id="dispatch-vehicle" name="vehicleId">
            <option value="">Unassigned</option>
            {options.vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field>
        <Label htmlFor="dispatch-status">Dispatch status</Label>
        <Select defaultValue="ASSIGNED" id="dispatch-status" name="status">
          <option value="ASSIGNED">Assigned</option>
          <option value="LOADING">Loading</option>
          <option value="IN_TRANSIT">In transit</option>
          <option value="ON_HOLD">On hold</option>
          <option value="DELIVERED">Delivered</option>
        </Select>
      </Field>
      <Field>
        <Label htmlFor="dispatch-message">Dispatch note</Label>
        <Textarea id="dispatch-message" name="message" />
      </Field>
      <Button disabled={isPending} type="submit" variant="outline">
        <ClipboardCheck aria-hidden="true" />
        {isPending ? "Updating..." : "Update dispatch"}
      </Button>
    </form>
  );
}

export function CargoItemForm({
  action,
  containers,
}: {
  action: RecordAction;
  containers: FreightTransportDetail["containers"];
}) {
  const [state, formAction, isPending] = useActionState(action, initialFreightTransportActionState);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      <Field>
        <Label htmlFor="cargo-description">Description</Label>
        <Input id="cargo-description" name="description" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="cargo-type">Cargo type</Label>
          <Input id="cargo-type" name="cargoType" placeholder="Pallets, cartons, coils..." />
        </Field>
        <Field>
          <Label htmlFor="cargo-container">Container</Label>
          <Select id="cargo-container" name="containerId">
            <option value="">No container</option>
            {containers.map((container) => (
              <option key={container.id} value={container.id}>
                {container.containerNumber}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <Label htmlFor="cargo-quantity">Quantity</Label>
          <Input
            defaultValue="1"
            id="cargo-quantity"
            min="1"
            name="quantity"
            required
            type="number"
          />
        </Field>
        <Field>
          <Label htmlFor="cargo-unit">Unit</Label>
          <Input defaultValue="pieces" id="cargo-unit" name="unit" />
        </Field>
        <Field>
          <Label htmlFor="cargo-status">Status</Label>
          <CargoStatusSelect id="cargo-status" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <Label htmlFor="cargo-weight">Weight kg</Label>
          <Input id="cargo-weight" min="0" name="weightKg" step="0.001" type="number" />
        </Field>
        <Field>
          <Label htmlFor="cargo-volume">Volume cbm</Label>
          <Input id="cargo-volume" min="0" name="volumeCbm" step="0.001" type="number" />
        </Field>
        <Field>
          <Label htmlFor="cargo-value">Declared value</Label>
          <Input id="cargo-value" min="0" name="declaredValue" step="0.01" type="number" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <Label htmlFor="cargo-length">Length cm</Label>
          <Input id="cargo-length" min="0" name="lengthCm" step="0.001" type="number" />
        </Field>
        <Field>
          <Label htmlFor="cargo-width">Width cm</Label>
          <Input id="cargo-width" min="0" name="widthCm" step="0.001" type="number" />
        </Field>
        <Field>
          <Label htmlFor="cargo-height">Height cm</Label>
          <Input id="cargo-height" min="0" name="heightCm" step="0.001" type="number" />
        </Field>
      </div>
      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input name="hazardous" type="checkbox" />
          Hazardous
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input defaultChecked name="stackable" type="checkbox" />
          Stackable
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input name="temperatureControlled" type="checkbox" />
          Temperature controlled
        </label>
      </div>
      <Button disabled={isPending} type="submit" variant="outline">
        <Boxes aria-hidden="true" />
        {isPending ? "Adding..." : "Add cargo"}
      </Button>
    </form>
  );
}

export function FreightContainerForm({ action }: { action: RecordAction }) {
  const [state, formAction, isPending] = useActionState(action, initialFreightTransportActionState);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="container-number">Container number</Label>
          <Input id="container-number" name="containerNumber" required />
        </Field>
        <Field>
          <Label htmlFor="container-type">Container type</Label>
          <Input id="container-type" name="containerType" placeholder="40HC, reefer, flat rack" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="container-seal">Seal number</Label>
          <Input id="container-seal" name="sealNumber" />
        </Field>
        <Field>
          <Label htmlFor="container-status">Status</Label>
          <Select defaultValue="ASSIGNED" id="container-status" name="status">
            <option value="ASSIGNED">Assigned</option>
            <option value="SEALED">Sealed</option>
            <option value="LOADED">Loaded</option>
            <option value="IN_TRANSIT">In transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="RELEASED">Released</option>
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <Label htmlFor="container-tare">Tare kg</Label>
          <Input id="container-tare" min="0" name="tareWeightKg" step="0.001" type="number" />
        </Field>
        <Field>
          <Label htmlFor="container-max">Max gross kg</Label>
          <Input id="container-max" min="0" name="maxGrossWeightKg" step="0.001" type="number" />
        </Field>
        <Field>
          <Label htmlFor="container-current">Current kg</Label>
          <Input id="container-current" min="0" name="currentWeightKg" step="0.001" type="number" />
        </Field>
      </div>
      <Button disabled={isPending} type="submit" variant="outline">
        <Container aria-hidden="true" />
        {isPending ? "Adding..." : "Add container"}
      </Button>
    </form>
  );
}

export function MachineryItemForm({ action }: { action: RecordAction }) {
  const [state, formAction, isPending] = useActionState(action, initialFreightTransportActionState);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      <Field>
        <Label htmlFor="machinery-name">Machine name</Label>
        <Input id="machinery-name" name="name" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <Label htmlFor="machinery-manufacturer">Manufacturer</Label>
          <Input id="machinery-manufacturer" name="manufacturer" />
        </Field>
        <Field>
          <Label htmlFor="machinery-model">Model</Label>
          <Input id="machinery-model" name="model" />
        </Field>
        <Field>
          <Label htmlFor="machinery-serial">Serial number</Label>
          <Input id="machinery-serial" name="serialNumber" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <Label htmlFor="machinery-weight">Weight kg</Label>
          <Input
            id="machinery-weight"
            min="0"
            name="operatingWeightKg"
            step="0.001"
            type="number"
          />
        </Field>
        <Field>
          <Label htmlFor="machinery-condition">Condition</Label>
          <Input id="machinery-condition" name="condition" />
        </Field>
        <Field>
          <Label htmlFor="machinery-status">Status</Label>
          <CargoStatusSelect id="machinery-status" />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input name="oversizePermitRequired" type="checkbox" />
        Oversize permit required
      </label>
      <Field>
        <Label htmlFor="machinery-loading">Loading instructions</Label>
        <Textarea id="machinery-loading" name="loadingInstructions" />
      </Field>
      <Button disabled={isPending} type="submit" variant="outline">
        <Truck aria-hidden="true" />
        {isPending ? "Adding..." : "Add machinery"}
      </Button>
    </form>
  );
}

export function VehicleCargoForm({ action }: { action: RecordAction }) {
  const [state, formAction, isPending] = useActionState(action, initialFreightTransportActionState);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="vehicle-make">Make</Label>
          <Input id="vehicle-make" name="make" required />
        </Field>
        <Field>
          <Label htmlFor="vehicle-model">Model</Label>
          <Input id="vehicle-model" name="model" required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <Label htmlFor="vehicle-year">Year</Label>
          <Input id="vehicle-year" min="0" name="year" type="number" />
        </Field>
        <Field>
          <Label htmlFor="vehicle-vin">VIN</Label>
          <Input id="vehicle-vin" name="vin" />
        </Field>
        <Field>
          <Label htmlFor="vehicle-plate">Plate</Label>
          <Input id="vehicle-plate" name="plateNumber" />
        </Field>
      </div>
      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input defaultChecked name="operable" type="checkbox" />
          Operable
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input defaultChecked name="keysAvailable" type="checkbox" />
          Keys available
        </label>
      </div>
      <Button disabled={isPending} type="submit" variant="outline">
        <Truck aria-hidden="true" />
        {isPending ? "Adding..." : "Add vehicle"}
      </Button>
    </form>
  );
}

export function RouteStopForm({ action }: { action: RecordAction }) {
  const [state, formAction, isPending] = useActionState(action, initialFreightTransportActionState);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <Label htmlFor="route-sequence">Sequence</Label>
          <Input id="route-sequence" min="1" name="sequence" required type="number" />
        </Field>
        <Field>
          <Label htmlFor="route-type">Stop type</Label>
          <Select defaultValue="WAREHOUSE" id="route-type" name="stopType">
            <option value="PICKUP">Pickup</option>
            <option value="WAREHOUSE">Warehouse</option>
            <option value="PORT">Port</option>
            <option value="BORDER">Border</option>
            <option value="CUSTOMS">Customs</option>
            <option value="FUEL">Fuel</option>
            <option value="REST">Rest</option>
            <option value="CUSTOMER">Customer</option>
            <option value="DELIVERY">Delivery</option>
            <option value="OTHER">Other</option>
          </Select>
        </Field>
        <Field>
          <Label htmlFor="route-name">Stop name</Label>
          <Input id="route-name" name="name" required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <Label htmlFor="route-city">City</Label>
          <Input id="route-city" name="city" />
        </Field>
        <Field>
          <Label htmlFor="route-country">Country code</Label>
          <Input id="route-country" maxLength={2} name="countryCode" />
        </Field>
        <Field>
          <Label htmlFor="route-address">Address</Label>
          <Input id="route-address" name="addressLine1" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="route-arrival">Planned arrival</Label>
          <Input id="route-arrival" name="plannedArrivalAt" type="datetime-local" />
        </Field>
        <Field>
          <Label htmlFor="route-departure">Planned departure</Label>
          <Input id="route-departure" name="plannedDepartureAt" type="datetime-local" />
        </Field>
      </div>
      <Button disabled={isPending} type="submit" variant="outline">
        <Route aria-hidden="true" />
        {isPending ? "Adding..." : "Add route stop"}
      </Button>
    </form>
  );
}

export function FreightDocumentForm({ action }: { action: RecordAction }) {
  const [state, formAction, isPending] = useActionState(action, initialFreightTransportActionState);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      <Field>
        <Label htmlFor="document-type">Document type</Label>
        <Select defaultValue="BILL_OF_LADING" id="document-type" name="documentType">
          <option value="BILL_OF_LADING">Bill of lading</option>
          <option value="COMMERCIAL_INVOICE">Commercial invoice</option>
          <option value="PACKING_LIST">Packing list</option>
          <option value="CUSTOMS_FORM">Customs form</option>
          <option value="INSURANCE_CERTIFICATE">Insurance certificate</option>
          <option value="PERMIT">Permit</option>
          <option value="PROOF_OF_DELIVERY">Proof of delivery</option>
          <option value="OTHER">Other</option>
        </Select>
      </Field>
      <Field>
        <Label htmlFor="document-file">File</Label>
        <Input
          accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.doc,.docx"
          id="document-file"
          name="file"
          required
          type="file"
        />
        <FieldHint>PDF, image, text, or Word document. Max size 15MB.</FieldHint>
      </Field>
      <Field>
        <Label htmlFor="document-expires">Expires</Label>
        <Input id="document-expires" name="expiresAt" type="date" />
      </Field>
      <Button disabled={isPending} type="submit" variant="outline">
        <FilePlus2 aria-hidden="true" />
        {isPending ? "Uploading..." : "Upload document"}
      </Button>
    </form>
  );
}

export function FreightTrackingEventForm({ action }: { action: RecordAction }) {
  const [state, formAction, isPending] = useActionState(action, initialFreightTransportActionState);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="tracking-event">Event</Label>
          <Select defaultValue="CHECKPOINT_ARRIVED" id="tracking-event" name="eventType">
            <option value="ROUTE_PLANNED">Route planned</option>
            <option value="CARGO_LOADED">Cargo loaded</option>
            <option value="DEPARTED">Departed</option>
            <option value="CHECKPOINT_ARRIVED">Checkpoint arrived</option>
            <option value="CHECKPOINT_DEPARTED">Checkpoint departed</option>
            <option value="ETA_UPDATED">ETA updated</option>
            <option value="DELAYED">Delayed</option>
            <option value="DELIVERED">Delivered</option>
            <option value="EXCEPTION">Exception</option>
          </Select>
        </Field>
        <Field>
          <Label htmlFor="tracking-status">Freight status</Label>
          <Select id="tracking-status" name="status">
            <option value="">No status change</option>
            <option value="PLANNED">Planned</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="LOADING">Loading</option>
            <option value="IN_TRANSIT">In transit</option>
            <option value="ON_HOLD">On hold</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </Field>
      </div>
      <Field>
        <Label htmlFor="tracking-message">Message</Label>
        <Textarea id="tracking-message" name="message" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="tracking-occurred">Occurred at</Label>
          <Input
            defaultValue={localDateTimeValue()}
            id="tracking-occurred"
            name="occurredAt"
            required
            type="datetime-local"
          />
        </Field>
        <Field>
          <Label htmlFor="tracking-eta">Updated ETA</Label>
          <Input id="tracking-eta" name="etaAt" type="datetime-local" />
        </Field>
      </div>
      <Field>
        <Label htmlFor="tracking-location">Location</Label>
        <Input id="tracking-location" name="location" />
      </Field>
      <Button disabled={isPending} type="submit" variant="outline">
        <Radar aria-hidden="true" />
        {isPending ? "Adding..." : "Add tracking event"}
      </Button>
    </form>
  );
}
