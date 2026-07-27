import { NextResponse, type NextRequest } from "next/server";

import {
  getPublicShipmentTrackingAccess,
  getPublicShipmentTrackingSnapshot,
} from "@/features/shipments/queries/shipment.queries";
import {
  PUBLIC_TRACKING_ACCESS_COOKIE_NAME,
  hasPublicTrackingAccess,
  setPublicTrackingAccessCookie,
} from "@/features/shipments/services/public-tracking-access.service";
import { verifyPassword } from "@/lib/auth/password";
import { getDatabaseUnavailableMessage, isDatabaseUnavailableError } from "@/lib/db-errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PublicTrackingContext = {
  params: Promise<{
    reference: string;
  }>;
};

export async function GET(request: NextRequest, { params }: PublicTrackingContext) {
  const { reference } = await params;
  const decodedReference = decodeURIComponent(reference);
  const suppliedPin = request.nextUrl.searchParams.get("pin")?.trim();

  try {
    const access = await getPublicShipmentTrackingAccess(decodedReference);

    if (!access) {
      return NextResponse.json({ message: "Shipment not found." }, { status: 404 });
    }

    let includeSensitiveDetails =
      !access.publicTrackingPinRequired ||
      hasPublicTrackingAccess(
        request.cookies.get(PUBLIC_TRACKING_ACCESS_COOKIE_NAME)?.value,
        access.shipmentId,
      );
    let pinError: string | null = null;

    if (!includeSensitiveDetails && suppliedPin) {
      if (
        access.publicTrackingPinHash &&
        verifyPassword(suppliedPin, access.publicTrackingPinHash)
      ) {
        includeSensitiveDetails = true;
      } else {
        pinError = "The recipient PIN did not match. Status and route updates remain available.";
      }
    }

    const snapshot = await getPublicShipmentTrackingSnapshot(decodedReference, {
      includeSensitiveDetails,
    });

    if (!snapshot) {
      return NextResponse.json({ message: "Shipment not found." }, { status: 404 });
    }

    const response = NextResponse.json({ pinError, snapshot });

    if (access.publicTrackingPinRequired && includeSensitiveDetails) {
      setPublicTrackingAccessCookie(response, access.shipmentId);
    }

    return response;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ message: getDatabaseUnavailableMessage() }, { status: 503 });
    }

    throw error;
  }
}
