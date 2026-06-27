import { ProtectedShell } from "@/components/layout/protected-shell";
import { RoleDashboard } from "@/features/dashboard/components/role-dashboard";
import { dashboardConfigs } from "@/features/dashboard/data/dashboard";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { requireRole } from "@/lib/auth/session";

export default async function AgentPage() {
  const user = await requireRole([AUTH_ROLES.AGENT, AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);

  return (
    <ProtectedShell
      activeHref="/agent"
      breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Agent" }]}
      description="Agent tools for pickup queues, dispatch, route visibility, and package validation."
      title="Agent Dashboard"
      user={user}
    >
      <RoleDashboard config={dashboardConfigs.agent} user={user} />
    </ProtectedShell>
  );
}
