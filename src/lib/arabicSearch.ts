export function normalizeArabic(text: string): string {
  if (!text) return '';

  let normalized = text.toLowerCase().trim();

  // Remove Arabic diacritics
  normalized = normalized.replace(/[\u064B-\u065F\u0670]/g, '');

  // Normalize Arabic letters
  normalized = normalized
    .replace(/(آ|إ|أ)/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي');

  // Collapse spaces
  normalized = normalized.replace(/\s+/g, ' ');

  return normalized;
}

const AR_STOPWORDS = new Set([
  // Common intent / filler words
  'انا',
  'اني',
  'بدي',
  'بديك',
  'بدّي',
  'عاوز',
  'عايز',
  'اريد',
  'حابب',
  'محتاج',
  'احتاج',
  'لو',

  // Prepositions / connectors
  'من',
  'الى',
  'على',
  'عن',
  'في',
  'مع',
  'بدون',
  'بخصوص',
  'حول',

  // Conjunctions
  'و',
  'او',

  // Question words
  'كيف',
  'طريقة',
  'شلون',
  'شو',
  'متى',
  'وين',
  'هل',
  'ما',
  'ماذا',

  // Very short common prefixes (tokenizer may produce them)
  'ب',
  'ل',
  'اذا',
]);

export function tokenizeArabicQuery(text: string): string[] {
  const normalized = normalizeArabic(text);
  if (!normalized) return [];

  const parts = normalized
    .split(/[^\p{L}\p{N}]+/gu)
    .map((p) => p.trim())
    .filter(Boolean);

  const tokens = parts.filter((t) => {
    if (t.length <= 1) return false;
    if (AR_STOPWORDS.has(t)) return false;
    return true;
  });

  return Array.from(new Set(tokens));
}

export function minTokenMatches(tokens: string[]): number {
  return tokens.length <= 1 ? 1 : Math.max(2, Math.ceil(tokens.length * 0.5));
}

export function scoreMatch(
  haystack: string,
  title: string,
  tokens: string[]
): { score: number; matched: number } {
  if (!tokens.length) return { score: 0, matched: 0 };

  const titleNorm = normalizeArabic(title);
  let score = 0;
  let matched = 0;

  for (const token of tokens) {
    const inTitle = titleNorm.includes(token);
    const inBody = haystack.includes(token);
    if (!inTitle && !inBody) continue;
    matched += 1;
    score += inTitle ? 6 : 2;
  }

  // Bonus for matching more tokens (prefers closer results for sentences)
  score += matched * 3;

  return { score, matched };
}
