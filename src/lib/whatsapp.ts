import { SITE_CONFIG } from '@/lib/config';

export function normalizeWhatsAppPhone(phone: string) {
  return String(phone || '').replace(/\D/g, '');
}

export function buildWhatsAppHref(phone: string, text?: string) {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return null;
  const base = `https://wa.me/${normalized}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function buildWhatsAppAppHref(phone: string, text?: string) {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return null;
  const base = `whatsapp://send?phone=${normalized}`;
  if (!text) return base;
  return `${base}&text=${encodeURIComponent(text)}`;
}

export function isLikelyMobileWhatsAppDevice(userAgent = '') {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
}

export function openWhatsAppDirect(phone: string, text?: string) {
  if (typeof window === 'undefined') return false;

  const webHref = buildWhatsAppHref(phone, text);
  const appHref = buildWhatsAppAppHref(phone, text);
  if (!webHref || !appHref) return false;

  if (!isLikelyMobileWhatsAppDevice(window.navigator.userAgent)) {
    return false;
  }

  window.location.href = appHref;
  window.setTimeout(() => {
    if (!document.hidden) {
      window.location.href = webHref;
    }
  }, 900);
  return true;
}

export function getSiteWhatsAppHref(text?: string) {
  return buildWhatsAppHref(SITE_CONFIG.whatsapp, text);
}
