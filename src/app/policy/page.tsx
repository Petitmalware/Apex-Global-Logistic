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
  alternates: { canonical: "/policy" },
  description:
    "Review Apex Global Logistics service, billing, refundable deposit, delivery, and documentation policies.",
  title: "Service and Refund Policy | Apex Global Logistics",
};

const policySections = [
  {
    title: "Service scope",
    text: "Apex Global Logistics coordinates parcel delivery, pet transportation, freight movement, tracking, documentation, and customer support. Final service availability depends on origin, destination, item type, carrier capacity, local rules, and required documents.",
  },
  {
    title: "Refundable deposits",
    text: "Some shipments may require refundable deposits for travel crates, temporary holding, veterinary clearance, insurance coverage, customs or compliance handling, climate monitoring, or special equipment. Each refundable fee must be listed on an invoice or official service document before payment.",
  },
  {
    title: "Additional charges",
    text: "If shipment conditions change, Apex may issue a revised invoice for customer approval. Examples include route delays, missing documents, upgraded crate requirements, extended holding, or compliance checks. Apex should not collect undocumented charges.",
  },
  {
    title: "Refund release",
    text: "Eligible refundable balances are released after successful delivery, recipient signature, delivery paperwork completion, and any required equipment inspection. Refunds are returned to the payer's account or agreed payment method, less documented deductions supported by receipts or signed records.",
  },
  {
    title: "Customer responsibility",
    text: "Customers are responsible for accurate names, addresses, phone numbers, shipment descriptions, health records, customs information, payment references, and delivery availability. Incorrect information can delay delivery or require revised documents.",
  },
  {
    title: "Delivery confirmation",
    text: "Proof of delivery may include signed receipts, release forms, photo records, tracking milestones, driver notes, or other authorized documents. Delivery is considered complete when the agreed recipient or authorized representative signs the required paperwork.",
  },
] as const;

export default function PolicyPage() {
  return (
    <MarketingShell>
      <PageHero
        badge="Company policy"
        description="Clear operating rules for service coverage, billing, refundable deposits, shipment documentation, and delivery confirmation."
        eyebrow="Service policy"
        image={marketingImages.compliance}
        primaryHref="/contact"
        primaryLabel="Ask support"
        secondaryHref="/privacy"
        secondaryLabel="Privacy notice"
        title="Service and refund policy"
      />
      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <Kicker>Refundable fee process</Kicker>
          <Heading className="mt-3">No undocumented charge should be paid</Heading>
          <Text className="mt-4">
            Apex policy is that refundable deposits must be tied to a shipment record, customer
            name, invoice number, reason for collection, refund rule, and delivery paperwork. If a
            fee changes because service conditions change, the customer should receive an updated
            document before payment.
          </Text>
          <div className="relative mt-8 min-h-80 overflow-hidden rounded-lg">
            <Image
              alt={marketingImages.containers.alt}
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              src={marketingImages.containers.src}
            />
          </div>
        </div>
        <div className="grid gap-4">
          {policySections.map((section) => (
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
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <Kicker className="text-primary-foreground/65">Need a document?</Kicker>
            <Heading className="text-primary-foreground mt-3">
              Request an official invoice or shipment policy record
            </Heading>
            <p className="text-primary-foreground/72 mt-3 max-w-2xl text-sm leading-6">
              Customers should keep invoices, receipts, tracking references, and signed delivery
              paperwork until any refundable balance is released.
            </p>
          </div>
          <Button asChild variant="accent">
            <Link href="/contact">Contact support</Link>
          </Button>
        </div>
      </section>
    </MarketingShell>
  );
}
