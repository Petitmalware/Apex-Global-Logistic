import { NextResponse, type NextRequest } from "next/server";

import { refreshAuthTokens } from "@/features/auth/services/auth.service";
import { AUTH_COOKIE_NAMES } from "@/lib/auth/constants";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/cookies";
import { AuthError } from "@/lib/auth/errors";
import { authJsonError } from "@/lib/auth/http";
import { getRequestMeta } from "@/lib/auth/request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getSafeNextPath(request: NextRequest) {
  const nextPath = request.nextUrl.searchParams.get("next");

  return nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";
}

function shouldKeepAuthCookies(error: unknown) {
  return error instanceof AuthError && error.code === "REFRESH_ALREADY_ROTATED";
}

export async function GET(request: NextRequest) {
  try {
    const tokens = await refreshAuthTokens(
      request.cookies.get(AUTH_COOKIE_NAMES.refreshToken)?.value,
      getRequestMeta(request),
    );
    const response = NextResponse.redirect(new URL(getSafeNextPath(request), request.url));

    setAuthCookies(response, tokens);

    return response;
  } catch (error) {
    const loginUrl = new URL("/login", request.url);
    const nextPath = getSafeNextPath(request);

    if (nextPath !== "/dashboard") {
      loginUrl.searchParams.set("next", nextPath);
    }

    const response = NextResponse.redirect(loginUrl);

    if (!shouldKeepAuthCookies(error)) {
      clearAuthCookies(response);
    }

    return response;
  }
}

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

    if (!shouldKeepAuthCookies(error)) {
      clearAuthCookies(response);
    }

    return response;
  }
}
