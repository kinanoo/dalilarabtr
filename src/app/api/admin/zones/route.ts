import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/adminAuth';
import logger from '@/lib/logger';

/**
 * POST /api/admin/zones — create/update a closed-area (zone) record.
 *
 * Hardening: the zone editor used to upsert `zones` directly from the browser
 * (anon client, RLS-gated). Moved server-side behind requireAdmin() with a
 * column whitelist + validation. `status` is constrained to the values the
 * rest of the app understands (closed | reopened | pending) so a bad value can
 * never desync the public zone lists/filters.
 */
export const runtime = 'nodejs';

const ALLOWED = new Set(['city', 'district', 'neighborhood', 'status', 'notes']);
const STATUSES = new Set(['closed', 'reopened', 'pending']);

export async function POST(request: Request) {
    try {
        const gate = await requireAdmin();
        if (!gate.ok) return gate.res;

        const body = await request.json().catch(() => ({}));
        const id = typeof body?.id === 'string' && body.id && body.id !== 'new' ? body.id : null;
        const input = body?.data && typeof body.data === 'object' ? body.data as Record<string, unknown> : {};

        const clean: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(input)) {
            if (ALLOWED.has(k) && v !== undefined && v !== null) clean[k] = v;
        }

        const city = typeof clean.city === 'string' ? clean.city.trim() : '';
        if (!city) return NextResponse.json({ error: 'اسم المدينة مطلوب' }, { status: 400 });

        // Constrain status to a known value; default to 'closed'.
        clean.status = typeof clean.status === 'string' && STATUSES.has(clean.status) ? clean.status : 'closed';

        const payload = id ? { id, ...clean } : clean;
        const { error } = await gate.svc.from('zones').upsert(payload);
        if (error) {
            logger.error('admin/zones upsert:', error);
            return NextResponse.json({ error: 'فشل حفظ المنطقة' }, { status: 500 });
        }
        return NextResponse.json({ ok: true });
    } catch (err) {
        logger.error('admin/zones POST unhandled:', err);
        return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
    }
}
