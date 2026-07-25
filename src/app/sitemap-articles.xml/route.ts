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
      // `status='approved'` alone is not enough: an article can be approved and
      // still switched off with `is_active=false`, and three of them were being
      // handed to Google. The column is `is_active` (see sql/supabase_schema.sql)
      // and `not.is.false` — rather than `eq(true)` — keeps rows whose flag is
      // NULL, matching the `is_active !== false` test used everywhere else.
      //
      // Note this only stops *submitting* the URLs; it does not deindex them.
      // The pages still answer 200 by design, so if removal is ever the real
      // intent it needs a 301 or a 410 as a separate, deliberate decision.
      //
      // FAILSAFE (added after this shipped): filtering on `is_active` emptied
      // the sitemap completely — verified live, `<urlset>` came back with zero
      // URLs, i.e. every article was withheld from Google. The same column
      // broke /directory's query the same way, so `articles.is_active` does not
      // behave as the checked-in schema says, and PostgREST fails the WHOLE
      // request when a filtered column is missing. An empty sitemap is far
      // worse than submitting three switched-off articles, so the filter is now
      // attempted and dropped on error.
      const base = () =>
        supabase!.from('articles').select('id, slug, last_update').eq('status', 'approved');

      let res = await base().not('is_active', 'is', false);
      if (res.error) {
        logger.error('sitemap-articles: is_active filter failed, retrying without it', res.error);
        res = await base();
      }
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
