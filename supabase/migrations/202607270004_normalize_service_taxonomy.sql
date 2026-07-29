-- Canonical Arabic taxonomy for stable filters, URLs, and reporting.
-- Historical rows used a mixture of English slugs and free-text labels.

UPDATE public.service_providers
SET category = CASE lower(trim(category))
  WHEN 'housing' THEN 'عقارات'
  WHEN 'translation' THEN 'مترجم'
  WHEN 'legal' THEN 'محامي'
  WHEN 'medical' THEN 'طبيب'
  WHEN 'official' THEN 'خدمات عامة'
  WHEN 'other' THEN 'خدمات عامة'
  WHEN 'home' THEN 'صيانة منزلية'
  WHEN 'كهربائي' THEN 'كهرباء'
  WHEN 'مستلزمات اطفال' THEN 'متاجر ومستلزمات'
  WHEN 'سيراميك' THEN 'تشطيبات وديكور'
  WHEN 'تركيب خطوط نت' THEN 'اتصالات وإنترنت'
  ELSE category
END,
updated_at = now()
WHERE lower(trim(category)) IN (
  'housing',
  'translation',
  'legal',
  'medical',
  'official',
  'other',
  'home',
  'كهربائي',
  'مستلزمات اطفال',
  'سيراميك',
  'تركيب خطوط نت'
);

-- This listing is specifically an education consultancy, not a general office.
UPDATE public.service_providers
SET category = 'تعليم',
    updated_at = now()
WHERE id = '3290b42f-3280-4054-b5ee-910fbb9961ee';

UPDATE public.service_providers
SET city = CASE lower(trim(city))
  WHEN 'istanbul' THEN 'إسطنبول'
  WHEN 'اسطنبول' THEN 'إسطنبول'
  WHEN 'اسطنبول الفاتح' THEN 'إسطنبول'
  WHEN 'bursa' THEN 'بورصة'
  WHEN 'kocaeli' THEN 'كوجالي'
  WHEN 'sakarya' THEN 'سكاريا'
  WHEN 'شانلي اورفا' THEN 'شانلي أورفا'
  WHEN 'اورفا' THEN 'شانلي أورفا'
  WHEN 'انقرة' THEN 'أنقرة'
  WHEN 'غازي عينتاب' THEN 'غازي عنتاب'
  WHEN 'yalova' THEN 'يالوفا'
  ELSE city
END,
updated_at = now()
WHERE lower(trim(city)) IN (
  'istanbul',
  'اسطنبول',
  'اسطنبول الفاتح',
  'bursa',
  'kocaeli',
  'sakarya',
  'شانلي اورفا',
  'اورفا',
  'انقرة',
  'غازي عينتاب',
  'yalova'
);

-- Substring search remains fast as the directory grows past 1,000 rows.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_service_providers_name_trgm
  ON public.service_providers USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_service_providers_profession_trgm
  ON public.service_providers USING gin (profession gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_service_providers_description_trgm
  ON public.service_providers USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_service_providers_district_trgm
  ON public.service_providers USING gin (district gin_trgm_ops);
