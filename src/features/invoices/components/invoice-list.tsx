"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Eye, CheckCircle, Send, FileText, Loader2 } from "lucide-react";
import type { InvoiceListItem } from "@/features/invoices/types/invoice.types";

export type Invoice = InvoiceListItem;

const statusColors: Record<Invoice["status"], string> = {
  DRAFT: "bg-muted text-muted-foreground",
  ISSUED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  PARTIALLY_PAID: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  PAID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  VOID: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  UNCOLLECTIBLE: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

export function InvoiceList({ invoices: initialInvoices }: { invoices: Invoice[] }) {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const stats = useMemo(() => {
    const totalInvoices = invoices.length;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let overdueCount = 0;

    invoices.forEach((inv) => {
      if (inv.status === "PAID") totalPaid += Number(inv.total);
      if (inv.status === "ISSUED" || inv.status === "OVERDUE")
        totalOutstanding += Number(inv.total);
      if (inv.status === "OVERDUE") overdueCount++;
    });

    return { totalInvoices, totalPaid, totalOutstanding, overdueCount };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    const lower = searchTerm.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(lower) ||
        (inv.customerName ?? "").toLowerCase().includes(lower) ||
        (inv.customerEmail ?? "").toLowerCase().includes(lower),
    );
  }, [invoices, searchTerm]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  const handleMarkAsPaid = async (id: string) => {
    setLoadingInvoiceId(id);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/admin/invoices/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update status");
      }
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, status: "PAID" } : inv)),
      );
      setStatusMessage("Invoice marked as paid.");
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Error updating invoice.");
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  const handleSendEmail = async (id: string, email: string | null) => {
    if (!email) {
      setStatusMessage("Invoice has no customer email address.");
      return;
    }
    setLoadingInvoiceId(id);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/admin/invoices/${id}/send-email`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send email");
      }
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === id && inv.status === "DRAFT" ? { ...inv, status: "ISSUED" } : inv,
        ),
      );
      setStatusMessage(`Invoice emailed to ${email}.`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Error sending invoice email.");
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Feedback banner */}
      {statusMessage && (
        <div className="border-accent/40 bg-accent/10 text-accent rounded-lg border px-4 py-3 text-sm font-medium">
          {statusMessage}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Total Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPaid, "USD")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Total Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalOutstanding, "USD")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.overdueCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            type="search"
            placeholder="Search invoices..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button asChild variant="accent">
          <Link href={"/admin/invoices/new" as Route}>
            <FileText className="mr-2 h-4 w-4" />
            Create Invoice
          </Link>
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground h-32 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="mb-2 h-8 w-8 opacity-50" />
                      <p>No invoices found.</p>
                      <p className="text-sm">Try adjusting your search or create a new invoice.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{inv.customerName || "Customer"}</span>
                        <span className="text-muted-foreground text-xs">{inv.customerEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(Number(inv.total), inv.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`border-none ${statusColors[inv.status]}`}
                      >
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(inv.createdAt)}</TableCell>
                    <TableCell>
                      <span
                        className={
                          inv.status === "OVERDUE"
                            ? "font-medium text-red-600 dark:text-red-400"
                            : ""
                        }
                      >
                        {formatDate(inv.dueDate)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* View Link */}
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          title="View / Print"
                        >
                          <Link href={`/invoices/${inv.id}` as Route}>
                            <Eye className="text-muted-foreground h-4 w-4" />
                          </Link>
                        </Button>

                        {/* Mark as Paid Action */}
                        {inv.status !== "PAID" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Mark as Paid"
                            disabled={loadingInvoiceId === inv.id}
                            onClick={() => handleMarkAsPaid(inv.id)}
                          >
                            {loadingInvoiceId === inv.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-600 hover:text-green-700" />
                            )}
                          </Button>
                        )}

                        {/* Send Email Action */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Send Email Invoice"
                          disabled={loadingInvoiceId === inv.id}
                          onClick={() => handleSendEmail(inv.id, inv.customerEmail)}
                        >
                          {loadingInvoiceId === inv.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                          ) : (
                            <Send className="text-muted-foreground h-4 w-4 hover:text-amber-500" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
