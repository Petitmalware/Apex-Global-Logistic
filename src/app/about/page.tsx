import type { Metadata } from "next";

import { MarketingShell } from "@/features/marketing/components/marketing-shell";
import { FinalCta, PageHero, TrustBar } from "@/features/marketing/components/marketing-sections";
import { AboutStory } from "@/features/marketing/components/about-story";
import { CompanyBusinessIdentity } from "@/features/settings/components/company-contact-details";
import { getCompanyProfile } from "@/features/settings/queries/company-profile.queries";
import { createOrganizationJsonLd, structuredDataToJson } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  description:
    "Learn about Apex Global Logistics, a premium logistics platform for parcel delivery, pet transportation, freight, tracking, and support.",
  title: "About | Apex Global Logistics",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const profile = await getCompanyProfile();
  const organizationJsonLd = createOrganizationJsonLd(profile);

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: structuredDataToJson(organizationJsonLd) }}
        type="application/ld+json"
      />
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
        <CompanyBusinessIdentity profile={profile} />
        <AboutStory />
        <FinalCta />
      </MarketingShell>
    </>
  );
}
