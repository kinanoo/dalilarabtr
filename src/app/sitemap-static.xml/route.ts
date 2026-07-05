import { NextResponse } from 'next/server';
import { TR_CITIES } from '@/lib/turkishCities';

/**
 * Sitemap — الصفحات الثابتة (About, Contact, Privacy, etc.)
 */

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dalilarabtr.com').replace(/\/$/, '');

const staticPages = [
  { path: '/city', priority: 0.8 },
  // Per-city hubs (local-SEO landing pages).
  ...TR_CITIES.map((c) => ({ path: `/city/${c.slug}`, priority: 0.8 })),
  { path: '/about', priority: 0.6 },
  { path: '/contact', priority: 0.6 },
  { path: '/privacy', priority: 0.3 },
  { path: '/disclaimer', priority: 0.3 },
  { path: '/important-links', priority: 0.6 },
  { path: '/sources', priority: 0.5 },
  { path: '/forms', priority: 0.7 },
  { path: '/request', priority: 0.6 },
  { path: '/join', priority: 0.5 },
  // NOTE: /bookmarks intentionally omitted — it's a per-user page that
  // renders client-side saved items, so it has no stable indexable content
  // (and is Disallowed in robots.txt).
  { path: '/tools', priority: 0.7 },
  { path: '/tools/kimlik-check', priority: 0.8 },
  { path: '/tools/pharmacy', priority: 0.7 },
  { path: '/tools/residence-calculator', priority: 0.8 },
];

export async function GET() {
  // NOTE: no <lastmod> on these entries. These are truly-static hub pages;
  // stamping them with `new Date()` on every request is a fake "changed just
  // now" signal that Google distrusts. Omitting it is the honest option —
  // matching sitemap.ts, which already omits lastmod on static hubs.
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(p => `  <url>
    <loc>${baseUrl}${p.path}</loc>
    <changefreq>monthly</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
