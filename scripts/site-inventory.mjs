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
const { CATEGORY_SLUGS } = require('../src/lib/data.ts');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getOfficialSourceUrls } = require('../src/lib/externalLinks.ts');

const repoRoot = path.resolve(process.cwd());
const reportsDir = path.join(repoRoot, 'reports');

function parseDate(value) {
  const s = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(a, b) {
  const ms = Math.abs(a.getTime() - b.getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function groupCounts(items) {
  const m = new Map();
  for (const v of items) m.set(v, (m.get(v) || 0) + 1);
  return Array.from(m.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ key, count }));
}

async function main() {
  const now = new Date();

  const articles = Object.entries(ARTICLES).map(([id, a]) => ({
    id,
    title: a.title,
    category: a.category,
    lastUpdate: a.lastUpdate,
    hasSource: Boolean(String(a.source || '').trim()),
    officialSourceUrls: getOfficialSourceUrls(a.source),
  }));

  const categories = groupCounts(articles.map((a) => a.category || 'غير مصنف'));

  const primary = [
    { slug: 'kimlik', title: 'الكملك', categoryName: CATEGORY_SLUGS.kimlik },
    { slug: 'residence', title: 'الإقامة', categoryName: CATEGORY_SLUGS.residence },
    { slug: 'visa', title: 'الفيزا', categoryName: CATEGORY_SLUGS.visa },
    { slug: 'work', title: 'العمل', categoryName: CATEGORY_SLUGS.work },
    { slug: 'health', title: 'الصحة', categoryName: CATEGORY_SLUGS.health },
    { slug: 'education', title: 'الدراسة', categoryName: CATEGORY_SLUGS.education },
  ].filter((s) => typeof s.categoryName === 'string' && s.categoryName);

  const byPrimary = primary.map((s) => {
    const list = articles.filter((a) => a.category === s.categoryName);
    return {
      slug: s.slug,
      title: s.title,
      categoryName: s.categoryName,
      count: list.length,
      articleIds: list.map((x) => x.id),
    };
  });

  const dates = articles
    .map((a) => ({ id: a.id, date: parseDate(a.lastUpdate) }))
    .filter((x) => x.date);

  const newest = dates.length
    ? dates.reduce((best, cur) => (cur.date.getTime() > best.date.getTime() ? cur : best))
    : null;
  const oldest = dates.length
    ? dates.reduce((best, cur) => (cur.date.getTime() < best.date.getTime() ? cur : best))
    : null;

  const updatedWithin = (days) =>
    dates.filter((d) => daysBetween(now, d.date) <= days).length;

  const sources = {
    missingSourceField: articles.filter((a) => !a.hasSource).length,
    hasAnySourceText: articles.filter((a) => a.hasSource).length,
    hasOfficialSourceUrl: articles.filter((a) => a.officialSourceUrls.length > 0).length,
    hasOnlyNonOfficialOrInvalid: articles.filter((a) => a.hasSource && a.officialSourceUrls.length === 0).length,
  };

  const report = {
    generatedAt: now.toISOString(),
    totals: {
      articles: articles.length,
      uniqueCategories: categories.length,
    },
    primarySections: byPrimary,
    categories,
    freshness: {
      newest: newest ? { id: newest.id, lastUpdate: newest.date.toISOString().slice(0, 10) } : null,
      oldest: oldest ? { id: oldest.id, lastUpdate: oldest.date.toISOString().slice(0, 10) } : null,
      updatedWithinDays: {
        d7: updatedWithin(7),
        d30: updatedWithin(30),
        d90: updatedWithin(90),
      },
    },
    sources,
  };

  await fs.mkdir(reportsDir, { recursive: true });
  await fs.writeFile(path.join(reportsDir, 'site-inventory.json'), JSON.stringify(report, null, 2), 'utf8');

  const md = [];
  md.push('# Site Inventory');
  md.push('');
  md.push(`Generated: ${report.generatedAt}`);
  md.push('');
  md.push('## Totals');
  md.push('');
  md.push(`- Articles: ${report.totals.articles}`);
  md.push(`- Unique categories: ${report.totals.uniqueCategories}`);
  md.push('');
  md.push('## Primary Sections (Homepage Tiles)');
  md.push('');
  for (const s of report.primarySections) {
    md.push(`- ${s.title} — ${s.count} مقالة (category: ${s.categoryName})`);
  }
  md.push('');
  md.push('## Freshness');
  md.push('');
  md.push(`- Newest lastUpdate: ${report.freshness.newest ? `${report.freshness.newest.lastUpdate} (${report.freshness.newest.id})` : 'n/a'}`);
  md.push(`- Oldest lastUpdate: ${report.freshness.oldest ? `${report.freshness.oldest.lastUpdate} (${report.freshness.oldest.id})` : 'n/a'}`);
  md.push(`- Updated within 7 days: ${report.freshness.updatedWithinDays.d7}`);
  md.push(`- Updated within 30 days: ${report.freshness.updatedWithinDays.d30}`);
  md.push(`- Updated within 90 days: ${report.freshness.updatedWithinDays.d90}`);
  md.push('');
  md.push('## Sources');
  md.push('');
  md.push(`- Missing source field: ${report.sources.missingSourceField}`);
  md.push(`- Has any source text: ${report.sources.hasAnySourceText}`);
  md.push(`- Has official source URL: ${report.sources.hasOfficialSourceUrl}`);
  md.push(`- Has source but no official URL (filtered): ${report.sources.hasOnlyNonOfficialOrInvalid}`);
  md.push('');
  md.push('## Categories (Top)');
  md.push('');
  for (const c of report.categories.slice(0, 30)) {
    md.push(`- ${c.key} — ${c.count}`);
  }
  if (report.categories.length > 30) md.push(`- ... +${report.categories.length - 30} categories`);

  await fs.writeFile(path.join(reportsDir, 'site-inventory.md'), md.join('\n'), 'utf8');

  console.log('Inventory generated. See reports/site-inventory.md');
}

main().catch((err) => {
  console.error('[site-inventory] Fatal:', err);
  process.exit(1);
});
