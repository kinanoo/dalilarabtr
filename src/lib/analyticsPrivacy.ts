const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const URL_PATTERN = /https?:\/\/\S+/gi;
const TURKISH_MOBILE_PATTERN = /(?:\+?90[\s.-]?)?(?:0?5\d{2})[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/g;
const LONG_NUMBER_PATTERN = /\+?\d{7,}/g;

/**
 * Search terms are product signals, not a place to retain identity data.
 * Keep useful short numbers such as V-160, 6458 and 2026, while removing
 * phone/identity-sized values, email addresses and pasted links.
 */
export function sanitizeSearchQuery(input: unknown): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(URL_PATTERN, '[رابط محجوب]')
    .replace(EMAIL_PATTERN, '[بريد محجوب]')
    .replace(TURKISH_MOBILE_PATTERN, '[رقم محجوب]')
    .replace(LONG_NUMBER_PATTERN, '[رقم محجوب]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

export function sanitizeAnalyticsPath(input: unknown): string {
  if (typeof input !== 'string' || !input.startsWith('/')) return '/';
  return input.split('?')[0].split('#')[0].slice(0, 300) || '/';
}

function sanitizeReferrer(input: unknown): string {
  if (typeof input !== 'string' || !input) return '';
  try {
    return new URL(input).hostname.slice(0, 120);
  } catch {
    return '';
  }
}

export function sanitizeAnalyticsMeta(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};

  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>).slice(0, 24)) {
    const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 40);
    if (!safeKey) continue;

    if (safeKey === 'query') {
      output.query = sanitizeSearchQuery(value);
      continue;
    }

    if (safeKey === 'referrer') {
      const referrer = sanitizeReferrer(value);
      if (referrer) output.referrer = referrer;
      continue;
    }

    if (safeKey === 'result_url') {
      output.result_url = sanitizeAnalyticsPath(value);
      continue;
    }

    if (typeof value === 'string') {
      output[safeKey] = value.replace(/\s+/g, ' ').trim().slice(0, 180);
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      output[safeKey] = value;
    } else if (typeof value === 'boolean' || value === null) {
      output[safeKey] = value;
    }
  }

  return output;
}
