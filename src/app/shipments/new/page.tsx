import type { Metadata } from "next";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { getCustomerOptionsForStaff } from "@/features/customers/queries/customer.queries";
import { ShipmentForm } from "@/features/shipments/components/shipment-form";
import { createShipmentAction } from "@/features/shipments/actions/shipment.actions";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Create Shipment | Apex Global Logistics",
};

export default async function NewShipmentPage() {
  const user = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);
  const customerOptions = await getCustomerOptionsForStaff(user);

  return (
    <ProtectedShell
      activeHref="/shipments"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/shipments", label: "Shipments" },
        { label: "Create" },
      ]}
      description="Create a validated shipment for a registered customer or an unregistered manual recipient, with origin, destination, timing, package details, and tracking number generation."
      title="Create Shipment"
      user={user}
    >
      <ShipmentForm
        action={createShipmentAction}
        cancelHref="/shipments"
        customerOptions={customerOptions}
        mode="create"
      />
    </ProtectedShell>
  );
}
