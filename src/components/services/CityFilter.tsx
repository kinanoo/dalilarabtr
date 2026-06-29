'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Search, ChevronDown, X, Check } from 'lucide-react';

/**
 * CityFilter — a scalable city picker for the services directory.
 *
 * The old design was a flat row of one pill per city: fine at ~12 cities, but
 * the owner is growing to 60-80+ provinces, where the row "becomes the whole
 * page". This keeps a CONSTANT footprint regardless of city count:
 *   - Mobile: a single full-width trigger button → opens a searchable
 *     bottom-sheet (counted, grouped: popular + alphabetical).
 *   - Desktop: a few inline popular quick-chips for one-tap + a trigger that
 *     opens the same list as an anchored popover.
 * The long tail lives behind a height-capped, internally-scrolling search —
 * never rendered inline — so 12 or 200 cities produce the same control.
 *
 * Spelling-insensitive matching (normalizeAr) because the data normalises
 * Istanbul/Gaziantep to canonical Arabic that differs by hamza/diacritics from
 * a naive hardcoded list.
 */

const POPULAR_ORDER = ['إسطنبول', 'غازي عنتاب', 'بورصة', 'أنقرة', 'إزمير', 'مرسين', 'أضنة', 'قونية', 'أنطاليا', 'هاتاي'];

function normalizeAr(s: string): string {
    return (s || '')
        .toLowerCase()
        .trim()
        .replace(/ـ/g, '')          // tatweel
        .replace(/[ً-ْ]/g, '') // diacritics
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي');
}

interface Props {
    value: string;                       // 'all' | canonical city name
    onChange: (city: string) => void;
    cities: string[];                    // available cities (sorted)
    counts: Record<string, number>;      // {city: providerCount}
    totalCount: number;
}

