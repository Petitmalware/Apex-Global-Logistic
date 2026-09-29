import type { Metadata } from "next";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { InvoiceEditor } from "@/features/invoices/components/invoice-editor";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "New Invoice | Apex Global Logistics",
};

export default async function NewInvoicePage() {
  const user = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);

  return (
    <ProtectedShell
      activeHref="/admin/invoices"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/admin", label: "Admin" },
        { href: "/admin/invoices", label: "Invoices" },
        { label: "New Invoice" },
      ]}
      description="Create a new customized invoice for a customer shipment. Fill in billing details, add line items, preview, and send."
      title="New Invoice"
      user={user}
    >
      <InvoiceEditor invoice={null} />
    </ProtectedShell>
  );
}
