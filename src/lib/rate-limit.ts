import "server-only";

/**
 * Best-effort, per-instance rate limiting for public forms. Serverless
 * instances do not share memory, so this is a speed bump, not a wall; the
 * database constraints and a honeypot field are the other layers. Replace with
 * a shared store (e.g. Upstash) if abuse appears.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 5, windowMs = 10 * 60_000): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}
