'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Search, MapPin, Briefcase, X, LayoutGrid, List as ListIcon, ChevronRight, ChevronLeft, BadgeCheck, TrendingUp, SlidersHorizontal, ArrowLeft, Sparkles } from 'lucide-react';
import { SERVICE_CATEGORIES } from '@/lib/serviceCategories';
import { catIcon } from '@/lib/serviceCategoryIcons';
import CityFilter from '@/components/services/CityFilter';
import ProviderCard from '@/components/services/ProviderCard';
import ProviderRow from '@/components/services/ProviderRow';
import AddServiceBanner from '@/components/services/AddServiceBanner';
import { SERVICE_VERIFICATION_LABEL } from '@/lib/serviceVerification';
import {
  DIRECTORY_PAGE_SIZE,
  type DirectoryPopularSearch,
  type DirectoryProvider,
} from '@/lib/serviceDirectory';

interface ServicesClientProps {
  initialServices?: DirectoryProvider[];
  initialTotal?: number;
  verifiedCount?: number;
  cityCounts?: Record<string, number>;
  categoryCounts?: Record<string, number>;
  initialPopularSearches?: DirectoryPopularSearch[];
}

export default function ServicesClient({
  initialServices = [],
  initialTotal = 0,
  verifiedCount = 0,
  cityCounts = {},
  categoryCounts = {},
  initialPopularSearches = [],
}: ServicesClientProps) {
  const [services, setServices] = useState<DirectoryProvider[]>(initialServices);
  const [resultTotal, setResultTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(initialServices.length === 0);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeCity, setActiveCity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recommended' | 'rating' | 'newest' | 'name'>('recommended');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [urlStateReady, setUrlStateReady] = useState(false);
  const [liveTotal, setLiveTotal] = useState(initialTotal);
  const [liveVerifiedCount, setLiveVerifiedCount] = useState(verifiedCount);
  const [liveCityCounts, setLiveCityCounts] = useState(cityCounts);
  const [liveCategoryCounts, setLiveCategoryCounts] = useState(categoryCounts);
  const [popularSearches, setPopularSearches] = useState(initialPopularSearches);
  const facetsLoadedRef = useRef(false);
  const availableCities = useMemo(() => Object.keys(liveCityCounts), [liveCityCounts]);
  const totalCount = liveTotal;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const query = params.get('q')?.trim() || '';
      const city = params.get('city')?.trim() || 'all';
      const category = params.get('category')?.trim() || 'all';
      const requestedSort = params.get('sort');
      const requestedPage = Number(params.get('page'));

      setSearchQuery(query);
      setDebouncedSearch(query);
      setActiveCity(city);
      setActiveCategory(category);
      if (requestedSort && ['recommended', 'rating', 'newest', 'name'].includes(requestedSort)) {
        setSortBy(requestedSort as typeof sortBy);
      }
      if (Number.isInteger(requestedPage) && requestedPage > 0) setPage(requestedPage);
      setUrlStateReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!urlStateReady) return;

    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      limit: String(DIRECTORY_PAGE_SIZE),
      sort: sortBy,
    });
    if (!facetsLoadedRef.current) params.set('facets', '1');
    if (activeCategory !== 'all') params.set('category', activeCategory);
    if (activeCity !== 'all') params.set('city', activeCity);
    if (debouncedSearch) params.set('q', debouncedSearch);

    const loadingTimer = window.setTimeout(() => {
      setLoading(true);
      setErrorMsg(null);
    }, 0);
    fetch(`/api/services/directory?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'تعذّر تحميل الخدمات');
        setServices(Array.isArray(payload.rows) ? payload.rows : []);
        setResultTotal(Number(payload.total) || 0);
        if (payload.facets && typeof payload.facets === 'object') {
          facetsLoadedRef.current = true;
          setLiveTotal(Number(payload.facets.directoryTotal) || Number(payload.total) || 0);
          setLiveVerifiedCount(Number(payload.facets.verifiedCount) || 0);
          setLiveCityCounts(payload.facets.cityCounts || {});
          setLiveCategoryCounts(payload.facets.categoryCounts || {});
          setPopularSearches(
            Array.isArray(payload.facets.popularSearches)
              ? payload.facets.popularSearches
              : [],
          );
        }
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setServices([]);
        setResultTotal(0);
        setErrorMsg(error instanceof Error ? error.message : 'تعذّر تحميل الخدمات');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => {
      window.clearTimeout(loadingTimer);
      controller.abort();
    };
  }, [
    activeCategory,
    activeCity,
    debouncedSearch,
    page,
    sortBy,
    urlStateReady,
  ]);

  useEffect(() => {
    if (!urlStateReady) return;
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (activeCity !== 'all') params.set('city', activeCity);
    if (activeCategory !== 'all') params.set('category', activeCategory);
    if (sortBy !== 'recommended') params.set('sort', sortBy);
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    window.history.replaceState(null, '', query ? `/services?${query}` : '/services');
  }, [activeCategory, activeCity, debouncedSearch, page, sortBy, urlStateReady]);

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

  // --- Filter state helpers ---
  const hasActiveFilters = activeCategory !== 'all' || activeCity !== 'all' || searchQuery.trim() !== '';
  const activeFiltersCount = [
    activeCategory !== 'all',
    activeCity !== 'all',
    searchQuery.trim() !== '',
  ].filter(Boolean).length;
  const clearFilters = () => {
    setActiveCategory('all');
    setActiveCity('all');
    setSearchQuery('');
    setPage(1);
  };

  // Grid/list preference is cosmetic, so it is restored after the first paint.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = localStorage.getItem('services_view');
      if (saved === 'list' || saved === 'grid') setView(saved);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const changeView = (v: 'grid' | 'list') => { setView(v); localStorage.setItem('services_view', v); };

  const stats = {
    total: totalCount,
    verified: liveVerifiedCount,
    cities: availableCities.length,
  };
  const activeCategoryLabel = activeCategory === 'all'
    ? ''
    : SERVICE_CATEGORIES.find((category) => category.name === activeCategory)?.labelAr
      || activeCategory;
  const totalPages = Math.max(1, Math.ceil(resultTotal / DIRECTORY_PAGE_SIZE));
  const pageClamped = Math.min(page, totalPages);
  const quickCategories = [
    { id: 'all', label: 'الكل' },
    ...SERVICE_CATEGORIES.filter((c) => c.popular).map((c) => ({ id: c.name, label: c.labelAr })),
  ];
  const featuredCategories = SERVICE_CATEGORIES.filter((c) => c.popular).slice(0, 8);
  const visiblePopularSearches = popularSearches.slice(0, 8);
  const applyCategory = (category: string) => {
    setActiveCategory(category);
    setPage(1);
    setFiltersOpen(false);
  };
  const goPage = (pp: number) => {
    setPage(Math.min(Math.max(1, pp), totalPages));
    if (typeof document !== 'undefined') document.getElementById('svc-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const scrollToResults = () => {
    if (typeof document !== 'undefined') document.getElementById('svc-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo" dir="rtl">

      <section className="relative overflow-hidden border-b border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
        <div aria-hidden="true" className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-gov-red via-brand-orange to-brand-blue" />

        <div className="mx-auto grid max-w-screen-2xl gap-6 px-4 py-6 md:py-8 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900/50">
              <Sparkles size={14} />
              دليل خدمات عربي في تركيا
            </span>
            <h1 className="mt-3 max-w-4xl text-[28px] font-black leading-tight sm:text-4xl lg:text-5xl">
              ابحث عن خدمة عربية قريبة منك وتواصل مباشرة
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              أطباء، محامون، مترجمون، عقارات، شحن، مطاعم وخدمات يومية في مدن تركيا. اكتب ما تحتاجه أو اختر المهنة والمدينة.
            </p>

            <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[minmax(0,1fr)_240px] lg:max-w-4xl">
              <div className="relative">
                <Search size={22} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="اكتب الخدمة: طبيب، ترجمة، عقارات، شحن..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="h-14 w-full rounded-xl border border-transparent bg-white pr-12 pl-4 text-base font-black text-slate-900 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/15 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <CityFilter
                compact
                value={activeCity}
                onChange={(city) => {
                  setActiveCity(city);
                  setPage(1);
                }}
                cities={availableCities}
                counts={liveCityCounts}
                totalCount={totalCount}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={scrollToResults}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
              >
                عرض النتائج
                <ArrowLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              >
                <SlidersHorizontal size={16} />
                كل الفلاتر
                {activeFiltersCount > 0 && (
                  <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex min-h-10 items-center rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-500 transition hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  مسح البحث والفلاتر
                </button>
              )}
            </div>
          </div>

          <aside className="hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:block">
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">لمحة سريعة</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white p-3 text-center ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
                <Briefcase size={16} className="mx-auto text-emerald-600" />
                <div className="mt-1 text-xl font-black tabular-nums">{stats.total}</div>
                <div className="text-[10px] font-bold text-slate-500">خدمة</div>
              </div>
              <div className="rounded-xl bg-white p-3 text-center ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
                <MapPin size={16} className="mx-auto text-gov-red" />
                <div className="mt-1 text-xl font-black tabular-nums">{stats.cities}</div>
                <div className="text-[10px] font-bold text-slate-500">مدينة</div>
              </div>
              <div className="rounded-xl bg-white p-3 text-center ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
                <BadgeCheck size={16} className="mx-auto text-blue-500" />
                <div className="mt-1 text-xl font-black tabular-nums">{stats.verified}</div>
                <div className="text-[10px] font-bold text-slate-500">{SERVICE_VERIFICATION_LABEL}</div>
              </div>
            </div>
            <p className="mt-3 text-xs font-bold leading-6 text-slate-500 dark:text-slate-400">
              اختر الخدمة ثم راسل مقدمها عبر واتساب. راجع التفاصيل واتفق على السعر قبل أي دفع.
            </p>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-screen-2xl px-4 py-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">اختصر الطريق</h2>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">أكثر أنواع الخدمات طلباً في الدليل.</p>
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm lg:hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <SlidersHorizontal size={15} />
            فلاتر
          </button>
        </div>

        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-8 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
          {featuredCategories.map((category) => {
            const Icon = catIcon(category.slug);
            const isActive = activeCategory === category.name;
            return (
              <button
                key={category.slug}
                type="button"
                onClick={() => applyCategory(category.name)}
                aria-pressed={isActive}
                className={`group flex min-h-[100px] w-32 shrink-0 flex-col items-start justify-between rounded-2xl border p-3 text-right transition-all active:scale-[0.98] lg:w-auto ${isActive
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-100 dark:ring-emerald-900'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
                }`}
              >
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white dark:bg-slate-800 dark:text-emerald-300'}`}>
                  <Icon size={19} />
                </span>
                <span>
                  <span className="block text-sm font-black leading-tight">{category.labelAr}</span>
                  <span className="mt-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {liveCategoryCounts[category.name] ? `${liveCategoryCounts[category.name]} نتيجة` : 'تصفّح'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className={`${filtersOpen ? 'block' : 'hidden'} mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900`}>
          <div className="grid gap-3 md:grid-cols-[240px_minmax(0,1fr)] md:items-start">
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-sm font-black text-slate-800 dark:text-slate-100">
                <MapPin size={15} className="text-gov-red" />
                المدينة
              </div>
              <CityFilter
                compact
                value={activeCity}
                onChange={(city) => {
                  setActiveCity(city);
                  setPage(1);
                }}
                cities={availableCities}
                counts={liveCityCounts}
                totalCount={totalCount}
              />
            </div>
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-sm font-black text-slate-800 dark:text-slate-100">
                <Briefcase size={15} className="text-emerald-600" />
                التخصص
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {quickCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => applyCategory(cat.id)}
                    className={`min-h-10 rounded-xl border px-3 text-xs font-black transition ${activeCategory === cat.id
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
                    }`}
                  >
                    {cat.label}
                    {cat.id !== 'all' && liveCategoryCounts[cat.id] > 0 && (
                      <span className="mr-1 tabular-nums opacity-70">{liveCategoryCounts[cat.id]}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {visiblePopularSearches.length > 0 && (
          <div className="mt-4 flex max-w-full items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-labelledby="popular-service-searches">
            <h2 id="popular-service-searches" className="inline-flex shrink-0 items-center gap-1.5 text-xs font-black text-slate-600 dark:text-slate-300">
              <TrendingUp size={15} className="text-emerald-600" />
              شائع
            </h2>
            {visiblePopularSearches.map((item) => (
              <Link
                key={`${item.citySlug}-${item.categorySlug}`}
                href={`/services/category/${item.categorySlug}/${item.citySlug}`}
                className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              >
                {item.categoryLabel} في {item.city}
                <span className="tabular-nums text-[10px] text-slate-400">{item.count}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Results */}
      <section id="svc-results" className="max-w-screen-2xl mx-auto px-4 pb-8 pt-3 md:pb-10 w-full scroll-mt-4">

        {/* Results count + view toggle + clear filters */}
        {!loading && (
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">الخدمات المتاحة</h2>
              <p
                className="mt-1 text-sm font-bold text-slate-600 dark:text-slate-300"
                aria-live="polite"
              >
                {resultTotal > 0 ? (
                  <>
                    عرض <span className="text-emerald-600 dark:text-emerald-400 tabular-nums font-black">{services.length}</span>
                    {' '}من <span className="tabular-nums font-black">{resultTotal}</span>
                    {' '}{hasActiveFilters ? 'نتيجة مطابقة' : 'مهنيّ وخدمة'}
                  </>
                ) : 'لا نتائج'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-500 transition-colors hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <X size={14} /> مسح
                </button>
              )}
              {services.length > 0 && (
                <>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as typeof sortBy);
                    setPage(1);
                  }}
                  aria-label="ترتيب النتائج"
                  className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <option value="recommended">الأكثر صلة</option>
                  <option value="rating">الأعلى تقييماً</option>
                  <option value="newest">الأحدث</option>
                  <option value="name">أبجديّاً</option>
                </select>
                <div className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
                  <button onClick={() => changeView('grid')} aria-label="عرض شبكة" className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${view === 'grid' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                    <LayoutGrid size={16} />
                  </button>
                  <button onClick={() => changeView('list')} aria-label="عرض قائمة" className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${view === 'list' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                    <ListIcon size={16} />
                  </button>
                </div>
                </>
              )}
            </div>
            </div>
          </div>
        )}

        {!loading && hasActiveFilters && (
          <div className="-mt-3 mb-5 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {activeCity !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  setActiveCity('all');
                  setPage(1);
                }}
                className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg bg-emerald-50 px-3 text-xs font-bold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
              >
                <MapPin size={13} />
                {activeCity}
                <X size={13} />
              </button>
            )}
            {activeCategory !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('all');
                  setPage(1);
                }}
                className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg bg-sky-50 px-3 text-xs font-bold text-sky-800 dark:bg-sky-950/30 dark:text-sky-300"
              >
                <Briefcase size={13} />
                {activeCategoryLabel}
                <X size={13} />
              </button>
            )}
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg bg-amber-50 px-3 text-xs font-bold text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
              >
                <Search size={13} />
                {searchQuery.trim()}
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {loading ? (
          // Full-height skeleton (not a tiny spinner) so the page keeps its
          // height during the client fetch — otherwise the browser's scroll
          // restoration on refresh overshoots a short page and jumps to the
          // bottom. Also nicer than a lone spinner.
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {services.map((provider) => (
                  <ProviderCard key={provider.id} p={provider} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                {services.map((provider) => (
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

      <AddServiceBanner />

      {/* Browse every profession — crawlable links to each landing page (each
          carries its own guide), and a full directory for users. Rendered in
          the server HTML so Google discovers all category pages from /services. */}
      <section className="mx-auto max-w-screen-2xl px-4 pb-10 pt-5 w-full">
        <details className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-base font-black text-slate-800 dark:text-slate-100">
              <Briefcase size={18} className="text-emerald-600" />
              تصفّح كل المهن والخدمات
            </span>
            <span className="text-xs font-black text-slate-500 group-open:hidden">فتح القائمة</span>
            <span className="hidden text-xs font-black text-slate-500 group-open:inline">إخفاء</span>
          </summary>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {SERVICE_CATEGORIES.map((c) => {
              const Icon = catIcon(c.slug);
              return (
                <Link
                  key={c.slug}
                  href={`/services/category/${c.slug}`}
                  className="group/link flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-emerald-300 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:hover:border-emerald-700 dark:hover:bg-slate-900"
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 ring-1 ring-slate-200 transition group-hover/link:bg-emerald-600 group-hover/link:text-white dark:bg-slate-900 dark:text-emerald-300 dark:ring-slate-800">
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-black leading-tight text-slate-800 dark:text-slate-100">{c.labelAr}</span>
                    <span className="block truncate text-[10px] font-bold leading-tight text-slate-400 dark:text-slate-500">
                      {liveCategoryCounts[c.name]
                        ? `${liveCategoryCounts[c.name]} نتيجة`
                        : c.blurb}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </details>
      </section>

    </div>
  );
}
