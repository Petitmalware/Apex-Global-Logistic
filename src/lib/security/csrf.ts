import type { NextRequest, NextResponse } from "next/server";

import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  SAFE_HTTP_METHODS,
} from "@/lib/security/csrf-constants";

const CSRF_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8;

function isProduction() {
  return process.env.APP_ENV === "production" || process.env.NODE_ENV === "production";
}

function getOrigin(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isSameOriginRequest(request: NextRequest) {
  const requestOrigin = request.nextUrl.origin;
  const origin = getOrigin(request.headers.get("origin"));

  if (origin) {
    return origin === requestOrigin;
  }

  const referer = getOrigin(request.headers.get("referer"));

  return referer === requestOrigin;
}

export function ensureCsrfCookie(response: NextResponse, request: NextRequest) {
  const existingToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const token = existingToken || crypto.randomUUID();

  response.cookies.set({
    httpOnly: false,
    maxAge: CSRF_COOKIE_MAX_AGE_SECONDS,
    name: CSRF_COOKIE_NAME,
    path: "/",
    sameSite: "lax",
    secure: isProduction(),
    value: token,
  });

  return response;
}

export function verifyCsrfProtection(request: NextRequest) {
  if (SAFE_HTTP_METHODS.has(request.method.toUpperCase())) {
    return {
      ok: true,
    } as const;
  }

  if (!isSameOriginRequest(request)) {
    return {
      message: "Cross-site request blocked.",
      ok: false,
    } as const;
  }

  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (request.nextUrl.pathname.startsWith("/api/") && cookieToken && headerToken !== cookieToken) {
    return {
      message: "Invalid CSRF token.",
      ok: false,
    } as const;
  }

  return {
    ok: true,
  } as const;
}
