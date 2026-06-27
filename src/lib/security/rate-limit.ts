type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  now?: number;
  windowMs: number;
};

type RateLimitState = {
  buckets: Map<string, RateLimitBucket>;
  lastSweepAt: number;
};

export type RateLimitResult = {
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
  success: boolean;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  __apexRateLimitState?: RateLimitState;
};

function getRateLimitState() {
  globalForRateLimit.__apexRateLimitState ??= {
    buckets: new Map<string, RateLimitBucket>(),
    lastSweepAt: 0,
  };

  return globalForRateLimit.__apexRateLimitState;
}

function sweepExpiredBuckets(state: RateLimitState, now: number) {
  if (now - state.lastSweepAt < 60_000) {
    return;
  }

  for (const [key, bucket] of state.buckets.entries()) {
    if (bucket.resetAt <= now) {
      state.buckets.delete(key);
    }
  }

  state.lastSweepAt = now;
}

export function checkRateLimit({ key, limit, now = Date.now(), windowMs }: RateLimitOptions) {
  const state = getRateLimitState();

  sweepExpiredBuckets(state, now);

  const existingBucket = state.buckets.get(key);
  const bucket =
    existingBucket && existingBucket.resetAt > now
      ? existingBucket
      : {
          count: 0,
          resetAt: now + windowMs,
        };

  bucket.count += 1;
  state.buckets.set(key, bucket);

  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  const remaining = Math.max(0, limit - bucket.count);

  return {
    limit,
    remaining,
    resetAt: bucket.resetAt,
    retryAfterSeconds,
    success: bucket.count <= limit,
  } satisfies RateLimitResult;
}

export function getPositiveIntEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);

  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}
