'use client';
import ToolSchema from '@/components/ToolSchema';

import PageHero from '@/components/PageHero';
import HeroSearchInput from '@/components/HeroSearchInput';
import { useAdminCodes } from '@/lib/useAdminData';
import type { AdminCode } from '@/lib/types';
import { useMemo, useState } from 'react';
import { ShieldAlert, AlertTriangle, ChevronLeft, Clock, Loader2, Layers } from 'lucide-react';
import ShareMenu from '@/components/ShareMenu';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/config';
import { intelligentTokenize } from '@/lib/intelligentSearch';
import { normalizeArabic } from '@/lib/arabicSearch';
import { UI, severityLabel, categoryLabel, codeCount, type Lang } from '@/lib/codesI18n';
import CodesLangToggle from '@/components/codes/CodesLangToggle';
import Breadcrumbs from '@/components/Breadcrumbs';

/*
 * Radical list redesign (owner+visitor thinking, 2026-07):
 * The old page was 125 tall, fully colour-washed cards in one endless scroll,
 * filtered by cryptic letter chips. A visitor who just saw "Ç-101" at the
 * airport needs: search → answer; a browsing visitor needs to UNDERSTAND the
 * code families. So:
 *  1. Family cards (Ç/V/G/N/O) with counts + dominant categories — derived
 *     from the data itself (no invented meanings), acting as the filter.
 *  2. Compact scannable rows (severity dot + mono code + title + one clamped
 *     description line) instead of full-width colour washes.
 *  3. Grouped-by-family sections with headers when unfiltered.
 *  4. A "most critical" strip (severity=critical, straight from the data).
 */

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info', 'safe'];

