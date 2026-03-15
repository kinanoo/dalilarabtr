import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * Sitemap — أكواد الأمنيات (Security Codes)
 */

export const dynamic = 'force-dynamic';

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dalilarabtr.com').replace(/\/$/, '');

export async function GET() {
  let codes: Array<{ code: string; created_at?: string }> = [];

  if (supabase) {
    try {
      const { data } = await supabase
        .from('security_codes')
        .select('code, created_at');
      codes = data || [];
    } catch {
      // Fail silently
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${codes.map(c => `  <url>
    <loc>${baseUrl}/codes/${c.code}</loc>
    <lastmod>${new Date(c.created_at || new Date()).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
