import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { SITE_CONFIG } from '@/lib/config';

// Google News only accepts news published during roughly the last two days.
// Keep this focused sitemap separate from the full updates sitemap so older
// stories remain discoverable without polluting the time-sensitive feed.
export const revalidate = 900;

const baseUrl = SITE_CONFIG.siteUrl.replace(/\/$/, '');

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const since = new Date(Date.now() - (2 * 24 * 60 * 60 * 1000)).toISOString();
  let updates: Array<{ id: string; title: string; created_at?: string; date?: string }> = [];

  if (supabase) {
    try {
      const { data } = await supabase
        .from('updates')
        .select('id,title,created_at,date')
        .eq('active', true)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1000);
      updates = data || [];
    } catch {
      // Emit a valid empty sitemap instead of returning a crawler-facing 500.
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${updates.map((update) => `  <url>
    <loc>${escapeXml(`${baseUrl}/updates/${update.id}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(SITE_CONFIG.name)}</news:name>
        <news:language>ar</news:language>
      </news:publication>
      <news:publication_date>${new Date(update.created_at || update.date || Date.now()).toISOString()}</news:publication_date>
      <news:title>${escapeXml(update.title)}</news:title>
    </news:news>
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=900, s-maxage=900',
    },
  });
}
