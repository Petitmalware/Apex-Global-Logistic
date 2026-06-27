import { ProtectedShell } from "@/components/layout/protected-shell";
import { RoleDashboard } from "@/features/dashboard/components/role-dashboard";
import { dashboardConfigs } from "@/features/dashboard/data/dashboard";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { requireRole } from "@/lib/auth/session";

export default async function AdminPage() {
  const user = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);

  return (
    <ProtectedShell
      activeHref="/admin"
      breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Admin" }]}
      description="Administrative operations for network health, billing queues, warehouses, drivers, and exceptions."
      title="Admin Dashboard"
      user={user}
    >
      <RoleDashboard config={dashboardConfigs.admin} user={user} />
    </ProtectedShell>
  );
}
