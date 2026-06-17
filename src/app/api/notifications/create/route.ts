import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isRateLimited } from '@/lib/rate-limit';
import logger from '@/lib/logger';

// Use service role for server-side notification inserts (bypasses RLS safely)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = serviceRoleKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
    : null;

const ALLOWED_TYPES = ['reply', 'review', 'comment', 'article', 'law', 'service', 'update', 'alert', 'announcement'];

export async function POST(request: NextRequest) {
    try {
        const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        if (isRateLimited(`notif:${clientIp}`, 10)) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        // Auth check: admins can create any notification; regular users can only create reply notifications
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => cookieStore.getAll() } }
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin role (use service-role client to bypass RLS on member_profiles)
        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'server_config' }, { status: 500 });
        }
        const { data: profile } = await supabaseAdmin
            .from('member_profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const isAdmin = profile?.role === 'admin';

        const body = await request.json();
        const { type, title, message, link, icon, priority, target_user_id } = body;

        // Validate required fields
        if (!type || !title || !message) {
            return NextResponse.json(
                { error: 'Missing required fields: type, title, message' },
                { status: 400 }
            );
        }

        if (!ALLOWED_TYPES.includes(type)) {
            return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
        }

        // Non-admin users can only create personal reply notifications (not broadcasts)
        if (!isAdmin) {
            if (type !== 'reply' || !target_user_id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            // Prevent users from sending notifications to themselves
            if (target_user_id === user.id) {
                return NextResponse.json({ error: 'Cannot notify yourself' }, { status: 400 });
            }
        }

        // Input length validation
        if (title.length > 200 || message.length > 1000) {
            return NextResponse.json({ error: 'Title or message too long' }, { status: 400 });
        }

        // Defense-in-depth XSS guard. Currently the bell renders title +
        // message as plain text nodes (React escapes them), so an HTML
        // tag in the input is harmless. But this API is the entry point;
        // if any future render path switches to dangerouslySetInnerHTML
        // or a CMS proxies the content, the attacker payload is already
        // stored. Strip tags + < / > characters at write time so the
        // stored payload is text-only by contract.
        body.title = title.replace(/<[^>]*>/g, '').replace(/[<>]/g, '').slice(0, 200);
        body.message = message.replace(/<[^>]*>/g, '').replace(/[<>]/g, '').slice(0, 1000);

        // Links must be a same-origin path. The previous check accepted any
        // string starting with '/', which left an open-redirect window:
        // '//attacker.com/phish' starts with '/' but the browser interprets it
        // as a protocol-relative URL. Tighten to a strict same-origin path
        // regex matching what the push endpoint already enforces.
        if (link !== undefined && link !== null && link !== '') {
            if (typeof link !== 'string'
                || link.length > 500
                || !/^\/[a-z0-9_\-/?=&#%.]*$/i.test(link)
                || link.startsWith('//')) {
                return NextResponse.json(
                    { error: 'Link must be a same-origin path (must start with / and be alphanumeric)' },
                    { status: 400 }
                );
            }
        }

        // Per-user rate limit on reply notifications to prevent harassment:
        // even within the 10/min IP cap, a single user shouldn't be able to
        // ping the same target more than 5 times an hour.
        if (!isAdmin && target_user_id) {
            if (isRateLimited(`notif:reply:${user.id}:${target_user_id}`, 5)) {
                return NextResponse.json(
                    { error: 'Too many reply notifications to this user — try later' },
                    { status: 429 }
                );
            }
        }

        const { error } = await supabaseAdmin
            .from('notifications')
            .insert({
                type,
                title,
                message,
                link: link || null,
                icon: icon || null,
                priority: priority || 'medium',
                target_user_id: target_user_id || null,
                target_audience: target_user_id ? 'personal' : 'all',
                is_active: true,
            });

        if (error) {
            logger.error('Failed to create notification:', error);
            return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
