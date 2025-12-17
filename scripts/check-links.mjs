/*
  Link checker for the site (no external deps).

  What it checks:
  - Exported build mode (recommended for this repo): scan `out/` HTML files and
    verify that internal links point to existing exported files.
  - Server mode (optional): crawl pages over HTTP.
  - External links: HEAD (fallback GET) should return 2xx/3xx.
  - Anchors missing href: <a ...> without href attribute.

  Usage:
    # Recommended for this repo (next.config.ts uses output: export)
    node scripts/check-links.mjs --outDir out

    # Optional (requires a server):
    node scripts/check-links.mjs --base http://localhost:3000
*/

import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const DEFAULT_BASE = 'http://localhost:3000';

function walkFiles(rootDir) {
  const results = [];
  const stack = [rootDir];
  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else {
        results.push(full);
      }
    }
  }
  return results;
}

function outFileCandidatesForPath(outDir, pathname) {
  if (pathname === '/') return [path.join(outDir, 'index.html')];

  // handle explicit files like /sitemap.xml or /robots.txt
  if (pathname.endsWith('.xml') || pathname.endsWith('.txt') || pathname.endsWith('.json') || pathname.endsWith('.ico')) {
    return [path.join(outDir, pathname.replace(/^\//, ''))];
  }

  const rel = pathname.replace(/^\//, '');
  // Next export may generate both /route.html and /route/index.html (and for dynamic routes too).
  return [
    path.join(outDir, `${rel}.html`),
    path.join(outDir, rel, 'index.html'),
  ];
}

function outFileExists(outDir, pathname) {
  const candidates = outFileCandidatesForPath(outDir, pathname);
  for (const c of candidates) {
    if (fs.existsSync(c)) return { exists: true, filePath: c };
  }
  return { exists: false, filePath: candidates[0] };
}

function normalizeOutPathnameFromFile(outDir, filePath) {
  const rel = path.relative(outDir, filePath).replaceAll('\\', '/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) {
    return '/' + rel.slice(0, -'/index.html'.length);
  }
  // Next export can emit flat `route.html` files (e.g. `contact.html`).
  // Treat them as the route pathname so links like `/contact` map correctly.
  if (rel.endsWith('.html')) {
    const base = rel.slice(0, -'.html'.length);
    return '/' + base;
  }
  // Non-HTML files are not pages.
  return null;
}

function parseArgs(argv) {
  const args = new Map();
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
    args.set(key.slice(2), value);
  }
  return args;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, redirect: 'follow' });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function probeWithCurl(url) {
  const nullDevice = process.platform === 'win32' ? 'NUL' : '/dev/null';
  try {
    const { stdout } = await execFileAsync('curl', [
      '-L',
      '-I',
      '-m',
      '20',
      '-s',
      '-o',
      nullDevice,
      '-w',
      '%{http_code}',
      url,
    ]);
    const trimmed = String(stdout || '').trim();
    const status = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(status) || status <= 0) return null;
    return status;
  } catch {
    return null;
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function decodeHtmlEntities(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function normalizeInternalPath(href) {
  // Drop hash and query to avoid duplicates; keep path.
  const noHash = href.split('#')[0] || '';
  const noQuery = noHash.split('?')[0] || '';
  if (!noQuery) return null;
  if (!noQuery.startsWith('/')) return null;
  // Ignore Next static assets
  if (noQuery.startsWith('/_next/') || noQuery.startsWith('/__next.')) return null;
  return noQuery;
}

function isSkippableHref(href) {
  if (!href) return true;
  const trimmed = href.trim();
  if (!trimmed) return true;
  if (trimmed === '#') return true;
  if (trimmed.startsWith('#')) return true;
  if (trimmed.startsWith('javascript:')) return true;
  if (trimmed.startsWith('mailto:')) return true;
  if (trimmed.startsWith('tel:')) return true;
  return false;
}

function extractLinksFromHtml(html) {
  const internal = new Set();
  const external = new Set();

  // <a ...> without href
  const missingHrefAnchors = (html.match(/<a\b(?![^>]*\bhref\s*=)[^>]*>/gi) || []).length;

  const hrefRegex = /\bhref\s*=\s*("([^"]*)"|'([^']*)')/gi;
  let match;
  while ((match = hrefRegex.exec(html)) !== null) {
    const raw = match[2] ?? match[3] ?? '';
    const href = decodeHtmlEntities(raw).trim();
    if (isSkippableHref(href)) continue;

    if (href.startsWith('/')) {
      const normalized = normalizeInternalPath(href);
      if (normalized) internal.add(normalized);
      continue;
    }

    if (href.startsWith('http://') || href.startsWith('https://')) {
      external.add(href);
      continue;
    }

    // Protocol-relative
    if (href.startsWith('//')) {
      external.add(`https:${href}`);
      continue;
    }
  }

  return { internal, external, missingHrefAnchors };
}

async function waitForServer(baseUrl, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetchWithTimeout(baseUrl, { method: 'GET' }, 3000);
      if (res.ok) return;
    } catch {
      // ignore
    }
    await sleep(400);
  }
  throw new Error(`Server not responding at ${baseUrl} after ${timeoutMs}ms`);
}

async function fetchSitemapUrls(baseUrl) {
  const url = new URL('/sitemap.xml', baseUrl).toString();
  const res = await fetchWithTimeout(url, { method: 'GET' }, 15000);
  if (!res.ok) {
    return { urls: [], error: `Failed to fetch sitemap.xml: ${res.status} ${res.statusText}` };
  }
  const xml = await res.text();
  const locRegex = /<loc>([^<]+)<\/loc>/g;
  const urls = [];
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    const loc = match[1].trim();
    try {
      const u = new URL(loc);
      // keep only same-origin paths; normalize to path
      if (u.origin === new URL(baseUrl).origin) urls.push(u.pathname);
    } catch {
      // ignore
    }
  }
  return { urls: Array.from(new Set(urls)).sort(), error: null };
}

