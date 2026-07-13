"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type ChatAutoRefreshProps = {
  intervalMs?: number;
};

export function ChatAutoRefresh({ intervalMs = 5000 }: ChatAutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    function isEditingMessage() {
      const activeElement = document.activeElement;

      return (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute("contenteditable") === "true"
      );
    }

    function refresh() {
      if (!cancelled && document.visibilityState === "visible" && !isEditingMessage()) {
        router.refresh();
      }
    }

    const interval = window.setInterval(refresh, intervalMs);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [intervalMs, router]);

  return null;
}
