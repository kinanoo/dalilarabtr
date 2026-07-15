import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { isRateLimited, getClientIp } from '@/lib/rate-limit';
import { containsProfanity } from '@/lib/profanity-filter';

const COMMENT_ENTITY_TYPES = ['article', 'service', 'update', 'scenario', 'zone'];

/**
 * POST /api/comments  body: { entity_type, entity_id, content, parent_id?, is_correction? }
 *
 * Creates a comment — members only. The comments table RLS rejects direct
 * browser inserts, so this is THE write path. The author identity (user_id +
 * display name) is derived server-side from the cookie session and the
 * member profile — the client cannot spoof a name. Comments publish
 * IMMEDIATELY (social-media style, owner's choice 2026-07-16): the profanity
 * filter is the only automatic gate, and the admin deletes abusive comments
 * manually from /admin/community.
 */
export async function POST(request: NextRequest) {
    const clientIp = getClientIp(request);
    if (isRateLimited(`comments-post:${clientIp}`, 10)) {
        return NextResponse.json({ error: 'محاولات كثيرة — انتظر دقيقة ثم أعد المحاولة' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    const entityType = typeof body?.entity_type === 'string' ? body.entity_type : '';
    const entityIdRaw = typeof body?.entity_id === 'string' ? body.entity_id : '';
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    const parentId = typeof body?.parent_id === 'string' && body.parent_id ? body.parent_id : null;

    if (!COMMENT_ENTITY_TYPES.includes(entityType)) {
        return NextResponse.json({ error: 'entity_type غير صالح' }, { status: 400 });
    }
    if (!entityIdRaw || entityIdRaw.length > 200) {
        return NextResponse.json({ error: 'entity_id غير صالح' }, { status: 400 });
    }
    if (!content || content.length > 5000) {
        return NextResponse.json({ error: 'اكتب تعليقاً بين 1 و5000 حرف' }, { status: 400 });
    }
    if (containsProfanity(content)) {
        return NextResponse.json({ error: 'يحتوي النص على كلمات غير لائقة. يرجى تعديل التعليق.' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const authClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } },
    );

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'سجّل دخولك أولاً لتتمكن من التعليق' }, { status: 401 });

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) return NextResponse.json({ error: 'server_config' }, { status: 500 });

    const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);

    // Server-derived author name — never trust a client-supplied one.
    const { data: profile } = await svc
        .from('member_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
    const authorName =
        profile?.full_name ||
        (user.user_metadata?.full_name as string | undefined) ||
        user.email?.split('@')[0] ||
        'عضو';

    // Replies must point at a real root comment on the same entity.
    if (parentId) {
        const { data: parent } = await svc
            .from('comments')
            .select('id, entity_type')
            .eq('id', parentId)
            .single();
        if (!parent || parent.entity_type !== entityType) {
            return NextResponse.json({ error: 'التعليق الأصلي غير موجود' }, { status: 400 });
        }
    }

    const normalizedId = decodeURIComponent(entityIdRaw);
    const { error } = await svc.from('comments').insert({
        entity_type: entityType,
        entity_id: normalizedId,
        page_slug: normalizedId, // backward compat
        author_name: authorName,
        content,
        parent_id: parentId,
        is_correction: body?.is_correction === true,
        status: 'approved',
        user_id: user.id,
    });
    if (error) return NextResponse.json({ error: 'فشل إرسال التعليق' }, { status: 500 });

    return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/comments?id=<uuid>
 *
 * Deletes a comment. Allowed for the comment owner or admin.
 * Uses service-role client to bypass RLS.
 */
export async function DELETE(request: NextRequest) {
    const clientIp = getClientIp(request);
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
    const clientIp = getClientIp(request);
    if (isRateLimited(`comments:${clientIp}`, 20)) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    if (!body?.id || !body?.content?.trim()) {
        return NextResponse.json({ error: 'Missing id or content' }, { status: 400 });
    }
    if (typeof body.content !== 'string' || body.content.length > 5000) {
        return NextResponse.json({ error: 'Content too long (max 5000 chars)' }, { status: 400 });
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
