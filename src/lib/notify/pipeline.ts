import webpush from 'web-push';
import crypto from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import logger from '@/lib/logger';
import { SITE_CONFIG } from '@/lib/config';

/**
 * Single source of truth for content notifications (in-site bell + web-push +
 * Telegram channel).
 *
 * Both callers run the EXACT same pass, so there is only one dedup key and one
 * message format:
 *   - /api/cron/notify        — every 30 min (safety net, secret-gated)
 *   - /api/admin/notify-now   — fired instantly by the editor at publish time
 *
 * Idempotency is what makes "instant + a 30-min cron" safe: "new" = content
 * created in the lookback window, de-duplicated against notifications already
 * sent (matched by canonical `link`). Publishing calls notify-now → the item
 * goes out at once; the next cron tick finds it already in `notifications` and
 * skips it. No double-post, ever — provided every path inserts the SAME
 * canonical link (that is the whole reason this logic lives in one place and
 * the editors no longer craft their own ad-hoc /updates or /article/${id} link).
 *
 * Runtime: Node.js — `web-push` needs node:crypto (VAPID JWT + AES-GCM),
 * confirmed working under nodejs_compat on Cloudflare Workers.
 */

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// Track whether push is actually usable. setVapidDetails throws on malformed
// keys (its error never echoes key material), so guard it and treat any failure
// as "push not configured" rather than crashing module load.
export let vapidConfigured = false;
if (vapidPublicKey && vapidPrivateKey) {
    try {
        webpush.setVapidDetails(
            `mailto:${process.env.ADMIN_EMAIL || 'support@dalilarab.com'}`,
            vapidPublicKey,
            vapidPrivateKey
        );
        vapidConfigured = true;
    } catch {
        // Never log the error object — it can carry key material.
        logger.error('VAPID configuration failed — push sending disabled');
    }
}

// Look back further than the cron interval so a delayed tick never misses an
// item; the dedupe pass makes the overlap harmless.
export const LOOKBACK_MINUTES = 90;
// Hard cap on notifications emitted per run — a burst publish can't spam devices.
export const MAX_PER_RUN = 5;

export interface NotifyItem { link: string; title: string; message: string }

export interface NotifyResult {
    ok: true;
    newItems: number;
    sent: number;
    notifInserted?: number;
    subscribers?: number;
    pushSuccess?: number;
    pushFail?: number;
    telegramSent?: number;
    tgEnabled: boolean;
    tgError?: string | null;
    cleaned?: number;
    skippedForCap?: number;
    dryRun?: boolean;
    candidates?: number;
    fresh?: number;
    wouldSend?: NotifyItem[];
    note?: string;
}

/**
 * Public Telegram channel handle. Hardcoded as the default target ON PURPOSE:
 * plain-text Cloudflare `vars` get wiped on every `wrangler deploy` (only
 * encrypted Secrets survive), and this handle kept vanishing after deploys.
 * It's a PUBLIC channel — anyone can read @dalilarabtr — so baking it in is
 * safe and removes a whole class of "env var disappeared" outages. A
 * TELEGRAM_CHAT_ID env value (Secret) still overrides it if ever needed.
 *
 * The bot TOKEN stays env-only (a real secret) — never hardcode it.
 */
export const DEFAULT_TELEGRAM_CHAT = '@dalilarabtr';
export function resolveTelegramChat(): string {
    return process.env.TELEGRAM_CHAT_ID || DEFAULT_TELEGRAM_CHAT;
}

/**
 * Post one message to the Telegram channel. Fires whenever the bot token is
 * present (the chat handle always has a public default). Returns a plain
 * ok/error — never throws — so a Telegram outage can't break the bell/push path.
 */
export async function sendTelegram(text: string): Promise<{ ok: boolean; error: string | null }> {
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!tgToken) return { ok: false, error: 'tg_not_configured' };
    const tgChat = resolveTelegramChat();
    try {
        const res = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: tgChat, text }),
        });
        if (res.ok) return { ok: true, error: null };
        return { ok: false, error: `HTTP ${res.status}: ${(await res.text()).slice(0, 160)}` };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
}

