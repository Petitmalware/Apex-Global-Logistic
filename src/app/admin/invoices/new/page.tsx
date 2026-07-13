import type { Metadata } from "next";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { getCustomerOptionsForStaff } from "@/features/customers/queries/customer.queries";
import { issueInvoiceAction } from "@/features/invoices/actions/invoice.actions";
import { InvoiceIssueForm } from "@/features/invoices/components/invoice-issue-form";
import { getShipmentInvoiceOptionsForAdmin } from "@/features/invoices/queries/invoice.queries";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Issue Invoice | Apex Global Logistics",
};

export default async function NewInvoicePage() {
  const user = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);
  const [customerOptions, shipmentOptions] = await Promise.all([
    getCustomerOptionsForStaff(user),
    getShipmentInvoiceOptionsForAdmin(user),
  ]);

  return (
    <ProtectedShell
      activeHref="/admin/invoices"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/admin", label: "Admin" },
        { href: "/admin/invoices", label: "Invoices" },
        { label: "Issue" },
      ]}
      description="Issue a professional transportation invoice to a registered customer or a manual bill-to recipient."
      title="Issue Invoice"
      user={user}
    >
      <InvoiceIssueForm
        action={issueInvoiceAction}
        customerOptions={customerOptions}
        shipmentOptions={shipmentOptions}
      />
    </ProtectedShell>
  );
}
