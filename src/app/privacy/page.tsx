import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading, Kicker, Text } from "@/components/ui/typography";
import { MarketingShell } from "@/features/marketing/components/marketing-shell";
import { PageHero } from "@/features/marketing/components/marketing-sections";
import { marketingImages } from "@/features/marketing/data/marketing";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  description:
    "Review how Apex Global Logistics handles customer data, shipment records, documents, uploads, payments, chat, and support information.",
  title: "Privacy Notice | Apex Global Logistics",
};

const privacySections = [
  {
    title: "Information we collect",
    text: "Apex may collect names, email addresses, phone numbers, pickup and delivery addresses, shipment details, pet health records, invoices, payment references, uploaded documents, chat messages, support requests, and delivery signatures.",
  },
  {
    title: "Purposes and legal grounds",
    text: "We use information to perform requested services, create and track shipments, verify delivery details, prepare documents, support customers, administer accounts, prevent misuse, meet legal duties, and maintain audit records. Where required, processing relies on contract, consent, legal obligation, or legitimate operational interests.",
  },
  {
    title: "Documents and sensitive records",
    text: "Shipment documents, pet certificates, vaccination records, medical certificates, photos, receipts, and delivery paperwork are used only for the relevant transport, verification, support, or legal purpose. Access is limited by role and shipment relationship.",
  },
  {
    title: "Payments and refunds",
    text: "Apex may store invoices, payment status, refund eligibility, and transaction references. Full card or wallet credentials should be handled by an approved payment provider and must not be sent through ordinary chat or email.",
  },
  {
    title: "Service providers and sharing",
    text: "Information may be shared with carriers, drivers, warehouses, veterinarians, storage, email, hosting, analytics, fraud-prevention, or professional service providers only when needed for the service or required by law. We do not sell shipment or account data.",
  },
  {
    title: "AI and live chat",
    text: "Chat messages may be retained with the related support record. AI may prepare drafts or summaries, but an authorized user must review operational decisions and customer communications. AI output is not legal, medical, customs, or veterinary advice.",
  },
  {
    title: "Cookies and technical data",
    text: "The platform uses essential cookies for authentication, security, preferences, and session continuity. Server logs may record IP address, browser details, request time, security events, and error diagnostics. Optional analytics should be enabled only with any consent required by applicable law.",
  },
  {
    title: "Retention and deletion",
    text: "Records are kept only as long as reasonably needed for transportation, billing, tax, compliance, safety, audit, claims, dispute handling, and customer support. Retention periods vary by record and governing law; data is deleted or anonymized when no longer required.",
  },
  {
    title: "International processing",
    text: "Logistics and cloud services may involve processing outside the customer's state or country. Where applicable law requires it, Apex or its providers must use an approved transfer mechanism and appropriate contractual safeguards.",
  },
  {
    title: "Your choices and rights",
    text: "Depending on location, a person may request access, correction, deletion, restriction, objection, portability, or withdrawal of consent. Some records must be retained for legal, billing, safety, or dispute purposes. Requests are verified before records are disclosed or changed.",
  },
  {
    title: "Security and incident response",
    text: "Apex uses role-based access, secure cookies, validation, audit logs, encrypted transport, and restricted administrative functions. No system is risk-free; suspected privacy or security incidents should be reported promptly to support@apexgloballogistics.net.",
  },
] as const;

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <PageHero
        badge="Privacy notice"
        description="How Apex Global Logistics handles customer information, shipment records, documents, billing references, live chat, and support data."
        eyebrow="Customer data"
        image={marketingImages.services}
        primaryHref="/contact"
        primaryLabel="Privacy question"
        secondaryHref="/policy"
        secondaryLabel="Service policy"
        title="Privacy and data handling"
      />
      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="mb-8 max-w-3xl">
            <Kicker>Effective July 17, 2026</Kicker>
            <Heading className="mt-3 text-3xl">A practical notice for logistics data</Heading>
            <Text className="mt-4">
              Apex Global Logistics is responsible for the personal information it controls through
              this website and its shipment operations. Privacy questions and verified rights
              requests can be sent to support@apexgloballogistics.net.
            </Text>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {privacySections.map((section) => (
              <Card key={section.title}>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Text>{section.text}</Text>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="relative min-h-96 overflow-hidden rounded-lg">
            <Image
              alt={marketingImages.compliance.alt}
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              src={marketingImages.compliance.src}
            />
          </div>
          <div className="border-border bg-card shadow-panel mt-4 rounded-lg border p-5">
            <Kicker>Customer rights</Kicker>
            <Heading className="mt-3 text-2xl">Request a record review</Heading>
            <Text className="mt-3">
              Customers can ask support to review contact details, shipment documents, invoice
              records, delivery paperwork, or refund status connected to their shipment.
            </Text>
            <Button asChild className="mt-5" variant="accent">
              <Link href="/contact">Contact Apex</Link>
            </Button>
          </div>
        </aside>
      </section>
    </MarketingShell>
  );
}
