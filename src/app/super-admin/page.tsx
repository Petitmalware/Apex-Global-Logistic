import { ProtectedShell } from "@/components/layout/protected-shell";
import { RoleDashboard } from "@/features/dashboard/components/role-dashboard";
import { dashboardConfigs } from "@/features/dashboard/data/dashboard";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { requireRole } from "@/lib/auth/session";

export default async function SuperAdminPage() {
  const user = await requireRole([AUTH_ROLES.SUPER_ADMIN]);

  return (
    <ProtectedShell
      activeHref="/super-admin"
      breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Super Admin" }]}
      description="Platform governance for roles, permissions, security settings, audits, and tenant controls."
      title="Super Admin Dashboard"
      user={user}
    >
      <RoleDashboard config={dashboardConfigs["super-admin"]} user={user} />
    </ProtectedShell>
  );
}
