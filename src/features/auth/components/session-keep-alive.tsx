"use client";

import { useEffect } from "react";

import { secureFetch } from "@/lib/security/client-fetch";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const REFRESH_COOLDOWN_MS = 4 * 60 * 1000;
const STORAGE_KEY = "apex-last-session-refresh";

function getLastRefreshAt() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    const timestamp = value ? Number(value) : 0;

    return Number.isFinite(timestamp) ? timestamp : 0;
  } catch {
    return 0;
  }
}

export function SessionKeepAlive() {
  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    async function refreshSession() {
      const now = Date.now();

      if (cancelled || inFlight || now - getLastRefreshAt() < REFRESH_COOLDOWN_MS) {
        return;
      }

      inFlight = true;

      try {
        const response = await secureFetch("/api/auth/refresh", {
          method: "POST",
        });

        if (response.ok) {
          try {
            window.localStorage.setItem(STORAGE_KEY, Date.now().toString());
          } catch {
            // The session remains valid when storage is unavailable.
          }
        }
      } catch {
        // A transient network failure must not interrupt dashboard navigation.
      } finally {
        inFlight = false;
      }
    }

    void refreshSession();
    const interval = window.setInterval(refreshSession, REFRESH_INTERVAL_MS);

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
