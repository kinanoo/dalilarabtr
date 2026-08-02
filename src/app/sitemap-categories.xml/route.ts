import { NextResponse } from 'next/server';
import { CATEGORY_SLUGS } from '@/lib/config';

/**
 * Sitemap — التصنيفات والأقسام الرئيسية
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
  const categories = Object.keys(CATEGORY_SLUGS);

  // Guide pages that deserve high priority
  const guidePages = [
    '/residence',
    '/work',
    '/education',
    '/housing',
    '/health',
  ];

  // NOTE: no <lastmod> on these entries. Category and section-hub pages are
  // truly-static hubs; stamping them with `new Date()` on every request is a
  // fake "changed just now" signal that Google distrusts. Omitting it is the
  // honest option — matching sitemap.ts, which already omits lastmod on hubs.
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${categories.map(slug => `  <url>
    <loc>${baseUrl}/category/${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
${guidePages.map(path => `  <url>
    <loc>${baseUrl}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
