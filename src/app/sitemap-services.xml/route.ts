import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * Sitemap — مقدمي الخدمات (Service Providers)
 */

export const dynamic = 'force-dynamic';

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dalilarabtr.com').replace(/\/$/, '');

export async function GET() {
  let services: Array<{ id: string; created_at?: string }> = [];

  if (supabase) {
    try {
      const { data } = await supabase
        .from('service_providers')
        .select('id, created_at')
        .eq('status', 'approved');
      services = data || [];
    } catch {
      // Fail silently
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${services.map(s => `  <url>
    <loc>${baseUrl}/services/${s.id}</loc>
    <lastmod>${new Date(s.created_at || new Date()).toISOString()}</lastmod>
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
