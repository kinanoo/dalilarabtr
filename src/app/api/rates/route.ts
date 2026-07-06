import { NextResponse } from 'next/server';

/**
 * Live TRY exchange rates — USD, EUR, SAR, gram gold — for the audience's #1
 * daily-habit check. Fetched server-side, edge-cached, and resilient: each
 * source is isolated in its own try/catch so a failure in one falls through to
 * the next instead of aborting the whole route.
 *
 * Sources (free + keyless):
 *   • primary : finans.truncgil.com  (döviz + gram altın + daily change %)
 *   • fallback: open.er-api.com      (fiat only, USD base — no gold, no change)
 *
 * truncgil can be flaky over TLS from some networks; the fallback guarantees
 * USD/EUR/SAR always render (gram gold only when truncgil answers).
 */
export const runtime = 'nodejs';

const REVALIDATE = 600; // 10 min
const UA = 'Mozilla/5.0 (compatible; dalilarabtr/1.0; +https://dalilarabtr.com)';

interface Rate { value: number; change: number }
type Rates = { usd: Rate | null; eur: Rate | null; sar: Rate | null; gold: Rate | null };

function num(v: unknown): number | null {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

async function fromTruncgil(): Promise<{ rates: Rates; updated: string | null } | null> {
    try {
        const res = await fetch('https://finans.truncgil.com/v4/today.json', {
            headers: { 'User-Agent': UA, Accept: 'application/json' },
            signal: AbortSignal.timeout(8000),
            next: { revalidate: REVALIDATE },
        });
        if (!res.ok) return null;
        const d = await res.json() as Record<string, { Selling?: number; Buying?: number; Change?: number }> & { Update_Date?: string };
        const pick = (k: string): Rate | null => {
            const o = d[k];
            if (!o) return null;
            const value = num(o.Selling ?? o.Buying);
            if (value == null) return null;
            return { value, change: num(o.Change) ?? 0 };
        };
        const rates: Rates = { usd: pick('USD'), eur: pick('EUR'), sar: pick('SAR'), gold: pick('GRA') };
        if (!rates.usd && !rates.eur) return null;
        return { rates, updated: (d.Update_Date as string) || null };
    } catch {
        return null;
    }
}

async function fromErApi(): Promise<{ rates: Rates; updated: string | null } | null> {
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD', {
            headers: { 'User-Agent': UA },
            signal: AbortSignal.timeout(8000),
            next: { revalidate: REVALIDATE },
        });
        if (!res.ok) return null;
        const d = await res.json() as { result?: string; rates?: Record<string, number>; time_last_update_utc?: string };
        const t = d?.rates?.TRY;
        if (d.result !== 'success' || !t) return null;
        // USD base → TRY per unit of X = (USD→TRY) / (USD→X)
        const per = (code: string): Rate | null => {
            const r = d.rates?.[code];
            return r ? { value: t / r, change: 0 } : null;
        };
        const rates: Rates = { usd: { value: t, change: 0 }, eur: per('EUR'), sar: per('SAR'), gold: null };
        return { rates, updated: d.time_last_update_utc || null };
    } catch {
        return null;
    }
}

export async function GET() {
    const data = (await fromTruncgil()) || (await fromErApi());
    if (!data) return NextResponse.json({ ok: false }, { status: 200 });
    return NextResponse.json(
        { ok: true, rates: data.rates, updated: data.updated },
        { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } }
    );
}
