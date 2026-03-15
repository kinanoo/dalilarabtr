import { NextResponse } from 'next/server';

/**
 * Sitemap Index — يوجّه Google لكل السايتمابات الفرعية
 * هاد بيساعد Google يكتشف ويفهرس كل الصفحات بشكل أسرع
 */

export const dynamic = 'force-dynamic';

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dalilarabtr.com').replace(/\/$/, '');

export async function GET() {
  const now = new Date().toISOString();

  const sitemaps = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap-articles.xml`,
    `${baseUrl}/sitemap-categories.xml`,
    `${baseUrl}/sitemap-codes.xml`,
    `${baseUrl}/sitemap-zones.xml`,
    `${baseUrl}/sitemap-services.xml`,
    `${baseUrl}/sitemap-updates.xml`,
    `${baseUrl}/sitemap-static.xml`,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(url => `  <sitemap>
    <loc>${url}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
