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
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('member_profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        // ── End Auth check ─────────────────────────────────────────

        const body = await request.json();
        const { title, message, url, subscriptions } = body;

        if (!subscriptions || !Array.isArray(subscriptions) || subscriptions.length === 0) {
            return NextResponse.json({ error: 'No subscriptions provided' }, { status: 400 });
        }

        const payload = JSON.stringify({ title, message, url });

        let successCount = 0;
        let failCount = 0;

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
                .catch(() => { failCount++; })
        );

        await Promise.all(promises);

        return NextResponse.json({ success: true, successCount, failCount });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
