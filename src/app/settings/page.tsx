import Link from "next/link";
import type { Metadata, Route } from "next";
import { BellRing, Building2, KeyRound, ShieldCheck } from "lucide-react";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationPreferencesForm } from "@/features/notifications/components/notification-preferences-form";
import { getNotificationPreferencesForUser } from "@/features/notifications/services/notification.service";
import { AUTH_ROLE_LABELS, AUTH_ROLES } from "@/lib/auth/constants";
import { requireAuthenticatedUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Account Settings | Apex Global Logistics",
};

export default async function AccountSettingsPage() {
  const user = await requireAuthenticatedUser();
  const preferences = await getNotificationPreferencesForUser(user);
  const canManageCompany =
    user.roles.includes(AUTH_ROLES.ADMIN) || user.roles.includes(AUTH_ROLES.SUPER_ADMIN);

  return (
    <ProtectedShell
      activeHref="/settings"
      breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Settings" }]}
      description="Manage account security, notification delivery, and workspace preferences."
      title="Account Settings"
      user={user}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing aria-hidden="true" className="size-4" />
              Notification preferences
            </CardTitle>
            <CardDescription>
              Choose how Apex sends shipment, billing, support, and security updates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationPreferencesForm preferences={preferences} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="size-4" />
                Account
              </CardTitle>
              <CardDescription>Your verified identity and workspace access.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase">Name</p>
                <p className="mt-1 text-sm font-semibold">{user.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase">Email</p>
                <p className="mt-1 text-sm font-semibold break-all">{user.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase">Access</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {user.roles.map((role) => (
                    <Badge key={role} variant="outline">
                      {AUTH_ROLE_LABELS[role]}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound aria-hidden="true" className="size-4" />
                Security
              </CardTitle>
              <CardDescription>
                Password changes use a secure link sent to your account email.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href={"/forgot-password" as Route}>Reset password</Link>
              </Button>
            </CardContent>
          </Card>

          {canManageCompany ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 aria-hidden="true" className="size-4" />
                  Company profile
                </CardTitle>
                <CardDescription>
                  Manage the public contact details used on the website and invoices.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href={"/admin/settings" as Route}>Open company settings</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </ProtectedShell>
  );
}
