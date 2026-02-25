import { NAVIGATION } from '@/lib/constants';
import type { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic'; // Change to dynamic to allow DB fetch

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dalilarab1.netlify.app').replace(/\/$/, '');

  // الصفحات الثابتة الرئيسية
  const SITE_LAST_UPDATED = new Date('2026-01-01');
  const staticPages: MetadataRoute.Sitemap = NAVIGATION.map((item) => ({
    url: `${baseUrl}${item.href}`,
    lastModified: SITE_LAST_UPDATED,
    changeFrequency: 'weekly' as const,
    priority: item.href === '/directory' ? 1.0 : 0.8, // Boost Directory Priority
  }));

  let dynamicPages: MetadataRoute.Sitemap = [];

  if (supabase) {
    try {
      // 1. Articles
      const { data: articles } = await supabase.from('articles').select('id, slug, last_update');
      const articleUrls = (articles || []).map((a: any) => ({
        url: `${baseUrl}/article/${a.slug || a.id}`,
        lastModified: new Date(a.last_update || new Date()),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }));

      // 2. Security Codes
      const { data: codes } = await supabase.from('security_codes').select('code, updated_at');
      const codeUrls = (codes || []).map((c) => ({
        url: `${baseUrl}/codes/${c.code}`, // Deep link created
        lastModified: new Date(c.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.9, // High priority
      }));

      // 3. Zones
      // Attempt to fetch zones mostly for sitemap
      const { data: zones } = await supabase.from('zones').select('slug, updated_at, id');
      const zoneUrls = (zones || []).map((z) => ({
        url: `${baseUrl}/zones/${z.slug || z.id}`, // Prefer slug
        lastModified: new Date(z.updated_at || new Date()),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));

      // 4. Scenarios (via Consultant Query)
      const { data: scenarios } = await supabase.from('consultant_scenarios').select('id, updated_at');
      const scenarioUrls = (scenarios || []).map((s) => ({
        url: `${baseUrl}/consultant?scenario=${s.id}`, // Query param link
        lastModified: new Date(s.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));

      // 5. Service Providers (Doctors, Lawyers, etc.)
      const { data: providers } = await supabase.from('service_providers').select('id, updated_at, created_at').eq('status', 'approved');
      const providerUrls = (providers || []).map((p) => ({
        url: `${baseUrl}/services/${p.id}`,
        lastModified: new Date(p.updated_at || p.created_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      }));

      dynamicPages = [...articleUrls, ...codeUrls, ...zoneUrls, ...scenarioUrls, ...providerUrls];

    } catch (error) {
      console.error('Error generating sitemap:', error);
    }
  }

  return [...staticPages, ...dynamicPages];
}
