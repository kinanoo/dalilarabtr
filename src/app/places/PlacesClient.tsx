'use client';

// ============================================================================
// 📍 PlacesClient — the interactive layer of «أين يقع؟»
// ============================================================================
// Three states, one screen:
//   • typing (≥2 chars)  → a flat, ranked list across EVERY place we know
//   • missions tab       → embassies + consulates, grouped by the city they sit in
//   • offices + a city   → the 16 kinds of public office in that province
//
// The structured view exists because dumping all ~380 places at once is a wall
// of text nobody reads (and a heavy DOM). The search box is the fast path — it
// is the same question the homepage search answers, kept here so the hub is
// self-sufficient.
// ============================================================================

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MapPin, Navigation, Landmark, Building2, SearchX, ChevronLeft } from 'lucide-react';
import HeroSearchInput from '@/components/HeroSearchInput';
import { normalizeArabic } from '@/lib/arabicSearch';
import {
    MISSION_PLACES,
    OFFICE_KINDS,
    PLACE_CITIES,
    OFFICIAL_PLACES,
    officePlace,
    placeMapUrl,
    placeDirectionsUrl,
    type OfficialPlace,
} from '@/lib/officialPlaces';

// Cities that host at least one mission, in taxonomy order (İstanbul, Ankara…).
const MISSION_CITY_SLUGS = PLACE_CITIES
    .filter((c) => MISSION_PLACES.some((p) => p.citySlug === c.slug))
    .map((c) => c.slug);

// Normalised search corpus — built once, not per keystroke.
const SEARCH_CORPUS: Array<{ place: OfficialPlace; hay: string }> = OFFICIAL_PLACES.map((p) => ({
    place: p,
    hay: normalizeArabic([p.ar, p.tr, p.shortAr, p.cityAr, p.cityTr, ...p.aliases].join(' ')),
}));

const MAX_SEARCH_RESULTS = 60;

function PlaceCard({ place }: { place: OfficialPlace }) {
    const Icon = place.icon;
    return (
        <div className="group relative overflow-hidden flex items-stretch bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all">
            <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1 bg-emerald-500 opacity-70 group-hover:opacity-100 transition-opacity" />

            <Link href={`/places/${place.slug}`} className="flex flex-1 min-w-0 items-center gap-3 p-4 ps-5">
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0 text-lg">
                    {place.flag ? <span aria-hidden="true">{place.flag}</span> : <Icon size={18} />}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-slate-900 dark:text-slate-100 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {place.ar}
                    </span>
                    {/* The address when we have one — more actionable on a list
                        than the Turkish name, which the detail page still shows. */}
                    <span className="block text-[11px] text-slate-400 dark:text-slate-400 truncate mt-0.5" dir="ltr" lang="tr">
                        {place.contact?.address || place.tr}
                    </span>
                    {place.missionType === 'honorary' && (
                        <span className="inline-block mt-1 text-[10px] font-black text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-full px-2 py-0.5">
                            فخرية — لا تُصدر جوازات
                        </span>
                    )}
                </span>
                <ChevronLeft size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 shrink-0" />
            </Link>

            <a
                href={placeMapUrl(place)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`افتح ${place.ar} على خرائط جوجل`}
                title="افتح على خرائط جوجل"
                className="flex flex-col items-center justify-center gap-0.5 px-3.5 border-s border-slate-100 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors shrink-0"
            >
                <MapPin size={18} />
                <span className="text-[10px] font-black">خرائط</span>
            </a>
        </div>
    );
}

