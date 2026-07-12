import { supabase } from '@/lib/supabaseClient';
import EDevletServicesHub from '@/components/EDevletServicesHub';
import type { Article } from '@/lib/types';
import { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, IdCard, FileText, Smartphone, HelpCircle, ChevronLeft } from 'lucide-react';
import ShareMenu from '@/components/ShareMenu';
import ToolFooter from '@/components/tools/ToolFooter';
import { SITE_CONFIG } from '@/lib/config';

// ─── أشهر معاملات e-Devlet — colloquial task labels → the exact article ───────
// Phrased the way people actually search («ورقة العنوان»، «أشيّك على نفوسي»)
// and pointed at the real article slug (all verified to exist).
const POPULAR_TASKS: { q: string; slug: string; icon: typeof MapPin }[] = [
  { q: 'كيف أستخرج ورقة العنوان (سند إقامة / yerleşim yeri)؟', slug: 'edevlet-nvi-yerlesim-yeri', icon: MapPin },
  { q: 'كيف أعرف إذا عندي عنوان مسجّل وأتحقّق من قيدي؟', slug: 'edevlet-ikamet-kisisel-bilgi', icon: MapPin },
  { q: 'كيف أستخرج بيان قيد عائلي (سجل نفوس)؟', slug: 'edevlet-nvi-nufus-kayit-ornegi', icon: IdCard },
  { q: 'كيف أطلع وثيقة خلو سوابق (لا حكم عليه)؟', slug: 'edevlet-adli-sicil-kaydi', icon: FileText },
  { q: 'كيف أتحقّق من الخطوط المسجّلة باسمي؟', slug: 'edevlet-mobil-hat-sorgulama', icon: Smartphone },
  { q: 'كيف أتأكّد من هاتفي والرقم التسلسلي IMEI؟', slug: 'edevlet-imei-sorgulama', icon: Smartphone },
  { q: 'كيف أحجز موعد مستشفى عبر MHRS؟', slug: 'edevlet-mhrs', icon: FileText },
  { q: 'كيف أشوف تقاريري الطبية (e-Nabız)؟', slug: 'edevlet-e-nabiz', icon: FileText },
  { q: 'كيف أستعلم عن مخالفات سيارتي؟', slug: 'edevlet-plaka-ceza', icon: FileText },
  { q: 'كيف أطلع وثيقة تسجيل في SGK؟', slug: 'edevlet-sgk-kayit-belgesi', icon: FileText },
  { q: 'كيف أستخرج ورقة أعزب (أهلية زواج)؟', slug: 'edevlet-evlenme-ehliyet', icon: FileText },
  { q: 'كيف أقدّم شكوى رسمية (CİMER)؟', slug: 'edevlet-cimer-basvuru', icon: FileText },
];

// ─── FAQ — colloquial questions, short accurate answers, links to detail ─────
const EDEVLET_FAQ: { q: string; a: string; slug?: string }[] = [
  {
    q: 'ما هو e-Devlet وكيف أدخل إليه؟',
    a: 'e-Devlet (turkiye.gov.tr) هي بوابة الحكومة التركية الإلكترونية لإنجاز آلاف المعاملات الرسمية أونلاين. للدخول تحتاج رقم الكملك/الهوية وكلمة مرور e-Devlet التي تشتريها من أي مكتب بريد PTT برسم بسيط، ثم تدخل كل الخدمات من مكان واحد.',
  },
  {
    q: 'كيف أستخرج ورقة العنوان (إثبات السكن / yerleşim yeri belgesi)؟',
    a: 'من e-Devlet ابحث عن خدمة «Yerleşim Yeri (İkametgah) Belgesi» واستخرج الوثيقة واطبعها فوراً بلا مراجعة النفوس. الشرح بالخطوات في دليلنا المخصّص.',
    slug: 'edevlet-nvi-yerlesim-yeri',
  },
  {
    q: 'كيف أعرف إذا عندي عنوان مسجّل وأشيّك على نفوسي وقيدي؟',
    a: 'تقدر تستعلم عن معلومات عنوانك وإقامتك المسجّلة رسمياً عبر e-Devlet، فتعرف إن كان عندك عنوان مثبّت وما هو. راجع دليل الاستعلام عن معلومات الإقامة، ووثيقة العنوان لطباعتها.',
    slug: 'edevlet-ikamet-kisisel-bilgi',
  },
  {
    q: 'كيف أستخرج بيان قيد عائلي (سجل النفوس / Nüfus Kayıt Örneği)؟',
    a: 'تُستخرج وثيقة قيد النفوس/البيان العائلي عبر خدمة «Nüfus Kayıt Örneği» على e-Devlet (متاحة غالباً لحاملي الجنسية التركية). التفاصيل والحالات في الدليل.',
    slug: 'edevlet-nvi-nufus-kayit-ornegi',
  },
  {
    q: 'كيف أتحقّق من الخطوط والهواتف المسجّلة باسمي؟',
    a: 'من e-Devlet تعرف عدد خطوط الجوال المسجّلة باسمك (لتتجنّب استعمالاً غير مشروع)، وتتحقّق من حالة هاتفك عبر رقم IMEI. لكل منهما دليل منفصل بالخطوات.',
    slug: 'edevlet-mobil-hat-sorgulama',
  },
  {
    q: 'هل خدمات e-Devlet مجانية وهل تحتاج كملك؟',
    a: 'الدخول والاستعلامات مجانية، وبعض الوثائق الرسمية تُصدر فوراً بلا رسوم. تحتاج رقم كملك/هوية فعّال وكلمة مرور e-Devlet. تأكّد أن كملكك فعّال قبل المعاملة عبر أداة فحص الكملك.',
  },
];

