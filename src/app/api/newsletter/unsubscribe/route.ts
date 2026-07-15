import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, isRateLimited } from '@/lib/rate-limit';
import logger from '@/lib/logger';

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const svc = serviceRoleKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    })
    : null;

const EMAIL_RE = /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/;
const TOKEN_RE = /^[a-f0-9]{36}$/i;

export async function POST(req: NextRequest) {
    try {
        if (!svc) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });

        const clientIp = getClientIp(req);
        if (isRateLimited(`newsletter-unsubscribe:${clientIp}`, 5, 10 * 60_000)) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const body = await req.json().catch(() => ({}));
        const token = typeof body?.token === 'string' ? body.token.trim() : '';
        const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

        if (!TOKEN_RE.test(token) && (!email || email.length > 200 || !EMAIL_RE.test(email))) {
            return NextResponse.json({ error: 'بيانات الإلغاء غير صالحة' }, { status: 400 });
        }

        let query = svc.from('newsletter_subscribers').delete();
        query = TOKEN_RE.test(token) ? query.eq('unsub_token', token) : query.eq('email', email);
        const { error } = await query;

        if (error) {
            logger.error('newsletter unsubscribe:', error);
            return NextResponse.json({ error: 'تعذّر إلغاء الاشتراك' }, { status: 500 });
        }

        // Deliberately return the same response whether a row existed or not.
        // This prevents the endpoint from revealing who is subscribed.
        return NextResponse.json({ ok: true });
    } catch (error) {
        logger.error('newsletter unsubscribe POST:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
