import { Building2, Globe2, ShieldCheck, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Heading, Kicker, Text } from "@/components/ui/typography";

const values = [
  {
    icon: ShieldCheck,
    text: "Security, auditability, and role-based controls are designed into the operating model.",
    title: "Trust by default",
  },
  {
    icon: Truck,
    text: "Parcel, pet, and freight journeys are treated as connected workflows, not isolated tickets.",
    title: "Operational clarity",
  },
  {
    icon: Globe2,
    text: "Global lanes, regional hubs, and local delivery partners can work through one customer experience.",
    title: "Network thinking",
  },
] as const;

export function AboutStory() {
  return (
    <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <Kicker>Our approach</Kicker>
        <Heading className="mt-3">
          Built like a logistics command center, experienced like a premium service
        </Heading>
        <Text className="mt-4">
          Apex Global Logistics is designed for the moments where shipment details matter: the pet
          travel document, the customs handoff, the warehouse scan, the support ticket, the invoice,
          and the delivery promise.
        </Text>
        <div className="mt-6 flex flex-wrap gap-2">
          <Badge variant="accent">Parcel</Badge>
          <Badge variant="info">Pet transport</Badge>
          <Badge variant="success">Freight</Badge>
          <Badge variant="outline">Tracking</Badge>
        </div>
      </div>
      <div className="grid gap-4">
        {values.map((value) => (
          <div
            className="border-border bg-card shadow-panel rounded-lg border p-5"
            key={value.title}
          >
            <div className="flex gap-4">
              <div className="bg-accent/15 text-accent-foreground grid size-11 shrink-0 place-items-center rounded-md">
                <value.icon aria-hidden="true" className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold tracking-normal">{value.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-6">{value.text}</p>
              </div>
            </div>
          </div>
        ))}
        <div className="border-border bg-primary text-primary-foreground shadow-panel rounded-lg border p-5">
          <Building2 aria-hidden="true" className="text-accent size-5" />
          <p className="mt-3 text-lg font-semibold">Designed for enterprise readiness</p>
          <p className="text-primary-foreground/72 mt-2 text-sm leading-6">
            Authentication, RBAC, audit logs, Prisma/PostgreSQL, and clean architecture are already
            part of the platform foundation.
          </p>
        </div>
      </div>
    </section>
  );
}
