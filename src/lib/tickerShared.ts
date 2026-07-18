/**
 * Shared, framework-agnostic helpers for the top NewsTicker — used by BOTH the
 * client component (live refresh) and the homepage server render (initial
 * content, so the strip paints full on first frame with no empty/flicker gap).
 */
import type { Rates } from '@/lib/rates';

export type Entry =
    | { kind: 'news'; id: string; text: string; link?: string }
    | { kind: 'rate'; id: string; label: string; value: string; unit: string; change: number };

export const RATE_ITEMS: { key: keyof Rates; label: string; unit: string; dec: number }[] = [
    { key: 'usd', label: 'دولار', unit: '₺', dec: 2 },
    { key: 'eur', label: 'يورو', unit: '₺', dec: 2 },
    { key: 'sar', label: 'ريال سعودي', unit: '₺', dec: 2 },
    { key: 'gold', label: 'غرام ذهب', unit: '₺', dec: 0 },
    { key: 'goldOz', label: 'أونصة ذهب', unit: '$', dec: 0 },
    { key: 'sypUsd', label: 'الدولار مقابل السوري', unit: 'ل.س', dec: 0 },
    { key: 'sypTry', label: 'التركي مقابل السوري', unit: 'ل.س', dec: 2 },
];

const EASTERN_DIGITS = /[٠-٩۰-۹]/g;
export function toLatinDigits(s: string): string {
    return s.replace(EASTERN_DIGITS, (ch) => {
        const code = ch.charCodeAt(0);
        if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660);
        if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0);
        return ch;
    });
}

export function fmt(n: number, dec: number): string {
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

/** Build the rate entries (always-present part) from a computed Rates object. */
export function ratesToEntries(rates: Rates | null | undefined): Entry[] {
    if (!rates) return [];
    const out: Entry[] = [];
    for (const it of RATE_ITEMS) {
        const rate = rates[it.key];
        if (rate) {
            out.push({
                kind: 'rate', id: `rate-${String(it.key)}`, label: it.label,
                value: fmt(rate.value, it.dec), unit: it.unit, change: rate.change,
            });
        }
    }
    return out;
}

/** Build the news entries from active news_ticker rows. */
export function newsRowsToEntries(rows: { id: string | number; text: string; link?: string | null }[] | null | undefined): Entry[] {
    if (!rows) return [];
    return rows.map((n) => ({ kind: 'news' as const, id: String(n.id), text: toLatinDigits(n.text), link: n.link || undefined }));
}

// How many times to repeat entries inside ONE marquee copy so a copy is always
// wider than the viewport (short lists would otherwise leave a gap).
export function repeatCount(n: number): number {
    if (n <= 2) return 6;
    if (n <= 4) return 4;
    if (n <= 8) return 2;
    return 1;
}
