import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * DELETE /api/admin/feedback?id=<uuid>
 *
 * Uses the SSR client so HTTP-only session cookies are read properly.
 * The browser supabase client (anon key) loses the session because it
 * reads from localStorage — but the session is stored in HTTP-only cookies.
 * This route fixes that by running the delete server-side with the correct
 * authenticated identity, so is_admin() returns true and RLS allows the delete.
 */
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

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
                    response.cookies.set({ name, value: '', ...options, maxAge: 0 });
                },
            },
        }
    );

    const { error } = await supabase.from('content_votes').delete().eq('id', id);

    if (error) {
        return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
    }

    return response;
}
