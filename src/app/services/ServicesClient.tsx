'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Search, MapPin, Briefcase, X, ChevronRight, ChevronLeft, BadgeCheck, TrendingUp, SlidersHorizontal, Sparkles, Stethoscope, Home, Truck, GraduationCap, HelpCircle, RefreshCw, CircleAlert } from 'lucide-react';
import { SERVICE_CATEGORIES } from '@/lib/serviceCategories';
import { catIcon } from '@/lib/serviceCategoryIcons';
import CityFilter from '@/components/services/CityFilter';
import CategoryFilterDialog from '@/components/services/CategoryFilterDialog';
import ProviderCard from '@/components/services/ProviderCard';
import AddServiceBanner from '@/components/services/AddServiceBanner';
import ServiceProviderInvite from '@/components/services/ServiceProviderInvite';
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

const QUICK_NEEDS = [
  { label: 'طبيب أسنان', query: 'طبيب أسنان', category: 'طب أسنان' },
  { label: 'محامي', query: 'محامي', category: 'محامي' },
  { label: 'مترجم', query: 'مترجم', category: 'مترجم' },
  { label: 'إقامة', query: 'إقامة', category: 'محامي' },
  { label: 'تأمين صحي', query: 'تأمين صحي', category: 'تأمين' },
  { label: 'عقارات', query: 'عقارات', category: 'عقارات' },
  { label: 'شحن', query: 'شحن', category: 'شحن' },
  { label: 'محاسب', query: 'محاسب', category: 'محاسبة' },
  { label: 'كهربائي', query: 'كهربائي', category: 'كهرباء' },
  { label: 'مطعم', query: 'مطعم', category: 'مطاعم' },
];

const SERVICE_INTENT_GROUPS = [
  {
    title: 'معاملة أو ورقة',
    text: 'إقامة، ترجمة، محامي، تأمين',
    icon: BadgeCheck,
    needs: [
      { label: 'إقامة', query: 'إقامة', category: 'محامي' },
      { label: 'ترجمة محلفة', query: 'ترجمة محلفة', category: 'مترجم' },
      { label: 'تأمين صحي', query: 'تأمين صحي', category: 'تأمين' },
    ],
  },
  {
    title: 'صحة وعلاج',
    text: 'طبيب، أسنان، تجميل',
    icon: Stethoscope,
    needs: [
      { label: 'طبيب', query: 'طبيب', category: 'طبيب' },
      { label: 'أسنان', query: 'أسنان', category: 'طب أسنان' },
      { label: 'تجميل', query: 'تجميل', category: 'تجميل' },
    ],
  },
  {
    title: 'بيت وسيارة',
    text: 'عقارات، صيانة، سيارات',
    icon: Home,
    needs: [
      { label: 'عقارات', query: 'عقارات', category: 'عقارات' },
      { label: 'صيانة', query: 'صيانة', category: 'صيانة منزلية' },
      { label: 'سيارات', query: 'سيارات', category: 'سيارات' },
    ],
  },
  {
    title: 'تجارة وشحن',
    text: 'شحن، محاسبة، استيراد',
    icon: Truck,
    needs: [
      { label: 'شحن', query: 'شحن', category: 'شحن' },
      { label: 'محاسب', query: 'محاسب', category: 'محاسبة' },
      { label: 'تصدير', query: 'تصدير', category: 'تخليص جمركي' },
    ],
  },
  {
    title: 'تعليم ويومي',
    text: 'جامعة، مطعم، حرفي',
    icon: GraduationCap,
    needs: [
      { label: 'جامعات', query: 'جامعات', category: 'تعليم' },
      { label: 'مطعم', query: 'مطعم', category: 'مطاعم' },
      { label: 'حرفي', query: 'حرفي', category: 'خدمات عامة' },
    ],
  },
];

const NEED_SEARCH_KEYS = new Set(
  [...QUICK_NEEDS, ...SERVICE_INTENT_GROUPS.flatMap((group) => group.needs)]
    .map((need) => `${need.query.trim()}|||${need.category.trim()}`),
);

