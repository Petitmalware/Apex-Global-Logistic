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

export function setAuthCookies(response: NextResponse, tokens: AuthCookieTokens) {
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
    path: "/api/auth",
    sameSite: "lax",
    secure: isProduction,
    value: tokens.refreshToken,
  });
}

export function clearAuthCookies(response: NextResponse) {
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
    path: "/api/auth",
    sameSite: "lax",
    secure: isProduction,
    value: "",
  });
}
