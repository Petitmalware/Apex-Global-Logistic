import { NextResponse, type NextRequest } from "next/server";

import { refreshAuthTokens } from "@/features/auth/services/auth.service";
import { AUTH_COOKIE_NAMES } from "@/lib/auth/constants";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/cookies";
import { authJsonError } from "@/lib/auth/http";
import { getRequestMeta } from "@/lib/auth/request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const tokens = await refreshAuthTokens(
      request.cookies.get(AUTH_COOKIE_NAMES.refreshToken)?.value,
      getRequestMeta(request),
    );
    const response = NextResponse.json({
      user: tokens.user,
    });

    setAuthCookies(response, tokens);

    return response;
  } catch (error) {
    const response = authJsonError(error);

    clearAuthCookies(response);

    return response;
  }
}
