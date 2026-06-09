import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isRateLimited } from '@/lib/rate-limit';
import logger from '@/lib/logger';

/**
 * POST /api/zone-report — submit a crowdsourced zone status report.
 *
 * Body: { zoneId: uuid, reportType: 'reopened' | 'still_closed', note?: string }
 *
 * A visitor who successfully registered their address in a "closed"
 * neighborhood can report it as reopened. When ≥3 independent reports
 * accumulate on a single zone row, the admin dashboard highlights it
 * for manual verification + status flip.
 *
 * Security:
 *   - 5 reports/min/IP rate limit (generous enough for browsing a few
 *     neighborhoods, tight enough to block scripts).
 *   - IP hashed with a rotating salt (SHA-256) — DB never sees the raw
 *     IP, just the hash for dedup.
 *   - Unique index (zone_id, reporter_ip) prevents the same visitor
 *     from inflating the count by clicking multiple times.
 *   - 23505 (unique violation) treated as silent success — the visitor
 *     sees "شكراً" even on duplicate clicks.
 */

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const svc = serviceRoleKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
    : null;

async function hashIp(ip: string): Promise<string> {
    const salt = process.env.IP_HASH_SALT || 'dev-salt-rotate-me';
    const data = new TextEncoder().encode(`${ip}|${salt}`);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
    try {
        if (!svc) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });

        const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        if (isRateLimited(`zone-report:${clientIp}`, 5)) {
            return NextResponse.json({ error: 'محاولات كثيرة. حاول بعد دقيقة.' }, { status: 429 });
        }

        const body = await req.json().catch(() => ({}));
        const zoneId = typeof body?.zoneId === 'string' ? body.zoneId.trim() : '';
        const reportType = typeof body?.reportType === 'string' ? body.reportType.trim() : '';
        const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 500) : '';

        if (!UUID_RE.test(zoneId)) {
            return NextResponse.json({ error: 'معرّف المنطقة غير صالح' }, { status: 400 });
        }
        if (reportType !== 'reopened' && reportType !== 'still_closed') {
            return NextResponse.json({ error: 'نوع البلاغ غير صالح' }, { status: 400 });
        }

        // Best-effort user_id attach
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
            // anon is fine
        }

        const ipHash = await hashIp(clientIp);

        const { error } = await svc.from('zone_reports').insert({
            zone_id: zoneId,
            reporter_ip: ipHash,
            user_id: userId,
            report_type: reportType,
            note: note || null,
        });

        if (error) {
            const code = (error as { code?: string }).code || '';
            // 23505 = unique violation (same IP already reported this zone)
            if (code === '23505') {
                return NextResponse.json({ ok: true, alreadyReported: true });
            }
            // 23503 = FK violation (zone doesn't exist)
            if (code === '23503') {
                return NextResponse.json({ error: 'المنطقة غير موجودة' }, { status: 404 });
            }
            logger.error('zone-report insert:', error);
            return NextResponse.json({ error: 'فشل إرسال البلاغ' }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        logger.error('zone-report POST:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
