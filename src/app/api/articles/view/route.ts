import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { isRateLimited, getClientIp } from '@/lib/rate-limit';

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const svc = serviceRoleKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
    : null;

// The count returned here is the count that was recorded. There used to be a
// deterministic 25–48 padding added on top "so no article ever shows 0 views",
// which meant the eye chip beside a fresh article was mostly invented readers.
// A number presented to visitors as how many people read something has to be
// how many people read it; the honest way to avoid showing a bare 0 is not to
// show the chip, which is what the show_view_counts setting now controls.

async function findArticle(decoded: string, fields: string): Promise<Record<string, any> | null> {
    if (!svc) return null;
    const { data } = await svc.from('articles').select(fields).eq('slug', decoded).maybeSingle();
    if (data) return data as Record<string, any>;
    const { data: byId } = await svc.from('articles').select(fields).eq('id', decoded).maybeSingle();
    return (byId as Record<string, any>) || null;
}

export async function POST(req: NextRequest) {
    try {
        // Rate limit to prevent view count manipulation
        const clientIp = getClientIp(req);
        if (isRateLimited(`views:${clientIp}`, 30)) {
            return NextResponse.json({ views: null });
        }

        const { articleId, track } = await req.json();
        if (!articleId || !svc) {
            return NextResponse.json({ views: null });
        }

        const decoded = decodeURIComponent(articleId);

        if (track) {
            const row = await findArticle(decoded, 'id, views');
            if (row) {
                const newViews = (row.views || 0) + 1;
                await svc.from('articles').update({ views: newViews }).eq('id', row.id);
                return NextResponse.json({ views: newViews });
            }
        }

        // Just fetch current view count
        const row = await findArticle(decoded, 'id, views');
        return NextResponse.json({ views: row?.views || 0 });
    } catch {
        return NextResponse.json({ views: null });
    }
}
