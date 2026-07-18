import type { Metadata } from "next";

import { MarketingShell } from "@/features/marketing/components/marketing-shell";
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
      <TrackingLookup />
    </MarketingShell>
  );
}
