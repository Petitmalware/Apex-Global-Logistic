"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { CustomerOption } from "@/features/shipments/types";

export function CustomerSelectCard({
  allowManualRecipient = false,
  customerOptions,
  defaultCustomerId,
  emptyLabel = "No registered customers found",
  errors,
  hint = "Select a registered customer when available, or enter manual recipient details for customers who do not want an account.",
  label = "Registered customer account",
  manualRecipientHint = "Use this when the recipient is not registered. The shipment can still be created, tracked, invoiced, and documented using their name, email, optional phone, and delivery address.",
  placeholder = "Manual recipient / no account",
  title = "Recipient",
}: {
  allowManualRecipient?: boolean;
  customerOptions: CustomerOption[];
  defaultCustomerId?: string | null;
  emptyLabel?: string;
  errors?: string[];
  hint?: string;
  label?: string;
  manualRecipientHint?: string;
  placeholder?: string;
  title?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <FieldHint>{hint}</FieldHint>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field>
          <Label htmlFor="customerId">{label}</Label>
          <Select
            defaultValue={defaultCustomerId ?? ""}
            disabled={!customerOptions.length && !allowManualRecipient}
            id="customerId"
            name="customerId"
            required={!allowManualRecipient}
          >
            <option value="">
              {customerOptions.length || allowManualRecipient ? placeholder : emptyLabel}
            </option>
            {customerOptions.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.label}
              </option>
            ))}
          </Select>
          {errors?.length ? <FieldError>{errors.join(" ")}</FieldError> : null}
        </Field>
        {allowManualRecipient ? (
          <div className="border-border bg-surface grid gap-4 rounded-md border p-4 sm:grid-cols-3">
            <Field className="sm:col-span-3">
              <FieldHint>{manualRecipientHint}</FieldHint>
            </Field>
            <Field>
              <Label htmlFor="manualRecipient.name">Recipient name</Label>
              <Input
                id="manualRecipient.name"
                name="manualRecipient.name"
                placeholder="Recipient name"
              />
            </Field>
            <Field>
              <Label htmlFor="manualRecipient.email">Recipient email</Label>
              <Input
                id="manualRecipient.email"
                name="manualRecipient.email"
                placeholder="client@example.com"
                type="email"
              />
            </Field>
            <Field>
              <Label htmlFor="manualRecipient.phone">Recipient phone</Label>
              <Input id="manualRecipient.phone" name="manualRecipient.phone" placeholder="+1..." />
            </Field>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
