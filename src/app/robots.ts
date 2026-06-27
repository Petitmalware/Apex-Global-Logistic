import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      allow: "/",
      disallow: ["/admin", "/agent", "/api", "/customer", "/dashboard", "/super-admin", "/support"],
      userAgent: "*",
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
