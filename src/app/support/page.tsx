import { ProtectedShell } from "@/components/layout/protected-shell";
import { RoleDashboard } from "@/features/dashboard/components/role-dashboard";
import { dashboardConfigs } from "@/features/dashboard/data/dashboard";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { requireRole } from "@/lib/auth/session";

export default async function SupportPage() {
  const user = await requireRole([AUTH_ROLES.SUPPORT, AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);

  return (
    <ProtectedShell
      activeHref="/support"
      breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Support" }]}
      description="Support workflows for tickets, escalations, customer context, and AI-assisted replies."
      title="Support Dashboard"
      user={user}
    >
      <RoleDashboard config={dashboardConfigs.support} user={user} />
    </ProtectedShell>
  );
}
