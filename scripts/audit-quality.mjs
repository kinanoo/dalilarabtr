import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

function normalizeText(value) {
  if (!value) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function scoreArticle(slug, a) {
  const issues = [];
  const intro = normalizeText(a.intro);
  const details = normalizeText(a.details);
  const docs = Array.isArray(a.documents) ? a.documents : [];
  const steps = Array.isArray(a.steps) ? a.steps : [];
  const tips = Array.isArray(a.tips) ? a.tips : [];

  if (intro.length < 25) issues.push('intro-too-short');
  if (details.length < 60) issues.push('details-too-short');
  if (docs.length < 3) issues.push('documents-too-few');
  if (steps.length < 4) issues.push('steps-too-few');

  const shortSteps = steps.filter((s) => normalizeText(s).length < 12).length;
  if (shortSteps) issues.push(`steps-too-short:${shortSteps}`);

  const shortDocs = docs.filter((d) => normalizeText(d).length < 6).length;
  if (shortDocs) issues.push(`documents-too-short:${shortDocs}`);

  if (!normalizeText(a.fees)) issues.push('fees-missing');
  if (!normalizeText(a.source)) issues.push('source-missing');

  // If tips is present but empty, it is usually fine. But flag if everything is extremely short.
  const combined = [intro, details, ...docs, ...steps, ...tips].map(normalizeText).join(' ');
  if (combined.length < 220) issues.push('overall-too-short');

  return { slug, title: a.title, category: a.category, issues };
}

function scoreScenario(key, s) {
  const issues = [];
  const title = normalizeText(s.title);
  const desc = normalizeText(s.desc);
  const legal = normalizeText(s.legal);
  const steps = Array.isArray(s.steps) ? s.steps : [];
  const docs = Array.isArray(s.docs) ? s.docs : [];

  if (title.length < 10) issues.push('title-too-short');
  if (desc.length < 40) issues.push('desc-too-short');
  if (steps.length < 4) issues.push('steps-too-few');
  if (docs.length < 2) issues.push('docs-too-few');
  if (!normalizeText(s.cost)) issues.push('cost-missing');
  if (!legal) issues.push('legal-missing');

  const shortSteps = steps.filter((x) => normalizeText(x).length < 12).length;
  if (shortSteps) issues.push(`steps-too-short:${shortSteps}`);

  return { key, title: s.title, risk: s.risk, issues };
}

async function main() {
  const root = process.cwd();

  // Import TS sources via dynamic import (works in Node with transpiled TS? here they are plain TS).
  // We'll read compiled outputs by using Node's ability to import TS? Not available.
  // So we parse the source files by evaluating in a very controlled way is not safe.
  // Instead, we rely on the existing audit-content.mjs which already loads the TS via ts-node.
  // Here we do the same approach: register ts-node then import.

  let tsNode;
  try {
    tsNode = await import('ts-node');
  } catch {
    console.error('[audit-quality] Missing ts-node. Install devDependencies first.');
    process.exitCode = 1;
    return;
  }

  tsNode.register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });

  const articlesPath = path.join(root, 'src', 'lib', 'articles.ts');
  const consultantPath = path.join(root, 'src', 'lib', 'consultant-data.ts');
  const { ARTICLES } = await import(pathToFileURL(articlesPath).href);
  const { CONSULTANT_SCENARIOS } = await import(pathToFileURL(consultantPath).href);

  const articleResults = Object.entries(ARTICLES)
    .map(([slug, a]) => scoreArticle(slug, a))
    .filter((r) => r.issues.length > 0)
    .sort((a, b) => b.issues.length - a.issues.length);

  const scenarioResults = Object.entries(CONSULTANT_SCENARIOS)
    .map(([key, s]) => scoreScenario(key, s))
    .filter((r) => r.issues.length > 0)
    .sort((a, b) => b.issues.length - a.issues.length);

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      articlesFlagged: articleResults.length,
      scenariosFlagged: scenarioResults.length,
    },
    articles: articleResults,
    scenarios: scenarioResults,
  };

  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  const jsonPath = path.join(reportsDir, 'quality-audit.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');

  const mdPath = path.join(reportsDir, 'quality-audit.md');
  const mdLines = [];
  mdLines.push('# Quality Audit');
  mdLines.push('');
  mdLines.push(`Generated: ${report.generatedAt}`);
  mdLines.push('');
  mdLines.push(`- Articles flagged: ${report.summary.articlesFlagged}`);
  mdLines.push(`- Consultant scenarios flagged: ${report.summary.scenariosFlagged}`);
  mdLines.push('');

  mdLines.push('## Articles');
  if (!articleResults.length) {
    mdLines.push('- None');
  } else {
    for (const r of articleResults.slice(0, 60)) {
      mdLines.push(`- ${r.slug} — ${r.title} [${r.category}] :: ${r.issues.join(', ')}`);
    }
    if (articleResults.length > 60) mdLines.push(`- ... and ${articleResults.length - 60} more`);
  }

  mdLines.push('');
  mdLines.push('## Consultant Scenarios');
  if (!scenarioResults.length) {
    mdLines.push('- None');
  } else {
    for (const r of scenarioResults.slice(0, 80)) {
      mdLines.push(`- ${r.key} — ${r.title} (${r.risk}) :: ${r.issues.join(', ')}`);
    }
    if (scenarioResults.length > 80) mdLines.push(`- ... and ${scenarioResults.length - 80} more`);
  }

  fs.writeFileSync(mdPath, mdLines.join('\n'), 'utf8');

  console.log('[audit-quality] Done.');
  console.log(`- ${path.relative(root, mdPath)}`);
  console.log(`- ${path.relative(root, jsonPath)}`);

  // Exit code signals “needs improvement” but not failure.
  if (articleResults.length || scenarioResults.length) {
    process.exitCode = 2;
  }
}

main().catch((err) => {
  console.error('[audit-quality] Fatal:', err);
  process.exitCode = 1;
});
