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

        // Use service role to bypass RLS
        const serviceClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
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
            return NextResponse.json({ error: `فشل التحديث: ${error.message}` }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: action === 'approve'
                ? `تم قبول ${count} تعليق بنجاح`
                : `تم رفض ${count} تعليق`,
            count,
        });
    } catch (error) {
        console.error('Batch comments error:', error);
        return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
    }
}
