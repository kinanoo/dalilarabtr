'use client';
import ToolSchema from '@/components/ToolSchema';

import PageHero from '@/components/PageHero';
import HeroSearchInput from '@/components/HeroSearchInput';
import { useAdminCodes } from '@/lib/useAdminData';
import type { AdminCode } from '@/lib/types';
import { useState } from 'react';
import { ShieldAlert, AlertTriangle, Info, CheckCircle, Loader2 } from 'lucide-react';
import ShareMenu from '@/components/ShareMenu';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/config';
import { intelligentTokenize } from '@/lib/intelligentSearch';
import { normalizeArabic } from '@/lib/arabicSearch';
import { UI, severityLabel, categoryLabel, type Lang } from '@/lib/codesI18n';
import CodesLangToggle from '@/components/codes/CodesLangToggle';

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info', 'safe'];

export default function CodesClient({ initialCodes, lang = 'ar' }: { initialCodes: AdminCode[]; lang?: Lang }) {
  const { codes: remoteCodes, loading } = useAdminCodes();
  // The server already passed the full code list, so render it INSTANTLY — no
  // client-side spinner wall. Remote data merges in silently once SWR resolves.
  const codes = remoteCodes.length > 0 ? remoteCodes : initialCodes;
  const [query, setQuery] = useState('');
  const [letterFilter, setLetterFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const ui = UI[lang];
  const suffix = lang === 'tr' ? '?lang=tr' : '';
  // Language-aware display (Turkish falls back to Arabic when not translated).
  const dTitle = (c: AdminCode) => (lang === 'tr' ? c.title_tr || c.title : c.title);
  const dDesc = (c: AdminCode) => (lang === 'tr' ? c.description_tr || c.desc : c.desc);
  const hasTr = codes.some((c) => c.title_tr || c.description_tr);
  const showToggle = hasTr || lang === 'tr';

  // Detect available letter groups from data
  const letterGroups = codes.reduce((acc, item) => {
    const letter = item.code.replace(/[0-9\-]/g, '').toUpperCase();
    if (letter) acc.add(letter);
    return acc;
  }, new Set<string>());
  const sortedLetters = ['Ç', 'V', 'G', 'N', 'O'].filter(l => letterGroups.has(l));
  letterGroups.forEach(l => { if (!sortedLetters.includes(l)) sortedLetters.push(l); });

  // Severity groups present in the data, in a sensible order
  const presentSeverities = SEVERITY_ORDER.filter(s => codes.some(c => c.severity === s));

  // Filter by letter + severity + search
  const filteredCodes = codes.filter(item => {
    if (letterFilter !== 'all') {
      const itemLetter = item.code.replace(/[0-9\-]/g, '').toUpperCase();
      if (itemLetter !== letterFilter) return false;
    }
    if (severityFilter !== 'all' && item.severity !== severityFilter) return false;

    if (!query.trim()) return true;

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

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50/70 text-red-900 dark:bg-red-950/20 dark:text-red-100';
      case 'high': return 'border-orange-500 bg-orange-50/70 text-orange-900 dark:bg-orange-950/20 dark:text-orange-100';
      case 'medium': return 'border-yellow-500 bg-yellow-50/70 text-yellow-900 dark:bg-yellow-950/20 dark:text-yellow-100';
      case 'safe': return 'border-green-500 bg-green-50/70 text-green-900 dark:bg-green-950/20 dark:text-green-100';
      case 'low': return 'border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100';
      default: return 'border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
    }
  };
  const getIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ShieldAlert className="text-red-600" size={24} />;
      case 'high': return <AlertTriangle className="text-orange-600" size={24} />;
      case 'medium': return <Info className="text-yellow-600" size={24} />;
      default: return <CheckCircle className="text-green-600" size={24} />;
    }
  };

  const chip = (active: boolean) =>
    `px-4 py-2 rounded-xl text-sm font-bold transition-all ${
      active
        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
    }`;

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

      <div className="max-w-4xl mx-auto px-4 py-12 w-full" dir={ui.dir}>
        {/* Language toggle */}
        {showToggle && (
          <div className="flex justify-center mb-6">
            <CodesLangToggle arHref="/codes" trHref="/codes?lang=tr" lang={lang} />
          </div>
        )}

        {/* Letter Filter Tabs */}
        {codes.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <button onClick={() => setLetterFilter('all')} className={chip(letterFilter === 'all')}>
              {ui.all} ({codes.length})
            </button>
            {sortedLetters.map(letter => {
              const count = codes.filter(c => c.code.replace(/[0-9\-]/g, '').toUpperCase() === letter).length;
              return (
                <button key={letter} onClick={() => setLetterFilter(letter)} className={`${chip(letterFilter === letter)} font-mono`}>
                  {letter} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Severity Filter Tabs */}
        {presentSeverities.length > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            <button onClick={() => setSeverityFilter('all')} className={`${chip(severityFilter === 'all')} text-xs`}>
              {ui.severityFilter}: {ui.all}
            </button>
            {presentSeverities.map(sev => (
              <button key={sev} onClick={() => setSeverityFilter(sev)} className={`${chip(severityFilter === sev)} text-xs`}>
                {severityLabel(sev, lang)} ({codes.filter(c => c.severity === sev).length})
              </button>
            ))}
          </div>
        )}

        {loading && codes.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={40} className="animate-spin text-emerald-600" />
          </div>
        ) : filteredCodes.length > 0 ? (
          <div className="space-y-3">
            {filteredCodes.map((item) => (
              <Link
                key={item.id}
                href={`/codes/${encodeURIComponent(item.code)}${suffix}`}
                className={`block rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all ${getSeverityStyles(item.severity)}`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">{getIcon(item.severity)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-base sm:text-lg font-black tracking-wide" dir="ltr">{item.code}</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-black/5 ring-1 ring-black/5 dark:bg-white/10 dark:ring-0">
                              {categoryLabel(item.category, lang)}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm sm:text-base mt-1 truncate">{dTitle(item)}</h3>
                        </div>
                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <span className="text-xs font-bold px-2 py-1 rounded-full bg-black/5 ring-1 ring-black/5 dark:bg-white/10 dark:ring-0">
                            {severityLabel(item.severity, lang)}
                          </span>
                          <ShareMenu
                            mini
                            variant="subtle"
                            title={`${item.code} - ${dTitle(item)}`}
                            text={dDesc(item)}
                            url={`${SITE_CONFIG.siteUrl}/codes/${encodeURIComponent(item.code)}${suffix}`}
                          />
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm mt-2 leading-relaxed">{dDesc(item)}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <ShieldAlert size={64} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
              {ui.noResults}{query ? ` — "${query}"` : ''}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{ui.noResultsHint}</p>
          </div>
        )}
      </div>

      <ShareMenu title={ui.heroTitle + ' - ' + SITE_CONFIG.name} />
    </main>
  );
}
