import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import logger from '@/lib/logger';

/**
 * POST /api/admin/revalidate — purge specific page caches on demand.
 *
 * Why: pages on this site use ISR (e.g. the homepage has
 * `export const revalidate = 300` — 5 minutes). When an admin edits an
 * article in /admin/articles, the database is updated immediately but
 * the cached homepage continues to serve the old content until the
 * ISR window expires.
 *
 * The admin save handler calls this endpoint right after a successful
 * upsert, passing the list of paths that need to be re-rendered:
 *
 *   - "/"                — homepage (featured-news carousel)
 *   - "/article/[slug]"  — the article page itself
 *   - "/articles"        — article list (if present)
 *   - "/tag/[slug]"      — tag pages that include this article
 *
 * Safety:
 *   - Admin-only. Same auth pattern as /api/admin/zone-flip — cookie
 *     session must resolve to a user, that user's member_profiles row
 *     must have role='admin'.
 *   - Path allowlist. Only paths matching the patterns below can be
 *     revalidated; nothing else. Prevents a compromised admin token
 *     from being used to spam revalidation of every page on the site.
 *   - Hard cap: 20 paths per request.
 *
 * Body: { paths: string[] }
 * Returns: { revalidated: string[], skipped: string[] }
 */

// Only these path SHAPES are allowed. Each entry is either a literal
// path or a regex matching one (we use regex so /article/<anything>
// and /tag/<anything> are accepted while everything else is rejected).
const ALLOWED_PATHS: RegExp[] = [
    /^\/$/,
    /^\/articles$/,
    /^\/article\/[a-zA-Z0-9_\-%]+$/,
    /^\/tag\/[a-zA-Z0-9_\-%]+$/,
    /^\/updates$/,
    /^\/updates\/[a-zA-Z0-9_\-%]+$/,
];

const MAX_PATHS = 20;

function isAllowed(path: string): boolean {
    return ALLOWED_PATHS.some((re) => re.test(path));
}

export async function POST(req: NextRequest) {
    try {
        // ── Auth: admin only ────────────────────────────────────────
        const cookieStore = await cookies();
        const authClient = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll: () => cookieStore.getAll(),
                    setAll: () => {},
                },
            }
        );

        const {
            data: { user },
        } = await authClient.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        }

        const { data: profile } = await authClient
            .from('member_profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'محظور' }, { status: 403 });
        }

        // ── Parse + validate body ───────────────────────────────────
        const body = await req.json().catch(() => null);
        const paths = body?.paths;

        if (!Array.isArray(paths)) {
            return NextResponse.json(
                { error: 'مطلوب: paths كمصفوفة' },
                { status: 400 }
            );
        }

        if (paths.length > MAX_PATHS) {
            return NextResponse.json(
                { error: `الحد الأقصى ${MAX_PATHS} مسار` },
                { status: 400 }
            );
        }

        // ── Revalidate the allowed subset ───────────────────────────
        const revalidated: string[] = [];
        const skipped: string[] = [];

        for (const p of paths) {
            if (typeof p !== 'string') {
                skipped.push(String(p));
                continue;
            }
            if (!isAllowed(p)) {
                skipped.push(p);
                continue;
            }
            try {
                revalidatePath(p);
                revalidated.push(p);
            } catch (err) {
                logger.error('revalidatePath failed for', p, err);
                skipped.push(p);
            }
        }

        return NextResponse.json({ revalidated, skipped });
    } catch (err) {
        logger.error('revalidate route fatal:', err);
        return NextResponse.json(
            { error: 'فشل التحديث الفوري' },
            { status: 500 }
        );
    }
}
