import type { Metadata } from "next";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailTemplateList } from "@/features/emails/components/email-template-list";
import { getEmailTemplatesForAdmin } from "@/features/emails/queries/email.queries";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Email Templates | Apex Global Logistics",
};

export default async function EmailTemplatesPage() {
  const user = await requirePermission(PERMISSIONS.EMAILS_READ);
  const templates = await getEmailTemplatesForAdmin(user);

  return (
    <ProtectedShell
      activeHref="/admin/emails"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/admin/emails", label: "Email Studio" },
        { label: "Templates" },
      ]}
      description="Manage editable built-in and manual email templates used by the branded email system."
      title="Email Templates"
      user={user}
    >
      <Card>
        <CardHeader>
          <CardTitle>Template library</CardTitle>
          <CardDescription>
            Shipment, pet, freight, invoice, auth, admin, and manual templates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmailTemplateList templates={templates} />
        </CardContent>
      </Card>
    </ProtectedShell>
  );
}
