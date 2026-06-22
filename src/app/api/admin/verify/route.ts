import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * GET /api/admin/verify
 *
 * Checks if the current authenticated user has admin role.
 * Used by the admin layout as a client-side auth guard.
 *
 * - 200 { admin: true }  → user is authenticated admin
 * - 401 { admin: false } → not authenticated
 * - 403 { admin: false } → authenticated but not admin
 */
export async function GET() {
    const cookieStore = await cookies();

    const authClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll(); },
                setAll() {},
            },
        }
    );

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
        return NextResponse.json({ admin: false }, { status: 401 });
    }

    // Use service-role client to bypass RLS on member_profiles
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        return NextResponse.json({ admin: false, error: 'server_config' }, { status: 500 });
    }
    const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
    );

    const { data: profile } = await serviceClient
        .from('member_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const role = profile?.role;
    // 'viewer' is a READ-ONLY role: it may VIEW the admin panel, but every
    // write path denies it — RLS on the DB and the role==='admin' checks in the
    // mutation API routes both key strictly on role==='admin' (is_admin() =
    // role='admin'). We add 'viewer' ONLY here, at the view gate, and NOWHERE
    // in any write check, so a viewer can read admin pages but cannot mutate.
    if (role !== 'admin' && role !== 'viewer') {
        return NextResponse.json({ admin: false }, { status: 403 });
    }

    return NextResponse.json({ admin: true, role, readOnly: role === 'viewer' });
}
