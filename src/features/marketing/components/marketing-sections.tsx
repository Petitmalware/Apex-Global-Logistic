import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Check, Handshake, Mail, MessageCircle, PackageSearch } from "lucide-react";

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
      <Image
        alt="A global logistics hub with delivery van, cargo aircraft, shipping vessel, parcels, and digital route overlays"
        className="absolute inset-0 -z-20 size-full object-cover"
        fill
        priority
        sizes="100vw"
        src={marketingImages.hero.src}
      />
      <div className="from-background via-background/72 to-background/8 absolute inset-0 -z-10 bg-linear-to-r" />
      <div className="from-background absolute inset-x-0 bottom-0 -z-10 h-32 bg-linear-to-t to-transparent" />
      <div className="mx-auto flex min-h-[calc(100svh-73px)] w-full max-w-7xl items-center px-4 py-16 sm:px-6">
        <div className="animate-fade-up max-w-3xl">
          <Badge variant="accent">Logistics, made clear</Badge>
          <Display className="mt-6 text-5xl sm:text-6xl">Apex Global Logistics</Display>
          <p className="text-muted-foreground mt-6 max-w-2xl text-base leading-8 sm:text-lg">
            Parcel delivery, pet transportation, freight coordination, and transparent shipment
            records from initial setup through delivery.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="xl" variant="accent">
              <Link href={"/register" as Route}>
                Open account
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link href={"/tracking" as Route}>Track shipment</Link>
            </Button>
          </div>
          <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {capabilityHighlights.map((item) => (
              <div
                className="border-border bg-background/85 rounded-lg border p-3 shadow-sm backdrop-blur"
                key={item.label}
              >
                <item.icon aria-hidden="true" className="text-accent size-4" />
                <p className="mt-2 text-lg font-semibold">{item.value}</p>
                <p className="text-muted-foreground text-xs">{item.label}</p>
              </div>
            ))}
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
    <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1fr] lg:items-start">
      <div>
        <SectionIntro
          description="Documents are one of the strongest ways to build trust. Apex records what was created, why it was created, who it belongs to, and how it connects back to the shipment."
          eyebrow="Documents and billing"
          title="Clear paperwork before, during, and after delivery"
        />
        <div className="border-border bg-card shadow-panel mt-8 rounded-lg border p-5">
          <h3 className="text-base font-semibold tracking-normal">How official documents help</h3>
          <p className="text-muted-foreground mt-3 text-sm leading-6">
            Shipment notices, invoices, receipts, labels, health or care notes, and delivery
            confirmations can all be prepared from the admin dashboard. This gives customers a
            consistent paper trail instead of scattered messages.
          </p>
          <Button asChild className="mt-5" variant="accent">
            <Link href={"/services" as Route}>
              View services
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-4">
        {documentTrustItems.map((item) => (
          <div className="border-border bg-card rounded-lg border p-5" key={item.title}>
            <h3 className="font-semibold tracking-normal">{item.title}</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-6">{item.description}</p>
          </div>
        ))}
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
            className="group border-border bg-card text-card-foreground shadow-panel hover:border-accent/60 rounded-lg border p-5 transition-all hover:-translate-y-1"
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
          <div className="bg-accent/15 text-accent grid size-11 place-items-center rounded-md">
            <Handshake aria-hidden="true" className="size-5" />
          </div>
          <Kicker className="mt-5">Pet transportation</Kicker>
          <Heading className="mt-3">In partnership with CitizenShipper</Heading>
          <Text className="mt-4 max-w-xl">
            Apex Global Logistics coordinates eligible pet transportation services with
            CitizenShipper, combining structured pet records, clear customer communication, and
            route-specific transport planning.
          </Text>
          <p className="text-muted-foreground mt-4 max-w-xl text-sm leading-6">
            Every transport plan is confirmed for the individual pet and route before movement
            begins, including the required handoff, care, and delivery details.
          </p>
        </div>
        <div className="border-border bg-card shadow-panel overflow-hidden rounded-lg border">
          <Image
            alt="Pet travel carrier prepared for a coordinated transportation handoff"
            className="aspect-[16/10] w-full object-cover"
            height={600}
            sizes="(min-width: 1024px) 50vw, 100vw"
            src={marketingImages.petHandoff.src}
            width={960}
          />
        </div>
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
      label: "General inquiries",
      subject: "Apex Global Logistics inquiry",
    },
    {
      description:
        "Active shipment help, account access, verification, password reset, billing, and customer care.",
      email: siteConfig.emails.support,
      label: "Customer support",
      subject: "Apex customer support request",
    },
  ] as const;

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <SectionIntro
          description="Use the fastest channel for your situation. Customers can track shipments without an account, create an account for documents, or contact operations directly for shipment setup."
          eyebrow="Contact"
          title="Reach the right Apex desk"
        />
        <p className="text-muted-foreground mt-5 max-w-xl text-sm leading-6">
          For account verification or password reset issues, use the email address connected to your
          customer account so support can match the request to the correct record.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {emailChannels.map((channel) => (
          <a
            className="border-border bg-card shadow-panel hover:border-accent/60 rounded-lg border p-5 transition-colors"
            href={`mailto:${channel.email}?subject=${encodeURIComponent(channel.subject)}`}
            key={channel.email}
          >
            <div className="bg-accent/15 text-accent grid size-11 place-items-center rounded-md">
              <Mail aria-hidden="true" className="size-5" />
            </div>
            <h3 className="mt-5 text-lg font-semibold tracking-normal">{channel.label}</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              {channel.description} Write to {channel.email}.
            </p>
          </a>
        ))}
        <Link
          className="border-border bg-card shadow-panel hover:border-accent/60 rounded-lg border p-5 transition-colors"
          href={"/tracking" as Route}
        >
          <div className="bg-accent/15 text-accent grid size-11 place-items-center rounded-md">
            <PackageSearch aria-hidden="true" className="size-5" />
          </div>
          <h3 className="mt-5 text-lg font-semibold tracking-normal">Track a shipment</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Use a tracking number or carrier reference to check public status without creating an
            account.
          </p>
        </Link>
        <Link
          className="border-border bg-card shadow-panel hover:border-accent/60 rounded-lg border p-5 transition-colors"
          href={"/register" as Route}
        >
          <div className="bg-accent/15 text-accent grid size-11 place-items-center rounded-md">
            <Check aria-hidden="true" className="size-5" />
          </div>
          <h3 className="mt-5 text-lg font-semibold tracking-normal">Create customer access</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Register when you need shipment history, invoices, documents, support records, and
            account-based updates.
          </p>
        </Link>
        <div className="border-border bg-card shadow-panel rounded-lg border p-5">
          <div className="bg-accent/15 text-accent grid size-11 place-items-center rounded-md">
            <MessageCircle aria-hidden="true" className="size-5" />
          </div>
          <h3 className="mt-5 text-lg font-semibold tracking-normal">Live chat</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Use the live chat button for quick questions. Admin replies appear in the same chat
            thread, with attachments supported where needed.
          </p>
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="px-4 py-16 sm:px-6">
      <div className="bg-primary text-primary-foreground shadow-panel mx-auto max-w-7xl rounded-lg px-6 py-12 md:px-10">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <Kicker className="text-primary-foreground/65">Ready when you are</Kicker>
            <Heading className="text-primary-foreground mt-3">
              Move parcels, pets, and freight with Apex confidence
            </Heading>
            <p className="text-primary-foreground/72 mt-3 max-w-2xl text-sm leading-6">
              Create an account or talk to the operations team to design your next logistics flow.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="accent">
              <Link href={"/register" as Route}>Create account</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={"/contact" as Route}>Contact sales</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
