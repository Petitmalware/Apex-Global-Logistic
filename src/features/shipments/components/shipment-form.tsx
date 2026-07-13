"use client";

import Link from "next/link";
import type { Route } from "next";
import { useActionState } from "react";
import {
  ArrowRight,
  ClipboardList,
  Contact,
  PackagePlus,
  Truck,
  UserRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatShipmentStatus } from "@/features/shipments/status-labels";
import type {
  CustomerOption,
  ShipmentActionState,
  ShipmentDetail,
} from "@/features/shipments/types";
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
] as const;

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
const serviceLevelOptions = [
  "Parcel Delivery",
  "Pet Transport",
  "Freight",
  "Van Move",
  "Climate Controlled",
  "Priority Delivery",
  "Custom",
];
const paymentModeOptions = [
  "Pending",
  "Cash",
  "Card",
  "Bank Transfer",
  "Zelle",
  "Cash App",
  "Bitcoin",
  "Other",
];
const carrierOptions = [
  "Apex Ground",
  "Delta Pet Cargo",
  "FedEx",
  "UPS",
  "DHL",
  "USPS",
  "Private Driver",
  "Partner Carrier",
  "Other",
];
const countryOptions = [
  { label: "United States", value: "US" },
  { label: "Canada", value: "CA" },
  { label: "United Kingdom", value: "GB" },
  { label: "Australia", value: "AU" },
  { label: "Germany", value: "DE" },
  { label: "France", value: "FR" },
  { label: "Nigeria", value: "NG" },
  { label: "Other", value: "OT" },
];

type ShipmentFormProps = {
  action: (state: ShipmentActionState, formData: FormData) => Promise<ShipmentActionState>;
  cancelHref: Route | string;
  customerOptions?: CustomerOption[];
  initialShipment?: ShipmentDetail;
  mode: "create" | "edit";
};