const isPresetNeedSearch = (query: string, category: string): boolean =>
  NEED_SEARCH_KEYS.has(`${query.trim()}|||${category.trim()}`);

const normalizeSuggestionText = (value: string): string =>
  value
    .toLocaleLowerCase('ar')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .trim();

type SearchSuggestion = {
  key: string;
  label: string;
  hint: string;
  query: string;
  category: string;
  city?: string;
};

const SERVICES_FAQS = [
  {
    question: 'كيف أجد مقدم خدمة عربي في تركيا؟',
    answer: 'اكتب نوع الخدمة أو اختر المدينة والمهنة، ثم افتح بطاقة مقدم الخدمة للتواصل عبر واتساب أو الاتصال.',
  },
  {
    question: 'هل كل الخدمات في الدليل باللغة العربية؟',
    answer: 'يعرض الدليل مقدمي خدمات يعرّفون عن خدماتهم بالعربية أو يستهدفون الجمهور العربي في تركيا.',
  },
  {
    question: 'كيف أتحقق قبل التعامل مع مقدم الخدمة؟',
    answer: 'راجع التفاصيل، اسأل عن السعر والخطوات كتابة، ولا تدفع كامل المبلغ مسبقاً قبل التأكد من الخدمة والاتفاق.',
  },
  {
    question: 'هل يمكن البحث حسب المدينة والمهنة معاً؟',
    answer: 'نعم. اختر المدينة والمهنة من الصفحة أو افتح روابط الأدلة الجاهزة حسب المدينة والمهنة.',
  },
];

