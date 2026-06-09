import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import logger from '@/lib/logger';

/**
 * POST /api/admin/zone-flip — admin-only zone status mutation.
 *
 * Body: { zoneId: uuid, newStatus: 'closed' | 'reopened' | 'pending' }
 *
 * Used by the /admin/zones page action buttons. Sets the new status, stamps
 * reopened_at when the new status is 'reopened' (otherwise clears it), and
 * resets the community report counter so a flipped zone doesn't keep its
 * "≥3 reports" highlight forever.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_STATUSES = new Set(['closed', 'reopened', 'pending']);

export async function POST(req: NextRequest) {
    try {
        // ── Auth: admin only ─────────────────────────────────────
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

        const { data: { user } } = await authClient.auth.getUser();
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

        // ── Validate input ───────────────────────────────────────
        const body = await req.json().catch(() => ({}));
        const zoneId = typeof body?.zoneId === 'string' ? body.zoneId.trim() : '';
        const newStatus = typeof body?.newStatus === 'string' ? body.newStatus.trim() : '';

        if (!UUID_RE.test(zoneId)) {
            return NextResponse.json({ error: 'معرّف المنطقة غير صالح' }, { status: 400 });
        }
        if (!VALID_STATUSES.has(newStatus)) {
            return NextResponse.json({ error: 'الحالة غير صالحة' }, { status: 400 });
        }

        // ── Service-role mutation ────────────────────────────────
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            return NextResponse.json({ error: 'server_config' }, { status: 500 });
        }
        const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);

        // Build the update payload — reopened gets a fresh timestamp; the
        // other two states clear it so the audit field reflects reality.
        const updates: Record<string, unknown> = {
            status: newStatus,
            reopened_at: newStatus === 'reopened' ? new Date().toISOString() : null,
            // Reset community counter on every admin flip — a flipped zone
            // doesn't carry "queue for review" highlights from before.
            community_reopened_count: 0,
            community_closed_count: 0,
        };

        const { data, error } = await svc
            .from('zones')
            .update(updates)
            .eq('id', zoneId)
            .select('id, city, district, neighborhood, status')
            .single();

        if (error) {
            logger.error('zone-flip:', error);
            return NextResponse.json({ error: 'فشل التحديث' }, { status: 500 });
        }

        // Audit log so we can see who flipped what.
        void (async () => {
            try {
                await svc.from('admin_activity_log').insert({
                    event_type: 'zone_flip',
                    title: `Zone flip: ${data?.neighborhood} → ${newStatus}`,
                    detail: `${data?.city} / ${data?.district}`,
                    entity_table: 'zones',
                    entity_id: zoneId,
                    actor_user_id: user.id,
                });
            } catch (err) {
                logger.error('zone-flip audit:', err);
            }
        })();

        return NextResponse.json({ ok: true, zone: data });
    } catch (err) {
        logger.error('zone-flip POST:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
