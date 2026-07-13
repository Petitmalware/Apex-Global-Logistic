import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  ClipboardCheck,
  CreditCard,
  MapPinned,
  PackageSearch,
  PawPrint,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Notification } from "@/components/ui/notification";
import type { InvoiceListItem } from "@/features/invoices/types/invoice.types";
import type { PetTransportListItem } from "@/features/pet-transport/types";
import { formatPetTransportStatus, formatShipmentStatus } from "@/features/shipments/status-labels";
import type { ShipmentDocumentListItem, ShipmentListItem } from "@/features/shipments/types";

type CustomerPortalDashboardProps = {
  documents: ShipmentDocumentListItem[];
  invoices: InvoiceListItem[];
  petTransports: PetTransportListItem[];
  shipments: ShipmentListItem[];
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMoney(value: string | number, currency = "USD") {
  return new Intl.NumberFormat("en", {
    currency,
    style: "currency",
  }).format(Number(value));
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof PackageSearch;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          <CardTitle className="mt-2 text-3xl">{value}</CardTitle>
        </div>
        <div className="bg-accent/15 text-accent-foreground grid size-11 place-items-center rounded-md">
          <Icon aria-hidden="true" className="size-5" />
        </div>
      </CardHeader>
    </Card>
  );
}

export function CustomerPortalDashboard({
  documents,
  invoices,
  petTransports,
  shipments,
}: CustomerPortalDashboardProps) {
  const activeShipments = shipments.filter(
    (shipment) => !["CANCELLED", "DELIVERED", "RETURNED"].includes(shipment.status),
  );
  const activePetTransports = petTransports.filter(
    (petTransport) => !["CANCELLED", "DELIVERED"].includes(petTransport.status),
  );
  const openInvoices = invoices.filter((invoice) => !["PAID", "VOID"].includes(invoice.status));
  const latestShipment = shipments[0] ?? null;

  return (
    <div className="space-y-6">
      <section className="bg-primary text-primary-foreground shadow-panel overflow-hidden rounded-lg p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Badge className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground">
              Customer portal
            </Badge>
            <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-normal md:text-4xl">
              Shipments, pet movements, invoices, and documents in one place.
            </h2>
            <p className="text-primary-foreground/72 mt-3 max-w-2xl text-sm leading-6">
              Track assigned shipments, review transportation documents, and open billing records
              created by Apex operations.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Button asChild variant="accent">
              <Link href={"/shipments" as Route}>
                <PackageSearch aria-hidden="true" />
                Track shipments
              </Link>
            </Button>
            <Button
              asChild
              className="border-primary-foreground/25 bg-primary-foreground/8"
              variant="outline"
            >
              <Link href={"/customer/documents" as Route}>View documents</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={PackageSearch}
          label="Active shipments"
          value={String(activeShipments.length)}
        />
        <MetricCard
          icon={PawPrint}
          label="Pet shipments"
          value={String(activePetTransports.length)}
        />
        <MetricCard icon={CreditCard} label="Open invoices" value={String(openInvoices.length)} />
        <MetricCard icon={ClipboardCheck} label="Documents" value={String(documents.length)} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Latest shipments</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                Most recent shipment records assigned to your account.
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href={"/shipments" as Route}>All shipments</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {shipments.slice(0, 4).map((shipment) => (
              <Link
                className="border-border hover:bg-secondary/60 flex items-center justify-between gap-4 rounded-lg border p-4 transition-colors"
                href={`/shipments/${shipment.id}` as Route}
                key={shipment.id}
              >
                <div className="min-w-0">
                  <p className="font-semibold">{shipment.shipmentNumber}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {shipment.originCity} to {shipment.destinationCity}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge variant="outline">{formatShipmentStatus(shipment.status)}</Badge>
                  <ArrowRight aria-hidden="true" className="text-muted-foreground size-4" />
                </div>
              </Link>
            ))}
            {!shipments.length ? (
              <p className="text-muted-foreground text-sm">
                No shipments have been assigned to your customer account yet.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Notification
            action={
              latestShipment ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/shipments/${latestShipment.id}` as Route}>
                    Open latest shipment
                  </Link>
                </Button>
              ) : null
            }
            title={latestShipment ? "Latest shipment update" : "Tracking ready"}
            variant={latestShipment ? "info" : "success"}
          >
            {latestShipment
              ? `${latestShipment.shipmentNumber} is ${formatShipmentStatus(
                  latestShipment.status,
                ).toLowerCase()} as of ${formatDate(latestShipment.updatedAt)}.`
              : "Once Apex creates a shipment for your account, tracking and documents will appear here."}
          </Notification>

          <Card>
            <CardHeader>
              <CardTitle>Pet shipment visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {petTransports.slice(0, 3).map((petTransport) => (
                <Link
                  className="border-border hover:bg-secondary/60 flex items-center justify-between gap-4 rounded-lg border p-3 transition-colors"
                  href={`/pet-transport/${petTransport.id}` as Route}
                  key={petTransport.id}
                >
                  <div>
                    <p className="font-semibold">{petTransport.petName ?? "Pet shipment"}</p>
                    <p className="text-muted-foreground text-xs">
                      {petTransport.shipmentNumber} - {petTransport.originCity} to{" "}
                      {petTransport.destinationCity}
                    </p>
                  </div>
                  <Badge variant="outline">{formatPetTransportStatus(petTransport.status)}</Badge>
                </Link>
              ))}
              {!petTransports.length ? (
                <p className="text-muted-foreground text-sm">No pet shipments assigned yet.</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing and proof documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {openInvoices.slice(0, 3).map((invoice) => (
                <Link
                  className="border-border hover:bg-secondary/60 flex items-center justify-between gap-4 rounded-lg border p-3 transition-colors"
                  href={`/invoices/${invoice.id}` as Route}
                  key={invoice.id}
                >
                  <div>
                    <p className="font-semibold">{invoice.invoiceNumber}</p>
                    <p className="text-muted-foreground text-xs">{formatDate(invoice.dueDate)}</p>
                  </div>
                  <span className="font-semibold">
                    {formatMoney(invoice.total, invoice.currency)}
                  </span>
                </Link>
              ))}
              {!openInvoices.length ? (
                <p className="text-muted-foreground text-sm">No open invoices at the moment.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Public tracking lookup</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              Registered and unregistered recipients can use a tracking code to see shipment status.
            </p>
          </div>
          <MapPinned aria-hidden="true" className="text-accent size-5" />
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href={"/tracking" as Route}>Open public tracking</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
