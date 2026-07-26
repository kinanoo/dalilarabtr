import { NextResponse } from 'next/server';
import { OFFICIAL_PLACES } from '@/lib/officialPlaces';

/**
 * Sitemap — «أين يقع؟» المقرات الرسمية (/places + /places/<slug>)
 *
 * Owns the hub AND every place page, so neither appears in sitemap-static.xml
 * or sitemap.ts (no URL is listed in two sitemaps). Registered in
 * server-sitemap-index.xml.
 *
 * No <lastmod>: these pages are generated from a compile-time table and their
 * live content comes from Google Maps at click time, so there is no real
 * change date to report — and a fabricated one is a signal Google distrusts.
 * Same reasoning as sitemap-static.xml.
 */

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dalilarabtr.com').replace(/\/$/, '');

export async function GET() {
    const urls = [
        { loc: `${baseUrl}/places`, priority: '0.9' },
        // Missions are specific buildings people search by name — the highest
        // intent of the set. Per-province office pages sit just below.
        ...OFFICIAL_PLACES.map((p) => ({
            loc: `${baseUrl}/places/${p.slug}`,
            priority: p.kind === 'single' ? '0.8' : '0.7',
        })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>monthly</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
    });
}
