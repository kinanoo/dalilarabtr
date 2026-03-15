import { NextResponse } from 'next/server';
import { CATEGORY_SLUGS } from '@/lib/config';

/**
 * Sitemap — التصنيفات والأقسام الرئيسية
 */

export const dynamic = 'force-dynamic';

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dalilarabtr.com').replace(/\/$/, '');

export async function GET() {
  const now = new Date().toISOString();
  const categories = Object.keys(CATEGORY_SLUGS);

  // Guide pages that deserve high priority
  const guidePages = [
    '/residence',
    '/work',
    '/education',
    '/housing',
    '/health',
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${categories.map(slug => `  <url>
    <loc>${baseUrl}/category/${slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
${guidePages.map(path => `  <url>
    <loc>${baseUrl}${path}</loc>
    <lastmod>${now}</lastmod>
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
