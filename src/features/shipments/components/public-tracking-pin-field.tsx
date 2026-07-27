"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";

import { Field, FieldError, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PublicTrackingPinFieldProps = {
  className?: string;
  errors?: string[];
  hasExistingPin?: boolean;
  initiallyEnabled?: boolean;
};

export function PublicTrackingPinField({
  className,
  errors,
  hasExistingPin = false,
  initiallyEnabled = false,
}: PublicTrackingPinFieldProps) {
  const [isEnabled, setIsEnabled] = useState(initiallyEnabled);

  return (
    <Field className={`border-border bg-secondary/35 rounded-md border p-4 ${className ?? ""}`}>
      <div className="flex items-start gap-3">
        <input
          checked={isEnabled}
          className="accent-accent mt-1 size-4"
          id="publicTrackingPinEnabled"
          name="publicTrackingPinEnabled"
          onChange={(event) => setIsEnabled(event.target.checked)}
          type="checkbox"
        />
        <div className="min-w-0">
          <Label className="flex items-center gap-2" htmlFor="publicTrackingPinEnabled">
            <KeyRound aria-hidden="true" className="text-accent size-4" />
            Protect contact details with a recipient PIN
          </Label>
          <FieldHint>
            Optional. The tracking number will still show status and checkpoints. The PIN is
            required before contact details, pet information, and the printable receipt are shown.
          </FieldHint>
        </div>
      </div>
      {isEnabled ? (
        <div className="mt-4 max-w-sm space-y-2">
          <Label htmlFor="recipientTrackingPin">
            {hasExistingPin ? "Replace recipient PIN (optional)" : "Recipient PIN"}
          </Label>
          <Input
            autoComplete="new-password"
            id="recipientTrackingPin"
            inputMode="numeric"
            maxLength={12}
            minLength={4}
            name="recipientTrackingPin"
            pattern="[0-9]{4,12}"
            placeholder="4 to 12 digits"
            type="password"
          />
          <FieldHint>
            {hasExistingPin
              ? "A PIN is already active. Leave this blank to keep it, or enter a new one to replace it."
              : "Share this PIN directly with the recipient. It cannot be viewed after saving."}
          </FieldHint>
          {errors?.[0] ? <FieldError>{errors[0]}</FieldError> : null}
        </div>
      ) : null}
    </Field>
  );
}
