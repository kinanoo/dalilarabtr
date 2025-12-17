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
    target: 'ES2019'
  }
});

/** @type {{ ARTICLES: Record<string, any> }} */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ARTICLES } = require('../src/lib/articles.ts');

const repoRoot = path.resolve(process.cwd());
const reportsDir = path.join(repoRoot, 'reports');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidHttpUrl(value) {
  if (!isNonEmptyString(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function hasPlaceholderText(value) {
  if (!isNonEmptyString(value)) return false;
  return value.includes('...') || value.includes('…') || /قريباً|قريبا|سيتم\s+إضافة|قيد\s+الإضافة/.test(value);
}

const normalizedToSlugs = new Map();
const keyWhitespace = [];

for (const slug of Object.keys(ARTICLES)) {
  const normalized = slug.trim().toLowerCase();
  const group = normalizedToSlugs.get(normalized) ?? [];
  group.push(slug);
  normalizedToSlugs.set(normalized, group);

  if (slug.trim() !== slug) {
    keyWhitespace.push({ slug, normalized });
  }
}

const normalizedDuplicates = [];
for (const [normalized, slugs] of normalizedToSlugs.entries()) {
  if (slugs.length > 1) {
    normalizedDuplicates.push({ normalized, slugs });
  }
}

const missingRequired = [];
const emptyArrays = [];
const placeholderFields = [];
const sourceIssues = [];

for (const [slug, article] of Object.entries(ARTICLES)) {
  const missing = [];
  for (const field of ['title', 'category', 'lastUpdate', 'intro', 'details', 'fees']) {
    if (!isNonEmptyString(article?.[field])) missing.push(field);
  }
  if (missing.length > 0) missingRequired.push({ slug, missing });

  const empties = [];
  for (const field of ['documents', 'steps']) {
    const v = article?.[field];
    if (!Array.isArray(v) || v.length === 0) empties.push(field);
  }
  if (empties.length > 0) emptyArrays.push({ slug, empties });

  const placeholders = [];
  for (const field of ['intro', 'details', 'fees']) {
    if (hasPlaceholderText(article?.[field])) placeholders.push(field);
  }
  if (placeholders.length > 0) placeholderFields.push({ slug, placeholders });

  const source = article?.source;
  if (source === undefined || source === null || source === '') {
    sourceIssues.push({ slug, issue: 'missing' });
  } else if (!isValidHttpUrl(source)) {
    sourceIssues.push({ slug, issue: 'invalid', value: String(source) });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    articles: Object.keys(ARTICLES).length,
    keyWhitespace: keyWhitespace.length,
    normalizedDuplicates: normalizedDuplicates.length,
    missingRequired: missingRequired.length,
    emptyArrays: emptyArrays.length,
    placeholderFields: placeholderFields.length,
    sourceIssues: sourceIssues.length
  },
  keyWhitespace,
  normalizedDuplicates,
  missingRequired,
  emptyArrays,
  placeholderFields,
  sourceIssues
};

function mdList(items, render) {
  if (items.length === 0) return 'لا يوجد.';
  return items.map((item) => `- ${render(item)}`).join('\n');
}

const md = `# Content Audit Report\n\nGenerated: ${report.generatedAt}\n\n## Summary\n\n- Articles: ${report.totals.articles}\n- Slugs with leading/trailing whitespace: ${report.totals.keyWhitespace}\n- Duplicate slugs (case/trim normalized): ${report.totals.normalizedDuplicates}\n- Missing required fields (title/category/lastUpdate/intro/details/fees): ${report.totals.missingRequired}\n- Empty required arrays (documents/steps): ${report.totals.emptyArrays}\n- Placeholder-like text (intro/details/fees): ${report.totals.placeholderFields}\n- Source issues (missing/invalid): ${report.totals.sourceIssues}\n\n## Slug Whitespace\n\n${mdList(report.keyWhitespace, (x) => `${x.slug} (normalized: ${x.normalized})`)}\n\n## Normalized Duplicate Slugs\n\n${mdList(report.normalizedDuplicates, (x) => `${x.normalized} => ${x.slugs.join(', ')}`)}\n\n## Missing Required Fields\n\n${mdList(report.missingRequired, (x) => `${x.slug}: ${x.missing.join(', ')}`)}\n\n## Empty documents/steps\n\n${mdList(report.emptyArrays, (x) => `${x.slug}: ${x.empties.join(', ')}`)}\n\n## Placeholder-like Fields\n\n${mdList(report.placeholderFields, (x) => `${x.slug}: ${x.placeholders.join(', ')}`)}\n\n## Source Issues\n\n${mdList(report.sourceIssues, (x) => (x.issue === 'missing' ? `${x.slug}: missing` : `${x.slug}: invalid (${x.value})`))}\n`;

await fs.mkdir(reportsDir, { recursive: true });
await Promise.all([
  fs.writeFile(path.join(reportsDir, 'content-audit.json'), JSON.stringify(report, null, 2), 'utf8'),
  fs.writeFile(path.join(reportsDir, 'content-audit.md'), md, 'utf8')
]);

const hasCriticalIssues =
  report.totals.keyWhitespace > 0 ||
  report.totals.normalizedDuplicates > 0 ||
  report.totals.missingRequired > 0;

if (hasCriticalIssues) {
  // eslint-disable-next-line no-console
  console.error('Content audit found critical issues. See reports/content-audit.md');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('Content audit passed. See reports/content-audit.md');
