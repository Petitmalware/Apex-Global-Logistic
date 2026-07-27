import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import type { NextResponse } from "next/server";

import { env } from "@/config/env.server";

export const PUBLIC_TRACKING_ACCESS_COOKIE_NAME = "apex_tracking_access";

type PublicTrackingAccessPayload = {
  exp: number;
  shipmentId: string;
  typ: "public-tracking-access";
};

function sign(value: string) {
  return createHmac("sha256", env.AUTH_JWT_SECRET).update(value).digest("base64url");
}

function encode(payload: PublicTrackingAccessPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decode(value: string) {
  return JSON.parse(
    Buffer.from(value, "base64url").toString("utf8"),
  ) as PublicTrackingAccessPayload;
}

function signaturesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createPublicTrackingAccessToken(shipmentId: string) {
  const payload: PublicTrackingAccessPayload = {
    exp: Math.floor(Date.now() / 1000) + env.PUBLIC_TRACKING_PIN_SESSION_MINUTES * 60,
    shipmentId,
    typ: "public-tracking-access",
  };
  const encodedPayload = encode(payload);

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function hasPublicTrackingAccess(token: string | undefined, shipmentId: string) {
  if (!token) {
    return false;
  }

  try {
    const [encodedPayload, signature, extra] = token.split(".");

    if (
      !encodedPayload ||
      !signature ||
      extra ||
      !signaturesMatch(signature, sign(encodedPayload))
    ) {
      return false;
    }

    const payload = decode(encodedPayload);

    return (
      payload.typ === "public-tracking-access" &&
      payload.shipmentId === shipmentId &&
      payload.exp > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

export function setPublicTrackingAccessCookie(response: NextResponse, shipmentId: string) {
  response.cookies.set({
    httpOnly: true,
    maxAge: env.PUBLIC_TRACKING_PIN_SESSION_MINUTES * 60,
    name: PUBLIC_TRACKING_ACCESS_COOKIE_NAME,
    path: "/",
    sameSite: "lax",
    secure: env.APP_ENV === "production",
    value: createPublicTrackingAccessToken(shipmentId),
  });
  response.headers.append("Vary", "Cookie");
}
