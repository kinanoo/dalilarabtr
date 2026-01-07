/**
 * 🏠 الصفحة الرئيسية مع Schema.org
 * =================================
 * 
 * 📁 انسخ هذا الملف إلى: src/app/page.tsx
 * 
 * التحسينات:
 * - ربط مع لوحة التحكم (useAdminData)
 * - إضافة قسم "آخر الأخبار"
 * - علامة "جديد" للمحتوى الحديث
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import Footer from '@/components/Footer';
import GlobalSearch from '@/components/GlobalSearch';
import CategoryCard from '@/components/ui/CategoryCard';
import { QUICK_ACTIONS, SITE_CONFIG } from '@/lib/data';
import { useAdminArticles, useAdminUpdates, isNewContent } from '@/lib/useAdminData';
import Link from 'next/link';
import {
  BrainCircuit, Briefcase, FileText, GraduationCap, HeartPulse,
  IdCard, Plane, Sparkles, Bell, Calendar, ArrowLeft, Loader2, UserCheck, ShieldCheck
} from 'lucide-react';
import ShareMenu from '@/components/ShareMenu';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';


// ============================================
// 🔍 Schema.org للـ SEO
// ============================================

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_CONFIG.name,
  description: SITE_CONFIG.slogan,
  url: SITE_CONFIG.siteUrl,
  logo: `${SITE_CONFIG.siteUrl}/logo.png`,
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: `+${SITE_CONFIG.whatsapp}`,
    contactType: 'customer service',
    availableLanguage: ['Arabic', 'Turkish'],
  },
};

const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_CONFIG.name,
  description: SITE_CONFIG.slogan,
  url: SITE_CONFIG.siteUrl,
  inLanguage: 'ar',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_CONFIG.siteUrl}/faq?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

// ============================================
// 🎨 الأنيميشن
// ============================================

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: 'easeOut' },
  },
} as const;

// ============================================
// 📦 البيانات والمساعدات
// ============================================

const IconMap: any = {
  IdCard, FileText, Plane, Briefcase, HeartPulse, GraduationCap,
  UserCheck, ShieldCheck, Sparkles, BrainCircuit
};

// ألوان دورية للكروت
const TILE_COLORS = [
  'bg-cyan-500 dark:bg-cyan-600',
  'bg-blue-500 dark:bg-blue-600',
  'bg-purple-500 dark:bg-purple-600',
  'bg-amber-500 dark:bg-amber-600',
  'bg-rose-500 dark:bg-rose-600',
  'bg-indigo-500 dark:bg-indigo-600',
  'bg-teal-500 dark:bg-teal-600',
  'bg-pink-500 dark:bg-pink-600',
];

// ============================================
// 🏠 المكون الرئيسي
// ============================================

export default function Home() {
  // 🆕 استخدام بيانات لوحة التحكم
  const { articles, loading: articlesLoading } = useAdminArticles();
  const { updates, loading: updatesLoading } = useAdminUpdates();
  const [categories, setCategories] = useState<any[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);

  // جلب التصنيفات من السيرفر
  useEffect(() => {
    async function fetchCategories() {
      if (!supabase) return;
      const { data } = await supabase
        .from('service_categories')
        .select('*')
        .eq('is_featured', true)
        .eq('active', true)
        .order('sort_order');

      if (data) {
        setCategories(data);
      }
      setCatsLoading(false);
    }
    fetchCategories();
  }, []);

  const storageKey = 'quickActions.clickCounts.v1';
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, number>;
      if (parsed && typeof parsed === 'object') {
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

  // ترتيب الاختصارات السريعة
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

  // 🆕 آخر 3 أخبار
  const latestUpdates = useMemo(() => {
    return updates.slice(0, 3);
  }, [updates]);

  return (
    <main className="flex flex-col min-h-screen font-cairo bg-slate-100 dark:bg-slate-950 selection:bg-emerald-200 dark:selection:bg-emerald-700">

      {/* Schema.org للـ SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />



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

      {/* 🌟 منطقة البحث */}
      <div className="relative z-30 -mt-20 md:-mt-24 px-4">
        <GlobalSearch />
      </div>

      {/* 2. الأقسام الرئيسية */}
      <section className="relative z-20 mt-[50px] px-4">
        <div className="max-w-screen-2xl mx-auto">
          {catsLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-600" /></div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-5">
              {categories.map((tile, idx) => {
                const Icon = IconMap[tile.icon] || FileText;
                const colorClass = TILE_COLORS[idx % TILE_COLORS.length];
                return (
                  <Link
                    key={tile.id || `cat-${idx}`}
                    href={`/category/${tile.slug}`}
                    className="group flex flex-col items-center justify-center gap-3 p-4 md:p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-emerald-400 dark:hover:border-emerald-500 hover:-translate-y-1 transition-all duration-300 active:scale-95"
                    aria-label={`قسم ${tile.title}`}
                  >
                    <div className={`p-3.5 md:p-4 rounded-xl text-white ${colorClass} shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                      <Icon size={24} className="md:w-7 md:h-7" />
                    </div>
                    <span className="font-bold text-sm md:text-base text-center text-slate-800 dark:text-slate-100 leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {tile.title}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 🆕 3. آخر الأخبار */}
      {latestUpdates.length > 0 && (
        <section className="px-4 py-10">
          <div className="max-w-screen-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Bell className="text-amber-500" size={24} />
                آخر الأخبار
              </h2>
              <Link
                href="/updates"
                className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                عرض الكل <ArrowLeft size={16} />
              </Link>
            </div>

            {updatesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={32} className="animate-spin text-emerald-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {latestUpdates.map((update) => (
                  <Link
                    key={update.id}
                    href={`/updates#upd-${update.id}`}
                    className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-600 transition"
                  >
                    <div className="flex items-start gap-3">
                      {/* صورة الخبر */}
                      {update.image && (
                        <img
                          src={update.image}
                          alt="صورة الخبر"
                          className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        {/* النوع + جديد */}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${update.type === 'هام' || update.type === 'عاجل'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                            {update.type}
                          </span>
                          {isNewContent(update.date) && (
                            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                              <Sparkles size={10} /> جديد
                            </span>
                          )}
                        </div>

                        {/* العنوان */}
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm line-clamp-2 group-hover:text-emerald-600 transition">
                          {update.title}
                        </h3>

                        {/* التاريخ */}
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                          <Calendar size={12} />
                          {update.date}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. المستشار الذكي (بانر) */}
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

      {/* 5. اختصارات سريعة */}
      <section className="px-4 py-10">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="text-amber-500" size={24} />
              اختصارات سريعة
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sortedQuickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                onClick={() => trackQuickActionClick(action.href)}
                className="group relative flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-emerald-300 dark:hover:border-emerald-700 overflow-hidden"
              >

                {/* الخلفية المتدرجة عند التحويم */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10 p-3 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300 mb-3 shadow-sm group-hover:shadow-md">
                  <action.icon size={28} />
                </div>

                <h3 className="relative z-10 font-bold text-base text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 text-center mb-1">
                  {action.title}
                </h3>

                {action.desc && (
                  <p className="relative z-10 text-xs text-slate-500 dark:text-slate-400 text-center line-clamp-2">
                    {action.desc}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. مشاركة الموقع */}
      <section className="px-4 py-8">
        <div className="max-w-screen-2xl mx-auto text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">شارك الموقع مع من يحتاجه:</p>
          <ShareMenu title={SITE_CONFIG.name} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
