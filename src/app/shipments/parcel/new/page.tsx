import type { Metadata } from "next";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { ParcelBookingForm } from "@/features/shipments/components/parcel-booking-form";
import { createParcelBookingAction } from "@/features/shipments/actions/shipment.actions";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Book Parcel | Apex Global Logistics",
};

export default async function NewParcelBookingPage() {
  const user = await requirePermission(PERMISSIONS.SHIPMENTS_CREATE);

  return (
    <ProtectedShell
      activeHref="/shipments"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/shipments", label: "Shipments" },
        { label: "Book parcel" },
      ]}
      description="Book a parcel with package dimensions, chargeable weight calculation, invoice generation, and tracking number assignment."
      title="Book Parcel"
      user={user}
    >
      <ParcelBookingForm action={createParcelBookingAction} />
    </ProtectedShell>
  );
}
