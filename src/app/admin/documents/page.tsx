import type { Metadata } from "next";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { OfficialDocumentTemplateManager } from "@/features/official-documents/components/official-document-template-manager";
import { getOfficialDocumentTemplates } from "@/features/official-documents/queries/official-document.queries";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Official Documents | Apex Global Logistics",
};

export default async function AdminOfficialDocumentsPage() {
  const user = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);
  const templates = await getOfficialDocumentTemplates({ includeInactive: true });

  return (
    <ProtectedShell
      activeHref="/admin/documents"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/admin", label: "Admin" },
        { label: "Official Documents" },
      ]}
      description="Manage editable, company-approved document templates for billing, pet transport, clearance, and compliance notices."
      title="Official Documents"
      user={user}
    >
      <OfficialDocumentTemplateManager templates={templates} />
    </ProtectedShell>
  );
}
