import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { updateFreightTransportProfileAction } from "@/features/freight-transport/actions/freight-transport.actions";
import { FreightTransportForm } from "@/features/freight-transport/components/freight-transport-form";
import { getFreightTransportForUser } from "@/features/freight-transport/queries/freight-transport.queries";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

type EditFreightTransportPageProps = {
  params: Promise<{
    freightTransportId: string;
  }>;
};

export const metadata: Metadata = {
  title: "Edit Freight Transport | Apex Global Logistics",
};

export default async function EditFreightTransportPage({ params }: EditFreightTransportPageProps) {
  const { freightTransportId } = await params;
  const user = await requirePermission(PERMISSIONS.FREIGHT_TRANSPORT_UPDATE);
  const freightTransport = await getFreightTransportForUser(freightTransportId, user);

  if (!freightTransport) {
    notFound();
  }

  return (
    <ProtectedShell
      activeHref="/freight-transport"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/freight-transport", label: "Freight Transport" },
        {
          href: `/freight-transport/${freightTransport.id}`,
          label: freightTransport.shipmentNumber,
        },
        { label: "Edit" },
      ]}
      description="Update freight profile, route assignment, ETA inputs, compliance details, and transport status."
      title="Edit Freight Transport"
      user={user}
    >
      <FreightTransportForm
        action={updateFreightTransportProfileAction.bind(null, freightTransport.id)}
        cancelHref={`/freight-transport/${freightTransport.id}`}
        initialFreightTransport={freightTransport}
        mode="edit"
      />
    </ProtectedShell>
  );
}
