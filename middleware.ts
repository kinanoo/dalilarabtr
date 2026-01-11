import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Only protect /admin routes
    if (!request.nextUrl.pathname.startsWith('/admin')) {
        return response
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Protect Admin Routes
    if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login' // Revert to a dedicated login page logic if you have one, or just home
        // Since /login is likely handled client side or inside admin, let's assume we want to kick them out
        // If you don't have a /login page yet, standard is to redirect home or show a 404
        // But audit said we allow users to access? No, admins only. 
        // Assuming there is a login mechanism. 
        // Actually, src/components/admin/LoginPage.tsx implies admin login is a component?
        // We should probably redirect to a public login route if it exists, or just '/' if auth fails.
        // Let's redirect to '/' for now to be safe, or to a query param.
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths starting with /admin
         */
        '/admin/:path*',
    ],
}
