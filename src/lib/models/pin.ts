export function normalizeModelPin(pin: unknown): string {
  return typeof pin === 'string' ? pin.trim() : '';
}

export function isUsableModelPin(pin: string): boolean {
  return pin.length >= 3 && pin.length <= 80;
}

export async function hashModelPin(pin: string, scopeId: string): Promise<string> {
  const salt = process.env.MODELS_PIN_SALT || process.env.NEXT_PUBLIC_SITE_URL || 'dalilarabtr-model-pins';
  const data = new TextEncoder().encode(`${salt}:${scopeId}:${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyModelPin(args: {
  pin: unknown;
  scopeId: string;
  expectedHash: string | null;
}): Promise<boolean> {
  const pin = normalizeModelPin(args.pin);
  if (!args.expectedHash || !isUsableModelPin(pin)) return false;
  return hashModelPin(pin, args.scopeId).then((hash) => hash === args.expectedHash);
}
