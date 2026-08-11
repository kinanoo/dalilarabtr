import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { SERVICE_CATEGORIES, categorySlugForName } from '@/lib/serviceCategories';
import { citySlugForName } from '@/lib/turkishCities';
import { isIndexableServiceProvider, isPublicServiceProvider } from '@/lib/serviceProviderQuality';

/**
 * Sitemap — مقدمي الخدمات (Service Providers) + category landing pages.
 */

// Egress guard: this route used `force-dynamic`, so EVERY request — from
// Googlebot, Bingbot, and every other crawler, and separately from each
// Cloudflare edge location — re-read the whole table out of Supabase. Sitemap
// data changes at most a few times a day, so that was pure repeated egress and
// it is what pushed the project over its Supabase egress quota.
//
// `revalidate` caches the rendered XML in Next's own (shared) cache and lets a
// single background refresh per hour serve every crawler, instead of one DB
// read per request. Matches the Cache-Control this route already sends.
// Trade-off: a content change now takes up to an hour to appear here.
export const revalidate = 3600;

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dalilarabtr.com').replace(/\/$/, '');
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET() {
  type SitemapProvider = { id: string; slug?: string | null; created_at?: string; is_verified?: boolean; category?: string; city?: string; whatsapp?: string | null; description?: string | null };
  let publicServices: SitemapProvider[] = [];

  if (supabase) {
    try {
      const { data } = await supabase
        .from('service_providers')
        .select('id, slug, created_at, is_verified, category, city, whatsapp, description')
        .eq('status', 'approved')
        .not('whatsapp', 'is', null)
        .neq('whatsapp', '');
      publicServices = ((data || []) as SitemapProvider[]).filter(isPublicServiceProvider);
    } catch {
      // Fail silently
    }
  }

  // Category landing pages (/services/category/[slug]) — high-value SEO hubs.
  const categoryUrls = SERVICE_CATEGORIES.map(c => `  <url>
    <loc>${baseUrl}/services/category/${c.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');

  // Category+city pages — only the combos that actually have a provider, so
  // we never list empty (noindex) pages. e.g. /services/category/doctors/istanbul
  const combos = new Set<string>();
  for (const s of publicServices) {
    const cat = categorySlugForName(s.category);
    const city = citySlugForName(s.city);
    if (cat && city) combos.add(`${cat}/${city}`);
  }
  const comboUrls = Array.from(combos).map(combo => `  <url>
    <loc>${baseUrl}/services/category/${combo}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n');

  // Detail route resolves by id only — keep loc on /services/<id>. Verified
  // providers + fresh listings get a higher priority / faster crawl hint.
  const now = Date.now();
  const providerUrls = publicServices.filter(isIndexableServiceProvider).map(s => {
    const created = new Date(s.created_at || now).getTime();
    const fresh = now - created < WEEK_MS;
    return `  <url>
    <loc>${baseUrl}/services/${s.slug || s.id}</loc>
    <lastmod>${new Date(s.created_at || now).toISOString()}</lastmod>
    <changefreq>${fresh ? 'weekly' : 'monthly'}</changefreq>
    <priority>${s.is_verified ? '0.8' : '0.6'}</priority>
  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${categoryUrls}
${comboUrls}
${providerUrls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
