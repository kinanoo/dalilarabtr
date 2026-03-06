import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Use service role for server-side notification inserts (bypasses RLS safely)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = serviceRoleKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
    : null;

const ALLOWED_TYPES = ['reply', 'review', 'comment', 'article', 'law', 'service', 'update', 'alert', 'announcement'];

export async function POST(request: Request) {
    try {
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

        // Links must be internal (relative paths only) — prevent open redirect
        if (link && (typeof link !== 'string' || !link.startsWith('/'))) {
            return NextResponse.json({ error: 'Link must be a relative path' }, { status: 400 });
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
            console.error('Failed to create notification:', error);
            return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