export default function PlacesClient() {
    const [query, setQuery] = useState('');
    const [region, setRegion] = useState<'arab' | 'intl'>('arab');
    const [citySlug, setCitySlug] = useState('istanbul');

    const trimmed = query.trim();
    const isSearching = normalizeArabic(trimmed).length >= 2;

    const searchResults = useMemo(() => {
        if (!isSearching) return [];
        const needle = normalizeArabic(trimmed);
        const tokens = needle.split(' ').filter((t) => t.length >= 2);

        const scored: Array<{ place: OfficialPlace; score: number }> = [];
        for (const { place, hay } of SEARCH_CORPUS) {
            const title = normalizeArabic(place.ar);
            let score = 0;
            if (title.includes(needle)) score += 100;
            else if (hay.includes(needle)) score += 40;

            let matched = 0;
            for (const t of tokens) {
                if (title.includes(t)) { score += 12; matched++; }
                else if (hay.includes(t)) { score += 4; matched++; }
            }
            // Every token has to land somewhere — otherwise «القنصلية السورية
            // في إسطنبول» would also return every other consulate in İstanbul.
            if (tokens.length > 0 && matched < tokens.length) continue;
            if (score <= 0) continue;
            scored.push({ place, score });
        }

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, MAX_SEARCH_RESULTS).map((s) => s.place);
    }, [isSearching, trimmed]);

    const missions = useMemo(
        () => MISSION_PLACES.filter((p) => p.region === region),
        [region]
    );

    const missionsByCity = useMemo(
        () => MISSION_CITY_SLUGS
            .map((slug) => ({
                slug,
                cityAr: PLACE_CITIES.find((c) => c.slug === slug)!.ar,
                items: missions.filter((p) => p.citySlug === slug),
            }))
            .filter((g) => g.items.length > 0),
        [missions]
    );

    const officeCards = useMemo(
        () => OFFICE_KINDS
            .map((k) => officePlace(k.id, citySlug))
            .filter((p): p is OfficialPlace => Boolean(p)),
        [citySlug]
    );

    const selectedCity = PLACE_CITIES.find((c) => c.slug === citySlug);
    const gocPlace = officePlace('goc', citySlug);

    return (
        <>
            {/* ── The fast path: ask, get the map ─────────────────────────── */}
            <div className="max-w-6xl mx-auto px-4 -mt-4 w-full">
                <HeroSearchInput
                    value={query}
                    onChange={setQuery}
                    placeholder="اكتب مثلاً: القنصلية السورية في إسطنبول، إدارة الهجرة عنتاب، نفوس..."
                />
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10 w-full">
                {isSearching ? (
                    /* ── Search results ─────────────────────────────────── */
                    <section aria-live="polite">
                        {searchResults.length > 0 ? (
                            <>
                                <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 mb-4">
                                    {searchResults.length}
                                    {searchResults.length === MAX_SEARCH_RESULTS ? '+' : ''} نتيجة — اضغط «خرائط» لتفتح الموقع مباشرة
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {searchResults.map((p) => <PlaceCard key={p.slug} place={p} />)}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-14">
                                <SearchX size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                                <p className="font-black text-slate-700 dark:text-slate-200 mb-1">
                                    لا يوجد مقر مطابق لـ «{trimmed}»
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                                    جرّب كلمة واحدة: <strong>قنصلية</strong>، <strong>سفارة</strong>، <strong>هجرة</strong>،
                                    {' '}<strong>نفوس</strong>، <strong>ضرائب</strong>، <strong>طابو</strong>، <strong>نوتر</strong>
                                    {' '}— أو اسم المدينة وحده.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setQuery('')}
                                    className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-black px-4 py-2.5 hover:border-emerald-300 transition-colors"
                                >
                                    عرض كل المقرات
                                </button>
                            </div>
                        )}
                    </section>
                ) : (
                    <div className="space-y-14">
                        {/* ── السفارات والقنصليات ─────────────────────────── */}
                        <section>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl shrink-0">
                                    <Landmark className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                                        السفارات والقنصليات في تركيا
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        اختر مقرك واذهب إليه مباشرة على خرائط جوجل
                                    </p>
                                </div>
                            </div>

                            <div role="tablist" aria-label="نوع السفارات" className="flex gap-2 mb-5">
                                {([
                                    { id: 'arab' as const, label: 'عربية' },
                                    { id: 'intl' as const, label: 'أجنبية (تأشيرات)' },
                                ]).map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={region === t.id}
                                        onClick={() => setRegion(t.id)}
                                        className={`px-4 py-2 rounded-xl text-sm font-black transition-colors ${region === t.id
                                            ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-600/20'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                                            }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-8">
                                {missionsByCity.map((group) => (
                                    <div key={group.slug}>
                                        <h3 className="flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-200 mb-3">
                                            <MapPin size={15} className="text-emerald-600 dark:text-emerald-400" />
                                            {group.cityAr}
                                            <span className="text-[11px] font-bold text-slate-400">({group.items.length})</span>
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {group.items.map((p) => <PlaceCard key={p.slug} place={p} />)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* ── الدوائر الرسمية حسب الولاية ─────────────────── */}
                        <section>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl shrink-0">
                                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                                        الدوائر والمؤسسات الرسمية
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        اختر ولايتك، ثم افتح أقرب دائرة إليك على الخريطة
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-5">
                                {PLACE_CITIES.map((c) => (
                                    <button
                                        key={c.slug}
                                        type="button"
                                        aria-pressed={citySlug === c.slug}
                                        onClick={() => setCitySlug(c.slug)}
                                        className={`px-3.5 py-2 rounded-full text-xs font-black transition-colors ${citySlug === c.slug
                                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300'
                                            }`}
                                    >
                                        {c.ar}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {officeCards.map((p) => <PlaceCard key={p.slug} place={p} />)}
                            </div>

                            {selectedCity && (
                                <div className="mt-5 flex flex-wrap gap-3">
                                    {/* The single most-asked destination, promoted to a
                                        turn-by-turn link so the common case is one tap. */}
                                    {gocPlace && (
                                        <a
                                            href={placeDirectionsUrl(gocPlace)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black px-4 py-2.5 transition-colors"
                                        >
                                            <Navigation size={15} />
                                            الاتجاهات إلى {gocPlace.ar}
                                        </a>
                                    )}
                                    <Link
                                        href={`/city/${selectedCity.slug}`}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-black px-4 py-2.5 hover:border-emerald-300 transition-colors"
                                    >
                                        <MapPin size={15} />
                                        دليل {selectedCity.ar} الشامل
                                    </Link>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </>
    );
}
