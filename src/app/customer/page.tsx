import { ProtectedShell } from "@/components/layout/protected-shell";
import { RoleDashboard } from "@/features/dashboard/components/role-dashboard";
import { dashboardConfigs } from "@/features/dashboard/data/dashboard";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { requireRole } from "@/lib/auth/session";

export default async function CustomerPage() {
  const user = await requireRole([AUTH_ROLES.CUSTOMER, AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);

  return (
    <ProtectedShell
      activeHref="/customer"
      breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Customer" }]}
      description="Customer-facing shipment tracking, booking, quotes, and support context."
      title="Customer Dashboard"
      user={user}
    >
      <RoleDashboard config={dashboardConfigs.customer} user={user} />
    </ProtectedShell>
  );
}
