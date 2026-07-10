import Link from 'next/link';
import Image from 'next/image';
import { FileText, ArrowLeft, ArrowRight, Calendar, Newspaper } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { SITE_CONFIG, getOgImage } from '@/lib/config';
import type { Metadata } from 'next';
import logger from '@/lib/logger';

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

type Row = {
    id: string;
    slug: string | null;
    title: string;
    intro: string | null;
    excerpt: string | null;
    last_update: string | null;
    created_at: string | null;
    category: string | null;
    image: string | null;
    image_url: string | null;
};

const stripHtml = (s?: string | null) => (s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

function isNew(created?: string | null): boolean {
    if (!created) return false;
    const t = new Date(created).getTime();
    return Number.isFinite(t) && Date.now() - t < 7 * 86_400_000;
}

export default async function ArticlesIndexPage(props: { searchParams: Promise<{ page?: string }> }) {
    const sp = await props.searchParams;
    const page = Math.max(1, parseInt(sp?.page || '1', 10) || 1);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let rows: Row[] = [];
    let total = 0;
    if (supabase) {
        try {
            const { data, count } = await supabase
                .from('articles')
                .select('id, slug, title, intro, excerpt, last_update, created_at, category, image, image_url', { count: 'exact' })
                .eq('status', 'approved')
                .order('created_at', { ascending: false })
                .range(from, to);
            rows = (data as Row[]) || [];
            total = count || 0;
        } catch (e) {
            logger.error('Error loading articles index', e);
        }
    }

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const baseUrl = SITE_CONFIG.siteUrl;

    return (
        <main className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* JSON-LD: Breadcrumb + CollectionPage/ItemList (crawlable freshness hub) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                            { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: baseUrl },
                            { '@type': 'ListItem', position: 2, name: 'أحدث المقالات', item: `${baseUrl}/articles` },
                        ],
                    }),
                }}
            />
            {rows.length > 0 && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'CollectionPage',
                            name: 'أحدث المقالات والأدلة',
                            url: `${baseUrl}/articles`,
                            mainEntity: {
                                '@type': 'ItemList',
                                numberOfItems: total,
                                itemListElement: rows.slice(0, 20).map((a, i) => ({
                                    '@type': 'ListItem',
                                    position: from + i + 1,
                                    url: `${baseUrl}/article/${a.slug || a.id}`,
                                    name: a.title,
                                })),
                            },
                        }),
                    }}
                />
            )}

            {/* ── Hero ── */}
            <header className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 dark:from-emerald-900 dark:via-emerald-800 dark:to-teal-900">
                <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-[0.15] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]"
                />
                <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-16 text-center">
                    <div className="inline-flex p-3 bg-white/15 rounded-2xl backdrop-blur-sm mb-4">
                        <Newspaper size={30} className="text-white" />
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black text-white mb-3">أحدث المقالات والأدلة</h1>
                    <p className="text-emerald-50/90 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                        كل أدلة دليل العرب في تركيا مرتّبة من الأحدث — الإقامة، العمل، التعليم، الصحة، الجنسية،
                        والخدمات الحكومية. نُحدّثها باستمرار من المصادر الرسمية.
                    </p>
                    {total > 0 && (
                        <div className="mt-5 inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-white text-sm font-bold tabular-nums">
                            <FileText size={14} />
                            {total} مقالاً منشوراً
                        </div>
                    )}
                </div>
            </header>

            {/* ── Grid ── */}
            <section className="max-w-6xl mx-auto w-full px-4 py-10">
                {rows.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                        <div className="text-4xl mb-3">📭</div>
                        <p className="text-slate-500 dark:text-slate-400 font-bold">لا توجد مقالات في هذه الصفحة</p>
                        <Link href="/articles" className="text-emerald-600 dark:text-emerald-400 text-sm font-bold mt-2 inline-block">
                            العودة لأحدث المقالات
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rows.map((a) => {
                            const slug = a.slug || a.id;
                            const img = a.image_url || a.image;
                            const hasImg = !!img && img.startsWith('http');
                            const fresh = isNew(a.created_at);
                            const summary = stripHtml(a.intro) || stripHtml(a.excerpt);
                            return (
                                <Link
                                    key={slug}
                                    href={`/article/${slug}`}
                                    className="group relative bg-gradient-to-br from-white to-slate-50/60 dark:from-slate-900 dark:to-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
                                >
                                    <div
                                        aria-hidden="true"
                                        className={`absolute top-0 inset-x-0 h-1 z-10 ${
                                            fresh
                                                ? 'bg-gradient-to-l from-emerald-400 via-teal-400 to-emerald-500'
                                                : 'bg-slate-200/70 dark:bg-slate-800/40'
                                        }`}
                                    />

                                    {hasImg && (
                                        <div className="relative w-full h-40 overflow-hidden">
                                            <Image
                                                src={img as string}
                                                alt={a.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
                                        </div>
                                    )}

                                    <div className="p-6 flex flex-col flex-grow relative">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-900 text-emerald-600 dark:text-emerald-300 group-hover:from-emerald-100 group-hover:to-teal-100 dark:group-hover:from-emerald-900/30 dark:group-hover:to-teal-900/20 group-hover:scale-105 group-hover:rotate-[-4deg] transition-all duration-300 shadow-sm">
                                                <FileText size={22} />
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                                {fresh && (
                                                    <span className="bg-gradient-to-l from-emerald-500 to-teal-500 text-white text-[10px] font-black tracking-wide uppercase px-2 py-0.5 rounded-full shadow-sm shadow-emerald-500/40">
                                                        جديد
                                                    </span>
                                                )}
                                                {a.category && (
                                                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
                                                        {a.category}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-50 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">
                                            {a.title}
                                        </h2>

                                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-6 flex-grow leading-relaxed">
                                            {summary}
                                        </p>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                                            {a.last_update && (
                                                <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1" title="آخر تحديث">
                                                    <Calendar size={11} />
                                                    {a.last_update}
                                                </span>
                                            )}
                                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 group-hover:gap-2.5 transition-all mr-auto">
                                                قراءة الدليل
                                                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                    <nav className="flex items-center justify-center gap-3 mt-10" aria-label="تصفّح الصفحات">
                        {page > 1 ? (
                            <Link
                                href={page - 1 === 1 ? '/articles' : `/articles?page=${page - 1}`}
                                rel="prev"
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                            >
                                <ArrowRight size={16} />
                                الأحدث
                            </Link>
                        ) : (
                            <span className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-400 font-bold text-sm cursor-default select-none">
                                <ArrowRight size={16} className="inline" /> الأحدث
                            </span>
                        )}

                        <span className="text-sm font-black text-slate-500 dark:text-slate-400 tabular-nums px-2">
                            {page} / {totalPages}
                        </span>

                        {page < totalPages ? (
                            <Link
                                href={`/articles?page=${page + 1}`}
                                rel="next"
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                            >
                                الأقدم
                                <ArrowLeft size={16} />
                            </Link>
                        ) : (
                            <span className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-400 font-bold text-sm cursor-default select-none">
                                الأقدم <ArrowLeft size={16} className="inline" />
                            </span>
                        )}
                    </nav>
                )}
            </section>
        </main>
    );
}
