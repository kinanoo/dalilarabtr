import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/adminAuth';
import logger from '@/lib/logger';
import { categoryForName } from '@/lib/serviceCategories';
import { canonicalCity } from '@/lib/turkishCities';
import { normalizeTurkishPhone } from '@/lib/serviceDirectory';

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
    'website', 'email', 'google_maps_url', 'languages',
    'verification_level', 'last_verified_at',
    'is_verified', 'is_featured', 'status',
]);

const cleanOptionalUrl = (value: unknown): string | null => {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
        const url = new URL(value.trim());
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
    } catch {
        return null;
    }
};

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
        const city = typeof clean.city === 'string' ? canonicalCity(clean.city) : '';
        const description = typeof clean.description === 'string' ? clean.description.trim() : '';
        if (!name) return NextResponse.json({ error: 'اسم الخدمة مطلوب' }, { status: 400 });
        if (!city) return NextResponse.json({ error: 'المدينة مطلوبة' }, { status: 400 });
        if (!description) return NextResponse.json({ error: 'الوصف مطلوب' }, { status: 400 });
        clean.name = name;
        clean.city = city;
        clean.description = description;

        const rawCategory = typeof clean.category === 'string'
            ? clean.category
            : typeof clean.profession === 'string' ? clean.profession : '';
        clean.category = categoryForName(rawCategory)?.name || rawCategory || 'خدمات عامة';

        const phone = normalizeTurkishPhone(typeof clean.phone === 'string' ? clean.phone : '');
        if (phone.length < 10 || phone.length > 12) {
            return NextResponse.json({ error: 'رقم الهاتف التركي غير صحيح' }, { status: 400 });
        }
        clean.phone = `+${phone}`;

        if (typeof clean.whatsapp === 'string' && clean.whatsapp.trim()) {
            const whatsapp = normalizeTurkishPhone(clean.whatsapp);
            if (whatsapp.length < 10 || whatsapp.length > 12) {
                return NextResponse.json({ error: 'رقم واتساب غير صحيح' }, { status: 400 });
            }
            clean.whatsapp = `+${whatsapp}`;
        }

        for (const key of ['website', 'google_maps_url'] as const) {
            if (clean[key]) {
                const safeUrl = cleanOptionalUrl(clean[key]);
                if (!safeUrl) {
                    return NextResponse.json({ error: `الرابط في حقل ${key} غير صالح` }, { status: 400 });
                }
                clean[key] = safeUrl;
            }
        }

        if (typeof clean.verification_level === 'string') {
            const level = clean.verification_level;
            if (!['listed', 'source_checked', 'claimed', 'credential_verified'].includes(level)) {
                return NextResponse.json({ error: 'درجة التحقق غير صالحة' }, { status: 400 });
            }
            clean.is_verified = level !== 'listed';
        }

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
