import Link from "next/link";
import type { Metadata } from "next";
import { Clock3, FileText, LockKeyhole, PackageSearch } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatWidget } from "@/features/chat/components/chat-widget";
import { MarketingShell } from "@/features/marketing/components/marketing-shell";

export const metadata: Metadata = {
  alternates: { canonical: "/support" },
  description:
    "Open a secure support case with Apex Global Logistics for shipment, account, document, and delivery assistance.",
  title: "Support Centre",
};

const supportPromises = [
  {
    description: "Every message and attachment stays in one secure conversation.",
    icon: LockKeyhole,
    title: "Protected case history",
  },
  {
    description: "Use your tracking number so the team can begin with the right shipment context.",
    icon: PackageSearch,
    title: "Shipment-aware support",
  },
  {
    description:
      "When the team replies, we email a secure link that returns you directly to this case.",
    icon: Clock3,
    title: "Clear follow-up",
  },
] as const;

export default function SupportPage() {
  return (
    <MarketingShell>
      <section className="border-border bg-surface border-b">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <Badge variant="accent">Customer support</Badge>
          <div className="mt-5 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Support that stays connected to your delivery.
              </h1>
              <p className="text-muted-foreground mt-5 max-w-2xl text-base leading-7">
                Open one secure case for shipment questions, documents, billing, account access, or
                delivery coordination. You can return from the secure link in every support email.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button asChild variant="outline">
                <Link href="/tracking">
                  <PackageSearch aria-hidden="true" />
                  Track a shipment
                </Link>
              </Button>
              <Button asChild variant="outline">
                <a href="mailto:support@apexgloballogistics.net">
                  <FileText aria-hidden="true" />
                  Email support
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[340px_1fr] lg:py-14">
        <aside className="space-y-4">
          {supportPromises.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <div className="bg-accent/15 text-accent grid size-10 place-items-center rounded-md">
                  <item.icon aria-hidden="true" className="size-5" />
                </div>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-6">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </aside>

        <ChatWidget surface="workspace" variant="page" />
      </section>
    </MarketingShell>
  );
}
