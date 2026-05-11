/**
 * In-memory Token Bucket Rate Limiter
 * 
 * Why: To prevent abuse and ensure system stability.
 * We use a token bucket approach: tokens replenish over time up to a maximum.
 * This implementation is in-memory for this pass (local to each instance).
 */

type TokenBucket = {
  tokens: number;
  lastRefill: number;
};

const buckets = new Map<string, TokenBucket>();

// Configuration from environment variables
const MAX_TOKENS = parseInt(process.env.RATE_LIMIT_MAX || '30', 10);
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);

// How many tokens are added per millisecond
const REFILL_RATE = MAX_TOKENS / WINDOW_MS;

export function checkRateLimit(key: string) {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = { tokens: MAX_TOKENS, lastRefill: now };
  } else {
    // Refill tokens based on time elapsed since last refill
    const elapsed = now - bucket.lastRefill;
    const refill = elapsed * REFILL_RATE;
    bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + refill);
    bucket.lastRefill = now;
  }

  const allowed = bucket.tokens >= 1;
  if (allowed) {
    bucket.tokens -= 1;
  }

  buckets.set(key, bucket);

  // Calculate when we'll have at least 1 token again
  const retryAfterMs = allowed ? 0 : Math.ceil((1 - bucket.tokens) / REFILL_RATE);

  return {
    allowed,
    remaining: Math.floor(bucket.tokens),
    retryAfterMs,
  };
}
