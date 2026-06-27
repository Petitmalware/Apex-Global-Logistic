import type { Metadata } from "next";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationHistory } from "@/features/notifications/components/notification-history";
import { NotificationPreferencesForm } from "@/features/notifications/components/notification-preferences-form";
import { getNotificationCenterSnapshot } from "@/features/notifications/queries/notification.queries";
import { getNotificationPreferencesForUser } from "@/features/notifications/services/notification.service";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Notifications | Apex Global Logistics",
};

export default async function NotificationsPage() {
  const user = await requirePermission(PERMISSIONS.NOTIFICATIONS_READ);
  const [snapshot, preferences] = await Promise.all([
    getNotificationCenterSnapshot(user),
    getNotificationPreferencesForUser(user),
  ]);

  return (
    <ProtectedShell
      activeHref="/notifications"
      breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Notifications" }]}
      description="Review live alerts, delivery history, channel routing, and notification preferences."
      title="Notifications"
      user={user}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <NotificationHistory notifications={snapshot.history} unreadCount={snapshot.unreadCount} />
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Configure in-app, email, SMS, WhatsApp, topic, digest, and quiet-hour routing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationPreferencesForm preferences={preferences} />
          </CardContent>
        </Card>
      </div>
    </ProtectedShell>
  );
}
