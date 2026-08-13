import { createHmac, randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, isRateLimited } from '@/lib/rate-limit';
import { SERVICE_PROVIDER_INVITE_COOLDOWN_MS } from '@/lib/serviceProviderInvite';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

const VISITOR_COOKIE = 'daleel_service_invite_visitor';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;
const BOT_PATTERN = /bot|crawl|spider|headless|lighthouse|facebookexternalhit|whatsapp|telegram/i;

type ClaimResult = {
  should_show?: boolean;
  last_shown_at?: string;
};

function response(body: { show: boolean; suppressUntil?: number }, visitorToken?: string) {
  const result = NextResponse.json(body, {
    headers: { 'Cache-Control': 'private, no-store, max-age=0' },
  });

  if (visitorToken) {
    result.cookies.set(VISITOR_COOKIE, visitorToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });
  }

  return result;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || '';

  if (BOT_PATTERN.test(userAgent)) return response({ show: false });
  if (isRateLimited(`service-provider-invite:${ip}`, 12, 60_000)) {
    return response({ show: false, suppressUntil: Date.now() + 60_000 });
  }

  const existingToken = request.cookies.get(VISITOR_COOKIE)?.value;
  const visitorToken = existingToken || randomUUID();
  const salt = process.env.IP_HASH_SALT || 'daleel-service-invite-v1';
  const visitorHash = createHmac('sha256', salt)
    .update(`${ip}|${visitorToken}`)
    .digest('hex');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey || ip === 'unknown') {
    return response({ show: true }, existingToken ? undefined : visitorToken);
  }

  try {
    const client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.rpc('claim_service_provider_invite', {
      p_visitor_hash: visitorHash,
    });

    if (error) throw error;

    const claim = (data || {}) as ClaimResult;
    const lastShown = claim.last_shown_at ? new Date(claim.last_shown_at).getTime() : Date.now();
    const suppressUntil = Math.max(Date.now(), lastShown + SERVICE_PROVIDER_INVITE_COOLDOWN_MS);

    return response(
      { show: claim.should_show === true, suppressUntil },
      existingToken ? undefined : visitorToken,
    );
  } catch (error) {
    // The invitation remains usable if the database is temporarily unavailable;
    // local storage still enforces the same seven-day cooldown in this browser.
    logger.warn('service provider invite claim failed', error);
    return response({ show: true }, existingToken ? undefined : visitorToken);
  }
}
