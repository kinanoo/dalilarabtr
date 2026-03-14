import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Configure Web Push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        `mailto:${process.env.ADMIN_EMAIL || 'support@dalilarab.com'}`,
        vapidPublicKey,
        vapidPrivateKey
    );
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

        const body = await request.json();
        const { title, message, url } = body;

        // Input validation
        if (!title || typeof title !== 'string' || title.length > 200) {
            return NextResponse.json({ error: 'عنوان غير صالح (الحد 200 حرف)' }, { status: 400 });
        }
        if (message && (typeof message !== 'string' || message.length > 1000)) {
            return NextResponse.json({ error: 'رسالة طويلة جداً (الحد 1000 حرف)' }, { status: 400 });
        }
        // URL must be a relative path (no external URLs to prevent phishing)
        if (url && (typeof url !== 'string' || url.length > 500 || (!url.startsWith('/') && !url.startsWith('http')))) {
            return NextResponse.json({ error: 'رابط غير صالح' }, { status: 400 });
        }

        // Default to /updates if no meaningful URL
        const targetUrl = (url && url !== '/') ? url : '/updates';

        // ── 1. Save to in-site notifications (visible in bell icon) ──
        await supabase
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

        // ── 2. Send push notifications to subscribed devices ─────────
        const { data: subscriptions, error: subError } = await supabase
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

            // Clean up expired subscriptions
            if (expiredEndpoints.length > 0) {
                await supabase
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
        console.error('Push notification error:', error);
        return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
    }
}
