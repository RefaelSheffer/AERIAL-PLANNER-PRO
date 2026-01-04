type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimits = new Map<string, RateLimitEntry>();

export const checkRateLimit = (
  key: string,
  limit: number,
  windowMs: number,
) => {
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || now >= entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfterMs: Math.max(0, entry.resetAt - now) };
  }

  entry.count += 1;
  return { allowed: true, retryAfterMs: Math.max(0, entry.resetAt - now) };
};
