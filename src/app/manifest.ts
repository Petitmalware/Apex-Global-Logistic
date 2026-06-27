import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#fcfbf7",
    description: siteConfig.description,
    display: "standalone",
    icons: [
      {
        purpose: "any",
        sizes: "64x64",
        src: "/icon.svg",
        type: "image/svg+xml",
      },
      {
        purpose: "maskable",
        sizes: "64x64",
        src: "/brand-mark.svg",
        type: "image/svg+xml",
      },
    ],
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    start_url: "/",
    theme_color: "#111827",
  };
}
