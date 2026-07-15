import type { Metadata } from "next";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { getCustomerOptionsForStaff } from "@/features/customers/queries/customer.queries";
import { createFreightTransportBookingAction } from "@/features/freight-transport/actions/freight-transport.actions";
import { FreightTransportForm } from "@/features/freight-transport/components/freight-transport-form";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Freight Transport | Apex Global Logistics",
};

export default async function NewFreightTransportPage() {
  const user = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN, AUTH_ROLES.CUSTOMER]);
  const isCustomer = user.roles.includes(AUTH_ROLES.CUSTOMER);
  const customerOptions = isCustomer ? [] : await getCustomerOptionsForStaff(user);

  return (
    <ProtectedShell
      activeHref="/freight-transport"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/freight-transport", label: "Freight Transport" },
        { label: isCustomer ? "Request transport" : "Create shipment" },
      ]}
      description={
        isCustomer
          ? "Submit cargo, pickup, delivery, and handling details for an operations review."
          : "Create a long-haul freight shipment with cargo, route, compliance, and delivery details."
      }
      title={isCustomer ? "Request Freight Transport" : "Create Freight Shipment"}
      user={user}
    >
      <FreightTransportForm
        action={createFreightTransportBookingAction}
        cancelHref="/freight-transport"
        customerOptions={customerOptions}
        mode="create"
        workflow={isCustomer ? "customer_booking" : "admin_creation"}
      />
    </ProtectedShell>
  );
}
