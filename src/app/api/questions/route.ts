import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isRateLimited } from '@/lib/rate-limit';
import logger from '@/lib/logger';

/**
 * /api/questions — public Q&A endpoint
 *
 * GET  → list of answered, public questions (paginated)
 * POST → submit a new question (rate-limited, validated)
 *
 * Design notes:
 *   - Reads use the anon client + RLS policy `questions_public_read_answered`
 *     so only answered/published questions are ever returned. No leakage of
 *     pending or rejected questions to the public API.
 *   - Writes use the service-role client so we can hash the IP and set
 *     metadata the anon client wouldn't be allowed to set. The validation
 *     gates run BEFORE we touch the service client.
 *   - 3 submissions/min/IP rate limit — generous enough for a legitimate
 *     user who hits a typo, tight enough to kill spam scripts.
 *   - We never echo the asker's email in the GET response. It's persisted
 *     so we can send a "your question was answered" notification later, but
 *     the client should never see another user's email.
 */

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const svc = serviceRoleKey && supabaseUrl ? createClient(supabaseUrl, serviceRoleKey) : null;
const anon = anonKey && supabaseUrl ? createClient(supabaseUrl, anonKey) : null;

const EMAIL_RE = /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/;

// Hashing helper — keeps the raw IP out of the DB so a leak doesn't expose
// who asked what. The salt is per-deployment (env var) so two installs can't
// correlate hashes.
async function hashIp(ip: string): Promise<string> {
    const salt = process.env.IP_HASH_SALT || 'dev-salt-rotate-me';
    const data = new TextEncoder().encode(`${ip}|${salt}`);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

export async function GET(req: NextRequest) {
    try {
        if (!anon) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });

        const { searchParams } = new URL(req.url);
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
        const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
        const category = searchParams.get('category') || undefined;
        const featured = searchParams.get('featured') === '1';

        // RLS filters out non-answered rows. We still add `.eq('status', 'answered')`
        // for query planner clarity — Postgres will use the partial index.
        let q = anon
            .from('questions')
            .select(
                'id, question, context, category, asker_name, answer, answered_at, upvotes, views, is_featured, created_at',
                { count: 'exact' }
            )
            .eq('status', 'answered')
            .order(featured ? 'is_featured' : 'answered_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (category) q = q.eq('category', category);

        const { data, count, error } = await q;
        if (error) {
            logger.error('questions GET:', error);
            return NextResponse.json({ error: 'فشل تحميل الأسئلة' }, { status: 500 });
        }
        return NextResponse.json({ items: data || [], total: count ?? 0 });
    } catch (err) {
        logger.error('questions GET unhandled:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        if (!svc) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });

        const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        if (isRateLimited(`questions:${clientIp}`, 3)) {
            return NextResponse.json({ error: 'محاولات كثيرة. حاول بعد دقيقة.' }, { status: 429 });
        }

        const body = await req.json().catch(() => ({}));
        const question = typeof body?.question === 'string' ? body.question.trim() : '';
        const context = typeof body?.context === 'string' ? body.context.trim() : '';
        const category = typeof body?.category === 'string' ? body.category.trim() : '';
        const askerName = typeof body?.askerName === 'string' ? body.askerName.trim() : '';
        const askerEmail =
            typeof body?.askerEmail === 'string' ? body.askerEmail.trim().toLowerCase() : '';

        // Validation
        if (question.length < 8) {
            return NextResponse.json({ error: 'السؤال قصير جداً (8 أحرف على الأقل)' }, { status: 400 });
        }
        if (question.length > 1000) {
            return NextResponse.json({ error: 'السؤال طويل جداً (1000 حرف كحدّ أقصى)' }, { status: 400 });
        }
        if (context.length > 2000) {
            return NextResponse.json({ error: 'السياق طويل جداً' }, { status: 400 });
        }
        if (askerName.length > 80) {
            return NextResponse.json({ error: 'الاسم طويل جداً' }, { status: 400 });
        }
        if (askerEmail && (askerEmail.length > 200 || !EMAIL_RE.test(askerEmail))) {
            return NextResponse.json({ error: 'بريد إلكتروني غير صالح' }, { status: 400 });
        }

        // Try to attach user_id if the requester is signed in (best-effort).
        let userId: string | null = null;
        try {
            const { createServerClient } = await import('@supabase/ssr');
            const { cookies } = await import('next/headers');
            const cookieStore = await cookies();
            const authClient = createServerClient(supabaseUrl!, anonKey!, {
                cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
            });
            const { data: { user } } = await authClient.auth.getUser();
            if (user) userId = user.id;
        } catch {
            // ignore — anon submissions are fine
        }

        const ipHash = await hashIp(clientIp);

        const { error } = await svc.from('questions').insert({
            question,
            context: context || null,
            category: category || null,
            user_id: userId,
            asker_name: askerName || null,
            asker_email: askerEmail || null,
            ip_hash: ipHash,
            status: 'pending',
        });

        if (error) {
            logger.error('questions insert:', error);
            return NextResponse.json({ error: 'فشل إرسال السؤال' }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        logger.error('questions POST unhandled:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
