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
      // `status='approved'` alone is not enough: an article can be approved and
      // still switched off with `is_active=false`, and three of them were being
      // handed to Google. The column is `is_active` (see sql/supabase_schema.sql)
      // and `not.is.false` — rather than `eq(true)` — keeps rows whose flag is
      // NULL, matching the `is_active !== false` test used everywhere else.
      //
      // Note this only stops *submitting* the URLs; it does not deindex them.
      // The pages still answer 200 by design, so if removal is ever the real
      // intent it needs a 301 or a 410 as a separate, deliberate decision.
      const { data } = await supabase
        .from('articles')
        .select('id, slug, last_update')
        .eq('status', 'approved')
        .not('is_active', 'is', false);
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
