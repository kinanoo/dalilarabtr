import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getClientIp, isRateLimited } from '@/lib/rate-limit';
import { categoryForName } from '@/lib/serviceCategories';
import { canonicalCity } from '@/lib/turkishCities';
import {
    isValidExplicitWhatsApp,
    normalizeWhatsAppNumber,
} from '@/lib/serviceProviderQuality';
import logger from '@/lib/logger';

/**
 * POST /api/services/submit — PUBLIC, no-account service listing submission.
 *
 * The single biggest conversion barrier used to be: a shop owner had to create
 * an account + confirm their email before they could list. This route lets
 * anyone submit their business in one screen; it lands as `status='pending'`
 * and only appears on the site after an admin approves it in /admin/services.
 *
 * Security boundary (service-role bypasses RLS, so validation IS the gate):
 *  - strict field validation + length caps
 *  - honeypot (`website`) — bots fill every field; humans never see it
 *  - best-effort per-IP rate limit (hard limits belong at the Cloudflare edge)
 *  - category canonicalised against the taxonomy; unknown → "خدمات عامة"
 * Never writes is_verified/is_featured — those stay admin-controlled.
 */
export const runtime = 'nodejs';

const str = (v: unknown, max: number) => (typeof v === 'string'
    ? v.normalize('NFKC').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
    : '');

export async function POST(request: Request) {
    try {
        const contentType = request.headers.get('content-type') || '';
        const contentLength = Number(request.headers.get('content-length') || 0);
        if (!contentType.toLowerCase().includes('application/json') || contentLength > 20_000) {
            return NextResponse.json({ error: 'bad_request' }, { status: 400 });
        }
        const origin = request.headers.get('origin');
        if (origin && new URL(origin).host !== new URL(request.url).host) {
            return NextResponse.json({ error: 'invalid_origin' }, { status: 403 });
        }

        const ip = getClientIp(request);
        // Best-effort abuse control: 4 per 10 min AND 15 per day per IP.
        if (
            isRateLimited(`svc-submit:${ip}`, 4, 10 * 60_000) ||
            isRateLimited(`svc-submit-day:${ip}`, 15, 24 * 60 * 60_000)
        ) {
            return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
        }

        const body = await request.json().catch(() => null);
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: 'bad_request' }, { status: 400 });
        }
        const b = body as Record<string, unknown>;

        // Honeypot — a real user leaves this empty. Accept silently and drop so
        // the bot gets a 200 and doesn't retry, but nothing is written.
        if (str(b.website, 200)) return NextResponse.json({ ok: true });

        const name = str(b.name, 120);
        const profession = str(b.profession, 120);
        const rawCategory = str(b.category, 60);
        const city = canonicalCity(str(b.city, 60));
        const district = str(b.district, 80);
        // `phone` remains accepted for one release so an already-open old form
        // can submit, but it is stored explicitly as WhatsApp, never inferred later.
        const rawWhatsApp = str(b.whatsapp ?? b.phone, 40);
        const whatsapp = normalizeWhatsAppNumber(rawWhatsApp);
        const description = str(b.description, 1500);

        if (!name || !profession || !city) {
            return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
        }
        if (!isValidExplicitWhatsApp(rawWhatsApp)) {
            return NextResponse.json({ error: 'invalid_whatsapp' }, { status: 400 });
        }
        // Map the submitted category to a canonical taxonomy value so it filters
        // and lands on the right category page; fall back to general.
        const category = categoryForName(rawCategory)?.name || rawCategory || 'خدمات عامة';

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) return NextResponse.json({ error: 'server_config' }, { status: 500 });

        const svc = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
        const { error } = await svc.from('service_providers').insert([{
            name,
            profession,
            category,
            city,
            district: district || null,
            phone: null,
            whatsapp: `+${whatsapp}`,
            description,
            status: 'pending',   // invisible until an admin approves
            is_verified: false,  // never self-serve verified
            verification_level: 'listed',
            active: true,
        }]);

        if (error) {
            logger.error('services/submit insert failed:', error);
            return NextResponse.json({ error: 'insert_failed' }, { status: 500 });
        }
        return NextResponse.json({ ok: true });
    } catch (err) {
        logger.error('services/submit unhandled:', err);
        return NextResponse.json({ error: 'internal_error' }, { status: 500 });
    }
}
