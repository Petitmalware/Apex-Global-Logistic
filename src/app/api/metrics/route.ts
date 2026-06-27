import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function metricLine(name: string, value: number, labels?: Record<string, string>) {
  const labelText = labels
    ? `{${Object.entries(labels)
        .map(([key, labelValue]) => `${key}="${labelValue.replaceAll('"', '\\"')}"`)
        .join(",")}}`
    : "";

  return `${name}${labelText} ${value}`;
}

export async function GET() {
  let databaseUp = 1;

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error("Metrics database probe failed", error);
    databaseUp = 0;
  }

  const lines = [
    "# HELP apex_health_up Application dependency health. 1 means up, 0 means down.",
    "# TYPE apex_health_up gauge",
    metricLine("apex_health_up", 1, { check: "app" }),
    metricLine("apex_health_up", databaseUp, { check: "database" }),
    "# HELP apex_process_uptime_seconds Node.js process uptime in seconds.",
    "# TYPE apex_process_uptime_seconds gauge",
    metricLine("apex_process_uptime_seconds", Math.round(process.uptime())),
    "# HELP apex_process_memory_rss_bytes Node.js process RSS memory in bytes.",
    "# TYPE apex_process_memory_rss_bytes gauge",
    metricLine("apex_process_memory_rss_bytes", process.memoryUsage().rss),
    "",
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
    },
    status: databaseUp ? 200 : 503,
  });
}
