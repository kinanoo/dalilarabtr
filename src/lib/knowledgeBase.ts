// import { ARTICLES } from '@/lib/articles'; // REMOVED
import {
  LATEST_UPDATES,
  SERVICES_LIST,
  QUICK_ACTIONS,
  FORMS,
  OFFICIAL_SOURCES,
  NAVIGATION,
} from '@/lib/constants';
import { FAQCategory } from '@/lib/faq-types';
// import { FAQ_DATA } from '@/lib/faq-data'; // REMOVED
import {
  normalizeArabic,
  tokenizeArabicQuery,
  minTokenMatches,
  scoreMatch
} from '@/lib/arabicSearch';

// ...

// KnowledgeEntry type definition
export type KnowledgeEntryType = 'article' | 'service' | 'faq' | 'code' | 'update' | 'form' | 'source' | 'nav';

export interface KnowledgeEntry {
  type: KnowledgeEntryType;
  title: string;
  url: string;
  text: string;
  description?: string;
  icon?: any;
  metadata?: any;
}

export interface KnowledgeSearchHit {
  entry: KnowledgeEntry;
  score: number;
  matched: number;
  excerpt: string;
}

// Cache variable
let memoEntries: KnowledgeEntry[] | null = null;



export function getKnowledgeBaseEntries(): KnowledgeEntry[] {
  if (memoEntries) return memoEntries;

  // const canonicalFaq = canonicalizeFaqCategories(FAQ_DATA);
  const canonicalFaq: FAQCategory[] = []; // Static FAQs removed

  const entries: KnowledgeEntry[] = [
    ...buildArticleEntries(),
    ...buildFaqEntries(canonicalFaq),
    ...buildUpdatesEntries(),
    ...buildServicesEntries(),
    ...buildQuickActionsEntries(),
    ...buildFormsEntries(),
    ...buildOfficialSourcesEntries(),
    ...buildNavigationEntries(),
  ];

  const seen = new Set<string>();
  memoEntries = entries.filter((e) => {
    const key = `${e.type}|${e.url}|${normalizeArabic(e.title)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return memoEntries;
}

function makeExcerpt(text: string, tokens: string[], maxLen = 170): string {
  const raw = (text || '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';
  if (!tokens.length) return raw.slice(0, maxLen) + (raw.length > maxLen ? '…' : '');

  const lowered = normalizeArabic(raw);
  let bestIndex = -1;
  for (const token of tokens) {
    const idx = lowered.indexOf(token);
    if (idx !== -1 && (bestIndex === -1 || idx < bestIndex)) bestIndex = idx;
  }

  if (bestIndex === -1) return raw.slice(0, maxLen) + (raw.length > maxLen ? '…' : '');

  const start = Math.max(0, bestIndex - Math.floor(maxLen / 3));
  const slice = raw.slice(start, start + maxLen);
  const prefix = start > 0 ? '…' : '';
  const suffix = raw.length > start + maxLen ? '…' : '';
  return `${prefix}${slice}${suffix}`;
}

export function searchKnowledgeBase(
  query: string,
  opts?: { limit?: number; types?: KnowledgeEntryType[] }
): KnowledgeSearchHit[] {
  const limit = opts?.limit ?? 5;
  const tokens = tokenizeArabicQuery(query);
  if (!tokens.length) return [];

  const minMatch = minTokenMatches(tokens);
  const typeSet = opts?.types?.length ? new Set(opts.types) : null;

  const entries = getKnowledgeBaseEntries();
  const scored: KnowledgeSearchHit[] = [];

  for (const entry of entries) {
    if (typeSet && !typeSet.has(entry.type)) continue;

    const hay = normalizeArabic(`${entry.title} ${entry.text}`);
    const r = scoreMatch(hay, entry.title, tokens);
    if (r.matched < minMatch) continue;

    scored.push({
      entry,
      score: r.score,
      matched: r.matched,
      excerpt: makeExcerpt(entry.text, tokens),
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

function buildArticleEntries(): KnowledgeEntry[] {
  // Static articles removed in favor of DB
  return [];
}

function buildFaqEntries(faqs: FAQCategory[]): KnowledgeEntry[] {
  // Static FAQs removed or passed in as empty
  return [];
}

function buildUpdatesEntries(): KnowledgeEntry[] {
  return LATEST_UPDATES.map(update => ({
    type: 'update',
    title: update.title,
    url: '/news', // General news page, as updates don't have individual pages yet
    text: update.content || '',
    description: update.type,
    metadata: { date: update.date, type: update.type }
  }));
}

function buildServicesEntries(): KnowledgeEntry[] {
  return SERVICES_LIST.map(service => ({
    type: 'service',
    title: service.title,
    url: '/services', // Could be refined if services have pages
    text: service.desc,
    icon: service.icon,
    metadata: { id: service.id, color: service.color }
  }));
}

function buildQuickActionsEntries(): KnowledgeEntry[] {
  return QUICK_ACTIONS.map(action => ({
    type: 'nav', // Treated as nav items
    title: action.title,
    url: action.href,
    text: action.desc,
    icon: action.icon,
    description: action.desc
  }));
}

function buildFormsEntries(): KnowledgeEntry[] {
  return FORMS.map(form => ({
    type: 'form',
    title: form.name,
    url: form.url,
    text: form.desc,
    description: form.desc,
    metadata: { type: form.type, size: form.size }
  }));
}

function buildOfficialSourcesEntries(): KnowledgeEntry[] {
  return OFFICIAL_SOURCES.map(source => ({
    type: 'source',
    title: source.name,
    url: source.url,
    text: source.desc,
    description: source.desc
  }));
}

function buildNavigationEntries(): KnowledgeEntry[] {
  return NAVIGATION.map(nav => ({
    type: 'nav',
    title: nav.name,
    url: nav.href,
    text: nav.name,
    icon: nav.icon
  }));
}
