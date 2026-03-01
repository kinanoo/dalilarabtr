import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // Block vercel.app — site moved to custom domain
    const host = request.headers.get('host') || '';
    if (host.includes('.vercel.app')) {
        return new NextResponse(
            '<html dir="rtl"><head><meta charset="utf-8"><title>انتقل الموقع</title></head>' +
            '<body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#0f172a;color:#e2e8f0;text-align:center">' +
            '<div><h1 style="font-size:2rem;margin-bottom:1rem">🚫 هذا الرابط لم يعد يعمل</h1>' +
            '<p style="font-size:1.2rem;color:#94a3b8">انتقل الموقع إلى عنوان جديد</p>' +
            '</div></body></html>',
            { status: 410, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
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
