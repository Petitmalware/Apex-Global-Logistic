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

export function secureFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);

  if (!SAFE_HTTP_METHODS.has(method) && isSameOriginRequest(input)) {
    const csrfToken = getCsrfToken();

    if (csrfToken) {
      headers.set(CSRF_HEADER_NAME, csrfToken);
    }
  }

  return fetch(input, {
    ...init,
    credentials: init.credentials ?? "same-origin",
    headers,
  });
}
