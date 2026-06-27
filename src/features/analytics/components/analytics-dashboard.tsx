import {
  BadgeDollarSign,
  BrainCircuit,
  ChartNoAxesCombined,
  Clock3,
  Gauge,
  PackageCheck,
  PawPrint,
  Plane,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, MetricChartCard, SparklineChart } from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  AnalyticsBreakdownItem,
  AnalyticsDashboardData,
  AnalyticsMetric,
  AnalyticsTone,
} from "@/features/analytics/types";
import { cn } from "@/lib/utils";

const metricIcons = [BadgeDollarSign, PackageCheck, Gauge, Users] as const;

const metricToneClass = {
  accent: "bg-accent/15 text-accent-foreground",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground",
} satisfies Record<AnalyticsTone, string>;

const badgeVariantByTone = {
  accent: "accent",
  danger: "danger",
  info: "info",
  success: "success",
  warning: "warning",
} as const satisfies Record<AnalyticsTone, "accent" | "danger" | "info" | "success" | "warning">;

function formatMoney(value: number) {
  return new Intl.NumberFormat("en", {
    currency: "USD",
    maximumFractionDigits: 0,
    notation: value >= 1000000 ? "compact" : "standard",
    style: "currency",
  }).format(value);
}

function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits,
  }).format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function MetricGrid({ metrics }: { metrics: AnalyticsMetric[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric, index) => {
        const Icon = metricIcons[index] ?? ChartNoAxesCombined;

        return (
          <Card key={metric.label}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <p className="text-muted-foreground text-sm font-medium">{metric.label}</p>
                <CardTitle className="mt-2 text-3xl">{metric.value}</CardTitle>
              </div>
              <div
                className={cn(
                  "grid size-11 place-items-center rounded-md",
                  metricToneClass[metric.tone],
                )}
              >
                <Icon aria-hidden="true" className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={badgeVariantByTone[metric.tone]}>{metric.delta}</Badge>
                <p className="text-muted-foreground text-sm leading-5">{metric.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

function AnalyticsHero({ data }: { data: AnalyticsDashboardData }) {
  return (
    <section className="border-border bg-card shadow-panel overflow-hidden rounded-lg border">
      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_22rem] lg:p-7">
        <div>
          <Badge variant="accent">
            <ChartNoAxesCombined aria-hidden="true" className="size-3.5" />
            {data.periodLabel}
          </Badge>
          <h2 className="mt-4 max-w-3xl text-3xl leading-tight font-semibold tracking-normal md:text-4xl">
            Executive analytics for network growth, performance, and operational risk
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-6">
            Revenue, shipments, delivery health, customer growth, freight, pet transport, warehouse
            load, driver output, and AI-generated management insights in one place.
          </p>
        </div>
        <div className="border-border bg-surface rounded-lg border p-4">
          <p className="text-muted-foreground text-sm font-medium">Reporting snapshot</p>
          <p className="mt-2 text-2xl font-semibold">{formatMoney(data.revenue.paid)}</p>
          <p className="text-muted-foreground mt-1 text-sm">paid revenue in window</p>
          <div className="mt-4">
            <SparklineChart data={data.revenue.trend} />
          </div>
        </div>
      </div>
    </section>
  );
}

function BreakdownList({ data, title }: { data: AnalyticsBreakdownItem[]; title: string }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-3 grid gap-3">
        {data.length ? (
          data.slice(0, 6).map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground truncate">
                  {item.label.replaceAll("_", " ")}
                </span>
                <span className="font-semibold">{formatNumber(item.value)}</span>
              </div>
              <div className="bg-secondary h-2 rounded-sm">
                <div
                  className="bg-primary h-full rounded-sm"
                  style={{ width: `${Math.max((item.value / max) * 100, 5)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">No data recorded yet.</p>
        )}
      </div>
    </div>
  );
}

function DeliveryPerformance({ data }: { data: AnalyticsDashboardData }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock3 aria-hidden="true" className="text-primary size-5" />
          <CardTitle>Delivery performance</CardTitle>
        </div>
        <CardDescription>
          On-time execution, status mix, transport mode, and delay exposure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["On-time", formatPercent(data.deliveryPerformance.onTimeRate)],
            ["Delivered", formatNumber(data.deliveryPerformance.deliveredShipments)],
            ["Delayed", formatNumber(data.deliveryPerformance.delayedShipments)],
            ["Avg transit", `${formatNumber(data.deliveryPerformance.averageTransitHours, 1)}h`],
          ].map(([label, value]) => (
            <div className="border-border bg-surface rounded-lg border p-4" key={label}>
              <p className="text-muted-foreground text-sm">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <BreakdownList data={data.deliveryPerformance.statusBreakdown} title="Shipment status" />
          <BreakdownList data={data.deliveryPerformance.modeBreakdown} title="Mode split" />
        </div>
      </CardContent>
    </Card>
  );
}

function FreightAndPetMetrics({ data }: { data: AnalyticsDashboardData }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck aria-hidden="true" className="text-primary size-5" />
            <CardTitle>Freight metrics</CardTitle>
          </div>
          <CardDescription>
            Long-haul freight volume, equipment, documents, and cold chain load.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="border-border bg-surface rounded-lg border p-4">
              <p className="text-muted-foreground text-sm">Active</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatNumber(data.freightMetrics.activeTransports)}
              </p>
            </div>
            <div className="border-border bg-surface rounded-lg border p-4">
              <p className="text-muted-foreground text-sm">Weight</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatNumber(data.freightMetrics.totalWeightKg)}kg
              </p>
            </div>
            <div className="border-border bg-surface rounded-lg border p-4">
              <p className="text-muted-foreground text-sm">Containers</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatNumber(data.freightMetrics.containers)}
              </p>
            </div>
          </div>
          <div className="mt-5">
            <BarChart data={data.freightMetrics.trend} />
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <BreakdownList data={data.freightMetrics.statusBreakdown} title="Freight status" />
            <BreakdownList data={data.freightMetrics.typeBreakdown} title="Freight type" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PawPrint aria-hidden="true" className="text-primary size-5" />
            <CardTitle>Pet transportation</CardTitle>
          </div>
          <CardDescription>
            Pet movement volume, clearance quality, documentation, and species mix.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="border-border bg-surface rounded-lg border p-4">
              <p className="text-muted-foreground text-sm">Active pets</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatNumber(data.petTransportStats.activePets)}
              </p>
            </div>
            <div className="border-border bg-surface rounded-lg border p-4">
              <p className="text-muted-foreground text-sm">Health clear</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatPercent(data.petTransportStats.healthClearanceRate)}
              </p>
            </div>
            <div className="border-border bg-surface rounded-lg border p-4">
              <p className="text-muted-foreground text-sm">Avg weight</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatNumber(data.petTransportStats.averageWeightKg, 1)}kg
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <BreakdownList data={data.petTransportStats.statusBreakdown} title="Pet status" />
            <BreakdownList data={data.petTransportStats.speciesBreakdown} title="Species" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WarehouseAndDriverTables({ data }: { data: AnalyticsDashboardData }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Warehouse aria-hidden="true" className="text-primary size-5" />
            <CardTitle>Warehouse utilization</CardTitle>
          </div>
          <CardDescription>
            Current hub load estimated from active shipment, driver, and vehicle capacity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Load</TableHead>
                <TableHead>Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.warehouseUtilization.map((warehouse) => (
                <TableRow key={warehouse.name}>
                  <TableCell className="font-medium">{warehouse.name}</TableCell>
                  <TableCell>
                    <Badge variant={warehouse.status === "ACTIVE" ? "success" : "warning"}>
                      {warehouse.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {warehouse.activeShipments} shipments / {warehouse.vehicles} vehicles
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="bg-secondary h-2 w-24 rounded-sm">
                        <div
                          className="bg-info h-full rounded-sm"
                          style={{ width: `${Math.max(warehouse.utilizationRate, 4)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">
                        {formatPercent(warehouse.utilizationRate)}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plane aria-hidden="true" className="text-primary size-5" />
            <CardTitle>Driver performance</CardTitle>
          </div>
          <CardDescription>
            Driver assignments, delivery output, on-time rate, and exception volume.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>On-time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.driverPerformance.map((driver) => (
                <TableRow key={driver.name}>
                  <TableCell className="font-medium">{driver.name}</TableCell>
                  <TableCell>
                    <Badge variant={driver.status === "AVAILABLE" ? "success" : "neutral"}>
                      {driver.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {driver.assignedShipments} total / {driver.activeShipments} active
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatPercent(driver.onTimeRate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function AiInsights({ data }: { data: AnalyticsDashboardData }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BrainCircuit aria-hidden="true" className="text-primary size-5" />
          <CardTitle>AI-generated insights</CardTitle>
        </div>
        <CardDescription>
          Generated by {data.aiInsights.provider} / {data.aiInsights.model}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.aiInsights.insights.map((insight) => (
            <div className="border-border bg-surface rounded-lg border p-4" key={insight.title}>
              <Badge variant={badgeVariantByTone[insight.tone]}>{insight.title}</Badge>
              <p className="text-muted-foreground mt-3 text-sm leading-6">{insight.body}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsDashboard({ data }: { data: AnalyticsDashboardData }) {
  return (
    <div className="space-y-6">
      <AnalyticsHero data={data} />
      <MetricGrid metrics={data.metrics} />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <MetricChartCard
          data={data.shipmentAnalytics.trend}
          delta={`${formatNumber(data.shipmentAnalytics.activeShipments)} active`}
          label="Shipment volume"
          value={`${formatNumber(data.shipmentAnalytics.totalShipments)} shipments`}
        />
        <MetricChartCard
          data={data.customerGrowth.trend}
          delta={`${formatNumber(data.customerGrowth.totalCustomers)} total customers`}
          label="Customer growth"
          value={`${formatNumber(data.customerGrowth.newCustomers)} new`}
        />
      </div>
      <DeliveryPerformance data={data} />
      <FreightAndPetMetrics data={data} />
      <WarehouseAndDriverTables data={data} />
      <AiInsights data={data} />
    </div>
  );
}
