"use client";

import { useActionState, useEffect, useState } from "react";
import { BellRing, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { updateNotificationPreferencesAction } from "@/features/notifications/actions/notification.actions";
import {
  initialNotificationActionState,
  type NotificationPreferences,
} from "@/features/notifications/types";

type NotificationPreferencesFormProps = {
  preferences: NotificationPreferences;
};

const channelOptions = [
  ["channels.inApp", "In-app", "Workspace notifications and dashboard alerts."],
  ["channels.email", "Email", "Queued email notifications using templates."],
  ["channels.sms", "SMS", "Reserved for SMS provider delivery."],
  ["channels.whatsapp", "WhatsApp", "Reserved for WhatsApp Business delivery."],
] as const;

const topicOptions = [
  ["topics.shipment_updates", "Shipment updates"],
  ["topics.billing", "Billing"],
  ["topics.support", "Support"],
  ["topics.security", "Security"],
  ["topics.system", "System"],
] as const;

export function NotificationPreferencesForm({ preferences }: NotificationPreferencesFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateNotificationPreferencesAction,
    initialNotificationActionState,
  );
  const [browserPermission, setBrowserPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");

  useEffect(() => {
    setBrowserPermission("Notification" in window ? Notification.permission : "unsupported");
  }, []);

  async function enableBrowserAlerts() {
    if (!("Notification" in window)) {
      setBrowserPermission("unsupported");
      return;
    }

    setBrowserPermission(await Notification.requestPermission());
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? (
        <p className="border-border bg-secondary text-secondary-foreground rounded-md border px-3 py-2 text-sm">
          {state.message}
        </p>
      ) : null}
      <div>
        <h3 className="text-base font-semibold tracking-normal">Delivery channels</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {channelOptions.map(([name, label, hint]) => (
            <label
              className="border-border bg-background hover:bg-secondary flex items-start gap-3 rounded-md border p-3 transition-colors"
              key={name}
            >
              <input
                className="accent-primary mt-1"
                defaultChecked={
                  name === "channels.inApp"
                    ? preferences.channels.inApp
                    : name === "channels.email"
                      ? preferences.channels.email
                      : name === "channels.sms"
                        ? preferences.channels.sms
                        : preferences.channels.whatsapp
                }
                name={name}
                type="checkbox"
              />
              <span>
                <span className="block text-sm font-semibold">{label}</span>
                <span className="text-muted-foreground mt-1 block text-xs leading-5">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="border-border bg-surface rounded-md border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold tracking-normal">
              <BellRing aria-hidden="true" className="size-4" />
              Browser alerts
            </h3>
            <FieldHint className="mt-1 block">
              Show live shipment, billing, and support alerts while Apex Global Logistics is open in
              this browser.
            </FieldHint>
          </div>
          {browserPermission === "default" ? (
            <Button onClick={enableBrowserAlerts} type="button" variant="outline">
              Enable alerts
            </Button>
          ) : (
            <span className="border-border bg-background rounded-md border px-3 py-2 text-sm font-semibold">
              {browserPermission === "granted"
                ? "Enabled"
                : browserPermission === "denied"
                  ? "Blocked in browser settings"
                  : "Not supported"}
            </span>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-base font-semibold tracking-normal">Topics</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {topicOptions.map(([name, label]) => (
            <label
              className="border-border bg-background hover:bg-secondary flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors"
              key={name}
            >
              <input
                className="accent-primary"
                defaultChecked={
                  name === "topics.shipment_updates"
                    ? preferences.topics.shipment_updates
                    : name === "topics.billing"
                      ? preferences.topics.billing
                      : name === "topics.support"
                        ? preferences.topics.support
                        : name === "topics.security"
                          ? preferences.topics.security
                          : preferences.topics.system
                }
                name={name}
                type="checkbox"
              />
              <span className="text-sm font-semibold">{label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <Label htmlFor="digestFrequency">Digest</Label>
          <Select
            defaultValue={preferences.digestFrequency}
            id="digestFrequency"
            name="digestFrequency"
          >
            <option value="instant">Instant</option>
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
          </Select>
        </Field>
        <Field>
          <Label htmlFor="quietHours.start">Quiet start</Label>
          <Input
            defaultValue={preferences.quietHours.start}
            id="quietHours.start"
            name="quietHours.start"
            type="time"
          />
        </Field>
        <Field>
          <Label htmlFor="quietHours.end">Quiet end</Label>
          <Input
            defaultValue={preferences.quietHours.end}
            id="quietHours.end"
            name="quietHours.end"
            type="time"
          />
        </Field>
      </div>
      <label className="flex items-center gap-3">
        <input
          className="accent-primary"
          defaultChecked={preferences.quietHours.enabled}
          name="quietHours.enabled"
          type="checkbox"
        />
        <span>
          <span className="block text-sm font-semibold">Quiet hours</span>
          <FieldHint>Non-urgent delivery can be delayed until the window ends.</FieldHint>
        </span>
      </label>
      <Button disabled={isPending} type="submit" variant="accent">
        <Save aria-hidden="true" />
        {isPending ? "Saving..." : "Save preferences"}
      </Button>
    </form>
  );
}
