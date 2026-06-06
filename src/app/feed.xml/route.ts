import { NextResponse } from 'next/server';
import { supabase, withTimeout } from '@/lib/supabaseClient';
import { SITE_CONFIG } from '@/lib/config';

/**
 * /feed.xml — RSS 2.0 feed of the latest 50 published articles.
 *
 * Why we expose this:
 *   - Telegram bots, IFTTT/Zapier-style automations, and Slack/Discord
 *     channel relays all consume RSS. Publishing a feed instantly opens
 *     every one of those distribution channels with zero per-channel work.
 *   - Readers using feed readers (Feedly, NetNewsWire) get instant
 *     notifications without depending on push permissions.
 *   - Standard SEO discoverability — Google understands feeds as a
 *     fingerprint of "what's fresh on this site."
 *
 * Format notes:
 *   - We emit RSS 2.0 with the Atom <link rel="self"> hint (required by
 *     most validators).
 *   - <pubDate> must be RFC 822, NOT ISO 8601 — feed readers reject ISO.
 *   - <description> is wrapped in CDATA so authored HTML in `intro` flows
 *     through without entity-encoding the whole payload.
 *   - We cache for 10 minutes (`s-maxage=600`) — striking a balance
 *     between freshness and protecting Supabase from feed-poller traffic.
 */

export const revalidate = 600;

const PUBLIC_ARTICLE_FIELDS =
    'id, slug, title, intro, category, published_at, last_update, image';

// RFC 822 / 1123 date format required by RSS 2.0.
// `Date.toUTCString()` returns exactly this format — no extra library needed.
function rfc822(d: string | Date | null | undefined): string {
    if (!d) return new Date().toUTCString();
    const date = typeof d === 'string' ? new Date(d) : d;
    if (Number.isNaN(date.getTime())) return new Date().toUTCString();
    return date.toUTCString();
}

// XML-escape entities that would otherwise break the feed. CDATA-wrapped
// fields don't need this; everything outside CDATA (title, link, etc.) does.
function xmlEscape(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export async function GET() {
    const siteUrl = SITE_CONFIG.siteUrl.replace(/\/$/, '');
    const feedUrl = `${siteUrl}/feed.xml`;
    const buildDate = rfc822(new Date());

    let items: Array<Record<string, unknown>> = [];
    try {
        if (supabase) {
            const result = await withTimeout(
                supabase
                    .from('articles')
                    .select(PUBLIC_ARTICLE_FIELDS)
                    .eq('active', true)
                    .eq('status', 'approved')
                    .order('published_at', { ascending: false })
                    .limit(50)
            );
            // withTimeout returns the resolved query response (or null on timeout).
            // The query response itself is { data, error, ... }.
            const data = (result as { data?: Array<Record<string, unknown>> } | null)?.data;
            items = data || [];
        }
    } catch {
        // Empty channel is a valid RSS document — better than 500.
    }

    const itemXml = items
        .map((a) => {
            const slug = (a.slug as string) || (a.id as string);
            const link = `${siteUrl}/article/${slug}`;
            const title = xmlEscape((a.title as string) || 'مقال');
            const cat = xmlEscape((a.category as string) || 'دليل');
            const pubDate = rfc822((a.published_at as string) || (a.last_update as string));
            // intro can contain HTML — CDATA-wrap it instead of escaping.
            // The intro field is curated by us so it's safe; we still strip
            // any literal "]]>" sequence which would close the CDATA early.
            const intro = String(a.intro || '').replace(/]]>/g, ']]]]><![CDATA[>');
            const image = (a.image as string) || '';
            const enclosure = image
                ? `<enclosure url="${xmlEscape(image)}" type="image/jpeg" />`
                : '';
            return `
    <item>
      <title>${title}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${cat}</category>
      ${enclosure}
      <description><![CDATA[${intro}]]></description>
    </item>`;
        })
        .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xml:lang="ar">
  <channel>
    <title>${xmlEscape(SITE_CONFIG.name || 'دليل العرب والسوريين في تركيا')}</title>
    <link>${xmlEscape(siteUrl)}</link>
    <atom:link href="${xmlEscape(feedUrl)}" rel="self" type="application/rss+xml" />
    <description>أحدث المقالات والأدلّة العملية للسوريين والعرب في تركيا.</description>
    <language>ar</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <ttl>30</ttl>
    ${itemXml}
  </channel>
</rss>`;

    return new NextResponse(xml, {
        status: 200,
        headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
        },
    });
}
