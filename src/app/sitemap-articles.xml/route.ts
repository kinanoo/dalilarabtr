import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * Sitemap — المقالات
 * يتم تحديثه ديناميكياً من قاعدة البيانات
 */

export const dynamic = 'force-dynamic';

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dalilarabtr.com').replace(/\/$/, '');

export async function GET() {
  let articles: Array<{ slug?: string; id: string; last_update?: string }> = [];

  if (supabase) {
    try {
      const { data } = await supabase
        .from('articles')
        .select('id, slug, last_update')
        .eq('status', 'approved');
      articles = data || [];
    } catch {
      // Fail silently — return empty sitemap
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${articles.map(a => `  <url>
    <loc>${baseUrl}/article/${a.slug || a.id}</loc>
    <lastmod>${new Date(a.last_update || new Date()).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
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
