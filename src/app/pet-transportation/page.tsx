import type { Metadata } from "next";

import { MarketingShell } from "@/features/marketing/components/marketing-shell";
import {
  FeatureBand,
  FinalCta,
  PageHero,
  ProcessSection,
} from "@/features/marketing/components/marketing-sections";
import { petFeatures } from "@/features/marketing/data/marketing";

export const metadata: Metadata = {
  alternates: { canonical: "/pet-transportation" },
  description:
    "Specialized pet transportation with comfort-focused handling, crate requirements, wellness checks, microchip details, and travel document visibility.",
  title: "Pet Transportation | Apex Global Logistics",
};

export default function PetTransportationPage() {
  return (
    <MarketingShell>
      <PageHero
        badge="Pet-safe movement"
        description="Apex treats pet transportation as a specialized service with structured profiles, crate planning, wellness status, and documentation visibility."
        eyebrow="Pet Transportation"
        primaryHref="/contact"
        primaryLabel="Plan pet transport"
        title="Comfort-first logistics for pets and their people"
      />
      <FeatureBand features={petFeatures} title="Pet transportation features" />
      <ProcessSection />
      <FinalCta />
    </MarketingShell>
  );
}
