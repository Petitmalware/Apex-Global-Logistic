import type { NextRequest, NextResponse } from "next/server";

function isProduction() {
  return process.env.APP_ENV === "production" || process.env.NODE_ENV === "production";
}

function getAppOrigin(request: NextRequest) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!configuredUrl) {
    return request.nextUrl.origin;
  }

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return request.nextUrl.origin;
  }
}

function getConfiguredMapOrigins() {
  const candidates = [
    process.env.NEXT_PUBLIC_MAP_AERIAL_STYLE_URL,
    process.env.NEXT_PUBLIC_MAP_DARK_STYLE_URL,
    process.env.NEXT_PUBLIC_MAP_TERRAIN_STYLE_URL,
  ];

  return candidates.flatMap((candidate) => {
    if (!candidate) {
      return [];
    }

    try {
      return [new URL(candidate).origin];
    } catch {
      return [];
    }
  });
}

function buildContentSecurityPolicy(request: NextRequest) {
  const appOrigin = getAppOrigin(request);
  const mapOrigins = getConfiguredMapOrigins();
  const scriptSources = ["'self'", "'unsafe-inline'"];

  if (!isProduction()) {
    scriptSources.push("'unsafe-eval'");
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    // MapLibre loads configured map styles and tiles from these explicit providers.
    `connect-src 'self' ${appOrigin} https://api.maptiler.com https://*.maptiler.com https://tile.openstreetmap.org https://fonts.openmaptiles.org ${mapOrigins.join(" ")} ws: wss:`,
    "frame-src 'self'",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    isProduction() ? "upgrade-insecure-requests" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function applySecurityHeaders(response: NextResponse, request: NextRequest) {
  response.headers.set("Content-Security-Policy", buildContentSecurityPolicy(request));
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Permissions-Policy", "camera=(), geolocation=(), microphone=()");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");

  if (isProduction()) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  return response;
}
