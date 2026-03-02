/**
 * Simple in-memory rate limiter for serverless API routes.
 * Uses a sliding window approach with automatic cleanup.
 *
 * Note: On Vercel serverless, each cold start resets the map.
 * This is acceptable for basic abuse prevention (not strict enforcement).
 */

const rateMap = new Map<string, { count: number; resetAt: number }>();

// Cleanup stale entries every 60s to prevent memory growth
let lastCleanup = Date.now();
function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < 60_000) return;
    lastCleanup = now;
    for (const [key, val] of rateMap) {
        if (now > val.resetAt) rateMap.delete(key);
    }
}

/**
 * Check if a request should be rate-limited.
 * @param key - Unique identifier (e.g. IP hash)
 * @param limit - Max requests per window
 * @param windowMs - Window duration in ms (default 60s)
 * @returns true if the request should be BLOCKED
 */
export function isRateLimited(key: string, limit: number, windowMs = 60_000): boolean {
    cleanup();
    const now = Date.now();
    const entry = rateMap.get(key);

    if (!entry || now > entry.resetAt) {
        rateMap.set(key, { count: 1, resetAt: now + windowMs });
        return false;
    }

    entry.count++;
    return entry.count > limit;
}
