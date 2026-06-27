"use client";

import {
  Archive,
  ArrowRight,
  BellRing,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Filter,
  Globe2,
  PackageCheck,
  Plane,
  Plus,
  Search,
  Send,
  ShipWheel,
  Truck,
  Warehouse,
} from "lucide-react";
import { useState } from "react";

import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { BarChart, MetricChartCard } from "@/components/ui/chart";
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notification } from "@/components/ui/notification";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Display, Heading, Kicker, Text } from "@/components/ui/typography";
import { colorTokens, spacingTokens } from "@/lib/design-system/tokens";

const trendData = [
  { label: "Mon", value: 42 },
  { label: "Tue", value: 48 },
  { label: "Wed", value: 46 },
  { label: "Thu", value: 58 },
  { label: "Fri", value: 64 },
  { label: "Sat", value: 61 },
  { label: "Sun", value: 72 },
];

const laneData = [
  { label: "Road", value: 64 },
  { label: "Air", value: 38 },
  { label: "Sea", value: 52 },
  { label: "Rail", value: 28 },
  { label: "Pet", value: 19 },
];

const shipments = [
  {
    eta: "09:40",
    lane: "Lagos -> Accra",
    owner: "Apex Agent",
    status: "In transit",
    value: "$18,420",
  },
  {
    eta: "11:15",
    lane: "Abuja -> Nairobi",
    owner: "Support desk",
    status: "Customs hold",
    value: "$7,880",
  },
  {
    eta: "14:05",
    lane: "Port Harcourt -> Cape Town",
    owner: "Freight desk",
    status: "Delivered",
    value: "$31,200",
  },
];

const palette = [
  ["Primary", "primary"],
  ["Accent", "accent"],
  ["Info", "info"],
  ["Success", "success"],
  ["Warning", "warning"],
  ["Danger", "destructive"],
  ["Surface", "surface"],
] as const;

const iconItems = [
  { icon: Truck, label: "Fleet" },
  { icon: Warehouse, label: "Warehouse" },
  { icon: Globe2, label: "Global" },
  { icon: Boxes, label: "Packages" },
  { icon: Clock3, label: "SLA" },
  { icon: CircleDollarSign, label: "Billing" },
  { icon: FileText, label: "Docs" },
  { icon: CheckCircle2, label: "Cleared" },
] as const;

