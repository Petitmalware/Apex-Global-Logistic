﻿﻿import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Check, Globe, Handshake, Mail, MessageCircle, Package, PackageSearch, PawPrint, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Display, Heading, Kicker, Text } from "@/components/ui/typography";
import { siteConfig } from "@/config/site";
import {
  capabilityHighlights,
  accountabilityCards,
  clientAssuranceCards,
  clientPreparationLists,
  documentTrustItems,
  faqs,
  gettingStartedOptions,
  pricingPlans,
  processSteps,
  deliveryProofCards,
  customerJourneySteps,
  serviceCards,
  serviceDetailCards,
  trustSignals,
  trustPillars,
  marketingImages,
  paymentConfidenceItems,
} from "@/features/marketing/data/marketing";
import { cn } from "@/lib/utils";

type IconFeature = {
  icon: LucideIcon;
  text?: string;
  title: string;
};

type PageHeroProps = {
  badge?: string;
  description: string;
  eyebrow: string;
  image?: {
    alt: string;
    src: string;
  };
  primaryHref?: Route | string;
  primaryLabel?: string;
  secondaryHref?: Route | string;
  secondaryLabel?: string;
  title: string;
};

export function SectionIntro({
  align = "left",
  description,
  eyebrow,
  title,
}: {
  align?: "center" | "left";
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      <Kicker>{eyebrow}</Kicker>
      <Heading className="mt-3">{title}</Heading>
      <Text className="mt-3">{description}</Text>
    </div>
  );
}

