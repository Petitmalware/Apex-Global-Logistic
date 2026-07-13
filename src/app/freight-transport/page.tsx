import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { Truck } from "lucide-react";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { Button } from "@/components/ui/button";
import { FreightTransportList } from "@/features/freight-transport/components/freight-transport-list";
import { getFreightTransportsForUser } from "@/features/freight-transport/queries/freight-transport.queries";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Freight Transport | Apex Global Logistics",
};

export default async function FreightTransportPage() {
  const user = await requirePermission(PERMISSIONS.FREIGHT_TRANSPORT_READ);
  const freightTransports = await getFreightTransportsForUser(user);
  const canCreateFreightTransports =
    user.roles.includes(AUTH_ROLES.ADMIN) || user.roles.includes(AUTH_ROLES.SUPER_ADMIN);

  return (
    <ProtectedShell
      activeHref="/freight-transport"
      breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Freight Transport" }]}
      description={
        canCreateFreightTransports
          ? "Manage long-haul cargo, containers, machinery, vehicles, route assignments, dispatch, freight documents, ETA, and tracking."
          : "Review assigned freight movements, cargo milestones, route progress, ETA, documents, and tracking history."
      }
      title={canCreateFreightTransports ? "Freight Transport" : "My Freight"}
      user={user}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-normal">Freight transport register</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Showing the latest 50 freight transports available to your role.
            </p>
          </div>
          {canCreateFreightTransports ? (
            <Button asChild variant="accent">
              <Link href={"/freight-transport/new" as Route}>
                <Truck aria-hidden="true" />
                Book freight
              </Link>
            </Button>
          ) : null}
        </div>
        <FreightTransportList
          canCreate={canCreateFreightTransports}
          freightTransports={freightTransports}
        />
      </div>
    </ProtectedShell>
  );
}