// Static class maps — Tailwind's scanner needs literal strings.
const DOT: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-slate-400',
    info: 'bg-blue-400',
    safe: 'bg-green-500',
};
// The "passport-stamp stub": a severity-tinted block holding code + severity,
// separated from the card body by a dashed tear line (ticket metaphor).
const STUB: Record<string, { bg: string; text: string }> = {
    critical: { bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-300' },
    high: { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-300' },
    medium: { bg: 'bg-yellow-50 dark:bg-yellow-950/40', text: 'text-yellow-700 dark:text-yellow-300' },
    low: { bg: 'bg-slate-100 dark:bg-slate-800/60', text: 'text-slate-600 dark:text-slate-300' },
    info: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300' },
    safe: { bg: 'bg-green-50 dark:bg-green-950/40', text: 'text-green-700 dark:text-green-300' },
};

const FAMILY_ORDER = ['Ç', 'V', 'G', 'N', 'O'];

function famOf(code: string): string {
    return code.replace(/[0-9\-\s]/g, '').toUpperCase() || '#';
}

export default function CodesClient({ initialCodes, lang = 'ar' }: { initialCodes: AdminCode[]; lang?: Lang }) {
    const { codes: remoteCodes, loading } = useAdminCodes();
    // Server passed the full list — render INSTANTLY; SWR merges in silently.
    const codes = remoteCodes.length > 0 ? remoteCodes : initialCodes;
    const [query, setQuery] = useState('');
    const [familyFilter, setFamilyFilter] = useState('all');
    const [severityFilter, setSeverityFilter] = useState('all');

    const ui = UI[lang];
    const suffix = lang === 'tr' ? '?lang=tr' : '';
    const dTitle = (c: AdminCode) => (lang === 'tr' ? c.title_tr || c.title : c.title);
    const dDesc = (c: AdminCode) => (lang === 'tr' ? c.description_tr || c.desc : c.desc);
    const hasTr = codes.some((c) => c.title_tr || c.description_tr);
    const showToggle = hasTr || lang === 'tr';

    // ── Families, derived from the data (counts + dominant categories).
    // Rare letters (<5 codes: O, K, A, numeric-only…) collapse into one
    // "أخرى" bucket so phones aren't cluttered with one-code boxes. ──
    const { families, majorLetters } = useMemo(() => {
        const map = new Map<string, AdminCode[]>();
        codes.forEach((c) => {
            const f = famOf(c.code);
            if (!map.has(f)) map.set(f, []);
            map.get(f)!.push(c);
        });
        const order = [...FAMILY_ORDER.filter((f) => map.has(f)), ...[...map.keys()].filter((f) => !FAMILY_ORDER.includes(f)).sort()];
        const majors = order.filter((l) => map.get(l)!.length >= 5);
        const otherCount = order.filter((l) => !majors.includes(l)).reduce((n, l) => n + map.get(l)!.length, 0);
        const fams = majors.map((letter) => {
            const list = map.get(letter)!;
            const freq: Record<string, number> = {};
            list.forEach((c) => {
                const k = categoryLabel(c.category, lang);
                freq[k] = (freq[k] || 0) + 1;
            });
            const topCats = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);
            return { letter, count: list.length, topCats };
        });
        if (otherCount > 0) fams.push({ letter: 'other', count: otherCount, topCats: [] });
        return { families: fams, majorLetters: majors };
    }, [codes, lang]);

    const famMatch = (code: string, filter: string) =>
        filter === 'other' ? !majorLetters.includes(famOf(code)) : famOf(code) === filter;

    // ── "Most critical" quick-access strip (straight from severity data).
    // 6 chips ≈ two wrapped lines on a 360px phone — no side-scroll. ──
    const criticalCodes = useMemo(() => codes.filter((c) => c.severity === ('critical' as AdminCode['severity'])).slice(0, 6), [codes]);

    const presentSeverities = SEVERITY_ORDER.filter((s) => codes.some((c) => c.severity === s));

    // ── Filtering ──
    const searchActive = query.trim().length > 0;
    const filteredCodes = codes.filter((item) => {
        if (familyFilter !== 'all' && !famMatch(item.code, familyFilter)) return false;
        if (severityFilter !== 'all' && item.severity !== severityFilter) return false;
        if (!searchActive) return true;

        const { originalTokens, expandedTokens } = intelligentTokenize(query);
        const searchText = normalizeArabic(`${item.code} ${dTitle(item)} ${dDesc(item)}`);
        const needle = normalizeArabic(query);

        let score = 0;
        let hasOriginalKeyword = false;
        originalTokens.forEach((token: string) => {
            if (searchText.includes(normalizeArabic(token))) { hasOriginalKeyword = true; score += 20; }
        });
        if (!hasOriginalKeyword) return false;
        expandedTokens.forEach((term: string) => {
            if (!originalTokens.includes(term) && searchText.includes(normalizeArabic(term))) score += 8;
        });
        if (searchText.includes(needle)) score += 25;
        return score >= 10;
    });

    // Grouped sections when browsing; flat list when searching. Plain
    // computation — ≤125 items, memoization not worth the stale-deps risk.
    const grouped = (() => {
        if (searchActive) return null;
        const map = new Map<string, AdminCode[]>();
        filteredCodes.forEach((c) => {
            const f = famOf(c.code);
            if (!map.has(f)) map.set(f, []);
            map.get(f)!.push(c);
        });
        const order = [...FAMILY_ORDER.filter((f) => map.has(f)), ...[...map.keys()].filter((f) => !FAMILY_ORDER.includes(f)).sort()];
        return order.map((letter) => ({ letter, list: map.get(letter)! }));
    })();

    // ── Card: "passport-stamp stub" (owner's pick, 2026-07). A severity-
    // tinted stub holds the code + severity like a stamped ticket edge,
    // separated by a dashed tear line; the body carries title, one clamped
    // description line and the in-force duration. Plain render helper — NOT
    // a nested component, so cards don't remount on every keystroke. ──
    const row = (item: AdminCode) => {
        const stub = STUB[item.severity] || STUB.low;
        const dur = lang === 'tr' ? item.duration_tr || item.duration : item.duration;
        return (
            <Link
                key={item.id}
                href={`/codes/${encodeURIComponent(item.code)}${suffix}`}
                className="group flex items-stretch rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 hover:-translate-y-0.5 transition-all"
            >
                {/* Stamp stub — severity-tinted, dashed tear line on its inner edge */}
                <span className={`w-[5.25rem] sm:w-24 shrink-0 flex flex-col items-center justify-center gap-0.5 px-1.5 py-3 border-e-2 border-dashed border-slate-200 dark:border-slate-700 ${stub.bg}`}>
                    <span dir="ltr" className={`font-mono font-black text-sm sm:text-base leading-none ${stub.text}`}>
                        {item.code}
                    </span>
                    <span className={`text-[10px] font-bold text-center leading-tight ${stub.text}`}>
                        {severityLabel(item.severity, lang)}
                    </span>
                </span>
                {/* Body */}
                <span className="min-w-0 flex-1 flex items-center gap-2.5 px-3.5 sm:px-4 py-3">
                    <span className="min-w-0 flex-1">
                        <span className="block font-bold text-sm text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                            {dTitle(item)}
                        </span>
                        <span className="block text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {dDesc(item)}
                        </span>
                        {dur && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1.5">
                                <Clock size={12} className="shrink-0" />
                                <span className="truncate">{dur}</span>
                            </span>
                        )}
                    </span>
                    <ChevronLeft size={16} className={`text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 shrink-0 transition-colors ${lang === 'tr' ? 'rotate-180' : ''}`} />
                </span>
            </Link>
        );
    };

    return (
        <main className="flex flex-col min-h-screen">
            <ToolSchema tool="security-codes" />

            <PageHero
                title={ui.heroTitle}
                description={ui.heroDesc}
                icon={<ShieldAlert className="w-10 h-10 md:w-12 md:h-12 text-red-500" />}
            >
                <HeroSearchInput
                    value={query}
                    onChange={setQuery}
                    placeholder={ui.searchPlaceholder}
                    dir="ltr"
                    inputClassName="font-bold uppercase tracking-wider placeholder:text-right placeholder:[direction:rtl]"
                />
            </PageHero>

            <div className="max-w-4xl mx-auto px-4 py-10 w-full" dir={ui.dir}>
                <Breadcrumbs
                    items={[
                        { name: lang === 'tr' ? 'Tahdit Kodları' : 'الأكواد', href: `/codes${suffix}`, isActive: true },
                    ]}
                />
                {/* Language toggle */}
                {showToggle && (
                    <div className="flex justify-center mb-8">
                        <CodesLangToggle arHref="/codes" trHref="/codes?lang=tr" lang={lang} />
                    </div>
                )}

                {loading && codes.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={40} className="animate-spin text-emerald-600" />
                    </div>
                ) : (
                    <>
                        {/* ── Family cards (the filter) ── */}
                        {!searchActive && families.length > 1 && (
                            <section className="mb-8">
                                <h2 className="text-[11px] font-black tracking-[0.2em] uppercase text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
                                    <Layers size={12} />
                                    {ui.families}
                                </h2>
                                {/* Compact wrapping pills — NO horizontal scroll, no big
                                    squares; fits 360px phones in two short lines. */}
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFamilyFilter('all')}
                                        aria-pressed={familyFilter === 'all'}
                                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-black transition-all ${
                                            familyFilter === 'all'
                                                ? 'border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-emerald-300 dark:hover:border-emerald-700'
                                        }`}
                                    >
                                        {ui.all}
                                        <span className={`text-[10px] font-bold ${familyFilter === 'all' ? 'text-emerald-100' : 'text-slate-400'}`}>{codes.length}</span>
                                    </button>
                                    {families.map((f) => (
                                        <button
                                            key={f.letter}
                                            type="button"
                                            onClick={() => setFamilyFilter(familyFilter === f.letter ? 'all' : f.letter)}
                                            aria-pressed={familyFilter === f.letter}
                                            title={f.topCats.join(' · ')}
                                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-black transition-all ${
                                                familyFilter === f.letter
                                                    ? 'border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-emerald-300 dark:hover:border-emerald-700'
                                            }`}
                                        >
                                            {f.letter === 'other'
                                                ? <span>{ui.other}</span>
                                                : <span dir="ltr" className="font-mono">{f.letter}</span>}
                                            <span className={`text-[10px] font-bold ${familyFilter === f.letter ? 'text-emerald-100' : 'text-slate-400'}`}>{f.count}</span>
                                        </button>
                                    ))}
                                </div>
                                {/* Dominant categories of the selected family — from the data */}
                                {familyFilter !== 'all' && (
                                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-bold">
                                        {families.find((f) => f.letter === familyFilter)?.topCats.join(' · ')}
                                    </p>
                                )}
                            </section>
                        )}

                        {/* ── Most-critical quick strip ── */}
                        {!searchActive && familyFilter === 'all' && severityFilter === 'all' && criticalCodes.length > 0 && (
                            <section className="mb-8">
                                <h2 className="text-[11px] font-black tracking-[0.2em] uppercase text-red-600 dark:text-red-400 mb-3 flex items-center gap-1.5">
                                    <AlertTriangle size={12} />
                                    {ui.critical}
                                </h2>
                                {/* Wrapping chips — everything visible, no side-drag. */}
                                <div className="flex flex-wrap gap-2">
                                    {criticalCodes.map((c) => (
                                        <Link
                                            key={c.id}
                                            href={`/codes/${encodeURIComponent(c.code)}${suffix}`}
                                            className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/20 hover:border-red-400 hover:shadow-md hover:shadow-red-500/10 transition-all"
                                        >
                                            <span dir="ltr" className="font-mono font-black text-xs text-red-700 dark:text-red-400">{c.code}</span>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 max-w-[9rem] truncate">{dTitle(c)}</span>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ── Severity filter ── */}
                        {presentSeverities.length > 1 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                                <button
                                    type="button"
                                    onClick={() => setSeverityFilter('all')}
                                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                                        severityFilter === 'all'
                                            ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {ui.severityFilter}: {ui.all}
                                </button>
                                {presentSeverities.map((sev) => (
                                    <button
                                        key={sev}
                                        type="button"
                                        onClick={() => setSeverityFilter(severityFilter === sev ? 'all' : sev)}
                                        className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                                            severityFilter === sev
                                                ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${DOT[sev]}`} />
                                        {severityLabel(sev, lang)} ({codes.filter((c) => c.severity === sev).length})
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* ── Results ── */}
                        {filteredCodes.length === 0 ? (
                            <div className="text-center py-20">
                                <ShieldAlert size={64} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    {ui.noResults}{query ? ` — "${query}"` : ''}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{ui.noResultsHint}</p>
                            </div>
                        ) : searchActive ? (
                            /* Flat results while searching */
                            <section>
                                <h2 className="text-[11px] font-black tracking-[0.2em] uppercase text-slate-400 mb-3">
                                    {ui.searchResults} · {codeCount(filteredCodes.length, lang)}
                                </h2>
                                <div className="space-y-2.5">
                                    {filteredCodes.map(row)}
                                </div>
                            </section>
                        ) : (
                            /* Grouped by family while browsing */
                            <div className="space-y-8">
                                {grouped!.map(({ letter, list }) => (
                                    <section key={letter}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span dir="ltr" className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                                {letter === '#' ? '•' : letter}
                                            </span>
                                            <h2 className="text-sm font-black text-slate-700 dark:text-slate-200">
                                                {letter === '#' ? ui.other : `${ui.familyWord} ${letter}`}
                                            </h2>
                                            <span className="text-xs font-bold text-slate-400">· {codeCount(list.length, lang)}</span>
                                        </div>
                                        <div className="space-y-2.5">
                                            {list.map(row)}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            <ShareMenu title={ui.heroTitle + ' - ' + SITE_CONFIG.name} />
        </main>
    );
}
