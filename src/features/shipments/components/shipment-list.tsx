import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, PackageSearch, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatShipmentStatus } from "@/features/shipments/status-labels";
import type { ShipmentListItem } from "@/features/shipments/types";

const statusVariant = {
  BOOKED: "info",
  CANCELLED: "danger",
  DELIVERED: "success",
  DRAFT: "neutral",
  HELD: "warning",
  IN_TRANSIT: "accent",
  PENDING_PICKUP: "warning",
  RETURNED: "neutral",
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ShipmentStatusBadge({ status }: { status: ShipmentListItem["status"] }) {
  return <Badge variant={statusVariant[status]}>{formatShipmentStatus(status)}</Badge>;
}

export function ShipmentList({
  canCreate = false,
  shipments,
}: {
  canCreate?: boolean;
  shipments: ShipmentListItem[];
}) {
  if (!shipments.length) {
    return (
      <EmptyState
        action={
          canCreate ? (
            <Button asChild variant="accent">
              <Link href={"/shipments/new" as Route}>
                <Plus aria-hidden="true" />
                Create shipment
              </Link>
            </Button>
          ) : undefined
        }
        description={
          canCreate
            ? "Create the first shipment to start tracking packages, documents, status events, and shipment history."
            : "Shipments assigned to your customer account will appear here after the Apex team creates them."
        }
        icon={PackageSearch}
        title={canCreate ? "No shipments yet" : "No assigned shipments yet"}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tracking number</TableHead>
          <TableHead>Lane</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Packages</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="text-right">Open</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shipments.map((shipment) => (
          <TableRow key={shipment.id}>
            <TableCell>
              <div>
                <p className="font-semibold">{shipment.shipmentNumber}</p>
                <p className="text-muted-foreground text-xs">
                  {shipment.referenceNumber ?? shipment.priority}
                </p>
                {shipment.recipientEmail ? (
                  <p className="text-muted-foreground text-xs">
                    Recipient: {shipment.recipientName ?? shipment.recipientEmail}
                  </p>
                ) : null}
              </div>
            </TableCell>
            <TableCell>
              {shipment.originCity} to {shipment.destinationCity}
              <p className="text-muted-foreground text-xs">{shipment.mode}</p>
            </TableCell>
            <TableCell>
              <ShipmentStatusBadge status={shipment.status} />
            </TableCell>
            <TableCell>{shipment.packageCount}</TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(shipment.updatedAt)}
            </TableCell>
            <TableCell className="text-right">
              <Button asChild size="sm" variant="ghost">
                <Link href={`/shipments/${shipment.id}` as Route}>
                  View
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
