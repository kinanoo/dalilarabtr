import { NAVIGATION } from '@/lib/constants';
import { CATEGORY_SLUGS } from '@/lib/config';
import type { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeQuery(query: any): Promise<any[]> {
  try {
    const { data } = await query;
    return data || [];
  } catch {
    return [];
  }
}

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
    .filter(slug => !navHrefs.has(`/category/${slug}`))
    .map((slug) => ({
      url: `${baseUrl}/category/${slug}`,
      lastModified: SITE_LAST_UPDATED,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }));

  // ─── 4. الصفحات الديناميكية من قاعدة البيانات ───
  let dynamicPages: MetadataRoute.Sitemap = [];

  if (supabase) {
    // كل استعلام مستقل — فشل أحدهم لا يؤثر على الباقي
    const articles = await safeQuery(supabase.from('articles').select('id, slug, last_update').eq('status', 'approved'));
    const codes = await safeQuery(supabase.from('security_codes').select('code, created_at'));
    const zones = await safeQuery(supabase.from('zones').select('id, updated_at'));
    const scenarios = await safeQuery(supabase.from('consultant_scenarios').select('id, created_at'));
    const providers = await safeQuery(supabase.from('service_providers').select('id, created_at').eq('status', 'approved'));
    const updates = await safeQuery(supabase.from('updates').select('id, created_at').eq('active', true));

    dynamicPages = [
      // Articles
      ...articles.map((a) => ({
        url: `${baseUrl}/article/${a.slug || a.id}`,
        lastModified: new Date(a.last_update || new Date()),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),
      // Security Codes
      ...codes.map((c) => ({
        url: `${baseUrl}/codes/${c.code}`,
        lastModified: new Date(c.created_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      })),
      // Zones
      ...zones.map((z) => ({
        url: `${baseUrl}/zones/${z.id}`,
        lastModified: new Date(z.updated_at || new Date()),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
      // Consultant Scenarios
      ...scenarios.map((s) => ({
        url: `${baseUrl}/consultant?scenario=${s.id}`,
        lastModified: new Date(s.created_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      // Service Providers
      ...providers.map((p) => ({
        url: `${baseUrl}/services/${p.id}`,
        lastModified: new Date(p.created_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      })),
      // Updates
      ...updates.map((u) => ({
        url: `${baseUrl}/updates/${u.id}`,
        lastModified: new Date(u.created_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    ];
  }

  return [...navigationPages, ...extraStaticPages, ...categoryPages, ...dynamicPages];
}
