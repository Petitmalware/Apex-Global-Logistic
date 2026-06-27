"use client";

import Link from "next/link";
import type { Route } from "next";
import { useActionState } from "react";
import { ArrowRight, PackagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ShipmentDetail, ShipmentActionState } from "@/features/shipments/types";
import { initialShipmentActionState } from "@/features/shipments/types";

const shipmentStatusOptions = [
  "DRAFT",
  "BOOKED",
  "PENDING_PICKUP",
  "IN_TRANSIT",
  "HELD",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

const priorityOptions = ["STANDARD", "EXPEDITED", "URGENT"];
const modeOptions = ["ROAD", "AIR", "SEA", "RAIL", "MULTIMODAL"];
const packageTypeOptions = ["BOX", "PALLET", "CRATE", "ENVELOPE", "CONTAINER", "OTHER"];
const packageStatusOptions = [
  "PENDING",
  "LOADED",
  "IN_TRANSIT",
  "DELIVERED",
  "DAMAGED",
  "LOST",
  "RETURNED",
];

type ShipmentFormProps = {
  action: (state: ShipmentActionState, formData: FormData) => Promise<ShipmentActionState>;
  cancelHref: Route | string;
  initialShipment?: ShipmentDetail;
  mode: "create" | "edit";
};

function getDateTimeLocal(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 16);
}

function getPackageRows(initialShipment?: ShipmentDetail) {
  const packages = initialShipment?.packages ?? [];
  const rowCount = Math.min(Math.max(packages.length + 1, 3), 6);

  return Array.from({ length: rowCount }, (_, index) => packages[index]);
}

