import { NextResponse } from "next/server";

import { env } from "@/config/env.server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const startedAt = Date.now();
  let database = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error("Health check database probe failed", error);
    database = "error";
  }

  const healthy = database === "ok";

  return NextResponse.json(
    {
      checks: {
        database,
        email:
          env.EMAIL_PROVIDER === "smtp"
            ? env.SMTP_HOST && env.SMTP_USERNAME && env.SMTP_PASSWORD
              ? "smtp_configured"
              : "smtp_incomplete"
            : env.EMAIL_PROVIDER,
        redis: env.REDIS_URL ? "configured" : "not_configured",
        storage: env.STORAGE_DRIVER,
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
