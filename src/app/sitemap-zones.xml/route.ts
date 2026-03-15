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

  // Generate URLs for unique districts and cities (how users actually access zones)
  const districtSet = new Set<string>();
  const citySet = new Set<string>();
  const neighborhoodUrls: Array<{ slug: string; updated_at?: string }> = [];

  for (const z of zones) {
    // Individual neighborhoods
    if (z.neighborhood) {
      neighborhoodUrls.push({
        slug: encodeURIComponent(z.neighborhood),
        updated_at: z.updated_at,
      });
    }
    if (z.district) districtSet.add(z.district);
    if (z.city) citySet.add(z.city);
  }

  const now = new Date().toISOString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...citySet].map(city => `  <url>
    <loc>${baseUrl}/zones/${encodeURIComponent(city)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
${[...districtSet].map(district => `  <url>
    <loc>${baseUrl}/zones/${encodeURIComponent(district)}</loc>
    <lastmod>${now}</lastmod>
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
