import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
        return NextResponse.redirect(`${origin}/login?error=missing_code`)
    }

    // Start with /dashboard as default redirect
    const response = NextResponse.redirect(`${origin}/dashboard`)

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    // Set cookies on SAME response to preserve session
                    response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !session) {
        return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    const user = session.user

    // Ensure member_profiles record exists (for Google OAuth users)
    const { data: profile } = await supabase
        .from('member_profiles')
        .select('id, role')
        .eq('id', user.id)
        .single()

    if (!profile) {
        await supabase.from('member_profiles').insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'عضو',
            avatar_url: user.user_metadata?.avatar_url || null,
            role: 'member',
        })
        // response already points to /dashboard with cookies intact
        return response
    }

    if (profile.role === 'admin') {
        // Redirect to admin but keep the same response (with cookies)
        response.headers.set('location', `${origin}/admin`)
    }

    return response
}
