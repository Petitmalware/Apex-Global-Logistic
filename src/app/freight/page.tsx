import type { Metadata } from "next";

import { MarketingShell } from "@/features/marketing/components/marketing-shell";
import {
  FeatureBand,
  FinalCta,
  PageHero,
  ProcessSection,
  TrackingPreview,
} from "@/features/marketing/components/marketing-sections";
import { freightFeatures } from "@/features/marketing/data/marketing";

export const metadata: Metadata = {
  alternates: { canonical: "/freight" },
  description:
    "Freight coordination for road, air, sea, rail, multimodal, containerized, refrigerated, oversized, and high-value shipments.",
  title: "Freight | Apex Global Logistics",
};

export default function FreightPage() {
  return (
    <MarketingShell>
      <PageHero
        badge="Freight command"
        description="Coordinate freight across road, air, sea, rail, and multimodal networks with warehouse handoffs, document control, and exception visibility."
        eyebrow="Freight"
        primaryHref="/contact"
        primaryLabel="Request freight plan"
        title="Freight movement for high-value supply chains"
      />
      <FeatureBand features={freightFeatures} title="Freight features" />
      <ProcessSection />
      <TrackingPreview />
      <FinalCta />
    </MarketingShell>
  );
}
