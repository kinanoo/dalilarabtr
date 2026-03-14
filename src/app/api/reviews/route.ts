import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isRateLimited } from '@/lib/rate-limit';

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const svc = serviceRoleKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
    : null;

export async function POST(req: NextRequest) {
    try {
        if (!svc) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });

        const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        if (isRateLimited(`reviews:${clientIp}`, 10)) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const body = await req.json();
        const { service_id, rating, comment, client_name } = body;

        if (!service_id || !rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Input validation
        if (comment && (typeof comment !== 'string' || comment.length > 2000)) {
            return NextResponse.json({ error: 'Comment too long (max 2000 chars)' }, { status: 400 });
        }
        if (client_name && (typeof client_name !== 'string' || client_name.length > 100)) {
            return NextResponse.json({ error: 'Name too long (max 100 chars)' }, { status: 400 });
        }
        if (typeof service_id !== 'string' || service_id.length > 50) {
            return NextResponse.json({ error: 'Invalid service ID' }, { status: 400 });
        }

        // Extract user_id from authenticated session (NOT from request body)
        let userId: string | null = null;
        try {
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
            if (user) userId = user.id;
        } catch {
            // Not authenticated — proceed as anonymous
        }

        // Check for duplicate review by same authenticated user
        if (userId) {
            const { data: existing } = await svc
                .from('service_reviews')
                .select('id')
                .eq('service_id', service_id)
                .eq('user_id', userId)
                .maybeSingle();

            if (existing) {
                return NextResponse.json(
                    { error: 'لقد قمت بتقييم هذه الخدمة مسبقاً', code: '23505' },
                    { status: 409 }
                );
            }
        }

        const insertObj: Record<string, string | number | boolean | null> = {
            service_id,
            rating,
            client_name: client_name || 'زائر',
            comment: comment || null,
            is_approved: true,
        };
        if (userId) insertObj.user_id = userId;

        // Insert without RETURNING to avoid trigger issues
        const { error } = await svc
            .from('service_reviews')
            .insert([insertObj]);

        if (error) {
            console.error('Review insert error:', error);
            return NextResponse.json({ error: 'فشل حفظ التقييم' }, { status: 500 });
        }

        // Manually recalculate service provider rating (safer than relying on trigger)
        const { data: stats } = await svc
            .from('service_reviews')
            .select('rating')
            .eq('service_id', service_id)
            .eq('is_approved', true);

        if (stats && stats.length > 0) {
            const avg = stats.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / stats.length;
            await svc
                .from('service_providers')
                .update({
                    rating: Math.round(avg * 10) / 10,
                    review_count: stats.length,
                })
                .eq('id', service_id);
        }

        return NextResponse.json({ data: { rating, service_id }, error: null });
    } catch (err) {
        console.error('Review API error:', err);
        return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
    }
}
