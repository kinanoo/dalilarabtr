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
import { ArrowLeft, Calendar, Tag as TagIcon } from 'lucide-react';

export const revalidate = 600; // 10 min ISR

function decodeSlug(raw: string): string {
    try { return decodeURIComponent(raw); }
    catch { return raw; }
}

function labelFor(tag: string): string {
    return TAG_LABELS[tag] || tag;
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
    const description = `كل المقالات والأدلة عن "${label}" — ${articles.length} مقالاً محدّثاً للسوريين والعرب في تركيا.`;

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            type: 'website',
            images: [{ url: getOgImage(), width: 1200, height: 630, alt: label }],
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
            { '@type': 'ListItem', position: 2, name: 'الوسوم', item: `${SITE_CONFIG.siteUrl}/tags` },
            { '@type': 'ListItem', position: 3, name: label, item: url },
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
            <header className="bg-gradient-to-b from-emerald-900 via-slate-900 to-slate-950 text-white">
                <div className="container mx-auto max-w-5xl px-4 py-10 sm:py-14">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition mb-6"
                    >
                        <ArrowLeft size={16} />
                        العودة للرئيسية
                    </Link>
                    <div className="flex flex-col gap-3">
                        <div className="inline-flex items-center gap-2 self-start bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full px-3 py-1 text-xs font-bold">
                            <TagIcon size={12} />
                            وسم
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight">{label}</h1>
                        <p className="text-slate-300 text-sm sm:text-base">
                            {articles.length} مقالاً يتعلّق بـ "{label}" — كلها محدّثة ومن مصادر رسمية.
                        </p>
                    </div>
                </div>
            </header>

            {/* Article grid */}
            <section className="container mx-auto max-w-5xl px-4 -mt-6 sm:-mt-8 relative z-10">
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
            className="group block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-lg hover:border-emerald-500/40 transition-all"
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
                <div className="w-full aspect-video bg-gradient-to-br from-emerald-50 to-slate-100 dark:from-emerald-900/20 dark:to-slate-800 flex items-center justify-center">
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
