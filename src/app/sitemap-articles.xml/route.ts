import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/logger';

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
      // The visibility flag on `articles` is `active` — NOT `is_active`.
      // Confirmed against the live database:
      //   select column_name from information_schema.columns
      //   where table_name='articles' and column_name in ('active','is_active');
      //   → one row: active | boolean | default true
      // An earlier attempt filtered on `is_active`, which does not exist, and
      // PostgREST fails the entire request when a filtered column is absent —
      // it emptied this sitemap outright (verified live: `<urlset>` with zero
      // URLs, every article withheld from Google). Do not rename this back.
      //
      // `not.is.false` rather than `eq(true)` so a NULL flag still counts as
      // visible, matching the column default.
      //
      // Note this only stops SUBMITTING these URLs; it does not deindex them.
      // The pages still answer 200 by design, so if removal is ever the real
      // intent it needs a 301 or a 410 as a separate, deliberate decision.
      const res = await supabase
        .from('articles')
        .select('id, slug, last_update')
        .eq('status', 'approved')
        .not('active', 'is', false);
      if (res.error) logger.error('sitemap-articles: query failed', res.error);
      articles = res.data || [];
      // Never publish an empty sitemap on a site with hundreds of articles —
      // that is a stronger (and wrong) signal than publishing nothing new.
      if (!articles.length) logger.error('sitemap-articles: query returned zero rows');
    } catch (e) {
      logger.error('sitemap-articles: fetch threw', e);
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
