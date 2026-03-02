import { NextResponse, type NextRequest } from 'next/server'

// NOTE: Supabase admin auth temporarily moved to page-level checks
// due to Vercel Edge deployment issue (dxb1 region outage affecting Middleware globally).
// TODO: Restore full Supabase middleware auth once Vercel resolves the incident.

export async function middleware(request: NextRequest) {
    // Block main vercel.app URLs — allow preview deployments for testing
    const host = request.headers.get('host') || '';
    if (host === 'dalilarab.vercel.app' || host === 'dalilarabtest.vercel.app') {
        return new NextResponse(
            '<html dir="rtl"><head><meta charset="utf-8"><title>انتقل الموقع</title></head>' +
            '<body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#0f172a;color:#e2e8f0;text-align:center">' +
            '<div><h1 style="font-size:2rem;margin-bottom:1rem">🚫 هذا الرابط لم يعد يعمل</h1>' +
            '<p style="font-size:1.2rem;color:#94a3b8">انتقل الموقع إلى عنوان جديد</p>' +
            '</div></body></html>',
            { status: 410, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
    }

    // Redirect www to non-www (canonical domain)
    if (host === 'www.dalilarabtr.com') {
        const url = request.nextUrl.clone();
        url.host = 'dalilarabtr.com';
        url.protocol = 'https';
        return NextResponse.redirect(url, 308);
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        // Run on all pages (for vercel.app redirect) except static assets
        '/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|pdf)$).*)',
    ],
}
