import { NextResponse } from "next/server";

import { getPublicShipmentTrackingSnapshot } from "@/features/shipments/queries/shipment.queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PublicTrackingContext = {
  params: Promise<{
    reference: string;
  }>;
};

export async function GET(_request: Request, { params }: PublicTrackingContext) {
  const { reference } = await params;
  const snapshot = await getPublicShipmentTrackingSnapshot(decodeURIComponent(reference));

  if (!snapshot) {
    return NextResponse.json({ message: "Shipment not found." }, { status: 404 });
  }

  return NextResponse.json({ snapshot });
}
