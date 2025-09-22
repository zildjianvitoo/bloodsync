const rateState = globalThis as unknown as {
  rateMap?: Map<string, { tokens: number; updatedAt: number }>;
};

const map = rateState.rateMap ?? new Map();
if (!rateState.rateMap) {
  rateState.rateMap = map;
}

type RateLimitOptions = {
  windowMs: number;
  limit: number;
};

export function rateLimit(identifier: string, { windowMs, limit }: RateLimitOptions) {
  const now = Date.now();
  const current = map.get(identifier);
  if (!current || now - current.updatedAt > windowMs) {
    map.set(identifier, { tokens: 1, updatedAt: now });
    return { allowed: true, remaining: limit - 1 };
  }

  if (current.tokens >= limit) {
    return { allowed: false, remaining: 0 };
  }

  current.tokens += 1;
  current.updatedAt = now;
  map.set(identifier, current);
  return { allowed: true, remaining: Math.max(limit - current.tokens, 0) };
}
