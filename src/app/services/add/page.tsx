import type { Metadata } from 'next';
import { Search, MessageCircle, BadgeCheck, Zap } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/config';
import AddServiceForm from './AddServiceForm';

export const metadata: Metadata = {
    title: { absolute: 'أضف خدمتك مجاناً إلى دليل العرب في تركيا | سجّل نشاطك' },
    description: 'سجّل مهنتك أو نشاطك التجاري مجاناً في دليل العرب — بدون حساب وبدون رسوم. اظهر في بحث جوجل ويصلك العملاء العرب في تركيا عبر واتساب مباشرة.',
    keywords: ['أضف خدمتك تركيا', 'سجل نشاطك التجاري تركيا', 'إعلان مجاني تركيا', 'دليل الأعمال العربية تركيا', 'iş ilanı ekle'],
    alternates: { canonical: '/services/add' },
    openGraph: {
        title: 'أضف خدمتك مجاناً إلى دليل العرب في تركيا',
        description: 'سجّل نشاطك مجاناً بدون حساب — اظهر في جوجل ويصلك العملاء عبر واتساب.',
        url: `${SITE_CONFIG.siteUrl}/services/add`,
        type: 'website',
        images: ['/og-banner.jpg'],
    },
};

const VALUE = [
    { icon: BadgeCheck, title: 'مجّاني بالكامل', desc: 'بلا رسوم ولا عمولة، الآن ومستقبلاً.' },
    { icon: Zap, title: 'بدون إنشاء حساب', desc: 'املأ نموذجاً واحداً وانتهى الأمر.' },
    { icon: Search, title: 'تظهر في جوجل', desc: 'يجدك الباحثون عن خدمتك في مدينتك.' },
    { icon: MessageCircle, title: 'تواصل واتساب مباشر', desc: 'العملاء يراسلونك على رقمك مباشرة.' },
];

export default function AddServicePage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo" dir="rtl">
            {/* Hero */}
            <section className="relative overflow-hidden border-b border-slate-200 bg-white pb-10 pt-8 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                <div aria-hidden="true" className="absolute inset-x-0 top-0 z-20 h-1 bg-emerald-600" />
                <div className="container mx-auto px-4 relative z-10 max-w-3xl text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-black tracking-wider uppercase mb-3">
                        للمهنيّين وأصحاب الحرف والمشاريع
                    </span>
                    <h1 className="text-3xl md:text-4xl font-black mb-3 leading-tight">
                        أضف خدمتك إلى <span className="text-emerald-700 dark:text-emerald-400">دليل العرب</span> مجاناً
                    </h1>
                    <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
                        سجّل نشاطك في دقيقة — بدون حساب وبدون رسوم — ووصلك آلاف العملاء العرب في تركيا.
                    </p>
                </div>
            </section>

            <div className="max-w-2xl mx-auto px-4 -mt-4 relative z-10">
                {/* Value grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                    {VALUE.map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center shadow-sm">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mb-2">
                                <Icon size={19} />
                            </span>
                            <h2 className="text-[13px] font-black text-slate-800 dark:text-slate-100 leading-tight">{title}</h2>
                            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 leading-tight mt-0.5">{desc}</p>
                        </div>
                    ))}
                </div>

                <AddServiceForm />
            </div>

            <div className="h-12" />
        </div>
    );
}
