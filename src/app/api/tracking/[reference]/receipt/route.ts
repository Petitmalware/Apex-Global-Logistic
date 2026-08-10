import { NextResponse, type NextRequest } from "next/server";

import {
  getPublicShipmentTrackingAccess,
  getPublicShipmentTrackingSnapshot,
} from "@/features/shipments/queries/shipment.queries";
import { createPublicShipmentReceiptPdf } from "@/features/shipments/services/public-receipt-pdf.service";
import {
  PUBLIC_TRACKING_ACCESS_COOKIE_NAME,
  hasPublicTrackingAccess,
} from "@/features/shipments/services/public-tracking-access.service";
import { getDatabaseUnavailableMessage, isDatabaseUnavailableError } from "@/lib/db-errors";
import { isValidTimeZone } from "@/lib/time-zone";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PublicReceiptDownloadContext = {
  params: Promise<{
    reference: string;
  }>;
};

function getDownloadFileName(shipmentNumber: string) {
  const safeShipmentNumber = shipmentNumber.replace(/[^a-zA-Z0-9._-]/g, "-");

  return `apex-shipment-receipt-${safeShipmentNumber}.pdf`;
}

export async function GET(request: NextRequest, { params }: PublicReceiptDownloadContext) {
  const { reference } = await params;
  const decodedReference = decodeURIComponent(reference);
  const requestedTimeZone = request.nextUrl.searchParams.get("timeZone")?.trim() ?? "";
  const timeZone =
    requestedTimeZone && isValidTimeZone(requestedTimeZone) ? requestedTimeZone : "UTC";

  try {
    const access = await getPublicShipmentTrackingAccess(decodedReference);

    if (!access) {
      return NextResponse.json({ message: "Shipment not found." }, { status: 404 });
    }

    const includeSensitiveDetails =
      !access.publicTrackingPinRequired ||
      hasPublicTrackingAccess(
        request.cookies.get(PUBLIC_TRACKING_ACCESS_COOKIE_NAME)?.value,
        access.shipmentId,
      );

    if (!includeSensitiveDetails) {
      return NextResponse.json(
        { message: "Enter the recipient PIN on the tracking page before downloading the receipt." },
        { status: 403 },
      );
    }

    const snapshot = await getPublicShipmentTrackingSnapshot(decodedReference, {
      includeSensitiveDetails: true,
    });

    if (!snapshot) {
      return NextResponse.json({ message: "Shipment not found." }, { status: 404 });
    }

    const pdf = await createPublicShipmentReceiptPdf(snapshot, timeZone);

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${getDownloadFileName(snapshot.shipmentNumber)}"`,
        "Content-Type": "application/pdf",
        "X-Content-Type-Options": "nosniff",
      },
      status: 200,
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ message: getDatabaseUnavailableMessage() }, { status: 503 });
    }

    console.error("Public receipt download failed", {
      name: error instanceof Error ? error.name : typeof error,
    });

    return NextResponse.json(
      { message: "The receipt could not be generated. Please try again." },
      { status: 500 },
    );
  }
}
