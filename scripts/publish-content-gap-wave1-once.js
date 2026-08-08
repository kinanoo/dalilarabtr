/**
 * One-time publisher for sql/2026-08-08_content-gap-wave1.sql.
 *
 * Cloudflare Builds has the Supabase service key; local development does not.
 * The SQL file remains the auditable source of truth, while this adapter applies
 * the same payload through PostgREST during the production build. The batch is
 * idempotent and stops touching content after every target has landed once.
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.pulled', override: true });

const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_DATE = '2026-08-08';
const SQL_PATH = path.join(__dirname, '..', 'sql', '2026-08-08_content-gap-wave1.sql');

const UPDATED_SLUGS = [
  'identity-kimlik-iptal-v160',
  'vergi-numarasi-tax-number-foreigners',
  'gss-premium-2026-foreigners-syrians',
  'syria-temporary-protection-health-2026',
];
const NEW_SLUGS = [
  'tourist-residence-first-application-turkey-2026',
  'high-school-equivalency-turkey-2026',
];
const RETIRED_SLUGS = [
  'tenant-rights-rent-increase-cap',
  'rent-contract-tenant-rights-turkey-2026',
];

function stripDisabledSql(sql) {
  return sql.replace(/\/\*[\s\S]*?\*\//g, '');
}

function splitTopLevel(input) {
  const parts = [];
  let start = 0;
  let quote = false;
  let dollarTag = null;
  let squareDepth = 0;
  let parenDepth = 0;

  for (let i = 0; i < input.length; i += 1) {
    if (dollarTag) {
      if (input.startsWith(dollarTag, i)) {
        i += dollarTag.length - 1;
        dollarTag = null;
      }
      continue;
    }

    if (quote) {
      if (input[i] === "'" && input[i + 1] === "'") {
        i += 1;
      } else if (input[i] === "'") {
        quote = false;
      }
      continue;
    }

    if (input[i] === "'") {
      quote = true;
      continue;
    }

    if (input[i] === '$') {
      const tag = input.slice(i).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$/)?.[0];
      if (tag) {
        dollarTag = tag;
        i += tag.length - 1;
        continue;
      }
    }

    if (input[i] === '[') squareDepth += 1;
    if (input[i] === ']') squareDepth -= 1;
    if (input[i] === '(') parenDepth += 1;
    if (input[i] === ')') parenDepth -= 1;

    if (input[i] === ',' && squareDepth === 0 && parenDepth === 0) {
      parts.push(input.slice(start, i).trim());
      start = i + 1;
    }
  }

  parts.push(input.slice(start).trim());
  return parts.filter(Boolean);
}

function decodeSqlString(value) {
  if (!value.startsWith("'") || !value.endsWith("'")) {
    throw new Error(`Unsupported SQL string: ${value.slice(0, 60)}`);
  }
  return value.slice(1, -1).replace(/''/g, "'");
}

function parseSqlValue(rawValue) {
  const value = rawValue.trim();

  const dollar = value.match(/^(\$[A-Za-z_][A-Za-z0-9_]*\$)([\s\S]*)\1$/);
  if (dollar) return dollar[2].trim();

  if (/^ARRAY\[/i.test(value) && /\]::text\[\]$/i.test(value)) {
    const body = value.replace(/^ARRAY\[/i, '').replace(/\]::text\[\]$/i, '');
    return splitTopLevel(body).map(decodeSqlString);
  }

  if (value.startsWith("'")) return decodeSqlString(value);
  if (/^true$/i.test(value)) return true;
  if (/^false$/i.test(value)) return false;
  if (/^CURRENT_DATE$/i.test(value)) return BATCH_DATE;

  throw new Error(`Unsupported SQL value: ${value.slice(0, 80)}`);
}

function parseAssignments(body) {
  return Object.fromEntries(
    splitTopLevel(body).map((assignment) => {
      const match = assignment.match(/^([a-z_]+)\s*=\s*([\s\S]+)$/i);
      if (!match) throw new Error(`Could not parse assignment: ${assignment.slice(0, 80)}`);
      return [match[1], parseSqlValue(match[2])];
    }),
  );
}

function parseUpdatePayloads(sql) {
  const payloads = new Map();
  const updatePattern = /UPDATE articles SET\s+([\s\S]*?)\s+WHERE slug = '([^']+)';/g;
  let match;
  while ((match = updatePattern.exec(sql)) !== null) {
    if (UPDATED_SLUGS.includes(match[2])) {
      payloads.set(match[2], parseAssignments(match[1]));
    }
  }

  for (const slug of UPDATED_SLUGS) {
    if (!payloads.has(slug)) throw new Error(`SQL payload missing for ${slug}`);
  }
  return payloads;
}

function parseNewPayloads(sql) {
  const marker = 'INSERT INTO wave1_new_articles VALUES';
  const start = sql.indexOf(marker);
  const end = sql.indexOf('INSERT INTO articles (', start);
  if (start < 0 || end < 0) throw new Error('Could not find new-article values in SQL');

  const valuesBody = sql.slice(start + marker.length, end).trim().replace(/;$/, '');
  const tuples = splitTopLevel(valuesBody);
  const columns = [
    'id', 'slug', 'title', 'category', 'intro', 'details', 'documents', 'steps',
    'tips', 'warning', 'source', 'seo_title', 'seo_description', 'seo_keywords', 'tags',
  ];

  const payloads = new Map();
  for (const tuple of tuples) {
    if (!tuple.startsWith('(') || !tuple.endsWith(')')) {
      throw new Error(`Invalid new-article tuple: ${tuple.slice(0, 50)}`);
    }
    const values = splitTopLevel(tuple.slice(1, -1));
    if (values.length !== columns.length) {
      throw new Error(`Expected ${columns.length} values, found ${values.length}`);
    }
    const payload = Object.fromEntries(columns.map((column, index) => [column, parseSqlValue(values[index])]));
    payload.status = 'approved';
    payload.active = true;
    payload.published_at = BATCH_DATE;
    payload.last_update = BATCH_DATE;
    payloads.set(payload.slug, payload);
  }

  for (const slug of NEW_SLUGS) {
    if (!payloads.has(slug)) throw new Error(`New SQL payload missing for ${slug}`);
  }
  return payloads;
}

function dateAtLeast(value, minimum) {
  return typeof value === 'string' && value.slice(0, 10) >= minimum;
}

async function main() {
  const sql = stripDisabledSql(fs.readFileSync(SQL_PATH, 'utf8'));
  const updatePayloads = parseUpdatePayloads(sql);
  const newPayloads = parseNewPayloads(sql);

  if (process.argv.includes('--validate')) {
    const visibleLengths = [...updatePayloads.values(), ...newPayloads.values()].map((payload) =>
      String(payload.details || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length,
    );
    if (visibleLengths.some((length) => length < 1500)) {
      throw new Error(`A parsed article is under 1,500 visible characters: ${visibleLengths.join(', ')}`);
    }
    console.log(`[gap-wave1] SQL adapter valid: ${updatePayloads.size} rebuilds, ${newPayloads.size} new guides.`);
    return;
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.log('[gap-wave1] Missing Supabase service env; skipping one-time content publish.');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const allSlugs = [...UPDATED_SLUGS, ...NEW_SLUGS, ...RETIRED_SLUGS];
  const { data: currentRows, error: readError } = await supabase
    .from('articles')
    .select('id,slug,status,active,last_update')
    .in('slug', allSlugs);
  if (readError) throw readError;

  const bySlug = new Map((currentRows || []).map((row) => [row.slug, row]));
  const alreadyComplete =
    UPDATED_SLUGS.every((slug) => {
      const row = bySlug.get(slug);
      return row?.status === 'approved' && row.active === true && dateAtLeast(row.last_update, BATCH_DATE);
    }) &&
    NEW_SLUGS.every((slug) => {
      const row = bySlug.get(slug);
      return row?.id === slug && row.status === 'approved' && row.active === true;
    }) &&
    RETIRED_SLUGS.every((slug) => bySlug.get(slug)?.status === 'draft');

  if (alreadyComplete) {
    console.log('[gap-wave1] Content batch already complete; leaving later admin edits untouched.');
    return;
  }

  for (const slug of UPDATED_SLUGS) {
    if (!bySlug.has(slug)) throw new Error(`Required live article is missing: ${slug}`);
    const { data, error } = await supabase
      .from('articles')
      .update(updatePayloads.get(slug))
      .eq('slug', slug)
      .select('slug');
    if (error) throw error;
    if (data?.length !== 1) throw new Error(`Expected one updated row for ${slug}, found ${data?.length || 0}`);
  }

  for (const slug of NEW_SLUGS) {
    const payload = newPayloads.get(slug);
    const { data: collisions, error: collisionError } = await supabase
      .from('articles')
      .select('id,slug')
      .or(`id.eq.${slug},slug.eq.${slug}`);
    if (collisionError) throw collisionError;

    if (collisions?.length) {
      if (collisions.length !== 1 || collisions[0].id !== slug || collisions[0].slug !== slug) {
        throw new Error(`id/slug collision blocks safe publish for ${slug}`);
      }
      const { data, error } = await supabase
        .from('articles')
        .update(payload)
        .eq('id', slug)
        .eq('slug', slug)
        .select('slug');
      if (error) throw error;
      if (data?.length !== 1) throw new Error(`Expected one refreshed row for ${slug}`);
    } else {
      const { data, error } = await supabase.from('articles').insert(payload).select('slug');
      if (error) throw error;
      if (data?.length !== 1) throw new Error(`Expected one inserted row for ${slug}`);
    }
  }

  const { data: retired, error: retireError } = await supabase
    .from('articles')
    .update({ status: 'draft', last_update: BATCH_DATE })
    .in('slug', RETIRED_SLUGS)
    .select('slug,status');
  if (retireError) throw retireError;
  if (retired?.length !== RETIRED_SLUGS.length) {
    throw new Error(`Expected ${RETIRED_SLUGS.length} retired rows, found ${retired?.length || 0}`);
  }

  const { data: verified, error: verifyError } = await supabase
    .from('articles')
    .select('id,slug,status,active,last_update,details')
    .in('slug', allSlugs);
  if (verifyError) throw verifyError;

  const verifiedBySlug = new Map((verified || []).map((row) => [row.slug, row]));
  for (const slug of [...UPDATED_SLUGS, ...NEW_SLUGS]) {
    const row = verifiedBySlug.get(slug);
    const visibleLength = String(row?.details || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;
    if (!row || row.status !== 'approved' || row.active !== true || visibleLength < 1500) {
      throw new Error(`Verification failed for ${slug} (visible chars: ${visibleLength})`);
    }
  }
  for (const slug of RETIRED_SLUGS) {
    if (verifiedBySlug.get(slug)?.status !== 'draft') throw new Error(`Retirement verification failed for ${slug}`);
  }

  console.log('[gap-wave1] Published 4 rebuilds, 2 new guides, and retired 2 competing rent pages.');
}

main().catch((error) => {
  console.error('[gap-wave1] Publish failed:', error?.message || error);
  process.exitCode = 1;
});
