import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isRateLimited } from '@/lib/rate-limit';
import logger from '@/lib/logger';

/**
 * POST /api/article-feedback   — record a thumbs-up/down vote
 * GET  /api/article-feedback?article_id=... — summary counts (helpful / not)
 *
 * Body for POST: { article_id: string, helpful: boolean, visitor_id?: string }
 *
 * - visitor_id is read from localStorage on the client and threaded through so
 *   one anonymous device only ever counts once per article (upsert on the
 *   unique index installed by the 2026-06-06 migration).
 * - ip_hash is hashed at the edge so we never store raw IPs.
 * - Rate-limited per IP (30/min) so a script can't stuff the ballot box.
 */

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const svc = serviceRoleKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
    : null;

function hashString(input: string): string {
    // Cheap non-crypto hash — enough to de-identify an IP for rate-limit
    // bookkeeping without storing the raw value.
    let h = 5381;
    for (let i = 0; i < input.length; i++) {
        h = (h * 33) ^ input.charCodeAt(i);
    }
    return ((h >>> 0).toString(16)).padStart(8, '0');
}

export async function POST(req: NextRequest) {
    try {
        if (!svc) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });

        const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        if (isRateLimited(`article-feedback:${clientIp}`, 30)) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const body = await req.json();
        const { article_id, helpful, visitor_id } = body;

        if (typeof article_id !== 'string' || article_id.length === 0 || article_id.length > 100) {
            return NextResponse.json({ error: 'Invalid article_id' }, { status: 400 });
        }
        if (typeof helpful !== 'boolean') {
            return NextResponse.json({ error: 'helpful must be a boolean' }, { status: 400 });
        }
        const trimmedVisitor = typeof visitor_id === 'string' && visitor_id.length <= 100
            ? visitor_id.trim() || null
            : null;

        // Upsert on (article_id, visitor_id) so a visitor flipping their vote
        // updates the existing row rather than producing a duplicate.
        if (trimmedVisitor) {
            const { error } = await svc
                .from('article_feedback')
                .upsert(
                    { article_id, helpful, visitor_id: trimmedVisitor, ip_hash: hashString(clientIp) },
                    { onConflict: 'article_id,visitor_id' }
                );
            if (error) {
                logger.error('article_feedback upsert:', error);
                return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
            }
        } else {
            // No visitor id — best effort insert. Vote may dedupe poorly but
            // still gets counted.
            const { error } = await svc
                .from('article_feedback')
                .insert({ article_id, helpful, ip_hash: hashString(clientIp) });
            if (error) {
                logger.error('article_feedback insert:', error);
                return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
            }
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        logger.error('article-feedback POST:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        if (!svc) return NextResponse.json({ helpful: 0, not_helpful: 0 });

        const { searchParams } = new URL(req.url);
        const article_id = searchParams.get('article_id') || '';
        if (!article_id || article_id.length > 100) {
            return NextResponse.json({ error: 'Invalid article_id' }, { status: 400 });
        }

        const { data, error } = await svc.rpc('get_article_feedback_summary', { _article_id: article_id });
        if (error) {
            logger.error('article_feedback summary:', error);
            return NextResponse.json({ helpful: 0, not_helpful: 0 });
        }

        const row = Array.isArray(data) ? data[0] : data;
        return NextResponse.json({
            helpful: Number(row?.helpful_count || 0),
            not_helpful: Number(row?.not_helpful_count || 0),
        }, {
            headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300' },
        });
    } catch (err) {
        logger.error('article-feedback GET:', err);
        return NextResponse.json({ helpful: 0, not_helpful: 0 });
    }
}
