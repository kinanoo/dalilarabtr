import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for server-side notification inserts (bypasses RLS safely)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ALLOWED_TYPES = ['reply', 'review', 'comment', 'article', 'law', 'service', 'update', 'alert', 'announcement'];

export async function POST(request: Request) {
    try {
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
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Notification creation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
