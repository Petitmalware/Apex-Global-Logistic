import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { FreightTransportDetailView } from "@/features/freight-transport/components/freight-transport-detail";
import {
  getFreightDispatchOptions,
  getFreightTransportForUser,
} from "@/features/freight-transport/queries/freight-transport.queries";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

type FreightTransportPageProps = {
  params: Promise<{
    freightTransportId: string;
  }>;
};

export const metadata: Metadata = {
  title: "Freight Transport Details | Apex Global Logistics",
};

export default async function FreightTransportDetailPage({ params }: FreightTransportPageProps) {
  const { freightTransportId } = await params;
  const user = await requirePermission(PERMISSIONS.FREIGHT_TRANSPORT_READ);
  const [freightTransport, dispatchOptions] = await Promise.all([
    getFreightTransportForUser(freightTransportId, user),
    getFreightDispatchOptions(user),
  ]);

  if (!freightTransport) {
    notFound();
  }

  return (
    <ProtectedShell
      activeHref="/freight-transport"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/freight-transport", label: "Freight Transport" },
        { label: freightTransport.shipmentNumber },
      ]}
      description="Review cargo, containers, route stops, dispatch, documents, ETA, and freight tracking."
      title="Freight Transport Details"
      user={user}
    >
      <FreightTransportDetailView
        dispatchOptions={dispatchOptions}
        freightTransport={freightTransport}
      />
    </ProtectedShell>
  );
}
