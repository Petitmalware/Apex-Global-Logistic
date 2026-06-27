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
  "/login",
  "/register",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-06-25");

  return publicRoutes.map((route) => ({
    changeFrequency: route === "" ? "weekly" : "monthly",
    lastModified,
    priority: route === "" ? 1 : 0.8,
    url: absoluteUrl(route || "/"),
  }));
}
