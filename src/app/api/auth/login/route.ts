import { NextResponse, type NextRequest } from "next/server";

import { loginUser } from "@/features/auth/services/auth.service";
import { setAuthCookies } from "@/lib/auth/cookies";
import { authJsonError } from "@/lib/auth/http";
import { getRequestMeta } from "@/lib/auth/request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const tokens = await loginUser(await request.json(), getRequestMeta(request));
    const response = NextResponse.json({
      user: tokens.user,
    });

    setAuthCookies(response, tokens);

    return response;
  } catch (error) {
    return authJsonError(error);
  }
}