function getDateOnly(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
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

function CountrySelect({
  defaultValue,
  id,
  name,
}: {
  defaultValue?: string | null;
  id: string;
  name: string;
}) {
  return (
    <Select defaultValue={defaultValue ?? "US"} id={id} name={name} required>
      {countryOptions.map((country) => (
        <option key={country.value} value={country.value}>
          {country.label}
        </option>
      ))}
    </Select>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="bg-accent/15 text-accent grid size-10 place-items-center rounded-md">
        <Icon aria-hidden="true" className="size-5" />
      </div>
      <h3 className="text-xl font-semibold tracking-normal">{title}</h3>
    </div>
  );
}

function ErrorList({ errors }: { errors?: string[] }) {
  return errors?.length ? <FieldError>{errors.join(" ")}</FieldError> : null;
}

export function ShipmentForm({
  action,
  cancelHref,
  customerOptions = [],
  initialShipment,
  mode,
}: ShipmentFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialShipmentActionState);
  const packageRows = getPackageRows(initialShipment);
  const officeDetails = initialShipment?.officeDetails;
  const currentStatus = initialShipment?.status ?? "DRAFT";
  const isCreateMode = mode === "create";

  return (
    <form action={formAction} className="space-y-6">
      <FormMessage state={state} />
      {state.fieldErrors?.packages ? (
        <FieldError>{state.fieldErrors.packages.join(" ")}</FieldError>
      ) : null}

      <Card className="overflow-hidden">
        <CardHeader className="border-border bg-surface border-b">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>
                {isCreateMode ? "Create agency shipment" : "Edit agency shipment"}
              </CardTitle>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                Capture shipper, receiver, carrier, schedule, package, billing, and comments in one
                operations record.
              </p>
            </div>
            <Badge variant="outline">Current status: {formatShipmentStatus(currentStatus)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-8 p-5 xl:grid-cols-2">
          <section>
            <SectionTitle icon={UserRound} title="Shipper details" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <Label htmlFor="origin.name">Shipper name</Label>
                <Input
                  defaultValue={initialShipment?.origin.name ?? ""}
                  id="origin.name"
                  name="origin.name"
                  placeholder="Sender or company name"
                />
              </Field>
              <Field>
                <Label htmlFor="officeDetails.shipperPhone">Phone number</Label>
                <Input
                  defaultValue={officeDetails?.shipperPhone ?? ""}
                  id="officeDetails.shipperPhone"
                  name="officeDetails.shipperPhone"
                  placeholder="+1 555 0100"
                />
              </Field>
              <Field className="sm:col-span-2">
                <Label htmlFor="origin.line1">Pickup / sender address</Label>
                <Input
                  defaultValue={initialShipment?.origin.line1 ?? ""}
                  id="origin.line1"
                  name="origin.line1"
                  placeholder="Street address or sender location"
                  required
                />
              </Field>
              <Field>
                <Label htmlFor="officeDetails.shipperEmail">Email</Label>
                <Input
                  defaultValue={officeDetails?.shipperEmail ?? ""}
                  id="officeDetails.shipperEmail"
                  name="officeDetails.shipperEmail"
                  placeholder="sender@example.com"
                  type="email"
                />
                <ErrorList errors={state.fieldErrors?.officeDetails} />
              </Field>
              <Field>
                <Label htmlFor="origin.city">City</Label>
                <Input
                  defaultValue={initialShipment?.origin.city ?? ""}
                  id="origin.city"
                  name="origin.city"
                  placeholder="Rosenberg"
                  required
                />
              </Field>
              <Field>
                <Label htmlFor="origin.state">State / region</Label>
                <Input
                  defaultValue={initialShipment?.origin.state ?? ""}
                  id="origin.state"
                  name="origin.state"
                  placeholder="TX"
                />
              </Field>
              <Field>
                <Label htmlFor="origin.postalCode">Postal code</Label>
                <Input
                  defaultValue={initialShipment?.origin.postalCode ?? ""}
                  id="origin.postalCode"
                  name="origin.postalCode"
                />
              </Field>
              <Field>
                <Label htmlFor="origin.countryCode">Origin country</Label>
                <CountrySelect
                  defaultValue={initialShipment?.origin.countryCode}
                  id="origin.countryCode"
                  name="origin.countryCode"
                />
              </Field>
              <input
                name="origin.line2"
                type="hidden"
                value={initialShipment?.origin.line2 ?? ""}
              />
            </div>
          </section>

          <section>
            <SectionTitle icon={Contact} title="Receiver details" />
            <div className="grid gap-4 sm:grid-cols-2">
              {isCreateMode ? (
                <Field className="sm:col-span-2">
                  <Label htmlFor="customerId">Registered customer account</Label>
                  <Select
                    defaultValue=""
                    disabled={!customerOptions.length}
                    id="customerId"
                    name="customerId"
                  >
                    <option value="">
                      {customerOptions.length
                        ? "Manual receiver / no account"
                        : "No registered customers found"}
                    </option>
                    {customerOptions.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.label}
                      </option>
                    ))}
                  </Select>
                  <FieldHint>
                    Select a customer if they have an account. Otherwise enter the receiver details
                    below and the shipment can still be tracked publicly.
                  </FieldHint>
                  <ErrorList errors={state.fieldErrors?.customerId} />
                </Field>
              ) : null}
              <Field>
                <Label htmlFor={isCreateMode ? "manualRecipient.name" : "destination.name"}>
                  Receiver name
                </Label>
                <Input
                  defaultValue={
                    isCreateMode
                      ? (initialShipment?.manualRecipient?.name ?? "")
                      : (initialShipment?.destination.name ?? initialShipment?.recipientName ?? "")
                  }
                  id={isCreateMode ? "manualRecipient.name" : "destination.name"}
                  name={isCreateMode ? "manualRecipient.name" : "destination.name"}
                  placeholder="Receiver name"
                />
              </Field>
              <Field>
                <Label htmlFor="manualRecipient.phone">Phone number</Label>
                <Input
                  defaultValue={initialShipment?.manualRecipient?.phone ?? ""}
                  disabled={!isCreateMode}
                  id="manualRecipient.phone"
                  name="manualRecipient.phone"
                  placeholder="+1 555 0100"
                />
              </Field>
              <Field className="sm:col-span-2">
                <Label htmlFor="destination.line1">Delivery address</Label>
                <Input
                  defaultValue={initialShipment?.destination.line1 ?? ""}
                  id="destination.line1"
                  name="destination.line1"
                  placeholder="Street address for final delivery"
                  required
                />
              </Field>
              <Field>
                <Label htmlFor="manualRecipient.email">Email</Label>
                <Input
                  defaultValue={
                    initialShipment?.manualRecipient?.email ?? initialShipment?.recipientEmail ?? ""
                  }
                  disabled={!isCreateMode}
                  id="manualRecipient.email"
                  name="manualRecipient.email"
                  placeholder="receiver@example.com"
                  type="email"
                />
                <ErrorList errors={state.fieldErrors?.manualRecipient} />
              </Field>
              <Field>
                <Label htmlFor="destination.city">City</Label>
                <Input
                  defaultValue={initialShipment?.destination.city ?? ""}
                  id="destination.city"
                  name="destination.city"
                  placeholder="Laredo"
                  required
                />
              </Field>
              <Field>
                <Label htmlFor="destination.state">State / region</Label>
                <Input
                  defaultValue={initialShipment?.destination.state ?? ""}
                  id="destination.state"
                  name="destination.state"
                  placeholder="TX"
                />
              </Field>
              <Field>
                <Label htmlFor="destination.postalCode">Postal code</Label>
                <Input
                  defaultValue={initialShipment?.destination.postalCode ?? ""}
                  id="destination.postalCode"
                  name="destination.postalCode"
                />
              </Field>
              <Field>
                <Label htmlFor="destination.countryCode">Destination country</Label>
                <CountrySelect
                  defaultValue={initialShipment?.destination.countryCode}
                  id="destination.countryCode"
                  name="destination.countryCode"
                />
              </Field>
              <input
                name="destination.line2"
                type="hidden"
                value={initialShipment?.destination.line2 ?? ""}
              />
              {isCreateMode ? (
                <input
                  name="destination.name"
                  type="hidden"
                  value={initialShipment?.destination.name ?? ""}
                />
              ) : null}
            </div>
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="bg-accent/15 text-accent grid size-10 place-items-center rounded-md">
              <ClipboardList aria-hidden="true" className="size-5" />
            </div>
            <div>
              <CardTitle>Shipment details</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                These fields appear on internal records, documents, receipts, and tracking updates.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field>
            <Label htmlFor="serviceLevel">Type of shipment</Label>
            <Select
              defaultValue={initialShipment?.serviceLevel ?? "Pet Transport"}
              id="serviceLevel"
              name="serviceLevel"
            >
              {serviceLevelOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="status">Status</Label>
            <Select defaultValue={currentStatus} id="status" name="status">
              {shipmentStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {formatShipmentStatus(option)}
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
                  {option === "ROAD" ? "Land Shipping" : option}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="packages.0.weightKg">Weight</Label>
            <Input
              defaultValue={initialShipment?.packages[0]?.weightKg ?? ""}
              id="packages.0.weightKg"
              min="0"
              name="packages.0.weightKg"
              placeholder="2"
              step="0.001"
              type="number"
            />
            <FieldHint>Stored in kilograms. Use the comments if the customer quoted lbs.</FieldHint>
          </Field>
          <Field>
            <Label htmlFor="officeDetails.quantity">Quantity</Label>
            <Input
              defaultValue={officeDetails?.quantity ?? ""}
              id="officeDetails.quantity"
              name="officeDetails.quantity"
              placeholder="1"
            />
          </Field>
          <Field>
            <Label htmlFor="packages.0.description">Product / item</Label>
            <Input
              defaultValue={initialShipment?.packages[0]?.description ?? ""}
              id="packages.0.description"
              name="packages.0.description"
              placeholder="Shih Tzu puppy, parcel, machinery..."
              required
            />
          </Field>
          <Field>
            <Label htmlFor="packages.0.type">Package type</Label>
            <Select
              defaultValue={initialShipment?.packages[0]?.type ?? "CRATE"}
              id="packages.0.type"
              name="packages.0.type"
            >
              {packageTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="officeDetails.paymentMode">Payment mode</Label>
            <Select
              defaultValue={officeDetails?.paymentMode ?? "Pending"}
              id="officeDetails.paymentMode"
              name="officeDetails.paymentMode"
            >
              {paymentModeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="officeDetails.totalFreight">Total freight</Label>
            <Input
              defaultValue={officeDetails?.totalFreight ?? ""}
              id="officeDetails.totalFreight"
              name="officeDetails.totalFreight"
              placeholder="$100"
            />
          </Field>
          <Field>
            <Label htmlFor="referenceNumber">Carrier reference no.</Label>
            <Input
              defaultValue={initialShipment?.referenceNumber ?? ""}
              id="referenceNumber"
              name="referenceNumber"
              placeholder="COLIS-EXPRESS-TX-206"
            />
          </Field>
          <Field>
            <Label htmlFor="packages.0.status">Package status</Label>
            <Select
              defaultValue={initialShipment?.packages[0]?.status ?? "PENDING"}
              id="packages.0.status"
              name="packages.0.status"
            >
              {packageStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </Field>
          <input
            name="packages.0.id"
            type="hidden"
            value={initialShipment?.packages[0]?.id ?? ""}
          />
          <input
            name="packages.0.currency"
            type="hidden"
            value={initialShipment?.packages[0]?.currency ?? "USD"}
          />
          <input
            name="packages.0.packageNumber"
            type="hidden"
            value={initialShipment?.packages[0]?.packageNumber ?? ""}
          />
          <input
            name="packages.0.barcode"
            type="hidden"
            value={initialShipment?.packages[0]?.barcode ?? ""}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="bg-info/10 text-info grid size-10 place-items-center rounded-md">
              <Truck aria-hidden="true" className="size-5" />
            </div>
            <div>
              <CardTitle>Carrier and schedule</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                Use this section for manual routing, partner carrier details, and customer-facing
                delivery timing.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field>
            <Label htmlFor="officeDetails.courier">Courier</Label>
            <Input
              defaultValue={officeDetails?.courier ?? ""}
              id="officeDetails.courier"
              name="officeDetails.courier"
              placeholder="Delta Pet Cargo"
            />
          </Field>
          <Field>
            <Label htmlFor="officeDetails.carrier">Carrier</Label>
            <Select
              defaultValue={officeDetails?.carrier ?? ""}
              id="officeDetails.carrier"
              name="officeDetails.carrier"
            >
              <option value="">Select carrier</option>
              {carrierOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="officeDetails.carrierReference">Carrier reference no.</Label>
            <Input
              defaultValue={officeDetails?.carrierReference ?? ""}
              id="officeDetails.carrierReference"
              name="officeDetails.carrierReference"
              placeholder="Partner reference"
            />
          </Field>
          <Field>
            <Label htmlFor="officeDetails.departureTime">Departure time</Label>
            <Input
              defaultValue={officeDetails?.departureTime ?? ""}
              id="officeDetails.departureTime"
              name="officeDetails.departureTime"
              placeholder="11:30 am"
            />
          </Field>
          <Field>
            <Label htmlFor="pickupWindowStart">Pickup date</Label>
            <Input
              defaultValue={getDateOnly(initialShipment?.pickupWindowStart)}
              id="pickupWindowStart"
              name="pickupWindowStart"
              type="date"
            />
          </Field>
          <Field>
            <Label htmlFor="officeDetails.pickupTime">Pickup time</Label>
            <Input
              defaultValue={officeDetails?.pickupTime ?? ""}
              id="officeDetails.pickupTime"
              name="officeDetails.pickupTime"
              placeholder="06:00 am"
            />
          </Field>
          <Field>
            <Label htmlFor="deliveryWindowStart">Expected delivery date</Label>
            <Input
              defaultValue={getDateOnly(initialShipment?.deliveryWindowStart)}
              id="deliveryWindowStart"
              name="deliveryWindowStart"
              type="date"
            />
          </Field>
          <Field>
            <Label htmlFor="officeDetails.comments">Comments</Label>
            <Textarea
              defaultValue={officeDetails?.comments ?? ""}
              id="officeDetails.comments"
              name="officeDetails.comments"
              placeholder="Puppy has been registered for shipment. Please await further instructions."
            />
          </Field>
          <input name="pickupWindowEnd" type="hidden" value="" />
          <input name="deliveryWindowEnd" type="hidden" value="" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="bg-warning/15 text-warning-foreground grid size-10 place-items-center rounded-md">
              <PackagePlus aria-hidden="true" className="size-5" />
            </div>
            <div>
              <CardTitle>Additional package details</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                Optional. Add extra rows only when the shipment has more than one piece.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {packageRows.slice(1).map((shipmentPackage, packageIndex) => {
            const index = packageIndex + 1;

            return (
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
                  <Field className="sm:col-span-2 xl:col-span-4">
                    <Label htmlFor={`packages.${index}.description`}>Description</Label>
                    <Textarea
                      defaultValue={shipmentPackage?.description ?? ""}
                      id={`packages.${index}.description`}
                      name={`packages.${index}.description`}
                      placeholder="Optional extra package description"
                    />
                  </Field>
                  <input
                    name={`packages.${index}.currency`}
                    type="hidden"
                    value={shipmentPackage?.currency ?? "USD"}
                  />
                  <input
                    name={`packages.${index}.barcode`}
                    type="hidden"
                    value={shipmentPackage?.barcode ?? ""}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="bg-secondary text-secondary-foreground grid size-10 place-items-center rounded-md">
              <WalletCards aria-hidden="true" className="size-5" />
            </div>
            <div>
              <CardTitle>Internal operations notes</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                These notes are for staff context and are separate from public tracking updates.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Field>
            <Label htmlFor="notes">Staff notes</Label>
            <Textarea
              defaultValue={initialShipment?.notes ?? ""}
              id="notes"
              name="notes"
              placeholder="Private notes for admin, documents, billing, or handoff context."
            />
          </Field>
        </CardContent>
      </Card>

      <div className="border-border bg-card sticky bottom-0 z-20 flex flex-wrap items-center justify-end gap-3 border-t p-4 shadow-lg">
        <Button asChild variant="outline">
          <Link href={cancelHref as Route}>Cancel</Link>
        </Button>
        <Button disabled={isPending} type="submit" variant="accent">
          {isPending ? "Saving..." : isCreateMode ? "Create shipment" : "Save shipment"}
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}
