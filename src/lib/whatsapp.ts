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

export function getSiteWhatsAppHref(text?: string) {
  return buildWhatsAppHref(SITE_CONFIG.whatsapp, text);
}
