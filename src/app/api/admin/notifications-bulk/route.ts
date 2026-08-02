import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/adminAuth';
import logger from '@/lib/logger';

export const runtime = 'nodejs';

/**
 * Bulk actions over the notifications bell.
 *
 * The single-row hide/delete in NotificationsManager works, but the two
 * automated writers (DB trigger + notify pipeline) produce dozens of rows a
 * day, and clearing a backlog one click at a time is not an admin workflow.
 *
 * POST { action: 'hide' | 'delete', scope: 'day' | 'week' | 'month' | 'all' }
 *  • hide   — is_active=false on matching rows (reversible per-row from the list)
 *  • delete — permanent removal of matching rows
 * Scopes are rolling windows over created_at: day = 24h, week = 7d, month = 30d.
 *
 * Returns { count } — the number of rows actually affected — so the UI can
 * report truthfully instead of guessing.
 */

const WINDOW_HOURS: Record<string, number> = { day: 24, week: 24 * 7, month: 24 * 30 };

export async function POST(request: NextRequest) {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    let body: { action?: string; scope?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'bad_json' }, { status: 400 });
    }

    const action = body.action === 'hide' || body.action === 'delete' ? body.action : null;
    const scope = body.scope && (body.scope === 'all' || body.scope in WINDOW_HOURS) ? body.scope : null;
    if (!action || !scope) {
        return NextResponse.json({ error: 'invalid_action_or_scope' }, { status: 400 });
    }

    const cutoff = scope === 'all'
        ? null
        : new Date(Date.now() - WINDOW_HOURS[scope] * 3600_000).toISOString();

    try {
        if (action === 'hide') {
            // Only touch rows that are currently visible so `count` means
            // "notifications actually removed from users' bells".
            let q = gate.svc.from('notifications').update({ is_active: false }).eq('is_active', true);
            if (cutoff) q = q.gte('created_at', cutoff);
            const { data, error } = await q.select('id');
            if (error) throw error;
            return NextResponse.json({ count: data?.length ?? 0 });
        }

        // delete — created_at is NOT NULL (default now()), so gte() alone is a
        // safe range filter; the 'all' branch needs a tautology because
        // PostgREST refuses an unfiltered DELETE.
        let q = gate.svc.from('notifications').delete();
        q = cutoff ? q.gte('created_at', cutoff) : q.not('id', 'is', null);
        const { data, error } = await q.select('id');
        if (error) throw error;
        return NextResponse.json({ count: data?.length ?? 0 });
    } catch (e) {
        logger.error('notifications-bulk failed:', e);
        return NextResponse.json({ error: 'bulk_failed' }, { status: 500 });
    }
}
