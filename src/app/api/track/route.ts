import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { isRateLimited } from '@/lib/rate-limit';
import logger from '@/lib/logger';

// Use service role key on server to bypass RLS
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = serviceRoleKey
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
  : null;

// ─── Bot Detection ──────────────────────────────────────────────────
const BOT_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /slurp/i, /mediapartners/i,
  /headlesschrome/i, /lighthouse/i, /pingdom/i, /uptimerobot/i,
  /pagespeed/i, /gtmetrix/i, /semrush/i, /ahrefs/i, /mj12bot/i,
  /dotbot/i, /petalbot/i, /bytespider/i, /yandexbot/i, /baiduspider/i,
  /facebookexternalhit/i, /twitterbot/i, /whatsapp/i, /telegrambot/i,
  /linkedinbot/i, /discordbot/i, /applebot/i, /bingpreview/i,
];

function isBot(ua: string): boolean {
  return BOT_PATTERNS.some((p) => p.test(ua));
}

// ─── IP Hashing (privacy-preserving) ────────────────────────────────
// Daily salt rotation so the same IP gets a different hash each day
// This prevents long-term IP tracking while allowing daily uniqueness
function hashIP(ip: string): string {
  const daySalt = new Date().toISOString().split('T')[0]; // e.g. "2026-03-01"
  return createHash('sha256').update(`${ip}:${daySalt}`).digest('hex').slice(0, 16);
}

// ─── Vercel Geo → Country Name ──────────────────────────────────────
const COUNTRY_NAMES: Record<string, string> = {
  TR: 'Turkey', SY: 'Syria', LB: 'Lebanon', IQ: 'Iraq', JO: 'Jordan',
  PS: 'Palestine', EG: 'Egypt', SA: 'Saudi Arabia', AE: 'UAE', KW: 'Kuwait',
  QA: 'Qatar', BH: 'Bahrain', OM: 'Oman', YE: 'Yemen', LY: 'Libya',
  TN: 'Tunisia', DZ: 'Algeria', MA: 'Morocco', SD: 'Sudan', DE: 'Germany',
  NL: 'Netherlands', SE: 'Sweden', FR: 'France', GB: 'UK', US: 'USA',
  CA: 'Canada', AT: 'Austria', BE: 'Belgium', DK: 'Denmark', NO: 'Norway',
  FI: 'Finland', GR: 'Greece', IT: 'Italy', ES: 'Spain', RU: 'Russia',
  UA: 'Ukraine', PL: 'Poland', CZ: 'Czechia', RO: 'Romania', HU: 'Hungary',
  BG: 'Bulgaria', HR: 'Croatia', RS: 'Serbia', BA: 'Bosnia', AL: 'Albania',
  MK: 'N. Macedonia', ME: 'Montenegro', XK: 'Kosovo', CY: 'Cyprus',
  MT: 'Malta', CH: 'Switzerland', PT: 'Portugal', IE: 'Ireland',
  AU: 'Australia', NZ: 'New Zealand', JP: 'Japan', KR: 'S. Korea',
  CN: 'China', IN: 'India', PK: 'Pakistan', BD: 'Bangladesh', ID: 'Indonesia',
  MY: 'Malaysia', TH: 'Thailand', VN: 'Vietnam', PH: 'Philippines',
  BR: 'Brazil', MX: 'Mexico', AR: 'Argentina', CL: 'Chile', CO: 'Colombia',
  ZA: 'South Africa', NG: 'Nigeria', KE: 'Kenya', GH: 'Ghana',
};

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 60 requests per minute per IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(`track:${clientIp}`, 60)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { event_name, page_path, visitor_id, session_id, duration_seconds, meta } = body;

    if (!event_name) {
      return NextResponse.json({ error: 'missing event_name' }, { status: 400 });
    }

    // Validate meta size to prevent DB bloat (max 2KB)
    if (meta && JSON.stringify(meta).length > 2048) {
      return NextResponse.json({ error: 'meta too large' }, { status: 400 });
    }

    // ─── Skip admin pages (don't pollute analytics with admin activity) ─
    if (page_path?.startsWith('/admin')) {
      return NextResponse.json({ ok: true, filtered: 'admin' });
    }

    // ─── Extract real IP ────────────────────────────────────────────
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown';
    const ip_hash = ip !== 'unknown' ? hashIP(ip) : null;

    // ─── Bot filter ─────────────────────────────────────────────────
    const ua = req.headers.get('user-agent') || '';
    if (isBot(ua)) {
      return NextResponse.json({ ok: true, filtered: 'bot' });
    }

    // ─── Vercel geolocation headers ─────────────────────────────────
    const countryCode = req.headers.get('x-vercel-ip-country') || '';
    const city = req.headers.get('x-vercel-ip-city') || '';
    const region = req.headers.get('x-vercel-ip-country-region') || '';

    const ip_country = COUNTRY_NAMES[countryCode] || countryCode || null;
    const ip_city = city ? decodeURIComponent(city) : null;

    // ─── Merge server geo into client meta ──────────────────────────
    const enrichedMeta = {
      ...meta,
      // Server-side geo (accurate, from IP)
      ip_country: ip_country,
      ip_city: ip_city,
      ip_region: region || undefined,
      // Keep client-side country as fallback reference
      tz_country: meta?.country,
    };
    // Remove old 'country' key to avoid confusion
    delete enrichedMeta.country;

    // ─── Insert into analytics_events ───────────────────────────────
    if (!supabase) {
      return NextResponse.json({ error: 'server_config' }, { status: 500 });
    }
    const { error } = await supabase.from('analytics_events').insert({
      event_name,
      page_path,
      visitor_id,
      session_id,
      duration_seconds: duration_seconds || null,
      ip_hash,
      ip_country,
      ip_city,
      meta: enrichedMeta,
    });

    if (error) {
      logger.error('[track] insert error:', error.message);
      return NextResponse.json({ error: 'Tracking failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('[track] error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
