'use client';

import { HeartPulse, ExternalLink, ShieldCheck, MapPin, ArrowLeft, Phone, Info, Clock, ChevronDown, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import ShareMenu from '@/components/ShareMenu';
import { SITE_CONFIG } from '@/lib/config';
import CrossLinks from '@/components/seo/CrossLinks';

/*
 * 2026-07 redesign — brought in line with the site's new design language:
 * shared light PageHero instead of the hand-rolled dark red hero, flat
 * white/slate cards with a thin start-side accent rail (logical utilities),
 * solid emerald-600 primary action, and zero instructional filler.
 */

export default function PharmacyPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo flex flex-col">

            <PageHero
                title="الصيدلية المناوبة الآن"
                description="اعرف أقرب صيدلية مفتوحة في منطقتك — رابط رسمي مباشر من e-Devlet"
                icon={<HeartPulse className="w-10 h-10 md:w-12 md:h-12 text-red-500" />}
            />

            <main className="flex-grow py-10 px-4">
                <div className="container mx-auto max-w-2xl">

                    {/* Main action card — flat, thin accent rail, compact CTA */}
                    <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 text-center">
                        <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1 bg-emerald-500" />

                        <a
                            href="https://www.turkiye.gov.tr/saglik-titck-nobetci-eczane-sorgulama"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-base md:text-lg font-bold px-8 py-3.5 rounded-xl shadow-md shadow-emerald-600/20 transition-colors"
                        >
                            <span>الانتقال لبحث e-Devlet الرسمي</span>
                            <ExternalLink className="w-5 h-5" />
                        </a>

                        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                مصدر حكومي رسمي 100%
                            </span>
                            <span className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                يغطي 81 ولاية
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                محدّث لحظياً 24/7
                            </span>
                        </div>
                    </div>

                    {/* How to use */}
                    <div className="relative overflow-hidden mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1 bg-blue-500" />
                        <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                <Info size={16} />
                            </span>
                            كيف تستخدم الخدمة؟
                        </h2>
                        <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300 list-decimal list-inside leading-relaxed">
                            <li>افتح بوابة e-Devlet من الزر الرسمي</li>
                            <li>اختر الولاية (İl) ثم المنطقة (İlçe)</li>
                            <li>ستظهر قائمة الصيدليات المناوبة مع العناوين وأرقام الهاتف</li>
                        </ol>
                    </div>

                    {/* Emergency numbers */}
                    <div className="relative overflow-hidden mt-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1 bg-red-500" />
                        <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                <Phone size={16} />
                            </span>
                            أرقام الطوارئ في تركيا
                        </h2>
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
                                    className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700 hover:shadow-md hover:-translate-y-0.5 transition-all"
                                >
                                    <span className="text-lg font-black text-red-600 dark:text-red-400 font-mono tabular-nums" dir="ltr">{item.number}</span>
                                    <span className="text-xs text-slate-600 dark:text-slate-300 font-bold leading-tight">{item.label}</span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* FAQ Section — visible for SEO */}
                    <div className="mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                <HelpCircle size={16} />
                            </span>
                            أسئلة شائعة عن الصيدليات المناوبة
                        </h2>
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

                    {/* Cross-links — curated internal links for SEO */}
                    <div className="mt-6">
                        <CrossLinks context="tool" />
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
                            className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-2 px-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <span>العودة للرئيسية</span>
                            <ArrowLeft className="w-4 h-4" />
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
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 text-start">{question}</h3>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                {answer}
            </div>
        </details>
    );
}
