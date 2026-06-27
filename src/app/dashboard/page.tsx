import { ProtectedShell } from "@/components/layout/protected-shell";
import { RoleDashboard } from "@/features/dashboard/components/role-dashboard";
import { overviewConfig } from "@/features/dashboard/data/dashboard";
import { requireAuthenticatedUser } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser();

  return (
    <ProtectedShell
      activeHref="/dashboard"
      description="A secure authenticated workspace that routes each team member into the right logistics dashboard."
      title="Dashboard"
      user={user}
    >
      <RoleDashboard config={overviewConfig} user={user} />
    </ProtectedShell>
  );
}
