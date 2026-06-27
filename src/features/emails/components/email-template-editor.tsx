"use client";

import { useActionState, useState } from "react";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notification } from "@/components/ui/notification";
import { Select } from "@/components/ui/select";
import { emailCategoryLabels, emailCategoryValues } from "@/features/emails/constants";
import { updateEmailTemplateAction } from "@/features/emails/actions/email.actions";
import { RichTextEditor } from "@/features/emails/components/rich-text-editor";
import { initialEmailActionState, type EmailTemplateDetail } from "@/features/emails/types";

export function EmailTemplateEditor({ template }: { template: EmailTemplateDetail }) {
  const [bodyHtml, setBodyHtml] = useState(template.bodyHtml);
  const [state, formAction, isPending] = useActionState(
    updateEmailTemplateAction.bind(null, template.id),
    initialEmailActionState,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{template.name}</CardTitle>
        <CardDescription>
          Edit the reusable template content used by branded email sends.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          {state.message ? (
            <Notification
              title="Template editor"
              variant={state.status === "success" ? "success" : "danger"}
            >
              {state.message}
            </Notification>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Label htmlFor="name">Name</Label>
              <Input defaultValue={template.name} id="name" name="name" />
            </Field>
            <Field>
              <Label htmlFor="category">Category</Label>
              <Select defaultValue={template.category} id="category" name="category">
                {emailCategoryValues.map((value) => (
                  <option key={value} value={value}>
                    {emailCategoryLabels[value]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field>
            <Label htmlFor="subject">Subject</Label>
            <Input defaultValue={template.subject} id="subject" name="subject" />
          </Field>
          <Field>
            <Label htmlFor="preheader">Preheader</Label>
            <Input defaultValue={template.preheader ?? ""} id="preheader" name="preheader" />
          </Field>
          <Field>
            <Label htmlFor="variables">Variables</Label>
            <Input defaultValue={template.variables.join(", ")} id="variables" name="variables" />
            <FieldHint>Comma-separated variable names available in this template.</FieldHint>
          </Field>
          <Field>
            <Label htmlFor="bodyHtml">Body</Label>
            <RichTextEditor id="bodyHtml" name="bodyHtml" onChange={setBodyHtml} value={bodyHtml} />
          </Field>
          <label className="flex items-center gap-3">
            <input
              className="accent-primary"
              defaultChecked={template.isActive}
              name="isActive"
              type="checkbox"
            />
            <span className="text-sm font-semibold">Active template</span>
          </label>
          <Button disabled={isPending} type="submit" variant="accent">
            <Save aria-hidden="true" />
            {isPending ? "Saving..." : "Save template"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
