import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    host: absoluteUrl("/"),
    rules: {
      allow: [
        "/",
        "/about",
        "/contact",
        "/faq",
        "/freight",
        "/parcel-delivery",
        "/pet-transportation",
        "/policy",
        "/pricing",
        "/privacy",
        "/services",
        "/support",
        "/terms",
        "/tracking",
      ],
      disallow: [
        "/admin",
        "/agent",
        "/ai",
        "/analytics",
        "/api",
        "/customer",
        "/dashboard",
        "/freight-transport",
        "/invoices",
        "/notifications",
        "/pet-transport",
        "/settings",
        "/shipments",
        "/super-admin",
      ],
      userAgent: "*",
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
