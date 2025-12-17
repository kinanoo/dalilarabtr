import { ARTICLES } from '@/lib/articles';
import type { FAQCategory, FAQQuestion } from '@/lib/faq-types';
import { minTokenMatches, normalizeArabic, scoreMatch, tokenizeArabicQuery } from '@/lib/arabicSearch';

type ArticleIndexItem = {
  id: string;
  title: string;
  lastUpdate?: string;
  intro?: string;
  haystack: string;
};

const POLICY_VERB_RE = /(لا\s*يمكن|غير\s*ممكن|مستحيل|ممنوع|لا\s*يسمح|لا\s*|بدي|عايز|رايد|عم دور|عندي|لازمني|يحق|يمكن|ممكن|متاح|يسمح|يحق)/;

let memoArticleIndex: ArticleIndexItem[] | null = null;

function getArticleIndex(): ArticleIndexItem[] {
  if (memoArticleIndex) return memoArticleIndex;

  memoArticleIndex = Object.entries(ARTICLES).map(([id, a]) => {
    const raw = [a.title, a.intro, a.details].filter(Boolean).join(' ');
    return {
      id,
      title: a.title,
      lastUpdate: a.lastUpdate,
      intro: a.intro,
      haystack: normalizeArabic(raw),
    };
  });

  return memoArticleIndex;
}

function shouldCanonicalize(q: FAQQuestion): boolean {
  return POLICY_VERB_RE.test(q.q) || POLICY_VERB_RE.test(q.a);
}

function pickBestArticle(questionText: string): { id: string; score: number } | null {
  const trimmed = (questionText || '').trim();
  if (trimmed.length < 4) return null;

  const tokens = tokenizeArabicQuery(trimmed);
  if (tokens.length < 2) return null;

  const minMatched = minTokenMatches(tokens);

  let best: { id: string; score: number; matched: number } | null = null;
  for (const item of getArticleIndex()) {
    const { score, matched } = scoreMatch(item.haystack, item.title, tokens);
    if (matched < minMatched) continue;

    if (!best || score > best.score) {
      best = { id: item.id, score, matched };
    }
  }

  // A conservative threshold to avoid linking irrelevant articles.
  if (!best || best.score < 18) return null;
  return { id: best.id, score: best.score };
}

function buildCanonicalAnswer(articleId: string): string | null {
  const a = ARTICLES[articleId];
  if (!a) return null;

  const intro = (a.intro || '').trim();
  if (!intro) return null;

  const update = a.lastUpdate ? `آخر تحديث: ${a.lastUpdate}` : '';
  const meta = update ? ` (${update})` : '';

  return `${intro}\n\nالمرجع الأحدث: ${a.title}${meta}`.trim();
}

function replaceArticlePathsWithTitles(answer: string): string {
  const input = (answer || '').trim();
  if (!input) return '';

  // Replace any raw article paths with their article titles (no URLs in the output).
  const replaced = input.replace(/\/article\/([A-Za-z0-9_-]+)/g, (_m, rawId: string) => {
    const id = String(rawId || '').trim();
    const title = ARTICLES[id]?.title;
    return title ? `«${title}»` : '«مقال داخل الموقع»';
  });

  // If the old canonical format exists, remove the line entirely.
  return replaced
    .replace(/\n?الرابط داخل الموقع:\s*[^\n]+/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function canonicalizeFaqCategories(categories: FAQCategory[]): FAQCategory[] {
  const out: FAQCategory[] = [];

  for (const cat of categories) {
    const questions: FAQQuestion[] = [];

    for (const q of cat.questions) {
      const sanitizedAnswer = replaceArticlePathsWithTitles(q.a);

      if (!shouldCanonicalize(q)) {
        questions.push({ ...q, a: sanitizedAnswer });
        continue;
      }

      // Never emit raw /article/... in the FAQ surface.
      if (q.a.includes('/article/')) {
        questions.push({ ...q, a: sanitizedAnswer });
        continue;
      }

      const best = pickBestArticle(q.q);
      if (!best) {
        questions.push({ ...q, a: sanitizedAnswer });
        continue;
      }

      const canonical = buildCanonicalAnswer(best.id);
      if (!canonical) {
        questions.push({ ...q, a: sanitizedAnswer });
        continue;
      }

      questions.push({ ...q, a: replaceArticlePathsWithTitles(canonical) });
    }

    out.push({ ...cat, questions });
  }

  return out;
}