/**
 * Dispatch ONE web-push. Uses web-push ONLY to build the encrypted body + VAPID
 * headers (`generateRequestDetails`), then sends over `fetch()`.
 *
 * WHY not `webpush.sendNotification()`: it transports via node:https
 * `https.request`, which Cloudflare Workers' unenv Node-compat layer leaves as
 * an unimplemented stub — every send threw "[unenv] https.request is not
 * implemented yet!" before any HTTP, so all 145 subscribers silently failed
 * (statusCode:null, 0 cleaned). `fetch()` is native on Workers, so routing the
 * SAME encrypted request through it restores delivery while reusing web-push's
 * proven VAPID JWT + aes128gcm crypto (node:crypto DOES work under nodejs_compat).
 *
 * Returns ok + the raw HTTP status; callers decide what to prune (404/410 =
 * gone; 403 = key mismatch, prune only when other sends succeed).
 */
export async function dispatchWebPush(
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: string
): Promise<{ ok: boolean; statusCode: number | null; error: string | null }> {
    let details: ReturnType<typeof webpush.generateRequestDetails>;
    try {
        details = webpush.generateRequestDetails(subscription, payload);
    } catch (e) {
        return { ok: false, statusCode: null, error: 'encrypt_failed: ' + String((e as Error)?.message || e).slice(0, 140) };
    }
    // fetch computes Content-Length itself; forwarding web-push's manual one can
    // conflict on some runtimes, so drop it (case-insensitively).
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(details.headers || {})) {
        if (k.toLowerCase() === 'content-length') continue;
        headers[k] = String(v);
    }
    try {
        const res = await fetch(details.endpoint, {
            method: details.method || 'POST',
            headers,
            body: details.body ? (details.body as unknown as BodyInit) : undefined,
        });
        if (res.status >= 200 && res.status < 300) return { ok: true, statusCode: res.status, error: null };
        return { ok: false, statusCode: res.status, error: `HTTP ${res.status}` };
    } catch (e) {
        return { ok: false, statusCode: null, error: String((e as Error)?.message || e).slice(0, 140) };
    }
}

/**
 * Classify a batch of dispatch results into endpoints safe to delete.
 *   - 404/410  → the subscription is gone; always prune.
 *   - 403      → VAPID key mismatch (stale sub from an old key). Prune ONLY when
 *                at least one send in the batch succeeded — otherwise an all-403
 *                batch signals a systemic signing problem, and we must NOT wipe
 *                every subscriber over a config glitch.
 */
export function deadEndpoints(
    results: { endpoint: string; statusCode: number | null; ok: boolean }[]
): string[] {
    const anyOk = results.some((r) => r.ok);
    const dead: string[] = [];
    for (const r of results) {
        if (r.ok) continue;
        if (r.statusCode === 404 || r.statusCode === 410) dead.push(r.endpoint);
        else if (r.statusCode === 403 && anyOk) dead.push(r.endpoint);
    }
    return dead;
}

/**
 * De-dupe a list of items against already-sent notifications, then fan out to
 * bell + push + Telegram. Shared by BOTH the time-window scan (cron) and the
 * per-article instant path, so they dedup on the same key and never double-send.
 * Pass `{ dryRun: true }` to preview what WOULD be sent without sending.
 */
