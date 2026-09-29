'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Send, 
  History, 
  LayoutTemplate, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Eye,
  PenTool,
  Bold,
  Italic,
  Underline,
  Link as LinkIcon
} from 'lucide-react';

export type EmailStudioDashboardProps = {
  emailHealth: { healthy: boolean; provider: string; lastChecked: Date | null };
  overview: { 
    totalSent: number; 
    totalFailed: number; 
    recentEmails: Array<{ id: string; to: string; subject: string; status: string; sentAt: Date; template: string | null }> 
  } | null;
};

const TEMPLATE_OPTIONS = [
  'Custom (blank)', 
  'Shipment Update', 
  'Payment Received', 
  'Delivery Confirmation', 
  'Pet Transport Update', 
  'Account Welcome', 
  'Action Required'
] as const;

type TemplateType = typeof TEMPLATE_OPTIONS[number];

const TEMPLATE_PRESETS: Record<TemplateType, { subject: string; body: string }> = {
  'Custom (blank)': { subject: '', body: '' },
  'Shipment Update': { 
    subject: 'Update on your Apex Global Logistics shipment', 
    body: 'Dear Customer,\n\nThere is an update regarding your recent shipment.\n\nCurrent Status: [Status]\nLocation: [Location]\n\nPlease log in to your dashboard for more details.\n\nBest regards,\nApex Global Logistics Team' 
  },
  'Payment Received': { 
    subject: 'Payment Confirmation - Apex Global Logistics', 
    body: 'Dear Customer,\n\nWe have successfully received your payment of [Amount] for invoice #[InvoiceID].\n\nThank you for choosing Apex Global Logistics.\n\nBest regards,\nApex Global Logistics Team' 
  },
  'Delivery Confirmation': { 
    subject: 'Your shipment has been delivered!', 
    body: 'Dear Customer,\n\nGreat news! Your shipment #[ShipmentID] was successfully delivered on [Date/Time].\n\nThank you for trusting Apex Global Logistics.\n\nBest regards,\nApex Global Logistics Team' 
  },
  'Pet Transport Update': { 
    subject: 'Update on your pet\'s journey 🐾', 
    body: 'Dear [Name],\n\nWe wanted to give you a quick update on your furry friend\'s journey.\n\nStatus: Resting comfortably / In transit\nNotes: [Notes]\n\nThey are in good hands with our specialized pet transport team.\n\nBest regards,\nApex Global Logistics Pet Care Team' 
  },
  'Account Welcome': { 
    subject: 'Welcome to Apex Global Logistics!', 
    body: 'Hi [Name],\n\nWelcome to Apex Global Logistics! We are thrilled to have you on board.\n\nWith our platform, you can seamlessly track shipments, manage invoices, and book specialized transport services.\n\nLog in now to get started.\n\nBest regards,\nThe Apex Global Logistics Team' 
  },
  'Action Required': { 
    subject: 'Action Required: Missing Information for Shipment', 
    body: 'Dear Customer,\n\nWe are currently processing your shipment #[ShipmentID], but we are missing some critical information required for customs clearance.\n\nPlease provide [Required Document/Info] at your earliest convenience to avoid delays.\n\nBest regards,\nApex Global Logistics Team' 
  },
};

const TEMPLATE_LIST = [
  { id: '1', name: 'Shipment Update', category: 'Tracking', lastUpdated: '2026-09-15' },
  { id: '2', name: 'Payment Received', category: 'Billing', lastUpdated: '2026-09-10' },
  { id: '3', name: 'Delivery Confirmation', category: 'Tracking', lastUpdated: '2026-09-20' },
  { id: '4', name: 'Pet Transport Update', category: 'Specialized', lastUpdated: '2026-09-22' },
  { id: '5', name: 'Account Welcome', category: 'Onboarding', lastUpdated: '2026-08-01' },
];

