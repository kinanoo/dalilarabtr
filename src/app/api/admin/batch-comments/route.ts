import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        // ── Auth check ─────────────────────────────────────────────
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll() {},
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('member_profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'محظور' }, { status: 403 });
        }
        // ── End Auth check ─────────────────────────────────────────

        const body = await request.json();
        const { action } = body;

        if (action !== 'approve' && action !== 'reject') {
            return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 });
        }

        // Use service role to bypass RLS. Guard the env var so a missing key
        // returns a clean 500 rather than the cryptic 'undefined' crash from
        // createClient.
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            return NextResponse.json({ error: 'server_config' }, { status: 500 });
        }
        const serviceClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey
        );

        const newStatus = action === 'approve' ? 'approved' : 'rejected';

        // Count pending first
        const { count } = await serviceClient
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        if (!count || count === 0) {
            return NextResponse.json({ message: 'لا توجد تعليقات معلقة', count: 0 });
        }

        // Batch update
        const { error } = await serviceClient
            .from('comments')
            .update({ status: newStatus })
            .eq('status', 'pending');

        if (error) {
            return NextResponse.json({ error: 'فشل التحديث' }, { status: 500 });
        }

        // Audit-log the bulk moderation action (best-effort, non-blocking).
        void (async () => {
            try {
                await serviceClient.from('admin_activity_log').insert({
                    event_type: 'bulk_comments',
                    title: `${action === 'approve' ? 'قبول' : 'رفض'} جماعي لـ ${count} تعليق`,
                    detail: `الحالة الجديدة: ${newStatus}`,
                    entity_table: 'comments',
                    actor_user_id: user.id,
                });
            } catch { /* audit is best-effort */ }
        })();

        return NextResponse.json({
            success: true,
            message: action === 'approve'
                ? `تم قبول ${count} تعليق بنجاح`
                : `تم رفض ${count} تعليق`,
            count,
        });
    } catch {
        return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
    }
}
