import { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import PageHero from '@/components/PageHero';
import { ShieldAlert, AlertTriangle, Info, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import ToolSchema from '@/components/ToolSchema';
import ShareMenu from '@/components/ShareMenu';
import UniversalComments from '@/components/community/UniversalComments';
import ContentHelpfulWidget from '@/components/community/ContentHelpfulWidget';

export const revalidate = 3600; // Revalidate every hour

type Props = {
    params: Promise<{ code: string }>;
};

// 1. Generate Metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { code } = await params;
    const decodedCode = decodeURIComponent(code);

    if (!supabase) return { title: `Code ${decodedCode}` };

    const { data: item } = await supabase
        .from('security_codes')
        .select('*')
        .eq('code', decodedCode)
        .single();

    if (!item) return { title: 'الكود غير موجود' };

    return {
        title: `معنى الكود ${item.code} - ${item.title} | دليل الأكواد الأمنية`,
        description: item.description?.slice(0, 160) || `تفاصيل ومعنى الكود الأمني ${item.code} وأسباب وضعه وكيفية إزالته.`,
        openGraph: {
            title: `ما هو الكود ${item.code}؟ (${item.title})`,
            description: item.description?.slice(0, 200),
        }
    };
}

// 2. The Page Component
export default async function CodeDetailPage({ params }: Props) {
    const { code } = await params;
    const decodedCode = decodeURIComponent(code);

    if (!supabase) return notFound();

    const { data: item } = await supabase
        .from('security_codes')
        .select('*')
        .eq('code', decodedCode)
        .single();

    if (!item) return notFound();

    // Helpers (Duplicated from CodesPage for simplicity, ideally shared util)
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
            <ToolSchema tool="security-codes" /> {/* Maybe optimize schema for specific item */}

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

                <div className={`rounded-3xl border-2 overflow-hidden shadow-xl ${getSeverityStyles(item.severity)}`}>
                    <div className="p-6 sm:p-10">
                        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                            <div className="p-4 bg-white/80 dark:bg-white/10 rounded-2xl shadow-sm backdrop-blur-sm">
                                {getIcon(item.severity)}
                            </div>
                            <div className="flex-1">
                                <span className="inline-block px-3 py-1 rounded-full bg-slate-900/5 dark:bg-white/10 text-xs sm:text-sm font-bold mb-2">
                                    {item.category}
                                </span>
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

                <div className="mt-8 flex justify-center mb-12">
                    <ShareMenu title={`شرح الكود ${item.code} - ${item.title}`} text={`تعرف على معنى الكود ${item.code} وتفاصيله القانونية.`} />
                </div>

                <ContentHelpfulWidget entityType="scenario" entityId={`code-${item.code}`} />

                <div className="mt-8">
                    <UniversalComments entityType="scenario" entityId={`code-${item.code}`} title="ناقش هذا الكود" />
                </div>
            </div>
        </main>
    );
}
