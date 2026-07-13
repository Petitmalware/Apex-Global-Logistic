"use client";

import Link from "next/link";
import type { Route } from "next";
import { useActionState } from "react";
import { ArrowRight, PawPrint } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CustomerSelectCard } from "@/features/customers/components/customer-select-card";
import type { PetTransportActionState, PetTransportDetail } from "@/features/pet-transport/types";
import { formatPetTransportStatus } from "@/features/shipments/status-labels";
import type { CustomerOption } from "@/features/shipments/types";
import { initialPetTransportActionState } from "@/features/pet-transport/types";

type PetTransportFormProps = {
  action: (state: PetTransportActionState, formData: FormData) => Promise<PetTransportActionState>;
  cancelHref: Route | string;
  customerOptions?: CustomerOption[];
  initialPetTransport?: PetTransportDetail;
  mode: "create" | "edit";
};

function AddressFields({
  prefix,
  required = true,
  title,
}: {
  prefix: "destination" | "origin";
  required?: boolean;
  title: string;
}) {
  const isOrigin = prefix === "origin";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <FieldHint>
          {isOrigin
            ? "Optional. Leave blank if pickup details are not available yet; the shipment can still be created."
            : "Required. This is the recipient address or facility where the pet will be delivered."}
        </FieldHint>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor={`${prefix}.name`}>
            {isOrigin ? "Sender or pickup facility" : "Recipient or delivery facility"}
          </Label>
          <Input
            id={`${prefix}.name`}
            name={`${prefix}.name`}
            placeholder={isOrigin ? "Sender name or kennel" : "Recipient name or residence"}
          />
        </Field>
        <Field>
          <Label htmlFor={`${prefix}.countryCode`}>Country code</Label>
          <Input
            id={`${prefix}.countryCode`}
            maxLength={2}
            name={`${prefix}.countryCode`}
            placeholder="US"
            required={required}
          />
        </Field>
        <Field className="sm:col-span-2">
          <Label htmlFor={`${prefix}.line1`}>
            {isOrigin ? "Pickup address line 1" : "Delivery address line 1"}
          </Label>
          <Input id={`${prefix}.line1`} name={`${prefix}.line1`} required={required} />
        </Field>
        <Field className="sm:col-span-2">
          <Label htmlFor={`${prefix}.line2`}>Address line 2</Label>
          <Input id={`${prefix}.line2`} name={`${prefix}.line2`} />
        </Field>
        <Field>
          <Label htmlFor={`${prefix}.city`}>City</Label>
          <Input id={`${prefix}.city`} name={`${prefix}.city`} required={required} />
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

function TransportPlanFields() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipment plan</CardTitle>
        <FieldHint>
          Choose the route priority and delivery window. These values create the linked shipment and
          guide future tracking updates.
        </FieldHint>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field>
          <Label htmlFor="referenceNumber">Shipment reference</Label>
          <Input
            id="referenceNumber"
            name="referenceNumber"
            placeholder="Customer or breeder ref"
          />
          <FieldHint>Optional external reference from the sender, breeder, or customer.</FieldHint>
        </Field>
        <Field>
          <Label htmlFor="priority">Transport priority</Label>
          <Select defaultValue="STANDARD" id="priority" name="priority">
            <option value="STANDARD">Standard</option>
            <option value="EXPEDITED">Expedited</option>
            <option value="URGENT">Urgent</option>
          </Select>
          <FieldHint>Use urgent only when the route needs immediate handling.</FieldHint>
        </Field>
        <Field>
          <Label htmlFor="mode">Transport mode</Label>
          <Select defaultValue="AIR" id="mode" name="mode">
            <option value="AIR">Air</option>
            <option value="ROAD">Road</option>
            <option value="RAIL">Rail</option>
            <option value="SEA">Sea</option>
            <option value="MULTIMODAL">Multimodal</option>
          </Select>
          <FieldHint>Choose the main planned movement method for this pet shipment.</FieldHint>
        </Field>
        <Field>
          <Label htmlFor="deliveryWindowStart">Estimated delivery window starts</Label>
          <Input id="deliveryWindowStart" name="deliveryWindowStart" type="datetime-local" />
        </Field>
        <Field>
          <Label htmlFor="deliveryWindowEnd">Estimated delivery window ends</Label>
          <Input id="deliveryWindowEnd" name="deliveryWindowEnd" type="datetime-local" />
        </Field>
        <Field className="sm:col-span-2">
          <Label htmlFor="notes">Internal operations notes</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Carrier, routing, or airline handling notes"
          />
          <FieldHint>
            For staff routing notes. Customer-facing updates are added from tracking.
          </FieldHint>
        </Field>
      </CardContent>
    </Card>
  );
}

