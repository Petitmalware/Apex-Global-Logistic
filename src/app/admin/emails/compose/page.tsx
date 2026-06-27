import type { Metadata } from "next";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { EmailComposer } from "@/features/emails/components/email-composer";
import { getEmailComposerOptions } from "@/features/emails/queries/email.queries";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Compose Email | Apex Global Logistics",
};

export default async function ComposeEmailPage() {
  const user = await requirePermission(PERMISSIONS.EMAILS_CREATE);
  const options = await getEmailComposerOptions(user);

  return (
    <ProtectedShell
      activeHref="/admin/emails"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/admin/emails", label: "Email Studio" },
        { label: "Compose" },
      ]}
      description="Write a manual email, attach logistics context, preview the branded result, and send safely."
      title="Compose Email"
      user={user}
    >
      <EmailComposer options={options} />
    </ProtectedShell>
  );
}
