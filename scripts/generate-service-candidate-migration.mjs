import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.resolve(
  root,
  process.argv[2] ??
    'data/service-directory/batches/2026-07-priority-01.json',
);
const outputPath = path.resolve(
  root,
  process.argv[3] ??
    'supabase/migrations/202607270003_stage_service_candidates_priority_01.sql',
);

const batch = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const missingArabEvidence = batch.candidates.filter(
  (candidate) =>
    candidate.arab_provider_confirmed !== true ||
    String(candidate.arab_provider_evidence || '').trim().length < 10,
);
if (missingArabEvidence.length > 0) {
  throw new Error(
    `Arab provider evidence is required for every candidate: ${missingArabEvidence
      .map((candidate) => candidate.name)
      .join(', ')}`,
  );
}

const normalizePhone = (value) => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('0090')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) {
    digits = `90${digits.slice(1)}`;
  }
  if (digits.length === 10) digits = `90${digits}`;
  return digits;
};

const comparable = (value) =>
  String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase('tr-TR')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

const normalized = batch.candidates.map((candidate) => {
  const phone = normalizePhone(candidate.phone);
  const whatsapp = normalizePhone(candidate.whatsapp);
  const independentDomains = new Set(
    candidate.sources.map((source) =>
      new URL(source.url).hostname.replace(/^www\./, ''),
    ),
  ).size;

  let confidence = 35;
  confidence += 30;
  if (candidate.sources.some((source) => source.type === 'maps_discovery')) {
    confidence += 10;
  }
  if (independentDomains >= 2) confidence += 10;
  if (candidate.district || candidate.address_details) confidence += 5;
  if (candidate.website) confidence += 5;
  if (candidate.languages?.length) confidence += 5;

  return {
    fingerprint: [
      phone || 'no-phone',
      comparable(candidate.name) || 'no-name',
      comparable(candidate.city) || 'no-city',
    ].join('|'),
    candidate_data: {
      name: candidate.name,
      profession: candidate.profession,
      category: candidate.category,
      city: candidate.city,
      district: candidate.district || null,
      phone: `+${phone}`,
      whatsapp: whatsapp ? `+${whatsapp}` : null,
      description: candidate.description,
      bio: candidate.bio || null,
      address_details: candidate.address_details || null,
      website: candidate.website || null,
      email: candidate.email || null,
      google_maps_url: candidate.google_maps_url || null,
      languages: candidate.languages || [],
      image: candidate.image || null,
      arab_provider_confirmed: true,
      arab_provider_evidence: candidate.arab_provider_evidence,
    },
    sources: candidate.sources,
    confidence: Math.min(100, confidence),
    status: confidence >= 70 ? 'ready' : 'needs_review',
  };
});

const sqlString = (value) => `'${String(value).replaceAll("'", "''")}'`;
const cities = [...new Set(normalized.map((row) => row.candidate_data.city))];
const categories = [
  ...new Set(normalized.map((row) => row.candidate_data.category)),
];
const payload = JSON.stringify(normalized);

const sourceLabel = path.relative(root, sourcePath).replaceAll('\\', '/');

const sql = `-- Generated from ${sourceLabel}.
-- Stages reviewed candidates only; it does not publish public listings.

WITH created_batch AS (
  INSERT INTO public.service_import_batches (
    label,
    cities,
    categories,
    status,
    stats
  )
  VALUES (
    ${sqlString(batch.label)},
    ARRAY[${cities.map(sqlString).join(', ')}]::text[],
    ARRAY[${categories.map(sqlString).join(', ')}]::text[],
    'reviewing',
    jsonb_build_object(
      'received', ${normalized.length},
      'valid', ${normalized.length},
      'ready', ${normalized.filter((row) => row.status === 'ready').length},
      'source_file', ${sqlString(path.basename(sourcePath))}
    )
  )
  RETURNING id
),
payload AS (
  SELECT created_batch.id AS batch_id, item
  FROM created_batch
  CROSS JOIN LATERAL jsonb_array_elements(
    ${sqlString(payload)}::jsonb
  ) AS item
)
INSERT INTO public.service_provider_candidates (
  batch_id,
  fingerprint,
  candidate_data,
  sources,
  status,
  confidence,
  updated_at
)
SELECT
  batch_id,
  item->>'fingerprint',
  item->'candidate_data',
  item->'sources',
  item->>'status',
  (item->>'confidence')::smallint,
  now()
FROM payload
ON CONFLICT (fingerprint) DO UPDATE
SET
  batch_id = EXCLUDED.batch_id,
  candidate_data = EXCLUDED.candidate_data,
  sources = EXCLUDED.sources,
  status = EXCLUDED.status,
  confidence = EXCLUDED.confidence,
  duplicate_provider_id = NULL,
  review_notes = NULL,
  updated_at = now();
`;

fs.writeFileSync(outputPath, sql, 'utf8');
console.log(`Generated ${path.relative(root, outputPath)} with ${normalized.length} candidates.`);
