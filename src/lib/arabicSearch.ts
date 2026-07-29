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

/**
 * Every spelling of a token that a Postgres `ilike` would treat as a different
 * word, so a database filter can match what a human actually typed.
 *
 * normalizeArabic() folds أ/إ/آ→ا, ة→ه, ى→ي, ؤ→و, ئ→ي — but that only helps
 * once the rows are already in the browser. The `ilike` filters we send to
 * Supabase compare raw bytes, so a visitor typing "اعفاء اذن طريق" (no hamza,
 * which is how most people type on a phone) matched ZERO articles while the
 * stored title reads "إعفاء إذن الطريق". Measured on the live database:
 * "اعفاء" → 0 rows, "إعفاء" → 5. Same for "اذن" → 1 vs "إذن" → 5.
 *
 * So we expand the bare form back out into its variants and OR them together.
 * Capped per token because each variant is another OR branch in the URL.
 */
const AR_VARIANT_GROUPS: Array<[RegExp, string[]]> = [
  [/ا/g, ['ا', 'أ', 'إ', 'آ']],
  [/ه/g, ['ه', 'ة']],
  [/ي/g, ['ي', 'ى']],
];

export function arabicSpellingVariants(token: string, max = 6): string[] {
  if (!token) return [];
  const base = normalizeArabic(token);
  if (!base) return [];

  let forms = [base];
  for (const [pattern, replacements] of AR_VARIANT_GROUPS) {
    const next = new Set<string>();
    for (const form of forms) {
      const positions: number[] = [];
      form.replace(pattern, (m, i: number) => { positions.push(i); return m; });
      if (!positions.length) { next.add(form); continue; }
      // Vary one position at a time — full cross-product explodes on long words
      // and adds little: real spellings differ in a single letter far more often.
      next.add(form);
      for (const pos of positions) {
        for (const rep of replacements) {
          next.add(form.slice(0, pos) + rep + form.slice(pos + 1));
        }
      }
    }
    forms = Array.from(next);
    if (forms.length > max * 4) break;
  }

  // Keep the plain normalized form first — it is the likeliest hit.
  const ordered = [base, ...forms.filter((f) => f !== base)];
  return Array.from(new Set(ordered)).slice(0, max);
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
