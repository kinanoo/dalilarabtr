export const RECENT_ACTIVITY_KEY = 'daleel_recent_activity_v1';
export const RECENT_ACTIVITY_EVENT = 'daleel:recent-activity-updated';
export const MAX_RECENT_ACTIVITY = 6;

export type RecentActivityKind = 'article' | 'update' | 'service' | 'tool' | 'zone' | 'guide';

export interface RecentActivityItem {
  path: string;
  title: string;
  kind: RecentActivityKind;
  visitedAt: number;
}

const BLOCKED_PREFIXES = [
  '/admin',
  '/dashboard',
  '/models',
  '/login',
  '/register',
  '/auth',
  '/bookmarks',
];

const EXACT_GUIDES = new Set([
  '/codes',
  '/consultant',
  '/directory',
  '/e-devlet-services',
  '/places',
]);

function hasSingleChild(path: string, prefix: string): boolean {
  if (!path.startsWith(prefix)) return false;
  const child = path.slice(prefix.length);
  return child.length > 0 && !child.includes('/');
}

export function classifyRecentPath(rawPath: string): RecentActivityKind | null {
  const path = normalizeRecentPath(rawPath);
  if (!path || BLOCKED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return null;
  if (hasSingleChild(path, '/article/')) return 'article';
  if (hasSingleChild(path, '/updates/')) return 'update';
  if (hasSingleChild(path, '/services/')) return 'service';
  if (hasSingleChild(path, '/tools/')) return 'tool';
  if (hasSingleChild(path, '/zones/')) return 'zone';
  if (hasSingleChild(path, '/category/')) return 'guide';
  if (EXACT_GUIDES.has(path)) return path === '/consultant' ? 'tool' : 'guide';
  return null;
}

export function normalizeRecentPath(rawPath: string): string {
  if (!rawPath || rawPath.length > 500) return '';
  try {
    const url = new URL(rawPath, 'https://dalilarabtr.com');
    if (url.origin !== 'https://dalilarabtr.com') return '';
    const path = url.pathname.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/';
    return path.startsWith('/') ? path : '';
  } catch {
    return '';
  }
}

export function cleanRecentTitle(rawTitle: string, fallback = 'صفحة مفيدة'): string {
  const firstPart = rawTitle.split(/\s+[|–—]\s+/u)[0] || '';
  const clean = firstPart.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  return (clean || fallback).slice(0, 140);
}

export function parseRecentActivity(raw: string | null): RecentActivityItem[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) return [];

    const seen = new Set<string>();
    const items: RecentActivityItem[] = [];
    for (const candidate of value) {
      if (!candidate || typeof candidate !== 'object') continue;
      const path = normalizeRecentPath(String(candidate.path || ''));
      const kind = classifyRecentPath(path);
      if (!path || !kind || seen.has(path)) continue;
      const visitedAt = Number(candidate.visitedAt);
      items.push({
        path,
        kind,
        title: cleanRecentTitle(String(candidate.title || '')),
        visitedAt: Number.isFinite(visitedAt) && visitedAt > 0 ? visitedAt : Date.now(),
      });
      seen.add(path);
      if (items.length >= MAX_RECENT_ACTIVITY) break;
    }
    return items;
  } catch {
    return [];
  }
}

export function addRecentActivity(
  current: RecentActivityItem[],
  item: Omit<RecentActivityItem, 'kind'>,
): RecentActivityItem[] {
  const path = normalizeRecentPath(item.path);
  const kind = classifyRecentPath(path);
  if (!path || !kind) return current;

  const next: RecentActivityItem = {
    path,
    kind,
    title: cleanRecentTitle(item.title),
    visitedAt: item.visitedAt,
  };

  return [next, ...current.filter((entry) => entry.path !== path)].slice(0, MAX_RECENT_ACTIVITY);
}
