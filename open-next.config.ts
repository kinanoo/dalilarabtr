/**
 * OpenNext + Cloudflare adapter config.
 *
 * Defines how @opennextjs/cloudflare wraps the Next.js build for the Workers
 * runtime. Most apps need only the defaults; we keep this file minimal so
 * adapter upgrades pick up new sensible defaults without us blocking them.
 *
 * Customization happens in two places only:
 *   1. wrangler.toml — runtime bindings (KV, R2, D1, env vars, compat flags)
 *   2. This file     — build-time transforms (cache override, fetch override,
 *                      worker wrapper, queue/tag cache adapters)
 *
 * What we deliberately do NOT enable yet:
 *   - tagCache / queueCache → only useful if we adopt cache tags or use
 *     unstable_revalidateTag. Not in our codebase today.
 *   - cron triggers → no scheduled tasks on the public site.
 *
 * ── Incremental cache (R2) ──────────────────────────────────────────────────
 * Without a shared cache store, every worker isolate re-rendered ISR pages
 * from scratch on cold start — so `revalidate` windows bought far less than
 * they looked like they did, and each rebuild meant fresh Supabase reads.
 * The R2 store is shared across isolates, so one render serves every worker
 * until the window expires.
 *
 * withRegionalCache wraps it so repeat hits in the same Cloudflare region are
 * served from the local Cache API instead of round-tripping to R2 — fewer R2
 * Class B operations, which is what the R2 free tier meters. 'long-lived' is
 * the right mode for this site: pages are ISR/SSG content that changes on
 * publish, and publishing purges paths on demand via /api/admin/revalidate.
 *
 * DEPLOY ORDER MATTERS: the NEXT_INC_CACHE_R2_BUCKET binding in wrangler.toml
 * must point at a bucket that already exists. Create it first
 * (`wrangler r2 bucket create dalilarab`, or the Cloudflare dashboard)
 * — deploying this config against a missing bucket fails the deploy.
 */
import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
import { withRegionalCache } from '@opennextjs/cloudflare/overrides/incremental-cache/regional-cache';

export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: 'long-lived' }),
});
