'use client';

import { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GlobalSearch from '@/components/GlobalSearch';
import { CATEGORY_SLUGS, QUICK_ACTIONS, SITE_CONFIG } from '@/lib/data';
import { ARTICLES } from '@/lib/articles';
import Link from 'next/link';
import { BrainCircuit, Briefcase, FileText, GraduationCap, HeartPulse, IdCard, Plane, Sparkles } from 'lucide-react';
import ShareMenu from '@/components/ShareMenu';
import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: 'easeOut' },
  },
} as const;

const CATEGORY_TILES = [
  { name: 'الكملك', icon: IdCard, color: 'bg-cyan-500 dark:bg-cyan-600', href: '/category/kimlik', categorySlug: 'kimlik' },
  { name: 'الإقامة', icon: FileText, color: 'bg-blue-500 dark:bg-blue-600', href: '/category/residence', categorySlug: 'residence' },
  { name: 'الفيزا', icon: Plane, color: 'bg-purple-500 dark:bg-purple-600', href: '/category/visa', categorySlug: 'visa' },
  { name: 'العمل', icon: Briefcase, color: 'bg-amber-500 dark:bg-amber-600', href: '/category/work', categorySlug: 'work' },
  { name: 'الصحة', icon: HeartPulse, color: 'bg-rose-500 dark:bg-rose-600', href: '/category/health', categorySlug: 'health' },
  { name: 'الدراسة', icon: GraduationCap, color: 'bg-indigo-500 dark:bg-indigo-600', href: '/category/education', categorySlug: 'education' },
] as const;

const COUNTS_BY_CATEGORY_NAME = (() => {
  const counts = new Map<string, number>();
  for (const article of Object.values(ARTICLES)) {
    counts.set(article.category, (counts.get(article.category) ?? 0) + 1);
  }
  return counts;
})();

const VISIBLE_CATEGORY_TILES = CATEGORY_TILES.filter((tile) => {
  if (!('categorySlug' in tile)) return true;
  const categoryName = CATEGORY_SLUGS[tile.categorySlug];
  if (!categoryName) return false;
  return (COUNTS_BY_CATEGORY_NAME.get(categoryName) ?? 0) > 0;
});

