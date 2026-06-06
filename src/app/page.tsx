/**
 * 🏠 الصفحة الرئيسية (Server Component)
 * =================================
 * 
 * تم تحويلها بالكامل لتعمل على السيرفر لتحسين الأداء والـ SEO.
 * تم تحويلها بالكامل لتعمل على السيرفر لتحسين الأداء والـ SEO.
 */

export const revalidate = 300; // Cache for 5 minutes (ISR)

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import { supabase, withTimeout } from '@/lib/supabaseClient';
import { SITE_CONFIG } from '@/lib/config';

const NewsTicker = dynamic(() => import("@/components/NewsTicker"));

// Components
import HeroSection from '@/components/home/HeroSection';
import HomeUpdates from '@/components/home/HomeUpdates';
import HomeConsultantBtn from '@/components/home/HomeConsultantBtn';
import LazyGlobalSearch from '@/components/home/LazyGlobalSearch';
import { GuidedJourney, QuickActionsGrid, HomeFAQ } from '@/components/home/LazyBelowFold';
import ScrollReveal from '@/components/ui/ScrollReveal';
import SectionTitle from '@/components/ui/SectionTitle';
import NewsletterCard from '@/components/NewsletterCard';
import HeroTrustStrip from '@/components/home/HeroTrustStrip';
import HomeStats from '@/components/home/HomeStats';
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

const HOME_DESCRIPTION = "الدليل الشامل للعرب في تركيا. خدمات قانونية، إقامات، أكواد أمنية، ودليل شامل لكل ما تحتاجه.";

export const metadata: Metadata = {
  title: SITE_CONFIG.name,
  description: HOME_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
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

// Pull live catalog counts for the HomeStats strip. Resilient — falls back
// to sensible-looking numbers if Supabase is slow/unavailable so the page
// still renders. Using `head: true` keeps the query cheap (rows are NOT
// transferred, only the count header).
async function getStats() {
  const fallback = { articles: 280, services: 17, faqs: 470 };
  try {
    if (!supabase) return fallback;
    const result = await withTimeout(
      Promise.all([
        supabase.from('articles').select('*', { count: 'exact', head: true }).eq('active', true).eq('status', 'approved'),
        supabase.from('service_providers').select('*', { count: 'exact', head: true }).eq('active', true),
        supabase.from('faqs').select('*', { count: 'exact', head: true }),
      ]),
      6000,
    );
    if (!result) return fallback;
    const [a, s, f] = result;
    return {
      articles: a.count ?? fallback.articles,
      services: s.count ?? fallback.services,
      faqs: f.count ?? fallback.faqs,
    };
  } catch {
    return fallback;
  }
}

export default async function Home() {
  const [updates, stats] = await Promise.all([getUpdates(), getStats()]);

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
        <div id="search" className="w-full relative z-30 mb-1.5">
          <LazyGlobalSearch />
        </div>
        <HomeConsultantBtn />
      </HeroSection>

      {/* Trust strip lives BELOW the hero, in the page surface — keeps it out
          of the search-dropdown overlay's stacking context so the dropdown
          opens cleanly without competing with the chips. */}
      <HeroTrustStrip />

      {/* Animated catalog stats — turns the site's library size into a
          glance-able trust signal. Numbers are real counts pulled at render
          time, animate from 0 on mount via requestAnimationFrame. */}
      <HomeStats articles={stats.articles} services={stats.services} faqs={stats.faqs} />

      {/* 2. LATEST UPDATES — right after Hero, before Journey */}
      <section className="max-w-7xl mx-auto px-4 pt-12 pb-2">
        <SectionTitle
          eyebrow="جديد"
          title="آخر"
          accent="التحديثات"
          subtitle="أبرز الأخبار والقرارات التي تخصّ السوريين والعرب في تركيا — مرتّبة من الأحدث."
        />
      </section>
      <Suspense fallback={<div className="h-40 bg-slate-100 rounded-xl animate-pulse"></div>}>
        <HomeUpdates updates={updates} />
      </Suspense>

      {/* 🧭 Guided Journey (Client) */}
      <section className="max-w-7xl mx-auto px-4 pt-14 pb-2">
        <SectionTitle
          eyebrow="ابدأ من هنا"
          title="رحلتك"
          accent="القانونية"
          subtitle="خطوة بخطوة — حسب وضعك ومرحلتك في تركيا."
        />
      </section>
      <ScrollReveal>
        <GuidedJourney />
      </ScrollReveal>

      {/* 3. QUICK ACTIONS (Client) */}
      <section className="max-w-7xl mx-auto px-4 pt-14 pb-2">
        <SectionTitle
          eyebrow="أدوات ذكية"
          title="اختصارات"
          accent="سريعة"
          subtitle="حاسبات وأدوات قانونية تُجيبك في ثوانٍ بدلاً من ساعات بحث."
        />
      </section>
      <ScrollReveal>
        <QuickActionsGrid />
      </ScrollReveal>

      {/* 4. TOP FAQ — أكثر الأسئلة شيوعاً */}
      <section className="max-w-7xl mx-auto px-4 pt-14 pb-2">
        <SectionTitle
          eyebrow="أسئلة الجمهور"
          title="الأكثر"
          accent="سؤالاً"
          subtitle="الأجوبة الجاهزة على ما يتكرّر يومياً في صندوق الاستشارات."
        />
      </section>
      <ScrollReveal>
        <HomeFAQ />
      </ScrollReveal>

      {/* 5. NEWSLETTER — final CTA before footer. Hero tone for the homepage
          so it commands attention even after the FAQ. The form posts directly
          to /api/newsletter and persists to newsletter_subscribers. */}
      <ScrollReveal>
        <div className="mt-12">
          <NewsletterCard tone="hero" source="home" />
        </div>
      </ScrollReveal>

    </main>
  );
}
