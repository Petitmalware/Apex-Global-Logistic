"use client";

import { useActionState } from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ShipmentActionState } from "@/features/shipments/types";
import { initialShipmentActionState } from "@/features/shipments/types";

const documentTypeOptions = [
  "Commercial invoice",
  "Packing list",
  "Proof of delivery",
  "Customs form",
  "Pet health certificate",
  "Photo evidence",
  "Other",
];

export function ShipmentDocumentForm({
  action,
}: {
  action: (state: ShipmentActionState, formData: FormData) => Promise<ShipmentActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, initialShipmentActionState);

  return (
    <form action={formAction} className="space-y-4" encType="multipart/form-data">
      {state.message ? (
        <p className="border-border bg-secondary text-secondary-foreground rounded-md border px-3 py-2 text-sm">
          {state.message}
        </p>
      ) : null}
      <Field>
        <Label htmlFor="documentType">Document type</Label>
        <Select id="documentType" name="documentType" required>
          {documentTypeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </Field>
      <Field>
        <Label htmlFor="file">Document</Label>
        <Input
          accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
          id="file"
          name="file"
          required
          type="file"
        />
        <FieldHint>PDF, image, text, or Word document. Max size 10MB.</FieldHint>
      </Field>
      <Field>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" placeholder="Optional document context" />
      </Field>
      <Button disabled={isPending} type="submit" variant="outline">
        <Upload aria-hidden="true" />
        {isPending ? "Uploading..." : "Upload document"}
      </Button>
    </form>
  );
}
