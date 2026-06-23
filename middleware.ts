import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js Middleware — per-request CSP nonce + server-side route protection
 *
 * Two responsibilities, in order of how often they run:
 *
 *   1. CSP nonce (EVERY page request)
 *      Generates a fresh, unguessable nonce per request and emits a
 *      Content-Security-Policy that trusts ONLY that nonce for inline
 *      scripts (plus 'strict-dynamic', which lets a nonced loader pull in
 *      its own dependencies — this is how GTM/Analytics/Ads keep working
 *      without 'unsafe-inline'). The nonce is forwarded to the render via
 *      the `x-nonce` request header; layout.tsx reads it and stamps it on
 *      our own inline <script> tags. Next.js auto-stamps its framework
 *      scripts by reading the CSP from the request header.
 *
 *      NOTE: using a nonce opts the whole app into dynamic rendering. That
 *      is an accepted, deliberate trade-off here (security over edge cache).
 *
 *   2. Admin auth (only on /admin/*)
 *      First line of defence for the admin area:
 *        middleware.ts → blocks unauthenticated users (session check)
 *        admin layout  → blocks non-admin users (role check via /api/admin/verify)
 *        API routes    → block unauthorized operations (session + role check)
 *      The Supabase round-trip is skipped entirely on public routes so the
 *      nonce work stays cheap on the hot path.
 */

// Generate a base64 nonce from 16 cryptographically-random bytes. Uses the
// Web Crypto API, which is available in the Edge/Worker runtime.
function generateNonce(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
}

// Build the CSP for a given request.
//   - script-src: nonce + strict-dynamic (no 'unsafe-inline'). The host
//     allowlist is kept as a fallback for the rare browser that supports
//     nonces but not strict-dynamic.
//   - admin pages additionally need 'unsafe-eval' for the Monaco editor.
function buildCsp(nonce: string, isAdmin: boolean): string {
    const directives = [
        "default-src 'self'",
        // Tailwind/styled inline styles still rely on 'unsafe-inline'. Inline
        // CSS cannot exfiltrate data the way inline JS can, so this is the
        // standard, low-risk allowance.
        "style-src 'self' 'unsafe-inline' https://vercel.live",
        "img-src 'self' data: blob: https://bcgwbffwzdlzlyjvlyhr.supabase.co https://www.google-analytics.com https://grainy-gradients.vercel.app https://www.google.com https://www.transparenttextures.com https://vercel.live https://vercel.com https://*.vercel.com https://googleads.g.doubleclick.net https://www.googleadservices.com",
        "font-src 'self' data: https://vercel.live",
        "connect-src 'self' https://bcgwbffwzdlzlyjvlyhr.supabase.co https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com https://vercel.live https://*.vercel.live wss://*.pusher.com https://static.cloudflareinsights.com https://www.google.com https://googleads.g.doubleclick.net https://www.googleadservices.com",
        "frame-src 'self' https://tckimlik.nvi.gov.tr https://vercel.live",
        "frame-ancestors 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        // Block legacy plug-ins (Flash, Java) outright.
        "object-src 'none'",
        // Workers only ever come from our own origin (or a blob we create).
        "worker-src 'self' blob:",
        "manifest-src 'self'",
        // script-src: nonce-driven. 'strict-dynamic' makes supporting
        // browsers ignore the host allowlist below (the nonced loader
        // vouches for what it pulls in); the host allowlist is the fallback
        // for browsers that honour nonces but not strict-dynamic.
        [
            "script-src 'self'",
            `'nonce-${nonce}'`,
            "'strict-dynamic'",
            isAdmin ? "'unsafe-eval'" : '',
            'https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live https://static.cloudflareinsights.com https://googleads.g.doubleclick.net https://www.googleadservices.com',
        ]
            .filter(Boolean)
            .join(' '),
    ];
    return directives.join('; ');
}

export async function middleware(request: NextRequest) {
    const nonce = generateNonce();
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
    const isAdminLogin = request.nextUrl.pathname === '/admin/login';
    const csp = buildCsp(nonce, isAdminRoute);

    // Forward the nonce (for our own inline scripts) and the CSP (so Next.js
    // can auto-stamp its framework scripts) to the render via request headers.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('content-security-policy', csp);

    // Public routes: emit the CSP and skip the Supabase round-trip.
    if (!isAdminRoute) {
        const res = NextResponse.next({ request: { headers: requestHeaders } });
        res.headers.set('Content-Security-Policy', csp);
        return res;
    }

    // Admin routes: verify the Supabase session (HTTP-only cookies).
    let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

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
                    supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
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
    if (!isAdminLogin && !user) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/admin/login';
        const redirect = NextResponse.redirect(loginUrl);
        redirect.headers.set('Content-Security-Policy', csp);
        return redirect;
    }

    // If user is already authenticated and visits /admin/login, redirect to /admin
    if (isAdminLogin && user) {
        const adminUrl = request.nextUrl.clone();
        adminUrl.pathname = '/admin';
        const redirect = NextResponse.redirect(adminUrl);
        redirect.headers.set('Content-Security-Policy', csp);
        return redirect;
    }

    supabaseResponse.headers.set('Content-Security-Policy', csp);
    return supabaseResponse;
}

export const config = {
    // Run on every page request so each gets a fresh nonce + CSP, EXCEPT:
    //   - api routes (JSON, no inline scripts to protect)
    //   - Next.js internals and static assets (no HTML)
    //   - well-known static files served from /public
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|feed.xml|og-image.jpg|sw.js|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2|ttf|map)$).*)',
    ],
};
