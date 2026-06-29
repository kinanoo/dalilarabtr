'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, MapPin, PhoneCall, MessageCircle, Briefcase, Star, X, Loader2, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
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
      // Normalize city names to prevent duplicates like "Istanbul", "إسطنبول", "اسطنبول"
      const normalizedData = data.map((d: any) => {
        let normalizedCity = d.city;
        if (typeof normalizedCity === 'string') {
          const lowerCity = normalizedCity.toLowerCase().trim();
          if (lowerCity === 'istanbul' || lowerCity === 'إسطنبول' || lowerCity === 'اسطنبول') {
            normalizedCity = 'اسطنبول';
          }
          if (lowerCity === 'gaziantep' || lowerCity === 'غازي عنتاب') {
            normalizedCity = 'غازي عنتاب';
          }
        }
        return { ...d, city: normalizedCity };
      });

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

      // Filter by city client-side - but order the selected city FIRST rather than simply filtering out matching cities!
      let finalData = normalizedData;
      if (activeCity !== 'all') {
        const cityMatches = normalizedData.filter((d: any) => d.city === activeCity);
        const others = normalizedData.filter((d: any) => d.city !== activeCity);
        finalData = [...cityMatches, ...others];
      }

      // Sort exact city matches or bring them to front if we wanted soft matching, but hard filter is better here
      setServices(finalData);
    }
    setLoading(false);
  }, [activeCategory, searchQuery, activeCity]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // --- WhatsApp Helper ---
  const buildWhatsAppHref = (phone: string, text: string) => {
    if (!phone) return '';
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  // --- Filter state helpers ---
  const hasActiveFilters = activeCategory !== 'all' || activeCity !== 'all' || searchQuery !== '';
  const clearFilters = () => {
    setActiveCategory('all');
    setActiveCity('all');
    setSearchQuery('');
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

          {/* Quick Filters */}
          <div className="flex flex-wrap justify-center gap-2 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-500">
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
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${activeCategory === cat.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/30 scale-105 dark:bg-white dark:text-slate-900 dark:border-white'
                  : 'bg-white/70 text-slate-700 border-slate-200 hover:bg-white hover:border-emerald-300 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-slate-500'
                  }`}
              >
                {cat.label}
              </button>
            ))}

            {/* City Dropdown Filter */}
            <div className="relative inline-block mt-2 lg:mt-0 lg:ms-2">
              <select
                value={activeCity}
                onChange={(e) => setActiveCity(e.target.value)}
                className="appearance-none px-4 py-2 pr-8 rounded-lg text-xs font-bold border bg-white/70 text-slate-700 border-slate-200 hover:bg-white dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">كل المدن</option>
                {availableCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <MapPin size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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

      {/* Results Grid */}
      <section className="max-w-screen-2xl mx-auto px-4 py-12 w-full">

        {/* Results count + clear filters */}
        {!loading && (
          <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {services.map((provider) => {
              const hasReviews = !!(provider.review_count && provider.review_count > 0);
              return (
              <div
                key={provider.id}
                className="group relative bg-gradient-to-br from-white to-slate-50/60 dark:from-slate-900 dark:to-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-400 hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                {/* Top accent stripe — verified providers get a blue-to-
                    emerald gradient marking their trust status at a
                    glance; everyone else gets a faint slate strip so
                    the card still has the framing without claiming
                    verification. Same accent-stripe pattern as
                    UpdateCard, ToolCard, CategoryTile, article hero. */}
                <div
                  aria-hidden="true"
                  className={`absolute top-0 inset-x-0 h-1 ${
                    provider.is_verified
                      ? 'bg-gradient-to-l from-blue-400 via-emerald-400 to-teal-400'
                      : 'bg-slate-200/70 dark:bg-slate-800/40'
                  }`}
                />

                {/* Verified badge — Lucide icon instead of the previous
                    typo'd "موتق ✅". Stays in the top-left corner so it
                    aligns with the accent stripe above. */}
                {provider.is_verified && (
                  <div className="absolute top-3 left-3 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase border border-blue-500/30 z-10 flex items-center gap-1 backdrop-blur-sm shadow-sm">
                    <CheckCircle size={10} /> موثّق
                  </div>
                )}

                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center shrink-0 overflow-hidden border border-emerald-100/60 dark:border-slate-700 relative shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
                      {provider.image ? (
                        <Image
                          src={provider.image}
                          alt={provider.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('fallback-shown');
                          }}
                        />
                      ) : null}
                      {/* Fallback icon always present underneath or toggled on error */}
                      <Briefcase size={22} className="text-emerald-500/70 dark:text-emerald-400/60 absolute z-[-1] [.fallback-shown_&]:z-10" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-slate-900 dark:text-slate-100 text-base leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                        <Link href={`/services/${provider.id}`} className="hover:underline">
                          {provider.name}
                        </Link>
                      </h3>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 line-clamp-1">{provider.profession}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        {hasReviews ? (
                          <div className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/40 px-1.5 py-0.5 rounded-full">
                            <Star size={10} className="fill-amber-400 text-amber-400" />
                            <span className="text-[11px] text-amber-700 dark:text-amber-300 font-black tabular-nums">{provider.rating ? Number(provider.rating).toFixed(1) : '5.0'}</span>
                            <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70 tabular-nums">({provider.review_count})</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200/60 dark:border-emerald-800/40 px-2 py-0.5 rounded-full uppercase tracking-wide">جديد</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-grow">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium">
                    <MapPin size={14} className="text-emerald-500/70 dark:text-emerald-400/60" />
                    <span>{provider.city} {provider.district && `، ${provider.district}`}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed h-[40px]">
                    {provider.description || 'اضغط لعرض التفاصيل الكاملة...'}
                  </p>
                </div>

                {/* Footer Buttons — primary (WhatsApp) gets gradient +
                    emerald glow; secondary (details) is ghost so the
                    eye lands on the contact action first */}
                <div className="p-3 bg-slate-50/80 dark:bg-slate-900/50 mt-auto border-t border-slate-100 dark:border-slate-800">
                  <div className="flex gap-2">
                    <a
                      href={buildWhatsAppHref(provider.phone, `مرحباً، رأيت خدمتك "${provider.profession}" على موقع دليل العرب.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-l from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-2.5 rounded-xl font-black transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40 active:scale-95 text-xs"
                    >
                      <MessageCircle size={15} />
                      واتساب
                    </a>
                    {provider.phone && (
                      <a
                        href={`tel:${provider.phone}`}
                        aria-label={`اتصال بـ ${provider.name}`}
                        className="flex items-center justify-center gap-1.5 px-4 bg-white dark:bg-slate-800/60 text-emerald-700 dark:text-emerald-400 py-2.5 rounded-xl font-black text-xs border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 active:scale-95 transition-all"
                      >
                        <PhoneCall size={15} />
                        اتصال
                      </a>
                    )}
                  </div>
                  <Link
                    href={`/services/${provider.id}`}
                    className="mt-2 block text-center text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    عرض كل التفاصيل
                  </Link>
                </div>
              </div>
            );})}
          </div>
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
