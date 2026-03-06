'use client';

import { useEffect, useState } from 'react';
import { getPrayerTimes, getNextPrayer, PrayerTimes, TURKEY_CITIES } from '@/lib/prayer-times';

interface PrayerData {
    nextPrayer: { name: string; time: string; remainingMinutes: number } | null;
    allPrayers: PrayerTimes | null;
    hijriDate: string;
}

const CACHE_KEY = 'daleel_prayer_cache';
const CITY_KEY = 'daleel_prayer_city';

/** Returns today's date string (YYYY-MM-DD) in Turkey timezone */
function getTurkeyDate(): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
}

// Module-level shared state — prevents duplicate fetches across components
let sharedData: PrayerData | null = null;
let fetchPromise: Promise<void> | null = null;
let currentCacheCity: string | null = null;
let cachedDateStr: string | null = null;

function getCachedData(city: string): PrayerData | null {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const cached = JSON.parse(raw);
        const today = getTurkeyDate();
        if (cached.date === today && cached.city === city) {
            return {
                allPrayers: cached.timings,
                hijriDate: cached.hijriDate,
                nextPrayer: getNextPrayer(cached.timings),
            };
        }
    } catch {}
    return null;
}

function saveCache(city: string, timings: PrayerTimes, hijriDate: string) {
    try {
        const today = getTurkeyDate();
        cachedDateStr = today;
        localStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, city, timings, hijriDate }));
    } catch {}
}

async function fetchAndCache(city: string): Promise<PrayerData> {
    const data = await getPrayerTimes(city, 'Turkey');
    if (!data) return { nextPrayer: null, allPrayers: null, hijriDate: '' };
    const hijriDate = `${data.date.weekday.ar}، ${data.date.day} ${data.date.month.ar}`;
    saveCache(city, data.timings, hijriDate);
    return {
        allPrayers: data.timings,
        hijriDate,
        nextPrayer: getNextPrayer(data.timings),
    };
}

export function usePrayerData() {
    const [cityId, setCityId] = useState('Istanbul');
    const [data, setData] = useState<PrayerData>({ nextPrayer: null, allPrayers: null, hijriDate: '' });

    // Load saved city
    useEffect(() => {
        const saved = localStorage.getItem(CITY_KEY);
        if (saved) setCityId(saved);
    }, []);

    // Fetch prayer data — shared across all hook instances
    useEffect(() => {
        let cancelled = false;

        async function load() {
            // Try cache first (instant, no network)
            const cached = getCachedData(cityId);
            if (cached) {
                sharedData = cached;
                currentCacheCity = cityId;
                if (!cancelled) setData(cached);
                return;
            }

            // If already fetching for same city, wait for it
            if (fetchPromise && currentCacheCity === cityId && sharedData) {
                if (!cancelled) setData(sharedData);
                return;
            }

            // Fetch from network (once)
            currentCacheCity = cityId;
            fetchPromise = fetchAndCache(cityId).then(result => {
                sharedData = result;
                fetchPromise = null;
            });
            await fetchPromise;
            if (!cancelled && sharedData) setData(sharedData);
        }

        load();
        return () => { cancelled = true; };
    }, [cityId]);

    // Recalculate next prayer every minute + detect day change (Istanbul midnight)
    useEffect(() => {
        if (!data.allPrayers) return;
        const interval = setInterval(() => {
            const nowDate = getTurkeyDate();
            if (cachedDateStr && nowDate !== cachedDateStr) {
                // Day changed in Turkey — re-fetch fresh data
                sharedData = null;
                fetchPromise = null;
                cachedDateStr = null;
                localStorage.removeItem(CACHE_KEY);
                fetchAndCache(cityId).then(result => {
                    sharedData = result;
                    setData(result);
                });
                return;
            }
            setData(prev => ({
                ...prev,
                nextPrayer: prev.allPrayers ? getNextPrayer(prev.allPrayers) : null,
            }));
        }, 60_000);
        return () => clearInterval(interval);
    }, [data.allPrayers, cityId]);

    const handleCityChange = (id: string) => {
        setCityId(id);
        localStorage.setItem(CITY_KEY, id);
        // Clear shared cache to force re-fetch
        sharedData = null;
        fetchPromise = null;
    };

    const currentCityName = TURKEY_CITIES.find(c => c.id === cityId)?.nameAr || 'إسطنبول';

    return {
        ...data,
        cityId,
        currentCityName,
        handleCityChange,
    };
}
