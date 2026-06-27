import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Check, PackageSearch } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Display, Heading, Kicker, Text } from "@/components/ui/typography";
import {
  capabilityHighlights,
  faqs,
  pricingPlans,
  processSteps,
  serviceCards,
  trackingEvents,
  trustSignals,
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
        src="/images/global-logistics-hero.png"
      />
      <div className="from-background via-background/72 to-background/8 absolute inset-0 -z-10 bg-linear-to-r" />
      <div className="from-background absolute inset-x-0 bottom-0 -z-10 h-32 bg-linear-to-t to-transparent" />
      <div className="mx-auto flex min-h-[calc(100svh-73px)] w-full max-w-7xl items-center px-4 py-16 sm:px-6">
        <div className="animate-fade-up max-w-3xl">
          <Badge variant="accent">Global logistics control tower</Badge>
          <Display className="mt-6 text-5xl sm:text-6xl">Apex Global Logistics</Display>
          <p className="text-muted-foreground mt-6 max-w-2xl text-base leading-8 sm:text-lg">
            Premium parcel delivery, pet transportation, freight coordination, and tracking built
            for customers and operations teams that need every handoff to be visible.
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

export function PageHero({
  badge,
  description,
  eyebrow,
  primaryHref = "/contact",
  primaryLabel = "Talk to logistics",
  secondaryHref = "/pricing",
  secondaryLabel = "View pricing",
  title,
}: PageHeroProps) {
  return (
    <section className="border-border bg-surface relative overflow-hidden border-b">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_20%,var(--accent)_0,transparent_28%),linear-gradient(135deg,var(--surface),var(--background))] opacity-20" />
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_420px] lg:items-center lg:py-20">
        <div className="animate-fade-up">
          {badge ? <Badge variant="accent">{badge}</Badge> : null}
          <Kicker className={badge ? "mt-6" : undefined}>{eyebrow}</Kicker>
          <Display className="mt-4 max-w-4xl">{title}</Display>
          <Text className="mt-5 max-w-2xl text-base leading-8">{description}</Text>
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
        <div className="border-border bg-card shadow-panel rounded-lg border p-4">
          <Image
            alt="Apex Global Logistics international warehouse, van, aircraft, and shipping operations"
            className="aspect-[4/3] rounded-md object-cover"
            height={720}
            sizes="(min-width: 1024px) 420px, calc(100vw - 2rem)"
            src="/images/global-logistics-hero.png"
            width={960}
          />
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

export function TrackingPreview() {
  return (
    <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <div>
        <SectionIntro
          description="Give customers a clean milestone view while operations teams see exceptions, ownership, and next actions."
          eyebrow="Tracking"
          title="Every handoff stays visible"
        />
        <Button asChild className="mt-8" variant="accent">
          <Link href={"/tracking" as Route}>
            Track a shipment
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
      <div className="border-border bg-card shadow-panel rounded-lg border p-5">
        <div className="border-border flex items-center gap-3 border-b pb-4">
          <div className="bg-accent/15 grid size-11 place-items-center rounded-md">
            <PackageSearch aria-hidden="true" className="text-accent size-5" />
          </div>
          <div>
            <p className="font-semibold">AGL-2026-0148</p>
            <p className="text-muted-foreground text-sm">Lagos to Accra - Priority parcel</p>
          </div>
        </div>
        <div className="mt-5 space-y-4">
          {trackingEvents.map((event) => (
            <div className="flex gap-4" key={event.status}>
              <div className="flex flex-col items-center">
                <span className="bg-accent size-3 rounded-full" />
                <span className="bg-border mt-2 h-10 w-px last:hidden" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{event.status}</p>
                <p className="text-muted-foreground text-sm">{event.time}</p>
              </div>
              <Badge
                variant={
                  event.tone === "warning"
                    ? "warning"
                    : event.tone === "success"
                      ? "success"
                      : "info"
                }
              >
                Live
              </Badge>
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
  return (
    <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <SectionIntro
          description="Tell us what needs to move. Apex will route you to the right parcel, pet, freight, or enterprise logistics team."
          eyebrow="Contact"
          title="Plan your next move"
        />
      </div>
      <form className="border-border bg-card shadow-panel grid gap-4 rounded-lg border p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact-name">Name</Label>
            <Input id="contact-name" placeholder="Ada Johnson" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">Email</Label>
            <Input id="contact-email" placeholder="ada@example.com" type="email" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact-service">Service</Label>
            <Select id="contact-service" defaultValue="parcel">
              <option value="parcel">Parcel delivery</option>
              <option value="pet">Pet transportation</option>
              <option value="freight">Freight</option>
              <option value="enterprise">Enterprise network</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-phone">Phone</Label>
            <Input id="contact-phone" placeholder="+1 555 014 8848" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-message">Message</Label>
          <Textarea
            id="contact-message"
            placeholder="Shipment origin, destination, timing, and handling details."
          />
        </div>
        <Button type="button" variant="accent">
          Send request
          <ArrowRight aria-hidden="true" />
        </Button>
      </form>
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
