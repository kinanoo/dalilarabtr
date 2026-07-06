import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import logger from '@/lib/logger';
import { SITE_CONFIG } from '@/lib/config';

/**
 * Scheduled content-notification endpoint.
 *
 * The habit loop the site was missing: when new content is published, tell
 * subscribers automatically instead of waiting for an admin to click "broadcast".
 * A tiny external scheduler (GitHub Actions, .github/workflows/cron-notify.yml)
 * hits this URL every ~30 min with the shared secret. We do NOT add a Cloudflare
 * `scheduled()` handler because that would mean surgery on the OpenNext worker
 * entry (open-next.config.ts deliberately ships none) — a plain HTTP route
 * triggered externally is far lower-risk and just as reliable.
 *
 * Safety properties:
 *   - Secret-gated (CRON_SECRET) with a constant-time compare. No secret set →
 *     503, so the endpoint is inert until the owner opts in.
 *   - Stateless + idempotent: "new" = content created in the lookback window,
 *     de-duplicated against notifications already sent (matched by link). A
 *     delayed or double-fired cron can never double-notify.
 *   - Capped per run (MAX_PER_RUN) so a burst of published items can't spam.
 *   - `?dry=1` returns exactly what WOULD be sent without sending — for testing.
 *
 * Runtime: Node.js — reuses `web-push` (VAPID signing + AES-GCM) exactly like
 * /api/admin/push, which is confirmed working under nodejs_compat on Workers.
 */
export const runtime = 'nodejs';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

let vapidConfigured = false;
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
        logger.error('VAPID configuration failed — cron push sending disabled');
    }
}

// Look back further than the cron interval so a delayed tick never misses an
// item; the dedupe pass makes the overlap harmless.
const LOOKBACK_MINUTES = 90;
// Hard cap on notifications emitted per run — a burst publish can't spam devices.
const MAX_PER_RUN = 5;

// Length-safe constant-time string compare (avoids leaking the secret via timing).
function safeEqual(a: string, b: string): boolean {
    if (a.length !== b.length || a.length === 0) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}

interface NotifyItem { link: string; title: string; message: string }

async function handle(request: Request) {
    const secret = process.env.CRON_SECRET;
    // Not configured → inert. Never 200, never reveal anything.
    if (!secret) {
        return NextResponse.json({ error: 'cron_not_configured' }, { status: 503 });
    }

    const url = new URL(request.url);
    const provided = url.searchParams.get('key') || request.headers.get('x-cron-key') || '';
    if (!safeEqual(provided, secret)) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const dryRun = url.searchParams.get('dry') === '1';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json({ error: 'server_config' }, { status: 500 });
    }
    const svc = createClient(supabaseUrl, serviceRoleKey);

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
        return NextResponse.json({ ok: true, newItems: 0, sent: 0, note: 'no new content in window' });
    }

    // ── 2. De-dupe against already-sent notifications (idempotency) ───────
    const links = items.map((i) => i.link);
    const { data: existing } = await svc.from('notifications').select('link').in('link', links);
    const seen = new Set(((existing as { link: string }[] | null) || []).map((r) => r.link));

    let fresh = items.filter((i) => !seen.has(i.link));
    const skippedForCap = Math.max(0, fresh.length - MAX_PER_RUN);
    fresh = fresh.slice(0, MAX_PER_RUN);

    if (dryRun) {
        return NextResponse.json({ ok: true, dryRun: true, candidates: items.length, fresh: fresh.length, skippedForCap, wouldSend: fresh });
    }
    if (fresh.length === 0) {
        return NextResponse.json({ ok: true, newItems: items.length, sent: 0, note: 'all already notified' });
    }

    // ── 3. Load subscribers once (only if push is configured) ────────────
    let subs: { endpoint: string; p256dh: string; auth: string }[] = [];
    if (vapidConfigured) {
        const { data } = await svc.from('push_subscriptions').select('endpoint, p256dh, auth');
        subs = (data as typeof subs) || [];
    }

    // Telegram channel broadcast — the "bot that posts daily". Optional: fires
    // only when both env vars are set (bot token from BotFather + the channel's
    // chat id). Same content as the push/bell, one message per fresh item.
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChat = process.env.TELEGRAM_CHAT_ID;
    const tgEnabled = !!(tgToken && tgChat);
    let tgSent = 0;

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
        else logger.error('cron notify insert failed:', insErr);

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
            try {
                const text = `${item.title}\n\n${item.message}\n\n${SITE_CONFIG.siteUrl}${item.link}`;
                const tgRes = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: tgChat, text }),
                });
                if (tgRes.ok) tgSent++;
                else logger.error('telegram send failed:', tgRes.status);
            } catch (err) {
                logger.error('telegram send error:', err);
            }
        }
    }

    if (expired.length > 0) {
        await svc.from('push_subscriptions').delete().in('endpoint', expired);
    }

    return NextResponse.json({
        ok: true,
        newItems: items.length,
        sent: fresh.length,
        notifInserted,
        subscribers: subs.length,
        pushSuccess,
        pushFail,
        telegramSent: tgSent,
        cleaned: expired.length,
        skippedForCap,
    });
}

export async function GET(request: Request) { return handle(request); }
export async function POST(request: Request) { return handle(request); }
