import type { Metadata } from "next";

import { absoluteUrl, siteConfig } from "@/config/site";
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
  ProcessSection,
  RefundableFeesSection,
  ServiceDetailsSection,
  ServiceGrid,
  TrackingPreview,
  TrustAndSafetySection,
  TrustBar,
} from "@/features/marketing/components/marketing-sections";

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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: siteConfig.email,
      telephone: siteConfig.phone,
    },
    description:
      "Premium parcel delivery, pet transportation, freight coordination, tracking, and support for global logistics operations.",
    logo: absoluteUrl("/brand-mark.svg"),
    name: siteConfig.name,
    url: siteConfig.url,
  };

  return (
    <MarketingShell>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
      <RefundableFeesSection />
      <TrackingPreview />
      <TrustAndSafetySection />
      <ContactPanel />
      <FinalCta />
    </MarketingShell>
  );
}
