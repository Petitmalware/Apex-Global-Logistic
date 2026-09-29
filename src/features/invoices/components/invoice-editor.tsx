"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Printer, Save, Send } from "lucide-react";

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
    invoice?.invoiceNumber || `INV-${Math.floor(Math.random() * 10000)}`,
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

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex w-full flex-col gap-8 lg:flex-row">
      {/* LEFT PANEL - Edit Form */}
      <div className="flex w-full flex-col gap-6 lg:w-1/2 print:hidden">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Invoice #</label>
                <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
              </div>
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
                  className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="123 Business Rd..."
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Issue Date</label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
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
          <CardFooter className="flex justify-between border-t p-6">
            <Button variant="outline">
              <Save className="mr-2 h-4 w-4" /> Save Draft
            </Button>
            <Button>
              <Send className="mr-2 h-4 w-4" /> Send Invoice
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* RIGHT PANEL - Live Print Preview */}
      <div className="w-full lg:w-1/2">
        <div className="sticky top-6">
          <div className="mb-4 flex justify-end print:hidden">
            <Button variant="secondary" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Print / PDF
            </Button>
          </div>

          <Card className="mx-auto w-full max-w-3xl overflow-hidden rounded-none bg-white text-black shadow-lg print:border-none print:shadow-none">
            <CardContent className="p-10 sm:p-12">
              {/* Header */}
              <div className="mb-8 flex items-start justify-between border-b pb-8">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-tr-xl rounded-bl-xl bg-blue-600 text-xl font-bold text-white">
                      A
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                      Apex Global
                    </h1>
                  </div>
                  <p className="text-sm text-slate-500">Logistics & Shipping</p>
                  <div className="mt-4 space-y-1 text-sm text-slate-500">
                    <p>100 Maritime Way, Suite 400</p>
                    <p>Port City, PC 90210</p>
                    <p>billing@apexglobal.com</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="mb-4 text-4xl font-light tracking-widest text-slate-300 uppercase">
                    Invoice
                  </h2>
                  <p className="text-lg font-medium text-slate-800">
                    {invoiceNumber || "INV-0000"}
                  </p>
                </div>
              </div>

              {/* Info row */}
              <div className="mb-8 flex items-start justify-between">
                <div className="w-1/2">
                  <h3 className="mb-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
                    Bill To
                  </h3>
                  <p className="font-medium text-slate-800">{customerName || "Customer Name"}</p>
                  {customerEmail && <p className="text-sm text-slate-600">{customerEmail}</p>}
                  {billingAddress && (
                    <p className="mt-1 text-sm whitespace-pre-wrap text-slate-600">
                      {billingAddress}
                    </p>
                  )}
                </div>
                <div className="w-1/3 space-y-3">
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-sm font-medium text-slate-500">Date</span>
                    <span className="text-sm text-slate-800">{issueDate || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-sm font-medium text-slate-500">Due Date</span>
                    <span className="text-sm text-slate-800">{dueDate || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8 min-h-[200px]">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-800">
                      <th className="py-3 text-sm font-bold text-slate-800">Description</th>
                      <th className="w-20 py-3 text-center text-sm font-bold text-slate-800">
                        Qty
                      </th>
                      <th className="w-28 py-3 text-right text-sm font-bold text-slate-800">
                        Price
                      </th>
                      <th className="w-28 py-3 text-right text-sm font-bold text-slate-800">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-4 text-sm text-slate-800">{item.description || "-"}</td>
                        <td className="py-4 text-center text-sm text-slate-600">{item.quantity}</td>
                        <td className="py-4 text-right text-sm text-slate-600">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="py-4 text-right text-sm font-medium text-slate-800">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mb-12 flex justify-end">
                <div className="w-1/2 space-y-3 sm:w-1/3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Subtotal</span>
                    <span className="text-sm text-slate-800">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Tax ({taxRate}%)</span>
                    <span className="text-sm text-slate-800">{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="mt-3 flex justify-between border-t-2 border-slate-800 pt-3">
                    <span className="text-base font-bold text-slate-800">Total</span>
                    <span className="text-base font-bold text-slate-800">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 pt-8">
                {notes && (
                  <div className="mb-6">
                    <h4 className="mb-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
                      Notes
                    </h4>
                    <p className="text-sm whitespace-pre-wrap text-slate-600">{notes}</p>
                  </div>
                )}
                <div className="text-center text-xs font-medium tracking-wide text-slate-400">
                  THANK YOU FOR YOUR BUSINESS. PAYMENT DUE WITHIN 30 DAYS.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
