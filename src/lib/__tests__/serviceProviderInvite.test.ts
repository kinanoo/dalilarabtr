import {
  getInviteSuppressUntil,
  isInviteSuppressed,
  SERVICE_PROVIDER_INVITE_COOLDOWN_MS,
} from '@/lib/serviceProviderInvite';

describe('service provider invite cooldown', () => {
  const now = Date.UTC(2026, 7, 13, 12);

  it('suppresses the invite until the seven-day deadline', () => {
    const deadline = now + SERVICE_PROVIDER_INVITE_COOLDOWN_MS;
    expect(isInviteSuppressed(String(deadline), now)).toBe(true);
    expect(isInviteSuppressed(String(deadline), deadline)).toBe(false);
  });

  it('ignores missing and malformed storage values', () => {
    expect(getInviteSuppressUntil(null)).toBe(0);
    expect(getInviteSuppressUntil('not-a-number')).toBe(0);
    expect(isInviteSuppressed('-1', now)).toBe(false);
  });
});
