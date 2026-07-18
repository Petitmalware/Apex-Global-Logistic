import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { siteConfig } from "@/config/site";
import { ChatWidget } from "@/features/chat/components/chat-widget";
import { createOrganizationJsonLd, createWebsiteJsonLd, structuredDataToJson } from "@/lib/seo";

import "./globals.css";

const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  ...(googleSiteVerification
    ? {
        verification: {
          google: googleSiteVerification,
        },
      }
    : {}),
  title: {
    default: siteConfig.name,
    template: "%s | Apex Global Logistics",
  },
  applicationName: siteConfig.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteConfig.shortName,
  },
  category: "Logistics",
  creator: siteConfig.name,
  description: siteConfig.description,
  formatDetection: {
    telephone: false,
  },
  keywords: siteConfig.keywords,
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    description: siteConfig.description,
    images: [
      {
        alt: "Apex Global Logistics warehouse, aircraft, delivery vehicle, and route network",
        height: 1024,
        url: siteConfig.ogImage,
        width: 1792,
      },
    ],
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: siteConfig.name,
    type: "website",
    url: siteConfig.url,
  },
  publisher: siteConfig.name,
  robots: {
    follow: true,
    googleBot: {
      follow: true,
      index: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    index: true,
  },
  twitter: {
    card: "summary_large_image",
    creator: siteConfig.twitterHandle,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    title: siteConfig.name,
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  initialScale: 1,
  themeColor: [
    { color: "#fcfbf7", media: "(prefers-color-scheme: light)" },
    { color: "#111827", media: "(prefers-color-scheme: dark)" },
  ],
  width: "device-width",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  const jsonLd = [createOrganizationJsonLd(), createWebsiteJsonLd()];

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {jsonLd.map((data, index) => (
          <script
            dangerouslySetInnerHTML={{ __html: structuredDataToJson(data) }}
            key={index}
            type="application/ld+json"
          />
        ))}
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
