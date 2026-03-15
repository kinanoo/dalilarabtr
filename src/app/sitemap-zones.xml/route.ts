import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * Sitemap — المناطق المحظورة (Zones)
 */

export const dynamic = 'force-dynamic';

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dalilarabtr.com').replace(/\/$/, '');

export async function GET() {
  let zones: Array<{ id: string; updated_at?: string }> = [];

  if (supabase) {
    try {
      const { data } = await supabase
        .from('zones')
        .select('id, updated_at');
      zones = data || [];
    } catch {
      // Fail silently
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${zones.map(z => `  <url>
    <loc>${baseUrl}/zones/${z.id}</loc>
    <lastmod>${new Date(z.updated_at || new Date()).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
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
