-- Remove repetitive per-listing wording from service titles/descriptions.
-- The directory itself is Arabic-facing, but individual service labels should
-- stay concise: "خدمات سيارات" instead of "خدمات سيارات باللغة العربية".

UPDATE public.service_providers
SET
  profession = trim(
    regexp_replace(
      regexp_replace(coalesce(profession, ''), '\s*باللغة العربية\s*', ' ', 'g'),
      '\s+',
      ' ',
      'g'
    )
  ),
  description = nullif(
    trim(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(coalesce(description, ''), '\s*ويتيح التواصل باللغة العربية\.?', ' ويتيح التواصل.', 'g'),
            '\s*للتواصل باللغة العربية\s*',
            ' للتواصل ',
            'g'
          ),
          '\s*باللغة العربية\s*',
          ' ',
          'g'
        ),
        '\s+',
        ' ',
        'g'
      )
    ),
    ''
  ),
  updated_at = now()
WHERE profession LIKE '%باللغة العربية%'
   OR description LIKE '%باللغة العربية%';

