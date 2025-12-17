import type { FAQCategory, FAQQuestion } from '@/lib/faq-types';

import { FAQ_FALLBACK_DATA } from '@/lib/faq-fallback';
import { canonicalizeFaqCategories } from '@/lib/faqCanonical';

export { FAQ_FALLBACK_DATA };

function stripTags(html: string): string {
  const withLineBreaks = html.replace(/<br\s*\/?>/gi, '\n');
  const withoutTags = withLineBreaks.replace(/<[^>]*>/g, '');

  // Normalize whitespace but keep intentional new lines.
  return withoutTags
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function toId(prefix: string, categoryIndex: number, questionIndex: number): string {
  return `${prefix}-${categoryIndex}-${questionIndex}`;
}

function parseFaqSourceHtml(html: string): FAQCategory[] {
  // Prefer a real HTML parser (Cheerio) to avoid regex edge cases that drop most items.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cheerio = require('cheerio') as typeof import('cheerio');

    const $ = cheerio.load(html);
    const categories: FAQCategory[] = [];

    const normText = (text: string) => stripTags(decodeHtmlEntities(text));

    const extractItem = (
      $item: ReturnType<typeof cheerio.load>['prototype'] | any,
      idPrefix: string,
      categoryIndex: number,
      questionIndex: number
    ): FAQQuestion | null => {
      const rawQ = $item.find('.faq-question span').first().text() ?? '';
      const rawAHtml = $item.find('.faq-answer').first().html() ?? '';
      const q = normText(rawQ);
      const a = stripTags(decodeHtmlEntities(rawAHtml));

      if (!q || !a) return null;
      return { id: toId(idPrefix, categoryIndex, questionIndex), q, a };
    };

    // 1) Trend section (الأكثر بحثاً)
    const $trend = $('.trend-section').first();
    if ($trend.length) {
      const trendTitle = normText($trend.find('.trend-title').first().text() || 'الأكثر بحثاً');
      const questions: FAQQuestion[] = [];
      $trend.find('.faq-item').each((idx: number, el: any) => {
        const q = extractItem($(el), 'trend', 0, idx);
        if (q) questions.push(q);
      });
      if (questions.length) categories.push({ category: trendTitle, questions });
    }

    // 2) Categories: each h3 + following faq-item siblings until the next h3
    const $titles = $('h3.faq-category-title');
    $titles.each((catIdx: number, el: any) => {
      const title = normText($(el).text());
      const questions: FAQQuestion[] = [];

      let $cursor = $(el).next();
      let qIdx = 0;

      while ($cursor.length && !$cursor.is('h3.faq-category-title')) {
        if ($cursor.hasClass('faq-item')) {
          const q = extractItem($cursor, 'faq', catIdx + 1, qIdx);
          if (q) {
            questions.push(q);
            qIdx += 1;
          }
        }
        $cursor = $cursor.next();
      }

      if (questions.length) categories.push({ category: title, questions });
    });

    return categories;
  } catch {
    // Fallback: if cheerio isn't available for some reason, show the small built-in list.
    return [];
  }
}

export function getFAQData(): FAQCategory[] {
  // This function is intended to run server-side (during build/export or SSR).
  // If it runs client-side for any reason, gracefully fall back.
  if (typeof window !== 'undefined') return canonicalizeFaqCategories(FAQ_FALLBACK_DATA);

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs') as typeof import('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('node:path') as typeof import('node:path');

    const filePath = path.join(process.cwd(), 'src', 'lib', 'faq-source.html');
    if (!fs.existsSync(filePath)) return FAQ_FALLBACK_DATA;

    const html = fs.readFileSync(filePath, 'utf8');
    const parsed = parseFaqSourceHtml(html);

    const data = parsed.length > 0 ? parsed : FAQ_FALLBACK_DATA;
    return canonicalizeFaqCategories(data);
  } catch {
    return canonicalizeFaqCategories(FAQ_FALLBACK_DATA);
  }
}

export const FAQ_DATA = FAQ_FALLBACK_DATA;