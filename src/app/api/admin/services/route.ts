import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/adminAuth';
import logger from '@/lib/logger';

/**
 * POST /api/admin/services — create/update a service provider.
 *
 * Hardening: the admin services editor used to upsert service_providers directly
 * from the browser (anon client, RLS-gated). This route moves the write
 * server-side behind requireAdmin() and — critically — applies a COLUMN
 * WHITELIST so a client can never mass-assign arbitrary/unknown fields, plus
 * server-side validation of the required fields (never trust the client).
 */
export const runtime = 'nodejs';

// Only these columns may be written from the services editor.
const ALLOWED = new Set([
    'name', 'profession', 'category', 'city', 'district', 'phone', 'whatsapp',
    'description', 'bio', 'image', 'address_details', 'map_location',
    'is_verified', 'is_featured', 'status',
]);

export async function POST(request: Request) {
    try {
        const gate = await requireAdmin();
        if (!gate.ok) return gate.res;

        const body = await request.json().catch(() => ({}));
        const id = typeof body?.id === 'string' && body.id && body.id !== 'new' ? body.id : null;
        const input = body?.data && typeof body.data === 'object' ? body.data as Record<string, unknown> : {};

        // Keep only whitelisted, defined fields.
        const clean: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(input)) {
            if (ALLOWED.has(k) && v !== undefined && v !== null) clean[k] = v;
        }

        // Server-side validation (mirrors the client but is the real gate).
        const name = typeof clean.name === 'string' ? clean.name.trim() : '';
        const city = typeof clean.city === 'string' ? clean.city.trim() : '';
        const description = typeof clean.description === 'string' ? clean.description.trim() : '';
        if (!name) return NextResponse.json({ error: 'اسم الخدمة مطلوب' }, { status: 400 });
        if (!city) return NextResponse.json({ error: 'المدينة مطلوبة' }, { status: 400 });
        if (!description) return NextResponse.json({ error: 'الوصف مطلوب' }, { status: 400 });
        if (!clean.category) clean.category = clean.profession || 'عام';

        const payload = id ? { id, ...clean } : clean;
        const { error } = await gate.svc.from('service_providers').upsert(payload);
        if (error) {
            logger.error('admin/services upsert:', error);
            return NextResponse.json({ error: 'فشل حفظ الخدمة' }, { status: 500 });
        }
        return NextResponse.json({ ok: true });
    } catch (err) {
        logger.error('admin/services POST unhandled:', err);
        return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
    }
}
