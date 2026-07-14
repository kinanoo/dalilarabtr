import logger from '@/lib/logger';

/**
 * Race a promise against a timeout. Returns fallback value on timeout.
 * Use for Supabase queries to prevent pages from hanging.
 *
 * Lives in its own module (moved out of supabaseClient.ts) so CLIENT
 * components can cap waits without statically importing supabaseClient —
 * that import drags all of supabase-js into their first-load JS.
 * supabaseClient re-exports it, so existing importers keep working.
 */
export function withTimeout<T>(promise: PromiseLike<T> | Promise<T>, ms = 8000): Promise<T | null> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<null>(resolve => setTimeout(() => {
      logger.warn(`Supabase query timed out after ${ms}ms`);
      return resolve(null);
    }, ms)),
  ]);
}
