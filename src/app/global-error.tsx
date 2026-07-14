"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application recovery boundary", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="grid min-h-svh place-items-center bg-[#fcfbf7] px-6 py-12 text-[#111827]">
          <section className="w-full max-w-lg rounded-lg border border-[#dce3ee] bg-white p-8 shadow-sm">
            <div className="grid size-11 place-items-center rounded-md bg-[#10243f] text-sm font-semibold text-white">
              AG
            </div>
            <h1 className="mt-6 text-2xl font-semibold">This page needs to reload</h1>
            <p className="mt-3 text-sm leading-6 text-[#52627a]">
              Your account and data are safe. Reload the latest version of Apex Global Logistics to
              continue.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="rounded-md bg-[#fbbf24] px-4 py-2.5 text-sm font-semibold text-[#111827]"
                onClick={() => window.location.reload()}
                type="button"
              >
                Reload page
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
