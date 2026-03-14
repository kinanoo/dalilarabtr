import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { isRateLimited } from '@/lib/rate-limit';

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const svc = serviceRoleKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
    : null;

// Deterministic seed (25–48) so no article ever shows "0 views"
function viewSeed(id: string): number {
    let h = 0;
    for (let i = 0; i < id.length; i++) {
        h = ((h << 5) - h) + id.charCodeAt(i);
        h |= 0;
    }
    return 25 + (Math.abs(h) % 24);
}

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
        const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
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
                return NextResponse.json({ views: newViews + viewSeed(row.id) });
            }
        }

        // Just fetch current view count
        const row = await findArticle(decoded, 'id, views');
        const real = row?.views || 0;
        return NextResponse.json({ views: real + (row ? viewSeed(row.id) : 25) });
    } catch {
        return NextResponse.json({ views: null });
    }
}
