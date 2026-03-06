'use client';

import { useEffect, useState, useRef } from 'react';
import { TURKEY_CITIES } from '@/lib/prayer-times';
import { Calendar, ChevronDown, MapPin, Clock } from 'lucide-react';
import { usePrayerData } from '@/lib/hooks/usePrayerData';

function MosqueIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
            {/* Crescent on top */}
            <path d="M12 1.5a1.2 1.2 0 0 1 .9 2 1.6 1.6 0 0 0 .1-2A1.2 1.2 0 0 1 12 1.5Z" />
            {/* Minaret left */}
            <rect x="2" y="8" width="2.5" height="12" rx="0.5" />
            <rect x="2.5" y="6" width="1.5" height="2" rx="0.5" />
            <circle cx="3.25" cy="5.5" r="0.6" />
            {/* Dome */}
            <path d="M6 14h12v6H6z" />
            <path d="M12 6c-4 0-6 4-6 8h12c0-4-2-8-6-8Z" />
            {/* Minaret right */}
            <rect x="19.5" y="8" width="2.5" height="12" rx="0.5" />
            <rect x="20" y="6" width="1.5" height="2" rx="0.5" />
            <circle cx="20.75" cy="5.5" r="0.6" />
            {/* Door */}
            <path d="M10.5 16a1.5 1.5 0 0 1 3 0v4h-3z" fill="white" opacity="0.4" />
        </svg>
    );
}

export default function PrayerPopover() {
    const { nextPrayer, allPrayers, hijriDate, cityId, currentCityName, handleCityChange } = usePrayerData();
    const [isOpen, setIsOpen] = useState(false);
    const [showCities, setShowCities] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

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
                className="relative p-2 min-w-11 min-h-11 flex items-center justify-center text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
            >
                <MosqueIcon size={20} />
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
                                        onClick={() => handleCityChange(city.id)}
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
