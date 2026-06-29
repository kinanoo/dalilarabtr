import ServicesClient from './ServicesClient';
import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/logger';

// Refresh the directory's structured data periodically so new/updated
// providers enter Google's index without a redeploy.
export const revalidate = 600;

export const metadata: Metadata = {
    title: 'دليل الخدمات في تركيا | أطباء، محامون، ومترجمون عرب موثوقون',
    description: 'دليل المهن والخدمات العربية في تركيا — أطباء، محامون، مترجمون، عقارات، تأمين، شحن وأكثر في إسطنبول، غازي عنتاب، أنقرة، بورصة. تواصل مباشر عبر واتساب.',
    keywords: ['خدمات عربية تركيا', 'أطباء عرب تركيا', 'محامي عربي تركيا', 'مترجم عربي تركيا', 'مهنيين عرب تركيا', 'دليل العرب', 'arap doktor', 'arap avukat', 'tercüman'],
    alternates: { canonical: '/services' },
    openGraph: {
        title: 'دليل الخدمات العربية في تركيا',
        description: 'أطباء، محامون، مترجمون، وعقارات — ابحث عن مقدمي خدمات عرب موثوقين في كل مدن تركيا.',
        url: `${SITE_CONFIG.siteUrl}/services`,
        type: 'website',
        images: ['/og-image.jpg'],
    },
};

interface DirRow {
    id: string;
    slug: string | null;
    name: string;
    profession: string | null;
    city: string | null;
    image: string | null;
    phone: string | null;
    rating: number | null;
    review_count: number | null;
}

/** Fetch top providers + total count for the directory JSON-LD (best-effort). */
async function getDirectory(): Promise<{ rows: DirRow[]; total: number }> {
    try {
        if (!supabase) return { rows: [], total: 0 };
        const [{ data }, { count }] = await Promise.all([
            supabase
                .from('service_providers')
                .select('id, slug, name, profession, city, image, phone, rating, review_count')
                .eq('status', 'approved')
                .order('is_verified', { ascending: false })
                .order('rating', { ascending: false })
                .limit(40),
            supabase
                .from('service_providers')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'approved'),
        ]);
        return { rows: (data as DirRow[]) || [], total: count || (data?.length ?? 0) };
    } catch (e) {
        logger.error('services directory JSON-LD fetch failed:', e);
        return { rows: [], total: 0 };
    }
}

export default async function ServicesPage() {
    const { rows, total } = await getDirectory();
    const base = SITE_CONFIG.siteUrl;

    // schema.org: a CollectionPage whose mainEntity is an ItemList of the
    // listed professionals, each modelled as a LocalBusiness. This tells
    // Google /services is a curated directory of contactable businesses with
    // ratings — the basis for rich directory results + per-business pickup.
    const itemList = {
        '@type': 'ItemList',
        numberOfItems: total,
        itemListElement: rows.map((p, i) => {
            // Detail route resolves by id only (eq('id', id)) — never use slug here.
            const url = `${base}/services/${p.id}`;
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
                description: 'دليل مقدّمي الخدمات العرب الموثوقين في تركيا: أطباء، محامون، مترجمون، عقارات وأكثر.',
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
            <ServicesClient />
        </>
    );
}
