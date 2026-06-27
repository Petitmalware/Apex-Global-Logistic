import { NextResponse, type NextRequest } from "next/server";

import { registerUser } from "@/features/auth/services/auth.service";
import { authJsonError } from "@/lib/auth/http";
import { getRequestMeta } from "@/lib/auth/request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const result = await registerUser(await request.json(), getRequestMeta(request));
    const response = NextResponse.json(result, { status: 201 });

    return response;
  } catch (error) {
    return authJsonError(error);
  }
}
