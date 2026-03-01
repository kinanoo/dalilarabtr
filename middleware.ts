import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // Redirect vercel.app → custom domain
    const host = request.headers.get('host') || '';
    if (host.includes('.vercel.app')) {
        const url = new URL(request.url);
        url.host = 'dalilarabtr.com';
        url.port = '';
        return NextResponse.redirect(url, 301);
    }

    // --- Admin route protection (only for /admin paths) ---
    if (!request.nextUrl.pathname.startsWith('/admin')) {
        return NextResponse.next()
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Create Supabase client to refresh the session token
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options })
                    response = NextResponse.next({ request: { headers: request.headers } })
                    response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options })
                    response = NextResponse.next({ request: { headers: request.headers } })
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Allow admin login page always
    if (request.nextUrl.pathname.startsWith('/admin/login')) {
        return response
    }

    // Development bypass
    if (process.env.NODE_ENV === 'development' && request.cookies.get('dev_bypass')) {
        return response
    }

    // No session → redirect to admin login
    if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin/login'
        return NextResponse.redirect(url)
    }

    // Check role — only admins allowed
    const { data: profile } = await supabase
        .from('member_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        await supabase.auth.signOut()
        const url = request.nextUrl.clone()
        url.pathname = '/admin/login'
        return NextResponse.redirect(url)
    }

    return response
}

export const config = {
    matcher: [
        // Run on all pages (for vercel.app redirect) except static assets
        '/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|pdf)$).*)',
    ],
}
