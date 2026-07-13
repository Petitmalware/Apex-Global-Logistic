import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { PetTransportDetailView } from "@/features/pet-transport/components/pet-transport-detail";
import { getPetTransportForUser } from "@/features/pet-transport/queries/pet-transport.queries";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

type PetTransportPageProps = {
  params: Promise<{
    petTransportId: string;
  }>;
};

export const metadata: Metadata = {
  title: "Pet Shipment Details | Apex Global Logistics",
};

export default async function PetTransportDetailPage({ params }: PetTransportPageProps) {
  const { petTransportId } = await params;
  const user = await requirePermission(PERMISSIONS.PET_TRANSPORT_READ);
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
        { label: petTransport.petName ?? petTransport.shipmentNumber },
      ]}
      description="Review sender, recipient shipment route, pet profile, health, crate, feeding, temperature, photos, travel history, and tracking."
      title="Pet Shipment Details"
      user={user}
    >
      <PetTransportDetailView petTransport={petTransport} user={user} />
    </ProtectedShell>
  );
}
