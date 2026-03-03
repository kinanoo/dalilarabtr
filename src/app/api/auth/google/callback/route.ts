import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * GET /api/auth/google/callback?code=xxx&state=xxx
 *
 * Handles Google OAuth callback:
 * 1. Verifies CSRF state
 * 2. Exchanges code for Google tokens
 * 3. Uses signInWithIdToken to create Supabase session
 * 4. Creates member_profiles record if needed
 * 5. Redirects to dashboard (or admin for admins)
 */
export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const stateB64 = searchParams.get('state');
    const errorParam = searchParams.get('error');

    // Handle Google errors (user cancelled, access denied, etc.)
    if (errorParam) {
        return NextResponse.redirect(`${origin}/login?error=google_cancelled`);
    }

    if (!code || !stateB64) {
        return NextResponse.redirect(`${origin}/login?error=missing_code`);
    }

    // ── Verify CSRF state ──
    let next = '/dashboard';
    try {
        const stateData = JSON.parse(
            Buffer.from(stateB64, 'base64url').toString()
        );
        const storedCsrf = request.cookies.get('google_oauth_state')?.value;
        if (!storedCsrf || storedCsrf !== stateData.csrf) {
            return NextResponse.redirect(`${origin}/login?error=state_mismatch`);
        }
        // Validate redirect target is same-origin relative path (prevent open redirect)
        const rawNext = stateData.next || '/dashboard';
        if (typeof rawNext === 'string' && rawNext.startsWith('/') && !rawNext.startsWith('//')) {
            next = rawNext;
        }
    } catch {
        return NextResponse.redirect(`${origin}/login?error=invalid_state`);
    }

    // ── Exchange code for Google tokens ──
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            redirect_uri: `${origin}/api/auth/google/callback`,
            grant_type: 'authorization_code',
        }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.id_token) {
        console.error('Google token exchange failed:', tokens);
        return NextResponse.redirect(`${origin}/login?error=token_failed`);
    }

    // ── Create Supabase session from Google ID token ──
    const response = NextResponse.redirect(`${origin}${next}`);

    // Clear the CSRF cookie
    response.cookies.set('google_oauth_state', '', {
        httpOnly: true,
        secure: true,
        maxAge: 0,
        path: '/',
    });

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
                    response.cookies.set({ name, value: '', ...options, maxAge: 0 });
                },
            },
        }
    );

    const { data, error: authError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: tokens.id_token,
        access_token: tokens.access_token,
    });

    if (authError || !data.session) {
        console.error('Supabase signInWithIdToken failed:', authError);
        return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    // ── Ensure member_profiles record exists ──
    const user = data.session.user;
    const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: profile } = await serviceClient
        .from('member_profiles')
        .select('id, role')
        .eq('id', user.id)
        .single();

    if (!profile) {
        await serviceClient.from('member_profiles').insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'عضو',
            avatar_url: user.user_metadata?.avatar_url || null,
            role: 'member',
        });
    } else if (profile.role === 'admin') {
        // Override redirect for admins
        response.headers.set('location', `${origin}/admin`);
    }

    return response;
}
