import { NextResponse } from 'next/server';
import { supabase, withTimeout } from '@/lib/supabaseClient';
import { SITE_CONFIG } from '@/lib/config';

/**
 * /feed.xml — RSS 2.0 feed of the latest 50 articles and news items.
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
const PUBLIC_UPDATE_FIELDS =
    'id, title, summary, category, date, created_at, image';

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

    let items: Array<Record<string, unknown> & { kind: 'article' | 'update'; sortDate?: string }> = [];
    try {
        if (supabase) {
            const [articlesResult, updatesResult] = await Promise.all([
                withTimeout(supabase
                    .from('articles')
                    .select(PUBLIC_ARTICLE_FIELDS)
                    .eq('active', true)
                    .eq('status', 'approved')
                    .order('published_at', { ascending: false })
                    .limit(50)),
                withTimeout(supabase
                    .from('updates')
                    .select(PUBLIC_UPDATE_FIELDS)
                    .eq('active', true)
                    .order('date', { ascending: false })
                    .order('created_at', { ascending: false })
                    .limit(50)),
            ]);

            const articles = (articlesResult as { data?: Array<Record<string, unknown>> } | null)?.data || [];
            const updates = (updatesResult as { data?: Array<Record<string, unknown>> } | null)?.data || [];
            items = [
                ...articles.map((row) => ({
                    ...row,
                    kind: 'article' as const,
                    sortDate: String(row.published_at || row.last_update || ''),
                })),
                ...updates.map((row) => ({
                    ...row,
                    kind: 'update' as const,
                    sortDate: String(row.created_at || row.date || ''),
                })),
            ]
                .sort((a, b) => String(b.sortDate || '').localeCompare(String(a.sortDate || '')))
                .slice(0, 50);
        }
    } catch {
        // Empty channel is a valid RSS document — better than 500.
    }

    const itemXml = items
        .map((a) => {
            const isUpdate = a.kind === 'update';
            const slug = (a.slug as string) || (a.id as string);
            const link = isUpdate ? `${siteUrl}/updates/${slug}` : `${siteUrl}/article/${slug}`;
            const title = xmlEscape((a.title as string) || (isUpdate ? 'خبر' : 'مقال'));
            const cat = xmlEscape((a.category as string) || (isUpdate ? 'أخبار تركيا' : 'دليل'));
            const pubDate = rfc822(
                isUpdate
                    ? ((a.created_at as string) || (a.date as string))
                    : ((a.published_at as string) || (a.last_update as string)),
            );
            // intro can contain HTML — CDATA-wrap it instead of escaping.
            // The intro field is curated by us so it's safe; we still strip
            // any literal "]]>" sequence which would close the CDATA early.
            const intro = String(isUpdate ? (a.summary || '') : (a.intro || ''))
                .replace(/]]>/g, ']]]]><![CDATA[>');
            const rawImage = (a.image as string) || '';
            const image = rawImage && !rawImage.startsWith('http') ? `${siteUrl}${rawImage}` : rawImage;
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
    <description>أحدث الأخبار والقرارات والمقالات والأدلّة العملية للسوريين والعرب في تركيا.</description>
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
