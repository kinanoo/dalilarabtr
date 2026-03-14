import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { isRateLimited } from '@/lib/rate-limit';

/**
 * DELETE /api/comments?id=<uuid>
 *
 * Deletes a comment. Allowed for the comment owner or admin.
 * Uses service-role client to bypass RLS.
 */
export async function DELETE(request: NextRequest) {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(`comments:${clientIp}`, 20)) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const cookieStore = await cookies();
    const authClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } },
    );

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) return NextResponse.json({ error: 'server_config' }, { status: 500 });

    const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);

    // Fetch comment to check ownership
    const { data: comment } = await svc.from('comments').select('id, user_id').eq('id', id).single();
    if (!comment) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    // Check permission: owner or admin
    const isOwner = comment.user_id === user.id;
    if (!isOwner) {
        const { data: profile } = await svc.from('member_profiles').select('role').eq('id', user.id).single();
        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'forbidden' }, { status: 403 });
        }
    }

    const { error } = await svc.from('comments').delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'delete_failed' }, { status: 500 });

    return NextResponse.json({ ok: true });
}

/**
 * PATCH /api/comments  body: { id, content }
 *
 * Updates a comment. Only the owner can edit.
 * Uses service-role client to bypass RLS.
 */
export async function PATCH(request: NextRequest) {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(`comments:${clientIp}`, 20)) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    if (!body?.id || !body?.content?.trim()) {
        return NextResponse.json({ error: 'Missing id or content' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const authClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } },
    );

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) return NextResponse.json({ error: 'server_config' }, { status: 500 });

    const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);

    // Only owner can edit
    const { data: comment } = await svc.from('comments').select('id, user_id').eq('id', body.id).single();
    if (!comment) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    if (comment.user_id !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const { error } = await svc.from('comments').update({ content: body.content.trim() }).eq('id', body.id);
    if (error) return NextResponse.json({ error: 'update_failed' }, { status: 500 });

    return NextResponse.json({ ok: true });
}
