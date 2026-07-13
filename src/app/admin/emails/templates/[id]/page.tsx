import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { EmailTemplateEditor } from "@/features/emails/components/email-template-editor";
import { getEmailTemplateForAdmin } from "@/features/emails/queries/email.queries";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Edit Email Template | Apex Global Logistics",
};

type EmailTemplatePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EmailTemplatePage({ params }: EmailTemplatePageProps) {
  const user = await requirePermission(PERMISSIONS.EMAILS_READ);
  const { id } = await params;
  const templateId = decodeURIComponent(id);

  if (templateId.startsWith("built-in:")) {
    redirect(`/admin/emails/compose?template=${encodeURIComponent(templateId)}`);
  }

  if (templateId.startsWith("official:")) {
    redirect("/admin/emails/templates");
  }

  const template = await getEmailTemplateForAdmin(templateId, user);

  if (!template) {
    notFound();
  }

  return (
    <ProtectedShell
      activeHref="/admin/emails"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/admin/emails", label: "Email Studio" },
        { href: "/admin/emails/templates", label: "Templates" },
        { label: template.name },
      ]}
      description="Update subject, category, variables, active state, and rich template body."
      title="Edit Template"
      user={user}
    >
      <EmailTemplateEditor template={template} />
    </ProtectedShell>
  );
}
