import type { Metadata } from "next";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { getCustomerOptionsForStaff } from "@/features/customers/queries/customer.queries";
import { createFreightTransportBookingAction } from "@/features/freight-transport/actions/freight-transport.actions";
import { FreightTransportForm } from "@/features/freight-transport/components/freight-transport-form";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Book Freight Transport | Apex Global Logistics",
};

export default async function NewFreightTransportPage() {
  const user = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);
  const customerOptions = await getCustomerOptionsForStaff(user);

  return (
    <ProtectedShell
      activeHref="/freight-transport"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/freight-transport", label: "Freight Transport" },
        { label: "Book" },
      ]}
      description="Create a long-haul freight profile and pickup-to-delivery shipment in one workflow."
      title="Book Freight Transport"
      user={user}
    >
      <FreightTransportForm
        action={createFreightTransportBookingAction}
        cancelHref="/freight-transport"
        customerOptions={customerOptions}
        mode="create"
      />
    </ProtectedShell>
  );
}
