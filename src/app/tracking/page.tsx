import type { Metadata } from "next";
import { MarketingShell } from "@/features/marketing/components/marketing-shell";
import { UnifiedTrackingDashboard } from "@/features/marketing/components/unified-tracking-dashboard";

export const metadata: Metadata = {
  alternates: { canonical: "/tracking" },
  description:
    "Track any Apex Global Logistics shipment in real-time — parcels, pet transport, air freight, ocean cargo, and ground delivery with live GPS route visibility.",
  title: "Live Tracking | Apex Global Logistics",
};

export default function TrackingPage() {
  return (
    <MarketingShell>
      <UnifiedTrackingDashboard />
    </MarketingShell>
  );
}
