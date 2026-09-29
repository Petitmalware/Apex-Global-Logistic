'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Printer, Save, Send } from 'lucide-react';

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
  const [invoiceNumber, setInvoiceNumber] = useState(invoice?.invoiceNumber || `INV-${Math.floor(Math.random() * 10000)}`);
  const [customerName, setCustomerName] = useState(invoice?.customerName || '');
  const [customerEmail, setCustomerEmail] = useState(invoice?.customerEmail || '');
  const [billingAddress, setBillingAddress] = useState(invoice?.billingAddress || '');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  
  const initialDueDate = invoice?.dueAt ? new Date(invoice.dueAt).toISOString().split('T')[0] : '';
  const [dueDate, setDueDate] = useState(initialDueDate);
  
  const [lineItems, setLineItems] = useState(
    invoice?.lineItems?.length 
      ? invoice.lineItems 
      : [{ description: '', quantity: 1, unitPrice: 0 }]
  );
  
  const [taxRate, setTaxRate] = useState(invoice?.taxRate || 0);
  const [notes, setNotes] = useState(invoice?.notes || '');

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: string, value: string | number) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setLineItems(newItems);
  };

  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full">
      {/* LEFT PANEL - Edit Form */}
      <div className="w-full lg:w-1/2 flex flex-col gap-6 print:hidden">
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
              <h3 className="text-sm font-semibold border-b pb-2">Bill To</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer Name</label>
                  <Input placeholder="Acme Corp" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer Email</label>
                  <Input type="email" placeholder="billing@acmecorp.com" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Billing Address</label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
              <h3 className="text-sm font-semibold border-b pb-2">Line Items</h3>
              
              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-1">
                      <Input 
                        placeholder="Description" 
                        value={item.description} 
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)} 
                      />
                    </div>
                    <div className="w-20 space-y-1">
                      <Input 
                        type="number" 
                        min="1" 
                        placeholder="Qty" 
                        value={item.quantity} 
                        onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                    <div className="w-24 space-y-1">
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder="Price" 
                        value={item.unitPrice} 
                        onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive mt-0.5" onClick={() => removeLineItem(index)} disabled={lineItems.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={addLineItem} className="w-full border-dashed">
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tax Rate (%)</label>
                <Input type="number" min="0" step="0.1" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
          
          <Card className="bg-white text-black shadow-lg print:shadow-none print:border-none rounded-none w-full max-w-3xl mx-auto overflow-hidden">
            <CardContent className="p-10 sm:p-12">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b pb-8 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-bl-xl rounded-tr-xl flex items-center justify-center text-white font-bold text-xl">A</div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Apex Global</h1>
                  </div>
                  <p className="text-sm text-slate-500">Logistics & Shipping</p>
                  <div className="text-sm text-slate-500 mt-4 space-y-1">
                    <p>100 Maritime Way, Suite 400</p>
                    <p>Port City, PC 90210</p>
                    <p>billing@apexglobal.com</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-4xl font-light text-slate-300 uppercase tracking-widest mb-4">Invoice</h2>
                  <p className="text-lg font-medium text-slate-800">{invoiceNumber || 'INV-0000'}</p>
                </div>
              </div>

              {/* Info row */}
              <div className="flex justify-between items-start mb-8">
                <div className="w-1/2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To</h3>
                  <p className="font-medium text-slate-800">{customerName || 'Customer Name'}</p>
                  {customerEmail && <p className="text-sm text-slate-600">{customerEmail}</p>}
                  {billingAddress && (
                    <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{billingAddress}</p>
                  )}
                </div>
                <div className="w-1/3 space-y-3">
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-sm font-medium text-slate-500">Date</span>
                    <span className="text-sm text-slate-800">{issueDate || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-sm font-medium text-slate-500">Due Date</span>
                    <span className="text-sm text-slate-800">{dueDate || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8 min-h-[200px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-800">
                      <th className="py-3 text-sm font-bold text-slate-800">Description</th>
                      <th className="py-3 text-sm font-bold text-slate-800 text-center w-20">Qty</th>
                      <th className="py-3 text-sm font-bold text-slate-800 text-right w-28">Price</th>
                      <th className="py-3 text-sm font-bold text-slate-800 text-right w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-4 text-sm text-slate-800">{item.description || '-'}</td>
                        <td className="py-4 text-sm text-slate-600 text-center">{item.quantity}</td>
                        <td className="py-4 text-sm text-slate-600 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-4 text-sm text-slate-800 text-right font-medium">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-12">
                <div className="w-1/2 sm:w-1/3 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Subtotal</span>
                    <span className="text-sm text-slate-800">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Tax ({taxRate}%)</span>
                    <span className="text-sm text-slate-800">{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t-2 border-slate-800 pt-3 mt-3">
                    <span className="text-base font-bold text-slate-800">Total</span>
                    <span className="text-base font-bold text-slate-800">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 pt-8">
                {notes && (
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{notes}</p>
                  </div>
                )}
                <div className="text-center text-xs text-slate-400 font-medium tracking-wide">
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
