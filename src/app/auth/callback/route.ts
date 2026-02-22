import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (!code) {
        return NextResponse.redirect(`${origin}/login?error=missing_code`)
    }

    const response = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
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
        // Create profile for new Google user
        await supabase.from('member_profiles').insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'عضو',
            avatar_url: user.user_metadata?.avatar_url || null,
            role: 'member',
        })
        return NextResponse.redirect(`${origin}/dashboard`)
    }

    // Redirect based on role
    if (profile.role === 'admin') {
        return NextResponse.redirect(`${origin}/admin`)
    }

    return NextResponse.redirect(`${origin}/dashboard`)
}
