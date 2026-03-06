import { NextRequest, NextResponse } from 'next/server';
import { isRateLimited } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
    // Rate limit: 30 requests per minute per IP
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(`prayer:${clientIp}`, 30)) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || 'Istanbul';
    const country = searchParams.get('country') || 'Turkey';

    try {
        // Use Istanbul timezone — Vercel servers run in UTC, but prayers are for Turkey
        const now = new Date();
        const parts = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Europe/Istanbul',
            day: '2-digit', month: '2-digit', year: 'numeric'
        }).formatToParts(now);
        const day = parts.find(p => p.type === 'day')!.value;
        const month = parts.find(p => p.type === 'month')!.value;
        const year = parts.find(p => p.type === 'year')!.value;
        const dateStr = `${day}-${month}-${year}`;

        const res = await fetch(
            `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${city}&country=${country}&method=13`,
            { next: { revalidate: 3600 } }
        );

        if (!res.ok) return NextResponse.json({ error: 'API failed' }, { status: 502 });

        const data = await res.json();

        return NextResponse.json({
            timings: data.data.timings,
            date: data.data.date.hijri
        }, {
            headers: { 'Cache-Control': 'public, max-age=3600' }
        });
    } catch {
        return NextResponse.json({ error: 'Failed to fetch prayer times' }, { status: 500 });
    }
}
