import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { isRateLimited, getClientIp } from '@/lib/rate-limit';
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

// ─── Stable visitor fingerprint ─────────────────────────────────────
// sha256(ip | user-agent | fixed salt). Deliberately NOT day-rotated: the
// owner needs new-vs-returning visitors per week/month, which requires the
// same person to hash to the same key across days. Nothing is stored on the
// visitor's device and the raw IP never reaches the database — only this
// one-way truncated hash. Env can override the salt, but a hardcoded default
// is required because plain-text Worker vars get wiped on every deploy.
const VISITOR_SALT = process.env.ANALYTICS_VISITOR_SALT || 'dalilarabtr-visitors-v1';
function hashIP(ip: string, ua: string): string {
  return createHash('sha256').update(`${ip}|${ua}|${VISITOR_SALT}`).digest('hex').slice(0, 16);
}

// ─── Cloudflare Geo → Country Name ──────────────────────────────────
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
    const clientIp = getClientIp(req);
    if (isRateLimited(`track:${clientIp}`, 60)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { event_name, page_path, duration_seconds, meta, analytics_consent } = body;
    const consented = analytics_consent === true;

    // Without consent, retain only aggregate traffic counts. Stable browser
    // identifiers are removed server-side even if a client sends them.
    const visitor_id = consented ? (body.visitor_id || '') : '';
    const session_id = consented ? (body.session_id || '') : '';

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

    // ─── Bot filter ─────────────────────────────────────────────────
    const ua = req.headers.get('user-agent') || '';
    if (isBot(ua)) {
      return NextResponse.json({ ok: true, filtered: 'bot' });
    }

    // ─── Extract real IP (Cloudflare-trusted, not the spoofable XFF) ──
    const ip = getClientIp(req);
    const ip_hash = ip !== 'unknown' ? hashIP(ip, ua) : null;

    // ─── Geolocation headers (Cloudflare) ───────────────────────────
    // cf-ipcountry is always available on Cloudflare. City/region require the
    // "Add visitor location headers" Managed Transform to be enabled once in
    // the dashboard (Rules → Transform Rules → Managed Transforms).
    const countryCode = req.headers.get('cf-ipcountry') || '';
    const city = req.headers.get('cf-ipcity') || '';
    const region =
      req.headers.get('cf-region') ||
      req.headers.get('cf-region-code') ||
      '';

    const ip_country = COUNTRY_NAMES[countryCode] || countryCode || null;
    // Decode defensively in case an upstream transform encodes location values.
    let ip_city: string | null = null;
    if (city) {
      try { ip_city = decodeURIComponent(city); } catch { ip_city = city; }
    }

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

    if (!consented) enrichedMeta.anon = true;

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
