import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const svc = serviceRoleKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
    : null;

export async function POST(req: NextRequest) {
    try {
        if (!svc) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });

        const body = await req.json();
        const { service_id, rating, comment, client_name, user_id } = body;

        if (!service_id || !rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check for duplicate review by same user
        if (user_id) {
            const { data: existing } = await svc
                .from('service_reviews')
                .select('id')
                .eq('service_id', service_id)
                .eq('user_id', user_id)
                .maybeSingle();

            if (existing) {
                return NextResponse.json(
                    { error: 'لقد قمت بتقييم هذه الخدمة مسبقاً', code: '23505' },
                    { status: 409 }
                );
            }
        }

        const insertObj: Record<string, any> = {
            service_id,
            rating,
            client_name: client_name || 'زائر',
            comment: comment || null,
            is_approved: true,
        };
        if (user_id) insertObj.user_id = user_id;

        // Insert without RETURNING to avoid trigger issues
        const { error } = await svc
            .from('service_reviews')
            .insert([insertObj]);

        if (error) {
            console.error('Review insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Manually recalculate service provider rating (safer than relying on trigger)
        const { data: stats } = await svc
            .from('service_reviews')
            .select('rating')
            .eq('service_id', service_id)
            .eq('is_approved', true);

        if (stats && stats.length > 0) {
            const avg = stats.reduce((sum: number, r: any) => sum + r.rating, 0) / stats.length;
            await svc
                .from('service_providers')
                .update({
                    rating: Math.round(avg * 10) / 10,
                    review_count: stats.length,
                })
                .eq('id', service_id);
        }

        return NextResponse.json({ data: { rating, service_id }, error: null });
    } catch (err: any) {
        console.error('Review API error:', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