export default function Home() {
  const storageKey = 'quickActions.clickCounts.v1';
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});

  // مهم: لا تقرأ localStorage أثناء أول render حتى لا يحدث Hydration mismatch.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, number>;
      if (parsed && typeof parsed === 'object') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setClickCounts(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const trackQuickActionClick = (href: string) => {
    setClickCounts((prev) => {
      const next = { ...prev, [href]: (prev[href] ?? 0) + 1 };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const sortedQuickActions = useMemo(() => {
    const originalIndex = new Map<string, number>();
    QUICK_ACTIONS.forEach((a, idx) => originalIndex.set(a.href, idx));
    return [...QUICK_ACTIONS].sort((a, b) => {
      const aCount = clickCounts[a.href] ?? 0;
      const bCount = clickCounts[b.href] ?? 0;
      if (bCount !== aCount) return bCount - aCount;
      return (originalIndex.get(a.href) ?? 0) - (originalIndex.get(b.href) ?? 0);
    });
  }, [clickCounts]);

  return (
    <main className="flex flex-col min-h-screen font-cairo bg-slate-100 dark:bg-slate-950 selection:bg-emerald-200 dark:selection:bg-emerald-700">
      <Navbar />

      {/* 1. HERO SECTION */}
      <section className="relative bg-primary-900 dark:bg-primary-950 text-white py-16 px-4 overflow-hidden rounded-b-[80px]">
        <div className="absolute inset-0 opacity-10" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-snug md:leading-tight">
              دليلك القانوني <span className="text-emerald-400">الشامل</span>
            </h1>
            <p className="text-base md:text-xl text-slate-300 max-w-2xl mx-auto">
              كل ما تحتاجه في تركيا: إقامات، قانون، أكواد أمنية، وخدمات ذكية.
            </p>
            <p className="mt-3 text-sm md:text-base text-primary-100/80 max-w-2xl mx-auto">
              {SITE_CONFIG.slogan}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 🌟 منطقة البحث (مرفوعة للأعلى) */}
      <div className="relative z-30 -mt-20 md:-mt-24 px-4">
        <GlobalSearch />
      </div>

      {/* 2. الأقسام الرئيسية (شبكة متجاوبة) */}
        <section className="relative z-20 mt-[50px] px-4">
        <div className="max-w-screen-2xl mx-auto">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
            {VISIBLE_CATEGORY_TILES.map((tile, idx) => (
              <Link
                key={idx}
                href={tile.href}
                className="group flex flex-col items-center p-3 md:p-4 bg-gradient-to-b from-white to-slate-100/80 dark:from-slate-900 dark:to-slate-800 rounded-3xl shadow-sm border border-slate-300/60 dark:border-slate-700/80 hover:shadow-lg dark:hover:shadow-slate-900/40 hover:border-emerald-300/70 dark:hover:border-emerald-500/40 hover:-translate-y-0.5 transition active:scale-95"
                aria-label={`قسم ${tile.name}`}
              >
                <div className={`p-3 md:p-3.5 rounded-2xl text-white mb-2 ${tile.color} shadow-sm group-hover:shadow-md transition`}>
                  <tile.icon size={20} />
                </div>
                <span className="font-extrabold text-xs md:text-sm text-slate-800 dark:text-slate-100 tracking-tight">
                  {tile.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. المستشار الذكي (بانر) */}
      <section className="px-2 sm:px-4 py-10">
        <div className="bg-primary-900 dark:bg-primary-950 rounded-3xl p-6 md:p-10 text-center relative overflow-hidden text-white shadow-xl dark:shadow-2xl dark:shadow-slate-900/50 w-full">
           <div className="relative z-10">
             <BrainCircuit size={40} className="mx-auto text-emerald-400 mb-4 motion-safe:animate-pulse" />
             <h2 className="text-2xl font-bold mb-2">المستشار القانوني الذكي</h2>
             <p className="text-primary-100/80 dark:text-primary-100/80 text-sm mb-6 max-w-xl mx-auto">
               لديك مشكلة معقدة؟ (ترحيل، كود، رفض إقامة)؟ دع الذكاء الاصطناعي يحللها لك مجاناً.
             </p>
             <span className="relative inline-block">
               <span className="absolute inset-0 rounded-xl bg-emerald-400/20 motion-safe:animate-ping" aria-hidden="true" />
               <span className="absolute inset-0 rounded-xl bg-emerald-400/10 motion-safe:animate-pulse" aria-hidden="true" />
               <Link
                 href="/consultant"
                 className="relative inline-block bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-600 dark:hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/30 transform hover:-translate-y-0.5"
               >
                 ابدأ التشخيص
               </Link>
             </span>
           </div>
           {/* زخرفة خلفية */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl motion-safe:animate-pulse"></div>
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl motion-safe:animate-pulse"></div>
        </div>
      </section>

      {/* 4. الإجراءات السريعة */}
      <section className="py-10 px-4 max-w-screen-2xl mx-auto">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Sparkles className="text-emerald-500" size={20} /> الأكثر شيوعاً
          </h2>
          <Link
            href="/faq"
            className="inline-flex items-center justify-center rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-900 transition"
            aria-label="اذهب إلى صفحة الأسئلة الشائعة"
          >
            الأسئلة الشائعة
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {sortedQuickActions.map((action, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-slate-700/50" role="listitem">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                  <action.icon size={20} />
                </div>
                <div className="flex-shrink-0">
                  <ShareMenu title={action.title} text={action.desc} url={`${SITE_CONFIG.siteUrl}${action.href}`} mini={true} />
                </div>
              </div>
              <Link
                href={action.href}
                className="block"
                aria-label={action.title}
                onClick={() => trackQuickActionClick(action.href)}
              >
                <h3 className="text-xs md:text-sm font-bold text-slate-800 dark:text-white mb-1 line-clamp-2">{action.title}</h3>
                <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{action.desc}</p>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}