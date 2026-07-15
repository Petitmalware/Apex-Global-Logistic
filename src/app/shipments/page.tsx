import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { PackagePlus, Plus } from "lucide-react";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { Button } from "@/components/ui/button";
import { ShipmentList } from "@/features/shipments/components/shipment-list";
import { getShipmentsForUser } from "@/features/shipments/queries/shipment.queries";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Shipments | Apex Global Logistics",
};

export default async function ShipmentsPage() {
  const user = await requirePermission(PERMISSIONS.SHIPMENTS_READ);
  const shipments = await getShipmentsForUser(user);
  const canCreateShipments =
    user.roles.includes(AUTH_ROLES.ADMIN) || user.roles.includes(AUTH_ROLES.SUPER_ADMIN);
  const canBookParcel = user.roles.includes(AUTH_ROLES.CUSTOMER);

  return (
    <ProtectedShell
      activeHref="/shipments"
      breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Shipments" }]}
      description={
        canCreateShipments
          ? "Create, edit, track, and audit shipments across package, document, and status workflows."
          : "Track shipments assigned to your account and review package, document, and status history."
      }
      title={canCreateShipments ? "Shipment Management" : "My Shipments"}
      user={user}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-normal">Shipment register</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Showing the latest 50 shipments available to your role.
            </p>
          </div>
          {canCreateShipments || canBookParcel ? (
            <div className="flex flex-wrap gap-2">
              {canCreateShipments ? (
                <Button asChild variant="outline">
                  <Link href={"/shipments/new" as Route}>
                    <Plus aria-hidden="true" />
                    Create shipment
                  </Link>
                </Button>
              ) : null}
              <Button asChild variant="accent">
                <Link href={"/shipments/parcel/new" as Route}>
                  <PackagePlus aria-hidden="true" />
                  {canBookParcel ? "Book parcel" : "Create parcel shipment"}
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
        <ShipmentList canCreate={canCreateShipments} shipments={shipments} />
      </div>
    </ProtectedShell>
  );
}
