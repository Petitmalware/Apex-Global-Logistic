"use client";

import Link from "next/link";
import type { Route } from "next";
import { useActionState, useMemo, useState } from "react";
import { ArrowRight, Calculator, PackagePlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CustomerSelectCard } from "@/features/customers/components/customer-select-card";
import { calculateParcelQuote } from "@/features/shipments/services/parcel-pricing";
import type { CustomerOption, ShipmentActionState } from "@/features/shipments/types";
import { initialShipmentActionState } from "@/features/shipments/types";
import { kilogramsToPounds, poundsToKilograms } from "@/lib/measurements";

type ParcelBookingFormProps = {
  action: (state: ShipmentActionState, formData: FormData) => Promise<ShipmentActionState>;
  customerOptions?: CustomerOption[];
  workflow?: "admin_creation" | "customer_booking";
};

type PackageDraft = {
  declaredValue: string;
  description: string;
  fragile: boolean;
  hazardous: boolean;
  heightCm: string;
  lengthCm: string;
  weightLb: string;
  widthCm: string;
};

const defaultPackages: PackageDraft[] = [
  {
    declaredValue: "",
    description: "",
    fragile: false,
    hazardous: false,
    heightCm: "",
    lengthCm: "",
    weightLb: "",
    widthCm: "",
  },
  {
    declaredValue: "",
    description: "",
    fragile: false,
    hazardous: false,
    heightCm: "",
    lengthCm: "",
    weightLb: "",
    widthCm: "",
  },
  {
    declaredValue: "",
    description: "",
    fragile: false,
    hazardous: false,
    heightCm: "",
    lengthCm: "",
    weightLb: "",
    widthCm: "",
  },
];

function getNumber(value: string) {
  const number = Number(value);

  return Number.isFinite(number) && number > 0 ? number : undefined;
}

function hasPackageData(shipmentPackage: PackageDraft, index: number) {
  if (index === 0) {
    return true;
  }

  return Object.values(shipmentPackage).some((value) =>
    typeof value === "boolean" ? value : value.trim().length > 0,
  );
}

