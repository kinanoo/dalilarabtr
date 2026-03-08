import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const svc = serviceRoleKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
    : null;

async function findArticle(decoded: string, fields: string): Promise<Record<string, any> | null> {
    if (!svc) return null;
    const { data } = await svc.from('articles').select(fields).eq('slug', decoded).maybeSingle();
    if (data) return data as Record<string, any>;
    const { data: byId } = await svc.from('articles').select(fields).eq('id', decoded).maybeSingle();
    return (byId as Record<string, any>) || null;
}

export async function POST(req: NextRequest) {
    try {
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
        const row = await findArticle(decoded, 'views');
        return NextResponse.json({ views: row?.views || 0 });
    } catch {
        return NextResponse.json({ views: null });
    }
}
