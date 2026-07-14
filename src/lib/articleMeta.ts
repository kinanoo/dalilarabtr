// Pure article-metadata helpers with ZERO imports.
//
// Extracted from useAdminData.ts so display components (ArticleViewPremium and
// friends) can show reading time / "updated recently" / view counts WITHOUT
// dragging the whole admin-data module (useResource + SWR + constants) into
// their client chunk. useAdminData re-exports these, so existing imports from
// there keep working.

export function isRecentlyUpdated(dateStr: string, days = 30): boolean {
  if (!dateStr) return false;
  const diff = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= days;
}

export function estimateReadingTime(article: { intro?: string; details?: string; steps?: string[]; tips?: string[] }): number {
  const text = [article.intro, article.details, ...(article.steps || []), ...(article.tips || [])].filter(Boolean).join(' ');
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

export function formatViewCount(views: number): string {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(views);
}
