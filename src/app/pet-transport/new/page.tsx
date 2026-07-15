import type { Metadata } from "next";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { getCustomerOptionsForStaff } from "@/features/customers/queries/customer.queries";
import { createPetTransportBookingAction } from "@/features/pet-transport/actions/pet-transport.actions";
import { PetTransportForm } from "@/features/pet-transport/components/pet-transport-form";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Pet Transport | Apex Global Logistics",
};

export default async function NewPetTransportPage() {
  const user = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN, AUTH_ROLES.CUSTOMER]);
  const isCustomer = user.roles.includes(AUTH_ROLES.CUSTOMER);
  const customerOptions = isCustomer ? [] : await getCustomerOptionsForStaff(user);
  const title = isCustomer ? "Request Pet Transport" : "Create Pet Shipment";

  return (
    <ProtectedShell
      activeHref="/pet-transport"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/pet-transport", label: "Pet Shipments" },
        { label: isCustomer ? "Request transport" : "Create shipment" },
      ]}
      description={
        isCustomer
          ? "Submit a pet transportation request with the animal, sender, care, and delivery information required for an operations review."
          : "Create an operational pet shipment for a registered or manual recipient, then manage health, crate, care, and tracking records."
      }
      title={title}
      user={user}
    >
      <PetTransportForm
        action={createPetTransportBookingAction}
        cancelHref="/pet-transport"
        customerOptions={customerOptions}
        mode="create"
        workflow={isCustomer ? "customer_booking" : "admin_creation"}
      />
    </ProtectedShell>
  );
}
