import { NextResponse, type NextRequest } from "next/server";

import { logoutUser } from "@/features/auth/services/auth.service";
import { AUTH_COOKIE_NAMES } from "@/lib/auth/constants";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { authJsonError } from "@/lib/auth/http";
import { getRequestMeta } from "@/lib/auth/request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await logoutUser(
      request.cookies.get(AUTH_COOKIE_NAMES.refreshToken)?.value,
      getRequestMeta(request),
    );
    const response = NextResponse.json({
      message: "Signed out.",
    });

    clearAuthCookies(response);

    return response;
  } catch (error) {
    return authJsonError(error);
  }
}
