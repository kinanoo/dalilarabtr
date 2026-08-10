import {
  MAX_RECENT_ACTIVITY,
  addRecentActivity,
  classifyRecentPath,
  cleanRecentTitle,
  normalizeRecentPath,
  parseRecentActivity,
  type RecentActivityItem,
} from '@/lib/recentActivity';

describe('recent activity', () => {
  test('tracks useful detail pages and excludes private or generic pages', () => {
    expect(classifyRecentPath('/article/kimlik-update')).toBe('article');
    expect(classifyRecentPath('/services/provider-id')).toBe('service');
    expect(classifyRecentPath('/tools/pharmacy')).toBe('tool');
    expect(classifyRecentPath('/admin/articles')).toBeNull();
    expect(classifyRecentPath('/models/private-token')).toBeNull();
    expect(classifyRecentPath('/services')).toBeNull();
    expect(classifyRecentPath('/')).toBeNull();
  });

  test('removes query strings and rejects external URLs', () => {
    expect(normalizeRecentPath('/article/test?token=secret#part')).toBe('/article/test');
    expect(normalizeRecentPath('https://example.com/article/test')).toBe('');
  });

  test('cleans the shared site suffix from document titles', () => {
    expect(cleanRecentTitle('تحديث بيانات الكملك | دليل العرب')).toBe('تحديث بيانات الكملك');
  });

  test('moves revisited pages to the front without duplication', () => {
    const current: RecentActivityItem[] = [
      { path: '/article/first', title: 'الأول', kind: 'article', visitedAt: 1 },
      { path: '/tools/pharmacy', title: 'الصيدليات', kind: 'tool', visitedAt: 2 },
    ];
    const next = addRecentActivity(current, { path: '/article/first', title: 'الأول المحدث', visitedAt: 3 });
    expect(next.map((item) => item.path)).toEqual(['/article/first', '/tools/pharmacy']);
    expect(next[0].title).toBe('الأول المحدث');
  });

  test('parses only valid records and caps the list', () => {
    const raw = JSON.stringify(Array.from({ length: 10 }, (_, index) => ({
      path: `/article/${index}`,
      title: `مقال ${index}`,
      visitedAt: index + 1,
    })));
    expect(parseRecentActivity(raw)).toHaveLength(MAX_RECENT_ACTIVITY);
    expect(parseRecentActivity('{bad json')).toEqual([]);
  });
});
