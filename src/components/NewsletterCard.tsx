'use client';

/**
 * NewsletterCard — visually prominent wrapper around NewsletterForm.
 *
 * Used in two slots: under the homepage fold and at the end of every
 * article. The signup itself is handled by NewsletterForm (which calls
 * /api/newsletter); this component only owns the surrounding card chrome:
 * gradient background, icon + headline + supporting copy, and a "what
 * you'll get" bullet list that sets expectations so the email-shy MENA
 * audience knows what they're signing up for.
 *
 * Two visual tones via the `tone` prop:
 *   - "hero" — used on the homepage. Bigger padding, larger headline.
 *   - "compact" — used at the bottom of articles. Lower padding, no
 *     hero gradient artwork, smaller copy.
 */

import { Mail, BellRing, FileCheck2 } from 'lucide-react';
import NewsletterForm from '@/components/NewsletterForm';
import Link from 'next/link';

interface Props {
    tone?: 'hero' | 'compact';
    source?: string;
}

export default function NewsletterCard({ tone = 'compact', source = 'unknown' }: Props) {
    const isHero = tone === 'hero';

    return (
        <section
            className={`
                relative overflow-hidden rounded-3xl border
                bg-gradient-to-br from-emerald-50 via-white to-emerald-50
                dark:from-emerald-900/30 dark:via-slate-900 dark:to-emerald-900/20
                border-emerald-100 dark:border-emerald-900/40
                ${isHero ? 'p-6 sm:p-10' : 'p-5 sm:p-6'}
                shadow-sm
            `}
            aria-label="اشترك في النشرة البريدية"
        >
            {/* Decorative glow only on hero variant */}
            {isHero && (
                <>
                    <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl" aria-hidden="true" />
                    <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl" aria-hidden="true" />
                </>
            )}

            <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                    <span className={`inline-flex items-center justify-center ${isHero ? 'w-12 h-12' : 'w-10 h-10'} rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30`}>
                        <Mail size={isHero ? 24 : 20} />
                    </span>
                    <div>
                        <h2 className={`${isHero ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'} font-black text-slate-800 dark:text-slate-100 leading-tight`}>
                            {isHero ? 'ابق على اطلاع بأهم التحديثات' : 'لا تفوّت قراراً جديداً'}
                        </h2>
                        <p className={`${isHero ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'} text-slate-500 dark:text-slate-300 mt-1`}>
                            بريد واحد كل أسبوع يلخّص ما يهمّ السوريين والعرب في تركيا.
                        </p>
                    </div>
                </div>

                {/* Expectation-setting bullets so MENA users know what they're opting into. */}
                <ul className={`flex flex-wrap gap-x-5 gap-y-2 ${isHero ? 'mb-6' : 'mb-4'} text-xs sm:text-sm text-slate-600 dark:text-slate-300`}>
                    <li className="flex items-center gap-1.5">
                        <FileCheck2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                        قرارات الحكومة التركية الجديدة
                    </li>
                    <li className="flex items-center gap-1.5">
                        <BellRing size={14} className="text-emerald-600 dark:text-emerald-400" />
                        تنبيهات للتغييرات في الإقامة والعمل
                    </li>
                    <li className="flex items-center gap-1.5">
                        <Mail size={14} className="text-emerald-600 dark:text-emerald-400" />
                        إلغاء سهل في أي وقت
                    </li>
                </ul>

                <NewsletterForm source={source} />

                <p className={`${isHero ? 'mt-4' : 'mt-3'} text-[11px] text-slate-400 dark:text-slate-500`}>
                    لن نشارك بريدك مع أي طرف ثالث. تحترم نشرتنا قانون حماية البيانات التركي KVKK رقم 6698.{' '}
                    <Link href="/newsletter/unsubscribe" className="font-bold text-emerald-700 underline dark:text-emerald-400">
                        إلغاء الاشتراك
                    </Link>
                </p>
            </div>
        </section>
    );
}
