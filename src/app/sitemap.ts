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

  // This root sitemap.xml owns ONLY the top-level hub pages that NO child
  // sitemap lists. Every URL that also appears in a child sitemap has been
  // removed here so no URL is duplicated across sitemap files:
  //   - /residence /work /education /housing /health  → sitemap-categories.xml
  //   - /zones                                        → sitemap-zones.xml
  //   - /tools /tools/kimlik-check /tools/pharmacy    → sitemap-static.xml
  //     /forms /request /about /contact /important-links
  //     /sources /privacy /disclaimer                 → sitemap-static.xml
  // The bare hubs kept below (e.g. /codes, /services, /updates) are NOT in
  // any child — their child sitemaps list only sub-pages (/codes/<code>,
  // /services/<id>, /updates/<id>), never the hub itself.
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
      url: `${baseUrl}/qa`,
      changeFrequency: 'weekly',
      priority: 0.8,
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
      url: `${baseUrl}/updates`,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];
}
