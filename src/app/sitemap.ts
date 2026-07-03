import type { MetadataRoute } from 'next';

/**
 * Sitemap Index — يقسم السايتماب لعدة ملفات عشان Google يعالجهم أسرع
 * Google بيفضل sitemaps أصغر (أقل من 500 رابط لكل ملف)
 */

export const dynamic = 'force-dynamic';

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dalilarabtr.com').replace(/\/$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  // Next.js will auto-discover sitemap/[id]/route.ts files
  // This root sitemap contains the main static pages only
  // Dynamic content is in separate sitemaps via the sitemap index

  // NOTE: no lastModified on these static hub entries. It used to be
  // `new Date()` on every request — a fake "everything changed just now"
  // signal. Google ignores (and distrusts) lastmod when it lies; omitting it
  // is the honest option. The dynamic child sitemaps carry REAL dates.

  return [
    // NOTE: do NOT list /server-sitemap-index.xml here. This file is a
    // <urlset> of real pages; the index is a <sitemapindex>. Listing the
    // index as a page URL created a circular reference
    // (index → sitemap.xml → index), which confuses crawlers. The index
    // already references THIS sitemap as one of its children.
    // Main pages with highest priority
    {
      url: baseUrl,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/consultant`,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/directory`,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/services`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/codes`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/faq`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/e-devlet-services`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/dictionary`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/calculator`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ban-calculator`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/zones`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/updates`,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // Tools — high traffic pages
    {
      url: `${baseUrl}/tools/kimlik-check`,
      changeFrequency: 'monthly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/tools/pharmacy`,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    // Category pages
    {
      url: `${baseUrl}/residence`,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/work`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/forms`,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/request`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    // Additional pages
    {
      url: `${baseUrl}/tools`,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/education`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/health`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/housing`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/important-links`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/sources`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/disclaimer`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
