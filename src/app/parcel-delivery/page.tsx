import type { Metadata } from "next";

import { MarketingShell } from "@/features/marketing/components/marketing-shell";
import {
  FeatureBand,
  FinalCta,
  PageHero,
} from "@/features/marketing/components/marketing-sections";
import { marketingImages, parcelFeatures } from "@/features/marketing/data/marketing";

export const metadata: Metadata = {
  alternates: { canonical: "/parcel-delivery" },
  description:
    "Premium parcel delivery for same-day, next-day, scheduled, fragile, and priority shipments with tracking and proof-of-delivery support.",
  title: "Parcel Delivery | Apex Global Logistics",
};

export default function ParcelDeliveryPage() {
  return (
    <MarketingShell>
      <PageHero
        badge="Fast parcel delivery"
        description="Ship parcels with structured service levels, route visibility, delivery windows, exception alerts, and customer-ready status updates."
        eyebrow="Parcel Delivery"
        image={marketingImages.parcel}
        primaryHref="/register"
        primaryLabel="Create account"
        title="Parcel delivery built for speed and accountability"
      />
      <FeatureBand features={parcelFeatures} title="Parcel delivery features" />
      <FinalCta />
    </MarketingShell>
  );
}
