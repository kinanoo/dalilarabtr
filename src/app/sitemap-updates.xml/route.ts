import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * Sitemap — التحديثات والأخبار (Updates)
 */

// Egress guard: this route used `force-dynamic`, so EVERY request — from
// Googlebot, Bingbot, and every other crawler, and separately from each
// Cloudflare edge location — re-read the whole table out of Supabase. Sitemap
// data changes at most a few times a day, so that was pure repeated egress and
// it is what pushed the project over its Supabase egress quota.
//
// `revalidate` caches the rendered XML in Next's own (shared) cache and lets a
// single background refresh per hour serve every crawler, instead of one DB
// read per request. Matches the Cache-Control this route already sends.
// Trade-off: a content change now takes up to an hour to appear here.
export const revalidate = 3600;

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
