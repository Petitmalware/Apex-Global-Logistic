"use client";

import { useMemo, useState } from "react";
import { Bot, Eye, MailCheck, Send, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notification } from "@/components/ui/notification";
import { Select } from "@/components/ui/select";
import {
  emailCategoryLabels,
  emailCategoryValues,
  emailVariableKeys,
  type EmailCategoryValue,
} from "@/features/emails/constants";
import { RichTextEditor } from "@/features/emails/components/rich-text-editor";
import type { EmailComposerOptions, EmailPreview } from "@/features/emails/types";
import { secureFetch } from "@/lib/security/client-fetch";

type EmailComposerProps = {
  initialTemplateId?: string;
  options: EmailComposerOptions;
};

type ComposerMessage = {
  text: string;
  variant: "danger" | "info" | "success" | "warning";
};

function getInitialBody(options: EmailComposerOptions) {
  return (
    options.templates.find((template) => template.slug === "custom-manual-email")?.bodyHtml ??
    "<p></p>"
  );
}

function getInitialTemplate(options: EmailComposerOptions, initialTemplateId?: string) {
  return (
    options.templates.find((template) => template.id === initialTemplateId) ??
    options.templates.find((template) => template.slug === "custom-manual-email")
  );
}

export function EmailComposer({ initialTemplateId, options }: EmailComposerProps) {
  const initialTemplate = getInitialTemplate(options, initialTemplateId);
  const [bodyHtml, setBodyHtml] = useState(initialTemplate?.bodyHtml ?? getInitialBody(options));
  const [category, setCategory] = useState<EmailCategoryValue>(
    initialTemplate?.category ?? "MANUAL",
  );
  const [message, setMessage] = useState<ComposerMessage | null>(null);
  const [preview, setPreview] = useState<EmailPreview | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientUserId, setRecipientUserId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplate?.id ?? "");
  const [shipmentId, setShipmentId] = useState("");
  const [subject, setSubject] = useState(initialTemplate?.subject ?? "");
  const [templateId, setTemplateId] = useState(
    initialTemplate?.source === "email" ? (initialTemplate.templateId ?? initialTemplate.id) : "",
  );
  const [testRecipientEmail, setTestRecipientEmail] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [variables, setVariables] = useState<Record<string, string>>(
    initialTemplate?.defaultVariables ?? {},
  );
  const [isBusy, setIsBusy] = useState(false);

  const selectedTemplate = useMemo(
    () => options.templates.find((template) => template.id === selectedTemplateId),
    [options.templates, selectedTemplateId],
  );
  const builtInTemplates = useMemo(
    () => options.templates.filter((template) => template.source === "built_in_client_email"),
    [options.templates],
  );
  const databaseTemplates = useMemo(
    () => options.templates.filter((template) => template.source === "email"),
    [options.templates],
  );
  const selectedShipment = useMemo(
    () => options.shipments.find((shipment) => shipment.id === shipmentId),
    [options.shipments, shipmentId],
  );
  const payload = {
    bodyHtml,
    category,
    recipientEmail,
    recipientName,
    recipientUserId,
    shipmentId,
    subject,
    templateId,
    trackingNumber,
    variables,
  };

  function chooseTemplate(nextTemplateId: string) {
    const template =
      options.templates.find((item) => item.id === nextTemplateId) ??
      options.templates.find((item) => item.slug === "custom-manual-email");

    setSelectedTemplateId(template?.id ?? "");
    setTemplateId(template?.source === "email" ? (template.templateId ?? template.id) : "");
    setPreview(null);

    if (template) {
      setBodyHtml(template.bodyHtml);
      setCategory(template.category);
      setSubject(template.subject);
      setVariables((current) => ({
        ...current,
        ...(template.defaultVariables ?? {}),
      }));
    }
  }

  function chooseShipment(nextShipmentId: string) {
    const shipment = options.shipments.find((item) => item.id === nextShipmentId);

    setShipmentId(nextShipmentId);
    setPreview(null);

    if (shipment) {
      setTrackingNumber(shipment.shipmentNumber);
      setRecipientUserId("");

      if (shipment.customerEmail) {
        setRecipientEmail(shipment.customerEmail);
      }

      if (shipment.customerName) {
        setRecipientName(shipment.customerName);
      }

      setVariables((current) => ({
        ...current,
        customerName: shipment.customerName ?? current.customerName ?? "",
        recipientName: shipment.customerName ?? current.recipientName ?? "",
        shipmentStatus: shipment.status.replaceAll("_", " "),
        trackingNumber: shipment.shipmentNumber,
      }));
    }
  }

  function insertVariable(variable: string) {
    setBodyHtml((current) => `${current}<p>{{${variable}}}</p>`);
  }

  async function postJson<T>(url: string, body: unknown) {
    const response = await secureFetch(url, {
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const data = (await response.json().catch(() => ({}))) as T & { message?: string };

    if (!response.ok) {
      throw new Error(data.message ?? "Request failed.");
    }

    return data;
  }

  async function previewEmail() {
    setIsBusy(true);
    setMessage(null);

    try {
      const data = await postJson<{ preview: EmailPreview }>("/api/admin/emails/preview", payload);
      setPreview(data.preview);
      setMessage({ text: "Preview generated.", variant: "success" });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Unable to generate preview.",
        variant: "danger",
      });
    } finally {
      setIsBusy(false);
    }
  }

  async function sendTestEmail() {
    setIsBusy(true);
    setMessage(null);

    try {
      await postJson("/api/admin/emails/send-test", {
        ...payload,
        testRecipientEmail,
      });
      setMessage({ text: "Test email queued.", variant: "success" });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Unable to send test email.",
        variant: "danger",
      });
    } finally {
      setIsBusy(false);
    }
  }

  async function sendFinalEmail() {
    if (!preview) {
      setMessage({
        text: "Generate and review the preview before final send.",
        variant: "warning",
      });
      return;
    }

    setIsBusy(true);
    setMessage(null);

    try {
      await postJson("/api/admin/emails/send", payload);
      setMessage({ text: "Final email queued.", variant: "success" });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Unable to send final email.",
        variant: "danger",
      });
    } finally {
      setIsBusy(false);
    }
  }

  async function improveWithAi() {
    setIsBusy(true);
    setMessage(null);

    try {
      const data = await postJson<{ bodyHtml: string }>("/api/admin/emails/improve", { bodyHtml });
      setBodyHtml(data.bodyHtml);
      setPreview(null);
      setMessage({ text: "AI assist draft ready for review.", variant: "info" });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Unable to improve message.",
        variant: "danger",
      });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_28rem]">
      <div className="space-y-6">
        {message ? (
          <Notification title="Email Studio" variant={message.variant}>
            {message.text}
          </Notification>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Compose email</CardTitle>
            <CardDescription>
              Manual messages and system templates render through the same branded layout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <Label htmlFor="templateId">Template</Label>
                <Select
                  id="templateId"
                  value={selectedTemplateId}
                  onChange={(event) => chooseTemplate(event.target.value)}
                >
                  <option value="">Custom manual email</option>
                  {builtInTemplates.length ? (
                    <optgroup label="Built-in client emails">
                      {builtInTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.label}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                  {databaseTemplates.length ? (
                    <optgroup label="Editable system templates">
                      {databaseTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.label}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                </Select>
              </Field>
              <Field>
                <Label htmlFor="category">Category</Label>
                <Select
                  id="category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as EmailCategoryValue)}
                >
                  {emailCategoryValues.map((value) => (
                    <option key={value} value={value}>
                      {emailCategoryLabels[value]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <Label htmlFor="recipientUserId">Recipient user</Label>
                <Select
                  id="recipientUserId"
                  value={recipientUserId}
                  onChange={(event) => {
                    const user = options.recipients.find((item) => item.id === event.target.value);
                    setRecipientUserId(event.target.value);
                    setPreview(null);

                    if (user) {
                      setRecipientEmail("");
                      setRecipientName(user.name);
                    }
                  }}
                >
                  <option value="">Manual recipient</option>
                  {options.recipients.map((recipient) => (
                    <option key={recipient.id} value={recipient.id}>
                      {recipient.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field>
                <Label htmlFor="recipientEmail">Manual email</Label>
                <Input
                  id="recipientEmail"
                  onChange={(event) => {
                    setRecipientEmail(event.target.value);
                    setPreview(null);
                  }}
                  placeholder="client@example.com"
                  type="email"
                  value={recipientEmail}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <Label htmlFor="recipientName">Recipient name</Label>
                <Input
                  id="recipientName"
                  onChange={(event) => setRecipientName(event.target.value)}
                  placeholder="Customer name"
                  value={recipientName}
                />
              </Field>
              <Field>
                <Label htmlFor="shipmentId">Attach shipment</Label>
                <Select
                  id="shipmentId"
                  value={shipmentId}
                  onChange={(event) => chooseShipment(event.target.value)}
                >
                  <option value="">No shipment attached</option>
                  {options.shipments.map((shipment) => (
                    <option key={shipment.id} value={shipment.id}>
                      {shipment.label}
                    </option>
                  ))}
                </Select>
                <FieldHint>
                  Selecting a shipment fills the tracking number and recipient email stored on the
                  shipment, including manual recipients without accounts.
                </FieldHint>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_16rem]">
              <Field>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  onChange={(event) => {
                    setSubject(event.target.value);
                    setPreview(null);
                  }}
                  value={subject}
                />
              </Field>
              <Field>
                <Label htmlFor="trackingNumber">Tracking number</Label>
                <Input
                  id="trackingNumber"
                  onChange={(event) => setTrackingNumber(event.target.value)}
                  placeholder={selectedShipment?.shipmentNumber ?? "AGL-..."}
                  value={trackingNumber}
                />
              </Field>
            </div>

            <Field>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Label htmlFor="email-body">Email body</Label>
                <Button
                  disabled={isBusy}
                  onClick={improveWithAi}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Bot aria-hidden="true" />
                  Improve with AI
                </Button>
              </div>
              <RichTextEditor id="email-body" onChange={setBodyHtml} value={bodyHtml} />
            </Field>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Sparkles aria-hidden="true" className="text-accent size-4" />
                <p className="text-sm font-semibold">Dynamic variables</p>
                {selectedTemplate ? (
                  <Badge variant="outline">{selectedTemplate.variables.length} in template</Badge>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {emailVariableKeys.map((variable) => (
                  <Button
                    key={variable}
                    onClick={() => insertVariable(variable)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {`{{${variable}}}`}
                  </Button>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {emailVariableKeys.map((variable) => (
                  <Field key={variable}>
                    <Label htmlFor={`variable-${variable}`}>{variable}</Label>
                    <Input
                      id={`variable-${variable}`}
                      onChange={(event) =>
                        setVariables((current) => ({
                          ...current,
                          [variable]: event.target.value,
                        }))
                      }
                      value={variables[variable] ?? ""}
                    />
                  </Field>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Preview and send</CardTitle>
            <CardDescription>Generate the exact styled email before delivery.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full"
              disabled={isBusy}
              onClick={previewEmail}
              type="button"
              variant="accent"
            >
              <Eye aria-hidden="true" />
              Preview email
            </Button>
            <Field>
              <Label htmlFor="testRecipientEmail">Test recipient</Label>
              <Input
                id="testRecipientEmail"
                onChange={(event) => setTestRecipientEmail(event.target.value)}
                placeholder="admin@example.com"
                type="email"
                value={testRecipientEmail}
              />
              <FieldHint>Test sends are logged and marked as test messages.</FieldHint>
            </Field>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <Button
                disabled={isBusy || !testRecipientEmail}
                onClick={sendTestEmail}
                type="button"
                variant="outline"
              >
                <MailCheck aria-hidden="true" />
                Send test
              </Button>
              <Button disabled={isBusy || !preview} onClick={sendFinalEmail} type="button">
                <Send aria-hidden="true" />
                Send final
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email preview</CardTitle>
            <CardDescription>
              {preview ? `${preview.recipient} - ${preview.subject}` : "No preview generated"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {preview ? (
              <iframe
                className="border-border h-[640px] w-full rounded-md border bg-white"
                sandbox=""
                srcDoc={preview.bodyHtml}
                title="Email preview"
              />
            ) : (
              <div className="border-border bg-surface text-muted-foreground grid min-h-64 place-items-center rounded-md border border-dashed p-6 text-center text-sm">
                Generate a preview to inspect the final branded email.
              </div>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
