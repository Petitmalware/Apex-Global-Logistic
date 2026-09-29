import type { Metadata } from "next";

import { MarketingShell } from "@/features/marketing/components/marketing-shell";
import {
  AiPoweredSection,
  ContactPanel,
  DeliveryProofSection,
  DocumentsAndBillingSection,
  FinalCta,
  HomeHero,
  PetServicesShowcase,
  PetTransportPartnerSection,
  ProcessSection,
  ServiceGrid,
  TrustBar,
} from "@/features/marketing/components/marketing-sections";
import { createLogisticsServicesJsonLd, structuredDataToJson } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  description:
    "Apex Global Logistics provides AI-powered premium parcel delivery, pet transportation, freight coordination, tracking, and support for global logistics operations.",
  openGraph: {
    description:
      "AI-powered premium parcel delivery, pet transportation, freight coordination, tracking, and support for global logistics operations.",
    images: ["/images/global-logistics-hero.png"],
    title: "Apex Global Logistics",
  },
  title: "Apex Global Logistics | AI-Powered Parcel, Pet & Freight Logistics",
};

export default function HomePage() {
  const jsonLd = createLogisticsServicesJsonLd();

  return (
    <MarketingShell>
      <script
        dangerouslySetInnerHTML={{ __html: structuredDataToJson(jsonLd) }}
        type="application/ld+json"
      />
      <HomeHero />
      <TrustBar />
      <ServiceGrid />
      <AiPoweredSection />
      <PetTransportPartnerSection />
      <PetServicesShowcase />
      <ProcessSection />
      <DeliveryProofSection />
      <DocumentsAndBillingSection />
      <ContactPanel />
      <FinalCta />
    </MarketingShell>
  );
}
