/**
 * /tag/[slug] — landing page that lists every approved article carrying a
 * specific tag.
 *
 * Why dedicated routes?
 *   - SEO: each tag becomes a separate indexable URL targeting a long-tail
 *     keyword (e.g. /tag/التجنيس rather than ?tag=citizenship buried in a
 *     filter). Internal link equity flows into these hubs.
 *   - UX: a reader hitting "إذن العمل" or "المنح الدراسية" wants a single
 *     page listing every relevant article, not a search box.
 *
 * Slugs:
 *   - Article tags in the DB are a mix of English ("citizenship", "renewal")
 *     and free-form Arabic strings. We treat the raw value as the slug — the
 *     URL is just the URL-encoded form. `decodeURIComponent` brings it back.
 *   - For display we look the tag up in TAG_LABELS (English → Arabic mapping
 *     in lib/config.ts); if no mapping exists we show the raw value.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { TAG_LABELS, SITE_CONFIG, getOgImage } from '@/lib/config';
import { supabase } from '@/lib/supabaseClient';
import PageHero from '@/components/PageHero';
import { Calendar, Tag as TagIcon } from 'lucide-react';

export const revalidate = 600; // 10 min ISR

function decodeSlug(raw: string): string {
    try { return decodeURIComponent(raw); }
    catch { return raw; }
}

function labelFor(tag: string): string {
    return TAG_LABELS[tag] || tag;
}

/**
 * Count-aware Arabic counted-noun for "مقال" (Latin digits):
 * 1 → مقال واحد، 2 → مقالان، 3-10 → N مقالات، 11+ → N مقالاً.
 */
function articleCountLabel(n: number): string {
    if (n === 1) return 'مقال واحد';
    if (n === 2) return 'مقالان';
    if (n <= 10) return `${n} مقالات`;
    return `${n} مقالاً`;
}

async function fetchArticlesByTag(tag: string) {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('articles')
        .select('id, slug, title, intro, image, last_update, category, tags')
        .eq('status', 'approved')
        .contains('tags', [tag])
        .order('last_update', { ascending: false })
        .limit(200);
    if (error) return [];
    return data || [];
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata(props: PageProps): Promise<Metadata> {
    const params = await props.params;
    const tag = decodeSlug(params.slug);
    const label = labelFor(tag);
    const articles = await fetchArticlesByTag(tag);

    if (articles.length === 0) {
        // Non-existent tag — return a noindex 404-ish metadata; the page
        // itself calls notFound() so search engines see a real 404.
        return { title: 'وسم غير موجود', robots: { index: false } };
    }

    const url = `${SITE_CONFIG.siteUrl}/tag/${encodeURIComponent(tag)}`;
    const title = `${label} — كل المقالات | ${SITE_CONFIG.name}`;
    const description = `كل المقالات والأدلة عن "${label}" — ${articleCountLabel(articles.length)} بمعلومات محدّثة للسوريين والعرب في تركيا.`;

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            type: 'website',
            images: [{ url: getOgImage(undefined, { title: label }), width: 1200, height: 630, alt: label }],
        },
    };
}

export default async function TagPage(props: PageProps) {
    const params = await props.params;
    const tag = decodeSlug(params.slug);
    const label = labelFor(tag);
    const articles = await fetchArticlesByTag(tag);

    if (articles.length === 0) notFound();

    const url = `${SITE_CONFIG.siteUrl}/tag/${encodeURIComponent(tag)}`;

    const breadcrumbs = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_CONFIG.siteUrl },
            { '@type': 'ListItem', position: 2, name: label, item: url },
        ],
    };

    const itemList = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `وسم: ${label}`,
        numberOfItems: articles.length,
        itemListElement: articles.slice(0, 50).map((a, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${SITE_CONFIG.siteUrl}/article/${a.slug || a.id}`,
            name: a.title,
        })),
    };

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo pb-16" dir="rtl">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />

            {/* Hero */}
            <PageHero
                title={label}
                description={`${articleCountLabel(articles.length)} عن "${label}" — محتوى محدّث ومن مصادر رسمية.`}
                icon={<TagIcon className="w-10 h-10 md:w-12 md:h-12" aria-hidden="true" />}
            />

            {/* Article grid */}
            <section className="container mx-auto max-w-5xl px-4 py-8 sm:py-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {articles.map((a) => (
                        <ArticleCard key={a.id} article={a} />
                    ))}
                </div>
            </section>
        </main>
    );
}

type ArticleLite = {
    id: string;
    slug: string | null;
    title: string;
    intro?: string | null;
    image?: string | null;
    last_update?: string | null;
    category?: string | null;
    tags?: string[] | null;
};

function ArticleCard({ article }: { article: ArticleLite }) {
    const href = `/article/${article.slug || article.id}`;
    const hasHttpImage = !!(article.image && /^https?:\/\//i.test(article.image));

    return (
        <Link
            href={href}
            className="group block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
            {hasHttpImage ? (
                <div className="relative w-full aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <Image
                        src={article.image!}
                        alt={article.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                </div>
            ) : (
                <div className="w-full aspect-video bg-emerald-50 dark:bg-slate-800 flex items-center justify-center">
                    <TagIcon size={32} className="text-emerald-500/40" />
                </div>
            )}
            <div className="p-4">
                {article.category && (
                    <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1.5">
                        {article.category}
                    </div>
                )}
                <h2 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition">
                    {article.title}
                </h2>
                {article.intro && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {article.intro}
                    </p>
                )}
                {article.last_update && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-3">
                        <Calendar size={12} />
                        <span>آخر تحديث: {article.last_update}</span>
                    </div>
                )}
            </div>
        </Link>
    );
}
