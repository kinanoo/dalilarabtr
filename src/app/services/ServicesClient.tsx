'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, MapPin, Briefcase, X, Loader2, LayoutGrid, List as ListIcon, ChevronRight, ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { canonicalCity } from '@/lib/turkishCities';
import ProviderCard from '@/components/services/ProviderCard';
import ProviderRow from '@/components/services/ProviderRow';
import ServiceProviderPopup from '@/components/services/ServiceProviderPopup';
import AddServiceBanner from '@/components/services/AddServiceBanner';
import logger from '@/lib/logger';

export default function ServicesClient() {
  // --- State ---
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeCity, setActiveCity] = useState('all');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extraCategories, setExtraCategories] = useState<string[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  // --- Category Mapping for Legacy Support ---
  const CATEGORY_MAPPING: Record<string, string[]> = {
    'طبيب': ['طبيب', 'Health', 'health', 'doctor', 'Doctor', 'medical'],
    'محامي': ['محامي', 'Lawyer', 'lawyer', 'legal', 'Legal'],
    'مترجم': ['مترجم', 'Translation', 'translation', 'Translator', 'translator'],
    'عقارات': ['عقارات', 'Real Estate', 'real_estate', 'housing'],
    'تعليم': ['تعليم', 'Education', 'education', 'student'],
    'تجميل': ['تجميل', 'Beauty', 'beauty', 'cosmetics'],
    'تأمين': ['تأمين', 'Insurance', 'insurance'],
    'سيارات': ['سيارات', 'Cars', 'cars', 'automotive'],
    'مطاعم': ['مطاعم', 'Restaurants', 'restaurants', 'food'],
    'شحن': ['شحن', 'Cargo', 'cargo', 'shipping'],
    'سياحة': ['سياحة', 'Tourism', 'tourism', 'travel'],
    'خدمات عامة': ['خدمات عامة', 'General', 'general', 'other'],
  };

  // --- Fetch Data ---
  const fetchServices = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    if (!supabase) return;

    let query = supabase
      .from('service_providers')
      .select('id, name, profession, category, description, city, phone, image, is_verified, rating, review_count, status, slug, created_at')
      .eq('status', 'approved')
      .order('is_verified', { ascending: false })
      .order('rating', { ascending: false });

    if (activeCategory !== 'all') {
      // Use mapped variations for known categories, or exact match for dynamic ones
      const validCategories = CATEGORY_MAPPING[activeCategory] || [activeCategory];
      query = query.in('category', validCategories);
    }

    if (searchQuery) {
      // Smart search across multiple columns
      // Note: We escape the search query to prevent injection in the OR syntax if needed, 
      // but Supabase client handles parameterization. 
      // However, for .or() raw string syntax, we strictly format it.
      const term = `%${searchQuery}%`;
      query = query.or(`name.ilike.${term},description.ilike.${term},profession.ilike.${term},category.ilike.${term}`);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Supabase Error:', error);
      setErrorMsg(error.message + ' (' + error.code + ')');
    }

    if (data) {
      // Collapse every city spelling (Istanbul / اسطنبول / إسطنبول / …) to one
      // canonical Arabic name so the dropdown + filter have no duplicates.
      const normalizedData = data.map((d: any) => ({ ...d, city: canonicalCity(d.city) || d.city }));

      // Extract unique cities and extra categories when loading all data
      if (activeCategory === 'all' && searchQuery === '' && activeCity === 'all') {
        const cities = Array.from(new Set(normalizedData.map((d: any) => d.city).filter(Boolean))) as string[];
        setAvailableCities(cities.sort());

        // Find categories in DB that aren't in the hardcoded list
        const knownValues = new Set(Object.values(CATEGORY_MAPPING).flat().map(v => v.toLowerCase()));
        const dbCategories = Array.from(new Set(normalizedData.map((d: any) => d.category).filter(Boolean))) as string[];
        const newCats = dbCategories.filter(c => !knownValues.has(c.toLowerCase()));
        setExtraCategories(newCats.sort());
      }

      // Hard-filter by the selected city (the primary filter for our users) —
      // show ONLY that city, not just reorder it to the front.
      let finalData = normalizedData;
      if (activeCity !== 'all') {
        finalData = normalizedData.filter((d: any) => d.city === activeCity);
      }

      setServices(finalData);
    }
    setLoading(false);
  }, [activeCategory, searchQuery, activeCity]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

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
  useEffect(() => { setPage(1); }, [activeCategory, activeCity, searchQuery]);

  // Client-side pagination — 50 providers in a city should be a few pages,
  // not an endless scroll.
  const totalPages = Math.max(1, Math.ceil(services.length / PER_PAGE));
  const pageClamped = Math.min(page, totalPages);
  const paged = services.slice((pageClamped - 1) * PER_PAGE, pageClamped * PER_PAGE);
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
            أطباء، محامون، مترجمون، عقارات، تأمين وشحن — مهنيّون عرب موثوقون في إسطنبول، غازي عنتاب، أنقرة، بورصة وكل المدن. تواصل مباشر عبر واتساب.
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
            <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[{ id: 'all', label: 'كل المدن' }, ...availableCities.map(c => ({ id: c, label: c }))].map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveCity(c.id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${activeCity === c.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/30'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:text-emerald-600 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700 dark:hover:border-emerald-700'
                    }`}
                >
                  <MapPin size={14} className={activeCity === c.id ? 'text-white' : 'text-slate-400'} />
                  {c.label}
                </button>
              ))}
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
                { id: 'طبيب', label: 'أطباء' },
                { id: 'محامي', label: 'محامون' },
                { id: 'مترجم', label: 'مترجمون' },
                { id: 'عقارات', label: 'عقارات' },
                { id: 'تعليم', label: 'طلاب' },
                { id: 'تجميل', label: 'تجميل' },
                { id: 'تأمين', label: 'تأمين' },
                { id: 'سيارات', label: 'سيارات' },
                { id: 'مطاعم', label: 'مطاعم' },
                { id: 'شحن', label: 'شحن' },
                { id: 'سياحة', label: 'سياحة' },
                { id: 'خدمات عامة', label: 'عامة' },
                ...extraCategories.map(c => ({ id: c, label: c })),
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setSearchQuery(''); }}
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

      {/* CTA banner: visible only to logged-in users */}
      <AddServiceBanner />

      {/* Debug Error Message */}
      {errorMsg && (
        <div className="max-w-4xl mx-auto mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center font-bold" dir="ltr">
          Debug Error: {errorMsg}
        </div>
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
              <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5">
                <button onClick={() => changeView('grid')} aria-label="عرض شبكة" className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                  <LayoutGrid size={16} />
                </button>
                <button onClick={() => changeView('list')} aria-label="عرض قائمة" className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                  <ListIcon size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>
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
            {errorMsg && <p className="text-red-500 font-mono mt-3 text-xs" dir="ltr">{errorMsg}</p>}
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

      {/* Popup Notification */}
      <ServiceProviderPopup />

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
