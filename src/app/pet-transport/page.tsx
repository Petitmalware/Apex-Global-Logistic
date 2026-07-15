import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { PawPrint } from "lucide-react";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { Button } from "@/components/ui/button";
import { PetTransportList } from "@/features/pet-transport/components/pet-transport-list";
import { getPetTransportsForUser } from "@/features/pet-transport/queries/pet-transport.queries";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Pet Shipments | Apex Global Logistics",
};

export default async function PetTransportPage() {
  const user = await requirePermission(PERMISSIONS.PET_TRANSPORT_READ);
  const petTransports = await getPetTransportsForUser(user);
  const canCreatePetTransports =
    user.roles.includes(AUTH_ROLES.ADMIN) || user.roles.includes(AUTH_ROLES.SUPER_ADMIN);
  const canBookPetTransport = user.roles.includes(AUTH_ROLES.CUSTOMER);

  return (
    <ProtectedShell
      activeHref="/pet-transport"
      breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Pet Shipments" }]}
      description={
        canCreatePetTransports
          ? "Create and manage pet shipments for registered customer recipients, including sender details, travel documents, health records, crate handling, and tracking."
          : "Review pet shipments, travel documents, health milestones, photos, and tracking assigned to your account."
      }
      title={canCreatePetTransports ? "Pet Shipments" : "My Pet Shipments"}
      user={user}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-normal">Pet shipment register</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Showing the latest 50 pet shipments available to your role.
            </p>
          </div>
          {canCreatePetTransports || canBookPetTransport ? (
            <Button asChild variant="accent">
              <Link href={"/pet-transport/new" as Route}>
                <PawPrint aria-hidden="true" />
                {canBookPetTransport ? "Request pet transport" : "Create pet shipment"}
              </Link>
            </Button>
          ) : null}
        </div>
        <PetTransportList
          canCreate={canCreatePetTransports || canBookPetTransport}
          customerBooking={canBookPetTransport}
          petTransports={petTransports}
        />
      </div>
    </ProtectedShell>
  );
}
