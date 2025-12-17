'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import HeroSearchInput from '@/components/HeroSearchInput';
import { MapPin, ShieldAlert } from 'lucide-react';

type ClosedAreaItem = {
  c: string; // City
  d: string; // District
  n: string; // Neighborhood (Mahalle)
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

  useEffect(() => {
    if (data) return;

    const controller = new AbortController();
    let active = true;

    const buildDataUrl = () => {
      const endsWithSlash = window.location.pathname.endsWith('/');
      const relative = endsWithSlash ? '../data/closed-areas.json' : './data/closed-areas.json';
      return new URL(relative, window.location.href).toString();
    };

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await fetch(buildDataUrl(), { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as ClosedAreasPayload;
        if (!payload || !Array.isArray(payload.items)) throw new Error('Invalid payload');
        if (active) setData(payload);
      } catch (error) {
        if (controller.signal.aborted) return;
        if (active) setLoadError('تعذر تحميل قاعدة البيانات.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
      controller.abort();
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

  const showResults = normalizedQuery.length > 0;
  const hasData = items.length > 0;

  return (
    <main className="flex flex-col min-h-screen font-cairo">
      <Navbar />

      <PageHero
        title="فاحص المناطق المحظورة (الرسمي)"
        description="ابحث باسم الحي (Mahalle) أو المنطقة (İlçe) أو الولاية."
        icon={<ShieldAlert className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      >
        <HeroSearchInput
          value={query}
          onChange={setQuery}
          placeholder="اكتب اسم المنطقة (مثال: Fatih, Esenyurt)..."
          dir="ltr"
          lang="tr"
          inputClassName="placeholder:text-right placeholder:[direction:rtl] placeholder:[unicode-bidi:plaintext]"
          // onClear أزيلت لأن المكوّن لم يعد يدعمها
        />
      </PageHero>

      <section className="px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 md:p-8">
            <div className="flex flex-col gap-2 text-center">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">النتائج</h2>
            </div>

            <div className="mt-5">
                            {/* شريط الإحصائيات بعد النتائج */}
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
                {!showResults && !loading && (
                  <p className="text-center text-xs md:text-sm text-slate-500 dark:text-slate-400">
                    اكتب اسم المنطقة لبدء البحث.
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
                          <div
                            key={`${zone.c}-${zone.d}-${zone.n}-${idx}`}
                            className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/30 p-4 flex items-center justify-between gap-3"
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
                          </div>
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
                      </div>
                    )}
                  </div>
                )}

                <p className="mt-5 text-center text-[11px] md:text-xs text-slate-500 dark:text-slate-500">
                  * البيانات مرجعية وتعتمد على قوائم “المناطق/الأحياء المغلقة” الرسمية. تحقق دائمًا من آخر تحديث عند الجهات الرسمية.
                </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
