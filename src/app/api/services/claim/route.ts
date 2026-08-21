import { createHash } from 'node:crypto';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getClientIp, isRateLimited } from '@/lib/rate-limit';
import { isValidExplicitWhatsApp, normalizeWhatsAppNumber } from '@/lib/serviceProviderQuality';
import logger from '@/lib/logger';

export const runtime = 'nodejs';

const clean = (value: unknown, max: number) => typeof value === 'string'
  ? value.normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
  : '';

export async function POST(request: Request) {
  try {
    if (!(request.headers.get('content-type') || '').includes('application/json')) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }
    if (Number(request.headers.get('content-length') || 0) > 10_000) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }
    const origin = request.headers.get('origin');
    if (origin && new URL(origin).host !== new URL(request.url).host) {
      return NextResponse.json({ error: 'invalid_origin' }, { status: 403 });
    }

    const ip = getClientIp(request);
    if (isRateLimited(`service-claim:${ip}`, 4, 60 * 60_000)) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }

    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || clean(body.website, 100)) return NextResponse.json({ ok: true });

    const providerId = clean(body.providerId, 120);
    const claimantName = clean(body.claimantName, 120);
    const rawWhatsApp = clean(body.whatsapp, 40);
    const note = clean(body.note, 500);
    if (!providerId || !claimantName || !isValidExplicitWhatsApp(rawWhatsApp)) {
      return NextResponse.json({ error: 'invalid_fields' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anon || !key) return NextResponse.json({ error: 'server_config' }, { status: 500 });

    // Ownership cannot be transferred securely to a phone number alone. The
    // signed-in account becomes the page owner only after admin approval.
    const cookieStore = await cookies();
    const authed = createServerClient(url, anon, {
      cookies: { getAll: () => cookieStore.getAll(), setAll() {} },
    });
    const { data: { user } } = await authed.auth.getUser();
    if (!user) return NextResponse.json({ error: 'login_required' }, { status: 401 });

    const svc = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data: provider } = await svc
      .from('service_providers')
      .select('id')
      .eq('id', providerId)
      .eq('status', 'approved')
      .maybeSingle();
    if (!provider) return NextResponse.json({ error: 'provider_not_found' }, { status: 404 });

    const whatsapp = `+${normalizeWhatsAppNumber(rawWhatsApp)}`;
    const { data: duplicate } = await svc
      .from('service_provider_claims')
      .select('id')
      .eq('provider_id', providerId)
      .eq('claimant_user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();
    if (duplicate) return NextResponse.json({ ok: true, duplicate: true });

    const salt = process.env.IP_HASH_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const ipHash = createHash('sha256').update(`${salt}:${ip}`).digest('hex');
    const { error } = await svc.from('service_provider_claims').insert({
      provider_id: providerId,
      claimant_name: claimantName,
      whatsapp,
      note: note || null,
      ip_hash: ipHash,
      claimant_user_id: user.id,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error('services/claim failed:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
