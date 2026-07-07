import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Shared admin gate for /api/admin/* write routes.
 *
 * Resolves the caller from their cookie session, verifies their
 * member_profiles.role is 'admin', and — on success — returns a SERVICE-ROLE
 * client for the actual write. Using the service role (behind this gate) means
 * a legitimate admin write can never be blocked by an RLS edge case, while
 * unauthenticated / non-admin callers are rejected before any write happens.
 *
 * On any failure it returns a ready-to-send NextResponse (401/403/500) so the
 * caller can just `if (!gate.ok) return gate.res;`.
 *
 * Runtime note: routes using this MUST set `export const runtime = 'nodejs'`
 * (the service client + cookie APIs crash on the edge runtime under the
 * OpenNext Cloudflare adapter).
 */
export async function requireAdmin(): Promise<
    { ok: true; svc: SupabaseClient; userId: string } | { ok: false; res: NextResponse }
> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anon || !serviceKey) {
        return { ok: false, res: NextResponse.json({ error: 'server_config' }, { status: 500 }) };
    }

    const cookieStore = await cookies();
    const authed = createServerClient(url, anon, {
        cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} },
    });
    const { data: { user } } = await authed.auth.getUser();
    if (!user) return { ok: false, res: NextResponse.json({ error: 'غير مصرح' }, { status: 401 }) };

    const { data: profile } = await authed
        .from('member_profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
        return { ok: false, res: NextResponse.json({ error: 'محظور' }, { status: 403 }) };
    }

    return {
        ok: true,
        userId: user.id,
        svc: createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } }),
    };
}
