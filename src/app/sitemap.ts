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

  const now = new Date();

  return [
    // Sitemap index entries pointing to sub-sitemaps
    {
      url: `${baseUrl}/server-sitemap-index.xml`,
      lastModified: now,
    },
    // Main pages with highest priority
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/consultant`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/directory`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/codes`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/e-devlet-services`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/dictionary`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/calculator`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ban-calculator`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/zones`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/updates`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // Tools — high traffic pages
    {
      url: `${baseUrl}/tools/kimlik-check`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/tools/pharmacy`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    // Category pages
    {
      url: `${baseUrl}/residence`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/work`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/forms`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/request`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    // Additional pages
    {
      url: `${baseUrl}/tools`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/education`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/health`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/housing`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/important-links`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/sources`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/disclaimer`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