export default function CityFilter({ value, onChange, cities, counts, totalCount }: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // Popular cities actually present in the data (spelling-insensitive); fall
    // back to the busiest cities when no curated match.
    const popular = useMemo(() => {
        const byCurated = POPULAR_ORDER
            .map((p) => cities.find((c) => normalizeAr(c) === normalizeAr(p)))
            .filter((c): c is string => !!c);
        if (byCurated.length) return byCurated;
        return [...cities].sort((a, b) => (counts[b] || 0) - (counts[a] || 0)).slice(0, 8);
    }, [cities, counts]);

    const desktopChips = popular.slice(0, 6);

    const alphabetical = useMemo(() => {
        const pop = new Set(popular);
        return cities.filter((c) => !pop.has(c));
    }, [cities, popular]);

    const filtered = useMemo(() => {
        const q = normalizeAr(query);
        if (!q) return null;
        return cities.filter((c) => normalizeAr(c).includes(q));
    }, [query, cities]);

    const close = () => { setOpen(false); setQuery(''); };
    const pick = (c: string) => { onChange(c); close(); triggerRef.current?.focus(); };

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
        const onDown = (e: MouseEvent) => {
            const t = e.target as Node;
            if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
            close();
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onDown);
        const isMobile = window.matchMedia('(max-width: 1023px)').matches;
        const prevOverflow = document.body.style.overflow;
        if (isMobile) document.body.style.overflow = 'hidden';
        const t = setTimeout(() => searchRef.current?.focus(), 60);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onDown);
            document.body.style.overflow = prevOverflow;
            clearTimeout(t);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const isAll = value === 'all';

    const chipCls = (active: boolean) =>
        `shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${active
            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/30'
            : 'bg-white/90 text-slate-700 border-slate-200 hover:border-emerald-300 hover:text-emerald-600 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700 dark:hover:border-emerald-700'
        }`;

    return (
        <div className="relative">
            <div className="flex flex-col items-stretch gap-2 lg:flex-row lg:flex-wrap lg:items-center lg:justify-center">
                {/* Desktop-only popular quick-chips (one-tap for big cities) */}
                <div className="hidden lg:flex lg:flex-wrap lg:items-center lg:justify-center gap-2">
                    {desktopChips.map((c) => (
                        <button key={c} type="button" onClick={() => onChange(c)} aria-current={value === c} className={chipCls(value === c)}>
                            {c}
                            {counts[c] != null && <span className="tabular-nums text-[10px] opacity-70">{counts[c]}</span>}
                        </button>
                    ))}
                </div>

                {/* Trigger — always shows the current selection + opens the searchable list. */}
                <button
                    ref={triggerRef}
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    onClick={() => setOpen((o) => !o)}
                    className={`w-full lg:w-auto inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-bold border transition-all ${!isAll
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/30'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-700'
                        }`}
                >
                    <MapPin size={15} className={!isAll ? 'text-white' : 'text-gov-red'} />
                    <span className="truncate">{isAll ? 'كل المدن' : value}</span>
                    <span className="tabular-nums text-[11px] opacity-70">{isAll ? totalCount : (counts[value] ?? '')}</span>
                    {!isAll ? (
                        <span
                            role="button"
                            aria-label="إعادة لكل المدن"
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); onChange('all'); }}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); onChange('all'); } }}
                            className="ms-auto grid place-items-center w-5 h-5 rounded-full bg-white/25 hover:bg-white/45 transition-colors"
                        >
                            <X size={12} />
                        </span>
                    ) : (
                        <ChevronDown size={16} className="ms-auto opacity-70" />
                    )}
                </button>
            </div>

            {/* Searchable panel — bottom-sheet (mobile) / popover (desktop) */}
            {open && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none"
                        aria-hidden="true"
                        onClick={close}
                    />
                    <div
                        ref={panelRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label="اختيار المدينة"
                        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col rounded-t-3xl border-t border-slate-200 bg-white animate-in slide-in-from-bottom duration-300 dark:border-slate-800 dark:bg-slate-900
                                   lg:absolute lg:inset-x-auto lg:bottom-auto lg:top-full lg:end-0 lg:mt-2 lg:w-[340px] lg:max-h-[400px] lg:rounded-2xl lg:border lg:shadow-2xl lg:fade-in lg:zoom-in-95"
                    >
                        {/* Search header (sticky) */}
                        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                            <div className="relative flex-1">
                                <Search size={16} className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-slate-400" />
                                <input
                                    ref={searchRef}
                                    dir="rtl"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="ابحث عن مدينة..."
                                    className="h-11 w-full rounded-xl border-none bg-slate-100 ps-10 pe-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:bg-slate-800 dark:text-slate-100"
                                />
                            </div>
                            <button type="button" onClick={close} aria-label="إغلاق" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 lg:hidden">
                                <X size={18} />
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto overscroll-contain p-2">
                            {filtered === null ? (
                                <>
                                    <Row label="كل المدن" count={totalCount} active={isAll} onClick={() => pick('all')} icon />
                                    {popular.length > 0 && <SectionLabel>المدن الأكثر طلباً</SectionLabel>}
                                    {popular.map((c) => <Row key={c} label={c} count={counts[c]} active={value === c} onClick={() => pick(c)} />)}
                                    {alphabetical.length > 0 && <SectionLabel>كل المدن</SectionLabel>}
                                    {alphabetical.map((c) => <Row key={c} label={c} count={counts[c]} active={value === c} onClick={() => pick(c)} />)}
                                </>
                            ) : filtered.length === 0 ? (
                                <div className="px-3 py-8 text-center text-sm font-bold text-slate-400">لا توجد مدينة بهذا الاسم</div>
                            ) : (
                                filtered.map((c) => <Row key={c} label={c} count={counts[c]} active={value === c} onClick={() => pick(c)} />)
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return <div className="px-3 pb-1 pt-3 text-[11px] font-black tracking-wide text-slate-400 dark:text-slate-500">{children}</div>;
}

function Row({ label, count, active, onClick, icon }: { label: string; count?: number; active: boolean; onClick: () => void; icon?: boolean }) {
    return (
        <button
            type="button"
            role="option"
            aria-selected={active}
            onClick={onClick}
            className={`flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors ${active
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
        >
            {icon && <MapPin size={15} className={active ? 'text-emerald-500' : 'text-slate-400'} />}
            <span className="min-w-0 flex-1 truncate text-start">{label}</span>
            {count != null && <span className="tabular-nums text-xs text-slate-400 dark:text-slate-500">{count}</span>}
            {active && <Check size={16} className="shrink-0 text-emerald-500" />}
        </button>
    );
}
