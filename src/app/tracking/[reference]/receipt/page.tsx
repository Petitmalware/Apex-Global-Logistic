import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { PublicShipmentReceipt } from "@/features/shipments/components/public-shipment-receipt";
import {
  getPublicShipmentTrackingAccess,
  getPublicShipmentTrackingSnapshot,
} from "@/features/shipments/queries/shipment.queries";
import {
  PUBLIC_TRACKING_ACCESS_COOKIE_NAME,
  hasPublicTrackingAccess,
} from "@/features/shipments/services/public-tracking-access.service";

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
  const access = await getPublicShipmentTrackingAccess(reference);

  if (!access) {
    notFound();
  }

  const cookieStore = await cookies();
  const includeSensitiveDetails =
    !access.publicTrackingPinRequired ||
    hasPublicTrackingAccess(
      cookieStore.get(PUBLIC_TRACKING_ACCESS_COOKIE_NAME)?.value,
      access.shipmentId,
    );
  const shipment = await getPublicShipmentTrackingSnapshot(reference, { includeSensitiveDetails });

  if (!shipment) {
    notFound();
  }

  return <PublicShipmentReceipt snapshot={shipment} />;
}
