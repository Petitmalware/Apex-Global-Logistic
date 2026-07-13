import { redirect } from "next/navigation";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { CustomerPortalDashboard } from "@/features/customers/components/customer-portal-dashboard";
import { getInvoicesForUser } from "@/features/invoices/queries/invoice.queries";
import { getPetTransportsForUser } from "@/features/pet-transport/queries/pet-transport.queries";
import {
  getShipmentDocumentsForUser,
  getShipmentsForUser,
} from "@/features/shipments/queries/shipment.queries";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { requireAuthenticatedUser } from "@/lib/auth/session";

export default async function CustomerPage() {
  const user = await requireAuthenticatedUser();

  if (!user.roles.includes(AUTH_ROLES.CUSTOMER)) {
    redirect("/unauthorized");
  }

  const [documents, invoices, petTransports, shipments] = await Promise.all([
    getShipmentDocumentsForUser(user),
    getInvoicesForUser(user),
    getPetTransportsForUser(user),
    getShipmentsForUser(user),
  ]);

  return (
    <ProtectedShell
      activeHref="/customer"
      breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Customer" }]}
      description="Customer-facing tracking, shipment history, documents, invoices, and support context."
      title="Customer Dashboard"
      user={user}
    >
      <CustomerPortalDashboard
        documents={documents}
        invoices={invoices}
        petTransports={petTransports}
        shipments={shipments}
      />
    </ProtectedShell>
  );
}
