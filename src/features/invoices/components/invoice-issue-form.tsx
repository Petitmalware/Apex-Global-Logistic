"use client";

import Link from "next/link";
import type { Route } from "next";
import { useActionState } from "react";
import { ArrowLeft, ReceiptText, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  InvoiceActionState,
  ShipmentInvoiceOption,
} from "@/features/invoices/types/invoice.types";
import { initialInvoiceActionState } from "@/features/invoices/types/invoice.types";
import type { CustomerOption } from "@/features/shipments/types";

type InvoiceIssueFormProps = {
  action: (state: InvoiceActionState, formData: FormData) => Promise<InvoiceActionState>;
  customerOptions: CustomerOption[];
  shipmentOptions: ShipmentInvoiceOption[];
};

const lineTypes = ["SERVICE", "SURCHARGE", "TAX", "DISCOUNT", "ADJUSTMENT"] as const;

function FormMessage({ state }: { state: InvoiceActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  return (
    <p className="border-border bg-secondary text-secondary-foreground rounded-md border px-3 py-2 text-sm">
      {state.message}
    </p>
  );
}

export function InvoiceIssueForm({
  action,
  customerOptions,
  shipmentOptions,
}: InvoiceIssueFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialInvoiceActionState);

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start gap-3">
          <div className="bg-success/10 text-success grid size-10 place-items-center rounded-md">
            <ReceiptText aria-hidden="true" className="size-5" />
          </div>
          <div>
            <CardTitle>Issue customer invoice</CardTitle>
            <FieldHint>
              Select a registered account when available, or enter manual bill-to details for a
              customer who does not want an account.
            </FieldHint>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <Field>
              <Label htmlFor="customerId">Registered customer account</Label>
              <Select id="customerId" name="customerId">
                <option value="">Manual bill-to customer</option>
                {customerOptions.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.label}
                  </option>
                ))}
              </Select>
              <FieldHint>
                Leave blank when the recipient should not create or use an account.
              </FieldHint>
              {state.fieldErrors?.customerId?.[0] ? (
                <FieldError>{state.fieldErrors.customerId[0]}</FieldError>
              ) : null}
            </Field>
            <Field>
              <Label htmlFor="shipmentId">Shipment</Label>
              <Select id="shipmentId" name="shipmentId">
                <option value="">No shipment link</option>
                {shipmentOptions.map((shipment) => (
                  <option key={shipment.id} value={shipment.id}>
                    {shipment.label} - {shipment.customerLabel}
                  </option>
                ))}
              </Select>
              <FieldHint>
                Optional. The invoice can be linked to a registered or manually addressed shipment.
              </FieldHint>
            </Field>
          </div>

          <div className="border-border bg-surface rounded-lg border p-4">
            <div>
              <p className="text-sm font-semibold">Manual bill-to contact</p>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                Use this for customers who only want to receive documents by email or print, without
                creating a portal account.
              </p>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Field>
                <Label htmlFor="manualBillingContact.name">Name</Label>
                <Input
                  id="manualBillingContact.name"
                  name="manualBillingContact.name"
                  placeholder="Customer full name"
                />
              </Field>
              <Field>
                <Label htmlFor="manualBillingContact.email">Email address</Label>
                <Input
                  id="manualBillingContact.email"
                  name="manualBillingContact.email"
                  placeholder="customer@example.com"
                  type="email"
                />
              </Field>
              <Field>
                <Label htmlFor="manualBillingContact.phone">Phone number</Label>
                <Input
                  id="manualBillingContact.phone"
                  name="manualBillingContact.phone"
                  placeholder="Optional"
                />
              </Field>
            </div>
            {state.fieldErrors?.manualBillingContact?.[0] ? (
              <FieldError className="mt-3">
                {state.fieldErrors.manualBillingContact.join(" ")}
              </FieldError>
            ) : null}
          </div>

          <div className="border-border bg-surface rounded-lg border p-4">
            <div>
              <p className="text-sm font-semibold">Bill-to house address</p>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                This address appears on the official invoice and can be used even when no customer
                account exists.
              </p>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field>
                <Label htmlFor="billingAddress.name">Address name</Label>
                <Input
                  id="billingAddress.name"
                  name="billingAddress.name"
                  placeholder="Residence, office, or contact"
                />
              </Field>
              <Field>
                <Label htmlFor="billingAddress.countryCode">Country code</Label>
                <Input
                  id="billingAddress.countryCode"
                  maxLength={2}
                  name="billingAddress.countryCode"
                  placeholder="US"
                />
              </Field>
              <Field className="sm:col-span-2">
                <Label htmlFor="billingAddress.line1">Address line 1</Label>
                <Input
                  id="billingAddress.line1"
                  name="billingAddress.line1"
                  placeholder="Street address"
                />
              </Field>
              <Field className="sm:col-span-2">
                <Label htmlFor="billingAddress.line2">Address line 2</Label>
                <Input
                  id="billingAddress.line2"
                  name="billingAddress.line2"
                  placeholder="Apartment, suite, unit"
                />
              </Field>
              <Field>
                <Label htmlFor="billingAddress.city">City</Label>
                <Input id="billingAddress.city" name="billingAddress.city" />
              </Field>
              <Field>
                <Label htmlFor="billingAddress.state">State / region</Label>
                <Input id="billingAddress.state" name="billingAddress.state" />
              </Field>
              <Field>
                <Label htmlFor="billingAddress.postalCode">Postal code</Label>
                <Input id="billingAddress.postalCode" name="billingAddress.postalCode" />
              </Field>
            </div>
            {state.fieldErrors?.billingAddress?.[0] ? (
              <FieldError className="mt-3">{state.fieldErrors.billingAddress.join(" ")}</FieldError>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field>
              <Label htmlFor="currency">Currency</Label>
              <Input defaultValue="USD" id="currency" maxLength={3} name="currency" required />
            </Field>
            <Field>
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" name="dueDate" type="date" />
            </Field>
            <Field>
              <Label htmlFor="notes">Invoice note</Label>
              <Input id="notes" name="notes" placeholder="Payment due on receipt" />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice lines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div
              className="border-border grid gap-3 rounded-lg border p-3 lg:grid-cols-[1.4fr_150px_120px_140px_120px]"
              key={index}
            >
              <Field>
                <Label htmlFor={`lineItems.${index}.description`}>
                  {index === 0 ? "Description" : `Description ${index + 1}`}
                </Label>
                <Textarea
                  className="min-h-20"
                  id={`lineItems.${index}.description`}
                  name={`lineItems.${index}.description`}
                  placeholder={
                    index === 0
                      ? "International pet transportation service"
                      : "Optional additional service"
                  }
                  required={index === 0}
                />
              </Field>
              <Field>
                <Label htmlFor={`lineItems.${index}.lineType`}>Type</Label>
                <Select
                  defaultValue="SERVICE"
                  id={`lineItems.${index}.lineType`}
                  name={`lineItems.${index}.lineType`}
                >
                  {lineTypes.map((lineType) => (
                    <option key={lineType} value={lineType}>
                      {lineType.replaceAll("_", " ")}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field>
                <Label htmlFor={`lineItems.${index}.quantity`}>Qty</Label>
                <Input
                  defaultValue={index === 0 ? "1" : ""}
                  id={`lineItems.${index}.quantity`}
                  min="0.001"
                  name={`lineItems.${index}.quantity`}
                  step="0.001"
                  type="number"
                />
              </Field>
              <Field>
                <Label htmlFor={`lineItems.${index}.unitPrice`}>Unit price</Label>
                <Input
                  id={`lineItems.${index}.unitPrice`}
                  min="0"
                  name={`lineItems.${index}.unitPrice`}
                  step="0.01"
                  type="number"
                />
              </Field>
              <Field>
                <Label htmlFor={`lineItems.${index}.taxRate`}>Tax %</Label>
                <Input
                  defaultValue="0"
                  id={`lineItems.${index}.taxRate`}
                  min="0"
                  name={`lineItems.${index}.taxRate`}
                  step="0.01"
                  type="number"
                />
              </Field>
            </div>
          ))}

          {state.fieldErrors?.lineItems?.[0] ? (
            <FieldError>{state.fieldErrors.lineItems[0]}</FieldError>
          ) : null}
          <FormMessage state={state} />

          <div className="flex flex-wrap justify-between gap-3">
            <Button asChild variant="outline">
              <Link href={"/admin/invoices" as Route}>
                <ArrowLeft aria-hidden="true" />
                Back to invoices
              </Link>
            </Button>
            <Button disabled={isPending} type="submit" variant="accent">
              <Send aria-hidden="true" />
              {isPending ? "Issuing..." : "Issue invoice"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
