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
 *   - queueCache → background ISR revalidation via a queue. On-demand purge
 *     covers our editing flow; the ISR window covers the rest.
 *   - cron triggers → no scheduled tasks on the public site.
 *
 * ── Tag cache (Durable Object) ──────────────────────────────────────────────
 * This was previously left at the adapter default, `"dummy"`, on the reasoning
 * that we don't use cache tags. That reasoning was wrong, and it cost us
 * silently: `revalidatePath()` does not delete anything: it writes a tag into
 * the tag cache, and the next read asks the tag cache whether the entry is
 * stale. The dummy implementation is a pair of no-ops — `writeTags` returns
 * immediately and `isStale` always returns false. So every call to
 * /api/admin/revalidate returned 200 and purged nothing; edits waited out the
 * full ISR window while the admin UI reported instant success.
 *
 * It matters more now: the contact switch and the WhatsApp number resolve in
 * the ROOT LAYOUT, so closing contact has to reach all 357+ pages at once.
 * `revalidatePath('/', 'layout')` writes the implicit tag `_N_T_/layout`,
 * which Next attaches to every single page (`getDerivedTags` always seeds the
 * list with `/layout`) — one write, whole site.
 *
 * Durable Object rather than KV or D1, because:
 *   - It is strongly consistent. The KV tag cache is documented as
 *     experimental and eventually consistent "up to 60s" — which is exactly
 *     the delay we are trying to remove.
 *   - It needs no resource created ahead of the deploy. The DO class ships
 *     inside the generated worker and the wrangler migration creates the
 *     namespace; R2/KV/D1 all fail the deploy if the resource is missing.
 *   - If the binding ever disappears, `getConfig()` degrades to
 *     `{ isDisabled: true }` — pages serve from cache as they do today rather
 *     than erroring.
 *
 * regionalCache keeps a 5s copy of tag data in the local Cache API, so the
 * steady state is not a DO round trip per request. 5s is the worst-case lag
 * between the owner flipping a switch and the site reflecting it.
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
import doShardedTagCache from '@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache';

export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: 'long-lived' }),
  tagCache: doShardedTagCache({
    // 4 shards is the adapter default and far more than this site's write
    // volume needs — writes only happen when an admin publishes or edits.
    baseShardSize: 4,
    regionalCache: true,
    regionalCacheTtlSec: 5,
  }),
});