async function mapLimit(items, limit, iterator) {
  const results = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (true) {
      const myIdx = idx++;
      if (myIdx >= items.length) return;
      results[myIdx] = await iterator(items[myIdx], myIdx);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function checkInternalPage(baseUrl, pathname) {
  const url = new URL(pathname, baseUrl).toString();
  try {
    const res = await fetchWithTimeout(url, { method: 'GET' }, 20000);
    const status = res.status;
    const ok = status >= 200 && status < 400;
    const contentType = res.headers.get('content-type') || '';
    const html = contentType.includes('text/html') ? await res.text() : '';
    return { url, pathname, ok, status, html };
  } catch (error) {
    return { url, pathname, ok: false, status: 0, html: '', error: String(error?.message || error) };
  }
}

async function checkExternalUrl(url) {
  try {
    const head = await fetchWithTimeout(url, { method: 'HEAD' }, 15000);
    const blockedStatuses = new Set([401, 403, 429]);
    if (head.status >= 200 && head.status < 400) return { url, ok: true, status: head.status, method: 'HEAD' };
    if (blockedStatuses.has(head.status)) {
      return { url, ok: true, blocked: true, status: head.status, method: 'HEAD' };
    }

    // Some servers block HEAD; try GET.
    const get = await fetchWithTimeout(url, { method: 'GET' }, 20000);
    const ok = get.status >= 200 && get.status < 400;
    if (ok) return { url, ok: true, status: get.status, method: 'GET' };
    if (blockedStatuses.has(get.status)) {
      return { url, ok: true, blocked: true, status: get.status, method: 'GET' };
    }
    return { url, ok: false, status: get.status, method: 'GET' };
  } catch (error) {
    const blockedStatuses = new Set([401, 403, 429]);
    const curlStatus = await probeWithCurl(url);
    if (curlStatus != null) {
      if (curlStatus >= 200 && curlStatus < 400) return { url, ok: true, status: curlStatus, method: 'curl' };
      if (blockedStatuses.has(curlStatus)) return { url, ok: true, blocked: true, status: curlStatus, method: 'curl' };
      return { url, ok: false, status: curlStatus, method: 'curl' };
    }
    return { url, ok: false, status: 0, method: 'HEAD/GET', error: String(error?.message || error) };
  }
}

function writeReport(reportDir, report) {
  ensureDir(reportDir);
  const jsonPath = path.join(reportDir, 'link-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');

  const mdPath = path.join(reportDir, 'link-report.md');
  const lines = [];
  lines.push(`# Link Report`);
  lines.push('');
  lines.push(`Base: ${report.baseUrl}`);
  lines.push(`Checked pages: ${report.summary.pagesChecked}`);
  lines.push(`Broken internal: ${report.summary.brokenInternal}`);
  lines.push(`Broken external: ${report.summary.brokenExternal}`);
  if (typeof report.summary.blockedExternal === 'number') {
    lines.push(`Blocked external (reachable but blocks automated checks): ${report.summary.blockedExternal}`);
  }
  lines.push(`Anchors missing href (total across pages): ${report.summary.anchorsMissingHref}`);
  lines.push('');

  if (report.sitemapError) {
    lines.push(`## Sitemap`);
    lines.push(`- Error: ${report.sitemapError}`);
    lines.push('');
  }

  if (report.brokenInternal.length) {
    lines.push('## Broken Internal');
    for (const item of report.brokenInternal) {
      lines.push(`- ${item.pathname} -> ${item.status}${item.error ? ` (${item.error})` : ''}`);
    }
    lines.push('');
  }

  if (report.brokenExternal.length) {
    lines.push('## Broken External');
    for (const item of report.brokenExternal) {
      lines.push(`- ${item.url} -> ${item.status} via ${item.method}${item.error ? ` (${item.error})` : ''}`);
    }
    lines.push('');
  }

  if (report.blockedExternal && report.blockedExternal.length) {
    lines.push('## Blocked External (401/403/429)');
    for (const item of report.blockedExternal) {
      lines.push(`- ${item.url} -> ${item.status} via ${item.method}`);
    }
    lines.push('');
  }

  if (report.pagesWithMissingHrefAnchors.length) {
    lines.push('## Pages With <a> Missing href');
    for (const item of report.pagesWithMissingHrefAnchors) {
      lines.push(`- ${item.pathname}: ${item.count}`);
    }
    lines.push('');
  }

  fs.writeFileSync(mdPath, lines.join('\n'), 'utf8');
  return { jsonPath, mdPath };
}

async function main() {
  const args = parseArgs(process.argv);
  const outDirArg = args.get('outDir');
  const baseUrl = (args.get('base') || DEFAULT_BASE).replace(/\/$/, '');
  const maxPages = Number(args.get('maxPages') || '400');
  const internalConcurrency = Number(args.get('internalConcurrency') || '8');
  const externalConcurrency = Number(args.get('externalConcurrency') || '10');

  const outDir = outDirArg ? path.resolve(process.cwd(), outDirArg) : null;

  if (outDir && !fs.existsSync(outDir)) {
    throw new Error(`outDir not found: ${outDir}`);
  }

  const internalFound = new Set();
  const externalFound = new Set();
  let anchorsMissingHrefTotal = 0;
  const pagesWithMissingHrefAnchors = [];

  let sitemapError = null;
  let visitedCount = 0;
  const pageResults = [];
  let brokenInternal = [];

  if (outDir) {
    console.log(`[check-links] Scanning exported files: ${outDir}`);
    const files = walkFiles(outDir);
    const htmlFiles = files.filter((f) => f.endsWith('.html'));
    visitedCount = 0;

    for (const filePath of htmlFiles) {
      const pagePathname = normalizeOutPathnameFromFile(outDir, filePath);
      if (!pagePathname) continue;
      visitedCount += 1;
      const html = fs.readFileSync(filePath, 'utf8');
      const { internal, external, missingHrefAnchors } = extractLinksFromHtml(html);
      anchorsMissingHrefTotal += missingHrefAnchors;
      if (missingHrefAnchors > 0) pagesWithMissingHrefAnchors.push({ pathname: pagePathname, count: missingHrefAnchors });
      for (const p of internal) internalFound.add(p);
      for (const u of external) externalFound.add(u);
      pageResults.push({ pathname: pagePathname, status: 200, ok: true });
    }

    console.log(`[check-links] Checking internal link targets against outDir (unique): ${internalFound.size}`);
    brokenInternal = Array.from(internalFound)
      .sort()
      .map((p) => {
        const resolved = outFileExists(outDir, p);
        return { pathname: p, ok: resolved.exists, filePath: resolved.filePath };
      })
      .filter((r) => !r.ok)
      .map((r) => ({ pathname: r.pathname, status: 0, error: `Not found in export: ${path.relative(process.cwd(), r.filePath)}` }));
  } else {
    console.log(`[check-links] Waiting for server: ${baseUrl}`);
    await waitForServer(baseUrl, 60000);

    const { urls: sitemapPaths, error } = await fetchSitemapUrls(baseUrl);
    sitemapError = error;
    const seed = new Set(['/']);
    for (const p of sitemapPaths) seed.add(p);

    const visited = new Set();
    const toVisit = Array.from(seed);

    console.log(`[check-links] Seed pages: ${toVisit.length} (from sitemap + '/')`);

    while (toVisit.length && visited.size < maxPages) {
      const batch = [];
      while (batch.length < internalConcurrency && toVisit.length) {
        const p = toVisit.shift();
        if (!p) continue;
        if (visited.has(p)) continue;
        visited.add(p);
        batch.push(p);
      }
      if (!batch.length) break;

      const results = await mapLimit(batch, internalConcurrency, async (pathname) => checkInternalPage(baseUrl, pathname));
      for (const r of results) {
        pageResults.push({ pathname: r.pathname, status: r.status, ok: r.ok, error: r.error });
        if (!r.ok) continue;

        if (r.html) {
          const { internal, external, missingHrefAnchors } = extractLinksFromHtml(r.html);
          anchorsMissingHrefTotal += missingHrefAnchors;
          if (missingHrefAnchors > 0) pagesWithMissingHrefAnchors.push({ pathname: r.pathname, count: missingHrefAnchors });

          for (const p of internal) {
            internalFound.add(p);
            if (!visited.has(p)) toVisit.push(p);
          }
          for (const u of external) externalFound.add(u);
        }
      }

      process.stdout.write(`\r[check-links] Visited: ${visited.size} | Queue: ${toVisit.length} | External: ${externalFound.size}       `);
    }
    process.stdout.write('\n');

    console.log(`[check-links] Checking internal link targets (unique): ${internalFound.size}`);
    const internalTargets = Array.from(internalFound).sort();
    const internalChecks = await mapLimit(internalTargets, internalConcurrency, async (pathname) => checkInternalPage(baseUrl, pathname));
    brokenInternal = internalChecks
      .filter((r) => !r.ok)
      .map((r) => ({ pathname: r.pathname, status: r.status, error: r.error }));

    visitedCount = visited.size;
  }

  console.log(`[check-links] Checking external links (unique): ${externalFound.size}`);
  const externalTargets = Array.from(externalFound).sort();
  const externalChecks = await mapLimit(externalTargets, externalConcurrency, async (u) => checkExternalUrl(u));
  const brokenExternal = externalChecks.filter((r) => !r.ok);
  const blockedExternal = externalChecks.filter((r) => r && r.blocked);

  const report = {
    baseUrl: outDir ? null : baseUrl,
    outDir: outDir ? path.relative(process.cwd(), outDir) : null,
    generatedAt: new Date().toISOString(),
    sitemapError,
    summary: {
      pagesChecked: visitedCount,
      internalLinksFound: internalFound.size,
      externalLinksFound: externalFound.size,
      brokenInternal: brokenInternal.length,
      brokenExternal: brokenExternal.length,
      blockedExternal: blockedExternal.length,
      anchorsMissingHref: anchorsMissingHrefTotal,
    },
    brokenInternal,
    brokenExternal,
    blockedExternal,
    pagesWithMissingHrefAnchors: pagesWithMissingHrefAnchors.sort((a, b) => b.count - a.count),
    pageStatuses: pageResults,
  };

  const out = writeReport(path.join(process.cwd(), 'reports'), report);
  console.log(`[check-links] Done. Reports:`);
  console.log(`- ${out.mdPath}`);
  console.log(`- ${out.jsonPath}`);

  if (brokenInternal.length || brokenExternal.length || anchorsMissingHrefTotal) {
    process.exitCode = 2;
  }
}

main().catch((err) => {
  console.error('[check-links] Fatal:', err);
  process.exitCode = 1;
});
