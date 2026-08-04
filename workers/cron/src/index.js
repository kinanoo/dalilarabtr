/**
 * dalilarabtr-cron — the scheduler for content notifications.
 *
 * Why this exists: the schedule used to live in GitHub Actions
 * (.github/workflows/cron-notify.yml). The cron expression there was tightened
 * from every 30 minutes to every 5 to stop headlines sitting unsent — and
 * GitHub ignored it. Measured on 2026-08-04, with the 5-minute expression
 * committed at 13:25 UTC, the workflow actually fired at 15:58, 17:59 and
 * 19:51 — three runs in six and a half hours instead of seventy-eight, and no
 * denser than it had been at 30. GitHub documents scheduled workflows as
 * best-effort and delays them under load; the interval in the file is a
 * request, not a guarantee. So the fix that was supposed to make Telegram
 * prompt changed nothing.
 *
 * Cloudflare cron triggers are not best-effort in that way, and the site
 * already runs on Cloudflare. This worker does nothing but call the endpoint
 * the workflow was calling.
 *
 * Deliberately a SEPARATE worker rather than a `scheduled()` handler on the
 * main site worker: OpenNext generates that entrypoint and it exports only
 * `fetch`, so adding one means wrapping the generated worker — and the bundle
 * cannot be built on Windows to test the wrap (EPERM on symlink in
 * copyTracedFiles). An isolated worker cannot take the site down if it is
 * wrong, and GitHub Actions stays in place as a slow fallback.
 *
 * Safe to run alongside that fallback: the pipeline dedupes by link, so a
 * double call posts nothing twice.
 *
 * Deploy (from workers/cron):
 *   npx wrangler secret put CRON_SECRET   # same value as the site's CRON_SECRET
 *   npx wrangler deploy
 *
 * Without the secret the worker logs and exits — it never calls the endpoint
 * unauthenticated, and the site's route is inert without a secret anyway.
 */

const ENDPOINT = 'https://dalilarabtr.com/api/cron/notify';

export default {
    async scheduled(event, env, ctx) {
        ctx.waitUntil(trigger(env));
    },

    // No route and no workers.dev subdomain is configured, so nothing should
    // ever reach this. Answer plainly if something does — never run the
    // notifier from an unauthenticated HTTP request.
    async fetch() {
        return new Response('cron worker — scheduled only', { status: 405 });
    },
};

async function trigger(env) {
    const secret = env.CRON_SECRET;
    if (!secret) {
        console.error('CRON_SECRET not set — skipping. Run: npx wrangler secret put CRON_SECRET');
        return;
    }

    try {
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'x-cron-key': secret },
        });
        const body = await res.text();
        // Logged to Cloudflare observability (enabled in wrangler.toml), which
        // is the only place a failure would otherwise be visible.
        if (res.ok) {
            console.log(`notify ok ${res.status}: ${body.slice(0, 300)}`);
        } else {
            console.error(`notify failed ${res.status}: ${body.slice(0, 300)}`);
        }
    } catch (err) {
        console.error('notify request threw:', err instanceof Error ? err.message : String(err));
    }
}
