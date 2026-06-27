"use client";

import { useActionState } from "react";
import { Camera } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ShipmentActionState, ShipmentPackageView } from "@/features/shipments/types";
import { initialShipmentActionState } from "@/features/shipments/types";

type PackagePhotoFormProps = {
  action: (state: ShipmentActionState, formData: FormData) => Promise<ShipmentActionState>;
  packages: ShipmentPackageView[];
};

export function PackagePhotoForm({ action, packages }: PackagePhotoFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialShipmentActionState);

  return (
    <form action={formAction} className="space-y-4" encType="multipart/form-data">
      {state.message ? (
        <p className="border-border bg-secondary text-secondary-foreground rounded-md border px-3 py-2 text-sm">
          {state.message}
        </p>
      ) : null}
      <Field>
        <Label htmlFor="packageId">Package</Label>
        <Select id="packageId" name="packageId" required>
          {packages.map((shipmentPackage) => (
            <option key={shipmentPackage.id} value={shipmentPackage.id}>
              {shipmentPackage.packageNumber}
            </option>
          ))}
        </Select>
      </Field>
      <Field>
        <Label htmlFor="file">Package photo</Label>
        <Input accept=".jpg,.jpeg,.png,.webp" id="file" name="file" required type="file" />
        <FieldHint>JPG, PNG, or WebP package evidence. Max size 8MB.</FieldHint>
      </Field>
      <Field>
        <Label htmlFor="caption">Caption</Label>
        <Textarea id="caption" name="caption" placeholder="Condition note or handling context" />
      </Field>
      <Button disabled={isPending || packages.length === 0} type="submit" variant="outline">
        <Camera aria-hidden="true" />
        {isPending ? "Uploading..." : "Upload photo"}
      </Button>
    </form>
  );
}
