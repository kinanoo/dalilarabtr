import { Metadata } from 'next';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock, ChevronLeft, Newspaper, AlertTriangle, ExternalLink } from 'lucide-react';
import UniversalComments from '@/components/community/UniversalComments';
import AskOnWhatsApp from '@/components/AskOnWhatsApp';
import ShareMenu from '@/components/ShareMenu';
import HtmlContent from '@/components/ui/HtmlContent';
import { stripHtml } from '@/lib/stripHtml';
import { SITE_CONFIG, getOgImage } from '@/lib/config';
import { SchemaScript, generateBreadcrumbSchema, toISODate } from '@/lib/schemaOrg';

export const revalidate = 60;

// Arabic labels for updates.category (missing/unknown → no chip)
const CATEGORY_LABELS: Record<string, string> = {
    official: 'قرارات رسمية',
    residence: 'إقامات وجنسية',
    work: 'عمل واقتصاد',
    education: 'تعليم',
    health: 'صحة',
    security: 'أمن وتنبيهات',
    general: 'عام',
};

// Arabic month names with LATIN digits (house rule: no Arabic-Indic numerals)
const AR_MONTHS = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

function formatDateLatin(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return `${date.getDate()} ${AR_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

async function getSupabase() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );
}

export async function generateMetadata(
    props: { params: Promise<{ id: string }> }
): Promise<Metadata> {
    const { id } = await props.params;
    const supabase = await getSupabase();

    // select('*') so optional columns (summary, category, ...) are tolerated
    // whether or not the migration adding them has run.
    const { data } = await supabase
        .from('updates')
        .select('*')
        .eq('id', id)
        .eq('active', true)
        .single();

    // Pre-stream notFound() → real HTTP 404 (see codes/[code] note).
    if (!data) notFound();

    return {
        title: data.title,
        description: data.summary || stripHtml(data.content).substring(0, 160) || data.title,
        alternates: { canonical: `/updates/${id}` },
        openGraph: {
            title: data.title,
            description: stripHtml(data.content).substring(0, 200),
            images: [{ url: getOgImage(undefined, { title: data.title, category: 'أخبار وتحديثات' }), width: 1200, height: 630, alt: data.title }],
        },
    };
}

function getRelativeDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    if (diffDays === 2) return 'قبل يومين';
    if (diffDays <= 7) return `قبل ${diffDays} أيام`;
    return formatDateLatin(dateStr);
}

function estimateReadTime(content: string): number {
    const text = stripHtml(content);
    const words = text.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
}

export default async function UpdateDetailPage(
    props: { params: Promise<{ id: string }> }
) {
    const { id } = await props.params;
    const supabase = await getSupabase();

    const { data: update, error } = await supabase
        .from('updates')
        .select('*')
        .eq('id', id)
        .eq('active', true)
        .single();

    if (error || !update) {
        notFound();
    }

    // Fetch related updates
    const { data: relatedUpdates } = await supabase
        .from('updates')
        .select('id, title, type, date, image')
        .eq('active', true)
        .neq('id', id)
        .order('date', { ascending: false })
        .limit(4);

    const isAlert = update.type === 'alert';
    const typeLabel = update.type === 'news' ? 'خبر' : isAlert ? 'تنبيه هام' : 'تحديث';
    const readTime = update.content ? estimateReadTime(update.content) : 0;
    const plainContent = update.content ? stripHtml(update.content) : '';

    // ── Structured data (SEO) ──────────────────────────────────────────────
    const updateUrl = `${SITE_CONFIG.siteUrl}/updates/${id}`;
    const publishedISO = toISODate(update.created_at || update.date || '');
    const modifiedISO = toISODate(update.date || update.created_at || '');
    const description = update.summary || plainContent.substring(0, 200) || update.title;
    const imageUrl = update.image
        ? (update.image.startsWith('http') ? update.image : `${SITE_CONFIG.siteUrl}${update.image}`)
        : getOgImage(undefined, { title: update.title, category: 'أخبار وتحديثات' });

    const articleSchema = {
        '@context': 'https://schema.org',
        '@type': update.type === 'news' ? 'NewsArticle' : 'Article',
        headline: update.title,
        description,
        datePublished: publishedISO,
        dateModified: modifiedISO,
        image: {
            '@type': 'ImageObject',
            url: imageUrl,
        },
        author: {
            '@type': 'Organization',
            name: SITE_CONFIG.name,
            url: SITE_CONFIG.siteUrl,
        },
        publisher: {
            '@type': 'Organization',
            name: SITE_CONFIG.name,
            logo: {
                '@type': 'ImageObject',
                url: `${SITE_CONFIG.siteUrl}/logo.png`,
            },
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': updateUrl,
        },
        inLanguage: 'ar',
    };

    const breadcrumbSchema = generateBreadcrumbSchema([
        { name: 'الرئيسية', url: '/' },
        { name: 'التحديثات', url: '/updates' },
        { name: update.title, url: `/updates/${id}` },
    ]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo pb-20" dir="rtl">
            <SchemaScript schema={[articleSchema, breadcrumbSchema]} />
            {/* Header */}
            <div className={`text-white pt-6 pb-20 relative overflow-hidden ${
                isAlert
                    ? 'bg-gradient-to-bl from-red-900 via-red-800 to-slate-900'
                    : 'bg-gradient-to-bl from-slate-800 via-slate-900 to-emerald-950'
            }`}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
                <div className="container mx-auto px-4 relative z-10 max-w-4xl">
                    <Link
                        href="/updates"
                        className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4 text-sm"
                    >
                        <ArrowRight size={16} />
                        العودة للتحديثات
                    </Link>

                    {/* Type + Date + Share row */}
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg ${
                            isAlert
                                ? 'bg-red-500/20 text-red-200 border border-red-500/30'
                                : 'bg-white/10 text-white/90 border border-white/10'
                        }`}>
                            {isAlert ? <AlertTriangle size={12} /> : <Newspaper size={12} />}
                            {typeLabel}
                        </span>
                        {update.category && CATEGORY_LABELS[update.category] && (
                            <span className="inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-200 border border-emerald-400/20">
                                {CATEGORY_LABELS[update.category]}
                            </span>
                        )}
                        {update.date && (
                            <span className="text-white/60 text-xs flex items-center gap-1.5">
                                <Calendar size={12} />
                                {formatDateLatin(update.date)}
                                <span className="text-white/40 mx-1">·</span>
                                {getRelativeDate(update.date)}
                            </span>
                        )}
                        {readTime > 0 && (
                            <span className="text-white/50 text-xs flex items-center gap-1">
                                <Clock size={11} />
                                {readTime} دقيقة قراءة
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-[1.5]">
                        {update.title}
                    </h1>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 relative z-20 -mt-10 max-w-4xl">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">

                    {/* Main content */}
                    <div className="space-y-5">
                        {/* Article card */}
                        <article className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden relative">
                            {/* Share button — top left corner */}
                            <div className="absolute top-4 left-4 z-10">
                                <ShareMenu
                                    mini
                                    variant="subtle"
                                    title={update.title}
                                    text={plainContent.slice(0, 200)}
                                    url={`${SITE_CONFIG.siteUrl}/updates/${id}`}
                                />
                            </div>

                            {/* Image */}
                            {update.image && (
                                <div className="relative w-full h-48 sm:h-64 md:h-72">
                                    <Image
                                        src={update.image}
                                        alt={update.title || 'صورة التحديث'}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 768px"
                                        priority
                                    />
                                </div>
                            )}

                            <div className="p-5 sm:p-8">
                                {/* Official source — clearly labeled outbound link */}
                                {update.source_url && (
                                    <div className="mb-6">
                                        <a
                                            href={update.source_url}
                                            target="_blank"
                                            rel="nofollow noopener"
                                            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-4 py-2.5 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-colors"
                                        >
                                            <ExternalLink size={14} />
                                            المصدر الرسمي{update.source_name ? `: ${update.source_name}` : ''}
                                        </a>
                                    </div>
                                )}

                                {/* Main content */}
                                {update.content && (
                                    <div className="prose-update">
                                        <HtmlContent
                                            html={update.content}
                                            className="text-slate-700 dark:text-slate-300 text-base sm:text-lg leading-[1.9]"
                                        />
                                    </div>
                                )}

                                {/* Link button if exists */}
                                {update.link && (
                                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <Link
                                            href={update.link}
                                            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors"
                                        >
                                            اقرأ المزيد
                                            <ChevronLeft size={16} />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </article>

                        {/* "Didn't understand? message us on WhatsApp" */}
                        <AskOnWhatsApp topic={update.title} />

                        {/* Comments */}
                        <UniversalComments entityType="update" entityId={id} />
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-5">
                        {/* Related Updates */}
                        {relatedUpdates && relatedUpdates.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-1.5">
                                    <Newspaper size={14} className="text-amber-600" />
                                    تحديثات أخرى
                                </h3>
                                <div className="space-y-3">
                                    {relatedUpdates.map((item) => (
                                        <Link
                                            key={item.id}
                                            href={`/updates/${item.id}`}
                                            className="block group"
                                        >
                                            <div className="flex items-start gap-3">
                                                {item.image ? (
                                                    <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                                                        <Image
                                                            src={item.image}
                                                            alt={item.title || "تحديث ذو صلة"}
                                                            fill
                                                            className="object-cover"
                                                            sizes="48px"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className={`w-12 h-12 flex-shrink-0 rounded-lg flex items-center justify-center ${
                                                        item.type === 'alert'
                                                            ? 'bg-red-50 dark:bg-red-900/20'
                                                            : 'bg-amber-50 dark:bg-amber-900/20'
                                                    }`}>
                                                        {item.type === 'alert'
                                                            ? <AlertTriangle size={18} className="text-red-500" />
                                                            : <Newspaper size={18} className="text-amber-500" />
                                                        }
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-snug">
                                                        {item.title}
                                                    </h4>
                                                    <span className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {getRelativeDate(item.date)}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                <Link
                                    href="/updates"
                                    className="block text-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                                >
                                    عرض كل التحديثات ←
                                </Link>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
}
