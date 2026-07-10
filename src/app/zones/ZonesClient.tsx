'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

import PageHero from '@/components/PageHero';
import HeroSearchInput from '@/components/HeroSearchInput';
import { MapPin, ShieldAlert, Building2, ChevronLeft, Sparkles, CheckCircle2, XCircle, Clock, Search } from 'lucide-react';
import logger from '@/lib/logger';

// Status:
//   'closed'   = still blocked per the latest official list.
//   'reopened' = lifted on 6 June 2026 (or a future update).
//   'pending'  = a province where the lift was announced but no
//                neighborhood-level list has been published yet
//                (e.g. Kilis as of 6 June 2026). UI shows these
//                in amber with a "قائمة قيد التحديث" label so the
//                visitor doesn't mistake an unknown for "still closed".
type ZoneStatus = 'closed' | 'reopened' | 'pending';

type ClosedAreaItem = {
  c: string; // City
  d: string; // District
  n: string; // Neighborhood (Mahalle)
  s: ZoneStatus;
  r?: string | null; // reopened_at ISO, only when s='reopened'
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

export default function ZonesPage({ initialData }: { initialData?: ClosedAreasPayload | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  // Seed from the server-rendered snapshot when present. The load() effect
  // below early-returns when `data` is already set, so this also SKIPS the
  // per-visitor client fetch of the whole zones table (Supabase-egress saver);
  // the client fetch remains as a fallback only when the server passed nothing.
  const [data, setData] = useState<ClosedAreasPayload | null>(initialData ?? null);
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
      router.push(`/zones/${encodeURIComponent(query.trim())}`);
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
          // Pull BOTH closed and reopened — UI splits them visually but we
          // want the page to load once and let the user toggle filters
          // client-side, not re-fetch on every chip click.
          // `reopened_at` may not exist on older schemas; we request it
          // conditionally and fall back to null when missing.
          const { data: rows, error } = await supabase
            .from('zones')
            .select('city, district, neighborhood, status, updated_at, reopened_at')
            .in('status', ['closed', 'reopened', 'pending'])
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
          n: r.neighborhood,
          s:
            r.status === 'reopened'
              ? 'reopened'
              : r.status === 'pending'
                ? 'pending'
                : 'closed',
          r: r.reopened_at || null,
        }));

        // Get latest update date — filter to valid timestamps first so one bad
        // `updated_at` (→ NaN) can't turn Math.max into NaN and throw on
        // toISOString(), which would fail the whole dataset load.
        const times = allRows
          .map((r: any) => new Date(r.updated_at).getTime())
          .filter((t: number) => Number.isFinite(t));
        const latestInfo = times.length > 0
          ? new Date(Math.max(...times)).toISOString().split('T')[0]
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

  // Status filter — "all" shows everything; the three narrow filters
  // mirror the three real-world states the data represents.
  const [statusFilter, setStatusFilter] = useState<'all' | 'closed' | 'reopened' | 'pending'>('all');

  function statusFilterPass(item: ClosedAreaItem): boolean {
    if (statusFilter === 'all') return true;
    return item.s === statusFilter;
  }

  const matches = useMemo(() => {
    if (!normalizedQuery) return [] as ClosedAreaItem[];
    if (!items.length) return [] as ClosedAreaItem[];

    const result: ClosedAreaItem[] = [];
    for (const zone of items) {
      if (!statusFilterPass(zone)) continue;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, normalizedQuery, statusFilter]);

  const totalMatches = useMemo(() => {
    if (!normalizedQuery) return 0;
    if (!items.length) return 0;

    let count = 0;
    for (const zone of items) {
      if (!statusFilterPass(zone)) continue;
      if (
        normalizeText(zone.n).includes(normalizedQuery) ||
        normalizeText(zone.d).includes(normalizedQuery) ||
        normalizeText(zone.c).includes(normalizedQuery)
      ) {
        count += 1;
      }
    }
    return count;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, normalizedQuery, statusFilter]);

  // Site-wide split — used in the news banner and the filter chip counts.
  const totals = useMemo(() => {
    let closed = 0;
    let reopened = 0;
    let pending = 0;
    for (const z of items) {
      if (z.s === 'closed') closed++;
      else if (z.s === 'reopened') reopened++;
      else if (z.s === 'pending') pending++;
    }
    return { closed, reopened, pending, all: items.length };
  }, [items]);

  // City statistics for browsing grid — track all three states per city.
  const cityStats = useMemo(() => {
    if (!items.length) return [];
    const map = new Map<string, { closed: number; reopened: number; pending: number; districts: Set<string> }>();
    for (const zone of items) {
      const existing = map.get(zone.c) || { closed: 0, reopened: 0, pending: 0, districts: new Set<string>() };
      if (zone.s === 'closed') existing.closed += 1;
      else if (zone.s === 'reopened') existing.reopened += 1;
      else if (zone.s === 'pending') existing.pending += 1;
      existing.districts.add(zone.d);
      map.set(zone.c, existing);
    }
    return Array.from(map.entries())
      .map(([city, stats]) => ({
        city,
        count: stats.closed,
        reopenedCount: stats.reopened,
        pendingCount: stats.pending,
        districtCount: stats.districts.size,
      }))
      // Sort: provinces with pending/reopened updates surface first
      // (something to announce), then by remaining-closed count.
      .sort((a, b) => {
        const aHas = a.reopenedCount > 0 || a.pendingCount > 0 ? 1 : 0;
        const bHas = b.reopenedCount > 0 || b.pendingCount > 0 ? 1 : 0;
        if (aHas !== bHas) return bHas - aHas;
        return b.count - a.count;
      });
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
          inputClassName="placeholder:text-start placeholder:[direction:rtl] placeholder:[unicode-bidi:plaintext]"
        />
      </PageHero>

      {/* Breaking-news banner — the page used to look frozen at the 2022
          list; this strip up top tells the visitor the data is current
          and what just changed. Only renders when we actually have any
          reopened rows in the dataset. */}
      {totals.reopened > 0 && (
        <section className="px-4 -mt-2 mb-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 dark:from-emerald-900/20 dark:via-slate-900 dark:to-emerald-900/10 p-5 md:p-6 shadow-sm">
              <div aria-hidden="true" className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-400/10 rounded-full blur-3xl" />
              <div className="relative flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 shrink-0">
                  <Sparkles size={20} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">تحديث 6 يونيو 2026</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-slate-50 leading-tight">
                    رُفع الحظر عن <span className="text-emerald-600 dark:text-emerald-400">{totals.reopened.toLocaleString('en-US')}</span> حياً في تركيا
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    وفق آخر مراجعة من إدارة الهجرة. تبقّت <strong className="text-rose-600 dark:text-rose-400">{totals.closed.toLocaleString('en-US')}</strong> منطقة ضمن قائمة المغلقة
                    {totals.pending > 0 && (
                      <>
                        ، و<strong className="text-amber-600 dark:text-amber-400">{totals.pending.toLocaleString('en-US')}</strong> منطقة <strong>قيد التحديث الرسمي</strong> (بدأ التطبيق ولم تَصدر القائمة بعد — كلس مثلاً)
                      </>
                    )}.
                    قوائم رسمية حالياً: <strong>أورفا (26 مغلق)</strong> و<strong>قونيا (4 مغلق)</strong>. باقي الولايات تنتظر قوائمها.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 md:p-8">
            <div className="flex flex-col gap-2 text-center">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">
                {showResults ? 'نتائج البحث' : 'الأحياء المغلقة والأحياء المفتوحة حسب الولاية'}
              </h2>
            </div>

            <div className="mt-5">
              {/* Status filter chips — give the user one tap to switch
                  between "what's still blocked", "what just opened",
                  and "show me everything". The counts reassure them
                  the data is loaded and accurate. */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all ${statusFilter === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  الكلّ ({totals.all.toLocaleString('en-US')})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('reopened')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition-all ${statusFilter === 'reopened'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-900/40'
                  }`}
                >
                  <CheckCircle2 size={13} /> فُتح حديثاً ({totals.reopened.toLocaleString('en-US')})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('closed')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition-all ${statusFilter === 'closed'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/40'
                  }`}
                >
                  <XCircle size={13} /> ما زال مغلقاً ({totals.closed.toLocaleString('en-US')})
                </button>
                {totals.pending > 0 && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('pending')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition-all ${statusFilter === 'pending'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-900/40'
                    }`}
                  >
                    <Clock size={13} /> قيد المراجعة ({totals.pending.toLocaleString('en-US')})
                  </button>
                )}
              </div>

              {/* شريط الإحصائيات */}
              <div className="mt-6 mb-2 flex justify-between items-center text-sm bg-slate-50 dark:bg-slate-800/60 rounded-xl px-4 py-3 shadow-sm border border-slate-100 dark:border-slate-800">
                <span className="inline-flex items-center gap-2 font-bold text-slate-700 dark:text-slate-100">
                  <MapPin size={17} className="text-accent-600 dark:text-accent-400" />
                  المعروض حالياً
                  <strong className="text-accent-600 dark:text-accent-400 text-base font-extrabold">
                    {statusFilter === 'all'
                      ? totals.all
                      : statusFilter === 'reopened'
                        ? totals.reopened
                        : statusFilter === 'pending'
                          ? totals.pending
                          : totals.closed}
                  </strong>
                </span>
                <span className="inline-flex items-center gap-2 font-bold text-slate-700 dark:text-slate-100">
                  <span className="text-accent-600 dark:text-accent-400">آخر تحديث</span>
                  <strong className="text-accent-600 dark:text-accent-400 text-base font-extrabold">{data?.updatedAt ?? '—'}</strong>
                </span>
              </div>

              {/* City browsing grid when no search */}
              {!showResults && !loading && hasData && cityStats.length > 0 && (
                <div className="mt-6">
                  <div className="text-center mb-5">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 leading-tight">
                      الولايات والأقضية
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {cityStats.map(({ city, count, reopenedCount, pendingCount, districtCount }) => {
                      // Color the province card by its dominant state:
                      // amber = pending official list (Kilis right now),
                      // green = a confirmed lift happened here,
                      // rose = nothing new yet, only closures.
                      const hasPending = pendingCount > 0;
                      const hasReopen = reopenedCount > 0;
                      const stillClosed = count > 0;
                      const tone = hasPending
                        ? 'amber'
                        : hasReopen
                          ? 'emerald'
                          : 'rose';
                      const borderTone =
                        tone === 'amber'
                          ? 'border-amber-200 dark:border-amber-900/40 hover:border-amber-400 dark:hover:border-amber-700'
                          : tone === 'emerald'
                            ? 'border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-400 dark:hover:border-emerald-700'
                            : 'border-rose-100 dark:border-rose-900/30 hover:border-rose-300 dark:hover:border-rose-700';
                      const bgTone =
                        tone === 'amber'
                          ? 'bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-950/20 dark:to-slate-900'
                          : tone === 'emerald'
                            ? 'bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/20 dark:to-slate-900'
                            : 'bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-950/20 dark:to-slate-900';
                      // Top-edge accent stripe (matches UpdateCard / ToolCard
                      // / CategoryTile family). Reader scans the grid and
                      // sees a row of coloured strips before reading text —
                      // amber means "list still updating," emerald means
                      // "lift happened here," rose means "all still closed."
                      const stripeTone =
                        tone === 'amber'
                          ? 'bg-gradient-to-l from-amber-400 via-amber-500 to-orange-500'
                          : tone === 'emerald'
                            ? 'bg-gradient-to-l from-emerald-400 via-teal-400 to-emerald-500'
                            : 'bg-gradient-to-l from-rose-400 via-rose-500 to-red-500';
                      const iconBg =
                        tone === 'amber'
                          ? 'bg-amber-100 dark:bg-amber-900/30 group-hover:bg-amber-200 dark:group-hover:bg-amber-800/40'
                          : tone === 'emerald'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/40'
                            : 'bg-rose-100 dark:bg-rose-900/30 group-hover:bg-rose-200 dark:group-hover:bg-rose-800/40';
                      const iconColor =
                        tone === 'amber'
                          ? 'text-amber-600 dark:text-amber-400'
                          : tone === 'emerald'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400';
                      return (
                        <Link
                          key={city}
                          href={`/zones/${encodeURIComponent(city)}`}
                          className={`group relative rounded-xl border ${borderTone} ${bgTone} p-3 sm:p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden`}
                        >
                          {/* Top accent stripe — tone-coloured */}
                          <div
                            aria-hidden="true"
                            className={`absolute top-0 inset-x-0 h-1 ${stripeTone}`}
                          />

                          {/* Row 1: icon + city name */}
                          <div className="relative flex items-center gap-2 mb-3">
                            <div className={`p-1.5 rounded-lg shrink-0 ${iconBg} transition-colors shadow-sm`}>
                              <Building2 size={16} className={iconColor} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-black text-sm sm:text-base text-slate-900 dark:text-slate-50 leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors break-words">
                                {city}
                              </div>
                              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium tabular-nums">
                                {districtCount} قضاء
                              </div>
                            </div>
                          </div>

                          {/* Row 2: status pills — pending pulses to draw
                              the eye (these provinces are mid-update); the
                              other two stay static so the carousel doesn't
                              feel busy. */}
                          <div className="relative flex flex-wrap items-center gap-1">
                            {hasPending && (
                              <span className="inline-flex items-center gap-0.5 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full tabular-nums whitespace-nowrap shadow-sm shadow-amber-500/40 animate-pulse">
                                <span className="tabular-nums">{pendingCount}</span> قيد التحديث
                              </span>
                            )}
                            {hasReopen && (
                              <span className="inline-flex items-center gap-0.5 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full tabular-nums whitespace-nowrap shadow-sm shadow-emerald-600/30">
                                <span className="tabular-nums">{reopenedCount}</span> فُتح
                              </span>
                            )}
                            {stillClosed && (
                              <span className="inline-flex items-center gap-0.5 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full tabular-nums whitespace-nowrap shadow-sm shadow-rose-600/30">
                                <span className="tabular-nums">{count}</span> مغلق
                              </span>
                            )}
                          </div>
                          <div className={`relative hidden sm:flex items-center justify-end mt-2 text-[11px] font-black opacity-0 group-hover:opacity-100 group-hover:translate-x-[-2px] transition-all ${iconColor}`}>
                            عرض التفاصيل
                            <ChevronLeft size={12} className="ms-0.5" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  {/* Legend — chip pills instead of emojis. Each chip
                      uses the same accent colour as the stripe on the
                      corresponding city card so the reader can match
                      "amber stripe = this status" without reading text. */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-5">
                    <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/70 dark:border-amber-800/40 px-2 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      قيد التحديث
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/70 dark:border-emerald-800/40 px-2 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      حدث فيها فتح
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20 border border-rose-200/70 dark:border-rose-800/40 px-2 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      كلّها مغلقة
                    </span>
                  </div>
                </div>
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
                  البيانات غير متوفرة حالياً، حاول مجدداً لاحقاً.
                </div>
              )}

              {showResults && !loading && hasData && (
                <div className="mt-3 max-h-[420px] overflow-y-auto space-y-2">
                  {totalMatches > 0 ? (
                    <>
                      {matches.map((zone, idx) => {
                        const tone =
                          zone.s === 'reopened' ? 'emerald'
                          : zone.s === 'pending' ? 'amber'
                          : 'rose';
                        const styles = {
                          emerald: {
                            border: 'border-emerald-200 dark:border-emerald-900/50',
                            bg: 'bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50',
                            text: 'text-emerald-700 dark:text-emerald-300',
                            icon: 'text-emerald-600 dark:text-emerald-400',
                            badge: 'bg-emerald-600',
                            label: 'فُتحت',
                            Icon: CheckCircle2,
                          },
                          rose: {
                            border: 'border-rose-200 dark:border-rose-900/50',
                            bg: 'bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50',
                            text: 'text-rose-700 dark:text-rose-300',
                            icon: 'text-rose-600 dark:text-rose-400',
                            badge: 'bg-rose-600',
                            label: 'مغلقة',
                            Icon: XCircle,
                          },
                          amber: {
                            border: 'border-amber-200 dark:border-amber-900/50',
                            bg: 'bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50',
                            text: 'text-amber-700 dark:text-amber-300',
                            icon: 'text-amber-600 dark:text-amber-400',
                            badge: 'bg-amber-500',
                            label: 'قيد التحديث',
                            Icon: Clock,
                          },
                        }[tone];
                        const Icon = styles.Icon;
                        return (
                          <Link
                            key={`${zone.c}-${zone.d}-${zone.n}-${idx}`}
                            href={`/zones/${encodeURIComponent(zone.n)}`}
                            className={`rounded-xl border p-4 flex items-center justify-between gap-3 transition cursor-pointer ${styles.border} ${styles.bg}`}
                          >
                            <div className="text-right min-w-0 flex-1">
                              <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <Icon size={16} className={`${styles.icon} shrink-0`} />
                                <span className="truncate">{zone.n}</span>
                              </div>
                              <div className={`text-xs md:text-sm mt-1 ${styles.text}`}>
                                {zone.c} — {zone.d}
                              </div>
                            </div>
                            <span className={`shrink-0 rounded-md text-white px-3 py-1 text-xs font-bold ${styles.badge}`}>
                              {styles.label}
                            </span>
                          </Link>
                        );
                      })}

                      {totalMatches > 100 && (
                        <div className="text-center text-xs md:text-sm text-slate-500 dark:text-slate-400 py-2">
                          … وهناك {totalMatches - 100} نتيجة أخرى. اكتب الاسم بدقّة أكثر.
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-5 text-center">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                        <Search size={18} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        لم نجد سجلّ حظر بهذا الاسم
                      </div>
                      <p className="mt-2 text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        قد تكون المنطقة مفتوحة، لكن غياب السجل قد يعني أيضاً أنّ الاسم مكتوب بشكل مختلف
                        (بالحروف التركية İ Ş Ç Ğ Ü Ö) أو أنّ البيانات لم تُحدَّث بعد. تأكّد من الجهة الرسمية
                        (المختار أو إدارة الهجرة) قبل توقيع أي عقد إيجار.
                      </p>
                      {data?.updatedAt && (
                        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                          آخر تحديث للبيانات: {data.updatedAt}
                        </p>
                      )}
                      <button onClick={() => router.push(`/zones/${encodeURIComponent(query.trim())}`)} className="mt-4 text-xs bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-600 transition">
                        عرض التفاصيل والتحقق
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
