import "server-only";
import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const PASSWORD_ALGORITHM = "pbkdf2_sha256";
const PASSWORD_HASH_BYTES = 32;
const PASSWORD_ITERATIONS = 310_000;
const PASSWORD_SALT_BYTES = 16;

export function createSecureToken(byteLength = 32) {
  return randomBytes(byteLength).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function hashPassword(password: string) {
  const salt = randomBytes(PASSWORD_SALT_BYTES);
  const hash = pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_HASH_BYTES, "sha256");

  return [
    PASSWORD_ALGORITHM,
    PASSWORD_ITERATIONS.toString(),
    salt.toString("base64url"),
    hash.toString("base64url"),
  ].join("$");
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, iterations, salt, expectedHash] = storedHash.split("$");

  if (algorithm !== PASSWORD_ALGORITHM || !iterations || !salt || !expectedHash) {
    return false;
  }

  const iterationCount = Number(iterations);

  if (!Number.isSafeInteger(iterationCount) || iterationCount <= 0) {
    return false;
  }

  const derivedHash = pbkdf2Sync(
    password,
    Buffer.from(salt, "base64url"),
    iterationCount,
    PASSWORD_HASH_BYTES,
    "sha256",
  );
  const expected = Buffer.from(expectedHash, "base64url");

  return expected.length === derivedHash.length && timingSafeEqual(expected, derivedHash);
}
