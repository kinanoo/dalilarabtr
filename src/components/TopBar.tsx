'use client';

import { useEffect, useState, useRef } from 'react';
import { getNextPrayer, getPrayerTimes, PrayerTimes, TURKEY_CITIES } from '@/lib/prayer-times';
import { Moon, Calendar, ChevronDown, MapPin, Clock } from 'lucide-react';

export default function TopBar() {
    const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; remainingMinutes: number } | null>(null);
    const [allPrayers, setAllPrayers] = useState<PrayerTimes | null>(null);
    const [hijriDate, setHijriDate] = useState<string>('');

    // City State
    const [cityId, setCityId] = useState('Istanbul');
    const [showCities, setShowCities] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);
    const cityDropdownRef = useRef<HTMLDivElement>(null);
    const scheduleRef = useRef<HTMLDivElement>(null);

    // Load saved city
    useEffect(() => {
        const saved = localStorage.getItem('daleel_prayer_city');
        if (saved) setCityId(saved);
    }, []);

    // Fetch Data when city changes
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
                console.warn('TopBar: Failed to load prayer data', err);
            }
        }
        loadData();
        return () => { cancelled = true; };
    }, [cityId]);

    // Handle City Change
    const handleCitySelect = (id: string) => {
        setCityId(id);
        localStorage.setItem('daleel_prayer_city', id);
        setShowCities(false);
    };

    const currentCityName = TURKEY_CITIES.find(c => c.id === cityId)?.nameAr || 'إسطنبول';

    // Close dropdowns on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
                setShowCities(false);
            }
            if (scheduleRef.current && !scheduleRef.current.contains(event.target as Node)) {
                setShowSchedule(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="bg-slate-900 text-white text-[9px] sm:text-xs font-bold py-1 sm:py-1.5 px-4 relative z-[1001] min-h-[24px] sm:min-h-[32px] flex items-center">
            <div className="max-w-screen-2xl mx-auto w-full flex items-center justify-between relative">

                {/* Right: Hijri Date */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-1.5 text-slate-300">
                        <Calendar size={12} className="text-emerald-400" />
                        <span suppressHydrationWarning>{hijriDate || '...'}</span>
                    </div>
                </div>

                {/* Center/Left: Prayer Info */}
                <div className="flex items-center gap-4">

                    {/* 1. Ticker (Trigger for Schedule) */}
                    <div
                        ref={scheduleRef}
                        className="relative group cursor-pointer"
                        onMouseEnter={() => setShowSchedule(true)}
                        onMouseLeave={() => setShowSchedule(false)}
                        onClick={() => setShowSchedule(!showSchedule)}
                    >
                        <div className="flex items-center gap-2 min-w-[120px] sm:min-w-[180px]" suppressHydrationWarning>
                            <span className="text-slate-400 hidden sm:inline">صلاة:</span>
                            {nextPrayer ? (
                                <div className="flex items-center gap-1.5 animate-pulse group-hover:animate-none">
                                    <span className="text-emerald-400">{nextPrayer.name}</span>
                                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono dir-ltr">
                                        {nextPrayer.time}
                                    </span>
                                    <span className="text-slate-500 text-[9px] sm:text-[10px]">
                                        (-{Math.floor(nextPrayer.remainingMinutes / 60)}س {nextPrayer.remainingMinutes % 60}د)
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    <span className="h-3 w-10 bg-slate-700 rounded animate-pulse" />
                                    <span className="h-4 w-12 bg-slate-700 rounded animate-pulse" />
                                </div>
                            )}
                            <Moon size={12} className="text-emerald-500" />
                        </div>

                        {/* Schedule Popover */}
                        {showSchedule && allPrayers && (
                            <div className="absolute top-full end-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50 text-slate-800 dark:text-slate-200">
                                <div className="text-center pb-2 mb-2 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-emerald-600">
                                    مواقيت الصلاة في {currentCityName}
                                </div>
                                <div className="space-y-1.5">
                                    {[
                                        { n: 'الفجر', t: allPrayers.Fajr },
                                        { n: 'الشروق', t: allPrayers.Sunrise },
                                        { n: 'الظهر', t: allPrayers.Dhuhr },
                                        { n: 'العصر', t: allPrayers.Asr },
                                        { n: 'المغرب', t: allPrayers.Maghrib },
                                        { n: 'العشاء', t: allPrayers.Isha },
                                    ].map((p, idx) => (
                                        <div key={idx} className={`flex justify-between items-center px-2 py-1 rounded ${p.n === nextPrayer?.name ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700' : ''}`}>
                                            <span>{p.n}</span>
                                            <span className="font-mono text-[10px]">{p.t}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. City Selector */}
                    <div className="relative" ref={cityDropdownRef}>
                        <button
                            onClick={() => setShowCities(!showCities)}
                            aria-label="تغيير المدينة لمواقيت الصلاة"
                            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors bg-slate-800/50 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 min-h-[36px]"
                        >
                            <MapPin size={14} />
                            <span>{currentCityName}</span>
                            <ChevronDown size={14} />
                        </button>

                        {showCities && (
                            <div className="absolute top-full end-0 mt-2 w-40 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50 scrollbar-hide">
                                {TURKEY_CITIES.map((city) => (
                                    <button
                                        key={city.id}
                                        onClick={() => handleCitySelect(city.id)}
                                        className={`w-full text-start px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 ${city.id === cityId ? 'text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-600 dark:text-slate-300'}`}
                                    >
                                        {city.nameAr}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
}
