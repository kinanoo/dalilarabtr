import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { SITE_CONFIG } from '@/lib/config';
import ArticlesIndex from '../../ArticlesIndex';

/**
 * /articles/page/2, /articles/page/3 … — the archive's pagination as REAL
 * paths.
 *
 * It used to be /articles?page=N. Reading `searchParams` forces Next to render
 * the route dynamically no matter what else it declares, so /articles answered
 * `Cache-Control: private, no-cache, no-store` (verified live) and re-queried
 * Supabase on every visit. Paths avoid that entirely, and they also give each
 * page of the archive a cacheable, linkable, crawlable URL of its own — a
 * query string is a weaker signal to Google for paginated series.
 *
 * Page 1 is NOT served here: it lives at /articles, and /articles/page/1
 * redirects there so the same list never sits on two URLs.
 */
export const revalidate = 300;
export const dynamicParams = true;

const PAGE_SIZE = 24;

async function pageCount(): Promise<number> {
    if (!supabase) return 1;
    const { count } = await supabase
        .from('articles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved');
    return Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));
}

export async function generateStaticParams() {
    try {
        const total = await pageCount();
        // From 2: page 1 is /articles.
        return Array.from({ length: Math.max(0, total - 1) }, (_, i) => ({ n: String(i + 2) }));
    } catch {
        return [];
    }
}

function parsePage(raw: string): number | null {
    if (!/^\d+$/.test(raw)) return null;      // reject /page/abc and /page/01
    const n = Number(raw);
    return n >= 2 ? n : null;                  // 1 and 0 are not valid here
}

export async function generateMetadata(props: { params: Promise<{ n: string }> }): Promise<Metadata> {
    const { n } = await props.params;
    const page = parsePage(n);
    if (!page) return { title: 'الصفحة غير موجودة', robots: { index: false, follow: false } };

    const url = `${SITE_CONFIG.siteUrl}/articles/page/${page}`;
    return {
        title: `أحدث المقالات والأدلة — صفحة ${page}`,
        description: `الصفحة ${page} من أرشيف مقالات وأدلة دليل العرب في تركيا: الإقامة، العمل، التعليم، الصحة، الجنسية، والخدمات الحكومية.`,
        // Self-canonical: each page of a series is its own page, not a
        // duplicate of page 1. Pointing them all at /articles would tell Google
        // the deeper pages should not be indexed at all, and the older articles
        // only reachable from them would lose their crawl path.
        alternates: { canonical: `/articles/page/${page}` },
        openGraph: { title: `أحدث المقالات — صفحة ${page}`, url, type: 'website', images: ['/og-banner.jpg'] },
    };
}

export default async function ArticlesPagedRoute(props: { params: Promise<{ n: string }> }) {
    const { n } = await props.params;
    const page = parsePage(n);
    if (!page) notFound();

    // Past the end of the archive is a 404, not an empty list — an empty page
    // that answers 200 is exactly what Google files as soft-404.
    if (page > (await pageCount())) notFound();

    return <ArticlesIndex page={page} />;
}
