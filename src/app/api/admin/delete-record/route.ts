import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import logger from '@/lib/logger';

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
        const { table, id, idField } = body;

        if (!table || !id) {
            return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
        }

        if (!ALLOWED_TABLES.includes(table)) {
            return NextResponse.json({ error: 'table_not_allowed' }, { status: 403 });
        }

        // Service-role client (bypasses RLS for both admin check and delete)
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            return NextResponse.json({ error: 'server_config' }, { status: 500 });
        }
        const serviceClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey
        );

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

        // Check admin role using service client (bypasses RLS on member_profiles)
        const { data: profile } = await serviceClient
            .from('member_profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'forbidden' }, { status: 403 });
        }

        // Perform delete with service client — whitelist allowed ID field names
        const ALLOWED_ID_FIELDS = ['id', 'code', 'slug', 'key'];
        const deleteField = (typeof idField === 'string' && ALLOWED_ID_FIELDS.includes(idField)) ? idField : 'id';
        const { error } = await serviceClient
            .from(table)
            .delete()
            .eq(deleteField, id);

        if (error) {
            logger.error('Admin delete error:', error);
            return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
        }

        // Clean up related notifications & activity log (best-effort, don't block response)
        const entityId = String(id);
        // Only run cleanup if entityId looks like a valid UUID (prevent wildcard injection)
        const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (UUID_RE.test(entityId)) {
            serviceClient
                .from('admin_activity_log')
                .delete()
                .eq('entity_table', table)
                .eq('entity_id', entityId)
                .then(() => {});
            serviceClient
                .from('notifications')
                .delete()
                .ilike('title', `%${entityId}%`)
                .is('target_user_id', null)
                .then(() => {});
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        logger.error('Admin delete error:', error);
        return NextResponse.json({ error: 'internal_error' }, { status: 500 });
    }
}
