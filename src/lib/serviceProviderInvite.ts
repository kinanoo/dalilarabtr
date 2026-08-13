export const SERVICE_PROVIDER_INVITE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
export const SERVICE_PROVIDER_INVITE_STORAGE_KEY = 'daleel.service-provider-invite.suppress-until.v2';

export function getInviteSuppressUntil(value: string | null): number {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function isInviteSuppressed(value: string | null, now = Date.now()): boolean {
  return getInviteSuppressUntil(value) > now;
}
