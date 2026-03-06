import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

/**
 * DELETE /api/admin/feedback?id=<uuid>
 *
 * Admin-only endpoint to delete feedback/votes.
 * Uses service-role client for the actual delete (bypasses RLS).
 * Auth check: session from HTTP-only cookies + admin role verification.
 */
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    // Auth client to read session from cookies
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

    // Verify user identity from session cookies
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Service-role client (bypasses RLS for admin check and delete)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        return NextResponse.json({ error: 'server_config' }, { status: 500 });
    }
    const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
    );

    // Check admin role
    const { data: profile } = await serviceClient
        .from('member_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // Perform delete with service client
    const { error } = await serviceClient.from('content_votes').delete().eq('id', id);

    if (error) {
        return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