export function HomeHero() {
  return (
    <section className="relative isolate min-h-[calc(100svh-73px)] overflow-hidden">
      {/* Background image */}
      <Image
        alt="A global logistics hub with delivery van, cargo aircraft, shipping vessel, parcels, and digital route overlays"
        className="absolute inset-0 -z-20 size-full object-cover"
        fill
        priority
        sizes="100vw"
        src={marketingImages.hero.src}
      />
      {/* Aurora/gradient overlays */}
      <div className="from-background via-background/80 to-background/10 absolute inset-0 -z-10 bg-linear-to-r" />
      <div className="from-background absolute inset-x-0 bottom-0 -z-10 h-40 bg-linear-to-t to-transparent" />

      {/* Animated orbs */}
      <div
        aria-hidden="true"
        className="animate-aurora absolute -top-40 -right-40 -z-10 h-[600px] w-[600px] rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(circle at center, oklch(0.84 0.16 83.68), oklch(0.56 0.17 250), transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="animate-float-slow absolute -right-20 bottom-0 -z-10 h-[400px] w-[400px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle at center, oklch(0.68 0.14 241.2), transparent 70%)",
        }}
      />

      <div className="mx-auto flex min-h-[calc(100svh-73px)] w-full max-w-7xl items-center px-4 py-16 sm:px-6">
        <div className="animate-fade-up grid w-full gap-12 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          {/* Left: text content */}
          <div className="max-w-3xl">
            {/* AI badge */}
            <div className="border-accent/40 bg-accent/10 inline-flex items-center gap-2 rounded-full border px-3 py-1 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="bg-accent absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                <span className="bg-accent relative inline-flex h-2 w-2 rounded-full" />
              </span>
              <span className="text-accent text-xs font-semibold tracking-wide uppercase">
                AI-Powered Logistics
              </span>
            </div>

            <Display className="mt-6 text-5xl sm:text-6xl lg:text-7xl">
              Apex Global Logistics
            </Display>
            <p className="text-muted-foreground mt-6 max-w-2xl text-base leading-8 sm:text-lg">
              Parcel delivery, pet transportation, freight coordination, and transparent shipment
              records — powered by intelligent routing and real-time visibility from first mile to
              final delivery.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="xl" variant="accent" className="animate-glow-pulse">
                <Link href={"/register" as Route}>
                  Open account
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="backdrop-blur-sm">
                <Link href={"/tracking" as Route}>Track shipment</Link>
              </Button>
            </div>

            {/* Stats grid */}
            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {capabilityHighlights.map((item, i) => (
                <div
                  className={`border-border/60 rounded-xl border p-3 shadow-sm backdrop-blur-sm transition-transform hover:-translate-y-1 animate-stagger-${Math.min(i + 1, 4) as 1 | 2 | 3 | 4}`}
                  key={item.label}
                  style={{
                    background: "linear-gradient(135deg, oklch(1 0 0 / 12%), oklch(1 0 0 / 5%))",
                  }}
                >
                  <item.icon aria-hidden="true" className="text-accent size-4" />
                  <p className="mt-2 text-lg font-semibold">{item.value}</p>
                  <p className="text-muted-foreground text-xs">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: 3D Globe / AI illustration */}
          <div
            className="relative hidden lg:flex lg:items-center lg:justify-center"
            aria-hidden="true"
          >
            {/* Outer ring */}
            <div className="animate-spin-slow relative h-72 w-72">
              <svg viewBox="0 0 288 288" className="h-full w-full" fill="none">
                <circle
                  cx="144"
                  cy="144"
                  r="136"
                  stroke="oklch(0.84 0.16 83.68 / 25%)"
                  strokeWidth="1.5"
                  strokeDasharray="8 6"
                />
                {/* Orbit dots */}
                {[0, 60, 120, 180, 240, 300].map((angle) => {
                  const rad = (angle * Math.PI) / 180;
                  const x = 144 + 136 * Math.cos(rad);
                  const y = 144 + 136 * Math.sin(rad);
                  return (
                    <circle key={angle} cx={x} cy={y} r="3.5" fill="oklch(0.84 0.16 83.68 / 70%)" />
                  );
                })}
              </svg>
            </div>

            {/* Middle ring (counter-spin) */}
            <div className="animate-counter-spin absolute h-52 w-52">
              <svg viewBox="0 0 208 208" className="h-full w-full" fill="none">
                <circle
                  cx="104"
                  cy="104"
                  r="98"
                  stroke="oklch(0.68 0.14 241.2 / 30%)"
                  strokeWidth="1.5"
                  strokeDasharray="4 8"
                />
                {[45, 135, 225, 315].map((angle) => {
                  const rad = (angle * Math.PI) / 180;
                  const x = 104 + 98 * Math.cos(rad);
                  const y = 104 + 98 * Math.sin(rad);
                  return (
                    <circle key={angle} cx={x} cy={y} r="4" fill="oklch(0.68 0.14 241.2 / 80%)" />
                  );
                })}
              </svg>
            </div>

            {/* Center globe */}
            <div
              className="animate-float shadow-glow animate-glow-pulse absolute flex h-32 w-32 items-center justify-center rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.84 0.16 83.68 / 90%), oklch(0.56 0.17 250 / 80%))",
              }}
            >
              <svg
                viewBox="0 0 64 64"
                className="h-16 w-16 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                {/* Globe */}
                <circle cx="32" cy="32" r="26" strokeOpacity="0.8" />
                <ellipse cx="32" cy="32" rx="10" ry="26" strokeOpacity="0.5" />
                <line x1="6" y1="32" x2="58" y2="32" strokeOpacity="0.5" />
                <line x1="10" y1="20" x2="54" y2="20" strokeOpacity="0.4" />
                <line x1="10" y1="44" x2="54" y2="44" strokeOpacity="0.4" />
              </svg>
            </div>

            {/* Floating info chips */}
            <div className="border-accent/30 bg-background/80 animate-bounce-subtle absolute -top-4 right-8 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur-sm">
              <Globe className="text-accent size-3.5" aria-hidden="true" />
              <span>150+ Countries</span>
            </div>
            <div
              className="bg-background/80 absolute bottom-4 left-4 flex items-center gap-1.5 rounded-lg border border-blue-400/30 px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur-sm"
              style={{ animationDelay: "1s" }}
            >
              <Package className="size-3.5 text-blue-400" aria-hidden="true" />
              <span>Real-time Tracking</span>
            </div>
            <div
              className="bg-background/80 absolute top-16 -left-2 flex items-center gap-1.5 rounded-lg border border-green-400/30 px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur-sm"
              style={{ animationDelay: "2s" }}
            >
              <ShieldCheck className="size-3.5 text-green-400" aria-hidden="true" />
              <span>Pet Safe Transport</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function DeliveryProofSection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
        <SectionIntro
          description="Apex presents shipments with professional visuals, service notes, tracking records, and signed documentation so customers know what is happening before, during, and after delivery."
          eyebrow="Field operations"
          title="A delivery experience that feels real and verifiable"
        />
        <p className="text-muted-foreground max-w-2xl text-sm leading-6 lg:justify-self-end">
          Photos shown across the site represent the parcel, pet, warehouse, and freight workflows
          Apex supports. Shipment-specific proof, receipts, documents, and delivery confirmation are
          generated inside the customer record.
        </p>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {deliveryProofCards.map((card) => (
          <article
            className="border-border bg-card shadow-panel overflow-hidden rounded-lg border"
            key={card.label}
          >
            <Image
              alt={card.image.alt}
              className="aspect-[4/3] w-full object-cover"
              height={420}
              sizes="(min-width: 1024px) 33vw, 100vw"
              src={card.image.src}
              width={620}
            />
            <div className="p-5">
              <h3 className="text-lg font-semibold tracking-normal">{card.label}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-6">{card.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ClientAssuranceSection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <SectionIntro
          description="Clients should always know who is handling the shipment, what has been paid for, what is still pending, and how to verify movement. Apex turns that into a visible record instead of loose messages."
          eyebrow="Client confidence"
          title="What customers can expect from Apex"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {clientAssuranceCards.map((card) => (
            <Card className="h-full" key={card.title}>
              <CardHeader>
                <div className="bg-accent/15 text-accent grid size-11 place-items-center rounded-md">
                  <card.icon aria-hidden="true" className="size-5" />
                </div>
                <CardTitle>{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Text>{card.text}</Text>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function GettingStartedGuideSection() {
  return (
    <section className="bg-surface py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <SectionIntro
            description="Start with the path that matches your situation. You can track a shipment without registering, create a customer account for ongoing visibility, or ask operations to prepare a shipment that needs special handling."
            eyebrow="Get started"
            title="Choose the easiest way to begin"
          />
          <div className="grid gap-4 md:grid-cols-3">
            {gettingStartedOptions.map((option) => (
              <Link
                className="border-border bg-card shadow-panel hover:border-accent/60 rounded-lg border p-5 transition-all hover:-translate-y-1"
                href={option.href as Route}
                key={option.title}
              >
                <div className="bg-accent/15 text-accent grid size-11 place-items-center rounded-md">
                  <option.icon aria-hidden="true" className="size-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-normal">{option.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-6">{option.description}</p>
                <span className="text-primary mt-5 inline-flex items-center gap-2 text-sm font-semibold">
                  {option.cta}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {clientPreparationLists.map((list) => (
            <div className="border-border bg-card rounded-lg border p-5" key={list.title}>
              <h3 className="text-lg font-semibold tracking-normal">{list.title}</h3>
              <ul className="mt-4 space-y-3">
                {list.items.map((item) => (
                  <li className="flex gap-3 text-sm leading-6" key={item}>
                    <Check aria-hidden="true" className="text-success mt-1 size-4 shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ServiceDetailsSection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      <SectionIntro
        align="center"
        description="Apex is built for the real details clients ask about: what is being moved, who is receiving it, what documents exist, how payment is handled, and how delivery is proven."
        eyebrow="Service detail"
        title="What each delivery type can include"
      />
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {serviceDetailCards.map((service) => (
          <article
            className="border-border bg-card shadow-panel rounded-lg border p-6"
            key={service.title}
          >
            <div className="bg-accent/15 text-accent grid size-12 place-items-center rounded-md">
              <Check aria-hidden="true" className="size-5" />
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-normal">{service.title}</h3>
            <p className="text-muted-foreground mt-3 text-sm leading-6">{service.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {service.highlights.map((highlight) => (
                <Badge key={highlight} variant="outline">
                  {highlight}
                </Badge>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function CustomerJourneySection() {
  return (
    <section className="bg-surface py-16">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <SectionIntro
            description="The client experience is designed around simple steps: confirm the shipment, receive a tracking number, follow every update, then close delivery with paperwork and refund processing where applicable."
            eyebrow="Customer journey"
            title="A simple process from registration to delivery"
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {accountabilityCards.map((card) => (
              <div className="border-border bg-card rounded-lg border p-4" key={card.label}>
                <p className="text-muted-foreground text-xs font-semibold uppercase">
                  {card.label}
                </p>
                <p className="mt-2 text-sm leading-6 font-semibold">{card.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="border-border bg-card shadow-panel rounded-lg border p-5">
          <div className="space-y-5">
            {customerJourneySteps.map((step) => (
              <div
                className="border-border border-b pb-5 last:border-b-0 last:pb-0"
                key={step.title}
              >
                <h3 className="text-base font-semibold tracking-normal">{step.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-6">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function DocumentsAndBillingSection() {
  return (
    <section className="relative overflow-hidden py-16">
      {/* Subtle grid bg */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.84 0.16 83.68) 1px, transparent 1px), linear-gradient(90deg, oklch(0.84 0.16 83.68) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        {/* Top: intro + image */}
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <SectionIntro
              description="Documents are one of the strongest ways to build trust. Apex records what was created, why it was created, who it belongs to, and how it connects back to the shipment."
              eyebrow="Documents and billing"
              title="Clear paperwork before, during, and after delivery"
            />
            <div className="border-border bg-card shadow-panel mt-8 rounded-xl border p-6">
              <h3 className="text-base font-semibold tracking-normal">How official documents help</h3>
              <p className="text-muted-foreground mt-3 text-sm leading-6">
                Shipment notices, invoices, email receipts, labels, health or care notes, and delivery
                confirmations — all prepared from the admin dashboard. Customers get a consistent
                paper trail instead of scattered messages.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild variant="accent">
                  <Link href={"/services" as Route}>
                    View services
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={"/contact" as Route}>Request documents</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Illustration: logistics documents visual */}
          <div className="relative hidden lg:block">
            <div
              aria-hidden="true"
              className="animate-float absolute -inset-6 rounded-3xl opacity-20"
              style={{
                background:
                  "radial-gradient(circle at 60% 40%, oklch(0.84 0.16 83.68), transparent 70%)",
              }}
            />
            <Image
              alt="Professional shipping documents, invoices, and paperwork laid out on a logistics desk"
              className="relative w-full rounded-2xl object-cover shadow-xl"
              height={480}
              sizes="(min-width: 1024px) 45vw, 100vw"
              src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=900&q=80"
              width={720}
            />
            {/* Floating document badge */}
            <div className="border-border bg-background/90 shadow-panel absolute -bottom-4 -left-4 max-w-[220px] rounded-xl border p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="bg-accent/15 text-accent grid size-9 shrink-0 place-items-center rounded-lg">
                  <Check aria-hidden="true" className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Email Invoice Sent</p>
                  <p className="text-muted-foreground text-xs">Delivered to customer inbox</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Document type cards */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {documentTrustItems.map((item) => (
            <div
              className="border-border bg-card hover:border-accent/50 rounded-xl border p-5 transition-all hover:-translate-y-1"
              key={item.title}
            >
              <div className="bg-accent/10 text-accent mb-3 grid size-10 place-items-center rounded-lg">
                <Check aria-hidden="true" className="size-4" />
              </div>
              <h3 className="font-semibold tracking-normal">{item.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-6">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PaymentConfidenceSection() {
  return (
    <section className="bg-surface py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <SectionIntro
            description="Do not rely on an isolated message when money is involved. Confirm the charge against the official shipment and invoice record, then keep the receipt and documented terms."
            eyebrow="Payment confidence"
            title="A clear way to verify every payment request"
          />
          <div className="grid gap-4 md:grid-cols-3">
            {paymentConfidenceItems.map((item) => (
              <div className="border-border bg-card rounded-lg border p-5" key={item.title}>
                <div className="bg-accent/15 text-accent grid size-11 place-items-center rounded-md">
                  <item.icon aria-hidden="true" className="size-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-normal">{item.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-6">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="border-border bg-background mt-8 flex flex-col gap-3 rounded-lg border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Something does not match?</p>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              Pause the payment and verify the invoice number with Apex support using the contact
              details published on this website.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={"/contact" as Route}>Contact support</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function TrustAndSafetySection() {
  return (
    <section className="bg-primary text-primary-foreground py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <SectionIntro
          description="Trust is not only about design. It comes from clear records, controlled access, honest billing language, and support that can explain the next step."
          eyebrow="Trust and safety"
          title="Built to make logistics feel accountable"
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {trustPillars.map((pillar) => (
            <div
              className="border-primary-foreground/15 bg-primary-foreground/8 rounded-lg border p-5"
              key={pillar.title}
            >
              <div className="bg-accent text-accent-foreground grid size-11 place-items-center rounded-md">
                <pillar.icon aria-hidden="true" className="size-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{pillar.title}</h3>
              <p className="text-primary-foreground/72 mt-2 text-sm leading-6">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PageHero({
  badge,
  description,
  eyebrow,
  image = marketingImages.services,
  primaryHref = "/contact",
  primaryLabel = "Talk to logistics",
  secondaryHref = "/pricing",
  secondaryLabel = "View pricing",
  title,
}: PageHeroProps) {
  return (
    <section className="border-border relative isolate min-h-[560px] overflow-hidden border-b">
      <Image
        alt={image.alt}
        className="absolute inset-0 -z-20 size-full object-cover"
        fill
        sizes="100vw"
        src={image.src}
      />
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-black/78 via-black/56 to-black/18" />
      <div className="from-background absolute inset-x-0 bottom-0 -z-10 h-28 bg-linear-to-t to-transparent" />
      <div className="mx-auto flex min-h-[560px] w-full max-w-7xl items-end px-4 py-14 sm:px-6 lg:py-18">
        <div className="animate-fade-up max-w-3xl">
          {badge ? <Badge variant="accent">{badge}</Badge> : null}
          <Kicker className={cn("text-white/72", badge ? "mt-6" : undefined)}>{eyebrow}</Kicker>
          <Display className="mt-4 max-w-4xl text-white">{title}</Display>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/82">{description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="accent">
              <Link href={primaryHref as Route}>
                {primaryLabel}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={secondaryHref as Route}>{secondaryLabel}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ServiceGrid() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      <SectionIntro
        align="center"
        description="Apex brings the most common logistics needs into a single, premium service experience."
        eyebrow="Services"
        title="One logistics partner for complex movement"
      />
      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {serviceCards.map((service) => (
          <Link
            className="border-border bg-card text-card-foreground shadow-panel hover:border-accent/60 group rounded-lg border p-5 transition-all hover:-translate-y-1"
            href={service.href as Route}
            key={service.title}
          >
            <div className="border-border/60 -mx-5 -mt-5 mb-5 overflow-hidden rounded-t-lg border-b">
              <Image
                alt={service.image.alt}
                className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                height={360}
                sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                src={service.image.src}
                width={480}
              />
            </div>
            <div className="bg-accent/15 text-accent-foreground grid size-11 place-items-center rounded-md">
              <service.icon aria-hidden="true" className="size-5" />
            </div>
            <h3 className="mt-5 text-lg font-semibold tracking-normal">{service.title}</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-6">{service.description}</p>
            <span className="text-primary mt-5 inline-flex items-center gap-2 text-sm font-semibold">
              Explore service
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform group-hover:translate-x-1"
              />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function PetTransportPartnerSection() {
  return (
    <section className="bg-surface py-16">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <div className="border-accent/40 bg-accent/10 inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
            <Handshake aria-hidden="true" className="text-accent size-4" />
            <span className="text-accent text-xs font-semibold tracking-wide uppercase">
              Certified Pet Transport Partner
            </span>
          </div>
          <Kicker className="mt-5">Pet transportation</Kicker>
          <Heading className="mt-3">In partnership with CitizenShipper</Heading>
          <Text className="mt-4 max-w-xl">
            Apex Global Logistics coordinates eligible pet transportation services with
            CitizenShipper, combining structured pet records, clear customer communication, and
            route-specific transport planning for dogs, cats, birds, and more.
          </Text>
          <p className="text-muted-foreground mt-4 max-w-xl text-sm leading-6">
            Every transport plan is confirmed for the individual pet and route before movement
            begins, including the required handoff, care, and delivery details.
          </p>

          {/* Pet type badges */}
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              "Dogs",
              "Cats",
              "Birds",
              "Rabbits",
              "Reptiles",
              "Exotic Pets",
            ].map((label) => (
              <span
                key={label}
                className="border-border bg-card inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium shadow-sm"
              >
                <PawPrint className="text-accent size-3.5" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="border-border bg-card shadow-panel overflow-hidden rounded-2xl border">
          <Image
            alt="Pet travel carrier prepared for a coordinated transportation handoff"
            className="aspect-[16/10] w-full object-cover"
            height={600}
            sizes="(min-width: 1024px) 50vw, 100vw"
            src={marketingImages.petHandoff.src}
            width={960}
          />
          {/* Overlay bar */}
          <div className="border-border border-t p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">AI-Matched Transport Routes</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Intelligent carrier matching based on pet type, breed, and destination
                </p>
              </div>
              <div className="bg-success/15 text-success rounded-full px-3 py-1 text-xs font-semibold">
                Live
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Rich gallery showcasing the variety of pet transportation services */
export function PetServicesShowcase() {
  const petServices = [
    {
      title: "Air Freight & Cargo",
      description:
        "Time-critical air cargo solutions connecting 150+ countries. Priority boarding, customs pre-clearance, and door-to-airport-to-door coordination for parcels and commercial freight.",
      image: {
        src: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80",
        alt: "Cargo aircraft on runway with freight being loaded at golden hour",
      },
      badge: "Fastest Transit",
      badgeColor: "accent" as const,
      tags: ["150+ countries", "Priority boarding", "Same-day dispatch"],
    },
    {
      title: "International Pet Relocation",
      description:
        "Full-service international pet moves including health certificates, USDA endorsement, airline coordination, customs clearance, and quarantine management in 80+ destinations.",
      image: {
        src: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800&q=80",
        alt: "Pet carrier at international airport cargo terminal",
      },
      badge: "Most Popular",
      badgeColor: "accent" as const,
      tags: ["Health certificates", "Customs clearance", "80+ destinations"],
    },
    {
      title: "Express Parcel Delivery",
      description:
        "Next-day and 2-day express courier services for documents, e-commerce, and high-value goods. Real-time tracking, signature confirmation, and tamper-evident packaging.",
      image: {
        src: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=80",
        alt: "Courier van loading express delivery parcels at distribution centre",
      },
      badge: "Next Day",
      badgeColor: "outline" as const,
      tags: ["Real-time tracking", "Signature required", "Tamper-evident"],
    },
    {
      title: "Maritime & Ocean Freight",
      description:
        "Full-container and LCL ocean freight from major ports worldwide. Bill of lading, cargo insurance, port handling, and inland delivery coordination included.",
      image: {
        src: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&q=80",
        alt: "Container ship loaded with cargo containers at sea port",
      },
      badge: "Ocean Freight",
      badgeColor: "outline" as const,
      tags: ["FCL & LCL", "Cargo insurance", "Port-to-door"],
    },
    {
      title: "Dog & Cat Transport",
      description:
        "Climate-controlled domestic and international transport for dogs and cats of all breeds. Certified handlers, GPS-tracked vehicles, and live photo updates throughout the journey.",
      image: {
        src: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80",
        alt: "Golden retriever in comfortable transport carrier ready for journey",
      },
      badge: "Pet Specialist",
      badgeColor: "outline" as const,
      tags: ["Climate controlled", "GPS tracked", "Photo updates"],
    },
    {
      title: "Warehouse & Fulfilment",
      description:
        "Bonded warehouse storage, pick-and-pack fulfilment, cross-docking, and inventory management. Seamlessly integrated with your e-commerce or commercial supply chain.",
      image: {
        src: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
        alt: "Modern warehouse facility with organised shelving and logistics operations",
      },
      badge: "B2B",
      badgeColor: "outline" as const,
      tags: ["Bonded storage", "Pick & pack", "Cross-docking"],
    },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      {/* Section header */}
      <div className="mx-auto max-w-3xl text-center">
        <div className="border-accent/40 bg-accent/10 mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5">
          <span className="text-accent text-xs font-bold tracking-widest uppercase">
            Global Logistics Services
          </span>
        </div>
        <Heading className="mt-3">Every shipment, every mile — delivered right</Heading>
        <Text className="mt-4">
          Air freight, ocean cargo, express parcels, pet relocation, and warehouse fulfilment — Apex Global Logistics handles every movement with precision and care.
        </Text>
      </div>

      {/* Service cards grid */}
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {petServices.map((service, index) => (
          <article
            key={service.title}
            className={`border-border bg-card shadow-panel hover:shadow-glow group relative overflow-hidden rounded-2xl border transition-all duration-500 hover:-translate-y-2 animate-stagger-${Math.min(index + 1, 4) as 1 | 2 | 3 | 4}`}
          >
            {/* Image */}
            <div className="relative overflow-hidden">
              <Image
                alt={service.image.alt}
                className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-110"
                height={400}
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                src={service.image.src}
                width={600}
              />
              {/* Gradient overlay on image */}
              <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              {/* Badge */}
              <div className="absolute top-3 left-3">
                <span className="bg-accent text-accent-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm">
                  {service.badge}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="text-lg font-semibold tracking-normal">{service.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-6">{service.description}</p>

              {/* Feature tags */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {service.tags.map((tag) => (
                  <span
                    key={tag}
                    className="border-border bg-surface rounded-full border px-2.5 py-0.5 text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <Link
                className="text-accent mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition-all group-hover:gap-2.5"
                href={"/services" as Route}
              >
                Learn more
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      {/* Bottom CTA bar */}
      <div className="border-border bg-surface mt-12 flex flex-col items-center gap-4 rounded-2xl border p-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="font-semibold">Not sure which service fits your pet?</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Our AI-powered matching system recommends the ideal transport plan based on your
            pet&apos;s species, breed, age, and destination.
          </p>
        </div>
        <Button asChild variant="accent" className="shrink-0">
          <Link href={"/contact" as Route}>
            Get a pet quote
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

export function FeatureBand({
  features,
  title,
}: {
  features: readonly IconFeature[];
  title: string;
}) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      <div className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <Card className="transition-transform hover:-translate-y-1" key={feature.title}>
            <CardHeader>
              <div className="bg-secondary text-secondary-foreground mb-4 grid size-11 place-items-center rounded-md">
                <feature.icon aria-hidden="true" className="size-5" />
              </div>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            {feature.text ? (
              <CardContent>
                <Text>{feature.text}</Text>
              </CardContent>
            ) : null}
          </Card>
        ))}
      </div>
      <p className="sr-only">{title}</p>
    </section>
  );
}

export function ProcessSection() {
  return (
    <section className="bg-primary text-primary-foreground py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <SectionIntro
          description="Apex is designed around high-confidence movement: structured intake, coordinated routing, and proactive visibility."
          eyebrow="How it works"
          title="From quote to delivery without losing context"
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {processSteps.map((step, index) => (
            <div
              className="border-primary-foreground/15 bg-primary-foreground/8 rounded-lg border p-5"
              key={step.title}
            >
              <div className="flex items-center gap-3">
                <div className="bg-accent text-accent-foreground grid size-10 place-items-center rounded-md">
                  <step.icon aria-hidden="true" className="size-5" />
                </div>
                <span className="text-primary-foreground/60 text-sm font-semibold">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
              <p className="text-primary-foreground/72 mt-2 text-sm leading-6">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingCards() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      <SectionIntro
        align="center"
        description="Transparent starting points for parcels, pets, freight, and managed logistics programs."
        eyebrow="Pricing"
        title="Choose the logistics coverage you need"
      />
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {pricingPlans.map((plan, index) => (
          <Card className={cn(index === 1 && "border-accent")} key={plan.name}>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>{plan.name}</CardTitle>
                {index === 1 ? <Badge variant="accent">Popular</Badge> : null}
              </div>
              <p className="mt-4 text-4xl font-semibold tracking-normal">
                {plan.price}
                {plan.price.startsWith("$") ? (
                  <span className="text-muted-foreground text-sm"> / mo</span>
                ) : null}
              </p>
              <Text>{plan.description}</Text>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li className="flex gap-3 text-sm" key={feature}>
                    <Check aria-hidden="true" className="text-success mt-0.5 size-4 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full" variant={index === 1 ? "accent" : "outline"}>
                <Link href={"/contact" as Route}>{plan.cta}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function FaqList() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
      <SectionIntro
        align="center"
        description="Answers for customers, operations teams, and partners evaluating Apex."
        eyebrow="FAQ"
        title="Common questions"
      />
      <div className="divide-border border-border bg-card shadow-panel mt-10 divide-y rounded-lg border">
        {faqs.map((faq) => (
          <details className="group p-5" key={faq.question}>
            <summary className="text-foreground cursor-pointer list-none text-base font-semibold">
              {faq.question}
            </summary>
            <Text className="mt-3">{faq.answer}</Text>
          </details>
        ))}
      </div>
    </section>
  );
}

export function TrustBar() {
  return (
    <section className="border-border bg-card border-y">
      <div className="mx-auto grid w-full max-w-7xl gap-3 px-4 py-6 sm:px-6 md:grid-cols-4">
        {trustSignals.map((signal) => (
          <div className="flex items-center gap-3 text-sm font-semibold" key={signal.text}>
            <signal.icon aria-hidden="true" className="text-accent size-5" />
            {signal.text}
          </div>
        ))}
      </div>
    </section>
  );
}

export function ContactPanel() {
  const emailChannels = [
    {
      description: "Company information, service questions, quotes, and new shipment coordination.",
      email: siteConfig.emails.general,
      label: "General Inquiries",
      subject: "Apex Global Logistics inquiry",
    },
    {
      description:
        "Active shipment help, account access, verification, password reset, billing, and customer care.",
      email: siteConfig.emails.support,
      label: "Customer Support",
      subject: "Apex customer support request",
    },
  ] as const;

  const contactCards = [
    {
      href: "/tracking",
      icon: PackageSearch,
      label: "Track a Shipment",
      description:
        "Use a tracking number or carrier reference to check live status, location milestones, and delivery confirmation — no account required.",
    },
    {
      href: "/register",
      icon: Check,
      label: "Create an Account",
      description:
        "Register for full access to shipment history, invoices, documents, email receipts, and account-based support records.",
    },
    {
      href: "/support",
      icon: MessageCircle,
      label: "Live Chat & Cases",
      description:
        "Open a secure support case with message history, file attachments, and email notifications when Apex replies.",
    },
    {
      href: "/services",
      icon: Handshake,
      label: "View All Services",
      description:
        "Explore the full range — air freight, ocean cargo, express parcels, pet relocation, customs, and warehouse fulfilment.",
    },
  ] as const;

  return (
    <section className="bg-surface py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Kicker>Contact</Kicker>
          <Heading className="mt-3">Reach the right Apex desk</Heading>
          <Text className="mt-4">
            Use the fastest channel for your situation. Track a shipment without an account, open a
            support case with live chat, or email the team directly for quotes and coordination.
          </Text>
        </div>

        {/* Email channels — highlighted */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          {emailChannels.map((channel) => (
            <a
              className="border-border bg-card shadow-panel hover:border-accent/60 group rounded-xl border p-6 transition-all hover:-translate-y-1"
              href={`mailto:${channel.email}?subject=${encodeURIComponent(channel.subject)}`}
              key={channel.email}
            >
              <div className="bg-accent/15 text-accent grid size-12 place-items-center rounded-xl transition-transform group-hover:scale-110">
                <Mail aria-hidden="true" className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-normal">{channel.label}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-6">{channel.description}</p>
              <p className="text-accent mt-3 text-sm font-semibold">{channel.email}</p>
            </a>
          ))}
        </div>

        {/* Action cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {contactCards.map((card) => (
            <Link
              className="border-border bg-card shadow-panel hover:border-accent/60 group rounded-xl border p-5 transition-all hover:-translate-y-1"
              href={card.href as Route}
              key={card.label}
            >
              <div className="bg-accent/15 text-accent grid size-11 place-items-center rounded-lg transition-transform group-hover:scale-110">
                <card.icon aria-hidden="true" className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold tracking-normal">{card.label}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-6">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="px-4 py-16 sm:px-6">
      <div
        className="shadow-panel relative mx-auto max-w-7xl overflow-hidden rounded-2xl px-6 py-16 md:px-12"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.23 0.045 257.31), oklch(0.3 0.07 260), oklch(0.25 0.06 290))",
        }}
      >
        {/* Aurora orbs */}
        <div
          aria-hidden="true"
          className="animate-aurora absolute -top-20 -right-20 h-64 w-64 rounded-full opacity-40"
          style={{
            background: "radial-gradient(circle, oklch(0.84 0.16 83.68), transparent 70%)",
          }}
        />
        <div
          aria-hidden="true"
          className="animate-float-slow absolute -bottom-16 -left-16 h-48 w-48 rounded-full opacity-25"
          style={{
            background: "radial-gradient(circle, oklch(0.68 0.14 241.2), transparent 70%)",
          }}
        />

        <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            {/* Pulsing badge */}
            <div className="border-accent/40 bg-accent/10 inline-flex items-center gap-2 rounded-full border px-3 py-1 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="bg-accent absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                <span className="bg-accent relative inline-flex h-2 w-2 rounded-full" />
              </span>
              <span className="text-accent text-xs font-semibold tracking-wide uppercase">
                Ready when you are
              </span>
            </div>

            <Heading className="text-primary-foreground mt-4 text-3xl sm:text-4xl">
              Move parcels, pets, and freight with Apex confidence
            </Heading>
            <p className="text-primary-foreground/75 mt-4 max-w-2xl text-base leading-7">
              Create an account or talk to the operations team to design your next logistics flow
              — powered by intelligent routing and real-time visibility.
            </p>

            {/* Trust micro-signals */}
            <div className="mt-6 flex flex-wrap gap-4">
              {[
                "No setup fees",
                "24/7 shipment tracking",
                "Pet-certified handlers",
                "Global coverage",
              ].map((item) => (
                <span key={item} className="text-primary-foreground/80 flex items-center gap-1.5 text-sm font-medium">
                  <Check className="text-accent size-4" aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
            <Button asChild variant="accent" size="lg" className="animate-glow-pulse">
              <Link href={"/register" as Route}>
                Create account
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link href={"/contact" as Route}>Contact sales</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/** AI-powered features section showcasing intelligent logistics capabilities */
export function AiPoweredSection() {
  const aiFeatures = [
    {
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
          />
        </svg>
      ),
      title: "Intelligent Route Optimization",
      description:
        "Our AI engine analyses thousands of carrier options in real-time, selecting the optimal route based on speed, cost, pet safety requirements, and regulatory compliance.",
      highlight: "40% faster delivery",
    },
    {
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"
          />
        </svg>
      ),
      title: "Predictive Shipment Tracking",
      description:
        "Machine learning models predict delivery windows with 94% accuracy, proactively alerting customers to delays before they happen and suggesting contingency options.",
      highlight: "94% ETA accuracy",
    },
    {
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"
          />
        </svg>
      ),
      title: "Smart Pet Welfare Monitoring",
      description:
        "IoT-enabled carriers with real-time temperature, humidity, and motion sensors feed data to our AI dashboard, ensuring every pet remains safe and comfortable in transit.",
      highlight: "Real-time monitoring",
    },
    {
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      ),
      title: "Automated Documentation",
      description:
        "AI auto-generates health certificates, customs declarations, shipping manifests, and delivery receipts — cutting paperwork time by 80% and eliminating manual errors.",
      highlight: "80% less paperwork",
    },
    {
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
          />
        </svg>
      ),
      title: "Dynamic Pricing Engine",
      description:
        "Real-time market analysis delivers instant, transparent pricing that adjusts for seasonal demand, route availability, and shipment complexity — no hidden fees.",
      highlight: "Instant quotes",
    },
    {
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
          />
        </svg>
      ),
      title: "Compliance & Risk AI",
      description:
        "Automated regulatory compliance checks across 150+ countries ensure your shipment meets local import laws, airline regulations, and breed-specific transport restrictions.",
      highlight: "150+ countries",
    },
  ];

  return (
    <section className="relative overflow-hidden py-20">
      {/* Background gradient */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, var(--background) 0%, oklch(0.15 0.04 258 / 5%) 50%, var(--background) 100%)",
        }}
      />

      {/* Decorative grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.84 0.16 83.68) 1px, transparent 1px), linear-gradient(90deg, oklch(0.84 0.16 83.68) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="border-accent/40 bg-accent/10 inline-flex items-center gap-2 rounded-full border px-4 py-1.5">
            <span className="text-accent text-xs font-bold tracking-widest uppercase">
              AI-Powered Platform
            </span>
          </div>
          <Heading className="mt-4">Logistics intelligence built for the modern world</Heading>
          <Text className="mt-4">
            Apex combines machine learning, real-time IoT data, and automated workflows to deliver a
            logistics experience that is faster, safer, and more transparent than anything
            traditional operations can offer.
          </Text>
        </div>

        {/* AI feature grid */}
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {aiFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className={`border-border bg-card shadow-panel hover:border-glow group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 animate-stagger-${Math.min(index + 1, 4) as 1 | 2 | 3 | 4}`}
            >
              {/* Glow effect on hover */}
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(circle at top left, oklch(0.84 0.16 83.68 / 8%), transparent 60%)",
                }}
              />

              <div className="relative">
                {/* Icon */}
                <div className="bg-accent/15 text-accent grid size-12 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110">
                  {feature.icon}
                </div>

                {/* Highlight badge */}
                <div className="bg-accent/10 mt-4 inline-flex items-center rounded-full px-2.5 py-0.5">
                  <span className="text-accent text-[10px] font-bold tracking-wider uppercase">
                    {feature.highlight}
                  </span>
                </div>

                <h3 className="mt-3 text-base font-semibold tracking-normal">{feature.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom stats strip */}
        <div className="border-border bg-surface mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border sm:grid-cols-4">
          {[
            { value: "99.7%", label: "On-time delivery rate" },
            { value: "150+", label: "Countries served" },
            { value: "4.9 / 5", label: "Average customer rating" },
            { value: "<2 min", label: "AI quote generation" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card p-6 text-center">
              <p className="text-accent text-3xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-muted-foreground mt-1 text-xs font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