async function sendItems(
    svc: SupabaseClient,
    items: NotifyItem[],
    opts: { dryRun?: boolean } = {}
): Promise<NotifyResult> {
    const dryRun = !!opts.dryRun;
    // Chat handle always resolves (public default), so Telegram is "enabled"
    // exactly when the bot-token Secret is present.
    const tgEnabled = !!process.env.TELEGRAM_BOT_TOKEN;

    if (items.length === 0) {
        return { ok: true, newItems: 0, sent: 0, note: 'no new content', tgEnabled };
    }

    // ── De-dupe against already-sent notifications (idempotency) ──────────
    const links = items.map((i) => i.link);
    const { data: existing } = await svc.from('notifications').select('link').in('link', links);
    const seen = new Set(((existing as { link: string }[] | null) || []).map((r) => r.link));

    let fresh = items.filter((i) => !seen.has(i.link));
    const skippedForCap = Math.max(0, fresh.length - MAX_PER_RUN);
    fresh = fresh.slice(0, MAX_PER_RUN);

    if (dryRun) {
        return { ok: true, dryRun: true, candidates: items.length, fresh: fresh.length, skippedForCap, wouldSend: fresh, tgEnabled, newItems: items.length, sent: 0 };
    }
    if (fresh.length === 0) {
        return { ok: true, newItems: items.length, sent: 0, note: 'all already notified', tgEnabled };
    }

    // ── Load subscribers once (only if push is configured) ───────────────
    let subs: { endpoint: string; p256dh: string; auth: string }[] = [];
    if (vapidConfigured) {
        const { data } = await svc.from('push_subscriptions').select('endpoint, p256dh, auth');
        subs = (data as typeof subs) || [];
    }

    let tgSent = 0;
    let tgError: string | null = null;
    let notifInserted = 0;
    let pushSuccess = 0;
    let pushFail = 0;
    const expired: string[] = [];

    for (const item of fresh) {
        // In-site notification (bell) — always, even with zero push subscribers.
        const { error: insErr } = await svc.from('notifications').insert({
            type: 'announcement',
            title: item.title,
            message: item.message,
            link: item.link,
            icon: '📢',
            priority: 'high',
            target_audience: 'all',
            is_active: true,
        });
        if (!insErr) notifInserted++;
        else logger.error('notify insert failed:', insErr);

        // Device push — fetch-based transport (Workers-native), see dispatchWebPush.
        if (vapidConfigured && subs.length > 0) {
            const payload = JSON.stringify({ title: item.title, message: item.message, url: item.link });
            const results = await Promise.all(subs.map(async (s) => {
                const r = await dispatchWebPush({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
                if (r.ok) pushSuccess++; else pushFail++;
                return { endpoint: s.endpoint, statusCode: r.statusCode, ok: r.ok };
            }));
            expired.push(...deadEndpoints(results));
        }

        // Telegram post — one message per fresh item to the channel.
        if (tgEnabled) {
            const text = `${item.title}\n\n${item.message}\n\n${SITE_CONFIG.siteUrl}${item.link}`;
            const r = await sendTelegram(text);
            if (r.ok) tgSent++;
            else { tgError = r.error; logger.error('telegram send failed:', r.error); }
        }
    }

    // Clean up expired subscriptions (service client; anon key blocked by RLS).
    if (expired.length > 0) {
        await svc.from('push_subscriptions').delete().in('endpoint', expired);
    }

    return {
        ok: true,
        newItems: items.length,
        sent: fresh.length,
        notifInserted,
        subscribers: subs.length,
        pushSuccess,
        pushFail,
        telegramSent: tgSent,
        tgEnabled,
        tgError,
        cleaned: expired.length,
        skippedForCap,
    };
}

/**
 * Time-window scan (the 30-min cron safety net): gather content published in
 * the last LOOKBACK_MINUTES and notify anything not already sent.
 */
export async function runNotifyPipeline(
    svc: SupabaseClient,
    opts: { dryRun?: boolean } = {}
): Promise<NotifyResult> {
    const cutoffIso = new Date(Date.now() - LOOKBACK_MINUTES * 60_000).toISOString();
    const [artRes, updRes] = await Promise.all([
        svc.from('articles')
            .select('id, slug, title, created_at')
            .eq('status', 'approved')
            .gt('created_at', cutoffIso)
            .order('created_at', { ascending: false })
            .limit(20),
        svc.from('updates')
            .select('id, title, created_at')
            .eq('active', true)
            .gt('created_at', cutoffIso)
            .order('created_at', { ascending: false })
            .limit(20),
    ]);

    const items: NotifyItem[] = [];
    for (const a of (artRes.data as { id: string; slug: string | null; title: string }[] | null) || []) {
        items.push({ link: `/article/${a.slug || a.id}`, title: 'مقال جديد على دليل العرب 📖', message: a.title });
    }
    for (const u of (updRes.data as { id: string; title: string }[] | null) || []) {
        items.push({ link: `/updates?u=${u.id}`, title: 'تحديث جديد ⚡', message: u.title });
    }

    return sendItems(svc, items, opts);
}

/**
 * Instant path: notify ONE specific article the moment it's published/approved,
 * regardless of its created_at — so approving an OLD pending draft still fires
 * (the time-window scan would miss it). Deduped by link, so it's safe even if
 * the cron later scans the same article. No-op if the article isn't approved.
 */
export async function notifyArticle(svc: SupabaseClient, articleId: string): Promise<NotifyResult> {
    const tgEnabled = !!process.env.TELEGRAM_BOT_TOKEN;
    const { data } = await svc
        .from('articles')
        .select('id, slug, title, status')
        .eq('id', articleId)
        .limit(1);
    const a = (data as { id: string; slug: string | null; title: string; status: string }[] | null)?.[0];
    if (!a) return { ok: true, newItems: 0, sent: 0, note: 'article not found', tgEnabled };
    if (a.status !== 'approved') return { ok: true, newItems: 0, sent: 0, note: 'article not approved', tgEnabled };

    const item: NotifyItem = { link: `/article/${a.slug || a.id}`, title: 'مقال جديد على دليل العرب 📖', message: a.title };
    return sendItems(svc, [item], {});
}

/**
 * Diagnostic: attempt ONE real web-push to the first stored subscription and
 * return the raw failure so we can classify why every send fails. It reports:
 *   - moduleLoadVapidConfigured — did setVapidDetails succeed at cold start
 *     (if false while the keys ARE present, env wasn't in process.env yet).
 *   - a NON-secret fingerprint of the public key (len + head/tail) so it can be
 *     compared against the key the BROWSER subscribed with (mismatch = 403).
 *     Private key: presence + length only, never the value.
 *   - the WebPushError statusCode + body + endpoint host: the smoking gun.
 *       401/403 + "VAPID"/"Unauthorized"      → signing key mismatch/invalid JWT
 *       404/410                                → that endpoint expired (stale sub)
 *       throws before HTTP / 400               → encryption/library broken on Workers
 * Cron-key gated by the caller. Sends one real notification only on success.
 */
export async function pushProbe(svc: SupabaseClient): Promise<Record<string, unknown>> {
    const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
    const priv = process.env.VAPID_PRIVATE_KEY || '';
    const info: Record<string, unknown> = {
        moduleLoadVapidConfigured: vapidConfigured,
        hasPublicKey: !!pub,
        hasPrivateKey: !!priv,
        publicKeyLen: pub.length,
        publicKeyHead: pub.slice(0, 10),
        publicKeyTail: pub.slice(-8),
        privateKeyLen: priv.length,
    };

    // Re-apply VAPID at REQUEST time (keys are reliably in process.env now, even
    // if they weren't at module load under OpenNext). Distinguishes a cold-start
    // timing problem from a genuinely bad key/signature.
    let requestTimeConfigured = false;
    let setVapidError: string | null = null;
    if (pub && priv) {
        try {
            webpush.setVapidDetails(`mailto:${process.env.ADMIN_EMAIL || 'support@dalilarab.com'}`, pub, priv);
            requestTimeConfigured = true;
        } catch (e) {
            setVapidError = String((e as Error)?.message || e).slice(0, 200);
        }
    }
    info.requestTimeConfigured = requestTimeConfigured;
    info.setVapidError = setVapidError;

    // Is the configured keypair self-consistent? Derive the public key from the
    // private scalar and compare to the configured public key. If they MATCH,
    // the config is fine and a 403 means the stored subs were created with an
    // OLD public key (users must re-subscribe). If they DON'T match, the pair
    // itself is broken and even fresh subs would 403.
    try {
        if (priv && pub) {
            const ecdh = crypto.createECDH('prime256v1');
            ecdh.setPrivateKey(Buffer.from(priv, 'base64url'));
            const derived = ecdh.getPublicKey().toString('base64url');
            info.derivedPublicHead = derived.slice(0, 10);
            info.derivedPublicTail = derived.slice(-8);
            info.keypairSelfConsistent = derived === pub;
        }
    } catch (e) {
        info.keypairCheckError = String((e as Error)?.message || e).slice(0, 140);
    }

    // Probe the NEWEST subscription so a fresh re-subscribe can be verified.
    // Fall back to unordered if the table has no created_at column.
    let q = await svc
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(1);
    if (q.error) {
        q = await svc.from('push_subscriptions').select('endpoint, p256dh, auth', { count: 'exact' }).limit(1);
    }
    const sub = (q.data as { endpoint: string; p256dh: string; auth: string }[] | null)?.[0];
    info.subCount = q.count ?? (q.data ? q.data.length : 0);
    if (!sub) return { ...info, note: 'no subscription rows to probe' };

    let endpointHost = '';
    try { endpointHost = new URL(sub.endpoint).host; } catch { /* ignore */ }
    info.endpointHost = endpointHost;
    info.p256dhLen = (sub.p256dh || '').length;
    info.authLen = (sub.auth || '').length;

    if (!requestTimeConfigured) {
        return { ...info, result: 'CANNOT_SEND', note: 'VAPID not configured at request time' };
    }

    const r = await dispatchWebPush(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title: 'اختبار الإشعارات', message: 'رسالة فحص — تجاهلها', url: '/updates' })
    );
    return { ...info, result: r.ok ? 'SENT_OK' : 'FAILED', statusCode: r.statusCode, body: r.error };
}
