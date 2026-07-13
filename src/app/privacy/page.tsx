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
    title: "How we use information",
    text: "We use customer information to create shipments, verify delivery details, prepare documents, provide tracking updates, send service notices, support customers, process invoices, and maintain audit records.",
  },
  {
    title: "Documents and uploads",
    text: "Shipment documents, pet certificates, vaccination records, photos, receipts, and delivery paperwork are stored so the shipment can be verified and supported. Access is limited by user role and shipment relationship.",
  },
  {
    title: "Payments and refunds",
    text: "Apex may store billing records, invoice status, refund eligibility, and payment references. Sensitive payment credentials should be handled only by approved payment providers and should not be sent through ordinary chat or email.",
  },
  {
    title: "AI and live chat",
    text: "Chat messages and AI-assisted drafts may be used to help admins respond professionally. AI suggestions require human review before sending and should not be treated as legal, medical, or customs advice.",
  },
  {
    title: "Retention and security",
    text: "Operational records are retained as needed for shipment support, billing, compliance, audit logs, dispute handling, and customer service. Apex uses access controls, secure cookies, validation, audit logs, and role-based permissions.",
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
