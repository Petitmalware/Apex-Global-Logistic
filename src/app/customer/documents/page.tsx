import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { ArrowRight, ClipboardCheck, CreditCard, PackageSearch } from "lucide-react";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getInvoicesForUser } from "@/features/invoices/queries/invoice.queries";
import { ShipmentStatusBadge } from "@/features/shipments/components/shipment-list";
import { getShipmentDocumentsForUser } from "@/features/shipments/queries/shipment.queries";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { requireAuthenticatedUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "My Documents | Apex Global Logistics",
};

function formatBytes(value: number) {
  if (!value) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);

  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatOptionalDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return formatDate(value);
}

function formatMoney(value: string | number, currency = "USD") {
  return new Intl.NumberFormat("en", {
    currency,
    style: "currency",
  }).format(Number(value));
}

export default async function CustomerDocumentsPage() {
  const user = await requireAuthenticatedUser();

  if (!user.roles.includes(AUTH_ROLES.CUSTOMER)) {
    redirect("/unauthorized");
  }

  const [documents, invoices] = await Promise.all([
    getShipmentDocumentsForUser(user),
    getInvoicesForUser(user),
  ]);

  return (
    <ProtectedShell
      activeHref="/customer/documents"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/customer", label: "Customer" },
        { label: "Documents" },
      ]}
      description="Review documentation attached to shipments assigned to your customer account."
      title="My Documents"
      user={user}
    >
      {!documents.length && !invoices.length ? (
        <EmptyState
          action={
            <Button asChild variant="accent">
              <Link href={"/shipments" as Route}>
                <PackageSearch aria-hidden="true" />
                View shipments
              </Link>
            </Button>
          }
          description="Shipment documents uploaded by the Apex team will appear here once they are attached to your assigned shipments."
          icon={ClipboardCheck}
          title="No documents available yet"
        />
      ) : (
        <div className="space-y-8">
          {invoices.length ? (
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-accent/15 text-accent-foreground grid size-10 place-items-center rounded-md">
                  <CreditCard aria-hidden="true" className="size-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-normal">
                    Official billing documents
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Printable Apex invoices issued to your customer account.
                  </p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Shipment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <p className="font-semibold">{invoice.invoiceNumber}</p>
                        <p className="text-muted-foreground text-xs">
                          Issued {formatDate(invoice.createdAt)}
                        </p>
                      </TableCell>
                      <TableCell>{invoice.shipmentNumber ?? "Account invoice"}</TableCell>
                      <TableCell>
                        <Badge variant={invoice.status === "PAID" ? "success" : "outline"}>
                          {invoice.status.replaceAll("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatOptionalDate(invoice.dueDate)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatMoney(invoice.total, invoice.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/invoices/${invoice.id}` as Route}>
                            View invoice
                            <ArrowRight aria-hidden="true" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          ) : null}

          {documents.length ? (
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-secondary text-secondary-foreground grid size-10 place-items-center rounded-md">
                  <ClipboardCheck aria-hidden="true" className="size-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-normal">Shipment documents</h2>
                  <p className="text-muted-foreground text-sm">
                    Uploaded records attached to shipments assigned to you.
                  </p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Shipment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{document.fileName}</p>
                          <p className="text-muted-foreground text-xs">
                            {document.documentType} - {formatBytes(document.fileSizeBytes)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{document.shipmentNumber}</p>
                        <p className="text-muted-foreground text-xs">
                          Uploaded {document.uploadedBy ? `by ${document.uploadedBy}` : "by Apex"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <ShipmentStatusBadge status={document.shipmentStatus} />
                          <Badge variant={document.verifiedAt ? "success" : "outline"}>
                            {document.verifiedAt ? "Verified" : "Uploaded"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(document.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/shipments/${document.shipmentId}` as Route}>
                            View shipment
                            <ArrowRight aria-hidden="true" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          ) : null}
        </div>
      )}
    </ProtectedShell>
  );
}
