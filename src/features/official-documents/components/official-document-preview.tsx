import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, BadgeCheck, Building2, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PrintButton } from "@/features/shipments/components/print-button";
import type { OfficialDocumentTemplate } from "@/features/official-documents/types/official-document.types";
import type { CompanyProfileInput } from "@/features/settings/schemas/company-profile.schema";

function formatDate(value = new Date()) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "long",
  }).format(value);
}

function getCompanyAddressLines(profile: CompanyProfileInput) {
  return [
    profile.addressLine1,
    profile.addressLine2,
    [profile.city, profile.state, profile.postalCode].filter(Boolean).join(", "),
    profile.country,
  ].filter((line): line is string => Boolean(line));
}

function getTemplateValues(template: OfficialDocumentTemplate, profile: CompanyProfileInput) {
  return {
    amountDue: template.amountDefault || "$0.00",
    companyName: "Apex Global Logistics",
    currentLocation: "Current transit facility",
    deliveryAddress: "Recipient delivery address on file",
    documentDate: formatDate(),
    estimatedDeliveryDate: "Estimated delivery date",
    paymentInstructions:
      template.paymentInstructions || "Use the approved Apex invoice or payment portal.",
    petName: "Pet name",
    recipientName: "Customer name",
    refundTerms: template.refundTerms || "Terms are shown on the approved billing record.",
    supportEmail: profile.email || "support@apexgloballogistics.com",
    supportPhone: profile.phone || "Support phone on file",
    trackingNumber: "AGL-PET-2026-0001",
    website: profile.website || "https://apexgloballogistics.com",
  } satisfies Record<string, string>;
}

function renderTemplateText(text: string, values: Record<string, string>) {
  return text.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key: string) => {
    return values[key] ?? `{{${key}}}`;
  });
}

function TextContent({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-sm leading-6 text-slate-700 print:space-y-2 print:text-[10px] print:leading-4">
      {text
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean)
        .map((block) => (
          <p className="whitespace-pre-line" key={block}>
            {block}
          </p>
        ))}
    </div>
  );
}

