import type { Metadata } from "next";

import { MarketingShell } from "@/features/marketing/components/marketing-shell";
import {
  FaqList,
  FinalCta,
  PageHero,
  PricingCards,
} from "@/features/marketing/components/marketing-sections";

export const metadata: Metadata = {
  alternates: { canonical: "/pricing" },
  description:
    "Review Apex Global Logistics pricing options for parcel delivery, pet transportation, freight coordination, and enterprise logistics programs.",
  title: "Pricing | Apex Global Logistics",
};

export default function PricingPage() {
  return (
    <MarketingShell>
      <PageHero
        badge="Transparent starting points"
        description="Choose the right logistics coverage for parcel delivery, pet transportation, freight programs, or enterprise command operations."
        eyebrow="Pricing"
        primaryHref="/contact"
        primaryLabel="Request quote"
        title="Pricing that scales with your logistics network"
      />
      <PricingCards />
      <FaqList />
      <FinalCta />
    </MarketingShell>
  );
}
