import ServicesClient from './ServicesClient';
import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/logger';
import {
    DIRECTORY_PAGE_SIZE,
    type DirectoryProvider,
} from '@/lib/serviceDirectory';
import { getServiceDirectoryFacetSummary } from '@/lib/serviceDirectoryServer';

// Refresh the directory's structured data periodically so new/updated
// providers enter Google's index without a redeploy.
export const revalidate = 60;

export const metadata: Metadata = {
    title: { absolute: 'دليل الخدمات العربية في تركيا: أطباء ومحامون ومترجمون | دليل العرب' },
    description: 'دليل المهن والخدمات العربية في تركيا — أطباء، محامون، مترجمون، عقارات، تأمين، شحن وأكثر في إسطنبول، غازي عنتاب، أنقرة، بورصة. تواصل مباشر عبر واتساب.',
    keywords: ['خدمات عربية تركيا', 'أطباء عرب تركيا', 'محامي عربي تركيا', 'مترجم عربي تركيا', 'مهنيين عرب تركيا', 'دليل العرب', 'arap doktor', 'arap avukat', 'tercüman'],
    alternates: { canonical: '/services' },
    openGraph: {
        title: 'دليل الخدمات العربية في تركيا',
        description: 'أطباء، محامون، مترجمون، وعقارات — ابحث عن مقدمي خدمات يعرّفون عن خدماتهم بالعربية في مدن تركيا.',
        url: `${SITE_CONFIG.siteUrl}/services`,
        type: 'website',
        images: ['/og-banner.jpg'],
    },
};

/**
 * Fetch only the first visible page plus lightweight facets. Shipping every
 * provider in the HTML worked for 57 rows, but becomes a multi-megabyte page
 * at 500-1000. Category/city landing pages remain crawlable, while subsequent
 * result pages are fetched through /api/services/directory.
 */
async function getDirectory() {
    try {
        if (!supabase) {
            return {
                rows: [] as DirectoryProvider[],
                total: 0,
                verifiedCount: 0,
                cityCounts: {},
                categoryCounts: {},
                popularSearches: [],
            };
        }
        const BASE = 'id, slug, name, profession, category, description, city, image, phone, whatsapp, is_verified, verification_level, rating, review_count, status, created_at';
        let firstPage: { data: unknown; count: number | null; error: unknown } = await supabase
            .from('service_providers')
            .select(`${BASE}, is_featured`, { count: 'exact' })
            .eq('status', 'approved')
            .order('is_featured', { ascending: false })
            .order('is_verified', { ascending: false })
            .order('rating', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false })
            .order('id', { ascending: true })
            .limit(DIRECTORY_PAGE_SIZE);
        if (firstPage.error) {
            firstPage = await supabase
                .from('service_providers')
                .select(BASE, { count: 'exact' })
                .eq('status', 'approved')
                .order('is_verified', { ascending: false })
                .order('rating', { ascending: false, nullsFirst: false })
                .order('created_at', { ascending: false })
                .order('id', { ascending: true })
                .limit(DIRECTORY_PAGE_SIZE);
        }
        if (firstPage.error) throw firstPage.error;

        const facetSummary = await getServiceDirectoryFacetSummary(supabase);

        const rows = (firstPage.data as DirectoryProvider[]) || [];
        return {
            rows,
            total: firstPage.count || rows.length,
            ...facetSummary,
        };
    } catch (e) {
        logger.error('services directory fetch failed:', e);
        return {
            rows: [] as DirectoryProvider[],
            total: 0,
            verifiedCount: 0,
            cityCounts: {},
            categoryCounts: {},
            popularSearches: [],
        };
    }
}

export default async function ServicesPage() {
    const {
        rows,
        total,
        verifiedCount,
        cityCounts,
        categoryCounts,
        popularSearches,
    } = await getDirectory();
    const base = SITE_CONFIG.siteUrl;

    // The first page is enough for a compact ItemList. Category and city
    // landing pages expose the rest of the directory to crawlers.
    const jsonLdRows = rows;

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
                description: 'دليل مقدّمي الخدمات باللغة العربية في تركيا: أطباء، محامون، مترجمون، عقارات وأكثر.',
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
            <ServicesClient
                initialServices={rows}
                initialTotal={total}
                verifiedCount={verifiedCount}
                cityCounts={cityCounts}
                categoryCounts={categoryCounts}
                initialPopularSearches={popularSearches}
            />
        </>
    );
}
