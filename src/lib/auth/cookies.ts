import "server-only";
import type { NextResponse } from "next/server";

import { env } from "@/config/env.server";
import { AUTH_COOKIE_NAMES } from "@/lib/auth/constants";

type AuthCookieTokens = {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

const isProduction = env.APP_ENV === "production";

function preventAuthResponseCaching(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.append("Vary", "Cookie");
}

function appendLegacyRefreshCookieDeletion(response: NextResponse) {
  const attributes = [
    `${AUTH_COOKIE_NAMES.refreshToken}=`,
    "Path=/api/auth",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Lax",
    isProduction ? "Secure" : "",
  ].filter(Boolean);

  response.headers.append("Set-Cookie", attributes.join("; "));
}

export function setAuthCookies(response: NextResponse, tokens: AuthCookieTokens) {
  preventAuthResponseCaching(response);
  response.cookies.set({
    httpOnly: true,
    maxAge: env.AUTH_ACCESS_TOKEN_TTL_SECONDS,
    name: AUTH_COOKIE_NAMES.accessToken,
    path: "/",
    sameSite: "lax",
    secure: isProduction,
    value: tokens.accessToken,
  });
  response.cookies.set({
    expires: tokens.refreshTokenExpiresAt,
    httpOnly: true,
    name: AUTH_COOKIE_NAMES.refreshToken,
    path: "/",
    sameSite: "lax",
    secure: isProduction,
    value: tokens.refreshToken,
  });

  appendLegacyRefreshCookieDeletion(response);
}

export function clearAuthCookies(response: NextResponse) {
  preventAuthResponseCaching(response);
  response.cookies.set({
    httpOnly: true,
    maxAge: 0,
    name: AUTH_COOKIE_NAMES.accessToken,
    path: "/",
    sameSite: "lax",
    secure: isProduction,
    value: "",
  });
  response.cookies.set({
    httpOnly: true,
    maxAge: 0,
    name: AUTH_COOKIE_NAMES.refreshToken,
    path: "/",
    sameSite: "lax",
    secure: isProduction,
    value: "",
  });

  appendLegacyRefreshCookieDeletion(response);
}
