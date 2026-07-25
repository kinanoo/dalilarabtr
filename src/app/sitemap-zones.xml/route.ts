import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * Sitemap — المناطق المحظورة (Zones)
 */

export const dynamic = 'force-dynamic';

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dalilarabtr.com').replace(/\/$/, '');

export async function GET() {
  const zones: Array<{ neighborhood: string; district: string; city: string; updated_at?: string; reopened_at?: string }> = [];

  if (supabase) {
    try {
      // PostgREST caps a select at 1000 rows, and the table holds ~1,166 — a
      // bare select silently truncated the tail, dropping whole cities and
      // districts from this sitemap. Page through the same way /zones does.
      let from = 0;
      const step = 1000;
      for (;;) {
        const { data, error } = await supabase
          .from('zones')
          .select('neighborhood, district, city, updated_at, reopened_at')
          .in('status', ['closed', 'reopened', 'pending'])
          .range(from, from + step - 1);
        if (error) break;
        if (!data || data.length === 0) break;
        zones.push(...data);
        if (data.length < step) break;
        from += step;
      }
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
  // `lastmod` per hub = MAX(updated_at, reopened_at) of its rows. reopened_at
  // matters because a reopening is the change readers care about most, and it
  // does not always move updated_at — without it most hubs stayed frozen on an
  // old date and Google stopped treating the freshness signal as meaningful.
  const cityMax = new Map<string, string>();
  const districtMax = new Map<string, string>();
  // Row counts per hub: a hub with one or two neighbourhoods is a thin page.
  // Submitting those is what feeds "crawled – currently not indexed", so they
  // stay reachable and indexable but are not pushed at Google.
  const cityCount = new Map<string, number>();
  const districtCount = new Map<string, number>();
  const MIN_ROWS_PER_HUB = 3;
  let overallMax = '';

  const bumpMax = (map: Map<string, string>, key: string, ts?: string) => {
    if (!ts) return;
    const cur = map.get(key);
    if (!cur || ts > cur) map.set(key, ts);
  };
  const bumpCount = (map: Map<string, number>, key: string) => {
    map.set(key, (map.get(key) || 0) + 1);
  };

  for (const z of zones) {
    const ts = [z.updated_at, z.reopened_at].filter(Boolean).sort().pop();
    if (ts && ts > overallMax) overallMax = ts;
    if (z.city) { bumpMax(cityMax, z.city, ts); bumpCount(cityCount, z.city); }
    if (z.district) { bumpMax(districtMax, z.district, ts); bumpCount(districtCount, z.district); }
  }

  // A hub with no timestamp at all still deserves a URL — fall back to the
  // dataset-wide max rather than dropping it.
  const hubs = (counts: Map<string, number>, maxes: Map<string, string>) =>
    new Map(
      [...counts.entries()]
        .filter(([, n]) => n >= MIN_ROWS_PER_HUB)
        .map(([key]) => [key, maxes.get(key) || overallMax]),
    );

  const citySet = hubs(cityCount, cityMax);
  const districtSet = hubs(districtCount, districtMax);
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
