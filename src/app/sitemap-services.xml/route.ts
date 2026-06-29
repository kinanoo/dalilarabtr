import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { SERVICE_CATEGORIES } from '@/lib/serviceCategories';

/**
 * Sitemap — مقدمي الخدمات (Service Providers) + category landing pages.
 */

export const dynamic = 'force-dynamic';

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dalilarabtr.com').replace(/\/$/, '');
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET() {
  let services: Array<{ id: string; created_at?: string; is_verified?: boolean }> = [];

  if (supabase) {
    try {
      const { data } = await supabase
        .from('service_providers')
        .select('id, created_at, is_verified')
        .eq('status', 'approved');
      services = data || [];
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

  // Detail route resolves by id only — keep loc on /services/<id>. Verified
  // providers + fresh listings get a higher priority / faster crawl hint.
  const now = Date.now();
  const providerUrls = services.map(s => {
    const created = new Date(s.created_at || now).getTime();
    const fresh = now - created < WEEK_MS;
    return `  <url>
    <loc>${baseUrl}/services/${s.id}</loc>
    <lastmod>${new Date(s.created_at || now).toISOString()}</lastmod>
    <changefreq>${fresh ? 'weekly' : 'monthly'}</changefreq>
    <priority>${s.is_verified ? '0.8' : '0.6'}</priority>
  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${categoryUrls}
${providerUrls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
