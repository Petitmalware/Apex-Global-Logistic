import Link from "next/link";
import type { Route } from "next";
import {
  Activity,
  Boxes,
  Download,
  FileText,
  Pencil,
  Route as RouteIcon,
  Truck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  addFreightCargoItemAction,
  addFreightContainerAction,
  addFreightMachineryItemAction,
  addFreightRouteStopAction,
  addFreightTrackingEventAction,
  addFreightVehicleItemAction,
  updateFreightDispatchAction,
  uploadFreightDocumentAction,
} from "@/features/freight-transport/actions/freight-transport.actions";
import { FreightTransportStatusBadge } from "@/features/freight-transport/components/freight-transport-list";
import {
  CargoItemForm,
  FreightContainerForm,
  FreightDispatchForm,
  FreightDocumentForm,
  FreightTrackingEventForm,
  MachineryItemForm,
  RouteStopForm,
  VehicleCargoForm,
} from "@/features/freight-transport/components/freight-transport-record-forms";
import type {
  FreightDispatchOptions,
  FreightTransportDetail,
} from "@/features/freight-transport/types";
import { RealtimeShipmentTimeline } from "@/features/shipments/components/realtime-shipment-timeline";
import { ShipmentStatusBadge } from "@/features/shipments/components/shipment-list";

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function FactGrid({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div className="border-border bg-surface rounded-lg border p-4" key={item.label}>
          <p className="text-muted-foreground text-xs font-semibold uppercase">{item.label}</p>
          <p className="mt-2 font-semibold">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function Overview({ freightTransport }: { freightTransport: FreightTransportDetail }) {
  return (
    <section className="bg-primary text-primary-foreground shadow-panel overflow-hidden rounded-lg p-6 md:p-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <Badge className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground">
            {freightTransport.shipmentNumber}
          </Badge>
          <h2 className="mt-5 text-3xl font-semibold tracking-normal md:text-4xl">
            {freightTransport.routeName ?? "Long-haul freight"}
          </h2>
          <p className="text-primary-foreground/72 mt-3 max-w-2xl text-sm leading-6">
            {freightTransport.originCity} to {freightTransport.destinationCity} with cargo,
            containers, machinery, route assignments, dispatch, documents, ETA, and tracking in one
            operations record.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          <FreightTransportStatusBadge status={freightTransport.status} />
          <ShipmentStatusBadge status={freightTransport.shipmentStatus} />
          <Button
            asChild
            className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/15"
            variant="outline"
          >
            <Link href={`/shipments/${freightTransport.shipmentId}` as Route}>
              <Truck aria-hidden="true" />
              Shipment
            </Link>
          </Button>
          <Button asChild variant="accent">
            <Link href={`/freight-transport/${freightTransport.id}/edit` as Route}>
              <Pencil aria-hidden="true" />
              Edit freight
            </Link>
          </Button>
        </div>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Freight type", value: freightTransport.freightType },
          {
            label: "Gross weight",
            value: freightTransport.grossWeightKg
              ? `${freightTransport.grossWeightKg} kg`
              : "Not set",
          },
          { label: "ETA", value: formatDate(freightTransport.etaAt) },
          { label: "Driver", value: freightTransport.assignedDriver ?? "Unassigned" },
        ].map((item) => (
          <div
            className="border-primary-foreground/15 bg-primary-foreground/8 rounded-lg border p-4"
            key={item.label}
          >
            <p className="text-primary-foreground/60 text-xs font-semibold uppercase">
              {item.label}
            </p>
            <p className="mt-2 font-semibold">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FreightPlanCard({ freightTransport }: { freightTransport: FreightTransportDetail }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="bg-accent/15 text-accent-foreground grid size-10 place-items-center rounded-md">
          <Truck aria-hidden="true" className="size-5" />
        </div>
        <div>
          <CardTitle>Freight plan</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Commercial, compliance, and route planning context.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <FactGrid
          items={[
            { label: "Route code", value: freightTransport.routeCode ?? "Not set" },
            { label: "Service", value: freightTransport.serviceLevel ?? "Long-haul Freight" },
            { label: "Mode", value: freightTransport.mode },
            { label: "Priority", value: freightTransport.priority },
            {
              label: "Distance",
              value: freightTransport.distanceKm ? `${freightTransport.distanceKm} km` : "Not set",
            },
            { label: "Vehicle", value: freightTransport.assignedVehicle ?? "Unassigned" },
            { label: "Incoterm", value: freightTransport.incoterm ?? "Not set" },
            {
              label: "Hazmat",
              value: freightTransport.hazmatClass ?? freightTransport.unNumber ?? "No",
            },
            {
              label: "Temperature",
              value: freightTransport.refrigeratedRequired
                ? `${freightTransport.temperatureMinC ?? "?"} to ${freightTransport.temperatureMaxC ?? "?"} C`
                : "Ambient",
            },
          ]}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="font-semibold">Commodity</p>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              {freightTransport.commodityDescription ?? "No commodity description recorded."}
            </p>
          </div>
          <div>
            <p className="font-semibold">Special instructions</p>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              {freightTransport.specialInstructions ?? "No special instructions recorded."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CargoPanel({ freightTransport }: { freightTransport: FreightTransportDetail }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="bg-info/10 text-info grid size-10 place-items-center rounded-md">
          <Boxes aria-hidden="true" className="size-5" />
        </div>
        <div>
          <CardTitle>Cargo and equipment</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Cargo items, containers, machinery, and transported vehicles.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold">Containers</h3>
          <div className="mt-3 space-y-3">
            {freightTransport.containers.length ? (
              freightTransport.containers.map((container) => (
                <div className="border-border rounded-lg border p-3" key={container.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{container.containerNumber}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {container.containerType ?? "Container"} - seal{" "}
                        {container.sealNumber ?? "not set"}
                      </p>
                    </div>
                    <Badge variant="outline">{container.status.replaceAll("_", " ")}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No containers assigned yet.</p>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Cargo items</h3>
          <div className="mt-3 space-y-3">
            {freightTransport.cargoItems.length ? (
              freightTransport.cargoItems.map((cargo) => (
                <div className="border-border rounded-lg border p-3" key={cargo.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{cargo.description}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {cargo.quantity} {cargo.unit}
                        {cargo.weightKg ? ` - ${cargo.weightKg} kg` : ""}
                        {cargo.containerNumber ? ` - ${cargo.containerNumber}` : ""}
                      </p>
                    </div>
                    <Badge variant={cargo.hazardous ? "danger" : "outline"}>
                      {cargo.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No cargo items added yet.</p>
            )}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">Machinery</h3>
            <div className="mt-3 space-y-3">
              {freightTransport.machineryItems.length ? (
                freightTransport.machineryItems.map((item) => (
                  <div className="border-border rounded-lg border p-3" key={item.id}>
                    <p className="font-semibold">{item.machine}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {item.operatingWeightKg ? `${item.operatingWeightKg} kg` : "Weight pending"}
                      {item.oversizePermitRequired ? " - permit required" : ""}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No machinery recorded.</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Transported vehicles</h3>
            <div className="mt-3 space-y-3">
              {freightTransport.vehicleItems.length ? (
                freightTransport.vehicleItems.map((item) => (
                  <div className="border-border rounded-lg border p-3" key={item.id}>
                    <p className="font-semibold">{item.vehicle}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {item.vin ?? item.plateNumber ?? "Identifier pending"} -{" "}
                      {item.operable ? "operable" : "non-operable"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No vehicle cargo recorded.</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RoutePanel({ freightTransport }: { freightTransport: FreightTransportDetail }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="bg-warning/15 text-warning-foreground grid size-10 place-items-center rounded-md">
          <RouteIcon aria-hidden="true" className="size-5" />
        </div>
        <div>
          <CardTitle>Route assignment</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Sequenced long-haul stops with planned and actual handoff times.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {freightTransport.routeStops.length ? (
          freightTransport.routeStops.map((stop) => (
            <div className="flex gap-4" key={stop.id}>
              <div className="flex flex-col items-center">
                <span className="bg-accent grid size-7 place-items-center rounded-full text-xs font-bold text-white">
                  {stop.sequence}
                </span>
                <span className="bg-border mt-2 h-full w-px" />
              </div>
              <div className="min-w-0 flex-1 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{stop.name}</p>
                  <Badge variant="outline">{stop.stopType.replaceAll("_", " ")}</Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {[stop.city, stop.countryCode].filter(Boolean).join(", ") || "Location pending"}
                </p>
                <p className="text-muted-foreground mt-2 text-xs">
                  Arrive {formatDate(stop.plannedArrivalAt)} - depart{" "}
                  {formatDate(stop.plannedDepartureAt)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">No route stops assigned yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

function DocumentsPanel({ freightTransport }: { freightTransport: FreightTransportDetail }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="bg-secondary text-secondary-foreground grid size-10 place-items-center rounded-md">
          <FileText aria-hidden="true" className="size-5" />
        </div>
        <div>
          <CardTitle>Freight documents</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Bill of lading, permits, customs, invoice, and delivery proof files.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {freightTransport.documents.length ? (
          freightTransport.documents.map((document) => (
            <div className="border-border rounded-lg border p-3" key={document.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{document.fileName}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {document.documentType.replaceAll("_", " ")} -{" "}
                    {formatFileSize(document.fileSizeBytes)}
                  </p>
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link
                    href={
                      `/freight-transport/${freightTransport.id}/documents/${document.id}` as Route
                    }
                  >
                    <Download aria-hidden="true" />
                    Open
                  </Link>
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">No freight documents uploaded yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

function TimelinePanel({ freightTransport }: { freightTransport: FreightTransportDetail }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="bg-accent/15 text-accent-foreground grid size-10 place-items-center rounded-md">
          <Activity aria-hidden="true" className="size-5" />
        </div>
        <div>
          <CardTitle>Tracking</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Freight operational events followed by the linked shipment timeline.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {freightTransport.trackingEvents.length ? (
            freightTransport.trackingEvents.map((event) => (
              <div className="flex gap-4" key={event.id}>
                <div className="flex flex-col items-center">
                  <span className="bg-accent size-3 rounded-full" />
                  <span className="bg-border mt-2 h-full w-px" />
                </div>
                <div className="min-w-0 flex-1 pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{event.eventType.replaceAll("_", " ")}</p>
                    {event.status ? (
                      <Badge variant="outline">{event.status.replaceAll("_", " ")}</Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatDate(event.occurredAt)}
                    {event.location ? ` - ${event.location}` : ""}
                  </p>
                  {event.message ? <p className="mt-2 text-sm leading-6">{event.message}</p> : null}
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No freight tracking events yet.</p>
          )}
        </div>
        <div className="border-border border-t pt-5">
          <h3 className="mb-3 text-sm font-semibold">Shipment timeline</h3>
          <RealtimeShipmentTimeline
            initialTimeline={freightTransport.shipmentTimeline}
            shipmentId={freightTransport.shipmentId}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function RecordForms({
  dispatchOptions,
  freightTransport,
}: {
  dispatchOptions: FreightDispatchOptions;
  freightTransport: FreightTransportDetail;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dispatch assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <FreightDispatchForm
            action={updateFreightDispatchAction.bind(null, freightTransport.id)}
            options={dispatchOptions}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Add cargo</CardTitle>
        </CardHeader>
        <CardContent>
          <CargoItemForm
            action={addFreightCargoItemAction.bind(null, freightTransport.id)}
            containers={freightTransport.containers}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Add container</CardTitle>
        </CardHeader>
        <CardContent>
          <FreightContainerForm
            action={addFreightContainerAction.bind(null, freightTransport.id)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Add machinery</CardTitle>
        </CardHeader>
        <CardContent>
          <MachineryItemForm
            action={addFreightMachineryItemAction.bind(null, freightTransport.id)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Add vehicle cargo</CardTitle>
        </CardHeader>
        <CardContent>
          <VehicleCargoForm action={addFreightVehicleItemAction.bind(null, freightTransport.id)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Add route stop</CardTitle>
        </CardHeader>
        <CardContent>
          <RouteStopForm action={addFreightRouteStopAction.bind(null, freightTransport.id)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Upload document</CardTitle>
        </CardHeader>
        <CardContent>
          <FreightDocumentForm
            action={uploadFreightDocumentAction.bind(null, freightTransport.id)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Add tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <FreightTrackingEventForm
            action={addFreightTrackingEventAction.bind(null, freightTransport.id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function FreightTransportDetailView({
  dispatchOptions,
  freightTransport,
}: {
  dispatchOptions: FreightDispatchOptions;
  freightTransport: FreightTransportDetail;
}) {
  return (
    <div className="space-y-6">
      <Overview freightTransport={freightTransport} />
      <FreightPlanCard freightTransport={freightTransport} />
      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <CargoPanel freightTransport={freightTransport} />
          <RoutePanel freightTransport={freightTransport} />
          <DocumentsPanel freightTransport={freightTransport} />
          <TimelinePanel freightTransport={freightTransport} />
        </div>
        <RecordForms dispatchOptions={dispatchOptions} freightTransport={freightTransport} />
      </div>
    </div>
  );
}
