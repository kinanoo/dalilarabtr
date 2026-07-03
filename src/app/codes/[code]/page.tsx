import { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import PageHero from '@/components/PageHero';
import { ShieldAlert, AlertTriangle, Info, CheckCircle, ArrowRight, Clock, Link2, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import ToolSchema from '@/components/ToolSchema';
import ShareMenu from '@/components/ShareMenu';
import AskOnWhatsApp from '@/components/AskOnWhatsApp';
import CodesLangToggle from '@/components/codes/CodesLangToggle';
import UniversalComments from '@/components/community/UniversalComments';
import { SITE_CONFIG, getOgImage } from '@/lib/config';
import RelatedArticles from '@/components/RelatedArticles';
import { normalizeLang, categoryLabel, severityLabel, pick, hasTurkish, UI, type Lang } from '@/lib/codesI18n';

export const revalidate = 3600; // Revalidate every hour

type Props = {
    params: Promise<{ code: string }>;
    searchParams: Promise<{ lang?: string }>;
};

// 1. Generate Metadata for SEO (bilingual + hreflang)
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const { code } = await params;
    const lang = normalizeLang((await searchParams).lang);
    const decodedCode = decodeURIComponent(code).toUpperCase();

    if (!supabase) return { title: `Code ${decodedCode}` };

    const { data: item } = await supabase
        .from('security_codes')
        .select('*')
        .eq('code', decodedCode)
        .single();

    // Throw in generateMetadata (pre-stream) → real HTTP 404. Returning
    // noindex metadata here let the loading.tsx stream commit a 200 first
    // (soft-404) — a top "Crawled – not indexed" cause in GSC.
    if (!item) notFound();

    const title = pick(item, 'title', lang);
    const desc = pick(item, 'description', lang);
    const enc = encodeURIComponent(item.code);

    const metaTitle = lang === 'tr'
        ? `${item.code} kodu ne demek? ${title} | Tahdit Kodları`
        : `معنى الكود ${item.code} - ${title} | دليل الأكواد الأمنية`;
    const metaDesc = lang === 'tr'
        ? (desc?.slice(0, 160) || `${item.code} tahdit kodunun anlamı, nedeni ve nasıl kaldırılacağı.`)
        : (desc?.slice(0, 160) || `تفاصيل ومعنى الكود الأمني ${item.code} وأسباب وضعه وكيفية إزالته.`);

    return {
        title: metaTitle,
        description: metaDesc,
        alternates: {
            canonical: lang === 'tr' ? `/codes/${enc}?lang=tr` : `/codes/${enc}`,
            languages: { ar: `/codes/${enc}`, tr: `/codes/${enc}?lang=tr` },
        },
        openGraph: {
            title: metaTitle,
            description: metaDesc?.slice(0, 200),
            images: [{ url: getOgImage(), width: 1200, height: 630, alt: metaTitle }],
            locale: lang === 'tr' ? 'tr_TR' : 'ar_AR',
        },
    };
}

// 2. The Page Component
export default async function CodeDetailPage({ params, searchParams }: Props) {
    const { code } = await params;
    const lang: Lang = normalizeLang((await searchParams).lang);
    const decodedCode = decodeURIComponent(code).toUpperCase();
    const ui = UI[lang];

    if (!supabase) return notFound();

    const { data: item } = await supabase
        .from('security_codes')
        .select('*')
        .eq('code', decodedCode)
        .single();

    if (!item) return notFound();

    // Fetch related codes' titles (bilingual) if available
    const relatedCodes: Array<{ code: string; title: string }> = [];
    if (item.related_codes && item.related_codes.length > 0) {
        // Normalize: remove dashes for DB lookup (DB stores "Ç101" not "Ç-101")
        const normalizedCodes = item.related_codes.map((c: string) => c.replace('-', ''));
        const { data: relatedData } = await supabase
            .from('security_codes')
            .select('*')
            .in('code', normalizedCodes);
        if (relatedData) {
            relatedCodes.push(...relatedData.map((rc) => ({ code: rc.code, title: pick(rc, 'title', lang) })));
        }
    }

    // Resolved, language-aware text
    const title = pick(item, 'title', lang);
    const description = pick(item, 'description', lang);
    const howToRemove = pick(item, 'how_to_remove', lang);
    const duration = pick(item, 'duration', lang);
    const catText = categoryLabel(item.category, lang);
    const sevText = severityLabel(item.severity, lang);
    const enc = encodeURIComponent(item.code);
    const showToggle = hasTurkish(item) || lang === 'tr';

    // Helpers
    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'critical': return 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950/30 dark:text-red-100';
            case 'high': return 'border-orange-500 bg-orange-50 text-orange-900 dark:bg-orange-950/30 dark:text-orange-100';
            case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-100';
            case 'safe': return 'border-green-500 bg-green-50 text-green-900 dark:bg-green-950/30 dark:text-green-100';
            default: return 'border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900';
        }
    };
    const getIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <ShieldAlert className="text-red-600" size={32} />;
            case 'high': return <AlertTriangle className="text-orange-600" size={32} />;
            case 'medium': return <Info className="text-yellow-600" size={32} />;
            default: return <CheckCircle className="text-green-600" size={32} />;
        }
    };

    const codeUrl = `${SITE_CONFIG.siteUrl}/codes/${enc}${lang === 'tr' ? '?lang=tr' : ''}`;

    // Structured data — DefinedTerm (glossary) + FAQ (rich result)
    const definedTerm = {
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        name: item.code,
        description: description,
        inDefinedTermSet: {
            '@type': 'DefinedTermSet',
            name: lang === 'tr' ? 'Türkiye Tahdit ve Güvenlik Kodları' : 'الأكواد الأمنية التركية',
            url: `${SITE_CONFIG.siteUrl}/codes`,
        },
    };
    const faq = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: lang === 'tr' ? `${item.code} kodu ne demek?` : `ما معنى الكود ${item.code}؟`,
                acceptedAnswer: { '@type': 'Answer', text: description },
            },
            ...(howToRemove ? [{
                '@type': 'Question',
                name: ui.howRemove,
                acceptedAnswer: { '@type': 'Answer', text: howToRemove },
            }] : []),
        ],
    };

    return (
        <main className="min-h-screen bg-white dark:bg-slate-950">
            <ToolSchema tool="security-codes" />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTerm) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />

            <PageHero
                title={lang === 'tr' ? `${item.code} kodu` : `الكود ${item.code}`}
                description={lang === 'tr' ? 'Tahdit kodunun anlamı ve kısıtlamalar' : 'تفاصيل الرمز الأمني والقيود المفروضة'}
                icon={<ShieldAlert className="w-10 h-10 md:w-12 md:h-12 text-red-500" />}
            />

            <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12" dir={ui.dir}>
                {/* Back + language toggle */}
                <div className="flex items-center justify-between gap-3 mb-6">
                    <Link href={lang === 'tr' ? '/codes?lang=tr' : '/codes'} className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold w-fit transition">
                        <ArrowRight size={20} className={lang === 'tr' ? 'rotate-180' : ''} />
                        {ui.back}
                    </Link>
                    {showToggle && (
                        <CodesLangToggle arHref={`/codes/${enc}`} trHref={`/codes/${enc}?lang=tr`} lang={lang} />
                    )}
                </div>

                {/* Main Code Card */}
                <div className={`rounded-3xl border-2 overflow-hidden shadow-xl ${getSeverityStyles(item.severity)}`}>
                    <div className="p-6 sm:p-10">
                        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                            <div className="p-4 bg-white/80 dark:bg-white/10 rounded-2xl shadow-sm backdrop-blur-sm">
                                {getIcon(item.severity)}
                            </div>
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className="inline-block px-3 py-1 rounded-full bg-slate-900/5 dark:bg-white/10 text-xs sm:text-sm font-bold">
                                        {catText}
                                    </span>
                                    <span className="inline-block px-3 py-1 rounded-full bg-slate-900/5 dark:bg-white/10 text-xs sm:text-sm font-bold">
                                        {sevText}
                                    </span>
                                    {duration && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs sm:text-sm font-bold">
                                            <Clock size={14} />
                                            {duration}
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-2xl sm:text-4xl font-black mb-4 leading-tight">
                                    {title}
                                </h1>
                                <div className="prose dark:prose-invert max-w-none">
                                    <p className="text-lg sm:text-xl leading-relaxed font-medium opacity-90">
                                        {description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Consultation CTA — same as articles: "for more details,
                    contact us on WhatsApp" straight to the site's number,
                    with the code prefilled so the admin knows the topic. */}
                <AskOnWhatsApp topic={`${item.code} — ${title}`} lang={lang} />

                {/* How to Remove Section */}
                {howToRemove && (
                    <div className="mt-6 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 overflow-hidden">
                        <div className="px-6 py-4 bg-emerald-100/50 dark:bg-emerald-900/30 border-b border-emerald-200 dark:border-emerald-800">
                            <h2 className="text-lg font-black text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                                <CheckCircle size={22} className="text-emerald-600" />
                                {ui.howRemove}
                            </h2>
                        </div>
                        <div className="p-6">
                            <p className="text-base leading-relaxed text-emerald-900 dark:text-emerald-100 font-medium whitespace-pre-line">
                                {howToRemove}
                            </p>
                        </div>
                    </div>
                )}

                {/* Related Codes Section */}
                {relatedCodes.length > 0 && (
                    <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
                        <div className="px-6 py-4 bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <Link2 size={20} className="text-slate-600 dark:text-slate-400" />
                                {ui.related}
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="flex flex-wrap gap-3">
                                {relatedCodes.map(rc => (
                                    <Link
                                        key={rc.code}
                                        href={`/codes/${encodeURIComponent(rc.code)}${lang === 'tr' ? '?lang=tr' : ''}`}
                                        className="group flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all"
                                    >
                                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                                            {rc.code}
                                        </span>
                                        <span className="text-slate-600 dark:text-slate-300 text-sm">
                                            {rc.title}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-8 flex justify-center mb-12">
                    <ShareMenu
                        title={lang === 'tr' ? `${item.code} kodu — ${title}` : `شرح الكود ${item.code} - ${title}`}
                        text={lang === 'tr' ? `${item.code} tahdit kodunun anlamı ve detayları.` : `تعرف على معنى الكود ${item.code} وتفاصيله القانونية.`}
                        url={codeUrl}
                    />
                </div>

                <div className="mt-8 flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <p>{ui.disclaimer}</p>
                </div>

                <div className="mt-8">
                    <UniversalComments entityType="scenario" entityId={`code-${item.code}`} />
                </div>

                <RelatedArticles currentArticleId="" category="معاملات رسمية" />
            </div>
        </main>
    );
}