function EDevletSeoSchema({ services }: { services: { title: string; slug?: string; id: string }[] }) {
  const base = SITE_CONFIG.siteUrl;
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'خدمات e-Devlet بالعربي',
    numberOfItems: services.length,
    itemListElement: services.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.title,
      url: `${base}/article/${s.slug || s.id}`,
    })),
  };
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: EDEVLET_FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
    </>
  );
}

export const metadata: Metadata = {
  title: 'خدمات e-Devlet بالعربي — دليل استخراج أوراق النفوس والعنوان والاستعلامات 2026',
  description:
    'دليل عربي شامل لخدمات بوابة الحكومة التركية e-Devlet (turkiye.gov.tr): كيف تستخرج ورقة العنوان (سند إقامة / yerleşim yeri)، تشيّك على نفوسك وقيدك، تطلع بيان عائلي وخلو سوابق، تتحقق من خطوطك وهاتفك (IMEI)، تحجز موعد مستشفى، وأكثر — شرح بالخطوات مع الرابط الرسمي المباشر.',
  keywords:
    'خدمات e-Devlet بالعربي, e-Devlet شرح, turkiye.gov.tr بالعربي, استخراج ورقة نفوس تركيا, إثبات العنوان تركيا, yerleşim yeri belgesi, كيف اشيك نفوس, التحقق من الكملك, بيان عائلي تركيا, خلو سوابق تركيا, شيفرة e-Devlet',
  alternates: { canonical: '/e-devlet-services' },
  openGraph: {
    title: 'خدمات e-Devlet بالعربي — استخراج الأوراق والاستعلامات في تركيا',
    description: 'كيف تستخرج ورقة العنوان، تشيّك على نفوسك، تطلع بيان عائلي وخلو سوابق، وتنجز معاملاتك عبر e-Devlet — شرح عربي بالخطوات + الرابط الرسمي.',
    url: `${SITE_CONFIG.siteUrl}/e-devlet-services`,
    type: 'website',
    images: ['/og-banner.jpg'],
  },
};

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export default async function EDevletServicesPage() {
  if (!supabase) return null;

  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, intro, last_update, source, slug')
    .eq('category', 'خدمات e-Devlet')
    .eq('status', 'approved');

  const services = (articles || [])
    .map((a: any) => ({
      id: a.id,
      title: a.title,
      intro: a.intro,
      lastUpdate: a.last_update,
      source: a.source ?? undefined,
      // Carry the slug through so cards link to the clean /article/<slug> URL
      // instead of falling back to the UUID id (both resolve, but slug is the
      // canonical, crawlable one).
      slug: a.slug ?? undefined,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, 'ar'));

  return (
    <main className="min-h-screen flex flex-col">
      <EDevletSeoSchema services={services} />
      <EDevletServicesHub services={services} />

      {/* ── Crawlable SEO body: intro + most-searched tasks + FAQ ─────────── */}
      <div className="w-full max-w-5xl mx-auto px-4 pb-4 space-y-12">

        {/* Rich intro — what e-Devlet is, in the reader's words */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2">ما هي بوابة e-Devlet ولماذا تهمّك؟</h2>
          <p className="text-sm sm:text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed">
            e-Devlet (turkiye.gov.tr) هي بوابة الحكومة التركية الإلكترونية التي تُنجز منها آلاف المعاملات الرسمية أونلاين بلا مراجعة الدوائر:
            تستخرج ورقة العنوان (سند الإقامة)، تشيّك على نفوسك وقيدك، تطلع بيان عائلي وخلو سوابق، تتحقّق من الخطوط والهواتف المسجّلة باسمك،
            تحجز موعد مستشفى، وتستعلم عن المخالفات والديون. تحتاج فقط رقم كملك فعّال وكلمة مرور e-Devlet من أي مكتب بريد PTT.
            في الأسفل أشهر المعاملات مشروحة بالعربي خطوة بخطوة مع الرابط الرسمي.
          </p>
        </section>

        {/* Most-searched tasks — colloquial labels → the exact guide */}
        <section>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-4">أشهر معاملات e-Devlet — كيف تعملها؟</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {POPULAR_TASKS.map((t) => {
              const Icon = t.icon;
              return (
                <Link
                  key={t.slug}
                  href={`/article/${t.slug}`}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all"
                >
                  <span className="grid place-items-center w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Icon size={18} />
                  </span>
                  <span className="flex-1 text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {t.q}
                  </span>
                  <ChevronLeft size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 shrink-0" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* FAQ — visible + matches the FAQPage schema above */}
        <section>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
            <HelpCircle size={20} className="text-emerald-600" /> أسئلة شائعة عن e-Devlet
          </h2>
          <div className="space-y-3">
            {EDEVLET_FAQ.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 open:shadow-sm">
                <summary className="flex items-center justify-between gap-3 cursor-pointer list-none font-black text-sm text-slate-800 dark:text-slate-100">
                  {f.q}
                  <ChevronLeft size={16} className="text-slate-400 shrink-0 transition-transform group-open:-rotate-90" />
                </summary>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{f.a}</p>
                {f.slug && (
                  <Link href={`/article/${f.slug}`} className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
                    اقرأ الشرح المفصّل <ChevronLeft size={14} />
                  </Link>
                )}
              </details>
            ))}
          </div>
        </section>
      </div>

      <div className="flex justify-center py-6">
        <ShareMenu
          title="خدمات e-Devlet للأجانب"
          text="روابط مباشرة لأهم خدمات بوابة الحكومة التركية الإلكترونية e-Devlet."
          url={`${SITE_CONFIG.siteUrl}/e-devlet-services`}
          variant="subtle"
        />
      </div>
      <ToolFooter toolId="edevlet" />
    </main>
  );
}
