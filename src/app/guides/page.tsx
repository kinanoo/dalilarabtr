import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ListChecks, ArrowLeft } from 'lucide-react';
import { supabase, withTimeout } from '@/lib/supabaseClient';
import { getSupabaseImageUrl } from '@/lib/supabaseImage';
import { SITE_CONFIG, getOgImage } from '@/lib/config';
import logger from '@/lib/logger';

/**
 * /guides — every illustrated step-by-step guide, not just the newest six.
 *
 * Why this page exists: the homepage section shows the latest 6 and there was
 * nowhere to go from there. Of the 15 articles that qualify as guides, 9 were
 * reachable only by search or by stumbling on an internal link — written,
 * published, and then effectively hidden.
 *
 * Qualifying is the same test the homepage applies, deliberately duplicated
 * rather than loosened: the `دليل` tag AND 3 or more steps. `steps` alone is
 * not a marker (nearly every article has some, since it drives the HowTo
 * schema), and the 3-step floor is what the schema itself requires before it
 * is worth emitting.
 *
 * Server-rendered with no client JS: it is a list of links, and the homepage
 * section already carries the animated treatment.
 */

export const revalidate = 600;

const GUIDE_TAG = 'دليل';
const MIN_STEPS = 3;

type GuideRow = {
    id: string;
    slug: string | null;
    title: string;
    category: string | null;
    image: string | null;
    steps: string[] | null;
    intro: string | null;
    created_at: string | null;
};

async function getGuides(): Promise<GuideRow[]> {
    if (!supabase) return [];
    try {
        const res = await withTimeout(
            supabase
                .from('articles')
                .select('id, slug, title, category, image, steps, intro, created_at')
                .eq('status', 'approved')
                .contains('tags', [GUIDE_TAG])
                .order('created_at', { ascending: false })
                .limit(200),
            5000,
        );
        const rows = (res as { data?: GuideRow[] } | null)?.data || [];
        return rows.filter((a) => Array.isArray(a.steps) && a.steps.length >= MIN_STEPS);
    } catch (error) {
        logger.error('getGuides failed:', error);
        return [];
    }
}

const TITLE = 'شروحات مصوّرة خطوة بخطوة';
const DESCRIPTION =
    'كل الشروحات المصوّرة في دليل العرب والسوريين في تركيا: خطوات مرقّمة للمعاملات الرسمية — الكملك والإقامة، e-Devlet، القنصلية، التأمين الصحي، والتجنيس.';

export async function generateMetadata(): Promise<Metadata> {
    const url = `${SITE_CONFIG.siteUrl}/guides`;
    return {
        title: TITLE,
        description: DESCRIPTION,
        alternates: { canonical: url },
        openGraph: {
            title: TITLE,
            description: DESCRIPTION,
            url,
            type: 'website',
            images: [{ url: getOgImage(undefined, { title: TITLE }), width: 1200, height: 630, alt: TITLE }],
        },
    };
}

const stripHtml = (s?: string | null) =>
    (s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export default async function GuidesPage() {
    const guides = await getGuides();

    // ItemList rather than a bare CollectionPage: this is an ordered set of
    // named how-to documents, and naming each one is what lets it be
    // understood as an index of them.
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: TITLE,
        description: DESCRIPTION,
        url: `${SITE_CONFIG.siteUrl}/guides`,
        inLanguage: 'ar',
        mainEntity: {
            '@type': 'ItemList',
            numberOfItems: guides.length,
            itemListElement: guides.map((g, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: g.title,
                url: `${SITE_CONFIG.siteUrl}/article/${g.slug || g.id}`,
            })),
        },
    };

    // Grouped by category so a reader looking for one area does not have to
    // scan a flat chronological list. Order of the groups follows how many
    // guides each holds.
    const groups = new Map<string, GuideRow[]>();
    for (const g of guides) {
        const key = g.category || 'أدلة عملية';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(g);
    }
    const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

    return (
        <main className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-950" dir="rtl">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
                <nav aria-label="مسار التنقل" className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-4">
                    <Link href="/" className="hover:text-emerald-600">الرئيسية</Link>
                    <span className="mx-1.5">/</span>
                    <span className="text-slate-700 dark:text-slate-200">الشروحات المصوّرة</span>
                </nav>

                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-50 leading-tight tracking-tight">
                    شروحات مصوّرة{' '}
                    <span className="bg-gradient-to-l from-emerald-500 to-teal-500 bg-clip-text text-transparent">خطوة بخطوة</span>
                </h1>
                <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                    كل معاملة مشروحة بخطوات مرقّمة: ما تحتاجه قبل أن تبدأ، وما تفعله في كل مرحلة.
                </p>
                <p className="mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {guides.length} شرحاً متاحاً
                </p>

                {guides.length === 0 ? (
                    <p className="mt-10 text-sm text-slate-500">لا توجد شروحات منشورة بعد.</p>
                ) : (
                    <div className="mt-8 space-y-10">
                        {ordered.map(([category, items]) => (
                            <section key={category}>
                                <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                                    {category}
                                    <span className="text-[11px] font-bold text-slate-400 tabular-nums">({items.length})</span>
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    {items.map((g) => (
                                        <Link
                                            key={g.id}
                                            href={`/article/${g.slug || g.id}`}
                                            className="group relative flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 overflow-hidden shadow-sm transition-all duration-200 hover:-translate-y-[3px] hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-[0_10px_26px_-12px_rgba(16,150,100,0.3)]"
                                        >
                                            <span className="relative w-[88px] h-[88px] shrink-0 rounded-xl overflow-hidden">
                                                {g.image ? (
                                                    <Image
                                                        src={getSupabaseImageUrl(g.image, { width: 176, height: 176, quality: 72, resize: 'cover' })}
                                                        alt={g.title}
                                                        fill
                                                        sizes="88px"
                                                        className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.07]"
                                                    />
                                                ) : (
                                                    <span className="absolute inset-0 grid place-items-center bg-emerald-600/10 dark:bg-emerald-400/[0.13] text-emerald-700 dark:text-teal-300">
                                                        <ListChecks size={30} />
                                                    </span>
                                                )}
                                                <span className="absolute top-1 right-1 z-10 bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                                                    {g.steps!.length} خطوات
                                                </span>
                                            </span>

                                            <span className="flex-1 min-w-0">
                                                <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-slate-50 leading-relaxed line-clamp-2 transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                                                    {g.title}
                                                </h3>
                                                <span className="mt-1 block text-[12px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                    {stripHtml(g.intro).slice(0, 110)}
                                                </span>
                                                <span className="mt-1.5 inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                                    اقرأ الشرح
                                                    <ArrowLeft size={13} className="transition-transform duration-200 group-hover:-translate-x-1" />
                                                </span>
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
