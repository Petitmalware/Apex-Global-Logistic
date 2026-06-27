import { clientEnv } from "@/config/env.client";

export const siteConfig = {
  description:
    "Premium parcel delivery, pet transportation, freight coordination, tracking, and logistics operations software from Apex Global Logistics.",
  email: "hello@apexgloballogistics.com",
  keywords: [
    "Apex Global Logistics",
    "parcel delivery",
    "pet transportation",
    "freight logistics",
    "shipment tracking",
    "warehouse logistics",
    "logistics platform",
  ],
  locale: "en_US",
  name: "Apex Global Logistics",
  ogImage: "/images/global-logistics-hero.png",
  phone: "+1 (555) 014-8848",
  shortName: "Apex Logistics",
  twitterHandle: "@apexlogistics",
  url: clientEnv.NEXT_PUBLIC_APP_URL,
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}
