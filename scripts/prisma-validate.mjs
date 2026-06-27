import { spawnSync } from "node:child_process";
import { join } from "node:path";

const prismaCommand = join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "prisma.cmd" : "prisma",
);
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://apex:apex_password@localhost:5432/apex_global_logistics?schema=public";

const result = spawnSync(prismaCommand, ["validate", "--schema", "prisma/schema.prisma"], {
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
  },
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
}

process.exit(result.status ?? 1);
