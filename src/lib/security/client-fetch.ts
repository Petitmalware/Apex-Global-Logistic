"use client";

import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  SAFE_HTTP_METHODS,
} from "@/lib/security/csrf-constants";

function getCookieValue(name: string) {
  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function isSameOriginRequest(input: RequestInfo | URL) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

  return new URL(url, window.location.origin).origin === window.location.origin;
}

export function getCsrfToken() {
  const rawToken = getCookieValue(CSRF_COOKIE_NAME);

  return rawToken ? decodeURIComponent(rawToken) : null;
}

let sessionRefreshPromise: Promise<Response> | null = null;

function buildSecureInit(input: RequestInfo | URL, init: RequestInit) {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);

  if (!SAFE_HTTP_METHODS.has(method) && isSameOriginRequest(input)) {
    const csrfToken = getCsrfToken();

    if (csrfToken) {
      headers.set(CSRF_HEADER_NAME, csrfToken);
    }
  }

  return {
    ...init,
    credentials: init.credentials ?? "same-origin",
    headers,
  } satisfies RequestInit;
}

function isAuthEndpoint(input: RequestInfo | URL) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

  return new URL(url, window.location.origin).pathname.startsWith("/api/auth/");
}

function refreshSession() {
  sessionRefreshPromise ??= fetch(
    "/api/auth/refresh",
    buildSecureInit("/api/auth/refresh", { method: "POST" }),
  ).finally(() => {
    sessionRefreshPromise = null;
  });

  return sessionRefreshPromise;
}

export async function secureFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const firstInput = input instanceof Request ? input.clone() : input;
  const retryInput = input instanceof Request ? input.clone() : input;
  const response = await fetch(firstInput, buildSecureInit(firstInput, init));

  if (response.status !== 401 || isAuthEndpoint(input)) {
    return response;
  }

  const refreshResponse = await refreshSession();

  if (!refreshResponse.ok) {
    return response;
  }

  return fetch(retryInput, buildSecureInit(retryInput, init));
}
