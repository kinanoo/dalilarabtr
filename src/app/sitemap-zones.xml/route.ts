import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * Sitemap — المناطق المحظورة (Zones)
 */

export const dynamic = 'force-dynamic';

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dalilarabtr.com').replace(/\/$/, '');

export async function GET() {
  let zones: Array<{ neighborhood: string; district: string; city: string; updated_at?: string }> = [];

  if (supabase) {
    try {
      const { data } = await supabase
        .from('zones')
        .select('neighborhood, district, city, updated_at');
      zones = data || [];
    } catch {
      // Fail silently
    }
  }

  // Aggregate the REAL last-updated date per city and per district. Using the
  // request time (new Date()) for <lastmod> — as this did before — makes the
  // value change on every crawl, so Google stops trusting the freshness signal
  // entirely. We instead stamp each hub with MAX(updated_at) of its rows, which
  // only moves when that area's data actually changes.
  // (Individual neighbourhood pages are intentionally NOT listed here — they're
  // thin/near-duplicate and now noindex; the city/district hubs are the
  // valuable, indexable entry points.)
  const cityMax = new Map<string, string>();
  const districtMax = new Map<string, string>();
  let overallMax = '';

  const bumpMax = (map: Map<string, string>, key: string, ts?: string) => {
    if (!ts) return;
    const cur = map.get(key);
    if (!cur || ts > cur) map.set(key, ts);
  };

  for (const z of zones) {
    if (z.updated_at && z.updated_at > overallMax) overallMax = z.updated_at;
    if (z.city) bumpMax(cityMax, z.city, z.updated_at);
    if (z.district) bumpMax(districtMax, z.district, z.updated_at);
  }

  const citySet = cityMax;
  const districtSet = districtMax;
  // Fallback only if the table has no updated_at anywhere (shouldn't happen).
  const now = overallMax || new Date().toISOString();

  // City pages are the highest-value entry points: visitors search
  // "أحياء أورفا المغلقة" → land directly on /zones/Şanlıurfa. Bumped to
  // 0.9 priority + daily changefreq since the data shifts now that we have
  // community reports + admin flips. Districts get 0.7. The main hub
  // /zones is implicit (covered by the root sitemap).
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/zones</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.95</priority>
  </url>
${[...citySet.entries()].map(([city, lastmod]) => `  <url>
    <loc>${baseUrl}/zones/${encodeURIComponent(city)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`).join('\n')}
${[...districtSet.entries()].map(([district, lastmod]) => `  <url>
    <loc>${baseUrl}/zones/${encodeURIComponent(district)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
