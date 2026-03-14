import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(request: NextRequest) {
    let body: { email?: string; password?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }

    const { email, password } = body;
    if (!email || !password) {
        return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown';

    // Service-role client for rate-limit tracking (bypasses RLS)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        return NextResponse.json({ error: 'server_config' }, { status: 500 });
    }
    const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
    );

    // ── Rate-limit check (fail-closed: block login if check fails) ──
    const cutoff = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000).toISOString();
    const { count: failCount, error: rlError } = await serviceClient
        .from('admin_login_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', ip)
        .eq('success', false)
        .gte('attempted_at', cutoff);

    if (rlError) {
        console.error('Rate limit check failed:', rlError.message);
        return NextResponse.json(
            { error: 'rate_limited', remaining: 0, lockout_minutes: LOCKOUT_MINUTES },
            { status: 429 }
        );
    }
    if ((failCount || 0) >= MAX_ATTEMPTS) {
        return NextResponse.json(
            { error: 'rate_limited', remaining: 0, lockout_minutes: LOCKOUT_MINUTES },
            { status: 429 }
        );
    }

    // ── Temporary cookie store (applied to whichever response we return) ──
    const cookieStore = new Map<string, { value: string; options: CookieOptions }>();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    cookieStore.set(name, { value, options });
                },
                remove(name: string, options: CookieOptions) {
                    cookieStore.set(name, { value: '', options: { ...options, maxAge: 0 } });
                },
            },
        }
    );

    // ── Authenticate ──
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (authError || !authData.user) {
        logAttempt(serviceClient, ip, email, false);
        const remaining = MAX_ATTEMPTS - ((failCount || 0) + 1);
        return buildResponse(
            { error: 'invalid_credentials', remaining: Math.max(0, remaining) },
            401,
            cookieStore
        );
    }

    // ── Check admin role ──
    const { data: profile } = await serviceClient
        .from('member_profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

    if (profile?.role !== 'admin') {
        await supabase.auth.signOut(); // clears session cookies via cookieStore
        logAttempt(serviceClient, ip, email, false);
        const remaining = MAX_ATTEMPTS - ((failCount || 0) + 1);
        return buildResponse(
            { error: 'invalid_credentials', remaining: Math.max(0, remaining) },
            401,
            cookieStore
        );
    }

    // ── Success ──
    logAttempt(serviceClient, ip, email, true);
    return buildResponse({ ok: true }, 200, cookieStore);
}

// ── Helpers ──

function buildResponse(
    body: Record<string, unknown>,
    status: number,
    cookieStore: Map<string, { value: string; options: CookieOptions }>
) {
    const response = NextResponse.json(body, { status });
    for (const [name, { value, options }] of cookieStore) {
        response.cookies.set({ name, value, ...options });
    }
    return response;
}

function logAttempt(
    client: { from: (table: string) => any },
    ip: string,
    email: string,
    success: boolean
) {
    // Fire-and-forget — don't block response on logging
    client
        .from('admin_login_attempts')
        .insert({ ip_address: ip, email: email.toLowerCase(), success })
        .then(() => {});
}
