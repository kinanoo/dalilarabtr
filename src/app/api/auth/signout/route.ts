import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * POST /api/auth/signout
 *
 * Server-side sign-out using the SSR client so that Supabase's HTTP-only
 * session cookies are properly deleted from the response headers.
 * Client-side supabase.auth.signOut() alone does NOT reliably clear all
 * server-set cookies, which can leave the middleware thinking the user
 * is still authenticated.
 */
export async function POST(request: NextRequest) {
    const response = NextResponse.json({ ok: true });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    response.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    // Expire the cookie immediately
                    response.cookies.set({ name, value: '', ...options, maxAge: 0 });
                },
            },
        }
    );

    await supabase.auth.signOut();

    return response;
}
