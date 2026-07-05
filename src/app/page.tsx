/**
 * 🏠 الصفحة الرئيسية (Server Component)
 * =================================
 * 
 * تم تحويلها بالكامل لتعمل على السيرفر لتحسين الأداء والـ SEO.
 * تم تحويلها بالكامل لتعمل على السيرفر لتحسين الأداء والـ SEO.
 */

export const revalidate = 300; // Cache for 5 minutes (ISR)

import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import { supabase, withTimeout } from '@/lib/supabaseClient';
import { SITE_CONFIG } from '@/lib/config';

const NewsTicker = dynamic(() => import("@/components/NewsTicker"));

// Components
import HeroSection from '@/components/home/HeroSection';
import NewsHub from '@/components/home/NewsHub';
import FeaturedGuides, { type FeaturedGuide } from '@/components/home/FeaturedGuides';
import HomeConsultantBtn from '@/components/home/HomeConsultantBtn';
import HeroTrustStrip from '@/components/home/HeroTrustStrip';
import LazyGlobalSearch from '@/components/home/LazyGlobalSearch';
import { GuidedJourney, QuickActionsGrid, HomeFAQ } from '@/components/home/LazyBelowFold';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { Sparkles, Wrench, MessageCircleQuestion } from 'lucide-react';
import { TOP_FAQS } from '@/lib/home-faq-data';
import logger from '@/lib/logger';

// ============================================
// 📦 Data Fetching (Server-Side)
// ============================================

// Updates — query content tables directly for accurate dates (not admin_activity_log)
const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function formatArabicDate(isoDate: string): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!day || !month) return isoDate;
  return `${day} ${AR_MONTHS[month - 1]}`;
}

async function getUpdates() {
  try {
    if (!supabase) return [];

    // Query with 8s timeout — if Supabase is slow, render page without updates
    const result = await withTimeout(
      Promise.all([
        supabase
          .from('updates')
          .select('id, title, date, type')
          .eq('active', true)
          .eq('type', 'news')
          .order('date', { ascending: false })
          .limit(5),
        supabase
          .from('articles')
          .select('id, title, category, slug, created_at, image')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('consultant_scenarios')
          .select('id, title, created_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(5),
      ]),
      8000, // 8 second timeout
    );

    if (!result) {
      logger.warn('getUpdates: Supabase timeout (8s) — rendering without updates');
      return [];
    }

    const [manualRes, articlesRes, scenariosRes] = result;

    const today = new Date().toISOString().split('T')[0];

    const manualUpdates = (manualRes.data || [])
      .filter(u => u.date <= today)
      .map(u => ({ ...u, sortDate: u.date, date: formatArabicDate(u.date), source: 'manual' as const, href: `/updates/${u.id}` }));

    const articleUpdates = (articlesRes.data || []).map(a => ({
      id: a.id,
      title: a.title,
      date: formatArabicDate((a.created_at || '').split('T')[0]),
      sortDate: (a.created_at || '').split('T')[0],
      type: 'مقال',
      source: 'auto' as const,
      event_type: 'new_article',
      href: `/article/${a.slug || a.id}`,
      image: a.image || null,
    }));

    const scenarioUpdates = (scenariosRes.data || []).map(s => ({
      id: s.id,
      title: s.title,
      date: formatArabicDate((s.created_at || '').split('T')[0]),
      sortDate: (s.created_at || '').split('T')[0],
      type: 'سيناريو',
      source: 'auto' as const,
      event_type: 'new_scenario',
      href: `/consultant?scenario=${s.id}`,
    }));

    // Merge and sort by actual date descending, limit to 12
    const merged = [...manualUpdates, ...articleUpdates, ...scenarioUpdates]
      .sort((a, b) => (b.sortDate || '').localeCompare(a.sortDate || ''))
      .slice(0, 12);

    return merged;
  } catch (error) {
    logger.error('Error fetching updates:', error);
    return [];
  }
}

// Curated illustrated guides for the homepage "أدلّة عملية" row. The `steps`
// field exists on almost every article (it drives the HowTo schema), so it is
// NOT a guide marker on its own — we curate explicitly via the `دليل` tag and
// keep only entries that still have 3+ steps. Image is optional (the card
// falls back to a branded placeholder).
async function getFeaturedGuides(): Promise<FeaturedGuide[]> {
  try {
    if (!supabase) return [];
    const res = await withTimeout(
      supabase
        .from('articles')
        .select('id, title, slug, category, image, steps')
        .eq('status', 'approved')
        .contains('tags', ['دليل'])
        .order('created_at', { ascending: false })
        .limit(12),
      8000,
    );
    if (!res || !res.data) return [];
    return res.data
      .filter((a) => Array.isArray(a.steps) && a.steps.length >= 3)
      .slice(0, 6)
      .map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug || a.id,
        category: a.category || 'دليل',
        image: a.image || null,
        stepCount: a.steps.length,
      }));
  } catch (error) {
    logger.error('Error fetching featured guides:', error);
    return [];
  }
}

