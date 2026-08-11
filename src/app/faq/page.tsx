import { Metadata } from 'next';
import {
  Flame,
  Sparkles,
  Shield,
  Home,
  Briefcase,
  Wallet,
  Building2,
  Stethoscope,
  GraduationCap,
  Car,
  Plane,
  Smartphone,
  Scale,
  LifeBuoy,
  HelpCircle,
  ChevronDown,
  ArrowUp,
  MessageCircleQuestion,
} from 'lucide-react';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import ShareMenu from '@/components/ShareMenu';
import FaqFilter from '@/components/FaqFilter';
import { supabase, withTimeout } from '@/lib/supabaseClient';
import { buildFaqSections, faqCountLabel, FaqSection } from '@/lib/faqSections';
import { SITE_CONFIG } from '@/lib/config';
import { stripHtml } from '@/lib/stripHtml';
import logger from '@/lib/logger';

/*
 * 2026-08 rebuild. The old page paginated client-side: only 15 of 471
 * questions ever reached the server HTML, so crawlers saw ~3% of the
 * answers ("600+" in the metadata was a stale claim on dead static data).
 * Now the ENTIRE list is server-rendered as native <details> grouped into
 * 14 consolidated sections (the raw table has 70+ ad-hoc category strings —
 * see faqSections.ts), with anchor navigation, an expanded FAQPage JSON-LD,
 * and a DOM-filtering search island that hydrates one input, not the list.
 * Everything works without JavaScript; nothing is lost on mobile.
 */

export const metadata: Metadata = {
  title: 'الأسئلة الشائعة عن الحياة في تركيا — أجوبة موجزة موثوقة',
  description:
    'مئات الأجوبة الموجزة عن الإقامة والكملك والعمل والصحة والسكن والسيارات والقانون في تركيا — مقسمة أبواباً مع بحث فوري.',
  alternates: { canonical: '/faq' },
  openGraph: {
    title: 'الأسئلة الشائعة عن الحياة في تركيا',
    description:
      'مئات الأجوبة الموجزة الموثوقة عن الإقامة والكملك والعمل والصحة والحياة في تركيا.',
    url: `${SITE_CONFIG.siteUrl}/faq`,
    type: 'website',
    images: [{ url: `${SITE_CONFIG.siteUrl}/og-banner.jpg`, width: 1200, height: 630 }],
  },
};

export const revalidate = 3600;

const SECTION_ICONS: Record<string, { icon: typeof Home; text: string }> = {
  top: { icon: Flame, text: 'text-orange-600 dark:text-orange-400' },
  newcomers: { icon: Sparkles, text: 'text-cyan-600 dark:text-cyan-400' },
  kimlik: { icon: Shield, text: 'text-red-600 dark:text-red-400' },
  residence: { icon: Home, text: 'text-blue-600 dark:text-blue-400' },
  work: { icon: Briefcase, text: 'text-amber-600 dark:text-amber-400' },
  money: { icon: Wallet, text: 'text-lime-600 dark:text-lime-400' },
  housing: { icon: Building2, text: 'text-pink-600 dark:text-pink-400' },
  health: { icon: Stethoscope, text: 'text-teal-600 dark:text-teal-400' },
  education: { icon: GraduationCap, text: 'text-violet-600 dark:text-violet-400' },
  cars: { icon: Car, text: 'text-slate-600 dark:text-slate-400' },
  travel: { icon: Plane, text: 'text-sky-600 dark:text-sky-400' },
  digital: { icon: Smartphone, text: 'text-indigo-600 dark:text-indigo-400' },
  law: { icon: Scale, text: 'text-rose-600 dark:text-rose-400' },
  daily: { icon: LifeBuoy, text: 'text-emerald-600 dark:text-emerald-400' },
};
const DEFAULT_ICON = { icon: HelpCircle, text: 'text-slate-500 dark:text-slate-400' };

