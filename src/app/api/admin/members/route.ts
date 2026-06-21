import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import logger from '@/lib/logger';

/**
 * GET /api/admin/members — admin-only list of registered members WITH emails.
 *
 * Why this route exists: the `member_profiles` table stores name/role/avatar
 * but NOT email — emails live in Supabase's `auth.users`, which is only
 * reachable through the Admin API with the service-role key. The client can't
 * do that (it would leak the service key), so the admin members page used to
 * show "—" for every email. This route joins the two server-side:
 *
 *   1. member_profiles  → id, full_name, role, avatar_url, created_at
 *   2. auth.admin.listUsers() → id → email
 *   3. merge by id and return.
 *
 * Auth: cookie session must resolve to a user whose member_profiles row has
 * role='admin'. Same gate as the other /api/admin/* routes.
 *
 * Runtime: nodejs — uses the Supabase service client + Admin API. (The 'edge'
 * runtime crashes admin routes on the OpenNext Cloudflare adapter; see
 * /api/admin/ai for the full note.)
 */
export const runtime = 'nodejs';

export async function GET() {
    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        // ── Auth: resolve the caller from their cookie session ──
        const cookieStore = await cookies();
        const authClient = createServerClient(url, anonKey, {
            cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} },
        });
        const { data: { user } } = await authClient.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        }

        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            return NextResponse.json({ error: 'server_config' }, { status: 500 });
        }
        const serviceClient = createClient(url, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        });

        // ── Admin check ──
        const { data: callerProfile } = await serviceClient
            .from('member_profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        if (callerProfile?.role !== 'admin') {
            return NextResponse.json({ error: 'محظور' }, { status: 403 });
        }

        // ── 1. Profiles (name/role/avatar/date) ──
        const { data: profiles, error: profErr } = await serviceClient
            .from('member_profiles')
            .select('id, full_name, role, avatar_url, created_at')
            .order('created_at', { ascending: false });
        if (profErr) {
            logger.error('admin/members profiles load:', profErr);
            return NextResponse.json({ error: 'فشل تحميل الأعضاء' }, { status: 500 });
        }

        // ── 2. Emails from auth.users via the Admin API (service-role only) ──
        // listUsers is paginated. We page through with a generous perPage and a
        // hard safety cap so a misconfigured account can't loop forever. If the
        // Admin API ever fails, we degrade gracefully — return profiles with
        // empty emails rather than 500 the whole page.
        const emailById = new Map<string, string>();
        try {
            const perPage = 1000;
            for (let page = 1; page <= 50; page++) {
                const { data: usersData, error: usersErr } =
                    await serviceClient.auth.admin.listUsers({ page, perPage });
                if (usersErr) {
                    logger.error('admin/members listUsers:', usersErr);
                    break;
                }
                const users = usersData?.users || [];
                for (const u of users) {
                    if (u.email) emailById.set(u.id, u.email);
                }
                if (users.length < perPage) break; // last page reached
            }
        } catch (e) {
            logger.error('admin/members listUsers threw:', e);
            // fall through with whatever emails we collected
        }

        // ── 3. Merge ──
        const members = (profiles || []).map((p) => ({
            id: p.id,
            full_name: p.full_name,
            role: p.role,
            avatar_url: p.avatar_url,
            created_at: p.created_at,
            email: emailById.get(p.id) || '',
        }));

        return NextResponse.json({ members });
    } catch (err) {
        logger.error('admin/members GET unhandled:', err);
        return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
    }
}
