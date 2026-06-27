import Link from "next/link";
import type { Route } from "next";
import { PawPrint } from "lucide-react";

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
import type { PetTransportListItem } from "@/features/pet-transport/types";

const statusVariant = {
  CANCELLED: "danger",
  CLEARED: "success",
  DELIVERED: "success",
  DOCUMENTATION_PENDING: "warning",
  IN_TRANSIT: "accent",
  REQUESTED: "outline",
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PetTransportStatusBadge({ status }: { status: PetTransportListItem["status"] }) {
  return <Badge variant={statusVariant[status]}>{status.replaceAll("_", " ")}</Badge>;
}

export function PetTransportList({ petTransports }: { petTransports: PetTransportListItem[] }) {
  if (petTransports.length === 0) {
    return (
      <div className="border-border bg-card shadow-panel rounded-lg border p-8 text-center">
        <div className="bg-accent/15 text-accent-foreground mx-auto grid size-12 place-items-center rounded-md">
          <PawPrint aria-hidden="true" className="size-6" />
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-normal">No pet transports yet</h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-6">
          Create a pet transport to manage profile records, travel documents, crate handling,
          feeding, temperature, photos, and shipment tracking.
        </p>
        <Button asChild className="mt-5" variant="accent">
          <Link href={"/pet-transport/new" as Route}>Book pet transport</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="border-border bg-card shadow-panel overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pet</TableHead>
            <TableHead>Shipment</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {petTransports.map((petTransport) => (
            <TableRow key={petTransport.id}>
              <TableCell>
                <div className="font-semibold">{petTransport.petName ?? "Unnamed pet"}</div>
                <div className="text-muted-foreground text-xs">
                  {petTransport.species}
                  {petTransport.breed ? ` - ${petTransport.breed}` : ""}
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs">{petTransport.shipmentNumber}</TableCell>
              <TableCell>
                {petTransport.originCity} to {petTransport.destinationCity}
              </TableCell>
              <TableCell>
                <PetTransportStatusBadge status={petTransport.status} />
              </TableCell>
              <TableCell>{formatDate(petTransport.updatedAt)}</TableCell>
              <TableCell className="text-right">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/pet-transport/${petTransport.id}` as Route}>Open</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