export function PetTransportForm({
  action,
  cancelHref,
  customerOptions = [],
  initialPetTransport,
  mode,
}: PetTransportFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialPetTransportActionState);
  const isEdit = mode === "edit";
  const petStatusOptions = [
    "REQUESTED",
    "DOCUMENTATION_PENDING",
    "CLEARED",
    "IN_TRANSIT",
    "DELIVERED",
    "CANCELLED",
  ] as const;

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? (
        <p className="border-border bg-secondary text-secondary-foreground rounded-md border px-3 py-2 text-sm">
          {state.message}
        </p>
      ) : null}
      {!isEdit ? (
        <CustomerSelectCard
          allowManualRecipient
          customerOptions={customerOptions}
          errors={[
            ...(state.fieldErrors?.customerId ?? []),
            ...(state.fieldErrors?.manualRecipient ?? []),
          ]}
          hint="Select a registered recipient account when available, or enter a manual recipient for pet shipments that must be created without account registration."
          label="Registered customer account"
          manualRecipientHint="Use this when the pet recipient does not want an account. The recipient delivery address below is the house or facility where the pet will be delivered."
          placeholder="Manual recipient / no account"
          title="Recipient customer"
        />
      ) : null}
      <Card>
        <CardHeader className="flex flex-row items-start gap-3">
          <div className="bg-accent/15 text-accent-foreground grid size-10 place-items-center rounded-md">
            <PawPrint aria-hidden="true" className="size-5" />
          </div>
          <div>
            <CardTitle>Pet shipment profile</CardTitle>
            <FieldHint>
              Animal identity, sender contact, care requirements, and the starting transport status.
            </FieldHint>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field>
            <Label htmlFor="petName">Pet name</Label>
            <Input
              id="petName"
              name="petName"
              required
              defaultValue={initialPetTransport?.petName ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="species">Species</Label>
            <Select
              id="species"
              name="species"
              defaultValue={initialPetTransport?.species ?? "DOG"}
            >
              <option value="DOG">Dog</option>
              <option value="CAT">Cat</option>
              <option value="BIRD">Bird</option>
              <option value="REPTILE">Reptile</option>
              <option value="OTHER">Other</option>
            </Select>
          </Field>
          <Field>
            <Label htmlFor="breed">Breed</Label>
            <Input id="breed" name="breed" defaultValue={initialPetTransport?.breed ?? ""} />
          </Field>
          <Field>
            <Label htmlFor="ageMonths">Age (months)</Label>
            <Input
              id="ageMonths"
              min="0"
              name="ageMonths"
              type="number"
              defaultValue={initialPetTransport?.ageMonths ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="dateOfBirth">Date of birth</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              defaultValue={initialPetTransport?.dateOfBirth ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="weightKg">Weight (kg)</Label>
            <Input
              id="weightKg"
              min="0"
              name="weightKg"
              step="0.001"
              type="number"
              defaultValue={initialPetTransport?.weightKg ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="sex">Sex</Label>
            <Input
              id="sex"
              name="sex"
              placeholder="Female, neutered male..."
              defaultValue={initialPetTransport?.sex ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="color">Color</Label>
            <Input id="color" name="color" defaultValue={initialPetTransport?.color ?? ""} />
          </Field>
          <Field>
            <Label htmlFor="microchipNumber">Microchip number</Label>
            <Input
              id="microchipNumber"
              name="microchipNumber"
              defaultValue={initialPetTransport?.microchipNumber ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="ownerName">Sender / pet owner name</Label>
            <Input
              id="ownerName"
              name="ownerName"
              defaultValue={initialPetTransport?.ownerName ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="ownerEmail">Sender email</Label>
            <Input
              id="ownerEmail"
              name="ownerEmail"
              type="email"
              defaultValue={initialPetTransport?.ownerEmail ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="ownerPhone">Sender phone</Label>
            <Input
              id="ownerPhone"
              name="ownerPhone"
              defaultValue={initialPetTransport?.ownerPhone ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="healthCertificateNumber">Health certificate number</Label>
            <Input
              id="healthCertificateNumber"
              name="healthCertificateNumber"
              defaultValue={initialPetTransport?.healthCertificateNumber ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="status">Initial pet travel status</Label>
            <Select
              id="status"
              name="status"
              defaultValue={initialPetTransport?.status ?? "REQUESTED"}
            >
              {petStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {formatPetTransportStatus(option)}
                </option>
              ))}
            </Select>
            <FieldHint>
              Start with requested unless documents are already reviewed or the pet is already in
              transit.
            </FieldHint>
          </Field>
          <div className="flex flex-wrap items-center gap-5 pt-6">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                defaultChecked={initialPetTransport?.crateRequired ?? true}
                name="crateRequired"
                type="checkbox"
              />
              Travel crate required
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                defaultChecked={initialPetTransport?.vaccinationVerified ?? false}
                name="vaccinationVerified"
                type="checkbox"
              />
              Vaccination proof verified
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Crate and care requirements</CardTitle>
          <FieldHint>
            Keep every care detail available for handlers. Leave unknown values blank and update
            them later from the pet shipment record.
          </FieldHint>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field>
            <Label htmlFor="crateLengthCm">Crate length cm</Label>
            <Input
              id="crateLengthCm"
              min="0"
              name="crateLengthCm"
              step="0.001"
              type="number"
              defaultValue={initialPetTransport?.crateLengthCm ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="crateWidthCm">Crate width cm</Label>
            <Input
              id="crateWidthCm"
              min="0"
              name="crateWidthCm"
              step="0.001"
              type="number"
              defaultValue={initialPetTransport?.crateWidthCm ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="crateHeightCm">Crate height cm</Label>
            <Input
              id="crateHeightCm"
              min="0"
              name="crateHeightCm"
              step="0.001"
              type="number"
              defaultValue={initialPetTransport?.crateHeightCm ?? ""}
            />
          </Field>
          <Field className="sm:col-span-2 lg:col-span-3">
            <Label htmlFor="knownAllergies">Known allergies</Label>
            <Textarea
              id="knownAllergies"
              name="knownAllergies"
              defaultValue={initialPetTransport?.knownAllergies ?? ""}
            />
          </Field>
          <Field className="sm:col-span-2 lg:col-span-3">
            <Label htmlFor="medicationInstructions">Medication instructions</Label>
            <Textarea
              id="medicationInstructions"
              name="medicationInstructions"
              defaultValue={initialPetTransport?.medicationInstructions ?? ""}
            />
          </Field>
          <Field className="sm:col-span-2 lg:col-span-3">
            <Label htmlFor="feedingInstructions">Feeding instructions</Label>
            <Textarea
              id="feedingInstructions"
              name="feedingInstructions"
              defaultValue={initialPetTransport?.feedingInstructions ?? ""}
            />
          </Field>
          <Field className="sm:col-span-2 lg:col-span-3">
            <Label htmlFor="handlerInstructions">Handler instructions</Label>
            <Textarea
              id="handlerInstructions"
              name="handlerInstructions"
              defaultValue={initialPetTransport?.handlerInstructions ?? ""}
            />
          </Field>
        </CardContent>
      </Card>

      {!isEdit ? (
        <>
          <TransportPlanFields />
          <div className="grid gap-6 lg:grid-cols-2">
            <AddressFields prefix="origin" required={false} title="Sender pickup address" />
            <AddressFields prefix="destination" title="Recipient delivery address" />
          </div>
        </>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        <Button asChild variant="outline">
          <Link href={cancelHref as Route}>Cancel</Link>
        </Button>
        <Button disabled={isPending} type="submit" variant="accent">
          {isPending ? "Saving..." : isEdit ? "Save profile" : "Create pet shipment"}
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}
