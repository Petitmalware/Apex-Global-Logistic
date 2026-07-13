"use client";

import { useEffect } from "react";

import { secureFetch } from "@/lib/security/client-fetch";

const REFRESH_INTERVAL_MS = 4 * 60 * 1000;
const REFRESH_COOLDOWN_MS = 90 * 1000;
const REFRESH_LOCK_MS = 20 * 1000;
const LOCK_KEY = "apex-session-refresh-lock";
const STORAGE_KEY = "apex-last-session-refresh";

function getLastRefreshAt() {
  const value = window.localStorage.getItem(STORAGE_KEY);
  const timestamp = value ? Number(value) : 0;

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function setLastRefreshAt(value: number) {
  window.localStorage.setItem(STORAGE_KEY, value.toString());
}

function claimRefreshLock(now: number) {
  const existingLock = Number(window.localStorage.getItem(LOCK_KEY) ?? "0");

  if (Number.isFinite(existingLock) && now - existingLock < REFRESH_LOCK_MS) {
    return false;
  }

  window.localStorage.setItem(LOCK_KEY, now.toString());

  return true;
}

function releaseRefreshLock() {
  window.localStorage.removeItem(LOCK_KEY);
}

export function SessionKeepAlive() {
  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    async function refreshSession(force = false) {
      if (cancelled || inFlight) {
        return;
      }

      const now = Date.now();

      if (!force && now - getLastRefreshAt() < REFRESH_COOLDOWN_MS) {
        return;
      }

      if (!claimRefreshLock(now)) {
        return;
      }

      inFlight = true;

      try {
        const response = await secureFetch("/api/auth/refresh", {
          method: "POST",
        });

        if (response.ok) {
          setLastRefreshAt(Date.now());
        }
      } finally {
        inFlight = false;
        releaseRefreshLock();
      }
    }

    void refreshSession();
    const interval = window.setInterval(() => refreshSession(), REFRESH_INTERVAL_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshSession();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
