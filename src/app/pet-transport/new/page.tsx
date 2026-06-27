import type { Metadata } from "next";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { createPetTransportBookingAction } from "@/features/pet-transport/actions/pet-transport.actions";
import { PetTransportForm } from "@/features/pet-transport/components/pet-transport-form";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Book Pet Transport | Apex Global Logistics",
};

export default async function NewPetTransportPage() {
  const user = await requirePermission(PERMISSIONS.PET_TRANSPORT_CREATE);

  return (
    <ProtectedShell
      activeHref="/pet-transport"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/pet-transport", label: "Pet Transport" },
        { label: "Book" },
      ]}
      description="Create a pet profile, care plan, crate requirements, pickup and delivery shipment in one workflow."
      title="Book Pet Transport"
      user={user}
    >
      <PetTransportForm
        action={createPetTransportBookingAction}
        cancelHref="/pet-transport"
        mode="create"
      />
    </ProtectedShell>
  );
}
