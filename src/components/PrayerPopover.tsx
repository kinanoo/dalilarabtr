'use client';

import { useEffect, useState, useRef } from 'react';
import { getNextPrayer, getPrayerTimes, PrayerTimes, TURKEY_CITIES } from '@/lib/prayer-times';
import { Moon, Calendar, ChevronDown, MapPin, Clock } from 'lucide-react';

export default function PrayerPopover() {
    const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; remainingMinutes: number } | null>(null);
    const [allPrayers, setAllPrayers] = useState<PrayerTimes | null>(null);
    const [hijriDate, setHijriDate] = useState('');
    const [cityId, setCityId] = useState('Istanbul');
    const [isOpen, setIsOpen] = useState(false);
    const [showCities, setShowCities] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Load saved city
    useEffect(() => {
        const saved = localStorage.getItem('daleel_prayer_city');
        if (saved) setCityId(saved);
    }, []);

    // Fetch prayer data when city changes
    useEffect(() => {
        let cancelled = false;
        async function loadData() {
            try {
                const data = await getPrayerTimes(cityId, 'Turkey');
                if (cancelled || !data) return;
                setHijriDate(`${data.date.weekday.ar}، ${data.date.day} ${data.date.month.ar}`);
                setAllPrayers(data.timings);
                setNextPrayer(getNextPrayer(data.timings));
            } catch (err) {
                console.warn('PrayerPopover: Failed to load prayer data', err);
            }
        }
        loadData();
        return () => { cancelled = true; };
    }, [cityId]);

    // Handle city change
    const handleCitySelect = (id: string) => {
        setCityId(id);
        localStorage.setItem('daleel_prayer_city', id);
        setShowCities(false);
    };

    const currentCityName = TURKEY_CITIES.find(c => c.id === cityId)?.nameAr || 'إسطنبول';

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowCities(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const PRAYERS = [
        { n: 'الفجر', key: 'Fajr' },
        { n: 'الشروق', key: 'Sunrise' },
        { n: 'الظهر', key: 'Dhuhr' },
        { n: 'العصر', key: 'Asr' },
        { n: 'المغرب', key: 'Maghrib' },
        { n: 'العشاء', key: 'Isha' },
    ];

    return (
        <div className="relative" ref={popoverRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="مواقيت الصلاة"
                className="relative p-2 min-w-11 min-h-11 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
                <Moon size={20} />
                {nextPrayer && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full" />
                )}
            </button>

            {/* Popover Panel */}
            {isOpen && (
                <div className="absolute top-full end-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 font-cairo">

                    {/* Hijri Date */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm font-bold">
                            <Calendar size={14} />
                            <span suppressHydrationWarning>{hijriDate || '...'}</span>
                        </div>
                    </div>

                    {/* Next Prayer */}
                    {nextPrayer && (
                        <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 border-b border-slate-100 dark:border-slate-800">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">الصلاة القادمة</div>
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{nextPrayer.name}</span>
                                <div className="text-left">
                                    <span className="text-lg font-mono font-bold text-slate-800 dark:text-white">{nextPrayer.time}</span>
                                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                        <Clock size={10} />
                                        <span>-{Math.floor(nextPrayer.remainingMinutes / 60)}س {nextPrayer.remainingMinutes % 60}د</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Full Schedule */}
                    {allPrayers && (
                        <div className="px-3 py-2 space-y-0.5">
                            {PRAYERS.map((p) => (
                                <div
                                    key={p.key}
                                    className={`flex justify-between items-center px-3 py-1.5 rounded-lg text-sm ${
                                        p.n === nextPrayer?.name
                                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold'
                                            : 'text-slate-600 dark:text-slate-300'
                                    }`}
                                >
                                    <span>{p.n}</span>
                                    <span className="font-mono text-xs">{allPrayers[p.key]}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* City Selector */}
                    <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-2.5">
                        <button
                            onClick={() => setShowCities(!showCities)}
                            className="w-full flex items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-emerald-500" />
                                <span>{currentCityName}</span>
                            </div>
                            <ChevronDown size={14} className={`transition-transform ${showCities ? 'rotate-180' : ''}`} />
                        </button>

                        {showCities && (
                            <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-700 scrollbar-hide">
                                {TURKEY_CITIES.map((city) => (
                                    <button
                                        key={city.id}
                                        onClick={() => handleCitySelect(city.id)}
                                        className={`w-full text-start px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                                            city.id === cityId
                                                ? 'text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/20'
                                                : 'text-slate-600 dark:text-slate-300'
                                        }`}
                                    >
                                        {city.nameAr}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
