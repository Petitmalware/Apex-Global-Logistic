import { absoluteUrl, siteConfig } from "@/config/site";
import { faqs, serviceCards } from "@/features/marketing/data/marketing";

type JsonLd = Record<string, unknown>;

export function structuredDataToJson(data: JsonLd | JsonLd[]) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function createOrganizationJsonLd(): JsonLd {
  const contactPoint: JsonLd = {
    "@type": "ContactPoint",
    areaServed: "Worldwide",
    availableLanguage: ["English"],
    contactType: "customer support",
    email: siteConfig.email,
  };

  if (siteConfig.phone) {
    contactPoint.telephone = siteConfig.phone;
  }

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    contactPoint,
    description: siteConfig.description,
    email: siteConfig.email,
    logo: absoluteUrl("/brand-mark.svg"),
    name: siteConfig.name,
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
