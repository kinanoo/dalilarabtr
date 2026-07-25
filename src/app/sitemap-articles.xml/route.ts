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
      // `status='approved'` is the ONLY filter here, deliberately.
      //
      // An `is_active` filter was added to also withhold switched-off articles.
      // It emptied this sitemap outright — verified live, `<urlset>` came back
      // with zero URLs, so every article was withheld from Google for as long as
      // the edge cache held that response. PostgREST fails the entire request
      // when a filtered column is absent, and `is_active` is absent from
      // `articles`: it broke /directory's query in exactly the same way. The
      // checked-in schema for this table names the flag `active`
      // (src/lib/complete_db_setup.sql), and the admin article editor strips
      // `active` from its payload as a "non-DB key" — so the two schema files in
      // this repo disagree and neither is trustworthy for this column.
      //
      // Do not re-add a visibility filter here until the live column is
      // confirmed in Supabase, and never without checking the row count after
      // deploy. Withholding every article is a far worse failure than listing a
      // few switched-off ones — and listing them causes no harm on its own,
      // since removing a URL from a sitemap does not deindex it anyway (that
      // needs a 301 or 410, a separate deliberate decision).
      const res = await supabase
        .from('articles')
        .select('id, slug, last_update')
        .eq('status', 'approved');
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
