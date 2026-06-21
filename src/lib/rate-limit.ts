/**
 * Simple in-memory rate limiter for serverless API routes.
 * Uses a sliding window approach with automatic cleanup.
 *
 * Note: each cold start / new Worker isolate resets the map, and isolates
 * don't share state — so this is best-effort abuse prevention, not strict
 * enforcement. For hard limits, layer Cloudflare's native Rate Limiting Rules
 * on top (dashboard-configured, enforced at the edge before the Worker runs).
 */

/**
 * Resolve the real client IP for rate-limit keys and IP hashing.
 *
 * IMPORTANT: on Cloudflare, `cf-connecting-ip` is set by the edge and CANNOT
 * be forged by the caller. `x-forwarded-for` IS caller-controllable — a script
 * can send a different value on every request and sail past any per-IP limit.
 * Trust cf-connecting-ip first; fall back to x-forwarded-for only for local
 * dev / non-Cloudflare environments.
 */
export function getClientIp(req: { headers: { get(name: string): string | null } }): string {
    return (
        req.headers.get('cf-connecting-ip')?.trim() ||
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip')?.trim() ||
        'unknown'
    );
}

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
