import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runNotifyPipeline, resolveTelegramChat } from '@/lib/notify/pipeline';

/**
 * Scheduled content-notification endpoint (the 30-min safety net).
 *
 * The actual send logic lives in @/lib/notify/pipeline — shared with
 * /api/admin/notify-now, which the editor fires the instant content is
 * published. This route is just the secret-gated scheduler entry: a tiny
 * external scheduler (GitHub Actions, .github/workflows/cron-notify.yml) hits
 * it every ~30 min. Because the pipeline is idempotent (dedupe by link), the
 * cron only ever picks up items the instant path somehow missed — a delayed
 * publish, a failed notify-now call — and never double-posts.
 *
 * We do NOT add a Cloudflare `scheduled()` handler because that would mean
 * surgery on the OpenNext worker entry (open-next.config.ts deliberately ships
 * none) — a plain HTTP route triggered externally is lower-risk and just as
 * reliable.
 *
 * Safety: secret-gated (CRON_SECRET) with a constant-time compare — no secret
 * set → 503, so the endpoint is inert until the owner opts in. `?dry=1` previews
 * without sending; `?tgtest=1` sends one Telegram probe and reports config.
 *
 * Runtime: Node.js — the pipeline uses `web-push` (VAPID + AES-GCM).
 */
export const runtime = 'nodejs';

// Length-safe constant-time string compare (avoids leaking the secret via timing).
function safeEqual(a: string, b: string): boolean {
    if (a.length !== b.length || a.length === 0) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}

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

    // Diagnostic: ?tgtest=1 sends ONE message straight to the Telegram channel
    // and reports exactly why it did/didn't work — no fresh content needed.
    // Cron-key gated (checked above), so it's not publicly abusable.
    if (url.searchParams.get('tgtest') === '1') {
        const tgToken = process.env.TELEGRAM_BOT_TOKEN;
        const tgChat = resolveTelegramChat();
        if (!tgToken) {
            return NextResponse.json({ tgtest: true, tgEnabled: false, hasToken: false, note: 'bot token secret missing in the worker' });
        }
        try {
            const r = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: tgChat, text: '✅ اختبار إشعار تلغرام من دليل العرب — يمكن تجاهله.' }),
            });
            return NextResponse.json({ tgtest: true, tgEnabled: true, status: r.status, ok: r.ok, response: (await r.text()).slice(0, 300) });
        } catch (err) {
            return NextResponse.json({ tgtest: true, tgEnabled: true, error: String(err) });
        }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json({ error: 'server_config' }, { status: 500 });
    }
    const svc = createClient(supabaseUrl, serviceRoleKey);

    const result = await runNotifyPipeline(svc, { dryRun: url.searchParams.get('dry') === '1' });
    return NextResponse.json(result);
}

export async function GET(request: Request) { return handle(request); }
export async function POST(request: Request) { return handle(request); }
