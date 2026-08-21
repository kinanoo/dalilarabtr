import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  Banknote,
  BriefcaseBusiness,
  Calculator,
  CalendarDays,
  Clock3,
  ExternalLink,
  Landmark,
  Link2,
  MapPin,
  Newspaper,
  Pill,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import { SITE_CONFIG } from '@/lib/config';
import { supabase } from '@/lib/supabaseClient';
import { getRates, type RatesResult } from '@/lib/rates';
import logger from '@/lib/logger';

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: 'مركز اليوم في تركيا: قرارات، صيدليات، عملات وأدوات | دليل العرب' },
  description: 'صفحة يومية تجمع آخر القرارات والمهل، الصيدليات المناوبة، أسعار العملات، الروابط الحكومية، حاسبات الإقامة والعمل والخدمات القريبة في تركيا.',
  alternates: { canonical: '/today' },
  openGraph: {
    title: 'ماذا تحتاج اليوم في تركيا؟',
    description: 'آخر القرارات والأدوات والخدمات اليومية في مكان واحد.',
    url: `${SITE_CONFIG.siteUrl}/today`,
    images: ['/og-banner.jpg'],
  },
};

type DailyUpdate = {
  id: string;
  title: string;
  date: string;
  type: string;
  category?: string | null;
  summary?: string | null;
  pinned?: boolean | null;
};

function bounded<T>(promise: Promise<T>, fallback: T, ms = 2200): Promise<T> {
  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

async function getDailyData() {
  const updatesPromise = (async (): Promise<DailyUpdate[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('updates')
      .select('id,title,date,type,category,summary,pinned')
      .eq('active', true)
      .lte('date', new Date().toISOString().slice(0, 10))
      .order('pinned', { ascending: false })
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6);
    if (error) throw error;
    return (data || []) as DailyUpdate[];
  })();

  const [updates, rates] = await Promise.all([
    bounded(updatesPromise, [] as DailyUpdate[]),
    bounded(getRates(), { ok: false, rates: { usd: null, eur: null, sar: null, gold: null }, updated: null } as RatesResult),
  ]);

  return { updates, rates };
}

const primaryActions = [
  { href: '/tools/pharmacy', title: 'صيدلية مناوبة', note: 'اعثر على المفتوح الآن', icon: Pill },
  { href: '/tools/currency', title: 'العملات والذهب', note: 'أسعار ومحوّل فوري', icon: Banknote },
  { href: '/important-links', title: 'روابط حكومية', note: 'المواقع الرسمية مباشرة', icon: Landmark },
  { href: '/services', title: 'خدمة قريبة', note: 'ابحث بالمهنة والمدينة', icon: BriefcaseBusiness },
];

const tools = [
  { href: '/tools/kimlik-check', title: 'فحص قيد الكملك', icon: ShieldCheck },
  { href: '/tools/residence-calculator', title: 'حاسبة أيام الإقامة', icon: CalendarDays },
  { href: '/tools/salary-calculator', title: 'حاسبة الراتب الصافي', icon: WalletCards },
  { href: '/tools/severance-calculator', title: 'تعويض نهاية الخدمة', icon: Calculator },
  { href: '/tools/rent-increase-calculator', title: 'زيادة الإيجار', icon: Calculator },
  { href: '/zones', title: 'المناطق المحظورة', icon: MapPin },
];

const officialLinks = [
  { href: '/e-devlet-services', label: 'خدمات الحكومة الإلكترونية' },
  { href: '/consulates', label: 'السفارات والقنصليات' },
  { href: '/places', label: 'الدوائر والمواقع على الخريطة' },
  { href: '/forms', label: 'النماذج الجاهزة' },
];

const categoryLabels: Record<string, string> = {
  official: 'قرار رسمي',
  residence: 'إقامة وجنسية',
  work: 'عمل واقتصاد',
  education: 'تعليم',
  health: 'صحة',
  security: 'تنبيه',
  general: 'مستجدات',
};

