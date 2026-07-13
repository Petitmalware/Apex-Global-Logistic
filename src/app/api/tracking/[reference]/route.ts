import { NextResponse } from "next/server";

import { getPublicShipmentTrackingSnapshot } from "@/features/shipments/queries/shipment.queries";
import { getDatabaseUnavailableMessage, isDatabaseUnavailableError } from "@/lib/db-errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PublicTrackingContext = {
  params: Promise<{
    reference: string;
  }>;
};

export async function GET(_request: Request, { params }: PublicTrackingContext) {
  const { reference } = await params;
  let snapshot;

  try {
    snapshot = await getPublicShipmentTrackingSnapshot(decodeURIComponent(reference));
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ message: getDatabaseUnavailableMessage() }, { status: 503 });
    }

    throw error;
  }

  if (!snapshot) {
    return NextResponse.json({ message: "Shipment not found." }, { status: 404 });
  }

  return NextResponse.json({ snapshot });
}
