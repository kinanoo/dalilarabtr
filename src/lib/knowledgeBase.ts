import { ARTICLES } from '@/lib/articles';
import {
  LATEST_UPDATES,
  SERVICES_LIST,
  QUICK_ACTIONS,
  FORMS,
  OFFICIAL_SOURCES,
  NAVIGATION,
} from '@/lib/data';
import { FAQ_FALLBACK_DATA } from '@/lib/faq-fallback';
import type { FAQCategory } from '@/lib/faq-types';
import { normalizeArabic, tokenizeArabicQuery, minTokenMatches, scoreMatch } from '@/lib/arabicSearch';
import { canonicalizeFaqCategories } from '@/lib/faqCanonical';

export type KnowledgeEntryType =
  | 'article'
  | 'faq'
  | 'update'
  | 'service'
  | 'quick_action'
  | 'form'
  | 'official_source'
  | 'navigation';

export type KnowledgeEntry = {
  id: string;
  type: KnowledgeEntryType;
  title: string;
  text: string;
  url: string;
  lastUpdate?: string;
};

export type KnowledgeSearchHit = {
  entry: KnowledgeEntry;
  score: number;
  matched: number;
  excerpt: string;
};

function safeJoin(parts: Array<string | undefined | null>, sep = '\n'): string {
  return parts
    .filter((p): p is string => Boolean(p && String(p).trim()))
    .map((p) => String(p).trim())
    .join(sep)
    .trim();
}

function buildArticleEntries(): KnowledgeEntry[] {
  return Object.entries(ARTICLES).map(([id, a]) => {
    const text = safeJoin([
      a.intro,
      a.details,
      a.documents?.length ? `المستندات:\n${a.documents.join('\n')}` : '',
      a.steps?.length ? `الخطوات:\n${a.steps.join('\n')}` : '',
      a.tips?.length ? `نصائح:\n${a.tips.join('\n')}` : '',
      a.fees ? `الرسوم/التكلفة: ${a.fees}` : '',
      a.warning ? `تحذير: ${a.warning}` : '',
    ]);

    return {
      id: `article:${id}`,
      type: 'article',
      title: a.title,
      text,
      url: `/article/${id}`,
      lastUpdate: a.lastUpdate,
    };
  });
}

function buildFaqEntries(categories: FAQCategory[]): KnowledgeEntry[] {
  const out: KnowledgeEntry[] = [];
  for (const cat of categories) {
    for (const q of cat.questions) {
      const text = safeJoin([`التصنيف: ${cat.category}`, q.a]);
      out.push({
        id: `faq:${q.id}`,
        type: 'faq',
        title: q.q,
        text,
        url: '/faq',
      });
    }
  }
  return out;
}

function buildUpdatesEntries(): KnowledgeEntry[] {
  return (LATEST_UPDATES || []).map((u) => ({
    id: `update:${u.id}`,
    type: 'update',
    title: u.title,
    text: safeJoin([u.type ? `النوع: ${u.type}` : '', u.content]),
    url: `/updates#upd-${u.id}`,
    lastUpdate: u.date,
  }));
}

function buildServicesEntries(): KnowledgeEntry[] {
  return (SERVICES_LIST || []).map((s) => ({
    id: `service:${s.id}`,
    type: 'service',
    title: s.title,
    text: s.desc || '',
    url: '/services',
  }));
}

function buildQuickActionsEntries(): KnowledgeEntry[] {
  return (QUICK_ACTIONS || []).map((q, idx) => ({
    id: `quick:${idx}:${q.href}`,
    type: 'quick_action',
    title: q.title,
    text: q.desc || '',
    url: q.href,
  }));
}

function buildFormsEntries(): KnowledgeEntry[] {
  return (FORMS || []).map((f, idx) => ({
    id: `form:${idx}:${f.name}`,
    type: 'form',
    title: f.name,
    text: safeJoin([f.desc, f.type ? `النوع: ${f.type}` : '', f.size ? `الحجم: ${f.size}` : '']),
    url: '/forms',
  }));
}

function buildOfficialSourcesEntries(): KnowledgeEntry[] {
  return (OFFICIAL_SOURCES || []).map((s) => ({
    id: `official:${s.url}`,
    type: 'official_source',
    title: s.name,
    text: s.desc || '',
    url: s.url,
  }));
}

function buildNavigationEntries(): KnowledgeEntry[] {
  return (NAVIGATION || [])
    .filter((n) => typeof n?.href === 'string')
    .map((n) => ({
      id: `nav:${n.href}`,
      type: 'navigation',
      title: n.name,
      text: n.name,
      url: n.href,
    }));
}

let memoEntries: KnowledgeEntry[] | null = null;

export function getKnowledgeBaseEntries(): KnowledgeEntry[] {
  if (memoEntries) return memoEntries;

  const canonicalFaq = canonicalizeFaqCategories(FAQ_FALLBACK_DATA);

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
