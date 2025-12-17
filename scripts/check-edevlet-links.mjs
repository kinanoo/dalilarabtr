import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const filePath = path.join(repoRoot, 'src', 'lib', 'articles', 'edevlet.ts');
const baseUrl = 'https://www.turkiye.gov.tr';

const text = fs.readFileSync(filePath, 'utf8');
const re = /path:\s*'([^']+)'/g;
const paths = [];
let m;
while ((m = re.exec(text))) paths.push(m[1]);
const uniquePaths = [...new Set(paths)];

function looksLikeNotFoundHtml(html) {
  const hay = html.toLowerCase();
  return (
    hay.includes('aradığınız sayfaya ulaşılamıyor') ||
    hay.includes('sayfa bulunamadı') ||
    hay.includes('404') ||
    hay.includes('not found')
  );
}

async function checkOne(p) {
  const url = baseUrl + p;
  try {
    const res = await fetch(url, { redirect: 'manual' });
    const status = res.status;
    const location = res.headers.get('location');

    let looksMissing = false;
    if (status === 200) {
      const body = await res.text();
      looksMissing = looksLikeNotFoundHtml(body);
    }

    return { p, url, status, location, looksMissing };
  } catch (e) {
    return { p, url, status: 'ERR', error: String(e) };
  }
}

async function main() {
  console.log(`Found ${uniquePaths.length} e-Devlet paths in edevlet.ts`);

  const results = [];
  const concurrency = 6;
  let idx = 0;

  async function worker() {
    while (idx < uniquePaths.length) {
      const p = uniquePaths[idx++];
      const r = await checkOne(p);
      results.push(r);
      process.stdout.write('.');
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  console.log('\nDone.');

  const bad = results.filter((r) => r.status === 404 || r.status === 410 || r.looksMissing);
  const errors = results.filter((r) => r.status === 'ERR' || (typeof r.status === 'number' && r.status >= 500));

  console.log(`Bad (404/410/looksMissing): ${bad.length}`);
  for (const r of bad) {
    console.log(`${r.status}\t${r.p}\t${r.location ? '-> ' + r.location : ''}${r.looksMissing ? ' [looksMissing]' : ''}`);
  }

  console.log(`Errors/5xx: ${errors.length}`);
  for (const r of errors) {
    console.log(`${r.status}\t${r.p}\t${r.error ?? ''}`);
  }
}

await main();
