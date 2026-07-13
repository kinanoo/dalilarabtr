import { createHmac, timingSafeEqual } from 'crypto';

export const MODELS_GALLERY_COOKIE = 'dalil_models_gallery_access';
export const MODELS_GALLERY_SESSION_SECONDS = 6 * 60 * 60;

function sessionSecret() {
  return process.env.MODELS_GALLERY_SESSION_SECRET?.trim() || '';
}

function sign(expiresAt: string, passwordVersion: string, secret: string) {
  return createHmac('sha256', secret).update(`${expiresAt}.${passwordVersion}`).digest('hex');
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function isValidPasswordVersion(value: string) {
  return /^[a-zA-Z0-9_-]{8,80}$/.test(value);
}

export function createModelsGallerySession(passwordVersion: string, now = Date.now()): string | null {
  const secret = sessionSecret();
  if (!secret || !isValidPasswordVersion(passwordVersion)) return null;

  const expiresAt = String(now + MODELS_GALLERY_SESSION_SECONDS * 1000);
  return `${expiresAt}.${passwordVersion}.${sign(expiresAt, passwordVersion, secret)}`;
}

export function verifyModelsGallerySession(
  value: string | null | undefined,
  expectedPasswordVersion: string,
  now = Date.now(),
) {
  const secret = sessionSecret();
  if (!secret || !value || !isValidPasswordVersion(expectedPasswordVersion)) return false;

  const [expiresAt, passwordVersion, signature, extra] = value.split('.');
  if (!expiresAt || !passwordVersion || !signature || extra) return false;
  if (!safeEqual(passwordVersion, expectedPasswordVersion)) return false;

  const expiry = Number(expiresAt);
  if (!Number.isSafeInteger(expiry) || expiry <= now) return false;
  if (expiry > now + MODELS_GALLERY_SESSION_SECONDS * 1000 + 60_000) return false;

  return safeEqual(signature, sign(expiresAt, passwordVersion, secret));
}
