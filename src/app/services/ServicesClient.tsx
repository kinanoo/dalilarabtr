'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, MapPin, Briefcase, X, LayoutGrid, List as ListIcon, ChevronRight, ChevronLeft, BadgeCheck, Info } from 'lucide-react';
import { SERVICE_CATEGORIES } from '@/lib/serviceCategories';
import { catIcon } from '@/lib/serviceCategoryIcons';
import CityFilter from '@/components/services/CityFilter';
import ProviderCard from '@/components/services/ProviderCard';
import ProviderRow from '@/components/services/ProviderRow';
import AddServiceBanner from '@/components/services/AddServiceBanner';
import {
  SERVICE_VERIFICATION_EXPLANATION,
  SERVICE_VERIFICATION_LABEL,
} from '@/lib/serviceVerification';
import {
  DIRECTORY_PAGE_SIZE,
  type DirectoryProvider,
} from '@/lib/serviceDirectory';

interface ServicesClientProps {
  initialServices?: DirectoryProvider[];
  initialTotal?: number;
  verifiedCount?: number;
  cityCounts?: Record<string, number>;
  categoryCounts?: Record<string, number>;
}

export default function ServicesClient({
  initialServices = [],
  initialTotal = 0,
  verifiedCount = 0,
  cityCounts = {},
  categoryCounts = {},
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
  const [page, setPage] = useState(1);
  const skippedInitialRequest = useRef(false);
  const availableCities = Object.keys(cityCounts);
  const totalCount = initialTotal;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  // Fetch only the requested result page. The unfiltered first page is already
  // in the server HTML, so initial paint needs no client round-trip.
  useEffect(() => {
    const isInitialView =
      page === 1 &&
      activeCategory === 'all' &&
      activeCity === 'all' &&
      debouncedSearch === '' &&
      sortBy === 'recommended';

    if (isInitialView && initialServices.length > 0 && !skippedInitialRequest.current) {
      skippedInitialRequest.current = true;
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      limit: String(DIRECTORY_PAGE_SIZE),
      sort: sortBy,
    });
    if (activeCategory !== 'all') params.set('category', activeCategory);
    if (activeCity !== 'all') params.set('city', activeCity);
    if (debouncedSearch) params.set('q', debouncedSearch);

    setLoading(true);
    setErrorMsg(null);
    fetch(`/api/services/directory?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'تعذّر تحميل الخدمات');
        setServices(Array.isArray(payload.rows) ? payload.rows : []);
        setResultTotal(Number(payload.total) || 0);
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

    return () => controller.abort();
  }, [
    activeCategory,
    activeCity,
    debouncedSearch,
    initialServices,
    initialTotal,
    page,
    sortBy,
  ]);

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
    verified: verifiedCount,
    cities: availableCities.length,
  };
  const totalPages = Math.max(1, Math.ceil(resultTotal / DIRECTORY_PAGE_SIZE));
  const pageClamped = Math.min(page, totalPages);
  const goPage = (pp: number) => {
    setPage(Math.min(Math.max(1, pp), totalPages));
    if (typeof document !== 'undefined') document.getElementById('svc-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo" dir="rtl">

      {/* Hero / Search Section */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-emerald-50 via-white to-sky-50 text-slate-900 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 dark:text-white pb-6 pt-5 lg:pb-8 lg:pt-8">

        {/* Official colour stripe — a hint of government red */}
        <div aria-hidden="true" className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-gov-red via-brand-orange to-brand-blue z-20" />

        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <h1 className="text-[30px] sm:text-4xl md:text-5xl font-black mb-3 md:mb-4 leading-tight animate-in slide-in-from-bottom-8 fade-in duration-700 delay-100 font-cairo">
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
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
                onChange={(city) => {
                  setActiveCity(city);
                  setPage(1);
                }}
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
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${activeCategory === cat.id
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                    : 'bg-white/70 text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-600 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700'
                    }`}
                >
                  <span>{cat.label}</span>
                  {cat.id !== 'all' && categoryCounts[cat.id] > 0 && (
                    <span className="mr-1 tabular-nums opacity-70">
                      {categoryCounts[cat.id]}
                    </span>
                  )}
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

      {/* Results */}
      <section id="svc-results" className="max-w-screen-2xl mx-auto px-4 py-8 md:py-10 w-full scroll-mt-4">

        {/* Results count + view toggle + clear filters */}
        {!loading && (
          <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                {resultTotal > 0 ? (
                  <>
                    عرض <span className="text-emerald-600 dark:text-emerald-400 tabular-nums font-black">{services.length}</span>
                    {' '}من <span className="tabular-nums font-black">{resultTotal}</span>
                    {' '}{hasActiveFilters ? 'نتيجة مطابقة' : 'مهنيّ وخدمة'}
                  </>
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
                  onChange={(e) => {
                    setSortBy(e.target.value as typeof sortBy);
                    setPage(1);
                  }}
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
      <section className="relative overflow-hidden border-t border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:bg-none dark:text-white py-16 text-center">
        <div aria-hidden="true" className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-gov-red via-brand-orange to-brand-blue z-20" />
        <div className="container mx-auto px-4 relative z-10 max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-black mb-6 leading-tight font-cairo text-slate-900 dark:text-white">
            هل تقدم خدمة وتريد <span className="text-emerald-600 dark:text-emerald-400">الوصول لآلاف العملاء؟</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-10 leading-relaxed">
            انضم إلى دليل العرب وقدّم خدمتك لجمهور عربي واسع في تركيا.
          </p>
          <Link
            href="/services/add"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-emerald-700 hover:scale-105 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
          >
            <Briefcase size={20} />
            أضف خدمتك مجاناً
          </Link>
        </div>
      </section>

    </div>
  );
}
