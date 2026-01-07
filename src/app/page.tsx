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

// 2. Updates
async function getUpdates() {
  // const supabase = createClient(); // Removed
  try {
    if (!supabase) return [];
    const { data: updates } = await supabase
      .from('updates')
      .select('id, title, date, type')
      .eq('active', true)
      .eq('type', 'news') // Only show news updates in the log
      .order('date', { ascending: false })
      .limit(5);

    // Filter out updates with future dates
    const today = new Date().toISOString().split('T')[0];
    const validUpdates = (updates || []).filter(u => u.date <= today);

    return validUpdates;
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

export const metadata = {
  title: `${SITE_CONFIG.name} | ${SITE_CONFIG.slogan}`,
  description: "الدليل الشامل للعرب في تركيا. خدمات قانونية، إقامات، أكواد أمنية، ودليل شامل لكل ما تحتاجه.",
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

      {/* 🧭 Guided Journey (Client) */}
      <GuidedJourney />

      {/* 2. LATEST UPDATES (Server) - Moved Here */}
      <Suspense fallback={<div className="h-40 bg-slate-100 rounded-xl animate-pulse"></div>}>
        <HomeUpdates updates={updates} />
      </Suspense>

      {/* 3. CATEGORIES (Server) */}
      <Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-600" /></div>}>
        <HomeCategories categories={categories} />
      </Suspense>

      {/* 4. QUICK ACTIONS (Client) */}
      <QuickActionsGrid />



    </main>
  );
}
