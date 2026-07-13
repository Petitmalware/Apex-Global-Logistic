import { NextResponse, type NextRequest } from "next/server";

import {
  AUTH_COOKIE_NAMES,
  AUTH_PUBLIC_API_PREFIXES,
  AUTH_PUBLIC_PATHS,
  AUTH_ROLES,
  type AppRole,
} from "@/lib/auth/constants";
import { verifyAccessToken, type AccessTokenPayload } from "@/lib/auth/jwt";
import { hasPermission, hasRole, PERMISSIONS } from "@/lib/auth/rbac";
import { ensureCsrfCookie, verifyCsrfProtection } from "@/lib/security/csrf";
import { applySecurityHeaders } from "@/lib/security/headers";
import { checkRateLimit, getPositiveIntEnv, type RateLimitResult } from "@/lib/security/rate-limit";

const ROLE_ROUTE_RULES: Array<{
  prefix: string;
  roles: AppRole[];
}> = [
  {
    prefix: "/super-admin",
    roles: [AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN],
  },
  {
    prefix: "/admin/emails",
    roles: [AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN],
  },
  {
    prefix: "/admin",
    roles: [AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN],
  },
  {
    prefix: "/support",
    roles: [AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN],
  },
  {
    prefix: "/agent",
    roles: [AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN],
  },
  {
    prefix: "/customer",
    roles: [AUTH_ROLES.CUSTOMER],
  },
];
const API_PERMISSION_RULES: Array<{
  permission: string;
  prefix: string;
}> = [
  {
    permission: PERMISSIONS.EMAILS_CREATE,
    prefix: "/api/admin/emails",
  },
  {
    permission: PERMISSIONS.EMAILS_CREATE,
    prefix: "/api/ai/emails/draft",
  },
  {
    permission: PERMISSIONS.AI_READ,
    prefix: "/api/ai/search",
  },
  {
    permission: PERMISSIONS.AI_CREATE,
    prefix: "/api/ai",
  },
  {
    permission: PERMISSIONS.NOTIFICATIONS_MANAGE,
    prefix: "/api/notifications/email/dispatch",
  },
  {
    permission: PERMISSIONS.NOTIFICATIONS_READ,
    prefix: "/api/notifications",
  },
  {
    permission: PERMISSIONS.SHIPMENTS_READ,
    prefix: "/api/shipments",
  },
];

const AUTH_PAGE_PATHS = new Set(["/login", "/register", "/forgot-password", "/reset-password"]);
const DEFAULT_MAX_API_BODY_BYTES = 1024 * 1024;
const CHAT_UPLOAD_MAX_API_BODY_BYTES = 32 * 1024 * 1024;

function isPublicPath(pathname: string) {
  return AUTH_PUBLIC_PATHS.some((path) => pathname === path);
}

function isPublicApi(pathname: string) {
  return AUTH_PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function getRequiredRoles(pathname: string) {
  return ROLE_ROUTE_RULES.find(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`),
  )?.roles;
}

function getRequiredApiPermission(pathname: string) {
  return API_PERMISSION_RULES.find(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`),
  )?.permission;
}

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function getRateLimitRule(pathname: string, method: string) {
  if (pathname.startsWith("/api/auth/login")) {
    return {
      id: "auth-login",
      limit: getPositiveIntEnv("SECURITY_LOGIN_RATE_LIMIT_PER_MINUTE", 10),
      windowMs: 60_000,
    };
  }

  if (
    pathname.startsWith("/api/auth/register") ||
    pathname.startsWith("/api/auth/forgot-password") ||
    pathname.startsWith("/api/auth/reset-password") ||
    pathname.startsWith("/api/auth/verify-email")
  ) {
    return {
      id: "auth-sensitive",
      limit: getPositiveIntEnv("SECURITY_AUTH_RATE_LIMIT_PER_MINUTE", 20),
      windowMs: 60_000,
    };
  }

  if (pathname.startsWith("/api/admin/emails/send")) {
    return {
      id: "email-send",
      limit: getPositiveIntEnv("SECURITY_EMAIL_SEND_RATE_LIMIT_PER_MINUTE", 10),
      windowMs: 60_000,
    };
  }

  if (pathname.startsWith("/api/ai/")) {
    return {
      id: "ai",
      limit: getPositiveIntEnv("SECURITY_AI_RATE_LIMIT_PER_MINUTE", 30),
      windowMs: 60_000,
    };
  }

  if (pathname.startsWith("/api/tracking")) {
    return {
      id: "public-tracking",
      limit: getPositiveIntEnv("SECURITY_PUBLIC_TRACKING_RATE_LIMIT_PER_MINUTE", 60),
      windowMs: 60_000,
    };
  }

  if (pathname.startsWith("/api/")) {
    return {
      id: "api",
      limit: getPositiveIntEnv("SECURITY_API_RATE_LIMIT_PER_MINUTE", 120),
      windowMs: 60_000,
    };
  }

  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    return {
      id: "unsafe-page-action",
      limit: getPositiveIntEnv("SECURITY_ACTION_RATE_LIMIT_PER_MINUTE", 60),
      windowMs: 60_000,
    };
  }

  return null;
}

