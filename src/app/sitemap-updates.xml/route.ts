import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * Sitemap — التحديثات والأخبار (Updates)
 */

export const dynamic = 'force-dynamic';

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dalilarabtr.com').replace(/\/$/, '');

export async function GET() {
  let updates: Array<{ id: string; created_at?: string }> = [];

  if (supabase) {
    try {
      const { data } = await supabase
        .from('updates')
        .select('id, created_at')
        .eq('active', true);
      updates = data || [];
    } catch {
      // Fail silently
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${updates.map(u => `  <url>
    <loc>${baseUrl}/updates/${u.id}</loc>
    <lastmod>${new Date(u.created_at || new Date()).toISOString()}</lastmod>
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
