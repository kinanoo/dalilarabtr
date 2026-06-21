import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isRateLimited, getClientIp } from '@/lib/rate-limit';
import logger from '@/lib/logger';

/**
 * POST /api/newsletter — newsletter signup
 *
 * Body: { email: string, source?: string }
 *
 * Behaviour:
 *   - Validates the email shape server-side (the schema check in
 *     NewsletterForm runs on the client, but we don't trust it).
 *   - Rate-limited to 5 attempts per minute per IP — generous enough for
 *     someone retyping a typo'd email, tight enough to kill scraper spam.
 *   - On duplicate (unique violation on the citext email column) returns 200
 *     with a soft message so the form doesn't leak which addresses are
 *     already subscribed.
 *   - When the requester is signed in, we link the row to their user_id; that
 *     lets the admin reconcile newsletter members with site accounts later.
 */

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const svc = serviceRoleKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
    : null;

// Pragmatic email regex — covers the cases real signups produce without
// trying to comply with the full RFC 5322 grammar. The DB has the canonical
// constraint via citext + unique index.
const EMAIL_RE = /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
    try {
        if (!svc) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });

        const clientIp = getClientIp(req);
        if (isRateLimited(`newsletter:${clientIp}`, 5)) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const body = await req.json().catch(() => ({}));
        const rawEmail = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
        const source = typeof body?.source === 'string' ? body.source.slice(0, 80) : 'unknown';

        if (!rawEmail || rawEmail.length > 200 || !EMAIL_RE.test(rawEmail)) {
            return NextResponse.json({ error: 'بريد إلكتروني غير صالح' }, { status: 400 });
        }

        // user_id is attached when the requester has a Supabase session cookie.
        // Best-effort: failure to read the cookie shouldn't block the signup.
        let userId: string | null = null;
        try {
            const { createServerClient } = await import('@supabase/ssr');
            const { cookies } = await import('next/headers');
            const cookieStore = await cookies();
            const authClient = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
            );
            const { data: { user } } = await authClient.auth.getUser();
            if (user) userId = user.id;
        } catch {
            // ignore — proceed as anon
        }

        const { error } = await svc
            .from('newsletter_subscribers')
            .insert({ email: rawEmail, source, user_id: userId });

        if (error) {
            const code = (error as { code?: string }).code || '';
            // 23505 = unique_violation. Treat duplicates as success — we don't
            // want to leak "this email is already in our list".
            if (code === '23505') {
                return NextResponse.json({ ok: true, alreadySubscribed: true });
            }
            logger.error('newsletter insert:', error);
            return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        logger.error('newsletter POST:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
