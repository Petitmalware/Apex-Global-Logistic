import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OfficialDocumentPreview } from "@/features/official-documents/components/official-document-preview";
import { getOfficialDocumentTemplate } from "@/features/official-documents/queries/official-document.queries";
import { getCompanyProfile } from "@/features/settings/queries/company-profile.queries";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { requireRole } from "@/lib/auth/session";

type AdminOfficialDocumentPreviewPageProps = {
  params: Promise<{
    templateId: string;
  }>;
};

export const metadata: Metadata = {
  title: "Official Document Preview | Apex Global Logistics",
};

export default async function AdminOfficialDocumentPreviewPage({
  params,
}: AdminOfficialDocumentPreviewPageProps) {
  await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);
  const { templateId } = await params;
  const [template, profile] = await Promise.all([
    getOfficialDocumentTemplate(templateId),
    getCompanyProfile(),
  ]);

  if (!template) {
    notFound();
  }

  return <OfficialDocumentPreview profile={profile} template={template} />;
}
