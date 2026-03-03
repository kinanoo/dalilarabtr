import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// Allowed tables for admin deletion (whitelist for safety)
const ALLOWED_TABLES = [
    'service_providers',
    'articles',
    'faqs',
    'security_codes',
    'consultant_scenarios',
    'tools_registry',
    'admin_updates',
    'zones',
    'banners',
    'comments',
    'service_reviews',
];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { table, id } = body;

        if (!table || !id) {
            return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
        }

        if (!ALLOWED_TABLES.includes(table)) {
            return NextResponse.json({ error: 'table_not_allowed' }, { status: 403 });
        }

        // Auth check: verify user is admin
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
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const { data: profile } = await authClient
            .from('member_profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'forbidden' }, { status: 403 });
        }

        // Use service role key to bypass RLS
        const serviceClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { error } = await serviceClient
            .from(table)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Admin delete error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Admin delete error:', error);
        return NextResponse.json({ error: error.message || 'internal_error' }, { status: 500 });
    }
}
