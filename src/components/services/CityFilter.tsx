'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
 *     opens the same list as a popover.
 *
 * The panel is PORTALED to <body> and positioned `fixed`: the /services hero
 * section is overflow-hidden, so an absolutely-positioned popover anchored
 * inside it gets hard-clipped after ~120px (review finding). Fixed+portal
 * escapes both the clipping and any stacking context; the desktop popover is
 * anchored to the trigger's rect at open time (closed on resize/page-scroll so
 * it can never drift away from its anchor). z-index sits above the floating
 * WhatsApp assistant (z-[90]) so nothing floats over the sheet.
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

const PANEL_W = 340;

export default function CityFilter({ value, onChange, cities, counts, totalCount }: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    // Non-null => desktop popover anchored at these viewport coords; null => mobile bottom sheet.
    const [desktopPos, setDesktopPos] = useState<{ top: number; right: number } | null>(null);
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

    const openPanel = () => {
        const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
        if (isDesktop && triggerRef.current) {
            const r = triggerRef.current.getBoundingClientRect();
            // Anchor the panel's right edge to the trigger's right edge (RTL:
            // grows toward inline-start), clamped so the panel stays on-screen.
            const right = Math.min(
                Math.max(8, window.innerWidth - r.right),
                Math.max(8, window.innerWidth - PANEL_W - 8),
            );
            setDesktopPos({ top: Math.round(r.bottom + 8), right: Math.round(right) });
        } else {
            setDesktopPos(null);
        }
        setOpen(true);
    };

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { close(); triggerRef.current?.focus(); return; }
            // Minimal focus trap for the aria-modal dialog: Tab cycles inside.
            if (e.key === 'Tab') {
                const els = panelRef.current?.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])');
                if (!els || !els.length) return;
                const list = Array.from(els).filter((el) => !el.hasAttribute('disabled'));
                const first = list[0], last = list[list.length - 1];
                const active = document.activeElement as HTMLElement | null;
                const inside = !!active && panelRef.current!.contains(active);
                if (e.shiftKey && (!inside || active === first)) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && (!inside || active === last)) { e.preventDefault(); first.focus(); }
            }
        };
        const onDown = (e: MouseEvent) => {
            const t = e.target as Node;
            if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
            close();
        };
        // The desktop popover is fixed at open-time coords — if the page
        // REALLY scrolls it would detach from its anchor, so close. Tolerate
        // small deltas: trailing inertia (trackpad momentum, the browser's own
        // scroll-into-view before a click) fires scroll events right after
        // opening and must not instantly close the panel.
        const scrollY0 = window.scrollY;
        const onScroll = () => { if (desktopPos && Math.abs(window.scrollY - scrollY0) > 24) close(); };
        const onResize = () => { if (desktopPos) close(); };
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onDown);
        window.addEventListener('resize', onResize);
        window.addEventListener('scroll', onScroll, { passive: true });
        const isMobile = !desktopPos;
        const prevOverflow = document.body.style.overflow;
        if (isMobile) document.body.style.overflow = 'hidden';
        const t = setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 60);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onDown);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('scroll', onScroll);
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

    const panel = open ? (
        <>
            <div
                className={`fixed inset-0 z-[95] ${desktopPos ? '' : 'bg-black/50 backdrop-blur-sm'}`}
                aria-hidden="true"
                onClick={close}
            />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label="اختيار المدينة"
                style={desktopPos ? { top: desktopPos.top, right: desktopPos.right, width: PANEL_W } : undefined}
                className={desktopPos
                    ? 'fixed z-[96] flex max-h-[420px] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900'
                    : 'fixed inset-x-0 bottom-0 z-[96] flex max-h-[80vh] flex-col rounded-t-3xl border-t border-slate-200 bg-white animate-in slide-in-from-bottom duration-300 dark:border-slate-800 dark:bg-slate-900'}
            >
                {/* Search header (sticky) */}
                <div className="sticky top-0 z-10 flex items-center gap-2 rounded-t-3xl border-b border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
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
                    {!desktopPos && (
                        <button type="button" onClick={close} aria-label="إغلاق" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800">
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* List */}
                <div role="listbox" aria-label="المدن" className="flex-1 overflow-y-auto overscroll-contain p-2">
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
    ) : null;

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

                {/* Trigger group — the main button opens the list; when a city is
                    selected a SEPARATE sibling button clears it (interactive
                    controls must not nest inside a <button>). */}
                <div className="flex w-full lg:w-auto">
                    <button
                        ref={triggerRef}
                        type="button"
                        aria-haspopup="dialog"
                        aria-expanded={open}
                        onClick={() => (open ? close() : openPanel())}
                        className={`inline-flex h-11 flex-1 items-center gap-2 px-4 text-sm font-bold border transition-all lg:flex-initial ${!isAll
                            ? 'rounded-s-xl bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/30'
                            : 'rounded-xl w-full lg:w-auto bg-white text-slate-700 border-slate-200 hover:border-emerald-300 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-700'
                            }`}
                    >
                        <MapPin size={15} className={!isAll ? 'text-white' : 'text-gov-red'} />
                        <span className="truncate">{isAll ? 'كل المدن' : value}</span>
                        <span className="tabular-nums text-[11px] opacity-70">{isAll ? totalCount : (counts[value] ?? '')}</span>
                        <ChevronDown size={16} className="ms-auto opacity-70" />
                    </button>
                    {!isAll && (
                        <button
                            type="button"
                            aria-label="إعادة لكل المدن"
                            onClick={() => onChange('all')}
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-e-xl border border-s-0 border-emerald-600 bg-emerald-600 text-white transition-colors hover:bg-emerald-700"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Portaled panel — escapes the hero's overflow-hidden + stacking contexts. */}
            {open && typeof document !== 'undefined' && createPortal(panel, document.body)}
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
