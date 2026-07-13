import Link from "next/link";
import type { Route } from "next";
import { Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FreightTransportListItem } from "@/features/freight-transport/types";

const statusVariant = {
  ASSIGNED: "info",
  CANCELLED: "danger",
  DELIVERED: "success",
  IN_TRANSIT: "accent",
  LOADING: "warning",
  ON_HOLD: "warning",
  PLANNED: "neutral",
  REQUESTED: "outline",
} as const;

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function FreightTransportStatusBadge({
  status,
}: {
  status: FreightTransportListItem["status"];
}) {
  return <Badge variant={statusVariant[status]}>{status.replaceAll("_", " ")}</Badge>;
}

export function FreightTransportList({
  canCreate = false,
  freightTransports,
}: {
  canCreate?: boolean;
  freightTransports: FreightTransportListItem[];
}) {
  if (freightTransports.length === 0) {
    return (
      <div className="border-border bg-card shadow-panel rounded-lg border p-8 text-center">
        <div className="bg-accent/15 text-accent-foreground mx-auto grid size-12 place-items-center rounded-md">
          <Truck aria-hidden="true" className="size-6" />
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-normal">
          {canCreate ? "No freight transports yet" : "No assigned freight transports yet"}
        </h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-6">
          {canCreate
            ? "Create a long-haul freight booking to manage cargo, containers, machinery, transported vehicles, route stops, dispatch, documents, ETA, and tracking."
            : "Freight movements assigned to your customer account will appear here after the Apex team creates them."}
        </p>
        {canCreate ? (
          <Button asChild className="mt-5" variant="accent">
            <Link href={"/freight-transport/new" as Route}>Book freight</Link>
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="border-border bg-card shadow-panel overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Shipment</TableHead>
            <TableHead>Lane</TableHead>
            <TableHead>Freight</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>ETA</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {freightTransports.map((freightTransport) => (
            <TableRow key={freightTransport.id}>
              <TableCell>
                <div className="font-mono text-xs">{freightTransport.shipmentNumber}</div>
                <div className="text-muted-foreground text-xs">
                  {freightTransport.routeName ?? "Unassigned route"}
                </div>
              </TableCell>
              <TableCell>
                {freightTransport.originCity} to {freightTransport.destinationCity}
              </TableCell>
              <TableCell>
                <div className="font-semibold">{freightTransport.freightType}</div>
                <div className="text-muted-foreground text-xs">
                  {freightTransport.grossWeightKg
                    ? `${freightTransport.grossWeightKg} kg`
                    : "Weight pending"}
                </div>
              </TableCell>
              <TableCell>
                <FreightTransportStatusBadge status={freightTransport.status} />
              </TableCell>
              <TableCell>{formatDate(freightTransport.etaAt)}</TableCell>
              <TableCell className="text-right">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/freight-transport/${freightTransport.id}` as Route}>Open</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
