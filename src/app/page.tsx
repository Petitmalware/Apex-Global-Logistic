import type { Metadata } from "next";

import { MarketingShell } from "@/features/marketing/components/marketing-shell";
import {
  ContactPanel,
  ClientAssuranceSection,
  CustomerJourneySection,
  DeliveryProofSection,
  DocumentsAndBillingSection,
  FinalCta,
  GettingStartedGuideSection,
  HomeHero,
  PaymentConfidenceSection,
  ProcessSection,
  ServiceDetailsSection,
  ServiceGrid,
  TrustAndSafetySection,
  TrustBar,
} from "@/features/marketing/components/marketing-sections";
import { createLogisticsServicesJsonLd, structuredDataToJson } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  description:
    "Apex Global Logistics provides premium parcel delivery, pet transportation, freight coordination, tracking, and support for global logistics operations.",
  openGraph: {
    description:
      "Premium parcel delivery, pet transportation, freight coordination, tracking, and support for global logistics operations.",
    images: ["/images/global-logistics-hero.png"],
    title: "Apex Global Logistics",
  },
  title: "Apex Global Logistics | Premium Parcel, Pet, and Freight Logistics",
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
      <ClientAssuranceSection />
      <GettingStartedGuideSection />
      <DeliveryProofSection />
      <ServiceGrid />
      <ServiceDetailsSection />
      <CustomerJourneySection />
      <ProcessSection />
      <DocumentsAndBillingSection />
      <PaymentConfidenceSection />
      <TrustAndSafetySection />
      <ContactPanel />
      <FinalCta />
    </MarketingShell>
  );
}
