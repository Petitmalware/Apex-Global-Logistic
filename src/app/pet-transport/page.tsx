import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { PawPrint } from "lucide-react";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { Button } from "@/components/ui/button";
import { PetTransportList } from "@/features/pet-transport/components/pet-transport-list";
import { getPetTransportsForUser } from "@/features/pet-transport/queries/pet-transport.queries";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Pet Transport | Apex Global Logistics",
};

export default async function PetTransportPage() {
  const user = await requirePermission(PERMISSIONS.PET_TRANSPORT_READ);
  const petTransports = await getPetTransportsForUser(user);

  return (
    <ProtectedShell
      activeHref="/pet-transport"
      breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Pet Transport" }]}
      description="Manage pet profiles, travel documents, veterinarian checks, feeding, temperature, crate handling, photos, and shipment tracking."
      title="Pet Transport"
      user={user}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-normal">Pet transport register</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Showing the latest 50 pet transports available to your role.
            </p>
          </div>
          <Button asChild variant="accent">
            <Link href={"/pet-transport/new" as Route}>
              <PawPrint aria-hidden="true" />
              Book pet transport
            </Link>
          </Button>
        </div>
        <PetTransportList petTransports={petTransports} />
      </div>
    </ProtectedShell>
  );
}