export function DesignSystemWorkbench() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(true);

  return (
    <WorkspaceShell>
      <main id="main-content" className="page-gutter animate-fade-up mx-auto w-full max-w-7xl py-8">
        <div className="flex flex-col gap-6">
          <Breadcrumbs items={[{ label: "Design system" }]} />

          <section className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <Kicker>Premium Logistics UI</Kicker>
              <Display className="mt-3 max-w-4xl">Apex Global Logistics design system</Display>
              <Text className="mt-4 max-w-2xl">
                A durable operational interface kit for shipment control, freight visibility,
                customer support, and executive oversight.
              </Text>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button variant="accent">
                <Plus aria-hidden="true" />
                New shipment
              </Button>
              <Button variant="outline">
                <Filter aria-hidden="true" />
                Filter
              </Button>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <MetricChartCard
              data={trendData}
              delta="+12.4%"
              label="On-time deliveries"
              value="98.8%"
            />
            <MetricChartCard
              data={[...trendData].reverse()}
              delta="+8.1%"
              label="Freight utilization"
              value="82.6%"
            />
            <MetricChartCard
              data={trendData.slice(1)}
              delta="+4.7%"
              label="Support SLA"
              value="94.2%"
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="border-border bg-card text-card-foreground shadow-panel rounded-lg border p-5">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <Heading>Operations table</Heading>
                  <Text className="mt-1">Dense, scannable, and status-forward.</Text>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Search aria-hidden="true" />
                    Search
                  </Button>
                  <Button size="sm" variant="tonal">
                    Export
                  </Button>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lane</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((shipment) => (
                    <TableRow key={shipment.lane}>
                      <TableCell className="font-semibold">{shipment.lane}</TableCell>
                      <TableCell>{shipment.owner}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            shipment.status === "Delivered"
                              ? "success"
                              : shipment.status === "Customs hold"
                                ? "warning"
                                : "info"
                          }
                        >
                          {shipment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{shipment.eta}</TableCell>
                      <TableCell className="text-right font-semibold">{shipment.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="border-border bg-card text-card-foreground shadow-panel rounded-lg border p-5">
              <div className="mb-5">
                <Heading>Mode mix</Heading>
                <Text className="mt-1">Balanced use of route capacity.</Text>
              </div>
              <BarChart data={laneData} />
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <Badge variant="info">
                  <Plane aria-hidden="true" className="size-3.5" />
                  Air priority
                </Badge>
                <Badge variant="success">
                  <Truck aria-hidden="true" className="size-3.5" />
                  Road capacity
                </Badge>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <div className="border-border bg-card text-card-foreground shadow-panel rounded-lg border p-5">
              <Heading>Actions</Heading>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button>Primary</Button>
                <Button variant="accent">Accent</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="success">Success</Button>
                <Button variant="destructive">Danger</Button>
              </div>
              <div className="mt-5 flex gap-3">
                <Button size="icon" variant="outline">
                  <ShipWheel aria-hidden="true" />
                  <span className="sr-only">Route</span>
                </Button>
                <Button size="icon" variant="tonal">
                  <BellRing aria-hidden="true" />
                  <span className="sr-only">Notify</span>
                </Button>
                <Button size="icon" variant="accent">
                  <Send aria-hidden="true" />
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </div>

            <div className="border-border bg-card text-card-foreground shadow-panel rounded-lg border p-5">
              <Heading>Form controls</Heading>
              <div className="mt-5 space-y-4">
                <Field>
                  <Label htmlFor="reference">Shipment reference</Label>
                  <Input id="reference" placeholder="AGL-2026-0148" />
                  <FieldHint>Reference IDs stay readable in dense layouts.</FieldHint>
                </Field>
                <Field>
                  <Label htmlFor="mode">Transport mode</Label>
                  <Select id="mode" defaultValue="road">
                    <option value="road">Road freight</option>
                    <option value="air">Air cargo</option>
                    <option value="sea">Sea freight</option>
                  </Select>
                </Field>
                <Field>
                  <Label htmlFor="notes">Handling notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Temperature controlled, handoff requires signature."
                  />
                </Field>
              </div>
            </div>

            <div className="border-border bg-card text-card-foreground shadow-panel rounded-lg border p-5">
              <Heading>Dialogs</Heading>
              <Text className="mt-2">Native modal behavior with Apex surface styling.</Text>
              <Button className="mt-5" onClick={() => setIsDialogOpen(true)} variant="accent">
                Open dialog
              </Button>
              <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
                <DialogCloseButton onClick={() => setIsDialogOpen(false)} />
                <DialogHeader>
                  <DialogTitle>Release shipment hold</DialogTitle>
                  <DialogDescription>
                    Confirming releases the shipment back into the active dispatch queue.
                  </DialogDescription>
                </DialogHeader>
                <DialogContent>
                  <Notification title="Customs check complete" variant="success">
                    Clearance documents are attached to the shipment record.
                  </Notification>
                </DialogContent>
                <DialogFooter>
                  <Button onClick={() => setIsDialogOpen(false)} type="button" variant="outline">
                    Cancel
                  </Button>
                  <Button onClick={() => setIsDialogOpen(false)} type="button" variant="accent">
                    Release hold
                  </Button>
                </DialogFooter>
              </Dialog>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="border-border bg-card text-card-foreground shadow-panel rounded-lg border p-5">
              <Heading>Palette</Heading>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {palette.map(([label, token]) => (
                  <div
                    className="border-border bg-background flex items-center gap-3 rounded-md border p-3"
                    key={token}
                  >
                    <div
                      className="border-border size-10 rounded-md border"
                      style={{ background: colorTokens[token] }}
                    />
                    <div>
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="text-muted-foreground text-xs">var(--{token})</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-border bg-card text-card-foreground shadow-panel rounded-lg border p-5">
              <Heading>States</Heading>
              <div className="mt-5 space-y-4">
                {showNotification ? (
                  <Notification
                    onDismiss={() => setShowNotification(false)}
                    title="Warehouse sync complete"
                    variant="info"
                  >
                    214 inventory changes were reconciled across Lagos, Accra, and Nairobi.
                  </Notification>
                ) : null}
                <EmptyState
                  action={
                    <Button variant="outline">
                      <Archive aria-hidden="true" />
                      View archive
                    </Button>
                  }
                  description="No exceptions are waiting for review in this operational queue."
                  icon={PackageCheck}
                  title="All clear"
                />
                <div className="grid gap-3 sm:grid-cols-3">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_380px]">
            <div className="border-border bg-card text-card-foreground shadow-panel rounded-lg border p-5">
              <Heading>Icon language</Heading>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {iconItems.map((item) => (
                  <div
                    className="border-border bg-background rounded-md border p-4 text-center"
                    key={item.label}
                  >
                    <item.icon aria-hidden="true" className="text-accent mx-auto size-5" />
                    <p className="mt-2 text-sm font-medium">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-border bg-card text-card-foreground shadow-panel rounded-lg border p-5">
              <Heading>Spacing</Heading>
              <div className="mt-5 space-y-3">
                {Object.entries(spacingTokens).map(([name, value]) => (
                  <div className="grid grid-cols-[48px_1fr_56px] items-center gap-3" key={name}>
                    <span className="text-sm font-semibold">{name}</span>
                    <span className="bg-accent h-2 rounded-sm" style={{ width: value }} />
                    <span className="text-muted-foreground text-xs">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="border-border bg-primary text-primary-foreground shadow-panel rounded-lg border p-6">
            <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <Kicker className="text-primary-foreground/65">Responsive layout</Kicker>
                <Heading className="text-primary-foreground mt-2">
                  Ready for high-density operations screens
                </Heading>
                <p className="text-primary-foreground/72 mt-2 max-w-2xl text-sm leading-6">
                  The shell, tables, forms, notifications, and chart components collapse cleanly
                  from command-center desktop views into field-operator mobile screens.
                </p>
              </div>
              <Button variant="accent">
                Continue
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </section>
        </div>
      </main>
    </WorkspaceShell>
  );
}
