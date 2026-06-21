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
 *   - incrementalCache: 'r2-incremental-cache' → needs an R2 bucket
 *     provisioned first (see wrangler.toml comment). Skipping it means ISR
 *     pages rebuild on every cold start instead of being cached across
 *     workers, but the site stays correct.
 *   - tagCache / queueCache → only useful if we adopt cache tags or use
 *     unstable_revalidateTag. Not in our codebase today.
 *   - cron triggers → no scheduled tasks on the public site.
 */
import { defineCloudflareConfig } from '@opennextjs/cloudflare';

export default defineCloudflareConfig({});
