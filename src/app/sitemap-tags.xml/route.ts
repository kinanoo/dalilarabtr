import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * sitemap-tags.xml — one URL per distinct tag that appears on at least one
 * approved article.
 *
 * Article tags live in a text[] column on articles; PostgREST's `select=tags`
 * with `status=eq.approved` is the cheapest way to surface them without
 * needing a new SQL function. We aggregate in JS, drop tags that only show
 * up once (those are usually typos / single-use noise), and emit the rest.
 *
 * Priority is constant 0.6 — these are aggregation hubs that should rank but
 * shouldn't out-prioritise the underlying articles (0.7) or the home page (1.0).
 */

export const dynamic = 'force-dynamic';

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dalilarabtr.com').replace(/\/$/, '');

function escapeXml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export async function GET() {
    let entries: Array<{ tag: string; count: number; lastSeen: string }> = [];

    if (supabase) {
        try {
            const { data } = await supabase
                .from('articles')
                .select('tags, last_update')
                .eq('status', 'approved')
                .not('tags', 'is', null);

            const buckets = new Map<string, { count: number; lastSeen: string }>();
            for (const r of (data || []) as Array<{ tags?: string[] | null; last_update?: string | null }>) {
                if (!Array.isArray(r.tags)) continue;
                for (const raw of r.tags) {
                    const tag = (raw || '').trim();
                    if (!tag) continue;
                    const b = buckets.get(tag) ?? { count: 0, lastSeen: '' };
                    b.count += 1;
                    if ((r.last_update || '') > b.lastSeen) b.lastSeen = r.last_update || b.lastSeen;
                    buckets.set(tag, b);
                }
            }
            // Single-use tags are usually typos or one-off — drop them so
            // Google doesn't crawl 70 thin landing pages with one card each.
            entries = Array.from(buckets.entries())
                .filter(([, v]) => v.count >= 2)
                .map(([tag, v]) => ({ tag, count: v.count, lastSeen: v.lastSeen || new Date().toISOString() }));
        } catch {
            // ignore — emit empty sitemap rather than 500
        }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((e) => `  <url>
    <loc>${baseUrl}/tag/${escapeXml(encodeURIComponent(e.tag))}</loc>
    <lastmod>${new Date(e.lastSeen).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n')}
</urlset>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
    });
}
