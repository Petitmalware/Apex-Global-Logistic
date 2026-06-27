import type { Metadata } from "next";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { AnalyticsDashboard } from "@/features/analytics/components/analytics-dashboard";
import { getAnalyticsDashboardData } from "@/features/analytics/queries/analytics.queries";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Analytics | Apex Global Logistics",
};

export default async function AnalyticsPage() {
  const user = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);
  const data = await getAnalyticsDashboardData(user);

  return (
    <ProtectedShell
      activeHref="/analytics"
      breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Analytics" }]}
      description="Executive analytics across revenue, delivery performance, growth, freight, pets, warehouses, drivers, and AI insight."
      title="Analytics"
      user={user}
    >
      <AnalyticsDashboard data={data} />
    </ProtectedShell>
  );
}
