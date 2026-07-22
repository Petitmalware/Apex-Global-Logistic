import { NextResponse } from "next/server";

import { verifyConfiguredEmailProvider } from "@/features/emails/services/email-provider.service";
import { AuthError } from "@/lib/auth/errors";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    await requirePermission(PERMISSIONS.EMAILS_CREATE);
    const result = await verifyConfiguredEmailProvider();

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Email connection could not be verified.",
      },
      { status: 502 },
    );
  }
}
