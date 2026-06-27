import type { Metadata } from "next";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailLogList } from "@/features/emails/components/email-log-list";
import { getEmailLogsForAdmin } from "@/features/emails/queries/email.queries";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Email Logs | Apex Global Logistics",
};

export default async function EmailLogsPage() {
  const user = await requirePermission(PERMISSIONS.EMAILS_READ);
  const logs = await getEmailLogsForAdmin(user, 100);

  return (
    <ProtectedShell
      activeHref="/admin/emails"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/admin/emails", label: "Email Studio" },
        { label: "Logs" },
      ]}
      description="Review queued, sent, failed, test, manual, and automated email activity."
      title="Email Logs"
      user={user}
    >
      <Card>
        <CardHeader>
          <CardTitle>Outbound email logs</CardTitle>
          <CardDescription>
            Every sent email is recorded with provider state and related shipment context.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmailLogList logs={logs} />
        </CardContent>
      </Card>
    </ProtectedShell>
  );
}
