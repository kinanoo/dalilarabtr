import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/adminAuth';
import logger from '@/lib/logger';

/**
 * POST /api/admin/write-record — generic admin write (insert/update/upsert).
 *
 * Hardening: admin managers used to write to the DB directly from the browser
 * (anon client, RLS-gated). This route moves every such write server-side
 * behind requireAdmin(), mirroring /api/admin/delete-record for deletes.
 *
 * Two per-table policies (see RULES):
 *  - columns: strict whitelist — unknown keys are STRIPPED before the write.
 *    Used for the small fixed forms (ticker, sources, moderation updates...).
 *  - passthrough (no columns entry) — whole-row content editors that load a
 *    row with select('*'), edit it, and upsert it back. Enumerating those
 *    columns here would silently drop data whenever the schema gains a column,
 *    so the row passes through; the admin gate + table whitelist + op
 *    whitelist are the security boundary.
 *
 * Body: { table, op: 'insert'|'update'|'upsert', data: object|object[],
 *         match?: { field?, value }, onConflict?: string }
 * `match` is required for op 'update' and its field must be in the table's
 * idFields. On DB failure the raw supabase message+code are returned so
 * client toasts and the missing-column fallback in NewsManager keep working.
 */
export const runtime = 'nodejs';

type Op = 'insert' | 'update' | 'upsert';

type Rule = {
    ops: Op[];
    /** Allowed match fields for `update` (default: ['id']). */
    idFields?: string[];
    /** Strict column whitelist; omit for whole-row editor passthrough. */
    columns?: string[];
    /** Force this id on every row (site_settings is a single row, id=1). */
    fixedId?: number;
};

const RULES: Record<string, Rule> = {
    // Whole-row content editors (select('*') → edit → upsert back).
    articles: { ops: ['insert', 'update', 'upsert'] },
    security_codes: { ops: ['upsert'], idFields: ['code'] },
    consultant_scenarios: { ops: ['update', 'upsert'] },
    faqs: { ops: ['insert', 'update', 'upsert'] },
    updates: { ops: ['insert', 'update', 'upsert'] },
    home_cards: { ops: ['upsert'] },
    site_settings: { ops: ['upsert'], fixedId: 1 },

    // Fixed small forms — strict column whitelists.
    news_ticker: { ops: ['insert', 'update'], columns: ['text', 'link', 'is_active', 'priority'] },
    official_sources: { ops: ['insert'], columns: ['name', 'url', 'description', 'is_official', 'active'] },
    site_testimonials: { ops: ['insert'], columns: ['name', 'role', 'location', 'content', 'rating', 'is_active'] },
    content_suggestions: { ops: ['update'], columns: ['status'] },
    analyst_insights: { ops: ['update'], columns: ['is_resolved'] },
    comments: {
        ops: ['insert', 'update'],
        columns: ['parent_id', 'entity_type', 'entity_id', 'page_slug', 'author_name', 'content', 'status', 'is_official'],
    },
    review_replies: { ops: ['insert'], columns: ['review_id', 'author_name', 'content', 'is_official'] },
    questions: { ops: ['update'], columns: ['answer', 'status', 'answered_by', 'answered_at', 'is_featured'] },
    service_providers: {
        ops: ['insert', 'update'],
        columns: [
            'name', 'profession', 'category', 'city', 'district', 'phone', 'whatsapp',
            'description', 'bio', 'image', 'address_details', 'map_location',
            'rating', 'review_count', 'is_verified', 'is_featured', 'status',
        ],
    },
    site_menus: { ops: ['update'], columns: ['location', 'label', 'href', 'is_active', 'sort_order', 'icon'] },
    service_categories: {
        ops: ['update'],
        idFields: ['slug'],
        columns: ['title', 'is_featured', 'active', 'sort_order', 'icon'],
    },
};

function cleanRow(row: Record<string, unknown>, rule: Rule): Record<string, unknown> {
    let out = row;
    if (rule.columns) {
        out = {};
        for (const k of rule.columns) {
            if (row[k] !== undefined) out[k] = row[k];
        }
    }
    if (rule.fixedId !== undefined) out = { ...out, id: rule.fixedId };
    return out;
}

export async function POST(request: Request) {
    try {
        const gate = await requireAdmin();
        if (!gate.ok) return gate.res;

        const body = await request.json().catch(() => null);
        const table = typeof body?.table === 'string' ? body.table : '';
        const op = body?.op as Op;
        const rule = RULES[table];

        if (!rule) return NextResponse.json({ error: 'table_not_allowed' }, { status: 403 });
        if (!rule.ops.includes(op)) return NextResponse.json({ error: 'op_not_allowed' }, { status: 403 });

        const rawData = body?.data;
        const rows: Record<string, unknown>[] = Array.isArray(rawData) ? rawData : [rawData];
        if (rows.length === 0 || rows.some((r) => !r || typeof r !== 'object' || Array.isArray(r))) {
            return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
        }
        const clean = rows.map((r) => cleanRow(r, rule));

        let dbError: { message: string; code?: string } | null = null;

        if (op === 'update') {
            const match = body?.match;
            const field = typeof match?.field === 'string' ? match.field : 'id';
            const value = match?.value;
            const allowedFields = rule.idFields ?? ['id'];
            if (!allowedFields.includes(field)) {
                return NextResponse.json({ error: 'match_field_not_allowed' }, { status: 403 });
            }
            if (typeof value !== 'string' && typeof value !== 'number') {
                return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
            }
            // Untyped builder: supabase-js's typed .update().eq() chain hits TS2589
            // (instantiation too deep) when both the table and the filter column are
            // dynamic strings; runtime is identical.
            const builder = gate.svc.from(table) as any;
            const { error } = await builder.update(clean[0]).eq(field, value);
            dbError = error;
        } else if (op === 'insert') {
            // Always send the array form — identical PostgREST semantics for one row.
            const { error } = await gate.svc.from(table).insert(clean);
            dbError = error;
        } else {
            const onConflict = typeof body?.onConflict === 'string' && /^[a-z0-9_,]+$/.test(body.onConflict)
                ? body.onConflict
                : undefined;
            const { error } = await gate.svc.from(table).upsert(clean, onConflict ? { onConflict } : undefined);
            dbError = error;
        }

        if (dbError) {
            logger.error(`admin/write-record ${op} ${table}:`, dbError);
            // Raw message + code on purpose — client toasts show it (same UX as
            // the old direct client write) and NewsManager's missing-column
            // fallback keys off code PGRST204 / "column ... does not exist".
            return NextResponse.json({ error: dbError.message, code: dbError.code }, { status: 500 });
        }
        return NextResponse.json({ ok: true });
    } catch (err) {
        logger.error('admin/write-record unhandled:', err);
        return NextResponse.json({ error: 'internal_error' }, { status: 500 });
    }
}
