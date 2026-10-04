"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Printer, Save, Send, CheckCircle, Loader2, Mail } from "lucide-react";

export type InvoiceEditorProps = {
  invoice?: {
    id: string;
    invoiceNumber: string;
    customerName: string;
    customerEmail: string;
    billingAddress: string | null;
    lineItems: Array<{ description: string; quantity: number; unitPrice: number }>;
    taxRate: number;
    notes: string | null;
    status: string;
    dueAt: Date | null;
  } | null;
};

export function InvoiceEditor({ invoice }: InvoiceEditorProps) {
  const [invoiceNumber, setInvoiceNumber] = useState(
    invoice?.invoiceNumber || `INV-${String(Math.floor(Math.random() * 9000) + 1000)}`,
  );
  const [customerName, setCustomerName] = useState(invoice?.customerName || "");
  const [customerEmail, setCustomerEmail] = useState(invoice?.customerEmail || "");
  const [billingAddress, setBillingAddress] = useState(invoice?.billingAddress || "");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const initialDueDate = invoice?.dueAt ? new Date(invoice.dueAt).toISOString().split("T")[0] : "";
  const [dueDate, setDueDate] = useState(initialDueDate);
  const [lineItems, setLineItems] = useState(
    invoice?.lineItems?.length
      ? invoice.lineItems
      : [{ description: "", quantity: 1, unitPrice: 0 }],
  );
  const [taxRate, setTaxRate] = useState(invoice?.taxRate || 0);
  const [notes, setNotes] = useState(invoice?.notes || "");

  // Email sending state
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const addLineItem = () => setLineItems([...lineItems, { description: "", quantity: 1, unitPrice: 0 }]);

  const removeLineItem = (index: number) => setLineItems(lineItems.filter((_, i) => i !== index));

  const updateLineItem = (index: number, field: string, value: string | number) => {
    const newItems = [...lineItems];
    const item = newItems[index];
    if (!item) return;
    newItems[index] = { ...item, [field]: value };
    setLineItems(newItems);
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const handlePrint = () => window.print();

  const handleSendEmailInvoice = async () => {
    if (!invoice?.id) {
      setSendError("Save the invoice first before sending.");
      return;
    }
    if (!customerEmail) {
      setSendError("Customer email is required.");
      return;
    }
    setIsSending(true);
    setSendError(null);
    setSendSuccess(false);
    try {
      const res = await fetch(`/api/admin/invoices/${invoice.id}/send-email`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to send");
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 5000);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send invoice email.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-8 lg:flex-row">
      {/* LEFT PANEL – Edit Form */}
      <div className="flex w-full flex-col gap-6 lg:w-1/2 print:hidden">
        <Card className="flex-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Invoice Details</CardTitle>
              {invoice?.status && (
                <Badge variant={invoice.status === "PAID" ? "success" : invoice.status === "OVERDUE" ? "danger" : "neutral"}>
                  {invoice.status}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Invoice #</label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
            </div>

            <div className="space-y-4">
              <h3 className="border-b pb-2 text-sm font-semibold">Bill To</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer Name</label>
                  <Input
                    placeholder="Acme Corp"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer Email</label>
                  <Input
                    type="email"
                    placeholder="billing@acmecorp.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Billing Address</label>
                <textarea
                  className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                  placeholder="123 Business Rd..."
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Issue Date</label>
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="border-b pb-2 text-sm font-semibold">Line Items</h3>
              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="flex-1 space-y-1">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, "description", e.target.value)}
                      />
                    </div>
                    <div className="w-20 space-y-1">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(index, "quantity", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="w-24 space-y-1">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateLineItem(index, "unitPrice", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive mt-0.5"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addLineItem}
                className="w-full border-dashed"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tax Rate (%)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                placeholder="Thanks for your business..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t p-6">
            {/* Primary: Send Email Invoice */}
            <Button
              className="w-full"
              variant="accent"
              onClick={handleSendEmailInvoice}
              disabled={isSending || !customerEmail}
            >
              {isSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : sendSuccess ? (
                <CheckCircle className="mr-2 h-4 w-4" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              {isSending ? "Sending…" : sendSuccess ? "Invoice Sent!" : "Send Email Invoice"}
            </Button>

            {sendSuccess && (
              <p className="text-success w-full text-center text-xs font-medium">
                Invoice emailed to {customerEmail}
              </p>
            )}
            {sendError && (
              <p className="text-destructive w-full text-center text-xs">{sendError}</p>
            )}

            {/* Secondary actions */}
            <div className="flex w-full gap-3">
              <Button variant="outline" className="flex-1">
                <Save className="mr-2 h-4 w-4" /> Save Draft
              </Button>
              <Button variant="outline" className="flex-1" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print PDF
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* RIGHT PANEL – Live Preview */}
      <div className="w-full lg:w-1/2">
        <div className="sticky top-6">
          <div className="mb-3 flex items-center justify-between print:hidden">
            <p className="text-muted-foreground text-sm">Live preview — updates as you type</p>
            <Button variant="secondary" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Print / PDF
            </Button>
          </div>

          {/* Preview card styled like the email */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
            {/* Header bar */}
            <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-tr-xl rounded-bl-xl bg-amber-400 text-base font-black text-slate-900">
                  A
                </div>
                <span className="text-sm font-bold tracking-wider text-white uppercase">
                  Apex Global Logistics
                </span>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
                style={{ background: "#16a34a22", color: "#16a34a" }}
              >
                {invoice?.status ?? "DRAFT"}
              </span>
            </div>

            {/* Amount hero */}
            <div className="border-b-4 border-amber-400 bg-slate-900 px-8 py-7 text-center">
              <p className="mb-1 text-xs font-bold tracking-widest text-slate-500 uppercase">Amount Due</p>
              <p className="text-5xl font-extrabold tracking-tight text-white">{fmt(total)}</p>
              <p className="mt-2 text-xs text-slate-500">
                {invoiceNumber}
                {dueDate ? ` · Due ${dueDate}` : ""}
              </p>
            </div>

            {/* Body */}
            <div className="bg-white px-8 py-8 text-black">
              {/* From / Bill To */}
              <div className="mb-6 grid grid-cols-2 gap-8">
                <div>
                  <p className="mb-1 text-[10px] font-black tracking-wider text-slate-400 uppercase">From</p>
                  <p className="text-sm font-semibold">Apex Global Logistics</p>
                  <p className="text-xs text-slate-500">info@apexgloballogistics.net</p>
                  <p className="mt-3 mb-1 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Date
                  </p>
                  <p className="text-xs text-slate-600">{issueDate || "—"}</p>
                </div>
                <div className="border-l border-slate-100 pl-8">
                  <p className="mb-1 text-[10px] font-black tracking-wider text-slate-400 uppercase">Bill To</p>
                  <p className="text-sm font-semibold">{customerName || "Customer Name"}</p>
                  <p className="text-xs text-slate-500">{customerEmail || "email@example.com"}</p>
                  {billingAddress && (
                    <p className="mt-1 text-xs whitespace-pre-wrap text-slate-400">{billingAddress}</p>
                  )}
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Line items */}
              <table className="mt-4 w-full border-collapse text-left">
                <thead>
                  <tr className="border-b-2 border-slate-900">
                    <th className="py-2 text-[10px] font-black tracking-wider text-slate-500 uppercase">
                      Description
                    </th>
                    <th className="w-12 py-2 text-center text-[10px] font-black tracking-wider text-slate-500 uppercase">
                      Qty
                    </th>
                    <th className="w-20 py-2 text-right text-[10px] font-black tracking-wider text-slate-500 uppercase">
                      Price
                    </th>
                    <th className="w-20 py-2 text-right text-[10px] font-black tracking-wider text-slate-500 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-3 text-sm text-slate-800">{item.description || "—"}</td>
                      <td className="py-3 text-center text-sm text-slate-500">{item.quantity}</td>
                      <td className="py-3 text-right text-sm text-slate-500">{fmt(item.unitPrice)}</td>
                      <td className="py-3 text-right text-sm font-semibold text-slate-800">
                        {fmt(item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="mt-4 flex justify-end">
                <div className="w-44 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="text-slate-800">{fmt(subtotal)}</span>
                  </div>
                  {taxRate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Tax ({taxRate}%)</span>
                      <span className="text-slate-800">{fmt(taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t-2 border-slate-900 pt-2">
                    <span className="text-base font-bold text-slate-900">Total</span>
                    <span className="text-base font-bold text-slate-900">{fmt(total)}</span>
                  </div>
                </div>
              </div>

              {notes && (
                <div className="mt-6 rounded-lg border-l-4 border-amber-400 bg-slate-50 p-4">
                  <p className="mb-1 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Notes
                  </p>
                  <p className="text-sm whitespace-pre-wrap text-slate-600">{notes}</p>
                </div>
              )}

              <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs font-medium tracking-wider text-slate-400 uppercase">
                Thank you for your business · Payment due within 30 days
              </div>
            </div>

            {/* Email-style footer */}
            <div className="border-t border-slate-100 bg-slate-50 px-8 py-4 text-center">
              <p className="text-xs text-slate-400">
                This email invoice will be sent to{" "}
                <span className="text-amber-500 font-medium">
                  {customerEmail || "customer@email.com"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
