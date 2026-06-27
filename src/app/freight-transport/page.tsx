import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { Truck } from "lucide-react";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { Button } from "@/components/ui/button";
import { FreightTransportList } from "@/features/freight-transport/components/freight-transport-list";
import { getFreightTransportsForUser } from "@/features/freight-transport/queries/freight-transport.queries";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Freight Transport | Apex Global Logistics",
};

export default async function FreightTransportPage() {
  const user = await requirePermission(PERMISSIONS.FREIGHT_TRANSPORT_READ);
  const freightTransports = await getFreightTransportsForUser(user);

  return (
    <ProtectedShell
      activeHref="/freight-transport"
      breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Freight Transport" }]}
      description="Manage long-haul cargo, containers, machinery, vehicles, route assignments, dispatch, freight documents, ETA, and tracking."
      title="Freight Transport"
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
          <Button asChild variant="accent">
            <Link href={"/freight-transport/new" as Route}>
              <Truck aria-hidden="true" />
              Book freight
            </Link>
          </Button>
        </div>
        <FreightTransportList freightTransports={freightTransports} />
      </div>
    </ProtectedShell>
  );
}
