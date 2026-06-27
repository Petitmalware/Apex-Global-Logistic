import type { Metadata } from "next";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { createFreightTransportBookingAction } from "@/features/freight-transport/actions/freight-transport.actions";
import { FreightTransportForm } from "@/features/freight-transport/components/freight-transport-form";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Book Freight Transport | Apex Global Logistics",
};

export default async function NewFreightTransportPage() {
  const user = await requirePermission(PERMISSIONS.FREIGHT_TRANSPORT_CREATE);

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
        mode="create"
      />
    </ProtectedShell>
  );
}
