import type { Metadata } from "next";

import { MarketingShell } from "@/features/marketing/components/marketing-shell";
import { FinalCta, PageHero, TrustBar } from "@/features/marketing/components/marketing-sections";
import { AboutStory } from "@/features/marketing/components/about-story";

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  description:
    "Learn about Apex Global Logistics, a premium logistics platform for parcel delivery, pet transportation, freight, tracking, and support.",
  title: "About | Apex Global Logistics",
};

export default function AboutPage() {
  return (
    <MarketingShell>
      <PageHero
        badge="Built for modern movement"
        description="Apex Global Logistics combines operational discipline, thoughtful customer experience, and secure platform architecture for high-confidence shipping."
        eyebrow="About Apex"
        primaryHref="/contact"
        primaryLabel="Meet the team"
        title="A logistics partner designed for clarity"
      />
      <TrustBar />
      <AboutStory />
      <FinalCta />
    </MarketingShell>
  );
}
