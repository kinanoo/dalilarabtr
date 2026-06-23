import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import logger from '@/lib/logger';

/**
 * Runtime: Node.js (default — explicit declaration for clarity).
 *
 * The `web-push` library does VAPID JWT signing with `crypto.createSign`
 * and AES-128-GCM payload encryption — both Node-only. Reimplementing
 * the full RFC 8291 + RFC 8292 stack against Web Crypto is ~250 lines
 * of carefully-tested cryptographic code that this codebase doesn't
 * need to maintain.
 *
 * Cloudflare strategy: deploy via @opennextjs/cloudflare adapter (Phase
 * 5) with `compatibility_flags = ["nodejs_compat"]` in wrangler.toml.
 * That exposes `node:crypto` and `node:buffer` to the Worker — both of
 * which `web-push` depends on transitively. Confirmed compatible.
 *
 * Traffic note: only admin calls this route (rate-limited to 10/hour),
 * so the cold-start cost of a Node-compat Worker is a non-issue here.
 */
export const runtime = 'nodejs';

// Configure Web Push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// Track whether push is actually usable. setVapidDetails throws on malformed
// keys (its error never echoes the key value), so guard it and treat any
// failure as "push not configured" rather than crashing module load.
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
        // Do NOT log the error object — it can contain key material. A bare
        // marker is enough; the broadcast endpoint reports this cleanly below.
        logger.error('VAPID configuration failed — push sending disabled');
    }
}

// In-memory per-admin rate limit: max 10 push broadcasts per hour, per admin user.
// Process-local — fine for a single Vercel function instance; a Redis-backed
// limiter would be needed for cross-instance coverage, but for now this caps the
// most common abuse (rapid mass notifications) without external deps.
const PUSH_RATE_WINDOW_MS = 60 * 60 * 1000;
const PUSH_RATE_MAX = 10;
const pushRateLog = new Map<string, number[]>();

function isPushRateLimited(adminId: string): boolean {
    const now = Date.now();
    const cutoff = now - PUSH_RATE_WINDOW_MS;
    const recent = (pushRateLog.get(adminId) || []).filter((t) => t > cutoff);
    if (recent.length >= PUSH_RATE_MAX) {
        pushRateLog.set(adminId, recent);
        return true;
    }
    recent.push(now);
    pushRateLog.set(adminId, recent);
    return false;
}

export async function POST(request: Request) {
    try {
        // ── Auth check ─────────────────────────────────────────────
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll() {},
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('member_profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'محظور' }, { status: 403 });
        }
        // ── End Auth check ─────────────────────────────────────────

        // Rate limit: prevent push-notification spam (10 broadcasts/hour/admin)
        if (isPushRateLimited(user.id)) {
            return NextResponse.json(
                { error: 'تم تجاوز الحد المسموح: 10 إشعارات في الساعة. حاول لاحقاً.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { title, message, url } = body;

        // Input validation
        if (!title || typeof title !== 'string' || title.length > 200) {
            return NextResponse.json({ error: 'عنوان غير صالح (الحد 200 حرف)' }, { status: 400 });
        }
        if (message && (typeof message !== 'string' || message.length > 1000)) {
            return NextResponse.json({ error: 'رسالة طويلة جداً (الحد 1000 حرف)' }, { status: 400 });
        }
        // URL must be a same-origin relative path. The earlier check allowed
        // any http(s):// URL — tighten to only relative paths to prevent admin
        // accounts being used to push phishing links to users' devices.
        if (url) {
            if (typeof url !== 'string' || url.length > 500 || !/^\/[a-z0-9_\-/?=&#%.]*$/i.test(url)) {
                return NextResponse.json({ error: 'رابط غير صالح — يجب أن يبدأ بـ / ويكون مساراً داخلياً' }, { status: 400 });
            }
        }

        // Default to /updates if no meaningful URL
        const targetUrl = (url && url !== '/') ? url : '/updates';

        // Service-role client for writes the anon-key client can't make (RLS-safe)
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            return NextResponse.json({ error: 'server_config' }, { status: 500 });
        }
        const serviceClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey
        );

        // ── 1. Save to in-site notifications (visible in bell icon) ──
        // Use the service-role client so the insert is guaranteed regardless
        // of RLS policies on the notifications table.
        await serviceClient
            .from('notifications')
            .insert({
                type: 'announcement',
                title,
                message,
                link: targetUrl,
                icon: '📢',
                priority: 'high',
                target_audience: 'all',
                is_active: true,
            });

        // Audit-log the broadcast so we always know who pushed what.
        // Supabase builders return PromiseLike, not Promise, so we wrap in an
        // async IIFE to get a real try/catch (avoids the TS2339 .catch error).
        void (async () => {
            try {
                await serviceClient
                    .from('admin_activity_log')
                    .insert({
                        event_type: 'push_broadcast',
                        title: `Push: ${title.slice(0, 100)}`,
                        detail: (message || '').slice(0, 300),
                        entity_table: 'notifications',
                        entity_id: null,
                        actor_user_id: user.id,
                    });
            } catch (err) {
                logger.error('audit log for push failed:', err);
            }
        })();

        // ── 2. Send push notifications to subscribed devices ─────────
        // If VAPID isn't configured, skip the send entirely. The in-site
        // notification above is already saved, so the bell still updates; we
        // just report honestly that no device pushes went out instead of
        // returning success while every send silently fails.
        if (!vapidConfigured) {
            return NextResponse.json({
                success: true,
                pushSent: false,
                reason: 'push_not_configured',
                successCount: 0,
                failCount: 0,
                cleaned: 0,
                totalSubscribers: 0,
            });
        }

        const { data: subscriptions, error: subError } = await serviceClient
            .from('push_subscriptions')
            .select('endpoint, p256dh, auth');

        if (subError) {
            return NextResponse.json({ error: 'فشل تحميل الاشتراكات' }, { status: 500 });
        }

        let successCount = 0;
        let failCount = 0;
        const expiredEndpoints: string[] = [];

        if (subscriptions && subscriptions.length > 0) {
            const payload = JSON.stringify({ title, message, url: targetUrl });

            const promises = subscriptions.map((sub) =>
                webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth,
                        },
                    },
                    payload
                )
                    .then(() => { successCount++; })
                    .catch((err: any) => {
                        failCount++;
                        if (err?.statusCode === 410 || err?.statusCode === 404) {
                            expiredEndpoints.push(sub.endpoint);
                        }
                    })
            );

            await Promise.all(promises);

            // Clean up expired subscriptions (use service client; anon key
            // would be blocked by RLS on push_subscriptions writes).
            if (expiredEndpoints.length > 0) {
                await serviceClient
                    .from('push_subscriptions')
                    .delete()
                    .in('endpoint', expiredEndpoints);
            }
        }

        return NextResponse.json({
            success: true,
            successCount,
            failCount,
            cleaned: expiredEndpoints.length,
            totalSubscribers: subscriptions?.length || 0,
        });

    } catch (error) {
        logger.error('Push notification error:', error);
        return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
    }
}