function AddressFields({ prefix, title }: { prefix: "destination" | "origin"; title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor={`${prefix}.name`}>Contact or location</Label>
          <Input id={`${prefix}.name`} name={`${prefix}.name`} placeholder="Apex customer desk" />
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

export function ParcelBookingForm({
  action,
  customerOptions = [],
  workflow = "admin_creation",
}: ParcelBookingFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialShipmentActionState);
  const [priority, setPriority] = useState("STANDARD");
  const [mode, setMode] = useState("ROAD");
  const [signatureRequired, setSignatureRequired] = useState(false);
  const [insuranceRequested, setInsuranceRequested] = useState(false);
  const [packages, setPackages] = useState(defaultPackages);
  const isCustomerBooking = workflow === "customer_booking";

  const quote = useMemo(() => {
    const quotedPackages = packages.filter(hasPackageData).map((shipmentPackage, index) => {
      const weightLb = getNumber(shipmentPackage.weightLb);

      return {
        barcode: undefined,
        currency: "USD",
        declaredValue: getNumber(shipmentPackage.declaredValue),
        description: shipmentPackage.description || `Parcel package ${index + 1}`,
        fragile: shipmentPackage.fragile,
        hazardous: shipmentPackage.hazardous,
        heightCm: getNumber(shipmentPackage.heightCm),
        id: undefined,
        lengthCm: getNumber(shipmentPackage.lengthCm),
        packageNumber: undefined,
        status: "PENDING" as const,
        type: "BOX" as const,
        weightKg: weightLb ? poundsToKilograms(weightLb) : undefined,
        widthCm: getNumber(shipmentPackage.widthCm),
      };
    });

    return calculateParcelQuote(
      {
        customerId: undefined,
        deliveryWindowEnd: undefined,
        deliveryWindowStart: undefined,
        destination: {
          city: "Destination",
          countryCode: "US",
          line1: "Destination",
        },
        manualRecipient: {},
        mode: mode as "AIR" | "MULTIMODAL" | "RAIL" | "ROAD" | "SEA",
        notes: undefined,
        officeDetails: {},
        origin: {
          city: "Origin",
          countryCode: "US",
          line1: "Origin",
        },
        packages: quotedPackages.length ? quotedPackages : [quotedPackages[0]!],
        pickupWindowEnd: undefined,
        pickupWindowStart: undefined,
        priority: priority as "EXPEDITED" | "STANDARD" | "URGENT",
        referenceNumber: undefined,
        recipientRequired: false,
        serviceLevel: "Parcel Standard",
        status: "BOOKED",
      },
      {
        insuranceRequested,
        signatureRequired,
      },
    );
  }, [insuranceRequested, mode, packages, priority, signatureRequired]);

  function updatePackage(index: number, patch: Partial<PackageDraft>) {
    setPackages((currentPackages) =>
      currentPackages.map((shipmentPackage, packageIndex) =>
        packageIndex === index ? { ...shipmentPackage, ...patch } : shipmentPackage,
      ),
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <input name="status" type="hidden" value={isCustomerBooking ? "DRAFT" : "BOOKED"} />
      <input name="serviceLevel" type="hidden" value="Parcel Standard" />
      {!isCustomerBooking ? (
        <CustomerSelectCard
          allowManualRecipient
          customerOptions={customerOptions}
          errors={[
            ...(state.fieldErrors?.customerId ?? []),
            ...(state.fieldErrors?.manualRecipient ?? []),
          ]}
          hint="Select a registered customer when available, or enter a manual parcel recipient who does not need a portal account."
          label="Registered customer account"
          manualRecipientHint="Use this for unregistered parcel recipients. The delivery address below is the recipient house or business address."
          placeholder="Manual recipient / no account"
          title="Parcel recipient"
        />
      ) : null}
      {state.message ? (
        <p className="border-border bg-secondary text-secondary-foreground rounded-md border px-3 py-2 text-sm">
          {state.message}
        </p>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Parcel service</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field>
                <Label htmlFor="referenceNumber">Reference number</Label>
                <Input id="referenceNumber" name="referenceNumber" placeholder="Optional" />
              </Field>
              <Field>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  id="priority"
                  name="priority"
                  onChange={(event) => setPriority(event.target.value)}
                  value={priority}
                >
                  <option value="STANDARD">Standard</option>
                  <option value="EXPEDITED">Expedited</option>
                  <option value="URGENT">Urgent</option>
                </Select>
              </Field>
              <Field>
                <Label htmlFor="mode">Transport mode</Label>
                <Select
                  id="mode"
                  name="mode"
                  onChange={(event) => setMode(event.target.value)}
                  value={mode}
                >
                  <option value="ROAD">Road</option>
                  <option value="AIR">Air</option>
                  <option value="RAIL">Rail</option>
                  <option value="SEA">Sea</option>
                  <option value="MULTIMODAL">Multimodal</option>
                </Select>
              </Field>
              <Field>
                <Label htmlFor="receiptEmail">Receipt email</Label>
                <Input
                  id="receiptEmail"
                  name="receiptEmail"
                  placeholder="billing@example.com"
                  type="email"
                />
              </Field>
              <div className="flex flex-wrap items-center gap-5 sm:col-span-2 lg:col-span-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    checked={signatureRequired}
                    name="signatureRequired"
                    onChange={(event) => setSignatureRequired(event.target.checked)}
                    type="checkbox"
                  />
                  Signature required
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    checked={insuranceRequested}
                    name="insuranceRequested"
                    onChange={(event) => setInsuranceRequested(event.target.checked)}
                    type="checkbox"
                  />
                  Declared value protection
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <AddressFields prefix="origin" title="Pickup address" />
            <AddressFields prefix="destination" title="Delivery address" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Package information</CardTitle>
              <FieldHint>
                Dimensions are used for dimensional weight. Chargeable weight is the greater of
                actual and dimensional weight.
              </FieldHint>
            </CardHeader>
            <CardContent className="space-y-4">
              {packages.map((shipmentPackage, index) => (
                <div className="border-border bg-surface rounded-lg border p-4" key={index}>
                  <div className="mb-4 flex items-center gap-2">
                    <PackagePlus aria-hidden="true" className="text-accent size-4" />
                    <h3 className="text-sm font-semibold">Package {index + 1}</h3>
                    {index > 0 ? <Badge variant="outline">Optional</Badge> : null}
                  </div>
                  <input name={`packages.${index}.currency`} type="hidden" value="USD" />
                  <input name={`packages.${index}.status`} type="hidden" value="PENDING" />
                  <input name={`packages.${index}.type`} type="hidden" value="BOX" />
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field>
                      <Label htmlFor={`packages.${index}.weightLb`}>Weight (lb)</Label>
                      <Input
                        id={`packages.${index}.weightLb`}
                        min="0"
                        name={`packages.${index}.weightLb`}
                        onChange={(event) => updatePackage(index, { weightLb: event.target.value })}
                        required={index === 0}
                        step="0.001"
                        type="number"
                        value={shipmentPackage.weightLb}
                      />
                    </Field>
                    <Field>
                      <Label htmlFor={`packages.${index}.lengthCm`}>Length cm</Label>
                      <Input
                        id={`packages.${index}.lengthCm`}
                        min="0"
                        name={`packages.${index}.lengthCm`}
                        onChange={(event) => updatePackage(index, { lengthCm: event.target.value })}
                        required={index === 0}
                        step="0.001"
                        type="number"
                        value={shipmentPackage.lengthCm}
                      />
                    </Field>
                    <Field>
                      <Label htmlFor={`packages.${index}.widthCm`}>Width cm</Label>
                      <Input
                        id={`packages.${index}.widthCm`}
                        min="0"
                        name={`packages.${index}.widthCm`}
                        onChange={(event) => updatePackage(index, { widthCm: event.target.value })}
                        required={index === 0}
                        step="0.001"
                        type="number"
                        value={shipmentPackage.widthCm}
                      />
                    </Field>
                    <Field>
                      <Label htmlFor={`packages.${index}.heightCm`}>Height cm</Label>
                      <Input
                        id={`packages.${index}.heightCm`}
                        min="0"
                        name={`packages.${index}.heightCm`}
                        onChange={(event) => updatePackage(index, { heightCm: event.target.value })}
                        required={index === 0}
                        step="0.001"
                        type="number"
                        value={shipmentPackage.heightCm}
                      />
                    </Field>
                    <Field>
                      <Label htmlFor={`packages.${index}.declaredValue`}>Declared value</Label>
                      <Input
                        id={`packages.${index}.declaredValue`}
                        min="0"
                        name={`packages.${index}.declaredValue`}
                        onChange={(event) =>
                          updatePackage(index, { declaredValue: event.target.value })
                        }
                        step="0.01"
                        type="number"
                        value={shipmentPackage.declaredValue}
                      />
                    </Field>
                    <div className="flex items-center gap-4 pt-6">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input
                          checked={shipmentPackage.fragile}
                          name={`packages.${index}.fragile`}
                          onChange={(event) =>
                            updatePackage(index, { fragile: event.target.checked })
                          }
                          type="checkbox"
                        />
                        Fragile
                      </label>
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input
                          checked={shipmentPackage.hazardous}
                          name={`packages.${index}.hazardous`}
                          onChange={(event) =>
                            updatePackage(index, { hazardous: event.target.checked })
                          }
                          type="checkbox"
                        />
                        Hazardous
                      </label>
                    </div>
                    <Field className="sm:col-span-2 lg:col-span-4">
                      <Label htmlFor={`packages.${index}.description`}>Contents</Label>
                      <Textarea
                        id={`packages.${index}.description`}
                        name={`packages.${index}.description`}
                        onChange={(event) =>
                          updatePackage(index, { description: event.target.value })
                        }
                        placeholder="Describe package contents"
                        required={index === 0}
                        value={shipmentPackage.description}
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
          <Card>
            <CardHeader className="flex flex-row items-start gap-3">
              <div className="bg-accent/15 text-accent-foreground grid size-10 place-items-center rounded-md">
                <Calculator aria-hidden="true" className="size-5" />
              </div>
              <div>
                <CardTitle>Live parcel quote</CardTitle>
                <p className="text-muted-foreground mt-1 text-sm">
                  Estimate updates as package weight changes.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                ["Actual weight", `${kilogramsToPounds(quote.actualWeightKg).toFixed(2)} lb`],
                [
                  "Dimensional weight",
                  `${kilogramsToPounds(quote.dimensionalWeightKg).toFixed(2)} lb`,
                ],
                [
                  "Chargeable weight",
                  `${kilogramsToPounds(quote.chargeableWeightKg).toFixed(2)} lb`,
                ],
                ["Line haul", `$${quote.lineHaul.toFixed(2)}`],
                ["Fuel surcharge", `$${quote.fuelSurcharge.toFixed(2)}`],
                [
                  "Service add-ons",
                  `$${(quote.fragileFee + quote.hazardousFee + quote.signatureFee + quote.insuranceFee).toFixed(2)}`,
                ],
                ["Tax", `$${quote.taxTotal.toFixed(2)}`],
              ].map(([label, value]) => (
                <div className="flex items-center justify-between gap-4" key={label}>
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
              <div className="border-border flex items-center justify-between border-t pt-3 text-base">
                <span className="font-semibold">Estimated total</span>
                <span className="text-xl font-semibold">${quote.total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
          <div className="flex flex-wrap justify-end gap-3">
            <Button asChild variant="outline">
              <Link href={"/shipments" as Route}>Cancel</Link>
            </Button>
            <Button disabled={isPending} type="submit" variant="accent">
              {isPending
                ? "Saving..."
                : isCustomerBooking
                  ? "Submit parcel booking"
                  : "Create parcel shipment"}
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </aside>
      </div>
    </form>
  );
}
