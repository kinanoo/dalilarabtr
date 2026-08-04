import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getSiteSettings } from '@/lib/siteSettings';
import { matchServiceCategory } from '@/lib/articleServiceMatch';
import { BadgeCheck, ArrowLeft, Users } from 'lucide-react';
import logger from '@/lib/logger';

/**
 * The bridge from an article to the services the reader needs next.
 *
 * Before this, the 357 articles that carry the site's entire search traffic
 * contained zero links to the 431-provider directory or the /request funnel.
 * Every Google visit ended at the bottom of the page.
 *
 * Rules this block holds itself to:
 *  - Never invent a provider. It renders counts and links only, from the live
 *    approved rows; if a category has none, it says so and offers the request
 *    route instead of a directory page the reader would find empty.
 *  - Never guess the profession. articleServiceMatch returns null when it has
 *    no confident signal — sending a reader who lost their kimlik to a dentist
 *    would burn the trust the article just earned. On null this renders the
 *    honest generic block.
 *  - Server-rendered. The point is crawlable internal links into the directory,
 *    which a client-side widget would not give.
 *
 * Uses the anon client, never cookies(), so the article page stays statically
 * renderable and this read is amortised by its ISR window.
 */

type Props = {
    slug: string;
    category?: string | null;
    tags?: string[] | null;
};

async function countProviders(categoryName: string): Promise<number> {
    if (!supabase) return 0;
    try {
        const { count, error } = await supabase
            .from('service_providers')
            .select('id', { count: 'exact', head: true })
            .eq('category', categoryName)
            .eq('status', 'approved');
        if (error) {
            logger.error('provider count failed:', error);
            return 0;
        }
        return count ?? 0;
    } catch (e) {
        logger.error('provider count threw:', e);
        return 0;
    }
}

export default async function ArticleServiceCTA({ slug, category, tags }: Props) {
    const { contactEnabled } = await getSiteSettings();
    const match = matchServiceCategory({ slug, category, tags });
    const count = match ? await countProviders(match.name) : 0;
    const hasProviders = count > 0;

    // Contact off: the generic variant exists only to push /request, which is
    // closed — so it renders nothing at all. A matched profession still shows,
    // because that block sends the reader to independent providers in the
    // directory, not to the owner.
    if (!contactEnabled && !hasProviders) return null;

    const heading = match && hasProviders
        ? `تحتاج ${match.labelAr}؟`
        : 'تحتاج مساعدة في هذه المعاملة؟';

    const body = match && hasProviders
        ? `${match.reason} — في دليلنا ${count} مسجَّلاً في هذا القسم، ويمكنك التصفية حسب مدينتك.`
        : contactEnabled
            ? 'اطلب توجيهاً لحالتك، أو تصفّح دليل مقدّمي الخدمات الناطقين بالعربية حسب مدينتك.'
            : 'تصفّح دليل مقدّمي الخدمات الناطقين بالعربية حسب مدينتك.';

    return (
        <aside
            className="not-prose my-8 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/70 to-white dark:from-emerald-950/20 dark:to-slate-900 p-5"
            aria-labelledby="article-service-cta"
        >
            <h2 id="article-service-cta" className="text-base font-black text-slate-900 dark:text-slate-50 mb-1.5">
                {heading}
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 mb-4">{body}</p>

            <div className="flex flex-wrap gap-2">
                {match && hasProviders && (
                    <Link
                        href={`/services/category/${match.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
                    >
                        <Users size={15} />
                        {match.labelAr} في الدليل
                        <ArrowLeft size={14} />
                    </Link>
                )}

                {contactEnabled && (
                <Link
                    href={`/request?from=${encodeURIComponent(slug)}`}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                        match && hasProviders
                            ? 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-400'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                >
                    اطلب توجيهاً لحالتك
                    <ArrowLeft size={14} />
                </Link>
                )}

                <Link
                    href="/services"
                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                >
                    كل الأقسام
                </Link>
            </div>

            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <BadgeCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                الدليل مجاني، والتسجيل فيه لا يعني توصيةً منّا — تحقّق دائماً قبل الدفع.
            </p>
        </aside>
    );
}
