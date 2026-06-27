import type { Metadata } from "next";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { EmailStudioDashboard } from "@/features/emails/components/email-studio-dashboard";
import { getEmailStudioOverview } from "@/features/emails/queries/email.queries";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Admin Email Studio | Apex Global Logistics",
};

export default async function AdminEmailsPage() {
  const user = await requirePermission(PERMISSIONS.EMAILS_READ);
  const overview = await getEmailStudioOverview(user);

  return (
    <ProtectedShell
      activeHref="/admin/emails"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/admin", label: "Admin" },
        { label: "Emails" },
      ]}
      description="Compose branded email, manage templates, and audit outbound communication from one workspace."
      title="Admin Email Studio"
      user={user}
    >
      <EmailStudioDashboard overview={overview} />
    </ProtectedShell>
  );
}
