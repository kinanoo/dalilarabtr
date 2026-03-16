'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

import PageHero from '@/components/PageHero';
import HeroSearchInput from '@/components/HeroSearchInput';
import { MapPin, ShieldAlert, Building2, ChevronLeft } from 'lucide-react';
import logger from '@/lib/logger';

type ClosedAreaItem = {
  c: string; // City
  d: string; // District
  n: string; // Neighborhood (Mahalle)
  slug?: string;
  id?: string;
};

type ClosedAreasPayload = {
  updatedAt?: string;
  source?: string;
  items: ClosedAreaItem[];
};

function normalizeText(text: string): string {
  if (!text) return '';

  // Turkish-aware lowercasing (important for İ/ı)
  let normalized = text.toLocaleLowerCase('tr').trim();

  // Remove Arabic diacritics
  normalized = normalized.replace(/[\u064B-\u065F\u0670]/g, '');

  // Normalize Arabic letters
  normalized = normalized
    .replace(/(آ|إ|أ)/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي');

  // Normalize Turkish letters
  normalized = normalized
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o');

  // Collapse spaces
  normalized = normalized.replace(/\s+/g, ' ');

  return normalized;
}

export default function ZonesPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [data, setData] = useState<ClosedAreasPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Autofocus on first visit (mobile-friendly)
    inputRef.current?.focus();
  }, []);

  const normalizedQuery = useMemo(() => normalizeText(query), [query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim().length > 0) {
      // Redirect raw query to Server Page (Smart Routing)
      router.push(`/zones/${query.trim()}`);
    }
  };

  useEffect(() => {
    if (data) return;

    let active = true;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        if (!supabase) throw new Error('Supabase client not initialized');

        let allRows: any[] = [];
        let from = 0;
        const step = 1000;
        let more = true;

        while (more) {
          const { data: rows, error } = await supabase
            .from('zones')
            .select('city, district, neighborhood, updated_at') // Removed slug, id to fix fetch error
            .eq('status', 'closed')
            .range(from, from + step - 1);

          if (error) throw error;

          if (rows && rows.length > 0) {
            allRows = [...allRows, ...rows];
            if (rows.length < step) {
              more = false;
            } else {
              from += step;
            }
          } else {
            more = false;
          }
        }

        // Map to client format
        const items: ClosedAreaItem[] = allRows.map((r: any) => ({
          c: r.city,
          d: r.district,
          n: r.neighborhood
          // slug/id removed
        }));

        // Get latest update date
        const latestInfo = allRows.length > 0
          ? new Date(Math.max(...allRows.map((r: any) => new Date(r.updated_at).getTime()))).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

        const payload: ClosedAreasPayload = {
          updatedAt: latestInfo,
          source: 'Admin Panel (Live DB)',
          items
        };

        if (active) setData(payload);
      } catch (error) {
        if (active) setLoadError('تعذر تحميل قاعدة البيانات.');
        logger.error(error);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [data]);

  const items = data?.items ?? [];

  const matches = useMemo(() => {
    if (!normalizedQuery) return [] as ClosedAreaItem[];
    if (!items.length) return [] as ClosedAreaItem[];

    const result: ClosedAreaItem[] = [];
    for (const zone of items) {
      if (
        normalizeText(zone.n).includes(normalizedQuery) ||
        normalizeText(zone.d).includes(normalizedQuery) ||
        normalizeText(zone.c).includes(normalizedQuery)
      ) {
        result.push(zone);
        if (result.length >= 100) break;
      }
    }
    return result;
  }, [items, normalizedQuery]);

  const totalMatches = useMemo(() => {
    if (!normalizedQuery) return 0;
    if (!items.length) return 0;

    let count = 0;
    for (const zone of items) {
      if (
        normalizeText(zone.n).includes(normalizedQuery) ||
        normalizeText(zone.d).includes(normalizedQuery) ||
        normalizeText(zone.c).includes(normalizedQuery)
      ) {
        count += 1;
      }
    }
    return count;
  }, [items, normalizedQuery]);

  // City statistics for browsing grid
  const cityStats = useMemo(() => {
    if (!items.length) return [];
    const map = new Map<string, { count: number; districts: Set<string> }>();
    for (const zone of items) {
      const existing = map.get(zone.c) || { count: 0, districts: new Set<string>() };
      existing.count += 1;
      existing.districts.add(zone.d);
      map.set(zone.c, existing);
    }
    return Array.from(map.entries())
      .map(([city, stats]) => ({ city, count: stats.count, districtCount: stats.districts.size }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  const showResults = normalizedQuery.length > 0;
  const hasData = items.length > 0;

  return (
    <main className="flex flex-col min-h-screen font-cairo">
      <PageHero
        title="فاحص المناطق المحظورة (الرسمي)"
        description="ابحث باسم الحي (Mahalle) أو المنطقة (İlçe) أو الولاية."
        icon={<ShieldAlert className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      >
        <HeroSearchInput
          value={query}
          onChange={setQuery}
          onKeyDown={handleKeyDown}
          placeholder="اكتب اسم المنطقة (مثال: Fatih, Esenyurt)..."
          dir="ltr"
          lang="tr"
          inputClassName="placeholder:text-right placeholder:[direction:rtl] placeholder:[unicode-bidi:plaintext]"
        />
        <p className="text-center text-white/90 text-sm md:text-base mt-3 font-medium">
          اضغط <b>Enter</b> للبحث المتقدم أو اختر من القائمة أدناه
        </p>
      </PageHero>

      <section className="px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 md:p-8">
            <div className="flex flex-col gap-2 text-center">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">
                {showResults ? 'نتائج البحث' : 'المناطق المحظورة حسب الولاية'}
              </h2>
            </div>

            <div className="mt-5">
              {/* شريط الإحصائيات */}
              <div className="mt-6 mb-2 flex flex-row-reverse justify-between items-center text-sm bg-slate-50 dark:bg-slate-800/60 rounded-xl px-4 py-3 shadow-sm border border-slate-100 dark:border-slate-800">
                <span className="inline-flex items-center gap-2 font-bold text-slate-700 dark:text-slate-100">
                  <MapPin size={17} className="text-accent-600 dark:text-accent-400" />
                  عدد المناطق المحظورة
                  <strong className="text-accent-600 dark:text-accent-400 text-base font-extrabold">{data?.items?.length ?? '—'}</strong>
                </span>
                <span className="inline-flex items-center gap-2 font-bold text-slate-700 dark:text-slate-100">
                  <span className="text-accent-600 dark:text-accent-400">آخر تحديث</span>
                  <strong className="text-accent-600 dark:text-accent-400 text-base font-extrabold">{data?.updatedAt ?? '—'}</strong>
                </span>
              </div>

              {/* City browsing grid when no search */}
              {!showResults && !loading && hasData && cityStats.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-4 text-center">
                    تصفح حسب الولاية
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {cityStats.map(({ city, count, districtCount }) => (
                      <Link
                        key={city}
                        href={`/zones/${encodeURIComponent(city)}`}
                        className="group relative rounded-xl border border-rose-100 dark:border-rose-900/30 bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-950/20 dark:to-slate-900 p-4 hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/30 group-hover:bg-rose-200 dark:group-hover:bg-rose-800/40 transition-colors">
                              <Building2 size={16} className="text-rose-600 dark:text-rose-400" />
                            </div>
                            <div>
                              <div className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-rose-700 dark:group-hover:text-rose-300 transition-colors">
                                {city}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {districtCount} منطقة
                              </div>
                            </div>
                          </div>
                          <span className="shrink-0 bg-rose-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {count}
                          </span>
                        </div>
                        <div className="flex items-center justify-end mt-2 text-[11px] font-bold text-rose-500 dark:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          عرض التفاصيل
                          <ChevronLeft size={12} className="mr-0.5" />
                        </div>
                      </Link>
                    ))}
                  </div>
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
                    اضغط على أي ولاية لعرض قائمة الأحياء المحظورة فيها
                  </p>
                </div>
              )}

              {!showResults && !loading && !hasData && !loadError && (
                <p className="text-center text-xs md:text-sm text-slate-500 dark:text-slate-400">
                  اكتب اسم المنطقة لبدء البحث، أو اضغط Enter للذهاب للصفحة المخصصة.
                </p>
              )}

              {loading && (
                <p className="text-center text-xs md:text-sm text-slate-500 dark:text-slate-400">جاري تحميل قاعدة البيانات…</p>
              )}

              {!loading && loadError && (
                <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-4 text-center text-sm text-rose-700 dark:text-rose-300">
                  {loadError}
                </div>
              )}

              {!loading && !loadError && !hasData && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-center text-sm text-slate-700 dark:text-slate-300">
                  قاعدة البيانات غير متوفرة بعد. ضع الملف في <strong>public/data/closed-areas.json</strong> ثم أعد المحاولة.
                </div>
              )}

              {showResults && !loading && hasData && (
                <div className="mt-3 max-h-[420px] overflow-y-auto space-y-2">
                  {totalMatches > 0 ? (
                    <>
                      {matches.map((zone, idx) => (
                        <Link
                          key={`${zone.c}-${zone.d}-${zone.n}-${idx}`}
                          href={`/zones/${zone.n}`} // Use neighborhood name as slug
                          className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/30 p-4 flex items-center justify-between gap-3 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition cursor-pointer"
                        >
                          <div className="text-right">
                            <div className="font-extrabold text-slate-900 dark:text-slate-100">
                              🚫 {zone.n}
                            </div>
                            <div className="text-xs md:text-sm text-rose-700 dark:text-rose-300 mt-1">
                              {zone.c} — {zone.d}
                            </div>
                          </div>
                          <span className="shrink-0 rounded-md bg-rose-600 text-white px-3 py-1 text-xs font-bold">محظورة</span>
                        </Link>
                      ))}

                      {totalMatches > 100 && (
                        <div className="text-center text-xs md:text-sm text-slate-500 dark:text-slate-400 py-2">
                          … وهناك {totalMatches - 100} نتيجة أخرى. اكتب الاسم بدقة أكثر.
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 p-5 text-center">
                      <div className="text-2xl mb-2">✅</div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        المحلة المطلوبة غير مضافة في قائمة المحلات المحظورة
                      </div>
                      <p className="mt-2 text-xs md:text-sm text-slate-600 dark:text-slate-300">
                        بالتالي تكون متاحة ويمكنك تثبيت النفوس فيها.
                      </p>
                      <button onClick={() => router.push(`/zones/${query}`)} className="mt-4 text-xs bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition">
                        عرض الشهادة الرسمية (اضغط هنا)
                      </button>
                    </div>
                  )}
                </div>
              )}

              <p className="mt-5 text-center text-[11px] md:text-xs text-slate-500 dark:text-slate-500">
                * البيانات مرجعية وتعتمد على قوائم "المناطق/الأحياء المغلقة" الرسمية. تحقق دائماً من آخر تحديث عند الجهات الرسمية.
              </p>
            </div>
          </div>
        </div>
      </section>


    </main>
  );
}
