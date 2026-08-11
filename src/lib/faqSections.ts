/**
 * FAQ section consolidation.
 *
 * The faqs table grew 70+ ad-hoc category strings («خفايا السيارات والمرور»,
 * «تفاصيل السيارات والسفر», «السيارات والقيادة»…) — unusable as navigation
 * and cannibalizing as sections. This maps every raw category (Arabic or the
 * editor's legacy English keys) onto 14 stable umbrella sections with fixed
 * order and Latin slugs for anchor links. First matching rule wins; rule
 * order resolves the real collisions in the data (e.g. «الجرائم الإلكترونية»
 * lands in digital because digital precedes law; «المواصلات والتنقل» lands in
 * cars because cars precedes travel, while «إجراءات التنقل والعودة» reaches
 * travel through تنقل/عودة which cars does not claim).
 */

export type FaqRow = {
  id: string | number;
  question: string;
  answer: string | null;
  category: string | null;
};

export type FaqItem = { id: string; q: string; a: string };

export type FaqSection = {
  slug: string;
  title: string;
  blurb: string;
  questions: FaqItem[];
};

type SectionDef = { slug: string; title: string; blurb: string; match: RegExp | null };

// Order here IS the page order. `match: null` = fallback bucket.
const SECTION_DEFS: SectionDef[] = [
  {
    slug: 'top',
    title: 'الأكثر بحثاً',
    blurb: 'الأسئلة التي يسألها الجميع — ابدأ من هنا.',
    match: /الأكثر بحثا|الاكثر بحثا/,
  },
  {
    slug: 'newcomers',
    title: 'القادمون الجدد',
    blurb: 'أول أسبوع في تركيا: ما يلزمك قبل كل شيء.',
    match: /القادمون الجدد|الأسبوع الأول/,
  },
  {
    slug: 'kimlik',
    title: 'الكملك وشؤون السوريين',
    blurb: 'الحماية المؤقتة، الكملك، وملفات السوريين الخاصة.',
    match: /كملك|كمليك|سوري|الحماية المؤقتة/,
  },
  {
    slug: 'residence',
    title: 'الإقامة والجنسية',
    blurb: 'الإقامات بأنواعها، شؤون الأجانب، والتجنيس.',
    match: /إقامة|الاقامة|جنسية|شؤون الأجانب|residency/i,
  },
  {
    slug: 'work',
    title: 'العمل والشركات',
    blurb: 'إذن العمل، حقوق الموظف، وتأسيس المشاريع.',
    match: /عمل|موظف|بطالة|شركات|تجارة|مشاريع|work/i,
  },
  {
    slug: 'money',
    title: 'المال والبنوك والضرائب',
    blurb: 'الحسابات، الحوالات، الضرائب، الديون، والعملات الرقمية.',
    match: /بنك|بنوك|مال|ضرائب|ضريبة|كريبتو|ديون|رسوم/,
  },
  {
    slug: 'housing',
    title: 'السكن والعقارات',
    blurb: 'الإيجار وعقوده، التملك، الطابو، وحقوق الجيرة.',
    match: /سكن|إيجار|الايجار|عقار|طابو|جيران|تملك/,
  },
  {
    slug: 'health',
    title: 'الصحة والتأمين',
    blurb: 'المشافي، التأمين الصحي، والعلاج.',
    match: /صحة|صحية|تأمين|مشافي|علاج|جمال|health/i,
  },
  {
    slug: 'education',
    title: 'التعليم',
    blurb: 'المدارس، الجامعات، والدورات.',
    match: /تعليم|مدارس|جامع|دورات/,
  },
  {
    slug: 'cars',
    title: 'السيارات والمواصلات',
    blurb: 'القيادة، الرخص، المخالفات، والنقل العام.',
    match: /سيارات|سيارة|مرور|قيادة|مواصلات/,
  },
  {
    slug: 'travel',
    title: 'السفر والحدود والعودة',
    blurb: 'المطار، الجمارك، أذونات التنقل، والعودة الطوعية.',
    match: /سفر|مطار|جمارك|سياحة|عودة|تنقل/,
  },
  {
    slug: 'digital',
    title: 'الخدمات الإلكترونية والاتصالات',
    blurb: 'e-Devlet، الإنترنت، الخطوط، وحماية بياناتك.',
    match: /إلكتروني|الكتروني|إنترنت|الانترنت|اتصالات|تقنية|تكنولوجيا|devlet|apps/i,
  },
  {
    slug: 'law',
    title: 'القانون والمحاكم',
    blurb: 'النوتر، المحاكم، الطلاق والميراث، وحقوق المستهلك.',
    match: /قانون|قانوني|محاكم|جنائي|نوتر|طلاق|ميراث|وفاة|جرائم|مستهلك|قضايا|حضانة|legal/i,
  },
  {
    slug: 'daily',
    title: 'الحياة اليومية',
    blurb: 'التسوق، الطوارئ، الاندماج، وحيل الحياة الذكية.',
    match: null,
  },
];

function sectionSlugFor(rawCategory: string | null): string {
  const cat = (rawCategory || '').trim();
  for (const def of SECTION_DEFS) {
    if (def.match && def.match.test(cat)) return def.slug;
  }
  return 'daily';
}

/** Light normalization for question dedupe only (not search). */
function dedupeKey(q: string): string {
  return q.replace(/[\s؟?!.،,]+/g, ' ').trim();
}

/** Arabic-correct question count: 1 سؤال، 2 سؤالان، 3–10 أسئلة، 11+ سؤالاً. */
export function faqCountLabel(n: number): string {
  if (n === 1) return 'سؤال واحد';
  if (n === 2) return 'سؤالان';
  if (n >= 3 && n <= 10) return `${n} أسئلة`;
  return `${n} سؤالاً`;
}

export function buildFaqSections(rows: FaqRow[]): FaqSection[] {
  const bySlug = new Map<string, FaqItem[]>();
  const seen = new Set<string>();

  for (const row of rows) {
    const q = (row.question || '').trim();
    const a = (row.answer || '').trim();
    if (!q || !a) continue;
    const key = dedupeKey(q);
    if (seen.has(key)) continue;
    seen.add(key);
    const slug = sectionSlugFor(row.category);
    if (!bySlug.has(slug)) bySlug.set(slug, []);
    bySlug.get(slug)!.push({ id: String(row.id), q, a });
  }

  return SECTION_DEFS.filter((def) => (bySlug.get(def.slug) || []).length > 0).map(
    (def) => ({
      slug: def.slug,
      title: def.title,
      blurb: def.blurb,
      questions: bySlug.get(def.slug)!,
    })
  );
}
