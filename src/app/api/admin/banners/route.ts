import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import logger from '@/lib/logger';

/**
 * Admin banner writes (create / update / activate / delete) via the SERVICE
 * ROLE — not the browser's RLS-bound client.
 *
 * Why: site_banners write policies require is_admin() at the RLS layer. A
 * browser insert therefore fails silently-ish (42501 "violates row-level
 * security policy") whenever the session's admin claim isn't perfectly
 * satisfied — which is exactly what left the table empty and made "I add a
 * banner but it never shows" reproducible. Public visitors can still READ
 * banners (SELECT policy is public), so the display side was never the
 * problem; only the write was.
 *
 * This route verifies the caller is an admin from their cookie session (the
 * same gate /api/admin/push uses), then performs the write with the service
 * role so it can never be blocked by an RLS edge case. Only one banner is
 * active at a time, enforced here server-side.
 */
export const runtime = 'nodejs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SENTINEL = '00000000-0000-0000-0000-000000000000';
const ALLOWED_TYPES = ['alert', 'info', 'warning', 'success', 'sponsor'];

async function requireAdmin(): Promise<{ ok: true; svc: SupabaseClient } | { ok: false; res: NextResponse }> {
    if (!SUPABASE_URL || !ANON_KEY) {
        return { ok: false, res: NextResponse.json({ error: 'server_config' }, { status: 500 }) };
    }
    const cookieStore = await cookies();
    const authed = createServerClient(SUPABASE_URL, ANON_KEY, {
        cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} },
    });
    const { data: { user } } = await authed.auth.getUser();
    if (!user) return { ok: false, res: NextResponse.json({ error: 'غير مصرح' }, { status: 401 }) };

    const { data: profile } = await authed.from('member_profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return { ok: false, res: NextResponse.json({ error: 'محظور' }, { status: 403 }) };

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return { ok: false, res: NextResponse.json({ error: 'server_config' }, { status: 500 }) };
    return { ok: true, svc: createClient(SUPABASE_URL, serviceKey) };
}

// ── Create / update a banner ─────────────────────────────────────────────
export async function POST(request: Request) {
    try {
        const gate = await requireAdmin();
        if (!gate.ok) return gate.res;
        const svc = gate.svc;

        const body = await request.json().catch(() => ({}));
        const id: string | undefined = typeof body.id === 'string' && body.id ? body.id : undefined;
        const content = typeof body.content === 'string' ? body.content.trim() : '';
        const type = ALLOWED_TYPES.includes(body.type) ? body.type : 'info';
        const is_active = !!body.is_active;
        const link_url = typeof body.link_url === 'string' && body.link_url.trim() ? body.link_url.trim() : null;
        const link_text = typeof body.link_text === 'string' && body.link_text.trim() ? body.link_text.trim() : null;

        if (!content || content.length > 500) {
            return NextResponse.json({ error: 'نص التنبيه مطلوب (بحد 500 حرف)' }, { status: 400 });
        }
        if (link_url && link_url.length > 600) {
            return NextResponse.json({ error: 'الرابط طويل جداً' }, { status: 400 });
        }

        const payload = { content, type, is_active, link_url, link_text };

        // Enforce single-active: when this banner is active, deactivate the
        // rest FIRST is unsafe (a failed write could leave zero active). Instead
        // write this row, then deactivate the others — a failure can only ever
        // leave the previous banner up, never a blank site.
        let savedId = id;
        if (id) {
            const { error } = await svc.from('site_banners').update(payload).eq('id', id);
            if (error) throw error;
        } else {
            const { data, error } = await svc.from('site_banners').insert([payload]).select('id').single();
            if (error) throw error;
            savedId = data?.id;
        }

        if (is_active && savedId) {
            const { error: deErr } = await svc.from('site_banners').update({ is_active: false }).neq('id', savedId);
            if (deErr) logger.error('deactivate-others failed:', deErr);
        }

        return NextResponse.json({ ok: true, id: savedId });
    } catch (err) {
        logger.error('admin banner save error:', err);
        const msg = err instanceof Error ? err.message : 'خطأ داخلي';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

// ── Delete a banner ──────────────────────────────────────────────────────
export async function DELETE(request: Request) {
    try {
        const gate = await requireAdmin();
        if (!gate.ok) return gate.res;

        const id = new URL(request.url).searchParams.get('id');
        if (!id || id === SENTINEL) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });

        const { error } = await gate.svc.from('site_banners').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
    } catch (err) {
        logger.error('admin banner delete error:', err);
        return NextResponse.json({ error: 'فشل الحذف' }, { status: 500 });
    }
}
