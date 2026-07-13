import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { Plus } from "lucide-react";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { Button } from "@/components/ui/button";
import { InvoiceList } from "@/features/invoices/components/invoice-list";
import { getInvoicesForUser } from "@/features/invoices/queries/invoice.queries";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Invoices | Apex Global Logistics",
};

export default async function AdminInvoicesPage() {
  const user = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);
  const invoices = await getInvoicesForUser(user);

  return (
    <ProtectedShell
      activeHref="/admin/invoices"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/admin", label: "Admin" },
        { label: "Invoices" },
      ]}
      description="Issue customer invoices, review balances, and open printable transportation-standard invoice documents."
      title="Invoices"
      user={user}
    >
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button asChild variant="accent">
            <Link href={"/admin/invoices/new" as Route}>
              <Plus aria-hidden="true" />
              Issue invoice
            </Link>
          </Button>
        </div>
        <InvoiceList invoices={invoices} />
      </div>
    </ProtectedShell>
  );
}
