/**
 * 🏠 الصفحة الرئيسية (Server Component)
 * =================================
 * 
 * تم تحويلها بالكامل لتعمل على السيرفر لتحسين الأداء والـ SEO.
 * تم تحويلها بالكامل لتعمل على السيرفر لتحسين الأداء والـ SEO.
 */

export const revalidate = 300; // Cache for 5 minutes (ISR)

import { Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SITE_CONFIG } from '@/lib/config';

// Components
import HeroSection from '@/components/home/HeroSection';
import HomeUpdates from '@/components/home/HomeUpdates';
import GlobalSearch from '@/components/GlobalSearch';
import HomeConsultantBtn from '@/components/home/HomeConsultantBtn';
import { GuidedJourney, QuickActionsGrid, HomeFAQ } from '@/components/home/LazyBelowFold';

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

    // Query actual content tables — dates are always accurate
    const [manualRes, articlesRes, scenariosRes] = await Promise.all([
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
        .limit(10),
      supabase
        .from('consultant_scenarios')
        .select('id, title, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

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
    console.error('Error fetching updates:', error);
    return [];
  }
}

// ============================================
// 🔍 Schema.org
// ============================================
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_CONFIG.name,
  description: SITE_CONFIG.slogan,
  url: SITE_CONFIG.siteUrl,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_CONFIG.siteUrl}/logo.png`,
    width: 256,
    height: 256,
  },
  image: `${SITE_CONFIG.siteUrl}/og-image.jpg`,
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
      urlTemplate: `${SITE_CONFIG.siteUrl}/?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

const HOME_DESCRIPTION = "الدليل الشامل للعرب في تركيا. خدمات قانونية، إقامات، أكواد أمنية، ودليل شامل لكل ما تحتاجه.";

export const metadata = {
  title: SITE_CONFIG.name,
  description: HOME_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    description: HOME_DESCRIPTION,
  },
};

// ============================================
// 🏠 Page Component
// ============================================

export default async function Home() {
  const updates = await getUpdates();

  return (
    <main className="flex flex-col min-h-screen font-cairo bg-transparent selection:bg-emerald-200 dark:selection:bg-emerald-700">

      {/* Schema Scripts */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />

      {/* 1. HERO SECTION (Client) */}
      <HeroSection>
        {/* Search is ABOVE the button as requested */}
        <div id="search" className="w-full relative z-30 mb-8">
          <GlobalSearch variant="hero" />
        </div>
        <HomeConsultantBtn />
      </HeroSection>

      {/* 2. LATEST UPDATES — right after Hero, before Journey */}
      <Suspense fallback={<div className="h-40 bg-slate-100 rounded-xl animate-pulse"></div>}>
        <HomeUpdates updates={updates} />
      </Suspense>

      {/* 🧭 Guided Journey (Client) */}
      <GuidedJourney />

      {/* 3. QUICK ACTIONS (Client) */}
      <QuickActionsGrid />

      {/* 4. TOP FAQ — أكثر الأسئلة شيوعاً */}
      <HomeFAQ />

    </main>
  );
}
