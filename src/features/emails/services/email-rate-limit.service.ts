import "server-only";

import { env } from "@/config/env.server";
import { AuthError } from "@/lib/auth/errors";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = globalThis as typeof globalThis & {
  __apexEmailRateLimits?: Map<string, RateLimitBucket>;
};

function getBuckets() {
  buckets.__apexEmailRateLimits ??= new Map<string, RateLimitBucket>();

  return buckets.__apexEmailRateLimits;
}

export function assertEmailRateLimit(actorId: string) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const key = `email:${actorId}`;
  const rateLimits = getBuckets();
  const bucket = rateLimits.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateLimits.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return;
  }

  if (bucket.count >= env.EMAIL_RATE_LIMIT_PER_HOUR) {
    throw new AuthError(
      "Email rate limit reached. Please wait before sending more email.",
      429,
      "EMAIL_RATE_LIMITED",
    );
  }

  bucket.count += 1;
}