function rateLimitHeaders(result: RateLimitResult) {
  return {
    "RateLimit-Limit": result.limit.toString(),
    "RateLimit-Remaining": result.remaining.toString(),
    "RateLimit-Reset": Math.ceil(result.resetAt / 1000).toString(),
    "Retry-After": result.retryAfterSeconds.toString(),
  };
}

function rateLimitResponse(request: NextRequest, result: RateLimitResult) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        message: "Too many requests. Please wait before trying again.",
      },
      {
        headers: rateLimitHeaders(result),
        status: 429,
      },
    );
  }

  return new NextResponse("Too many requests. Please wait before trying again.", {
    headers: rateLimitHeaders(result),
    status: 429,
  });
}

function enforceRateLimit(request: NextRequest) {
  const rule = getRateLimitRule(request.nextUrl.pathname, request.method.toUpperCase());

  if (!rule) {
    return null;
  }

  const result = checkRateLimit({
    key: `${rule.id}:${getClientIp(request)}`,
    limit: rule.limit,
    windowMs: rule.windowMs,
  });

  return result.success ? null : rateLimitResponse(request, result);
}

function enforceApiBodyLimit(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return null;
  }

  const contentLength = Number(request.headers.get("content-length"));
  const maxBodyBytes = request.nextUrl.pathname.startsWith("/api/chat/public/")
    ? CHAT_UPLOAD_MAX_API_BODY_BYTES
    : DEFAULT_MAX_API_BODY_BYTES;

  if (Number.isSafeInteger(contentLength) && contentLength > maxBodyBytes) {
    return NextResponse.json(
      {
        message: "Request body is too large.",
      },
      { status: 413 },
    );
  }

  return null;
}

function csrfResponse(message: string) {
  return NextResponse.json(
    {
      message,
    },
    { status: 403 },
  );
}

function finalizeResponse(response: NextResponse, request: NextRequest) {
  applySecurityHeaders(response, request);
  ensureCsrfCookie(response, request);

  return response;
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);

  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);

  return finalizeResponse(NextResponse.redirect(loginUrl), request);
}

function forbiddenResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return finalizeResponse(
      NextResponse.json(
        {
          message: "Forbidden.",
        },
        { status: 403 },
      ),
      request,
    );
  }

  return finalizeResponse(NextResponse.redirect(new URL("/unauthorized", request.url)), request);
}

async function getAccessPayload(request: NextRequest) {
  const accessToken = request.cookies.get(AUTH_COOKIE_NAMES.accessToken)?.value;

  if (!accessToken) {
    return null;
  }

  return verifyAccessToken(accessToken).catch(() => null);
}

function withAuthHeaders(request: NextRequest, payload: AccessTokenPayload) {
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-apex-user-id", payload.sub);
  requestHeaders.set("x-apex-user-roles", payload.roles.join(","));

  return finalizeResponse(
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    }),
    request,
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApiPath = pathname.startsWith("/api/");
  const rateLimitBlock = enforceRateLimit(request);

  if (rateLimitBlock) {
    return finalizeResponse(rateLimitBlock, request);
  }

  const apiBodyLimitBlock = enforceApiBodyLimit(request);

  if (apiBodyLimitBlock) {
    return finalizeResponse(apiBodyLimitBlock, request);
  }

  const csrfCheck = verifyCsrfProtection(request);

  if (!csrfCheck.ok) {
    return finalizeResponse(csrfResponse(csrfCheck.message), request);
  }

  if (isPublicApi(pathname) || isPublicPath(pathname)) {
    const payload = await getAccessPayload(request);

    if (payload && AUTH_PAGE_PATHS.has(pathname)) {
      return finalizeResponse(NextResponse.redirect(new URL("/dashboard", request.url)), request);
    }

    return finalizeResponse(NextResponse.next(), request);
  }

  const payload = await getAccessPayload(request);

  if (!payload) {
    if (isApiPath) {
      return finalizeResponse(
        NextResponse.json(
          {
            message: "Authentication required.",
          },
          { status: 401 },
        ),
        request,
      );
    }

    return redirectToLogin(request);
  }

  const requiredRoles = getRequiredRoles(pathname);

  if (requiredRoles && !hasRole(payload, requiredRoles)) {
    return forbiddenResponse(request);
  }

  const requiredApiPermission = isApiPath ? getRequiredApiPermission(pathname) : undefined;

  if (requiredApiPermission && !hasPermission(payload, requiredApiPermission)) {
    return forbiddenResponse(request);
  }

  return withAuthHeaders(request, payload);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
