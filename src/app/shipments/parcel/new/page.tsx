import type { Metadata } from "next";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { getCustomerOptionsForStaff } from "@/features/customers/queries/customer.queries";
import { ParcelBookingForm } from "@/features/shipments/components/parcel-booking-form";
import { createParcelBookingAction } from "@/features/shipments/actions/shipment.actions";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Parcel Shipment | Apex Global Logistics",
};

export default async function NewParcelBookingPage() {
  const user = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN, AUTH_ROLES.CUSTOMER]);
  const isCustomer = user.roles.includes(AUTH_ROLES.CUSTOMER);
  const customerOptions = isCustomer ? [] : await getCustomerOptionsForStaff(user);

  return (
    <ProtectedShell
      activeHref="/shipments"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/shipments", label: "Shipments" },
        { label: isCustomer ? "Book parcel" : "Create parcel shipment" },
      ]}
      description={
        isCustomer
          ? "Submit a parcel booking with addresses, package details, and an estimated quote for operations review."
          : "Create a parcel shipment with package dimensions, chargeable weight, invoice, and tracking number."
      }
      title={isCustomer ? "Book Parcel Transport" : "Create Parcel Shipment"}
      user={user}
    >
      <ParcelBookingForm
        action={createParcelBookingAction}
        customerOptions={customerOptions}
        workflow={isCustomer ? "customer_booking" : "admin_creation"}
      />
    </ProtectedShell>
  );
}
