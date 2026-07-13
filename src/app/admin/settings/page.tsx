import type { Metadata } from "next";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { updateCompanyProfileAction } from "@/features/settings/actions/company-profile.actions";
import { CompanyProfileForm } from "@/features/settings/components/company-profile-form";
import { getCompanyProfile } from "@/features/settings/queries/company-profile.queries";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Company Settings | Apex Global Logistics",
};

export default async function AdminSettingsPage() {
  const user = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);
  const profile = await getCompanyProfile();

  return (
    <ProtectedShell
      activeHref="/admin/settings"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/admin", label: "Admin" },
        { label: "Company Settings" },
      ]}
      description="Edit the public contact details and invoice branding used across Apex Global Logistics."
      title="Company Settings"
      user={user}
    >
      <CompanyProfileForm action={updateCompanyProfileAction} profile={profile} />
    </ProtectedShell>
  );
}
