import {
  sanitizeAnalyticsMeta,
  sanitizeAnalyticsPath,
  sanitizeSearchQuery,
} from '@/lib/analyticsPrivacy';

describe('analytics privacy', () => {
  test('keeps useful legal codes and years', () => {
    expect(sanitizeSearchQuery('شرح كود V-160 وقانون 6458 في 2026')).toBe('شرح كود V-160 وقانون 6458 في 2026');
  });

  test('redacts contact-sized identity data', () => {
    const safe = sanitizeSearchQuery('اتصل 0532 123 45 67 أو test@example.com https://example.com/a');
    expect(safe).not.toContain('0532');
    expect(safe).not.toContain('test@example.com');
    expect(safe).not.toContain('https://');
    expect(safe).toContain('[رقم محجوب]');
  });

  test('strips query strings from analytics paths', () => {
    expect(sanitizeAnalyticsPath('/article/test?email=x@example.com#part')).toBe('/article/test');
    expect(sanitizeAnalyticsPath('https://example.com')).toBe('/');
  });

  test('limits metadata keys and sanitizes query', () => {
    expect(sanitizeAnalyticsMeta({
      query: 'هاتف 905321234567',
      referrer: 'https://google.com/search?q=secret',
      result_url: '/article/test?token=secret',
      'bad-key!': ' value ',
    })).toEqual({
      query: 'هاتف [رقم محجوب]',
      referrer: 'google.com',
      result_url: '/article/test',
      badkey: 'value',
    });
  });
});
