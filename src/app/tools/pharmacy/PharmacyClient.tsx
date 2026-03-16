'use client';

import { HeartPulse, ExternalLink, ShieldCheck, MapPin, ArrowRight, Phone, Info, Clock, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import ShareMenu from '@/components/ShareMenu';
import { SITE_CONFIG } from '@/lib/config';

export default function PharmacyPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo flex flex-col">

            {/* Hero Section - Compact & Action-oriented */}
            <section className="relative bg-gradient-to-bl from-red-900 via-red-950 to-slate-900 text-white pt-16 pb-12 px-4 overflow-hidden rounded-b-[40px] shadow-lg">
                <div className="max-w-3xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center justify-center p-2.5 bg-white/10 backdrop-blur-sm rounded-2xl mb-3">
                        <HeartPulse className="w-7 h-7 text-red-400" />
                    </div>
                    <h1 className="text-2xl md:text-4xl font-extrabold mb-2">
                        الصيدلية المناوبة الآن
                    </h1>
                    <p className="text-sm md:text-base text-slate-300 max-w-lg mx-auto">
                        اعرف أقرب صيدلية مفتوحة في منطقتك — رابط رسمي مباشر من e-Devlet
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                            <Clock size={12} />
                            محدّث لحظياً
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            81 ولاية تركية
                        </span>
                    </div>
                </div>
            </section>

            <main className="flex-grow pt-10 pb-16 px-4 -mt-10 relative z-20">
                <div className="container mx-auto max-w-2xl">

                    {/* Main Action Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center relative overflow-hidden group">

                        {/* Background Decoration */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-red-600 to-red-500" />
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 relative z-10">
                            اضغط أدناه للبحث عن الصيدلية المناوبة في منطقتك
                        </h2>

                        <a
                            href="https://www.turkiye.gov.tr/saglik-titck-nobetci-eczane-sorgulama"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative z-10 inline-flex items-center justify-center gap-3 w-full py-5 px-6 bg-red-600 hover:bg-red-700 text-white text-xl font-bold rounded-2xl shadow-lg shadow-red-600/30 hover:scale-[1.02] hover:shadow-xl hover:shadow-red-600/40 transition-all duration-300"
                        >
                            <span>الانتقال لبحث e-Devlet الرسمي</span>
                            <ExternalLink className="w-6 h-6" />
                        </a>

                        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-slate-500 dark:text-slate-400 relative z-10">
                            <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                مصدر حكومي موثوق 100%
                            </span>
                            <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                <MapPin className="w-4 h-4 text-blue-500" />
                                يغطي كل الولايات
                            </span>
                        </div>
                    </div>

                    {/* How to use */}
                    <div className="mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <Info size={18} className="text-blue-500" />
                            كيف تستخدم الخدمة؟
                        </h3>
                        <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300 list-decimal list-inside">
                            <li>اضغط الزر أعلاه للانتقال لبوابة e-Devlet</li>
                            <li>اختر الولاية (İl) ثم المنطقة (İlçe)</li>
                            <li>ستظهر قائمة الصيدليات المناوبة مع العناوين وأرقام الهاتف</li>
                        </ol>
                    </div>

                    {/* Emergency Numbers */}
                    <div className="mt-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <Phone size={18} className="text-red-500" />
                            أرقام الطوارئ في تركيا
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { number: '112', label: 'الطوارئ العامة (Acil)' },
                                { number: '155', label: 'الشرطة (Polis)' },
                                { number: '110', label: 'الإطفاء (İtfaiye)' },
                                { number: '182', label: 'خط الأدوية والتسمم' },
                            ].map(item => (
                                <a
                                    key={item.number}
                                    href={`tel:${item.number}`}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-red-50 dark:hover:bg-red-950/20 border border-slate-100 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                                >
                                    <span className="text-lg font-black text-red-600 dark:text-red-400 font-mono">{item.number}</span>
                                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-tight">{item.label}</span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* FAQ Section — visible for SEO */}
                    <div className="mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <span className="text-lg">❓</span>
                            أسئلة شائعة عن الصيدليات المناوبة
                        </h3>
                        <div className="space-y-3">
                            <PharmacyFaq
                                question="كيف أعرف الصيدلية المناوبة في موقعي الآن؟"
                                answer="اضغط على رابط e-Devlet الرسمي أعلاه، ثم اختر الولاية (İl) والمنطقة (İlçe) وستظهر لك قائمة الصيدليات المناوبة المفتوحة حالياً مع العناوين وأرقام الهاتف."
                            />
                            <PharmacyFaq
                                question="ما هي ساعات عمل الصيدلية المناوبة؟"
                                answer="الصيدلية المناوبة (Nöbetçi Eczane) تعمل على مدار الساعة 24/7 خلال فترة مناوبتها. يتم تغيير المناوبة يومياً."
                            />
                            <PharmacyFaq
                                question="هل أحتاج حساب e-Devlet لمعرفة الصيدلية المناوبة؟"
                                answer="لا، خدمة البحث عن الصيدليات المناوبة متاحة للجميع بدون تسجيل دخول. فقط اضغط الرابط واختر منطقتك."
                            />
                            <PharmacyFaq
                                question="هل الخدمة تغطي كل مدن تركيا؟"
                                answer="نعم، الخدمة مرتبطة ببوابة الحكومة الإلكترونية e-Devlet وتغطي كافة الولايات التركية الـ 81 بما فيها إسطنبول، أنقرة، غازي عنتاب، مرسين، أنطاليا وغيرها."
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-center">
                        <ShareMenu
                            title="الصيدليات المناوبة في تركيا"
                            text="رابط مباشر لمعرفة الصيدلية المناوبة في منطقتك عبر بوابة e-Devlet الرسمية."
                            url={`${SITE_CONFIG.siteUrl}/tools/pharmacy`}
                            variant="subtle"
                        />
                    </div>

                    <div className="mt-4 text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors py-2 px-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <span>العودة للرئيسية</span>
                            <ArrowRight className="w-4 h-4 rotate-180" />
                        </Link>
                    </div>

                </div>
            </main>
</div>
    );
}

/** FAQ accordion item */
function PharmacyFaq({ question, answer }: { question: string; answer: string }) {
    return (
        <details className="group border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors list-none [&::-webkit-details-marker]:hidden">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 text-right">{question}</h4>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                {answer}
            </div>
        </details>
    );
}
