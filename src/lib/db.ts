import "server-only";
import { PrismaClient } from "@prisma/client";

import { env } from "@/config/env.server";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function getPrismaDatabaseUrl() {
  const databaseUrl = new URL(env.DATABASE_URL);

  if (databaseUrl.protocol === "postgresql:" || databaseUrl.protocol === "postgres:") {
    if (!databaseUrl.searchParams.has("connect_timeout")) {
      databaseUrl.searchParams.set("connect_timeout", "15");
    }

    if (!databaseUrl.searchParams.has("pool_timeout")) {
      databaseUrl.searchParams.set("pool_timeout", "30");
    }

    if (env.APP_ENV === "development" && !databaseUrl.searchParams.has("connection_limit")) {
      databaseUrl.searchParams.set("connection_limit", "5");
    }
  }

  return databaseUrl.toString();
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getPrismaDatabaseUrl(),
      },
    },
    log: env.APP_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (env.APP_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
