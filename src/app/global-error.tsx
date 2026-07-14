"use client";

import { useEffect, useState } from "react";

const RECOVERY_STORAGE_KEY = "apex-last-automatic-reload";
const AUTOMATIC_RELOAD_COOLDOWN_MS = 60_000;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isReloading, setIsReloading] = useState(false);

  useEffect(() => {
    console.error("Application recovery boundary", error);

    try {
      const now = Date.now();
      const lastReloadAt = Number(window.sessionStorage.getItem(RECOVERY_STORAGE_KEY) ?? "0");

      if (!Number.isFinite(lastReloadAt) || now - lastReloadAt > AUTOMATIC_RELOAD_COOLDOWN_MS) {
        window.sessionStorage.setItem(RECOVERY_STORAGE_KEY, now.toString());
        setIsReloading(true);
        window.location.reload();
      }
    } catch {
      // The manual recovery controls remain available when browser storage is disabled.
    }
  }, [error]);

  function reloadPage() {
    try {
      window.sessionStorage.removeItem(RECOVERY_STORAGE_KEY);
    } catch {
      // Reloading still works when browser storage is disabled.
    }

    window.location.reload();
  }

  return (
    <html lang="en">
      <body>
        <main className="grid min-h-svh place-items-center bg-[#fcfbf7] px-6 py-12 text-[#111827]">
          <section className="w-full max-w-lg rounded-lg border border-[#dce3ee] bg-white p-8 shadow-sm">
            <div className="grid size-11 place-items-center rounded-md bg-[#10243f] text-sm font-semibold text-white">
              AG
            </div>
            <h1 className="mt-6 text-2xl font-semibold">
              {isReloading ? "Loading the latest version" : "This page needs to reload"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#52627a]">
              Your account and data are safe. Reload the latest version of Apex Global Logistics to
              continue.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="rounded-md bg-[#fbbf24] px-4 py-2.5 text-sm font-semibold text-[#111827]"
                disabled={isReloading}
                onClick={reloadPage}
                type="button"
              >
                {isReloading ? "Reloading..." : "Reload page"}
              </button>
              <button
                className="rounded-md border border-[#dce3ee] bg-white px-4 py-2.5 text-sm font-semibold"
                onClick={reset}
                type="button"
              >
                Try again
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
