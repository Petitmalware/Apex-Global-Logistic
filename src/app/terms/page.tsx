import Link from "next/link";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading, Kicker, Text } from "@/components/ui/typography";
import { MarketingShell } from "@/features/marketing/components/marketing-shell";
import { PageHero } from "@/features/marketing/components/marketing-sections";
import { marketingImages } from "@/features/marketing/data/marketing";

export const metadata: Metadata = {
  alternates: { canonical: "/terms" },
  description:
    "Read the Apex Global Logistics terms governing accounts, shipment information, transportation coordination, billing, tracking, delivery, and disputes.",
  title: "Terms of Service | Apex Global Logistics",
};

const termsSections = [
  {
    title: "Using the platform",
    text: "Customers must provide accurate account, sender, recipient, shipment, pet, freight, and delivery information. Account credentials and secure chat links must not be shared with unauthorized people.",
  },
  {
    title: "Transportation services",
    text: "Service availability, route, carrier, timing, and handling depend on the shipment type, destination, capacity, weather, inspections, customs requirements, animal welfare requirements, and applicable law. An estimate is not a guaranteed delivery time unless a written service agreement says otherwise.",
  },
  {
    title: "Restricted and regulated items",
    text: "The sender is responsible for declaring shipment contents and supplying permits, health records, ownership records, customs information, or other documents required by law. Apex may refuse, pause, or cancel transportation that cannot be handled lawfully or safely.",
  },
  {
    title: "Prices, invoices, and payment",
    text: "A valid payment request must identify the customer or recipient, the related shipment or service, line items, currency, total, payment status, and any applicable refund terms. Customers should verify unexpected changes with the published support address before paying.",
  },
  {
    title: "Refundable deposits",
    text: "A deposit is refundable only under the written conditions shown on the applicable invoice or service document. Any permitted deduction should be supported by a receipt, inspection record, signed delivery record, or other documented cost.",
  },
  {
    title: "Tracking and notices",
    text: "Tracking events describe the latest information recorded by Apex operations, a driver, warehouse, or integrated provider. Customers should contact support when a status, location, or instruction appears inconsistent with their shipment documents.",
  },
  {
    title: "Delivery and claims",
    text: "Delivery may require identification, a signature, photographs, release paperwork, or return of reusable equipment. Damage, shortage, billing, or delivery disputes should be reported promptly with the shipment number and supporting records.",
  },
  {
    title: "Liability and applicable terms",
    text: "Carrier tariffs, mandatory consumer rights, insurance terms, customs rules, and local law may also apply. Nothing on this website replaces a required carrier contract, insurance certificate, government permit, or professional legal advice.",
  },
] as const;

export default function TermsPage() {
  return (
    <MarketingShell>
      <PageHero
        badge="Legal terms"
        description="The rules that govern customer accounts, shipment information, transportation coordination, billing records, delivery, and support."
        eyebrow="Terms of service"
        image={marketingImages.compliance}
        primaryHref="/contact"
        primaryLabel="Ask a question"
        secondaryHref="/policy"
        secondaryLabel="Service policy"
        title="Clear terms for every shipment"
      />
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="max-w-3xl">
          <Kicker>Effective July 17, 2026</Kicker>
          <Heading className="mt-3">Terms written for accountable logistics</Heading>
          <Text className="mt-4">
            These terms apply to use of the Apex Global Logistics website, customer accounts,
            tracking tools, documents, invoices, support, and transportation coordination. A
            shipment-specific agreement or mandatory law controls if it conflicts with these general
            website terms.
          </Text>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {termsSections.map((section) => (
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
      </section>
      <section className="bg-primary text-primary-foreground px-4 py-16 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Kicker className="text-primary-foreground/65">Related documents</Kicker>
            <Heading className="text-primary-foreground mt-3">
              Review the policy and privacy notice before booking
            </Heading>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="accent">
              <Link href="/policy">Service policy</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/privacy">Privacy notice</Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
