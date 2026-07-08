import webpush from 'web-push';
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
 * Gather freshly-published content, de-dupe against what was already notified,
 * and fan out to bell + push + Telegram. Pass `{ dryRun: true }` to preview
 * exactly what WOULD be sent without sending.
 */
export async function runNotifyPipeline(
    svc: SupabaseClient,
    opts: { dryRun?: boolean } = {}
): Promise<NotifyResult> {
    const dryRun = !!opts.dryRun;
    // Chat handle always resolves (public default), so Telegram is "enabled"
    // exactly when the bot-token Secret is present.
    const tgEnabled = !!process.env.TELEGRAM_BOT_TOKEN;

    const cutoffIso = new Date(Date.now() - LOOKBACK_MINUTES * 60_000).toISOString();

    // ── 1. Gather freshly-published content ──────────────────────────────
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

    if (items.length === 0) {
        return { ok: true, newItems: 0, sent: 0, note: 'no new content in window', tgEnabled };
    }

    // ── 2. De-dupe against already-sent notifications (idempotency) ───────
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

    // ── 3. Load subscribers once (only if push is configured) ────────────
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

        // Device push — reuse the proven web-push send/cleanup path.
        if (vapidConfigured && subs.length > 0) {
            const payload = JSON.stringify({ title: item.title, message: item.message, url: item.link });
            await Promise.all(subs.map((s) =>
                webpush.sendNotification(
                    { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
                    payload
                )
                    .then(() => { pushSuccess++; })
                    .catch((err: unknown) => {
                        pushFail++;
                        const code = (err as { statusCode?: number })?.statusCode;
                        if (code === 410 || code === 404) expired.push(s.endpoint);
                    })
            ));
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

    const { data, count } = await svc
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth', { count: 'exact' })
        .limit(1);
    const sub = (data as { endpoint: string; p256dh: string; auth: string }[] | null)?.[0];
    info.subCount = count ?? (data ? data.length : 0);
    if (!sub) return { ...info, note: 'no subscription rows to probe' };

    let endpointHost = '';
    try { endpointHost = new URL(sub.endpoint).host; } catch { /* ignore */ }
    info.endpointHost = endpointHost;
    info.p256dhLen = (sub.p256dh || '').length;
    info.authLen = (sub.auth || '').length;

    if (!requestTimeConfigured) {
        return { ...info, result: 'CANNOT_SEND', note: 'VAPID not configured at request time' };
    }

    try {
        await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ title: 'اختبار الإشعارات', message: 'رسالة فحص — تجاهلها', url: '/updates' })
        );
        return { ...info, result: 'SENT_OK' };
    } catch (err) {
        const e = err as { statusCode?: number; body?: string; name?: string; message?: string };
        return {
            ...info,
            result: 'FAILED',
            statusCode: e?.statusCode ?? null,
            errName: e?.name ?? null,
            body: (typeof e?.body === 'string' ? e.body : (e?.message || String(err))).slice(0, 400),
        };
    }
}
