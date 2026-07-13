import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { ShipmentDetailView } from "@/features/shipments/components/shipment-detail";
import { getShipmentForUser } from "@/features/shipments/queries/shipment.queries";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

type ShipmentPageProps = {
  params: Promise<{
    shipmentId: string;
  }>;
};

export const metadata: Metadata = {
  title: "Shipment Details | Apex Global Logistics",
};

export default async function ShipmentPage({ params }: ShipmentPageProps) {
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
        { label: shipment.shipmentNumber },
      ]}
      description="Manage status updates, package details, document uploads, timeline events, and shipment history."
      title="Shipment Details"
      user={user}
    >
      <ShipmentDetailView shipment={shipment} user={user} />
    </ProtectedShell>
  );
}
