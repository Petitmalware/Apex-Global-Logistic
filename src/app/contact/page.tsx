import type { Metadata } from "next";

import { MarketingShell } from "@/features/marketing/components/marketing-shell";
import {
  ContactPanel,
  FinalCta,
  PageHero,
} from "@/features/marketing/components/marketing-sections";

export const metadata: Metadata = {
  alternates: { canonical: "/contact" },
  description:
    "Contact Apex Global Logistics for parcel delivery, pet transportation, freight planning, tracking support, and enterprise logistics programs.",
  title: "Contact | Apex Global Logistics",
};

export default function ContactPage() {
  return (
    <MarketingShell>
      <PageHero
        badge="Talk to operations"
        description="Reach the Apex team for parcel, pet, freight, tracking, support, and enterprise network planning."
        eyebrow="Contact"
        primaryHref="/contact"
        primaryLabel="Start below"
        title="Let’s design your next logistics flow"
      />
      <ContactPanel />
      <FinalCta />
    </MarketingShell>
  );
}
