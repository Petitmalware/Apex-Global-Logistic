import { NextResponse, type NextRequest } from "next/server";

import { verifyEmail } from "@/features/auth/services/auth.service";
import { authJsonError } from "@/lib/auth/http";
import { getRequestMeta } from "@/lib/auth/request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(await verifyEmail(await request.json(), getRequestMeta(request)));
  } catch (error) {
    return authJsonError(error);
  }
}
