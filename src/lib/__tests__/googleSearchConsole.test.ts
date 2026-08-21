import { rankSearchOpportunities } from '@/lib/googleSearchConsole';

describe('Search Console opportunity ranking', () => {
  it('prioritizes high-impression reachable queries and drops weak noise', () => {
    const ranked = rankSearchOpportunities([
      { keys: ['تحديث بيانات الكملك', 'https://dalilarabtr.com/article/a'], impressions: 1200, clicks: 12, ctr: 0.01, position: 7 },
      { keys: ['استعلام صغير', 'https://dalilarabtr.com/article/b'], impressions: 8, clicks: 0, ctr: 0, position: 8 },
      { keys: ['نتيجة متصدرة', 'https://dalilarabtr.com/article/c'], impressions: 900, clicks: 700, ctr: 0.77, position: 1.2 },
      { keys: ['إذن العمل', 'https://dalilarabtr.com/article/d'], impressions: 400, clicks: 10, ctr: 0.025, position: 12 },
    ]);

    expect(ranked.map(row => row.query)).toEqual(['تحديث بيانات الكملك', 'إذن العمل']);
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });
});
