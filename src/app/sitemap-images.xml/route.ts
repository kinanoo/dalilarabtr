import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * Image sitemap — surfaces article + service hero images to Google Images.
 *
 * Why a separate sitemap rather than embedding <image:image> inside the
 * existing sitemap-articles / sitemap-services files?
 *   1) Article entries are dynamically generated and already at the 200-item
 *      mark; keeping a separate images file lets us evolve them independently
 *      without bloating the per-URL XML.
 *   2) Google Search Console reports image-coverage stats per-sitemap, so a
 *      dedicated file makes regressions obvious.
 *
 * We emit only HTTP(S) images (skips local /images/* fallbacks that aren't
 * crawlable from outside) and de-duplicate on URL so the same Supabase storage
 * object isn't listed twice.
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

function isUsableImage(url: unknown): url is string {
    return typeof url === 'string' && /^https?:\/\//i.test(url);
}

type Entry = {
    pageUrl: string;
    imageUrl: string;
    caption?: string;
    title?: string;
};

export async function GET() {
    const entries: Entry[] = [];
    const seen = new Set<string>();

    if (supabase) {
        // Articles — image + image_alt (caption) + title (title attribute)
        try {
            const { data } = await supabase
                .from('articles')
                .select('id, slug, title, image, image_alt')
                .eq('status', 'approved')
                .not('image', 'is', null);
            for (const a of (data || []) as Array<{ id: string; slug?: string; title?: string; image?: string; image_alt?: string }>) {
                if (!isUsableImage(a.image)) continue;
                const key = `article:${a.image}`;
                if (seen.has(key)) continue;
                seen.add(key);
                entries.push({
                    pageUrl: `${baseUrl}/article/${a.slug || a.id}`,
                    imageUrl: a.image,
                    caption: a.image_alt || a.title || undefined,
                    title: a.title || undefined,
                });
            }
        } catch {
            // Fail open — empty image sitemap rather than 500
        }

        // Service provider images — only approved providers
        try {
            const { data } = await supabase
                .from('service_providers')
                .select('id, name, profession, image')
                .eq('status', 'approved')
                .not('image', 'is', null);
            for (const s of (data || []) as Array<{ id: string; name?: string; profession?: string; image?: string }>) {
                if (!isUsableImage(s.image)) continue;
                const key = `service:${s.image}`;
                if (seen.has(key)) continue;
                seen.add(key);
                entries.push({
                    pageUrl: `${baseUrl}/services/${s.id}`,
                    imageUrl: s.image,
                    caption: s.profession ? `${s.name} — ${s.profession}` : s.name,
                    title: s.name || undefined,
                });
            }
        } catch {
            // ignore
        }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.map((e) => `  <url>
    <loc>${escapeXml(e.pageUrl)}</loc>
    <image:image>
      <image:loc>${escapeXml(e.imageUrl)}</image:loc>${e.caption ? `\n      <image:caption>${escapeXml(e.caption)}</image:caption>` : ''}${e.title ? `\n      <image:title>${escapeXml(e.title)}</image:title>` : ''}
    </image:image>
  </url>`).join('\n')}
</urlset>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
    });
}
