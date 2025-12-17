import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Load TypeScript data modules without needing a build step.
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'CommonJS',
    moduleResolution: 'Node',
    esModuleInterop: true,
    resolveJsonModule: true,
    target: 'ES2019',
  },
});

// Enable TS path aliases like @/* from tsconfig.json.
require('tsconfig-paths/register');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ARTICLES } = require('../src/lib/articles.ts');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { CONSULTANT_SCENARIOS } = require('../src/lib/consultant-data.ts');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getFAQData } = require('../src/lib/faq.ts');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { canonicalizeFaqCategories } = require('../src/lib/faqCanonical.ts');

const repoRoot = path.resolve(process.cwd());
const reportsDir = path.join(repoRoot, 'reports');

function normalizeText(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildEntries() {
  /** @type {Array<{id:string, type:string, title:string, lastUpdate?:string, text:string}>} */
  const entries = [];

  for (const [id, a] of Object.entries(ARTICLES)) {
    const text = normalizeText(
      [a.title, a.intro, a.details, ...(a.documents || []), ...(a.steps || []), ...(a.tips || []), a.fees, a.warning]
        .filter(Boolean)
        .join('\n')
    );
    entries.push({ id: `article:${id}`, type: 'article', title: a.title, lastUpdate: a.lastUpdate, text });
  }

  for (const [key, s] of Object.entries(CONSULTANT_SCENARIOS)) {
    const text = normalizeText(
      [s.title, s.desc, s.legal, ...(s.steps || []), ...(s.docs || []), s.cost, s.link]
        .filter(Boolean)
        .join('\n')
    );
    entries.push({ id: `consult:${key}`, type: 'consultant', title: s.title, lastUpdate: s.lastUpdate, text });
  }

  const faqRaw = getFAQData();
  const faq = canonicalizeFaqCategories(faqRaw);

  for (const cat of faq) {
    for (const q of cat.questions) {
      entries.push({
        id: `faq:${q.id}`,
        type: 'faq',
        title: q.q,
        text: normalizeText(`التصنيف: ${cat.category}\nس: ${q.q}\nج: ${q.a}`),
      });
    }
  }

  return entries;
}

/**
 * A small, targeted ruleset for high-risk “possible vs impossible” contradictions.
 * This is not a formal proof, but catches the most damaging conflicts.
 */
const RULES = [
  {
    id: 'kimlik_to_residence',
    label: 'تحويل الكملك إلى إقامة',
    positives: [
      /(يمكن|ممكن|متاح|يسمح)\s*.{0,40}(تحويل|تبديل)\s*.{0,60}(كملك|الكيملك|الحماية\s*المؤقتة)\s*.{0,40}(الى|لـ)\s*.{0,40}(اقامة|إقامة)/,
    ],
    negatives: [
      /(لا\s*يمكن|غير\s*ممكن|مستحيل|ممنوع|لا\s*يسمح)\s*.{0,60}(تحويل|تبديل)\s*.{0,80}(كملك|الكيملك|الحماية\s*المؤقتة)\s*.{0,60}(اقامة|إقامة)/,
    ],
  },
  {
    id: 'move_kimlik_between_provinces',
    label: 'نقل الكملك بين الولايات',
    positives: [
      /(يمكن|ممكن|يسمح)\s*.{0,40}(نقل)\s*.{0,40}(الكملك|كملك)\s*.{0,40}(ولاية|ولايات)/,
    ],
    negatives: [
      /(لا\s*يمكن|مستحيل|ممنوع)\s*.{0,40}(نقل)\s*.{0,40}(الكملك|كملك)\s*.{0,40}(ولاية|ولايات)/,
    ],
  },
  {
    id: 'travel_without_permit',
    label: 'السفر بين الولايات بدون إذن',
    positives: [/(يمكن|ممكن|يسمح)\s*.{0,40}(السفر|التنقل)\s*.{0,40}(بدون|دون)\s*.{0,20}(اذن|إذن)/],
    negatives: [/(لا\s*يمكن|ممنوع|لا\s*يسمح)\s*.{0,40}(السفر|التنقل)\s*.{0,40}(بدون|دون)\s*.{0,20}(اذن|إذن)/],
  },
  {
    id: 'work_with_kimlik_only',
    label: 'العمل بالكملك فقط',
    positives: [/(يمكن|يحق|ممكن|يسمح)\s*.{0,40}(العمل)\s*.{0,40}(بالكملك|بالكيملك|بكملك)/],
    negatives: [/(لا\s*يمكن|لا\s*يحق|ممنوع|غير\s*مسموح)\s*.{0,60}(العمل)\s*.{0,60}(بالكملك|بالكيملك|بكملك)/],
  },
  {
    id: 'syrians_property_ownership',
    label: 'تملك العقار للسوريين',
    positives: [/(يمكن|يحق|ممكن|يسمح)\s*.{0,60}(السوريون|للسوريين)\s*.{0,60}(التملك|شراء)\s*.{0,60}(عقار|عقارات)/],
    negatives: [/(لا\s*يحق|لا\s*يمكن|ممنوع)\s*.{0,80}(السوريون|للسوريين)\s*.{0,80}(التملك|شراء)\s*.{0,80}(عقار|عقارات)/],
  },
  {
    id: 'drive_with_syrian_license',
    label: 'القيادة بالرخصة السورية',
    positives: [/(يمكن|ممكن|يسمح)\s*.{0,50}(القيادة)\s*.{0,60}(بالرخصة\s*السورية|بشهادتي\s*السورية|رخصتي\s*السورية)/],
    negatives: [/(لا\s*يمكن|ممنوع|لا\s*يسمح)\s*.{0,70}(القيادة)\s*.{0,80}(بالرخصة\s*السورية|بشهادتي\s*السورية|رخصتي\s*السورية)/],
  },
];

function findMatches(entries, regexes) {
  /** @type {Array<{entryId:string,type:string,title:string,excerpt:string}>} */
  const hits = [];

  for (const e of entries) {
    const text = e.text || '';
    for (const re of regexes) {
      const m = re.exec(text);
      if (!m) continue;
      const idx = m.index;
      const start = Math.max(0, idx - 80);
      const end = Math.min(text.length, idx + 160);
      hits.push({
        entryId: e.id,
        type: e.type,
        title: e.title,
        excerpt: normalizeText(text.slice(start, end)),
      });
      break;
    }
  }

  return hits;
}

async function main() {
  const entries = buildEntries();

  const findings = [];

  for (const rule of RULES) {
    const positives = findMatches(entries, rule.positives);
    const negatives = findMatches(entries, rule.negatives);

    if (positives.length && negatives.length) {
      findings.push({
        id: rule.id,
        label: rule.label,
        positives,
        negatives,
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      entries: entries.length,
      contradictions: findings.length,
    },
    contradictions: findings,
  };

  await fs.mkdir(reportsDir, { recursive: true });
  await fs.writeFile(path.join(reportsDir, 'consistency-audit.json'), JSON.stringify(report, null, 2), 'utf8');

  const md = [];
  md.push('# Consistency Audit');
  md.push('');
  md.push(`Generated: ${report.generatedAt}`);
  md.push('');
  md.push(`- Entries scanned: ${report.totals.entries}`);
  md.push(`- Contradictions found: ${report.totals.contradictions}`);
  md.push('');

  if (!findings.length) {
    md.push('## Result');
    md.push('لا توجد تناقضات واضحة ضمن قواعد التدقيق الحالية.');
  } else {
    md.push('## Contradictions');
    md.push('');
    for (const c of findings) {
      md.push(`### ${c.label} (${c.id})`);
      md.push('');
      md.push('**عبارات تُفيد الإمكانية (وجدناها هنا):**');
      for (const h of c.positives.slice(0, 8)) {
        md.push(`- ${h.entryId} [${h.type}] — ${h.title}`);
        md.push(`  - ${h.excerpt}`);
      }
      if (c.positives.length > 8) md.push(`- ... و ${c.positives.length - 8} نتائج أخرى`);
      md.push('');

      md.push('**عبارات تُفيد عدم الإمكانية (وجدناها هنا):**');
      for (const h of c.negatives.slice(0, 8)) {
        md.push(`- ${h.entryId} [${h.type}] — ${h.title}`);
        md.push(`  - ${h.excerpt}`);
      }
      if (c.negatives.length > 8) md.push(`- ... و ${c.negatives.length - 8} نتائج أخرى`);
      md.push('');
    }
  }

  await fs.writeFile(path.join(reportsDir, 'consistency-audit.md'), md.join('\n'), 'utf8');

  if (findings.length) {
    console.error('Consistency audit found contradictions. See reports/consistency-audit.md');
    process.exit(1);
  }

  console.log('Consistency audit passed. See reports/consistency-audit.md');
}

main().catch((err) => {
  console.error('[audit-consistency] Fatal:', err);
  process.exit(1);
});
