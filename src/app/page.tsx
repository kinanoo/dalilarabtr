/**
 * 🏠 الصفحة الرئيسية (Server Component)
 * =================================
 * 
 * تم تحويلها بالكامل لتعمل على السيرفر لتحسين الأداء والـ SEO.
 * تم تحويلها بالكامل لتعمل على السيرفر لتحسين الأداء والـ SEO.
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SITE_CONFIG, CATEGORY_SLUGS } from '@/lib/config';
import { LATEST_UPDATES } from '@/lib/constants';

// Components
import HeroSection from '@/components/home/HeroSection';
import QuickActionsGrid from '@/components/home/QuickActionsGrid';
import HomeCategories from '@/components/home/HomeCategories';
import HomeUpdates from '@/components/home/HomeUpdates';
import GlobalSearch from '@/components/GlobalSearch';
import HomeConsultantBtn from '@/components/home/HomeConsultantBtn';
import GuidedJourney from '@/components/GuidedJourney';
import ShareMenu from '@/components/ShareMenu';
import { Loader2 } from 'lucide-react';

// ============================================
// 📦 Data Fetching (Server-Side)
// ============================================

// 1. Categories
async function getCategories() {
  // Static Fallback
  const staticCats = Object.entries(CATEGORY_SLUGS).map(([slug, title], idx) => ({
    id: `cat-${idx}`,
    slug,
    title,
    description: '',
    icon: 'FileText', // Default icon mapping key, refined in HomeCategories
    active: true,
    sort_order: idx
  }));

  try {
    if (!supabase) return staticCats;

    const { data } = await supabase
      .from('service_categories')
      .select('*')
      .eq('is_featured', true)
      // .eq('active', true) // REMOVED: Column might not exist
      .order('sort_order');

    if (data && data.length > 0) return data;
    return staticCats;
  } catch (error) {
    return staticCats;
  }
}

// 2. Updates (manual + auto events from activity log)
const PUBLIC_EVENT_TYPES = ['new_article', 'new_scenario', 'new_faq', 'new_code', 'new_zone', 'new_update', 'new_service', 'new_tool', 'new_source'];

const AUTO_EVENT_CONFIG: Record<string, { type: string; href: (entityId: string) => string }> = {
  new_article:  { type: 'مقال',      href: (id) => `/article/${id}` },
  new_scenario: { type: 'سيناريو',   href: (id) => `/consultant?scenario=${id}` },
  new_faq:      { type: 'سؤال',      href: () => `/faq` },
  new_code:     { type: 'كود أمني',   href: () => `/security-codes` },
  new_zone:     { type: 'منطقة',     href: () => `/zones` },
  new_update:   { type: 'خبر',       href: (id) => `/updates/${id}` },
  new_service:  { type: 'خدمة',      href: (id) => `/services/${id}` },
  new_tool:     { type: 'أداة',      href: () => `/tools` },
  new_source:   { type: 'مصدر رسمي', href: () => `/sources` },
};

async function getUpdates() {
  try {
    if (!supabase) return [];

    // Fetch manual news + auto events in parallel
    const [manualRes, autoRes] = await Promise.all([
      supabase
        .from('updates')
        .select('id, title, date, type')
        .eq('active', true)
        .eq('type', 'news')
        .order('date', { ascending: false })
        .limit(5),
      supabase
        .from('admin_activity_log')
        .select('id, event_type, title, entity_id, created_at')
        .in('event_type', PUBLIC_EVENT_TYPES)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const manualUpdates = (manualRes.data || [])
      .filter(u => u.date <= today)
      .map(u => ({ ...u, source: 'manual' as const, href: `/updates/${u.id}` }));

    const autoEvents = (autoRes.data || []).map(e => {
      const cfg = AUTO_EVENT_CONFIG[e.event_type];
      return {
        id: e.id,
        title: e.title,
        date: e.created_at.split('T')[0],
        type: cfg?.type || 'تحديث',
        source: 'auto' as const,
        event_type: e.event_type,
        href: cfg?.href(e.entity_id || '') || '/updates',
      };
    });

    // Merge and sort by date descending, limit to 10
    const merged = [...manualUpdates, ...autoEvents]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);

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

const HOME_DESCRIPTION = "الدليل الشامل للعرب في تركيا. خدمات قانونية، إقامات، أكواد أمنية، ودليل شامل لكل ما تحتاجه.";

export const metadata = {
  title: `${SITE_CONFIG.name} | ${SITE_CONFIG.slogan}`,
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
  // Parallel fetching
  const [categories, updates] = await Promise.all([
    getCategories(),
    getUpdates()
  ]);

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

      {/* 3. CATEGORIES (Server) */}
      <Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-600" /></div>}>
        <HomeCategories categories={categories} />
      </Suspense>

      {/* 4. QUICK ACTIONS (Client) */}
      <QuickActionsGrid />



    </main>
  );
}
