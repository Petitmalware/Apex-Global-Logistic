import type { Metadata } from "next";

import { MarketingShell } from "@/features/marketing/components/marketing-shell";
import {
  FinalCta,
  PageHero,
  ProcessSection,
  ServiceGrid,
  TrackingPreview,
} from "@/features/marketing/components/marketing-sections";
import { marketingImages } from "@/features/marketing/data/marketing";

export const metadata: Metadata = {
  alternates: { canonical: "/services" },
  description:
    "Explore Apex Global Logistics services for parcel delivery, pet transportation, freight movement, tracking, support, and enterprise logistics.",
  title: "Services | Apex Global Logistics",
};

export default function ServicesPage() {
  return (
    <MarketingShell>
      <PageHero
        badge="Parcel, pets, freight, and tracking"
        description="Apex coordinates the full movement lifecycle across service types, from customer booking through warehouse handoff, tracking, support, and billing."
        eyebrow="Services"
        image={marketingImages.services}
        primaryHref="/contact"
        primaryLabel="Plan a shipment"
        title="A connected service portfolio for premium logistics"
      />
      <ServiceGrid />
      <ProcessSection />
      <TrackingPreview />
      <FinalCta />
    </MarketingShell>
  );
}