function CompanyHeader({ profile }: { profile: CompanyProfileInput }) {
  const addressLines = getCompanyAddressLines(profile);
  const contactLines = [profile.email, profile.phone, profile.website].filter(
    (line): line is string => Boolean(line),
  );

  return (
    <div className="flex items-start justify-between gap-6 border-b-4 border-slate-950 pb-6 print:pb-4">
      <div>
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-md bg-slate-950 text-sm font-black text-white">
            AG
          </div>
          <div>
            <p className="text-2xl font-black tracking-normal text-slate-950">
              Apex Global Logistics
            </p>
            <p className="text-sm font-semibold text-slate-600">
              Official transport and compliance document
            </p>
          </div>
        </div>
        {addressLines.length || contactLines.length ? (
          <div className="mt-4 text-xs leading-5 text-slate-600 print:text-[9px] print:leading-4">
            {addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            {contactLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : null}
      </div>
      <div className="text-right">
        <p className="text-xs font-bold tracking-[0.24em] text-slate-500 uppercase">Approved</p>
        <p className="mt-2 text-sm font-bold text-slate-950">Document Control</p>
        <p className="mt-1 text-xs text-slate-600">{formatDate()}</p>
      </div>
    </div>
  );
}

export function OfficialDocumentPreview({
  profile,
  template,
}: {
  profile: CompanyProfileInput;
  template: OfficialDocumentTemplate;
}) {
  const values = getTemplateValues(template, profile);
  const body = renderTemplateText(template.body, values);
  const subject = renderTemplateText(template.subject, values);
  const documentNumber = `APX-${template.slug.toUpperCase().slice(0, 18)}-${new Date()
    .getFullYear()
    .toString()}`;

  return (
    <main
      id="main-content"
      className="min-h-svh bg-slate-100 px-4 py-6 text-slate-950 print:bg-white print:p-0"
    >
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 8mm;
            }

            .official-document-sheet {
              max-height: 281mm;
              overflow: hidden;
              page-break-after: avoid;
              page-break-inside: avoid;
            }

            .official-document-sheet h1 {
              font-size: 25px !important;
            }
          }
        `}
      </style>
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Button asChild variant="outline">
            <Link href={"/admin/documents" as Route}>
              <ArrowLeft aria-hidden="true" />
              Back to documents
            </Link>
          </Button>
          <PrintButton label="Download / print PDF" />
        </div>

        <section className="official-document-sheet rounded-lg border border-slate-300 bg-white p-8 shadow-sm print:rounded-none print:border-0 print:p-0 print:text-[11px] print:shadow-none">
          <CompanyHeader profile={profile} />

          <div className="grid gap-6 border-b border-slate-300 py-6 md:grid-cols-[1fr_260px] print:gap-4 print:py-4">
            <div>
              <p className="text-xs font-bold tracking-[0.24em] text-slate-500 uppercase">
                {template.category}
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-normal text-slate-950">
                {template.title}
              </h1>
              <p className="mt-3 text-sm font-semibold text-slate-700">{subject}</p>
            </div>
            <div className="grid gap-2 text-sm print:text-[10px]">
              {[
                ["Document ID", documentNumber],
                ["Tracking", values.trackingNumber],
                ["Recipient", values.recipientName],
                ["Date", values.documentDate],
              ].map(([label, value]) => (
                <div className="rounded-md border border-slate-300 p-3 print:p-2" key={label}>
                  <p className="text-xs font-bold tracking-[0.16em] text-slate-500 uppercase print:text-[8px]">
                    {label}
                  </p>
                  <p className="mt-1 font-bold">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 py-6 md:grid-cols-[1fr_280px] print:gap-4 print:py-4">
            <TextContent text={body} />
            <aside className="space-y-3">
              <div className="rounded-md border border-slate-300 p-4 print:p-3">
                <FileText aria-hidden="true" className="size-5 text-slate-700" />
                <p className="mt-3 text-xs font-bold tracking-[0.18em] text-slate-500 uppercase">
                  Billing summary
                </p>
                <p className="mt-2 font-bold">{template.amountLabel || "Document amount"}</p>
                <p className="mt-1 text-2xl font-black print:text-lg">
                  {template.amountDefault || values.amountDue}
                </p>
              </div>
              <div className="rounded-md border border-slate-300 p-4 text-sm leading-6 print:p-3 print:text-[10px] print:leading-4">
                <p className="font-bold text-slate-950">Terms</p>
                <p className="mt-2 text-slate-600">{values.refundTerms}</p>
              </div>
              <div className="rounded-md border border-slate-300 p-4 text-sm leading-6 print:p-3 print:text-[10px] print:leading-4">
                <p className="font-bold text-slate-950">Payment instruction</p>
                <p className="mt-2 text-slate-600">{values.paymentInstructions}</p>
              </div>
            </aside>
          </div>

          <footer className="grid gap-5 border-t border-slate-300 pt-5 text-sm leading-6 text-slate-600 md:grid-cols-[1fr_260px] print:gap-4 print:pt-4 print:text-[10px] print:leading-4">
            <div>
              <p className="flex items-center gap-2 font-bold text-slate-950">
                <BadgeCheck aria-hidden="true" className="size-4" />
                Company-approved document
              </p>
              <p className="mt-2">
                This document is generated from the editable Apex Global Logistics template library.
                Final client values should be reviewed before sending or printing.
              </p>
            </div>
            <div>
              <p className="font-bold text-slate-950">Authorized by</p>
              <p className="mt-2">Apex Global Logistics</p>
              {profile.taxId ? (
                <p className="mt-2 flex items-center gap-2">
                  <Building2 aria-hidden="true" className="size-4" />
                  {profile.taxId}
                </p>
              ) : null}
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}
