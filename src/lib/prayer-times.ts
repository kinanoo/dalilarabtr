import logger from '@/lib/logger';
export type PrayerTimes = {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
    [key: string]: string;
};

export type HijriDate = {
    date: string;
    format: string;
    day: string;
    weekday: { ar: string; en: string };
    month: { ar: string; en: string };
    year: string;
    designation: { abbreviated: string; expanded: string };
};

export const TURKEY_CITIES = [
    { id: 'Istanbul', nameAr: 'إسطنبول', nameTr: 'İstanbul' },
    { id: 'Ankara', nameAr: 'أنقرة', nameTr: 'Ankara' },
    { id: 'Izmir', nameAr: 'إزمير', nameTr: 'İzmir' },
    { id: 'Bursa', nameAr: 'بورصة', nameTr: 'Bursa' },
    { id: 'Antalya', nameAr: 'أنطاليا', nameTr: 'Antalya' },
    { id: 'Adana', nameAr: 'أضنة', nameTr: 'Adana' },
    { id: 'Konya', nameAr: 'قونية', nameTr: 'Konya' },
    { id: 'Gaziantep', nameAr: 'غازي عنتاب', nameTr: 'Gaziantep' },
    { id: 'Sanliurfa', nameAr: 'أورفا', nameTr: 'Şanlıurfa' },
    { id: 'Mersin', nameAr: 'مرسين', nameTr: 'Mersin' },
    { id: 'Hatay', nameAr: 'هاتاي', nameTr: 'Hatay' },
    { id: 'Kayseri', nameAr: 'قيصري', nameTr: 'Kayseri' },
    { id: 'Trabzon', nameAr: 'طرابزون', nameTr: 'Trabzon' },
    { id: 'Samsun', nameAr: 'سامسون', nameTr: 'Samsun' },
    { id: 'Sakarya', nameAr: 'سكاريا', nameTr: 'Sakarya' },
    { id: 'Kocaeli', nameAr: 'كوجالي', nameTr: 'Kocaeli' },
    { id: 'Eskisehir', nameAr: 'إسكي شهير', nameTr: 'Eskişehir' },
    { id: 'Diyarbakir', nameAr: 'ديار بكر', nameTr: 'Diyarbakır' },
    { id: 'Kahramanmaras', nameAr: 'كهرمان مرعش', nameTr: 'Kahramanmaraş' },
    { id: 'Malatya', nameAr: 'ملاطية', nameTr: 'Malatya' },
];

export async function getPrayerTimes(city: string = 'Istanbul', country: string = 'Turkey'): Promise<{ timings: PrayerTimes; date: HijriDate } | null> {
    try {
        // استخدام API Route محلي (proxy) لتجاوز CSP وإضافة caching
        const res = await fetch(`/api/prayer-times?city=${city}&country=${country}`);
        if (!res.ok) return null;
        const data = await res.json();
        return {
            timings: data.timings,
            date: data.date
        };
    } catch (error) {
        logger.warn('Prayer times unavailable:', error instanceof Error ? error.message : 'Unknown error');
        return null;
    }
}

export function getNextPrayer(timings: PrayerTimes): { name: string; time: string; remainingMinutes: number } | null {
    // Use Istanbul time — prayer times are for Turkey regardless of browser timezone
    const now = new Date();
    const istanbulNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
    const currentMinutes = istanbulNow.getHours() * 60 + istanbulNow.getMinutes();

    const prayers = [
        { name: 'الفجر', key: 'Fajr' },
        { name: 'الشروق', key: 'Sunrise' },
        { name: 'الظهر', key: 'Dhuhr' },
        { name: 'العصر', key: 'Asr' },
        { name: 'المغرب', key: 'Maghrib' },
        { name: 'العشاء', key: 'Isha' },
    ];

    for (const p of prayers) {
        const timeStr = timings[p.key];
        if (!timeStr) continue;
        const [h, m] = timeStr.split(':').map(Number);
        const prayerMinutes = h * 60 + m;

        if (prayerMinutes > currentMinutes) {
            return {
                name: p.name,
                time: timeStr,
                remainingMinutes: prayerMinutes - currentMinutes
            };
        }
    }

    // If all passed, next is Fajr tomorrow
    const fajrStr = timings['Fajr'];
    const [fh, fm] = fajrStr.split(':').map(Number);
    const fajrMinutes = fh * 60 + fm;
    const minutesInDay = 24 * 60;

    return {
        name: 'الفجر (غداً)',
        time: fajrStr,
        remainingMinutes: (minutesInDay - currentMinutes) + fajrMinutes
    };
}
