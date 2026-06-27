import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

import { AuthError } from "@/lib/auth/errors";
import { getLocalStorageRoot } from "@/lib/storage/local-storage";

type UploadValidationRules = {
  acceptedMimeTypes: ReadonlySet<string>;
  allowedExtensions: ReadonlySet<string>;
  emptyFileMessage: string;
  maxSizeBytes: number;
  tooLargeMessage: string;
  unsupportedTypeMessage: string;
};

type PersistUploadInput = {
  file: File;
  folderSegments: string[];
  rules: UploadValidationRules;
  storageKeyPrefix: string;
};

export type PersistedUpload = {
  checksum: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  storageKey: string;
};

export const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const DOCUMENT_EXTENSIONS = new Set([
  ".doc",
  ".docx",
  ".jpeg",
  ".jpg",
  ".pdf",
  ".png",
  ".txt",
  ".webp",
]);

export const IMAGE_EXTENSIONS = new Set([".jpeg", ".jpg", ".png", ".webp"]);

export function sanitizeFileName(fileName: string) {
  const sanitized = fileName
    .replace(/[/\\]/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .slice(0, 180);

  return sanitized || "upload";
}

function validateUpload(file: File, rules: UploadValidationRules) {
  if (!(file instanceof File) || file.size <= 0) {
    throw new AuthError(rules.emptyFileMessage, 400, "FILE_REQUIRED");
  }

  if (file.size > rules.maxSizeBytes) {
    throw new AuthError(rules.tooLargeMessage, 400, "FILE_TOO_LARGE");
  }

  const mimeType = file.type.toLowerCase();

  if (!rules.acceptedMimeTypes.has(mimeType)) {
    throw new AuthError(rules.unsupportedTypeMessage, 400, "UNSUPPORTED_FILE_TYPE");
  }

  const safeFileName = sanitizeFileName(file.name);
  const extension = extname(safeFileName).toLowerCase();

  if (!extension || !rules.allowedExtensions.has(extension)) {
    throw new AuthError(rules.unsupportedTypeMessage, 400, "UNSUPPORTED_FILE_EXTENSION");
  }

  return {
    mimeType,
    safeFileName,
  };
}

export async function persistValidatedUpload({
  file,
  folderSegments,
  rules,
  storageKeyPrefix,
}: PersistUploadInput): Promise<PersistedUpload> {
  const { mimeType, safeFileName } = validateUpload(file, rules);
  const bytes = Buffer.from(await file.arrayBuffer());
  const checksum = createHash("sha256").update(bytes).digest("hex");
  const storageKey = `${storageKeyPrefix}/${randomUUID()}-${safeFileName}`;
  const storageRoot = getLocalStorageRoot();

  await mkdir(join(storageRoot, ...folderSegments), {
    recursive: true,
  });
  await writeFile(join(storageRoot, ...storageKey.split("/")), bytes);

  return {
    checksum,
    fileName: file.name,
    fileSizeBytes: file.size,
    mimeType,
    storageKey,
  };
}
