import "server-only";

import { join } from "node:path";

import { env } from "@/config/env.server";

export function getLocalStorageRoot() {
  return join(process.cwd(), env.STORAGE_LOCAL_PATH);
}

export function getLocalStoragePath(storageKey: string) {
  return join(getLocalStorageRoot(), ...storageKey.split("/"));
}
