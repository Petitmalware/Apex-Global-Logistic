import type { Metadata } from "next";

import { MarketingShell } from "@/features/marketing/components/marketing-shell";
import { FaqList, FinalCta, PageHero } from "@/features/marketing/components/marketing-sections";

export const metadata: Metadata = {
  alternates: { canonical: "/faq" },
  description:
    "Frequently asked questions about Apex Global Logistics parcel delivery, pet transportation, freight, tracking, pricing, and security.",
  title: "FAQ | Apex Global Logistics",
};

export default function FaqPage() {
  return (
    <MarketingShell>
      <PageHero
        badge="Answers at a glance"
        description="Find quick answers about services, tracking, pricing, pet transport, freight support, and platform security."
        eyebrow="FAQ"
        primaryHref="/contact"
        primaryLabel="Ask a question"
        title="Logistics questions, answered clearly"
      />
      <FaqList />
      <FinalCta />
    </MarketingShell>
  );
}