export default function ServicesClient({
  initialServices = [],
  initialTotal = 0,
  cityCounts = {},
  categoryCounts = {},
  initialPopularSearches = [],
}: ServicesClientProps) {
  const [services, setServices] = useState<DirectoryProvider[]>(initialServices);
  const [resultTotal, setResultTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(initialServices.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeCity, setActiveCity] = useState('all');
  const [draftCity, setDraftCity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recommended' | 'rating' | 'newest' | 'name'>('recommended');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [page, setPage] = useState(1);
  const [urlStateReady, setUrlStateReady] = useState(false);
  const [liveTotal, setLiveTotal] = useState(initialTotal);
  const [liveCityCounts, setLiveCityCounts] = useState(cityCounts);
  const [liveCategoryCounts, setLiveCategoryCounts] = useState(categoryCounts);
  const [popularSearches, setPopularSearches] = useState(initialPopularSearches);
  const servicesRef = useRef(initialServices);
  const hasInitialDirectoryRef = useRef(initialServices.length > 0);
  const facetsLoadedRef = useRef(
    Object.keys(cityCounts).length > 0 || Object.keys(categoryCounts).length > 0,
  );
  const initialDirectoryUsedRef = useRef(false);
  const availableCities = useMemo(() => Object.keys(liveCityCounts), [liveCityCounts]);
  const totalCount = liveTotal;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const query = params.get('q')?.trim() || '';
      const city = params.get('city')?.trim() || 'all';
      const category = params.get('category')?.trim() || 'all';
      const normalizedQuery = category !== 'all' && isPresetNeedSearch(query, category)
        ? ''
        : query;
      const requestedSort = params.get('sort');
      const requestedPage = Number(params.get('page'));

      setSearchQuery(normalizedQuery);
      setDebouncedSearch(normalizedQuery);
      setActiveCity(city);
      setDraftCity(city);
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
    if (!urlStateReady) return;

    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchQuery, urlStateReady]);

  useEffect(() => {
    if (!urlStateReady) return;

    const matchesInitialDirectory = page === 1 &&
      sortBy === 'recommended' &&
      activeCategory === 'all' &&
      activeCity === 'all' &&
      !debouncedSearch;
    if (!initialDirectoryUsedRef.current && hasInitialDirectoryRef.current && matchesInitialDirectory) {
      initialDirectoryUsedRef.current = true;
      return;
    }
    initialDirectoryUsedRef.current = true;

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

    const hasVisibleResults = servicesRef.current.length > 0;
    const loadingTimer = window.setTimeout(() => {
      setLoading(!hasVisibleResults);
      setRefreshing(hasVisibleResults);
      setErrorMsg(null);
    }, 0);
    fetch(`/api/services/directory?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'تعذّر تحميل الخدمات');
        const nextRows = Array.isArray(payload.rows) ? payload.rows : [];
        servicesRef.current = nextRows;
        setServices(nextRows);
        setResultTotal(Number(payload.total) || 0);
        setErrorMsg(null);
        if (payload.facets && typeof payload.facets === 'object') {
          facetsLoadedRef.current = true;
          setLiveTotal(Number(payload.facets.directoryTotal) || Number(payload.total) || 0);
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
        if (!hasVisibleResults) setResultTotal(0);
        setErrorMsg(error instanceof Error ? error.message : 'تعذّر تحميل الخدمات');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
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
    retryKey,
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
  const hasActiveFilters = activeCategory !== 'all' || activeCity !== 'all' || debouncedSearch !== '';
  const clearFilters = () => {
    setActiveCategory('all');
    setActiveCity('all');
    setDraftCity('all');
    setSearchQuery('');
    setDebouncedSearch('');
    setPage(1);
  };

  const activeCategoryLabel = activeCategory === 'all'
    ? ''
    : SERVICE_CATEGORIES.find((category) => category.name === activeCategory)?.labelAr
      || activeCategory;
  const totalPages = Math.max(1, Math.ceil(resultTotal / DIRECTORY_PAGE_SIZE));
  const pageClamped = Math.min(page, totalPages);
  const categoryFilterOptions = [
    { id: 'all', slug: 'all', label: 'كل التخصصات', count: totalCount },
    ...SERVICE_CATEGORIES
      .map((category) => ({
        id: category.name,
        slug: category.slug,
        label: category.labelAr,
        count: liveCategoryCounts[category.name] || 0,
      }))
      .filter((category) => category.count > 0),
  ];
  const directoryGuideLinks = popularSearches.slice(0, 24);
  const searchSuggestions = useMemo<SearchSuggestion[]>(() => {
    const rawQuery = searchQuery.trim();
    const normalizedQuery = normalizeSuggestionText(rawQuery);
    const defaultCity = draftCity !== 'all' ? draftCity : undefined;
    const suggestions: SearchSuggestion[] = [];
    const seen = new Set<string>();
    const addSuggestion = (item: SearchSuggestion) => {
      const key = `${item.query}|${item.category}|${item.city || ''}`;
      if (seen.has(key)) return;
      seen.add(key);
      suggestions.push(item);
    };

    const matchingNeeds = QUICK_NEEDS.filter((need) => {
      if (!normalizedQuery) return true;
      const haystack = normalizeSuggestionText(`${need.label} ${need.query} ${need.category}`);
      return haystack.includes(normalizedQuery) || normalizedQuery.includes(normalizeSuggestionText(need.label));
    });

    for (const need of matchingNeeds.slice(0, normalizedQuery ? 4 : 3)) {
      addSuggestion({
        key: `need-${need.label}-${defaultCity || 'all'}`,
        label: defaultCity ? `${need.label} في ${defaultCity}` : need.label,
        hint: defaultCity ? 'اقتراح سريع' : 'كل المدن',
        query: need.query,
        category: need.category,
        city: defaultCity,
      });
    }

    for (const category of SERVICE_CATEGORIES.filter((item) => item.popular)) {
      const haystack = normalizeSuggestionText(`${category.labelAr} ${category.name} ${category.keywords.join(' ')}`);
      if (normalizedQuery && !haystack.includes(normalizedQuery)) continue;
      addSuggestion({
        key: `cat-${category.slug}-${defaultCity || 'all'}`,
        label: defaultCity ? `${category.labelAr} في ${defaultCity}` : category.labelAr,
        hint: liveCategoryCounts[category.name] ? `${liveCategoryCounts[category.name]} نتيجة` : 'تخصص',
        query: '',
        category: category.name,
        city: defaultCity,
      });
      if (suggestions.length >= 6) break;
    }

    for (const item of popularSearches) {
      const haystack = normalizeSuggestionText(`${item.categoryLabel} ${item.category} ${item.city}`);
      if (normalizedQuery && !haystack.includes(normalizedQuery)) continue;
      addSuggestion({
        key: `popular-${item.categorySlug}-${item.citySlug}`,
        label: `${item.categoryLabel} في ${item.city}`,
        hint: `${item.count} نتيجة`,
        query: '',
        category: item.category,
        city: item.city,
      });
      if (suggestions.length >= 7) break;
    }

    if (rawQuery && suggestions.length < 7) {
      addSuggestion({
        key: `free-${rawQuery}-${draftCity}`,
        label: `البحث عن "${rawQuery}"`,
        hint: draftCity !== 'all' ? draftCity : 'كل المدن',
        query: rawQuery,
        category: activeCategory,
        city: draftCity !== 'all' ? draftCity : undefined,
      });
    }

    return suggestions.slice(0, 7);
  }, [activeCategory, draftCity, liveCategoryCounts, popularSearches, searchQuery]);
  const applyCategory = (category: string) => {
    setActiveCategory(category);
    setPage(1);
    setFiltersOpen(false);
  };
  const applySearchSuggestion = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.query);
    setDebouncedSearch(suggestion.query);
    setActiveCategory(suggestion.category);
    if (suggestion.city) {
      setActiveCity(suggestion.city);
      setDraftCity(suggestion.city);
    }
    setPage(1);
    setSearchFocused(false);
    window.setTimeout(scrollToResults, 40);
  };
  const goPage = (pp: number) => {
    setPage(Math.min(Math.max(1, pp), totalPages));
    if (typeof document !== 'undefined') document.getElementById('svc-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const scrollToResults = () => {
    if (typeof document !== 'undefined') document.getElementById('svc-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const submitSearch = () => {
    setDebouncedSearch(searchQuery.trim());
    setActiveCity(draftCity);
    setPage(1);
    setSearchFocused(false);
    window.setTimeout(scrollToResults, 40);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo" dir="rtl">

      <section className="relative z-30 overflow-visible border-b border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-emerald-600" />
        <div className="mx-auto max-w-7xl px-4 py-5 md:py-7">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-300">
              <Sparkles size={14} />
              خدمات العرب في تركيا
            </span>
            <h1 className="mt-2 text-[26px] font-black leading-tight tracking-normal text-slate-950 sm:text-4xl dark:text-white">
              دليل المهن والخدمات العربية في تركيا
            </h1>
            <p className="mx-auto mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-600 sm:text-base dark:text-slate-300">
              اكتب ما تحتاجه واختر مدينتك لنظهر لك مقدمي الخدمة المناسبين.
            </p>
          </div>

          <form
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
            className="mx-auto mt-4 grid max-w-4xl grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_220px]"
          >
            <div className="relative z-50">
              <Search size={20} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={searchFocused && searchSuggestions.length > 0}
                aria-controls="service-search-suggestions"
                placeholder="ما الخدمة التي تبحث عنها؟"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => window.setTimeout(() => setSearchFocused(false), 140)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    submitSearch();
                  }
                  if (event.key === 'Escape') setSearchFocused(false);
                }}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setPage(1);
                }}
                className="h-[52px] w-full rounded-xl border border-slate-200 bg-white pr-11 pl-4 text-sm font-black text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:h-14 sm:text-base"
              />
              {searchFocused && searchSuggestions.length > 0 && (
                <div
                  id="service-search-suggestions"
                  role="listbox"
                  className="absolute inset-x-0 top-[calc(100%+8px)] z-[70] max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 text-right shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                >
                  {searchSuggestions.slice(0, 6).map((suggestion) => (
                    <button
                      key={suggestion.key}
                      type="button"
                      role="option"
                      aria-selected="false"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => applySearchSuggestion(suggestion)}
                      className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-right transition hover:bg-slate-100 active:bg-emerald-50 dark:hover:bg-slate-800 dark:active:bg-emerald-950/30"
                    >
                      <Search size={15} className="shrink-0 text-emerald-600" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-slate-900 dark:text-slate-100">{suggestion.label}</span>
                        <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">{suggestion.hint}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative z-30">
              <CityFilter
                compact
                value={draftCity}
                onChange={(city) => {
                  setDraftCity(city);
                  setActiveCity(city);
                  setPage(1);
                  setSearchFocused(false);
                }}
                cities={availableCities}
                counts={liveCityCounts}
                totalCount={totalCount}
              />
            </div>
          </form>
        </div>
      </section>

      <CategoryFilterDialog
        open={filtersOpen}
        value={activeCategory}
        options={categoryFilterOptions}
        onChange={applyCategory}
        onClose={() => setFiltersOpen(false)}
      />

      {/* Results */}
      <section id="svc-results" className="mx-auto w-full max-w-7xl scroll-mt-4 px-4 pb-8 pt-4 md:pb-10">

        {/* Results count, sorting, and filters */}
        {(!loading || services.length > 0) && (
          <div className="relative z-20 mb-3 overflow-hidden rounded-lg border border-slate-200 bg-white/95 p-2.5 shadow-sm backdrop-blur md:sticky md:top-[52px] md:p-3 dark:border-slate-800 dark:bg-slate-900/95">
            {refreshing && (
              <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-emerald-100 dark:bg-emerald-950">
                <div className="h-full w-1/3 animate-[pulse_1s_ease-in-out_infinite] bg-emerald-600" />
              </div>
            )}
            <div className="flex flex-row flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-base font-black text-slate-900 md:text-xl dark:text-slate-100">الخدمات المتاحة</h2>
              <p
                className="mt-0.5 text-xs font-bold text-slate-600 md:text-sm dark:text-slate-300"
                aria-live="polite"
              >
                {resultTotal > 0 ? (
                  <>
                    عرض <span className="text-emerald-600 dark:text-emerald-400 tabular-nums font-black">{services.length}</span>
                    {' '}من <span className="tabular-nums font-black">{resultTotal}</span>
                    {' '}{hasActiveFilters ? 'نتيجة مطابقة' : 'خدمة متاحة'}
                  </>
                ) : 'لا نتائج'}
                {refreshing && <span className="mr-2 text-emerald-700 dark:text-emerald-300">يتم التحديث...</span>}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={filtersOpen}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-700 transition hover:border-emerald-300 hover:bg-white hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <SlidersHorizontal size={15} />
                {activeCategoryLabel || 'التخصص'}
                {activeCategory !== 'all' && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
                )}
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-500 transition-colors hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
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
                  className="h-10 cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <option value="recommended">الأكثر صلة</option>
                  <option value="rating">الأعلى تقييماً</option>
                  <option value="newest">الأحدث</option>
                  <option value="name">أبجديّاً</option>
                </select>
                </>
              )}
            </div>
            </div>
          </div>
        )}

        {!loading && hasActiveFilters && (
          <div className="-mt-1 mb-4 flex flex-wrap items-center gap-2">
            {activeCity !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  setActiveCity('all');
                  setDraftCity('all');
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
                className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-3 text-xs font-bold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
              >
                <Briefcase size={13} />
                {activeCategoryLabel}
                <X size={13} />
              </button>
            )}
            {debouncedSearch && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearch('');
                  setPage(1);
                }}
                className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-3 text-xs font-bold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
              >
                <Search size={13} />
                {debouncedSearch}
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {errorMsg && services.length > 0 && (
          <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-100">
            <span className="inline-flex items-center gap-2 text-xs font-bold sm:text-sm">
              <CircleAlert size={17} className="shrink-0" />
              تعذّر تحديث النتائج. أبقينا آخر نتائج ناجحة ظاهرة بدلاً من إخفائها.
            </span>
            <button
              type="button"
              onClick={() => setRetryKey((key) => key + 1)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-amber-900 px-3 text-xs font-black text-white transition hover:bg-amber-800 active:scale-[0.98] dark:bg-amber-200 dark:text-amber-950"
            >
              <RefreshCw size={14} />
              إعادة المحاولة
            </button>
          </div>
        )}

        {loading ? (
          // Full-height skeleton (not a tiny spinner) so the page keeps its
          // height during the client fetch — otherwise the browser's scroll
          // restoration on refresh overshoots a short page and jumps to the
          // bottom. Also nicer than a lone spinner.
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
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
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">
              {errorMsg ? <CircleAlert size={28} /> : <Search size={28} />}
            </div>
            <h3 className="text-lg font-black text-slate-700 dark:text-slate-200">
              {errorMsg ? 'تعذّر تحميل دليل الخدمات' : 'لا توجد نتائج مطابقة'}
            </h3>
            <p className="mb-5 mt-1 text-sm text-slate-500">
              {errorMsg ? 'لم نعرض رسالة نتائج فارغة لأن الطلب لم يكتمل. جرّب مرة أخرى.' : 'جرّب كلمة مختلفة أو تصفّح كل المهن والخدمات.'}
            </p>
            {errorMsg ? (
              <button onClick={() => setRetryKey((key) => key + 1)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-800 active:scale-95">
                <RefreshCw size={15} /> إعادة المحاولة
              </button>
            ) : hasActiveFilters && (
              <button onClick={clearFilters} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-800 active:scale-95">
                <X size={15} /> تصفّح كل الخدمات
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {services.map((provider) => (
                <ProviderCard key={provider.id} p={provider} />
              ))}
            </div>

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
                          ? 'bg-emerald-700 text-white'
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

      <section className="mx-auto max-w-screen-2xl px-4 pb-5 pt-1 w-full">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-1">
            <h2 className="inline-flex items-center gap-2 text-base font-black text-slate-900 dark:text-slate-100">
              <HelpCircle size={18} className="text-emerald-600" />
              أسئلة سريعة قبل التواصل
            </h2>
            <p className="text-xs font-bold leading-6 text-slate-500 dark:text-slate-400">
              معلومات مختصرة تساعدك تختار الخدمة وتتواصل بأمان.
            </p>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {SERVICES_FAQS.map((item) => (
              <details
                key={item.question}
                className="group rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-slate-800 dark:text-slate-100">
                  <span>{item.question}</span>
                  <ChevronLeft size={16} className="shrink-0 text-slate-400 transition group-open:-rotate-90 group-open:text-emerald-600" />
                </summary>
                <p className="mt-2 text-xs font-bold leading-6 text-slate-600 dark:text-slate-300">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <AddServiceBanner />

      <ServiceProviderInvite />

      {directoryGuideLinks.length > 0 && (
        <section className="mx-auto max-w-screen-2xl px-4 pb-4 pt-1 w-full">
          <details className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="min-w-0">
                <span className="inline-flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-100 sm:text-base">
                  <TrendingUp size={18} className="text-emerald-600" />
                  أدلة سريعة حسب المدينة والمهنة
                </span>
                <span className="mt-1 block text-xs font-bold leading-5 text-slate-500 dark:text-slate-400">
                  روابط مرتبة لمن يبحث مباشرة مثل: أطباء في إسطنبول، مترجمون في مرسين، محامون في عنتاب.
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-600 group-open:hidden dark:bg-slate-800 dark:text-slate-300">
                فتح
              </span>
              <span className="hidden shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-600 group-open:inline-flex dark:bg-slate-800 dark:text-slate-300">
                إخفاء
              </span>
            </summary>
            <div className="mt-4 flex flex-wrap gap-2">
              {directoryGuideLinks.map((item) => (
                <Link
                  key={`guide-${item.citySlug}-${item.categorySlug}`}
                  href={`/services/category/${item.categorySlug}/${item.citySlug}`}
                  className="inline-flex min-h-9 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/20"
                >
                  <span>{item.categoryLabel} في {item.city}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">
                    {item.count}
                  </span>
                </Link>
              ))}
            </div>
          </details>
        </section>
      )}

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
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 ring-1 ring-slate-200 transition group-hover/link:bg-emerald-700 group-hover/link:text-white dark:bg-slate-900 dark:text-emerald-300 dark:ring-slate-800">
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-black leading-tight text-slate-800 dark:text-slate-100">{c.labelAr}</span>
                    <span className="block truncate text-[10px] font-bold leading-tight text-slate-400 dark:text-slate-400">
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
