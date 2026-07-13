import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, ReceiptText } from "lucide-react";

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
import type { InvoiceListItem } from "@/features/invoices/types/invoice.types";

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatMoney(value: string | number, currency = "USD") {
  return new Intl.NumberFormat("en", {
    currency,
    style: "currency",
  }).format(Number(value));
}

export function InvoiceList({ invoices }: { invoices: InvoiceListItem[] }) {
  if (!invoices.length) {
    return (
      <EmptyState
        action={
          <Button asChild variant="accent">
            <Link href={"/admin/invoices/new" as Route}>Issue invoice</Link>
          </Button>
        }
        description="Issued customer invoices will appear here with status, shipment, and due date."
        icon={ReceiptText}
        title="No invoices issued yet"
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Shipment</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Due</TableHead>
          <TableHead>Total</TableHead>
          <TableHead className="text-right">Open</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell>
              <p className="font-semibold">{invoice.invoiceNumber}</p>
              <p className="text-muted-foreground text-xs">{formatDate(invoice.createdAt)}</p>
            </TableCell>
            <TableCell>
              <p>{invoice.customerName ?? "Customer"}</p>
              <p className="text-muted-foreground text-xs">{invoice.customerEmail ?? "No email"}</p>
              {invoice.customerPhone ? (
                <p className="text-muted-foreground text-xs">{invoice.customerPhone}</p>
              ) : null}
            </TableCell>
            <TableCell className="font-mono text-xs">
              {invoice.shipmentNumber ?? "Unlinked"}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{invoice.status.replaceAll("_", " ")}</Badge>
            </TableCell>
            <TableCell>{formatDate(invoice.dueDate)}</TableCell>
            <TableCell className="font-semibold">
              {formatMoney(invoice.total, invoice.currency)}
            </TableCell>
            <TableCell className="text-right">
              <Button asChild size="sm" variant="ghost">
                <Link href={`/invoices/${invoice.id}` as Route}>
                  View
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