export function EmailStudioDashboard({ emailHealth, overview }: EmailStudioDashboardProps) {
  const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'templates'>('compose');

  // Compose State
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('Custom (blank)');
  const [showPreview, setShowPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as TemplateType;
    setSelectedTemplate(val);
    if (val && TEMPLATE_PRESETS[val]) {
      setSubject(TEMPLATE_PRESETS[val].subject);
      setBody(TEMPLATE_PRESETS[val].body);
    }
  };

  const handleInsertText = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('email-body-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end);
    const newText = body.substring(0, start) + prefix + selectedText + suffix + body.substring(end);
    setBody(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !subject || !body) return;

    setIsSending(true);
    setSendResult(null);

    try {
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, cc: showCc ? cc : undefined, subject, body })
      });

      if (response.ok) {
        setSendResult({ success: true, message: 'Email sent successfully!' });
        setTo('');
        setCc('');
        setSubject('');
        setBody('');
        setSelectedTemplate('Custom (blank)');
        setShowPreview(false);
      } else {
        const error = await response.json();
        setSendResult({ success: false, message: error.message || 'Failed to send email.' });
      }
    } catch {
      setSendResult({ success: false, message: 'A network error occurred.' });
    } finally {
      setIsSending(false);
      // Auto-hide result after 5 seconds
      setTimeout(() => setSendResult(null), 5000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Email Studio</h1>
          <p className="text-slate-500 mt-2">Manage customer communications, templates, and outbound delivery.</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border">
          <div className="flex items-center gap-2">
            {emailHealth.healthy ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <div className="text-sm">
              <p className="font-medium">System Status</p>
              <p className="text-slate-500 text-xs capitalize">{emailHealth.provider} provider</p>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
          <div className="text-sm">
            <p className="font-medium">{overview?.totalSent.toLocaleString() ?? 0} Sent</p>
            <p className="text-slate-500 text-xs">This month</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('compose')}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'compose'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <PenTool className="h-4 w-4" />
          Compose
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <History className="h-4 w-4" />
          Sent History
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'templates'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <LayoutTemplate className="h-4 w-4" />
          Templates
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        
        {/* COMPOSE TAB */}
        {activeTab === 'compose' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-5 w-5 text-slate-500" />
                  New Message
                </CardTitle>
                <CardDescription>Draft and send an email directly to a customer.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                
                {sendResult && (
                  <div className={`mb-6 p-4 rounded-md flex items-start gap-3 ${sendResult.success ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-red-50 text-red-900 border border-red-200'}`}>
                    {sendResult.success ? <CheckCircle2 className="h-5 w-5 mt-0.5 text-emerald-600" /> : <XCircle className="h-5 w-5 mt-0.5 text-red-600" />}
                    <div>
                      <h4 className="font-medium">{sendResult.success ? 'Success' : 'Error'}</h4>
                      <p className="text-sm mt-1">{sendResult.message}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSend} className="space-y-5">
                  {/* Template Selection */}
                  <div className="flex flex-col space-y-1.5">
                    <label htmlFor="template" className="text-sm font-medium">Quick Template</label>
                    <select
                      id="template"
                      value={selectedTemplate}
                      onChange={handleTemplateChange}
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-slate-700 dark:bg-slate-950"
                    >
                      {TEMPLATE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* To Field */}
                  <div className="flex flex-col space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="to" className="text-sm font-medium">To</label>
                      {!showCc && (
                        <button type="button" onClick={() => setShowCc(true)} className="text-xs text-blue-600 hover:underline">
                          Add Cc
                        </button>
                      )}
                    </div>
                    <input
                      id="to"
                      type="email"
                      placeholder="customer@example.com"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      required
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>

                  {/* CC Field */}
                  {showCc && (
                    <div className="flex flex-col space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="cc" className="text-sm font-medium text-slate-500">Cc</label>
                        <button type="button" onClick={() => { setShowCc(false); setCc(''); }} className="text-xs text-slate-500 hover:underline">
                          Remove
                        </button>
                      </div>
                      <input
                        id="cc"
                        type="email"
                        placeholder="cc@example.com"
                        value={cc}
                        onChange={(e) => setCc(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>
                  )}

                  {/* Subject Field */}
                  <div className="flex flex-col space-y-1.5">
                    <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                    <input
                      id="subject"
                      type="text"
                      placeholder="Email subject..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>

                  {/* Body Field */}
                  <div className="flex flex-col space-y-1.5 pt-2">
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="email-body-textarea" className="text-sm font-medium">Message Body</label>
                      <button 
                        type="button" 
                        onClick={() => setShowPreview(!showPreview)} 
                        className="text-xs flex items-center gap-1 text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors dark:bg-slate-800 dark:text-slate-300"
                      >
                        {showPreview ? <PenTool className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {showPreview ? 'Edit' : 'Preview'}
                      </button>
                    </div>

                    {!showPreview ? (
                      <div className="border border-slate-300 dark:border-slate-700 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-shadow bg-white dark:bg-slate-950">
                        {/* Toolbar */}
                        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-1">
                          <button type="button" onClick={() => handleInsertText('**', '**')} className="p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded transition-colors" title="Bold">
                            <Bold className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => handleInsertText('*', '*')} className="p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded transition-colors" title="Italic">
                            <Italic className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => handleInsertText('__', '__')} className="p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded transition-colors" title="Underline">
                            <Underline className="h-4 w-4" />
                          </button>
                          <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                          <button type="button" onClick={() => handleInsertText('[', '](url)')} className="p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded transition-colors" title="Link">
                            <LinkIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <textarea
                          id="email-body-textarea"
                          rows={12}
                          placeholder="Type your message here..."
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          required
                          className="w-full resize-y p-3 text-sm border-0 focus:ring-0 bg-transparent"
                        />
                      </div>
                    ) : (
                      <div className="border border-slate-300 dark:border-slate-700 rounded-md p-4 bg-white dark:bg-slate-950 min-h-[320px] max-h-[500px] overflow-y-auto font-sans prose prose-sm max-w-none dark:prose-invert">
                        {body ? (
                          <div className="whitespace-pre-wrap">{body}</div>
                        ) : (
                          <div className="text-slate-400 italic">No content to preview</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex items-center justify-end">
                    <Button type="submit" disabled={isSending || !to || !subject || !body} className="gap-2 bg-blue-600 hover:bg-blue-700">
                      {isSending ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {isSending ? 'Sending...' : 'Send Email'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b pb-4">
                  <CardTitle className="text-base">Tips</CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-sm text-slate-600 dark:text-slate-400 space-y-3">
                  <p>• Use <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">[Variables]</span> like [Name] or [ShipmentID] as placeholders when drafting.</p>
                  <p>• Keep subject lines clear and concise for better open rates.</p>
                  <p>• Double-check tracking links before sending custom updates.</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b pb-4">
                  <CardTitle className="text-base">Recent Recipients</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {overview?.recentEmails.slice(0, 3).map((email, idx) => (
                      <div key={idx} className="p-4 text-sm flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer" onClick={() => setTo(email.to)}>
                        <div className="truncate pr-4">
                          <p className="font-medium truncate">{email.to}</p>
                          <p className="text-slate-500 text-xs truncate mt-0.5">{email.subject}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0">Use</Button>
                      </div>
                    ))}
                    {(!overview?.recentEmails || overview.recentEmails.length === 0) && (
                      <div className="p-4 text-sm text-slate-500 text-center">No recent recipients</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* SENT HISTORY TAB */}
        {activeTab === 'history' && (
          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b">
              <CardTitle>Sent History</CardTitle>
              <CardDescription>Review all emails sent through the system recently.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-medium">To</th>
                      <th className="px-6 py-4 font-medium">Subject</th>
                      <th className="px-6 py-4 font-medium">Template</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Sent At</th>
                      <th className="px-6 py-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {overview?.recentEmails.map((email) => (
                      <tr key={email.id} className="bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{email.to}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{email.subject}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {email.template || 'Custom'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={email.status === 'Delivered' ? 'success' : email.status === 'Bounced' ? 'danger' : 'neutral'}>
                            {email.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                          {new Date(email.sentAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="outline" size="sm">View</Button>
                        </td>
                      </tr>
                    ))}
                    {(!overview?.recentEmails || overview.recentEmails.length === 0) && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                          No recent emails found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TEMPLATES TAB */}
        {activeTab === 'templates' && (
          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>Manage the pre-defined templates available for quick composing.</CardDescription>
              </div>
              <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                <PenTool className="h-4 w-4" />
                New Template
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-medium">Template Name</th>
                      <th className="px-6 py-4 font-medium">Category</th>
                      <th className="px-6 py-4 font-medium">Last Updated</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {TEMPLATE_LIST.map((tpl) => (
                      <tr key={tpl.id} className="bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{tpl.name}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="text-slate-500 border-slate-200 dark:border-slate-700">
                            {tpl.category}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(tpl.lastUpdated).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">Edit</Button>
                          <Button variant="ghost" size="sm" className="text-slate-600">View</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
