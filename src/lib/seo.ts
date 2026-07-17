import { absoluteUrl, siteConfig } from "@/config/site";
import { faqs, serviceCards } from "@/features/marketing/data/marketing";
import type { CompanyProfileInput } from "@/features/settings/schemas/company-profile.schema";

type JsonLd = Record<string, unknown>;

export function structuredDataToJson(data: JsonLd | JsonLd[]) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function createOrganizationJsonLd(profile: CompanyProfileInput = {}): JsonLd {
  const addressParts = [
    profile.addressLine1,
    profile.addressLine2,
    profile.city,
    profile.state,
    profile.postalCode,
    profile.country,
  ];
  const contactPoint: JsonLd = {
    "@type": "ContactPoint",
    areaServed: "Worldwide",
    availableLanguage: ["English"],
    contactType: "customer support",
    email: profile.email ?? siteConfig.email,
  };

  if (profile.phone ?? siteConfig.phone) {
    contactPoint.telephone = profile.phone ?? siteConfig.phone;
  }

  return {
    "@context": "https://schema.org",
    "@id": absoluteUrl("/#organization"),
    "@type": "Organization",
    ...(addressParts.some(Boolean)
      ? {
          address: {
            "@type": "PostalAddress",
            addressCountry: profile.country,
            addressLocality: profile.city,
            addressRegion: profile.state,
            postOfficeBoxNumber: profile.addressLine2,
            postalCode: profile.postalCode,
            streetAddress: profile.addressLine1,
          },
        }
      : {}),
    contactPoint,
    description: siteConfig.description,
    email: profile.email ?? siteConfig.email,
    ...(profile.registrationNumber
      ? {
          identifier: {
            "@type": "PropertyValue",
            name: profile.registrationAuthority ?? "Business registration number",
            propertyID: profile.registrationJurisdiction,
            value: profile.registrationNumber,
          },
        }
      : {}),
    ...(profile.legalName ? { legalName: profile.legalName } : {}),
    logo: absoluteUrl("/brand-mark.svg"),
    name: siteConfig.name,
    ...(profile.businessRegistryUrl ? { sameAs: [profile.businessRegistryUrl] } : {}),
    ...(profile.taxId ? { taxID: profile.taxId } : {}),
    url: siteConfig.url,
  };
}

export function createWebsiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    description: siteConfig.description,
    name: siteConfig.name,
    potentialAction: {
      "@type": "SearchAction",
      "query-input": "required name=trackingNumber",
      target: `${absoluteUrl("/tracking")}?trackingNumber={trackingNumber}`,
    },
    publisher: {
      "@id": absoluteUrl("/#organization"),
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    url: siteConfig.url,
  };
}

export function createLogisticsServicesJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: serviceCards.map((service, index) => ({
      "@type": "ListItem",
      item: {
        "@type": "Service",
        areaServed: "Worldwide",
        description: service.description,
        name: service.title,
        provider: {
          "@type": "Organization",
          name: siteConfig.name,
          url: siteConfig.url,
        },
        serviceType: service.title,
        url: absoluteUrl(service.href),
      },
      position: index + 1,
    })),
    name: "Apex Global Logistics services",
  };
}

export function createFaqJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
      name: faq.question,
    })),
  };
}
