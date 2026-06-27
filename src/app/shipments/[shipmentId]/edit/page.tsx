import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { ShipmentForm } from "@/features/shipments/components/shipment-form";
import { updateShipmentAction } from "@/features/shipments/actions/shipment.actions";
import { getShipmentForUser } from "@/features/shipments/queries/shipment.queries";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

type EditShipmentPageProps = {
  params: Promise<{
    shipmentId: string;
  }>;
};

export const metadata: Metadata = {
  title: "Edit Shipment | Apex Global Logistics",
};

export default async function EditShipmentPage({ params }: EditShipmentPageProps) {
  const { shipmentId } = await params;
  const user = await requirePermission(PERMISSIONS.SHIPMENTS_READ);
  const shipment = await getShipmentForUser(shipmentId, user);

  if (!shipment) {
    notFound();
  }

  return (
    <ProtectedShell
      activeHref="/shipments"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/shipments", label: "Shipments" },
        { href: `/shipments/${shipment.id}`, label: shipment.shipmentNumber },
        { label: "Edit" },
      ]}
      description="Edit shipment metadata, addresses, package details, timing windows, and validation fields."
      title="Edit Shipment"
      user={user}
    >
      <ShipmentForm
        action={updateShipmentAction.bind(null, shipment.id)}
        cancelHref={`/shipments/${shipment.id}`}
        initialShipment={shipment}
        mode="edit"
      />
    </ProtectedShell>
  );
}
