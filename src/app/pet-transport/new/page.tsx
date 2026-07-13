import type { Metadata } from "next";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { getCustomerOptionsForStaff } from "@/features/customers/queries/customer.queries";
import { createPetTransportBookingAction } from "@/features/pet-transport/actions/pet-transport.actions";
import { PetTransportForm } from "@/features/pet-transport/components/pet-transport-form";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Create Pet Shipment | Apex Global Logistics",
};

export default async function NewPetTransportPage() {
  const user = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);
  const customerOptions = await getCustomerOptionsForStaff(user);

  return (
    <ProtectedShell
      activeHref="/pet-transport"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/pet-transport", label: "Pet Shipments" },
        { label: "Create shipment" },
      ]}
      description="Create a pet shipment for a registered customer or an unregistered manual recipient, with sender, pet profile, care, crate, pickup, and delivery details."
      title="Create Pet Shipment"
      user={user}
    >
      <PetTransportForm
        action={createPetTransportBookingAction}
        cancelHref="/pet-transport"
        customerOptions={customerOptions}
        mode="create"
      />
    </ProtectedShell>
  );
}
