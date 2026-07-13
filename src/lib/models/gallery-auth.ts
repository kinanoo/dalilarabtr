import { createHmac, timingSafeEqual } from 'crypto';

export const MODELS_GALLERY_COOKIE = 'dalil_models_gallery_access';
export const MODELS_GALLERY_SESSION_SECONDS = 12 * 60 * 60;

function sessionSecret() {
  return process.env.MODELS_GALLERY_SESSION_SECRET?.trim() || '';
}

function sign(expiresAt: string, secret: string) {
  return createHmac('sha256', secret).update(expiresAt).digest('hex');
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createModelsGallerySession(now = Date.now()): string | null {
  const secret = sessionSecret();
  if (!secret) return null;

  const expiresAt = String(now + MODELS_GALLERY_SESSION_SECONDS * 1000);
  return `${expiresAt}.${sign(expiresAt, secret)}`;
}

export function verifyModelsGallerySession(value?: string | null, now = Date.now()) {
  const secret = sessionSecret();
  if (!secret || !value) return false;

  const [expiresAt, signature, extra] = value.split('.');
  if (!expiresAt || !signature || extra) return false;

  const expiry = Number(expiresAt);
  if (!Number.isSafeInteger(expiry) || expiry <= now) return false;
  if (expiry > now + MODELS_GALLERY_SESSION_SECONDS * 1000 + 60_000) return false;

  return safeEqual(signature, sign(expiresAt, secret));
}

