import ArticlesIndex from './ArticlesIndex';
import { SITE_CONFIG, getOgImage } from '@/lib/config';
import type { Metadata } from 'next';

// Fresh list without hammering the DB on every hit. The bell's grouped
// "تم نشر N مقالات" notification links here (see notify_on_new_content),
// so this page is the canonical "أحدث المقالات" landing — it must never be
// empty of the articles a notification promised.
export const revalidate = 300;

const PAGE_SIZE = 24;

export async function generateMetadata(): Promise<Metadata> {
    const url = `${SITE_CONFIG.siteUrl}/articles`;
    const title = 'أحدث المقالات والأدلة';
    const description =
        'كل مقالات وأدلة دليل العرب في تركيا مرتّبة من الأحدث: الإقامة، العمل، التعليم، الصحة، الجنسية، والخدمات الحكومية — محدّثة باستمرار من مصادر رسمية.';
    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            type: 'website',
            images: [{ url: getOgImage(undefined, { title: 'أحدث المقالات' }), width: 1200, height: 630, alt: title }],
        },
    };
}



const stripHtml = (s?: string | null) => (s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

function isNew(created?: string | null): boolean {
    if (!created) return false;
    const t = new Date(created).getTime();
    return Number.isFinite(t) && Date.now() - t < 7 * 86_400_000;
}


// Page 1. Pagination lives at /articles/page/2, /articles/page/3 … as REAL
// paths, not ?page=. Reading searchParams here forced the whole route to render
// dynamically — verified live, this page answered
// `Cache-Control: private, no-cache, no-store`, so `revalidate = 300` never
// engaged and every visit re-queried Supabase. Real paths also give each page
// of the archive its own cacheable, linkable, crawlable URL.
export default async function ArticlesIndexPage() {
    return <ArticlesIndex page={1} />;
}
