'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, MapPin, Briefcase, X, LayoutGrid, List as ListIcon, ChevronRight, ChevronLeft, BadgeCheck, Sparkles, Info } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { canonicalCity } from '@/lib/turkishCities';
import { SERVICE_CATEGORIES, CATEGORY_VARIANTS } from '@/lib/serviceCategories';
import { catIcon } from '@/lib/serviceCategoryIcons';
import CityFilter from '@/components/services/CityFilter';
import ProviderAvatar from '@/components/services/ProviderAvatar';
import ProviderCard from '@/components/services/ProviderCard';
import ProviderRow from '@/components/services/ProviderRow';
import AddServiceBanner from '@/components/services/AddServiceBanner';
import logger from '@/lib/logger';
import { SERVICE_VERIFICATION_EXPLANATION, SERVICE_VERIFICATION_LABEL } from '@/lib/serviceVerification';

export default function ServicesClient({ initialServices = [] }: { initialServices?: any[] }) {
  // The server (page.tsx) fetches the FULL approved directory once, ISR-cached,
  // and passes it here as `initialServices`. When present we never touch
  // Supabase from the browser: filtering, search, city + sort all run in memory
  // over this seed (the list is small). This kills the per-visit + per-filter
  // egress that used to re-pull the whole service_providers table from every
  // client, and puts every provider card in the server HTML (crawlable).
  const hasSeed = initialServices.length > 0;

  // Normalize the seed's city spellings once (Istanbul/اسطنبول/إسطنبول → one).
  const seed = useMemo(
    () => initialServices.map((d: any) => ({ ...d, city: canonicalCity(d.city) || d.city })),
    [initialServices]
  );

  // --- State ---
  // `rawData` = the full approved list (unfiltered). Seeded from the server;
  // only fetched client-side as a FALLBACK when the server seed is empty
  // (e.g. the build-time fetch failed) so the page still works standalone.
  const [rawData, setRawData] = useState<any[]>(seed);
  const [loading, setLoading] = useState(!hasSeed);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeCity, setActiveCity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recommended' | 'rating' | 'newest' | 'name'>('recommended');
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  // --- Category Mapping ---
  // Canonical Arabic category → every DB spelling it might hold, derived from
  // the shared taxonomy (src/lib/serviceCategories.ts) so this filter, the
  // landing pages, and the sitemap never drift. Module constant = stable ref.
  const CATEGORY_MAPPING = CATEGORY_VARIANTS;

  // --- Fallback fetch (only when the server seed is empty) ---
  // Runs at most once. With a healthy seed this never touches the network.
  useEffect(() => {
    if (hasSeed || !supabase) { setLoading(false); return; }
    let alive = true;
    setLoading(true);
    (async () => {
      const BASE = 'id, name, profession, category, description, city, phone, image, is_verified, rating, review_count, status, slug, created_at';
      // Featured-first if the column exists; fall back to base if the
      // monetization migration hasn't been run yet (so the list never breaks).
      let res: { data: unknown; error: any } = await supabase!
        .from('service_providers')
        .select(`${BASE}, is_featured`)
        .eq('status', 'approved')
        .order('is_featured', { ascending: false })
        .order('is_verified', { ascending: false })
        .order('rating', { ascending: false })
        .limit(500);
      if (res.error) {
        res = await supabase!
          .from('service_providers')
          .select(BASE)
          .eq('status', 'approved')
          .order('is_verified', { ascending: false })
          .order('rating', { ascending: false })
          .limit(500);
      }
      if (!alive) return;
      if (res.error) { logger.error('Supabase Error:', res.error); setErrorMsg(res.error.message + ' (' + res.error.code + ')'); }
      setRawData(((res.data as any[]) || []).map((d: any) => ({ ...d, city: canonicalCity(d.city) || d.city })));
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [hasSeed]);

  // Cities + per-city counts + extra (dynamic) categories — derived from the
  // FULL unfiltered snapshot so counts never undercount.
  const { availableCities, cityCounts, totalCount, extraCategories } = useMemo(() => {
    const cities = Array.from(new Set(rawData.map((d: any) => d.city).filter(Boolean))) as string[];
    const counts: Record<string, number> = {};
    rawData.forEach((d: any) => { if (d.city) counts[d.city] = (counts[d.city] || 0) + 1; });
    const knownValues = new Set(Object.values(CATEGORY_MAPPING).flat().map(v => v.toLowerCase()));
    const dbCategories = Array.from(new Set(rawData.map((d: any) => d.category).filter(Boolean))) as string[];
    const newCats = dbCategories.filter(c => !knownValues.has(c.toLowerCase()));
    return { availableCities: cities.sort(), cityCounts: counts, totalCount: rawData.length, extraCategories: newCats.sort() };
  }, [rawData, CATEGORY_MAPPING]);

  // The displayed list — category + search + city applied client-side over the
  // full seed (mirrors the old server query: category = exact `.in()` variants,
  // search = case-insensitive substring across the same 4 fields, city = exact).
  const services = useMemo(() => {
    let list = rawData;
    if (activeCategory !== 'all') {
      const valid = new Set(CATEGORY_MAPPING[activeCategory] || [activeCategory]);
      list = list.filter((d: any) => d.category && valid.has(d.category));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((d: any) =>
        [d.name, d.description, d.profession, d.category].some(
          (f) => f && String(f).toLowerCase().includes(q)
        )
      );
    }
    if (activeCity !== 'all') {
      list = list.filter((d: any) => d.city === activeCity);
    }
    return list;
  }, [rawData, activeCategory, searchQuery, activeCity, CATEGORY_MAPPING]);

  // /services builds its list client-side, so on a hard refresh the browser's
  // scroll restoration overshoots the (briefly short) page and jumps to the
  // bottom. Turn off auto-restoration for this route and pin to the top; the
  // tall skeleton keeps it flicker-free. Restored to 'auto' on leave.
  useEffect(() => {
    const h = typeof window !== 'undefined' ? window.history : null;
    if (h && 'scrollRestoration' in h) h.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    return () => { if (h && 'scrollRestoration' in h) h.scrollRestoration = 'auto'; };
  }, []);

  // Newest providers for the "أضيفوا حديثاً" discovery strip (filter-independent) —
  // derived from the same seed, newest first. No extra Supabase round-trip.
  const recent = useMemo(
    () => [...rawData]
      .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 10),
    [rawData]
  );

  // --- Filter state helpers ---
  const hasActiveFilters = activeCategory !== 'all' || activeCity !== 'all' || searchQuery !== '';
  const clearFilters = () => {
    setActiveCategory('all');
    setActiveCity('all');
    setSearchQuery('');
  };

  // Grid/list preference (persisted) + reset to page 1 when results change.
  useEffect(() => {
    const saved = localStorage.getItem('services_view');
    if (saved === 'list' || saved === 'grid') setView(saved);
  }, []);
  const changeView = (v: 'grid' | 'list') => { setView(v); localStorage.setItem('services_view', v); };
  useEffect(() => { setPage(1); }, [activeCategory, activeCity, searchQuery, sortBy]);

  // Sort (memoised; 'recommended' keeps the query order = verified first, then
  // top-rated). Then paginate so a 50-in-a-city list is a few pages.
  const sorted = useMemo(() => {
    const arr = [...services];
    if (sortBy === 'rating') arr.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    else if (sortBy === 'newest') arr.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    else if (sortBy === 'name') arr.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ar'));
    return arr;
  }, [services, sortBy]);

  // Trust strip stats (social proof) from the current result set.
  const stats = useMemo(() => ({
    total: services.length,
    verified: services.filter((s: { is_verified?: boolean }) => s.is_verified).length,
    cities: new Set(services.map((s: { city?: string }) => s.city).filter(Boolean)).size,
  }), [services]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const pageClamped = Math.min(page, totalPages);
  const paged = sorted.slice((pageClamped - 1) * PER_PAGE, pageClamped * PER_PAGE);
  const goPage = (pp: number) => {
    setPage(Math.min(Math.max(1, pp), totalPages));
    if (typeof document !== 'undefined') document.getElementById('svc-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo" dir="rtl">

      {/* Hero / Search Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-surface-light to-sky-50 text-slate-900 dark:from-slate-900 dark:via-emerald-950 dark:to-slate-950 dark:text-white pb-8 pt-6 lg:pt-8">

        {/* Official colour stripe — a hint of government red */}
        <div aria-hidden="true" className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-gov-red via-brand-orange to-brand-blue z-20" />

        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 dark:opacity-10 pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-emerald-500 blur-[120px]" />
          <div className="absolute top-[40%] -left-[10%] w-[400px] h-[400px] rounded-full bg-blue-600 blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight animate-in slide-in-from-bottom-8 fade-in duration-700 delay-100 font-cairo">
            دليل <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400">المهن والخدمات العربية</span> في تركيا
          </h1>

          <p className="text-base text-slate-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto leading-relaxed animate-in slide-in-from-bottom-8 fade-in duration-700 delay-200">
            أطباء، محامون، مترجمون، عقارات، تأمين وشحن — مقدمو خدمات عرب في إسطنبول، غازي عنتاب، أنقرة، بورصة وكل المدن. تواصل مباشر عبر واتساب.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto mb-8 group animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300">
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
              <Search size={24} />
            </div>
            <input
              type="text"
              placeholder="عن ماذا تبحث؟ (مثال: طبيب أسنان...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pr-12 pl-4 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 font-bold text-base shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/30 transition-all border-none"
            />
          </div>

          {/* City — the PRIMARY filter (most important axis for our users) */}
          <div className="mt-1 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-400">
            <div className="flex items-center justify-center gap-1.5 mb-2.5">
              <MapPin size={15} className="text-gov-red" />
              <span className="text-sm font-black text-slate-800 dark:text-slate-100">اختر مدينتك</span>
            </div>
            <div className="max-w-2xl mx-auto">
              <CityFilter
                value={activeCity}
                onChange={setActiveCity}
                cities={availableCities}
                counts={cityCounts}
                totalCount={totalCount}
              />
            </div>
          </div>

          {/* Profession — secondary filter */}
          <div className="mt-4 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-500">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <Briefcase size={12} className="text-slate-400" />
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wide">التخصّص</span>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {[
                { id: 'all', label: 'الكل' },
                // Quick-filter chips = the most-searched professions; the full
                // taxonomy is browsable in the "كل المهن" grid below.
                ...SERVICE_CATEGORIES.filter((c) => c.popular).map((c) => ({ id: c.name, label: c.labelAr })),
                ...extraCategories.map(c => ({ id: c, label: c })),
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${activeCategory === cat.id
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                    : 'bg-white/70 text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-600 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip — social proof from the current result set */}
      {!loading && stats.total > 0 && (
        <div className="container mx-auto px-4 max-w-6xl mt-4">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3 text-sm shadow-sm">
            <span className="inline-flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200"><Briefcase size={15} className="text-emerald-600" /><span className="tabular-nums font-black">{stats.total}</span> مهنيّ وخدمة</span>
            <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <span className="inline-flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200" title={SERVICE_VERIFICATION_EXPLANATION}><BadgeCheck size={15} className="text-blue-500" /><span className="tabular-nums font-black">{stats.verified}</span> {SERVICE_VERIFICATION_LABEL}</span>
            <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <span className="inline-flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200"><MapPin size={15} className="text-gov-red" /><span className="tabular-nums font-black">{stats.cities}</span> مدينة</span>
          </div>
          <p className="mt-2 flex items-start justify-center gap-1.5 text-center text-[11px] leading-5 text-slate-500 dark:text-slate-400">
            <Info size={13} className="mt-0.5 shrink-0 text-blue-500" aria-hidden="true" />
            {SERVICE_VERIFICATION_EXPLANATION}
          </p>
        </div>
      )}

      {/* CTA banner */}
      <AddServiceBanner />

      {/* Recently added — discovery strip (hidden while filtering) */}
      {!hasActiveFilters && recent.length > 0 && (
        <section className="max-w-screen-2xl mx-auto px-4 pt-8 w-full">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-amber-500" />
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">أضيفوا حديثاً</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {recent.map((r) => (
              <Link
                key={r.id}
                href={`/services/${r.slug || r.id}`}
                className="shrink-0 w-40 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all flex flex-col items-center text-center gap-2"
              >
                <div className="relative">
                  <ProviderAvatar name={r.name} image={r.image} className="w-12 h-12 rounded-xl" />
                  {r.is_verified && (
                    <span className="absolute -bottom-1 -left-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm" title={SERVICE_VERIFICATION_EXPLANATION} aria-label={`${SERVICE_VERIFICATION_LABEL}: ${SERVICE_VERIFICATION_EXPLANATION}`}>
                      <BadgeCheck size={13} className="text-blue-500" aria-hidden="true" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 w-full">
                  <p className="text-xs font-black text-slate-900 dark:text-slate-100 line-clamp-1">{r.name}</p>
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 line-clamp-1">{r.profession}</p>
                </div>
                <span className="text-[9px] font-black text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200/60 dark:border-amber-800/40 px-2 py-0.5 rounded-full uppercase tracking-wide">جديد</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Results */}
      <section id="svc-results" className="max-w-screen-2xl mx-auto px-4 py-12 w-full scroll-mt-4">

        {/* Results count + view toggle + clear filters */}
        {!loading && (
          <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                {services.length > 0 ? (
                  <>عرض <span className="text-emerald-600 dark:text-emerald-400 tabular-nums font-black">{services.length}</span> {hasActiveFilters ? 'نتيجة مطابقة' : 'مهنيّ وخدمة'}</>
                ) : 'لا نتائج'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <X size={14} /> مسح الفلاتر
                </button>
              )}
            </div>
            {services.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  aria-label="ترتيب النتائج"
                  className="text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="recommended">الأفضل أولاً</option>
                  <option value="rating">الأعلى تقييماً</option>
                  <option value="newest">الأحدث</option>
                  <option value="name">أبجديّاً</option>
                </select>
                <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5">
                  <button onClick={() => changeView('grid')} aria-label="عرض شبكة" className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                    <LayoutGrid size={16} />
                  </button>
                  <button onClick={() => changeView('list')} aria-label="عرض قائمة" className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                    <ListIcon size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          // Full-height skeleton (not a tiny spinner) so the page keeps its
          // height during the client fetch — otherwise the browser's scroll
          // restoration on refresh overshoots a short page and jumps to the
          // bottom. Also nicer than a lone spinner.
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                  </div>
                </div>
                <div className="mt-3 h-9 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 mb-4">
              <Search size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-700 dark:text-slate-200">لا توجد نتائج مطابقة</h3>
            <p className="text-slate-500 text-sm mt-1 mb-5">جرّب كلمة مختلفة أو تصفّح كل المهن والخدمات.</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors active:scale-95">
                <X size={15} /> تصفّح كل الخدمات
              </button>
            )}
            {errorMsg && <p className="text-slate-400 text-xs mt-3">تعذّر تحميل الخدمات الآن — حدّث الصفحة أو حاول لاحقاً.</p>}
          </div>
        ) : (
          <>
            {view === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {paged.map((provider) => (
                  <ProviderCard key={provider.id} p={provider} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                {paged.map((provider) => (
                  <ProviderRow key={provider.id} p={provider} />
                ))}
              </div>
            )}

            {/* Pagination — keeps a 50-per-city list to a few pages */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-10">
                <button
                  onClick={() => goPage(pageClamped - 1)}
                  disabled={pageClamped <= 1}
                  aria-label="السابق"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:border-emerald-300 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === totalPages || Math.abs(n - pageClamped) <= 1)
                  .map((n, idx, arr) => (
                    <span key={n} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== n - 1 && <span className="px-1 text-slate-400">…</span>}
                      <button
                        onClick={() => goPage(n)}
                        className={`min-w-9 h-9 px-2 rounded-lg text-sm font-black transition-colors ${n === pageClamped
                          ? 'bg-emerald-600 text-white'
                          : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-300'}`}
                      >
                        {n}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => goPage(pageClamped + 1)}
                  disabled={pageClamped >= totalPages}
                  aria-label="التالي"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:border-emerald-300 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Browse every profession — crawlable links to each landing page (each
          carries its own guide), and a full directory for users. Rendered in
          the server HTML so Google discovers all category pages from /services. */}
      <section className="max-w-screen-2xl mx-auto px-4 pb-4 w-full">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase size={18} className="text-emerald-600" />
          <h2 className="text-base font-black text-slate-800 dark:text-slate-100">تصفّح كل المهن والخدمات</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {SERVICE_CATEGORIES.map((c) => {
            const Icon = catIcon(c.slug);
            return (
              <Link
                key={c.slug}
                href={`/services/category/${c.slug}`}
                className="group flex items-center gap-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all"
              >
                <span className="inline-flex items-center justify-center w-9 h-9 shrink-0 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Icon size={17} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-black text-slate-800 dark:text-slate-100 leading-tight truncate">{c.labelAr}</span>
                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-tight truncate">{c.blurb}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-surface-light to-sky-50 text-slate-900 dark:bg-slate-900 dark:bg-none dark:text-white py-16 text-center shadow-2xl">
        <div aria-hidden="true" className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-gov-red via-brand-orange to-brand-blue z-20" />
        {/* Background Decor */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
          <div className="absolute top-[-50%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500 blur-[100px] mix-blend-screen" />
          <div className="absolute bottom-[-50%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-600 blur-[120px] mix-blend-screen" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        </div>

        <div className="container mx-auto px-4 relative z-10 max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-black mb-6 leading-tight font-cairo text-slate-900 dark:text-white">
            هل تقدم خدمة وتريد <span className="text-emerald-600 dark:text-emerald-400">الوصول لآلاف العملاء؟</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-10 leading-relaxed">
            انضم إلى دليل العرب وقدّم خدمتك لجمهور عربي واسع في تركيا.
          </p>
          <Link
            href="/join"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-emerald-700 hover:scale-105 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
          >
            <Briefcase size={20} />
            أضف خدمتك مجاناً
          </Link>
        </div>
      </section>

      {/* Image Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <button onClick={() => setPreviewImage(null)} aria-label="إغلاق المعاينة" className="absolute top-4 right-4 text-white"><X size={32} /></button>
          <div className="relative max-w-full max-h-[90vh] w-auto h-auto">
            <Image
              src={previewImage}
              alt="Preview"
              width={1200}
              height={800}
              className="rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '100%', maxHeight: '90vh', width: 'auto', height: 'auto' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
