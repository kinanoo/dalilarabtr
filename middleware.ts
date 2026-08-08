import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js Middleware — Server-side route protection
 *
 * Runs BEFORE the page renders on every matched route.
 * Protects /admin/* routes by verifying Supabase session from HTTP-only cookies.
 *
 * This is the first line of defence:
 *   1. middleware.ts  → blocks unauthenticated users (session check)
 *   2. admin layout   → blocks non-admin users (role check via /api/admin/verify)
 *   3. API routes      → block unauthorized operations (session + role check)
 */
export async function middleware(request: NextRequest) {
    // Three very early generic article URLs have no recoverable topic or
    // relevant successor. On this OpenNext deployment notFound() currently
    // renders the correct body but preserves HTTP 200, so Google classifies
    // them as Soft 404. A precise 410 is more honest than redirecting visitors
    // to an unrelated page and tells crawlers to retire only these known URLs.
    const retiredUnknownArticles = new Set([
        '/article/guide-1',
        '/article/guide-2',
        '/article/guide-3',
    ]);
    if (retiredUnknownArticles.has(request.nextUrl.pathname)) {
        return new NextResponse(
            '<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="robots" content="noindex"><title>تمت إزالة الصفحة</title><body><main><h1>تمت إزالة هذه الصفحة</h1><p>لم تعد هذه الصفحة القديمة متاحة.</p></main></body></html>',
            {
                status: 410,
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Cache-Control': 'public, max-age=3600',
                    'X-Robots-Tag': 'noindex, nofollow',
                },
            },
        );
    }

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: Do NOT use getSession() — it reads from storage and can be spoofed.
    // getUser() sends the token to Supabase Auth server for verification.
    const { data: { user } } = await supabase.auth.getUser();

    // Admin routes (except login page): require authenticated session
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
    const isAdminLogin = request.nextUrl.pathname === '/admin/login';

    if (isAdminRoute && !isAdminLogin && !user) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/admin/login';
        return NextResponse.redirect(loginUrl);
    }

    // If user is already authenticated and visits /admin/login, redirect to /admin
    if (isAdminLogin && user) {
        const adminUrl = request.nextUrl.clone();
        adminUrl.pathname = '/admin';
        return NextResponse.redirect(adminUrl);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/article/guide-1',
        '/article/guide-2',
        '/article/guide-3',
    ],
};
