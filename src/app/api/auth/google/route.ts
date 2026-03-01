import { NextResponse, type NextRequest } from 'next/server';

/**
 * GET /api/auth/google?next=/dashboard
 *
 * Custom Google OAuth initiation — redirects to Google with OUR domain
 * as redirect_uri, so Google shows "المتابعة إلى dalilarab.vercel.app"
 * instead of the Supabase URL.
 *
 * Requires env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 * Falls back to Supabase OAuth if not configured.
 */
export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const next = searchParams.get('next') || '/dashboard';

    const clientId = process.env.GOOGLE_CLIENT_ID;

    // Fallback: use Supabase's built-in OAuth if custom credentials not configured
    if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const fallbackUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(`${origin}/auth/callback`)}`;
        return NextResponse.redirect(fallbackUrl);
    }

    // CSRF protection: random state stored in httpOnly cookie
    const csrf = crypto.randomUUID();
    const statePayload = JSON.stringify({ csrf, next });
    const stateB64 = Buffer.from(statePayload).toString('base64url');

    const redirectUri = `${origin}/api/auth/google/callback`;

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state: stateB64,
        prompt: 'select_account',
    });

    const response = NextResponse.redirect(
        `https://accounts.google.com/o/oauth2/v2/auth?${params}`
    );

    // Store CSRF token in httpOnly cookie
    response.cookies.set('google_oauth_state', csrf, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 600, // 10 minutes
        path: '/',
    });

    return response;
}
