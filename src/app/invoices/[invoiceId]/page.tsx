import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InvoiceDocument } from "@/features/invoices/components/invoice-document";
import { getInvoiceForUser } from "@/features/invoices/queries/invoice.queries";
import { getCompanyProfile } from "@/features/settings/queries/company-profile.queries";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

type InvoicePageProps = {
  params: Promise<{
    invoiceId: string;
  }>;
};

export const metadata: Metadata = {
  title: "Invoice | Apex Global Logistics",
};

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { invoiceId } = await params;
  const user = await requirePermission(PERMISSIONS.INVOICES_READ);
  const [invoice, profile] = await Promise.all([
    getInvoiceForUser(invoiceId, user),
    getCompanyProfile(),
  ]);

  if (!invoice) {
    notFound();
  }

  return <InvoiceDocument invoice={invoice} profile={profile} />;
}
