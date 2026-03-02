import { NAVIGATION } from '@/lib/constants';
import { CATEGORY_SLUGS } from '@/lib/config';
import type { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dalilarabtr.com').replace(/\/$/, '');
  const SITE_LAST_UPDATED = new Date('2026-03-03');

  // ─── 1. الصفحات الثابتة من NAVIGATION ───
  const navigationPages: MetadataRoute.Sitemap = NAVIGATION.map((item) => ({
    url: `${baseUrl}${item.href}`,
    lastModified: SITE_LAST_UPDATED,
    changeFrequency: 'weekly' as const,
    priority: item.href === '/' ? 1.0 : item.href === '/directory' ? 1.0 : 0.8,
  }));

  // ─── 2. صفحات ثابتة عامة غير موجودة في NAVIGATION ───
  const extraStaticPaths = [
    '/about',
    '/contact',
    '/privacy',
    '/disclaimer',
    '/important-links',
    '/sources',
    '/updates',
    '/residence',
    '/work',
    '/education',
    '/housing',
    '/health',
    '/forms',
    '/request',
    '/dictionary',
    '/tools',
    '/tools/kimlik-check',
    '/tools/pharmacy',
    '/calculator',
    '/bookmarks',
    '/join',
  ];

  // تصفية: لا نكرر الصفحات الموجودة في NAVIGATION
  const navHrefs = new Set(NAVIGATION.map(n => n.href));
  const extraStaticPages: MetadataRoute.Sitemap = extraStaticPaths
    .filter(p => !navHrefs.has(p))
    .map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: SITE_LAST_UPDATED,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

  // ─── 3. صفحات التصنيفات (/category/[slug]) ───
  const categoryPages: MetadataRoute.Sitemap = Object.keys(CATEGORY_SLUGS)
    .filter(slug => !navHrefs.has(`/category/${slug}`)) // لا نكرر الموجود بالـ NAVIGATION
    .map((slug) => ({
      url: `${baseUrl}/category/${slug}`,
      lastModified: SITE_LAST_UPDATED,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }));

  // ─── 4. الصفحات الديناميكية من قاعدة البيانات ───
  let dynamicPages: MetadataRoute.Sitemap = [];

  if (supabase) {
    try {
      // Articles
      const { data: articles } = await supabase.from('articles').select('id, slug, last_update');
      const articleUrls = (articles || []).map((a: any) => ({
        url: `${baseUrl}/article/${a.slug || a.id}`,
        lastModified: new Date(a.last_update || new Date()),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }));

      // Security Codes
      const { data: codes } = await supabase.from('security_codes').select('code, updated_at');
      const codeUrls = (codes || []).map((c: any) => ({
        url: `${baseUrl}/codes/${c.code}`,
        lastModified: new Date(c.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      }));

      // Zones
      const { data: zones } = await supabase.from('zones').select('slug, updated_at, id');
      const zoneUrls = (zones || []).map((z: any) => ({
        url: `${baseUrl}/zones/${z.slug || z.id}`,
        lastModified: new Date(z.updated_at || new Date()),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));

      // Consultant Scenarios
      const { data: scenarios } = await supabase.from('consultant_scenarios').select('id, updated_at');
      const scenarioUrls = (scenarios || []).map((s: any) => ({
        url: `${baseUrl}/consultant?scenario=${s.id}`,
        lastModified: new Date(s.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));

      // Service Providers
      const { data: providers } = await supabase.from('service_providers').select('id, updated_at, created_at').eq('status', 'approved');
      const providerUrls = (providers || []).map((p: any) => ({
        url: `${baseUrl}/services/${p.id}`,
        lastModified: new Date(p.updated_at || p.created_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      }));

      // Updates (News)
      const { data: updates } = await supabase.from('updates').select('id, updated_at, created_at');
      const updateUrls = (updates || []).map((u: any) => ({
        url: `${baseUrl}/updates/${u.id}`,
        lastModified: new Date(u.updated_at || u.created_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));

      dynamicPages = [
        ...articleUrls,
        ...codeUrls,
        ...zoneUrls,
        ...scenarioUrls,
        ...providerUrls,
        ...updateUrls,
      ];

    } catch (error) {
      console.error('Error generating sitemap:', error);
    }
  }

  return [...navigationPages, ...extraStaticPages, ...categoryPages, ...dynamicPages];
}
