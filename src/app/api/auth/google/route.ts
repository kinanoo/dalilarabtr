import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/adminAuth';

export const runtime = 'nodejs';

/**
 * GET /api/auth/google?next=/dashboard
 *
 * Custom Google OAuth initiation — redirects to Google with OUR domain
 * as redirect_uri, so Google shows "المتابعة إلى dalilarabtr.com"
 * instead of the Supabase URL.
 *
 * Requires env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 * Falls back to Supabase OAuth if not configured.
 */
export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const next = searchParams.get('next') || '/dashboard';
    const searchConsole = searchParams.get('mode') === 'search-console';
    let adminUserId: string | null = null;

    // Search Console is an integration owned by the already authenticated
    // admin. Google consent must never double as a second site login or replace
    // the current Supabase session with the selected Google account.
    if (searchConsole) {
        const gate = await requireAdmin();
        if (!gate.ok) {
            return NextResponse.redirect(`${origin}/admin/login?next=${encodeURIComponent('/admin?gsc=connect')}`);
        }
        adminUserId = gate.userId;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;

    // Fallback: use Supabase's built-in OAuth if custom credentials not configured
    if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
        if (searchConsole) {
            return NextResponse.redirect(`${origin}/admin?gsc=server_config`);
        }
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const fallbackUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(`${origin}/auth/callback`)}`;
        return NextResponse.redirect(fallbackUrl);
    }

    // CSRF protection: random state stored in httpOnly cookie
    const csrf = crypto.randomUUID();
    const statePayload = JSON.stringify({ csrf, next, searchConsole, adminUserId });
    const stateB64 = Buffer.from(statePayload).toString('base64url');

    const redirectUri = `${origin}/api/auth/google/callback`;

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: searchConsole
            ? 'openid email profile https://www.googleapis.com/auth/webmasters.readonly'
            : 'openid email profile',
        state: stateB64,
        prompt: searchConsole ? 'consent' : 'select_account',
        ...(searchConsole ? { access_type: 'offline' } : {}),
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