export default async function FAQPage() {
  let sections: FaqSection[] = [];
  if (supabase) {
    try {
      const result = await withTimeout(
        supabase
          .from('faqs')
          .select('id, question, answer, category')
          .eq('active', true)
          .order('id')
      );
      if (result && !result.error && result.data) {
        sections = buildFaqSections(result.data);
      }
    } catch (err) {
      logger.error('FAQ fetch failed:', err);
    }
  }

  const total = sections.reduce((sum, s) => sum + s.questions.length, 0);

  // FAQPage JSON-LD — up to 6 questions per section, capped at 80 total.
  // The full list already lives in the HTML; the schema carries a broad
  // representative slice without doubling the page weight.
  const schemaQuestions = sections
    .flatMap((s) => s.questions.slice(0, 6))
    .slice(0, 80);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: schemaQuestions.map((q) => ({
      '@type': 'Question',
      name: q.q,
      acceptedAnswer: { '@type': 'Answer', text: stripHtml(q.a) },
    })),
  };

  return (
    <div id="faq-top" className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero
        title="الأسئلة الشائعة"
        description={
          total > 0
            ? `${total} جواباً موجزاً موثقاً عن الحياة في تركيا — في ${sections.length} باباً`
            : 'أجوبة موجزة موثقة عن الحياة في تركيا'
        }
        icon={
          <MessageCircleQuestion className="w-10 h-10 md:w-12 md:h-12 text-emerald-600 dark:text-emerald-300" />
        }
      >
        <FaqFilter total={total} />
      </PageHero>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
        {total === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 font-bold py-16">
            تعذّر تحميل الأسئلة الآن — أعد تحميل الصفحة بعد قليل.
          </p>
        ) : (
          <>
            {/* Section anchor nav — server-rendered links, works without JS.
                Hidden by the island while a search query is active. */}
            <nav id="faq-nav" aria-label="أبواب الأسئلة" className="mb-8">
              <div className="flex flex-wrap gap-2">
                {sections.map((sec) => {
                  const style = SECTION_ICONS[sec.slug] || DEFAULT_ICON;
                  const Icon = style.icon;
                  return (
                    <a
                      key={sec.slug}
                      href={`#${sec.slug}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] sm:px-3.5 sm:py-2 sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all active:scale-95"
                    >
                      <Icon size={15} className={style.text} aria-hidden="true" />
                      {sec.title}
                      <span className="text-[10px] font-bold text-slate-400">
                        {sec.questions.length}
                      </span>
                    </a>
                  );
                })}
              </div>
            </nav>

            {/* All sections, all questions — nothing paginated, nothing lost. */}
            <div className="space-y-10">
              {sections.map((sec) => {
                const style = SECTION_ICONS[sec.slug] || DEFAULT_ICON;
                const Icon = style.icon;
                return (
                  <section
                    key={sec.slug}
                    id={sec.slug}
                    data-faq-section
                    className="scroll-mt-24"
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <Icon size={20} className={style.text} aria-hidden="true" />
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                        {sec.title}
                      </h2>
                      <span className="text-xs font-bold text-slate-400 mt-0.5">
                        {faqCountLabel(sec.questions.length)}
                      </span>
                    </div>
                    <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-4">
                      {sec.blurb}
                    </p>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                      {sec.questions.map((q) => (
                        <details
                          key={q.id}
                          id={`faq-${q.id}`}
                          data-faq
                          className="group border-b border-slate-100 dark:border-slate-800 last:border-0"
                        >
                          <summary className="flex items-start gap-3 p-4 sm:p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors">
                            <h3 className="flex-1 text-[15px] sm:text-base font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                              {q.q}
                            </h3>
                            <ChevronDown
                              size={18}
                              className="shrink-0 mt-1 text-slate-400 transition-transform duration-200 group-open:rotate-180"
                              aria-hidden="true"
                            />
                          </summary>
                          <div className="px-4 sm:px-5 pb-4 sm:pb-5 -mt-1 text-[15px] sm:text-base text-slate-600 dark:text-slate-300 leading-loose font-medium break-words border-t border-dashed border-slate-100 dark:border-slate-800 pt-3">
                            {q.a}
                          </div>
                        </details>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

            {/* Didn't find it? Route to the ask/browse surfaces. */}
            <div className="mt-12 rounded-2xl border-2 border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 p-5 sm:p-6 text-center">
              <p className="font-black text-slate-800 dark:text-slate-100 mb-1.5">
                ما وجدت جوابك؟
              </p>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-4">
                أدلتنا المفصّلة تغطي ما لا يغطيه جواب موجز — أو اطلب منا كتابة الدليل الذي ينقصك.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/articles"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
                >
                  تصفح الأدلة الكاملة
                </Link>
                <Link
                  href="/request"
                  className="px-5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-sm font-bold hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-colors"
                >
                  اطلب دليلاً جديداً
                </Link>
              </div>
            </div>

            <div className="flex justify-center py-6">
              <ShareMenu
                title="الأسئلة الشائعة — دليل العرب في تركيا"
                text={`${total} جواباً موجزاً موثقاً عن الإقامة والكملك والعمل والحياة في تركيا.`}
                url={`${SITE_CONFIG.siteUrl}/faq`}
                variant="subtle"
              />
            </div>
          </>
        )}
      </div>

      {/* Back to top — pure anchor, no JS. WhatsApp floats bottom-left, so
          this stays bottom-right below toast z-levels. */}
      <a
        href="#faq-top"
        aria-label="العودة إلى أعلى الصفحة"
        className="fixed bottom-4 right-4 z-40 p-3 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg text-slate-500 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-300 transition-colors"
      >
        <ArrowUp size={18} />
      </a>
    </div>
  );
}