export default async function TodayPage() {
  const { updates, rates } = await getDailyData().catch((error) => {
    logger.error('daily center data failed:', error);
    return { updates: [] as DailyUpdate[], rates: null };
  });
  const todayLabel = new Intl.DateTimeFormat('ar-TR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul',
  }).format(new Date());
  const rateRows = rates?.ok ? [
    { label: 'الدولار', value: rates.rates.usd?.value },
    { label: 'اليورو', value: rates.rates.eur?.value },
    { label: 'الريال', value: rates.rates.sar?.value },
    { label: 'غرام الذهب', value: rates.rates.gold?.value },
  ].filter((item) => item.value) : [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'مركز اليوم في تركيا',
    url: `${SITE_CONFIG.siteUrl}/today`,
    inLanguage: 'ar',
    description: 'آخر القرارات والأدوات والخدمات اليومية للعرب والسوريين في تركيا.',
  };

  return (
    <main className="min-h-screen bg-slate-50 font-cairo text-slate-950 dark:bg-slate-950 dark:text-white" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:py-10">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-300">
                <Clock3 size={15} /> {todayLabel}
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-normal sm:text-5xl">ماذا تحتاج اليوم؟</h1>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                القرارات العاجلة، الأدوات اليومية والخدمات التي تحتاجها في تركيا من شاشة واحدة.
              </p>
            </div>
            <Link href="/directory" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-black text-white transition hover:bg-emerald-700 active:scale-[0.98] dark:bg-emerald-500 dark:text-slate-950">
              افتح الدليل الشامل <ArrowLeft size={17} />
            </Link>
          </div>

          <nav aria-label="أكثر الاحتياجات اليومية" className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {primaryActions.map((item) => (
              <Link key={item.href} href={item.href} className="group flex min-h-20 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-emerald-700 shadow-sm dark:bg-slate-800 dark:text-emerald-300"><item.icon size={20} /></span>
                <span className="min-w-0">
                  <strong className="block text-sm font-black">{item.title}</strong>
                  <span className="mt-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400">{item.note}</span>
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-white py-7 dark:border-slate-800 dark:bg-slate-950" aria-labelledby="daily-updates">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black text-emerald-700 dark:text-emerald-300">تابع قبل أن تنجز معاملتك</p>
              <h2 id="daily-updates" className="mt-1 text-2xl font-black">آخر القرارات والمهل</h2>
            </div>
            <Link href="/updates" className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 dark:text-emerald-300">كل الأخبار <ArrowLeft size={14} /></Link>
          </div>

          {updates.length > 0 ? (
            <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {updates.map((item) => (
                <Link key={item.id} href={`/updates/${item.id}`} className="group grid gap-2 py-4 transition hover:bg-slate-50 sm:grid-cols-[110px_1fr_auto] sm:items-center sm:px-3 dark:hover:bg-slate-900">
                  <span className="text-[11px] font-black text-slate-500">{categoryLabels[item.category || 'general'] || 'مستجدات'} · {item.date}</span>
                  <span className="min-w-0">
                    <strong className="block text-sm font-black leading-6 text-slate-900 group-hover:text-emerald-800 dark:text-white dark:group-hover:text-emerald-300 sm:text-base">{item.title}</strong>
                    {item.summary && <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{item.summary}</span>}
                  </span>
                  <ArrowLeft size={17} className="hidden text-slate-400 transition-transform group-hover:-translate-x-1 sm:block" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              لا توجد مستجدات عاجلة معروضة الآن. الأدوات اليومية متاحة أدناه.
            </div>
          )}
        </div>
      </section>

      <section className="py-8" aria-labelledby="daily-tools">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <h2 id="daily-tools" className="text-2xl font-black">أنجز واحسب</h2>
            <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">أدوات جاهزة تختصر عليك البحث والحساب.</p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {tools.map((tool) => (
                <Link key={tool.href} href={tool.href} className="group flex min-h-24 flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700">
                  <tool.icon size={20} className="text-emerald-700 dark:text-emerald-300" />
                  <strong className="mt-4 text-sm font-black leading-5">{tool.title}</strong>
                </Link>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-labelledby="rates-title">
              <div className="flex items-center justify-between gap-3">
                <h2 id="rates-title" className="flex items-center gap-2 text-base font-black"><Banknote size={18} className="text-emerald-700" /> أسعار اليوم</h2>
                <Link href="/tools/currency" className="text-[11px] font-black text-emerald-700 dark:text-emerald-300">المحوّل الكامل</Link>
              </div>
              {rateRows.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700">
                  {rateRows.map((rate) => (
                    <div key={rate.label} className="bg-slate-50 p-3 dark:bg-slate-950">
                      <span className="block text-[10px] font-bold text-slate-500">{rate.label}</span>
                      <strong className="mt-1 block text-sm font-black tabular-nums">{Number(rate.value).toLocaleString('en-US', { maximumFractionDigits: 2 })} ل.ت</strong>
                    </div>
                  ))}
                </div>
              ) : <p className="mt-3 text-xs font-bold text-slate-500">افتح صفحة العملات لعرض آخر تحديث متاح.</p>}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-labelledby="official-title">
              <h2 id="official-title" className="flex items-center gap-2 text-base font-black"><Link2 size={18} className="text-emerald-700" /> وصول رسمي سريع</h2>
              <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {officialLinks.map((item) => (
                  <Link key={item.href} href={item.href} className="flex min-h-11 items-center justify-between gap-3 text-sm font-bold text-slate-700 hover:text-emerald-700 dark:text-slate-200 dark:hover:text-emerald-300">
                    {item.label}<ExternalLink size={14} className="text-slate-400" />
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <Newspaper size={23} className="mx-auto text-emerald-700" />
          <h2 className="mt-2 text-xl font-black">لم تجد ما تحتاجه اليوم؟</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">ابحث في كل المقالات والأخبار والخدمات من مكان واحد.</p>
          <Link href="/directory" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-5 text-sm font-black transition hover:border-emerald-400 hover:text-emerald-800 dark:border-slate-700 dark:hover:border-emerald-600 dark:hover:text-emerald-300">تصفح الدليل <ArrowLeft size={16} /></Link>
        </div>
      </section>
    </main>
  );
}