function FormMessage({ state }: { state: ShipmentActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  return (
    <p className="border-border bg-secondary text-secondary-foreground rounded-md border px-3 py-2 text-sm">
      {state.message}
    </p>
  );
}

function AddressFields({
  initial,
  prefix,
  title,
}: {
  initial?: ShipmentDetail["origin"];
  prefix: "destination" | "origin";
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor={`${prefix}.name`}>Location name</Label>
          <Input
            defaultValue={initial?.name ?? ""}
            id={`${prefix}.name`}
            name={`${prefix}.name`}
            placeholder="Warehouse, office, or contact"
          />
        </Field>
        <Field>
          <Label htmlFor={`${prefix}.countryCode`}>Country code</Label>
          <Input
            defaultValue={initial?.countryCode ?? ""}
            id={`${prefix}.countryCode`}
            maxLength={2}
            name={`${prefix}.countryCode`}
            placeholder="US"
            required
          />
        </Field>
        <Field className="sm:col-span-2">
          <Label htmlFor={`${prefix}.line1`}>Address line 1</Label>
          <Input
            defaultValue={initial?.line1 ?? ""}
            id={`${prefix}.line1`}
            name={`${prefix}.line1`}
            required
          />
        </Field>
        <Field className="sm:col-span-2">
          <Label htmlFor={`${prefix}.line2`}>Address line 2</Label>
          <Input
            defaultValue={initial?.line2 ?? ""}
            id={`${prefix}.line2`}
            name={`${prefix}.line2`}
          />
        </Field>
        <Field>
          <Label htmlFor={`${prefix}.city`}>City</Label>
          <Input
            defaultValue={initial?.city ?? ""}
            id={`${prefix}.city`}
            name={`${prefix}.city`}
            required
          />
        </Field>
        <Field>
          <Label htmlFor={`${prefix}.state`}>State / region</Label>
          <Input
            defaultValue={initial?.state ?? ""}
            id={`${prefix}.state`}
            name={`${prefix}.state`}
          />
        </Field>
        <Field>
          <Label htmlFor={`${prefix}.postalCode`}>Postal code</Label>
          <Input
            defaultValue={initial?.postalCode ?? ""}
            id={`${prefix}.postalCode`}
            name={`${prefix}.postalCode`}
          />
        </Field>
      </CardContent>
    </Card>
  );
}

export function ShipmentForm({ action, cancelHref, initialShipment, mode }: ShipmentFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialShipmentActionState);
  const packageRows = getPackageRows(initialShipment);

  return (
    <form action={formAction} className="space-y-6">
      <FormMessage state={state} />
      {state.fieldErrors?.packages ? (
        <FieldError>{state.fieldErrors.packages.join(" ")}</FieldError>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Shipment details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field>
            <Label htmlFor="referenceNumber">Reference number</Label>
            <Input
              defaultValue={initialShipment?.referenceNumber ?? ""}
              id="referenceNumber"
              name="referenceNumber"
              placeholder="PO, invoice, or customer ref"
            />
          </Field>
          <Field>
            <Label htmlFor="serviceLevel">Service level</Label>
            <Input
              defaultValue={initialShipment?.serviceLevel ?? ""}
              id="serviceLevel"
              name="serviceLevel"
              placeholder="Priority parcel, white glove..."
            />
          </Field>
          <Field>
            <Label htmlFor="status">Status</Label>
            <Select defaultValue={initialShipment?.status ?? "DRAFT"} id="status" name="status">
              {shipmentStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="priority">Priority</Label>
            <Select
              defaultValue={initialShipment?.priority ?? "STANDARD"}
              id="priority"
              name="priority"
            >
              {priorityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="mode">Mode</Label>
            <Select defaultValue={initialShipment?.mode ?? "ROAD"} id="mode" name="mode">
              {modeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="pickupWindowStart">Pickup starts</Label>
            <Input
              defaultValue={getDateTimeLocal(initialShipment?.pickupWindowStart)}
              id="pickupWindowStart"
              name="pickupWindowStart"
              type="datetime-local"
            />
          </Field>
          <Field>
            <Label htmlFor="pickupWindowEnd">Pickup ends</Label>
            <Input
              defaultValue={getDateTimeLocal(initialShipment?.pickupWindowEnd)}
              id="pickupWindowEnd"
              name="pickupWindowEnd"
              type="datetime-local"
            />
          </Field>
          <Field>
            <Label htmlFor="deliveryWindowStart">Delivery starts</Label>
            <Input
              defaultValue={getDateTimeLocal(initialShipment?.deliveryWindowStart)}
              id="deliveryWindowStart"
              name="deliveryWindowStart"
              type="datetime-local"
            />
          </Field>
          <Field>
            <Label htmlFor="deliveryWindowEnd">Delivery ends</Label>
            <Input
              defaultValue={getDateTimeLocal(initialShipment?.deliveryWindowEnd)}
              id="deliveryWindowEnd"
              name="deliveryWindowEnd"
              type="datetime-local"
            />
          </Field>
          <Field className="sm:col-span-2 lg:col-span-3">
            <Label htmlFor="notes">Internal notes</Label>
            <Textarea defaultValue={initialShipment?.notes ?? ""} id="notes" name="notes" />
          </Field>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <AddressFields initial={initialShipment?.origin} prefix="origin" title="Origin" />
        <AddressFields
          initial={initialShipment?.destination}
          prefix="destination"
          title="Destination"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Package details</CardTitle>
          <FieldHint>
            The first package is required. Use the additional rows for multi-piece shipments.
          </FieldHint>
        </CardHeader>
        <CardContent className="space-y-5">
          {packageRows.map((shipmentPackage, index) => (
            <div
              className="border-border bg-surface rounded-lg border p-4"
              key={shipmentPackage?.id ?? index}
            >
              <input
                name={`packages.${index}.id`}
                type="hidden"
                value={shipmentPackage?.id ?? ""}
              />
              <div className="mb-4 flex items-center gap-2">
                <PackagePlus aria-hidden="true" className="text-accent size-4" />
                <h3 className="text-sm font-semibold">Package {index + 1}</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Field>
                  <Label htmlFor={`packages.${index}.packageNumber`}>Package number</Label>
                  <Input
                    defaultValue={shipmentPackage?.packageNumber ?? ""}
                    id={`packages.${index}.packageNumber`}
                    name={`packages.${index}.packageNumber`}
                    placeholder="Auto-generated if blank"
                  />
                </Field>
                <Field>
                  <Label htmlFor={`packages.${index}.type`}>Type</Label>
                  <Select
                    defaultValue={shipmentPackage?.type ?? "BOX"}
                    id={`packages.${index}.type`}
                    name={`packages.${index}.type`}
                  >
                    {packageTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label htmlFor={`packages.${index}.status`}>Package status</Label>
                  <Select
                    defaultValue={shipmentPackage?.status ?? "PENDING"}
                    id={`packages.${index}.status`}
                    name={`packages.${index}.status`}
                  >
                    {packageStatusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.replaceAll("_", " ")}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label htmlFor={`packages.${index}.barcode`}>Barcode</Label>
                  <Input
                    defaultValue={shipmentPackage?.barcode ?? ""}
                    id={`packages.${index}.barcode`}
                    name={`packages.${index}.barcode`}
                  />
                </Field>
                <Field>
                  <Label htmlFor={`packages.${index}.weightKg`}>Weight kg</Label>
                  <Input
                    defaultValue={shipmentPackage?.weightKg ?? ""}
                    id={`packages.${index}.weightKg`}
                    min="0"
                    name={`packages.${index}.weightKg`}
                    step="0.001"
                    type="number"
                  />
                </Field>
                <Field>
                  <Label htmlFor={`packages.${index}.lengthCm`}>Length cm</Label>
                  <Input
                    defaultValue={shipmentPackage?.lengthCm ?? ""}
                    id={`packages.${index}.lengthCm`}
                    min="0"
                    name={`packages.${index}.lengthCm`}
                    step="0.001"
                    type="number"
                  />
                </Field>
                <Field>
                  <Label htmlFor={`packages.${index}.widthCm`}>Width cm</Label>
                  <Input
                    defaultValue={shipmentPackage?.widthCm ?? ""}
                    id={`packages.${index}.widthCm`}
                    min="0"
                    name={`packages.${index}.widthCm`}
                    step="0.001"
                    type="number"
                  />
                </Field>
                <Field>
                  <Label htmlFor={`packages.${index}.heightCm`}>Height cm</Label>
                  <Input
                    defaultValue={shipmentPackage?.heightCm ?? ""}
                    id={`packages.${index}.heightCm`}
                    min="0"
                    name={`packages.${index}.heightCm`}
                    step="0.001"
                    type="number"
                  />
                </Field>
                <Field>
                  <Label htmlFor={`packages.${index}.declaredValue`}>Declared value</Label>
                  <Input
                    defaultValue={shipmentPackage?.declaredValue ?? ""}
                    id={`packages.${index}.declaredValue`}
                    min="0"
                    name={`packages.${index}.declaredValue`}
                    step="0.01"
                    type="number"
                  />
                </Field>
                <Field>
                  <Label htmlFor={`packages.${index}.currency`}>Currency</Label>
                  <Input
                    defaultValue={shipmentPackage?.currency ?? "USD"}
                    id={`packages.${index}.currency`}
                    maxLength={3}
                    name={`packages.${index}.currency`}
                  />
                </Field>
                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      defaultChecked={shipmentPackage?.fragile ?? false}
                      name={`packages.${index}.fragile`}
                      type="checkbox"
                    />
                    Fragile
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      defaultChecked={shipmentPackage?.hazardous ?? false}
                      name={`packages.${index}.hazardous`}
                      type="checkbox"
                    />
                    Hazardous
                  </label>
                </div>
                <Field className="sm:col-span-2 xl:col-span-4">
                  <Label htmlFor={`packages.${index}.description`}>Description</Label>
                  <Textarea
                    defaultValue={shipmentPackage?.description ?? ""}
                    id={`packages.${index}.description`}
                    name={`packages.${index}.description`}
                    placeholder={index === 0 ? "Required for the primary package" : "Optional"}
                    required={index === 0}
                  />
                </Field>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button asChild variant="outline">
          <Link href={cancelHref as Route}>Cancel</Link>
        </Button>
        <Button disabled={isPending} type="submit" variant="accent">
          {isPending ? "Saving..." : mode === "create" ? "Create shipment" : "Save changes"}
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}
