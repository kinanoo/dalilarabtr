import { NextResponse } from 'next/server';

/**
 * Sitemap — الصفحات الثابتة (About, Contact, Privacy, etc.)
 */

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dalilarabtr.com').replace(/\/$/, '');

const staticPages = [
  { path: '/about', priority: 0.6 },
  { path: '/contact', priority: 0.6 },
  { path: '/privacy', priority: 0.3 },
  { path: '/disclaimer', priority: 0.3 },
  { path: '/important-links', priority: 0.6 },
  { path: '/sources', priority: 0.5 },
  { path: '/forms', priority: 0.7 },
  { path: '/request', priority: 0.6 },
  { path: '/join', priority: 0.5 },
  { path: '/bookmarks', priority: 0.4 },
  { path: '/tools', priority: 0.7 },
  { path: '/tools/kimlik-check', priority: 0.8 },
  { path: '/tools/pharmacy', priority: 0.7 },
];

export async function GET() {
  const now = new Date().toISOString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(p => `  <url>
    <loc>${baseUrl}${p.path}</loc>
    <lastmod>${now}</lastmod>
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
