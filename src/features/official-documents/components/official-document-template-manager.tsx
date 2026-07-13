"use client";

import Link from "next/link";
import type { Route } from "next";
import { useActionState } from "react";
import { FilePlus2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notification } from "@/components/ui/notification";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  officialDocumentCategories,
  standardOfficialDocumentVariables,
} from "@/features/official-documents/data/default-official-document-templates";
import { saveOfficialDocumentTemplateAction } from "@/features/official-documents/actions/official-document.actions";
import type {
  OfficialDocumentActionState,
  OfficialDocumentTemplate,
} from "@/features/official-documents/types/official-document.types";
import { initialOfficialDocumentActionState } from "@/features/official-documents/types/official-document.types";

type OfficialDocumentTemplateFormProps = {
  defaultOpen?: boolean;
  template: OfficialDocumentTemplate;
  templateId: string | null;
};

function TemplateForm({ defaultOpen, template, templateId }: OfficialDocumentTemplateFormProps) {
  const [state, formAction, isPending] = useActionState<OfficialDocumentActionState, FormData>(
    saveOfficialDocumentTemplateAction.bind(null, templateId),
    initialOfficialDocumentActionState,
  );

  return (
    <details className="group" open={defaultOpen}>
      <summary className="border-border bg-card hover:bg-secondary/50 flex cursor-pointer list-none items-start justify-between gap-4 rounded-lg border p-4 transition-colors">
        <div>
          <p className="font-semibold">{template.title}</p>
          <p className="text-muted-foreground mt-1 text-sm">{template.description}</p>
        </div>
        <span className="text-muted-foreground text-sm group-open:hidden">Edit</span>
        <span className="text-muted-foreground hidden text-sm group-open:inline">Close</span>
      </summary>
      <Card className="mt-3">
        <CardHeader>
          <CardTitle>
            {templateId ? "Edit document template" : "Add billing or document form"}
          </CardTitle>
          <CardDescription>
            Content remains editable and uses variables instead of hardcoded customer details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            {state.message ? (
              <Notification
                title="Official document"
                variant={state.status === "success" ? "success" : "danger"}
              >
                {state.message}
              </Notification>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <Label htmlFor={`${template.id}-title`}>Title</Label>
                <Input defaultValue={template.title} id={`${template.id}-title`} name="title" />
                {state.fieldErrors?.title?.[0] ? (
                  <FieldError>{state.fieldErrors.title[0]}</FieldError>
                ) : null}
              </Field>
              <Field>
                <Label htmlFor={`${template.id}-slug`}>Slug</Label>
                <Input defaultValue={template.slug} id={`${template.id}-slug`} name="slug" />
                {state.fieldErrors?.slug?.[0] ? (
                  <FieldError>{state.fieldErrors.slug[0]}</FieldError>
                ) : null}
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <Label htmlFor={`${template.id}-category`}>Category</Label>
                <Select
                  defaultValue={template.category}
                  id={`${template.id}-category`}
                  name="category"
                >
                  {officialDocumentCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field>
                <Label htmlFor={`${template.id}-subject`}>Subject</Label>
                <Input
                  defaultValue={template.subject}
                  id={`${template.id}-subject`}
                  name="subject"
                />
              </Field>
            </div>

            <Field>
              <Label htmlFor={`${template.id}-description`}>Internal description</Label>
              <Input
                defaultValue={template.description}
                id={`${template.id}-description`}
                name="description"
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <Label htmlFor={`${template.id}-amountLabel`}>Billing label</Label>
                <Input
                  defaultValue={template.amountLabel ?? ""}
                  id={`${template.id}-amountLabel`}
                  name="amountLabel"
                />
              </Field>
              <Field>
                <Label htmlFor={`${template.id}-amountDefault`}>Default amount</Label>
                <Input
                  defaultValue={template.amountDefault ?? ""}
                  id={`${template.id}-amountDefault`}
                  name="amountDefault"
                />
              </Field>
            </div>

            <Field>
              <Label htmlFor={`${template.id}-refundTerms`}>Terms / refund language</Label>
              <Textarea
                defaultValue={template.refundTerms ?? ""}
                id={`${template.id}-refundTerms`}
                name="refundTerms"
              />
            </Field>

            <Field>
              <Label htmlFor={`${template.id}-paymentInstructions`}>Payment instructions</Label>
              <Textarea
                defaultValue={template.paymentInstructions ?? ""}
                id={`${template.id}-paymentInstructions`}
                name="paymentInstructions"
              />
              <FieldHint>Use official Apex invoice or payment portal wording only.</FieldHint>
            </Field>

            <Field>
              <Label htmlFor={`${template.id}-variables`}>Variables</Label>
              <Input
                defaultValue={template.variables.join(", ")}
                id={`${template.id}-variables`}
                name="variables"
              />
              <FieldHint>
                Suggested:{" "}
                {standardOfficialDocumentVariables.map((item) => `{{${item}}}`).join(", ")}
              </FieldHint>
            </Field>

            <Field>
              <Label htmlFor={`${template.id}-body`}>Document body</Label>
              <Textarea
                className="min-h-80 font-mono text-sm"
                defaultValue={template.body}
                id={`${template.id}-body`}
                name="body"
              />
              {state.fieldErrors?.body?.[0] ? (
                <FieldError>{state.fieldErrors.body[0]}</FieldError>
              ) : null}
            </Field>

            <label className="flex items-center gap-3 text-sm font-semibold">
              <input
                className="accent-primary"
                defaultChecked={template.isActive}
                name="isActive"
                type="checkbox"
              />
              Active document template
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3">
              {templateId ? (
                <Button asChild type="button" variant="outline">
                  <Link href={`/admin/documents/${template.id}` as Route}>Preview / download</Link>
                </Button>
              ) : (
                <span />
              )}
              <Button disabled={isPending} type="submit" variant="accent">
                <Save aria-hidden="true" />
                {isPending ? "Saving..." : "Save document"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </details>
  );
}

function getBlankTemplate(): OfficialDocumentTemplate {
  return {
    amountDefault: "",
    amountLabel: "Billing amount",
    body: `Dear {{recipientName}},

This official document has been prepared by {{companyName}} for the shipment or account referenced below.

Tracking number: {{trackingNumber}}
Amount: {{amountDue}}
Terms: {{refundTerms}}

Please review the details and contact Apex support if any correction is required before payment or approval is completed.`,
    category: "Billing notice",
    description: "Reusable billing or authorization form.",
    id: "new-official-document",
    isActive: true,
    paymentInstructions: "Use the approved Apex invoice or payment portal.",
    refundTerms: "Enter the applicable billing, refund, or adjustment terms.",
    slug: "new-official-document",
    subject: "Official Document for {{trackingNumber}}",
    title: "New Official Document",
    variables: standardOfficialDocumentVariables,
  };
}

export function OfficialDocumentTemplateManager({
  templates,
}: {
  templates: OfficialDocumentTemplate[];
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-wrap items-start gap-3">
          <div className="bg-accent/15 text-accent-foreground grid size-10 place-items-center rounded-md">
            <FilePlus2 aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle>Official document library</CardTitle>
            <CardDescription>
              Editable letterhead-ready templates for pet transport notices, compliance records,
              clearance documents, and billing forms.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="accent">
              <Link href={"/admin/emails/compose" as Route}>Send by email</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={"/admin/invoices/new" as Route}>Issue invoice</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {templates.map((template) => (
        <TemplateForm key={template.id} template={template} templateId={template.id} />
      ))}

      <TemplateForm defaultOpen template={getBlankTemplate()} templateId={null} />
    </div>
  );
}
