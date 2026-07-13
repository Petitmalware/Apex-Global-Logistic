"use client";

import { useActionState } from "react";
import { Building2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CompanyProfileInput } from "@/features/settings/schemas/company-profile.schema";
import {
  initialCompanyProfileActionState,
  type CompanyProfileActionState,
} from "@/features/settings/types/company-profile";

type CompanyProfileFormProps = {
  action: (
    state: CompanyProfileActionState,
    formData: FormData,
  ) => Promise<CompanyProfileActionState>;
  profile: CompanyProfileInput;
};

function FormMessage({ state }: { state: CompanyProfileActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  return (
    <p className="border-border bg-secondary text-secondary-foreground rounded-md border px-3 py-2 text-sm">
      {state.message}
    </p>
  );
}

export function CompanyProfileForm({ action, profile }: CompanyProfileFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialCompanyProfileActionState);

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start gap-3">
          <div className="bg-accent/15 text-accent-foreground grid size-10 place-items-center rounded-md">
            <Building2 aria-hidden="true" className="size-5" />
          </div>
          <div>
            <CardTitle>Public company details</CardTitle>
            <FieldHint>
              Empty fields are hidden on the public contact page and professional invoices.
            </FieldHint>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Label htmlFor="email">Support email</Label>
              <Input
                defaultValue={profile.email ?? ""}
                id="email"
                name="email"
                placeholder="support@apexgloballogistics.com"
                type="email"
              />
              {state.fieldErrors?.email?.[0] ? (
                <FieldError>{state.fieldErrors.email[0]}</FieldError>
              ) : null}
            </Field>
            <Field>
              <Label htmlFor="phone">Phone number</Label>
              <Input
                defaultValue={profile.phone ?? ""}
                id="phone"
                name="phone"
                placeholder="+1 555 014 8848"
              />
              {state.fieldErrors?.phone?.[0] ? (
                <FieldError>{state.fieldErrors.phone[0]}</FieldError>
              ) : null}
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Label htmlFor="website">Website</Label>
              <Input
                defaultValue={profile.website ?? ""}
                id="website"
                name="website"
                placeholder="https://apexgloballogistics.com"
              />
            </Field>
            <Field>
              <Label htmlFor="businessHours">Business hours</Label>
              <Input
                defaultValue={profile.businessHours ?? ""}
                id="businessHours"
                name="businessHours"
                placeholder="Mon-Fri, 8:00 AM-6:00 PM"
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Label htmlFor="addressLine1">Address line 1</Label>
              <Input
                defaultValue={profile.addressLine1 ?? ""}
                id="addressLine1"
                name="addressLine1"
                placeholder="Operations center"
              />
            </Field>
            <Field>
              <Label htmlFor="addressLine2">Address line 2</Label>
              <Input
                defaultValue={profile.addressLine2 ?? ""}
                id="addressLine2"
                name="addressLine2"
                placeholder="Suite, floor, or terminal"
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Field>
              <Label htmlFor="city">City</Label>
              <Input defaultValue={profile.city ?? ""} id="city" name="city" />
            </Field>
            <Field>
              <Label htmlFor="state">State</Label>
              <Input defaultValue={profile.state ?? ""} id="state" name="state" />
            </Field>
            <Field>
              <Label htmlFor="postalCode">Postal code</Label>
              <Input defaultValue={profile.postalCode ?? ""} id="postalCode" name="postalCode" />
            </Field>
            <Field>
              <Label htmlFor="country">Country</Label>
              <Input defaultValue={profile.country ?? ""} id="country" name="country" />
            </Field>
          </div>

          <Field>
            <Label htmlFor="taxId">Tax or registration ID</Label>
            <Textarea
              defaultValue={profile.taxId ?? ""}
              id="taxId"
              name="taxId"
              placeholder="Displayed only when provided."
            />
          </Field>

          <FormMessage state={state} />

          <div className="flex justify-end">
            <Button disabled={isPending} type="submit" variant="accent">
              <Save aria-hidden="true" />
              {isPending ? "Saving..." : "Save company details"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
