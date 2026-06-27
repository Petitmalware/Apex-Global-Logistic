import type { Metadata } from "next";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { ShipmentForm } from "@/features/shipments/components/shipment-form";
import { createShipmentAction } from "@/features/shipments/actions/shipment.actions";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Create Shipment | Apex Global Logistics",
};

export default async function NewShipmentPage() {
  const user = await requirePermission(PERMISSIONS.SHIPMENTS_CREATE);

  return (
    <ProtectedShell
      activeHref="/shipments"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/shipments", label: "Shipments" },
        { label: "Create" },
      ]}
      description="Create a validated shipment with origin, destination, timing, package details, and tracking number generation."
      title="Create Shipment"
      user={user}
    >
      <ShipmentForm action={createShipmentAction} cancelHref="/shipments" mode="create" />
    </ProtectedShell>
  );
}
