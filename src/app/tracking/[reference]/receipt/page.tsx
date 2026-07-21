import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicShipmentReceipt } from "@/features/shipments/components/public-shipment-receipt";
import { getPublicShipmentTrackingSnapshot } from "@/features/shipments/queries/shipment.queries";

type PublicReceiptPageProps = {
  params: Promise<{
    reference: string;
  }>;
};

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Shipment Receipt | Apex Global Logistics",
};

export default async function PublicReceiptPage({ params }: PublicReceiptPageProps) {
  const { reference } = await params;
  const shipment = await getPublicShipmentTrackingSnapshot(reference);

  if (!shipment) {
    notFound();
  }

  return <PublicShipmentReceipt snapshot={shipment} />;
}
