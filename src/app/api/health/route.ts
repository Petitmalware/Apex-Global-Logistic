import { constants } from "node:fs";
import { access, mkdir } from "node:fs/promises";

import { NextResponse } from "next/server";

import { env } from "@/config/env.server";
import { getConfiguredEmailProviderHealth } from "@/features/emails/services/email-provider.service";
import { prisma } from "@/lib/db";
import { getLocalStorageRoot } from "@/lib/storage/local-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const startedAt = Date.now();
  let database = "ok";
  let storage = env.STORAGE_DRIVER === "local" ? "writable" : "configured";
  const emailHealth = await getConfiguredEmailProviderHealth();

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error("Health check database probe failed", error);
    database = "error";
  }

  if (env.STORAGE_DRIVER === "local") {
    try {
      const storageRoot = getLocalStorageRoot();

      await mkdir(storageRoot, { recursive: true });
      await access(storageRoot, constants.W_OK);
    } catch (error) {
      console.error("Health check storage probe failed", {
        code: typeof error === "object" && error !== null && "code" in error ? error.code : null,
      });
      storage = "error";
    }
  }

  const healthy = database === "ok" && storage !== "error";

  return NextResponse.json(
    {
      checks: {
        database,
        email: emailHealth.status,
        emailCheckedAt: emailHealth.checkedAt,
        emailProvider: emailHealth.provider,
        redis: env.REDIS_URL ? "configured" : "not_configured",
        storage,
      },
      latencyMs: Date.now() - startedAt,
      status: healthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
      status: healthy ? 200 : 503,
    },
  );
}
