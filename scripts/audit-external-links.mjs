import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const SRC_DIR = path.join(ROOT, 'src');
const REPORT_DIR = path.join(ROOT, 'reports');

const URL_REGEX = /https?:\/\/[^\s)\]}>'\"]+/g;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name.startsWith('.next') || ent.name === 'out') continue;
      files.push(...walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function safeUrl(u) {
  try {
    return new URL(u);
  } catch {
    return null;
  }
}

function isOfficialGov(urlObj) {
  const host = urlObj.hostname.toLowerCase();
  return host.endsWith('.gov.tr') || host.endsWith('.gov.sy');
}

async function checkUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    // Prefer HEAD; fallback to GET if blocked or if HEAD gives a misleading 404/405.
    let res;
    try {
      res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
      if (res.status === 404 || res.status === 405) {
        res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
      }
    } catch {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
    }

    return {
      ok: res.ok,
      status: res.status,
      finalUrl: res.url,
    };
  } catch (e) {
    return {
      ok: false,
      status: null,
      finalUrl: null,
      error: String(e?.name || e?.message || e),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const files = walk(SRC_DIR).filter((f) => /\.(ts|tsx|js|jsx|md|json)$/i.test(f));

  const occurrences = [];
  const uniqueUrls = new Map();

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const matches = text.match(URL_REGEX) || [];
    for (const raw of matches) {
      const url = raw.replace(/\\n/g, '').trim();
      const u = safeUrl(url);
      const relative = path.relative(ROOT, file).replace(/\\/g, '/');
      occurrences.push({ url, file: relative });
      if (!uniqueUrls.has(url)) {
        uniqueUrls.set(url, {
          url,
          protocol: u?.protocol ?? null,
          host: u?.hostname ?? null,
          officialGov: u ? isOfficialGov(u) : false,
          valid: Boolean(u),
          samples: [relative],
        });
      } else {
        uniqueUrls.get(url).samples.push(relative);
      }
    }
  }

  const urls = Array.from(uniqueUrls.values());

  // Check network reachability only for official URLs (fast + aligns with your policy)
  const toCheck = urls.filter((u) => u.valid && u.officialGov).map((u) => u.url);
  const results = {};
  for (const url of toCheck) {
    // Sequential to avoid getting rate-limited.
    // eslint-disable-next-line no-await-in-loop
    results[url] = await checkUrl(url);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      occurrences: occurrences.length,
      unique: urls.length,
      officialGov: urls.filter((u) => u.officialGov).length,
      nonOfficial: urls.filter((u) => u.valid && !u.officialGov).length,
      invalid: urls.filter((u) => !u.valid).length,
    },
    urls: urls
      .map((u) => ({
        ...u,
        check: results[u.url] ?? null,
      }))
      .sort((a, b) => (a.host || '').localeCompare(b.host || '') || a.url.localeCompare(b.url)),
  };

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORT_DIR, 'external-links-audit.json'), JSON.stringify(report, null, 2));

  const lines = [];
  lines.push(`# External Links Audit`);
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push(`- Occurrences: ${report.totals.occurrences}`);
  lines.push(`- Unique URLs: ${report.totals.unique}`);
  lines.push(`- Official (gov.*): ${report.totals.officialGov}`);
  lines.push(`- Non-official: ${report.totals.nonOfficial}`);
  lines.push(`- Invalid: ${report.totals.invalid}`);
  lines.push('');

  const badOfficial = report.urls.filter((u) => u.officialGov && u.check && u.check.ok === false);
  if (badOfficial.length) {
    lines.push('## Official links that failed to fetch');
    for (const item of badOfficial) {
      lines.push(`- ${item.url} (status: ${item.check.status ?? 'n/a'}${item.check.error ? `, error: ${item.check.error}` : ''})`);
    }
    lines.push('');
  } else {
    lines.push('## Official links that failed to fetch');
    lines.push('- None (based on this machine/network).');
    lines.push('');
  }

  const nonOfficial = report.urls.filter((u) => u.valid && !u.officialGov);
  lines.push('## Non-official URLs found in code (not checked)');
  if (!nonOfficial.length) {
    lines.push('- None');
  } else {
    for (const item of nonOfficial.slice(0, 80)) {
      lines.push(`- ${item.url}`);
    }
    if (nonOfficial.length > 80) {
      lines.push(`- …and ${nonOfficial.length - 80} more`);
    }
  }

  fs.writeFileSync(path.join(REPORT_DIR, 'external-links-audit.md'), lines.join('\n'));

  // Console summary
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(report.totals, null, 2));
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
