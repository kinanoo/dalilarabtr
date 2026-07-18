import { NextResponse } from 'next/server';
import { getRates } from '@/lib/rates';

/**
 * Live TRY exchange rates — USD, EUR, SAR, gram/ounce gold, Syrian pound — for
 * the ticker's client-side refresh. The fetch + compute logic lives in
 * `@/lib/rates` so the homepage server render can reuse it (initial ticker
 * content, no client round-trip). Keyless, edge-cached, resilient.
 */
export const runtime = 'nodejs';

export async function GET() {
    const data = await getRates();
    if (!data.ok) return NextResponse.json({ ok: false }, { status: 200 });
    return NextResponse.json(
        { ok: true, rates: data.rates, updated: data.updated },
        { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } }
    );
}
