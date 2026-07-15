import ServicesClient from './ServicesClient';
import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/logger';

// Refresh the directory's structured data periodically so new/updated
// providers enter Google's index without a redeploy.
export const revalidate = 600;

export const metadata: Metadata = {
    title: { absolute: 'دليل الخدمات العربية في تركيا: أطباء ومحامون ومترجمون | دليل العرب' },
    description: 'دليل المهن والخدمات العربية في تركيا — أطباء، محامون، مترجمون، عقارات، تأمين، شحن وأكثر في إسطنبول، غازي عنتاب، أنقرة، بورصة. تواصل مباشر عبر واتساب.',
    keywords: ['خدمات عربية تركيا', 'أطباء عرب تركيا', 'محامي عربي تركيا', 'مترجم عربي تركيا', 'مهنيين عرب تركيا', 'دليل العرب', 'arap doktor', 'arap avukat', 'tercüman'],
    alternates: { canonical: '/services' },
    openGraph: {
        title: 'دليل الخدمات العربية في تركيا',
        description: 'أطباء، محامون، مترجمون، وعقارات — ابحث عن مقدمي خدمات عرب في كل مدن تركيا.',
        url: `${SITE_CONFIG.siteUrl}/services`,
        type: 'website',
        images: ['/og-banner.jpg'],
    },
};

interface DirRow {
    id: string;
    slug: string | null;
    name: string;
    profession: string | null;
    category: string | null;
    description: string | null;
    city: string | null;
    image: string | null;
    phone: string | null;
    is_verified: boolean | null;
    is_featured: boolean | null;
    rating: number | null;
    review_count: number | null;
    status: string | null;
    created_at: string | null;
}

/**
 * Fetch the FULL approved directory once, server-side, cached by ISR
 * (revalidate=600). It powers both the JSON-LD (top slice) AND seeds
 * <ServicesClient> so the browser never re-pulls the whole service_providers
 * table on every visit + filter change (egress saver). The list is small
 * (~cap 500), so shipping it all in the first HTML is cheap and also makes
 * every provider card crawlable instead of hidden behind a client spinner.
 */
async function getDirectory(): Promise<{ rows: DirRow[]; total: number }> {
    try {
        if (!supabase) return { rows: [], total: 0 };
        const BASE = 'id, slug, name, profession, category, description, city, image, phone, is_verified, rating, review_count, status, created_at';
        // Prefer featured-first ordering. If the `is_featured` column doesn't
        // exist yet (monetization migration not run), the query errors — fall
        // back to the base query so /services never breaks. Once the migration
        // is applied, the featured path just starts working with no redeploy.
        let res: { data: unknown; count: number | null; error: unknown } = await supabase
            .from('service_providers')
            .select(`${BASE}, is_featured`, { count: 'exact' })
            .eq('status', 'approved')
            .order('is_featured', { ascending: false })
            .order('is_verified', { ascending: false })
            .order('rating', { ascending: false })
            .limit(500);
        if (res.error) {
            res = await supabase
                .from('service_providers')
                .select(BASE, { count: 'exact' })
                .eq('status', 'approved')
                .order('is_verified', { ascending: false })
                .order('rating', { ascending: false })
                .limit(500);
        }
        const rows = (res.data as DirRow[]) || [];
        return { rows, total: res.count || rows.length };
    } catch (e) {
        logger.error('services directory fetch failed:', e);
        return { rows: [], total: 0 };
    }
}

export default async function ServicesPage() {
    const { rows, total } = await getDirectory();
    const base = SITE_CONFIG.siteUrl;

    // JSON-LD lists only the top slice (already ordered verified → top-rated)
    // to keep the ItemList compact; the client gets the full set.
    const jsonLdRows = rows.slice(0, 40);

    // schema.org: a CollectionPage whose mainEntity is an ItemList of the
    // listed professionals, each modelled as a LocalBusiness. This tells
    // Google /services is a curated directory of contactable businesses with
    // ratings — the basis for rich directory results + per-business pickup.
    const itemList = {
        '@type': 'ItemList',
        numberOfItems: total,
        itemListElement: jsonLdRows.map((p, i) => {
            const url = `${base}/services/${p.slug || p.id}`;
            const biz: Record<string, unknown> = {
                '@type': 'LocalBusiness',
                name: p.name,
                url,
                ...(p.profession ? { description: p.profession } : {}),
                ...(p.image ? { image: p.image } : {}),
                ...(p.phone ? { telephone: p.phone } : {}),
                address: {
                    '@type': 'PostalAddress',
                    addressCountry: 'TR',
                    ...(p.city ? { addressLocality: p.city } : {}),
                },
            };
            if (p.review_count && p.review_count > 0 && p.rating) {
                biz.aggregateRating = {
                    '@type': 'AggregateRating',
                    ratingValue: Number(p.rating).toFixed(1),
                    reviewCount: p.review_count,
                };
            }
            return { '@type': 'ListItem', position: i + 1, item: biz };
        }),
    };

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Organization',
                '@id': `${base}/#organization`,
                name: 'دليل العرب',
                url: base,
                logo: `${base}/logo.png`,
            },
            {
                '@type': 'CollectionPage',
                '@id': `${base}/services#directory`,
                url: `${base}/services`,
                name: 'دليل الخدمات والمهن العربية في تركيا',
                description: 'دليل مقدّمي الخدمات العرب في تركيا: أطباء، محامون، مترجمون، عقارات وأكثر.',
                inLanguage: 'ar',
                isPartOf: { '@id': `${base}/#organization` },
                mainEntity: itemList,
            },
        ],
    };

    return (
        <>
            {rows.length > 0 && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <ServicesClient initialServices={rows} />
        </>
    );
}
