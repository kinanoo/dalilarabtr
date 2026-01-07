// import { ARTICLES } from '@/lib/articles'; // REMOVED
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

const memoArticleIndex: ArticleIndexItem[] | null = null;

function getArticleIndex(): ArticleIndexItem[] {
  // Static article index is removed.
  return [];
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
  // Logic disabled
  return null;
}

function replaceArticlePathsWithTitles(answer: string): string {
  const input = (answer || '').trim();
  if (!input) return '';

  // Replace any raw article paths with their article titles (no URLs in the output).
  const replaced = input.replace(/\/article\/([A-Za-z0-9_-]+)/g, (_m, rawId: string) => {
    const id = String(rawId || '').trim();
    // const title = ARTICLES[id]?.title;
    const title = ''; // Disabled static lookup
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
      // Apply basic sanitization (e.g. replacing internal links with titles) 
      // but keep the original manually-written answer.
      const sanitizedAnswer = replaceArticlePathsWithTitles(q.a);
      questions.push({ ...q, a: sanitizedAnswer });
    }

    out.push({ ...cat, questions });
  }

  return out;
}
