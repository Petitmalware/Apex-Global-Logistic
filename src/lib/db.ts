import "server-only";
import { PrismaClient } from "@prisma/client";

import { env } from "@/config/env.server";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.APP_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });

if (env.APP_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
