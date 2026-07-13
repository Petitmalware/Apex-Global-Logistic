import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/config/site";

const publicRoutes = [
  "",
  "/services",
  "/parcel-delivery",
  "/pet-transportation",
  "/freight",
  "/tracking",
  "/pricing",
  "/about",
  "/faq",
  "/contact",
  "/policy",
  "/privacy",
  "/login",
  "/register",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    changeFrequency: route === "" || route === "/tracking" ? "weekly" : "monthly",
    lastModified,
    priority: route === "" ? 1 : route === "/tracking" ? 0.9 : 0.8,
    url: absoluteUrl(route || "/"),
  }));
}
