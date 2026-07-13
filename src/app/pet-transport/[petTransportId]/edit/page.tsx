import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { updatePetTransportProfileAction } from "@/features/pet-transport/actions/pet-transport.actions";
import { PetTransportForm } from "@/features/pet-transport/components/pet-transport-form";
import { getPetTransportForUser } from "@/features/pet-transport/queries/pet-transport.queries";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

type EditPetTransportPageProps = {
  params: Promise<{
    petTransportId: string;
  }>;
};

export const metadata: Metadata = {
  title: "Edit Pet Shipment | Apex Global Logistics",
};

export default async function EditPetTransportPage({ params }: EditPetTransportPageProps) {
  const { petTransportId } = await params;
  const user = await requirePermission(PERMISSIONS.PET_TRANSPORT_UPDATE);
  const petTransport = await getPetTransportForUser(petTransportId, user);

  if (!petTransport) {
    notFound();
  }

  return (
    <ProtectedShell
      activeHref="/pet-transport"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/pet-transport", label: "Pet Shipments" },
        { href: `/pet-transport/${petTransport.id}`, label: petTransport.petName ?? "Pet" },
        { label: "Edit" },
      ]}
      description="Update pet profile, sender contact, crate requirements, care instructions, and specialist handling state."
      title="Edit Pet Shipment"
      user={user}
    >
      <PetTransportForm
        action={updatePetTransportProfileAction.bind(null, petTransport.id)}
        cancelHref={`/pet-transport/${petTransport.id}`}
        initialPetTransport={petTransport}
        mode="edit"
      />
    </ProtectedShell>
  );
}
