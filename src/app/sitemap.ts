import { ARTICLES } from '@/lib/articles';
import { NAVIGATION } from '@/lib/data';
import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

  // الصفحات الثابتة الرئيسية
  const staticPages: MetadataRoute.Sitemap = NAVIGATION.map((item) => ({
    url: `${baseUrl}${item.href}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // صفحات المقالات الديناميكية
  const articlePages: MetadataRoute.Sitemap = Object.keys(ARTICLES).map((slug) => ({
    url: `${baseUrl}/article/${slug}`,
    lastModified: new Date(ARTICLES[slug].lastUpdate),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...articlePages];
}
