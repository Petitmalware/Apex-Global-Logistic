import type { Metadata } from "next";

import { MarketingShell } from "@/features/marketing/components/marketing-shell";
import {
  FinalCta,
  PageHero,
  TrackingPreview,
} from "@/features/marketing/components/marketing-sections";
import { TrackingLookup } from "@/features/marketing/components/tracking-lookup";

export const metadata: Metadata = {
  alternates: { canonical: "/tracking" },
  description:
    "Track Apex Global Logistics shipments with clean milestone visibility for parcels, pet transportation, and freight.",
  title: "Tracking | Apex Global Logistics",
};

export default function TrackingPage() {
  return (
    <MarketingShell>
      <PageHero
        badge="Shipment visibility"
        description="Use tracking references to check milestones, delivery windows, exceptions, warehouse handoffs, and proof-of-delivery readiness."
        eyebrow="Tracking"
        primaryHref="/tracking"
        primaryLabel="Track below"
        secondaryHref="/contact"
        secondaryLabel="Need help?"
        title="Track every shipment with confidence"
      />
      <TrackingLookup />
      <TrackingPreview />
      <FinalCta />
    </MarketingShell>
  );
}
