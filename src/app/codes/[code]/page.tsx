import { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import PageHero from '@/components/PageHero';
import { ShieldAlert, AlertTriangle, Info, CheckCircle, ArrowRight, Clock, Link2 } from 'lucide-react';
import Link from 'next/link';
import ToolSchema from '@/components/ToolSchema';
import ShareMenu from '@/components/ShareMenu';
import UniversalComments from '@/components/community/UniversalComments';
import { SITE_CONFIG } from '@/lib/config';

import RelatedArticles from '@/components/RelatedArticles';

export const revalidate = 3600; // Revalidate every hour

type Props = {
    params: Promise<{ code: string }>;
};

// 1. Generate Metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { code } = await params;
    const decodedCode = decodeURIComponent(code).toUpperCase();

    if (!supabase) return { title: `Code ${decodedCode}` };

    const { data: item } = await supabase
        .from('security_codes')
        .select('code, title, description')
        .eq('code', decodedCode)
        .single();

    if (!item) return { title: 'الكود غير موجود' };

    const ogTitle = `شرح الكود ${item.code} - ${item.title}`;
    return {
        title: `معنى الكود ${item.code} - ${item.title} | دليل الأكواد الأمنية`,
        description: item.description?.slice(0, 160) || `تفاصيل ومعنى الكود الأمني ${item.code} وأسباب وضعه وكيفية إزالته.`,
        alternates: { canonical: `/codes/${encodeURIComponent(item.code)}` },
        openGraph: {
            title: ogTitle,
            description: item.description?.slice(0, 200),
            images: [{
                url: `${SITE_CONFIG.siteUrl}/api/og?${new URLSearchParams({ title: ogTitle, category: 'أكواد أمنية' })}`,
                width: 1200, height: 630, alt: ogTitle,
            }],
        },
    };
}

// 2. The Page Component
export default async function CodeDetailPage({ params }: Props) {
    const { code } = await params;
    const decodedCode = decodeURIComponent(code).toUpperCase();

    if (!supabase) return notFound();

    const { data: item } = await supabase
        .from('security_codes')
        .select('code, category, title, description, severity, solution, effect, how_to_remove, duration, related_codes')
        .eq('code', decodedCode)
        .single();

    if (!item) return notFound();

    // Fetch related codes titles if available
    const relatedCodes: Array<{ code: string; title: string }> = [];
    if (item.related_codes && item.related_codes.length > 0) {
        // Normalize: remove dashes for DB lookup (DB stores "Ç101" not "Ç-101")
        const normalizedCodes = item.related_codes.map((c: string) => c.replace('-', ''));
        const { data: relatedData } = await supabase
            .from('security_codes')
            .select('code, title')
            .in('code', normalizedCodes);
        if (relatedData) {
            relatedCodes.push(...relatedData);
        }
    }

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

    return (
        <main className="min-h-screen bg-white dark:bg-slate-950">
            <ToolSchema tool="security-codes" />

            <PageHero
                title={`الكود ${item.code}`}
                description="تفاصيل الرمز الأمني والقيود المفروضة"
                icon={<ShieldAlert className="w-10 h-10 md:w-12 md:h-12 text-red-500" />}
            />

            <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
                <Link href="/codes" className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 mb-6 font-bold w-fit transition">
                    <ArrowRight size={20} />
                    عودة لكافة الأكواد
                </Link>

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
                                        {item.category}
                                    </span>
                                    {item.duration && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs sm:text-sm font-bold">
                                            <Clock size={14} />
                                            {item.duration}
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-2xl sm:text-4xl font-black mb-4 leading-tight">
                                    {item.title}
                                </h1>
                                <div className="prose dark:prose-invert max-w-none">
                                    <p className="text-lg sm:text-xl leading-relaxed font-medium opacity-90">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* How to Remove Section */}
                {item.how_to_remove && (
                    <div className="mt-6 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 overflow-hidden">
                        <div className="px-6 py-4 bg-emerald-100/50 dark:bg-emerald-900/30 border-b border-emerald-200 dark:border-emerald-800">
                            <h2 className="text-lg font-black text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                                <CheckCircle size={22} className="text-emerald-600" />
                                كيف ترفع هذا الكود؟
                            </h2>
                        </div>
                        <div className="p-6">
                            <p className="text-base leading-relaxed text-emerald-900 dark:text-emerald-100 font-medium whitespace-pre-line">
                                {item.how_to_remove}
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
                                أكواد مرتبطة
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="flex flex-wrap gap-3">
                                {relatedCodes.map(rc => (
                                    <Link
                                        key={rc.code}
                                        href={`/codes/${encodeURIComponent(rc.code)}`}
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
                        title={`شرح الكود ${item.code} - ${item.title}`}
                        text={`تعرف على معنى الكود ${item.code} وتفاصيله القانونية.`}
                        url={`${SITE_CONFIG.siteUrl}/codes/${encodeURIComponent(item.code)}`}
                    />
                </div>

                <div className="mt-8">
                    <UniversalComments entityType="scenario" entityId={`code-${item.code}`} />
                </div>

                <RelatedArticles currentArticleId="" category="معاملات رسمية" />
            </div>
        </main>
    );
}
