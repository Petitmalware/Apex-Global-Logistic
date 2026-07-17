import { clientEnv } from "@/config/env.client";

export const siteConfig = {
  description:
    "Apex Global Logistics provides premium parcel delivery, pet transportation, freight coordination, shipment tracking, official documentation, and customer support.",
  domain: "apexgloballogistics.net",
  email: "info@apexgloballogistics.net",
  emails: {
    general: "info@apexgloballogistics.net",
    operations: "agent@apexgloballogistics.net",
    support: "support@apexgloballogistics.net",
  },
  keywords: [
    "Apex Global Logistics",
    "Apex Global Logistics tracking",
    "parcel delivery",
    "package tracking",
    "pet transportation",
    "pet shipping",
    "freight logistics",
    "freight transportation",
    "shipment tracking",
    "delivery documents",
    "refundable logistics deposit",
    "warehouse logistics",
    "logistics platform",
  ],
  locale: "en_US",
  name: "Apex Global Logistics",
  ogImage: "/images/global-logistics-hero.png",
  phone: "",
  shortName: "Apex Logistics",
  twitterHandle: undefined,
  url: clientEnv.NEXT_PUBLIC_APP_URL,
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}