const HOME_DESCRIPTION = "دليلك الموثوق للعرب والسوريين في تركيا: الكملك والإقامة، الجنسية، جواز السفر والقنصلية، إذن العمل، والأكواد الأمنية — في اسطنبول وغازي عنتاب وأنقرة وبورصة.";

export const metadata: Metadata = {
  // Keyword-front-loaded homepage title. `absolute` bypasses the
  // "%s | brand" template so the brand isn't repeated twice. The homepage
  // is the site's most authoritative page; its title was brand-only and
  // ranked for nothing — now it carries the core query clusters.
  title: { absolute: 'دليل العرب والسوريين في تركيا 2026 — إقامات، أكواد أمنية، خدمات الكملك' },
  description: HOME_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'ar_TR',
    url: SITE_CONFIG.siteUrl,
    siteName: SITE_CONFIG.name,
    title: SITE_CONFIG.name,
    description: HOME_DESCRIPTION,
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: SITE_CONFIG.name }],
  },
};

// ============================================
// 🏠 Page Component
// ============================================

export default async function Home() {
  const [updates, guides] = await Promise.all([getUpdates(), getFeaturedGuides()]);

  const homeFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: TOP_FAQS.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <main className="flex flex-col min-h-screen font-cairo bg-transparent selection:bg-emerald-200 dark:selection:bg-emerald-700">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqSchema) }} />

      {/* News Ticker — homepage only */}
      <NewsTicker />

      {/* 1. HERO SECTION (Client) */}
      <HeroSection>
        {/* Search is ABOVE the button as requested */}
        <div id="search" className="w-full relative z-30 mb-5">
          <LazyGlobalSearch />
        </div>
        <HomeConsultantBtn />
      </HeroSection>

      {/* Trust signals right under the hero — three checkable chips
          (مصادر رسمية / تحديث مباشر / بالعربية للسوريين والعرب). A first-time,
          scam-wary visitor gets concrete credibility in the first seconds. */}
      <HeroTrustStrip />

      {/* Hero → "ابدأ من هنا" seam. Both surfaces are dark, so a single
          emerald hairline marks it without a heavy divider. */}
      <div className="relative h-px bg-transparent dark:bg-slate-800" aria-hidden="true">
        <div className="absolute inset-x-0 h-px bg-gradient-to-l from-transparent via-emerald-500/40 to-transparent" />
      </div>

      {/* Unified news + updates hub. Replaces the old stacked pair —
          the big FeaturedNewsHero breaking-news carousel AND the separate
          "آخر التحديثات" HomeUpdates row — which read as two near-identical
          news rails. NewsHub merges featured/breaking articles with the
          latest updates (de-duped), then NewsAndUpdates lays them out as a
          single horizontal scroll-snap rail of date-stamped cards. Renders
          nothing when there's no news at all. */}
      <NewsHub updates={updates} />

      {/* أدلّة عملية بالصور — illustrated step-by-step guides (HowTo). Hidden
          automatically when there are none. Sits in the light zone with the
          news feed, before the dark "رحلتك القانونية" transition. */}
      <FeaturedGuides guides={guides} />

      {/* Transition — light (news) → dark (journey). */}
      <div className="relative h-16 bg-gradient-to-b from-white to-emerald-50 dark:from-slate-950 dark:to-slate-950" aria-hidden="true">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-emerald-500/30 to-transparent" />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION — رحلتك القانونية (دليل المواقف)
          Placed BELOW the news feed, per the owner's request: the
          breaking-news carousel + "آخر التحديثات" lead the page, then
          the situation picker follows on its dark orientation surface.
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-b from-emerald-50 via-surface-light to-sky-50 text-slate-900 dark:bg-slate-950 dark:bg-none dark:text-white py-16 overflow-hidden" dir="rtl">
        <div aria-hidden="true" className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-gov-red via-brand-orange to-brand-blue z-20" />
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.20),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.15),_transparent_60%)]" />
        <div aria-hidden="true" className="absolute -top-20 right-0 text-[180px] sm:text-[240px] font-black text-emerald-500/[0.07] dark:text-white/[0.04] leading-none select-none pointer-events-none">01</div>
        <div className="relative max-w-7xl mx-auto px-4 mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles size={18} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-black tracking-[0.2em] uppercase text-emerald-600 dark:text-emerald-400">ابدأ من هنا</span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
            رحلتك <span className="bg-gradient-to-l from-emerald-600 via-teal-500 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">القانونية</span>
          </h2>
          <div className="mt-4 inline-block bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1.5">
            <p className="text-sm text-emerald-700 dark:text-emerald-100">اختر وضعك ومرحلتك في تركيا، ونعرض لك خطواتك المناسبة.</p>
          </div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4">
          <ScrollReveal>
            <GuidedJourney />
          </ScrollReveal>
        </div>
      </section>

      {/* Transition — dark (journey) → sky (tools). */}
      <div className="relative h-12 bg-gradient-to-b from-sky-50 to-emerald-50 dark:from-slate-950 dark:to-slate-900" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-cyan-500/30 to-transparent" />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3 — اختصارات سريعة
          Light playful surface — sky blue tints, friendly heading
          framed by parentheses for personality. Tools live in a grid
          with their own colors so this section feels like a
          dashboard, not just another article list.
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-b from-emerald-50/60 to-surface-light dark:from-slate-900 dark:to-slate-950 py-16" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Wrench size={18} />
            </span>
            <span className="text-[11px] font-black tracking-[0.2em] uppercase text-blue-600 dark:text-blue-400">TOOLBOX · صندوق الأدوات</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-50 leading-tight">
            <span className="text-slate-400 dark:text-slate-600 font-light">«</span>
            {' '}اختصارات سريعة{' '}
            <span className="text-slate-400 dark:text-slate-600 font-light">»</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
            حاسبات وأدوات قانونية تُجيبك في ثوانٍ بدلاً من ساعات بحث.
          </p>
        </div>
        <ScrollReveal>
          <QuickActionsGrid />
        </ScrollReveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4 — الأكثر سؤالاً
          Centered editorial pacing — a giant decorative quote mark
          behind the title to telegraph "FAQ / questions". Calm
          background on slate-50 lets the cards below pop.
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative bg-surface-light dark:bg-slate-900 py-16" dir="rtl">
        <div aria-hidden="true" className="absolute top-6 left-1/2 -translate-x-1/2 text-[200px] sm:text-[280px] font-black text-slate-200 dark:text-slate-800/40 leading-none select-none pointer-events-none">؟</div>
        <div className="relative max-w-3xl mx-auto px-4 text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-1.5 shadow-sm">
            <MessageCircleQuestion size={16} className="text-amber-500" />
            <span className="text-xs font-black tracking-wider text-slate-700 dark:text-slate-200">أسئلة الجمهور الأكثر تكراراً</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-slate-900 dark:text-slate-50">
            الأكثر <span className="text-amber-500">سؤالاً</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-500 dark:text-slate-400">
            الأجوبة الجاهزة على ما يتكرّر يومياً في صندوق الاستشارات.
          </p>
        </div>
        <ScrollReveal>
          <HomeFAQ />
        </ScrollReveal>
      </section>

    </main>
  );
}
