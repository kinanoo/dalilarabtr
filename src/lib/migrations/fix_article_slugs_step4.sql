-- =============================================
-- إصلاح الخطوة 4: توليد slug للمقالات العربية
-- شغّل هذا فقط (الخطوات 1-3 تمت بنجاح)
-- =============================================
-- المشكلة السابقة: ROW_NUMBER() كان يبدأ من 1 لكل قسم
-- فيتعارض مع slugs موجودة مثل "article-1"
-- الحل: نبحث عن أعلى رقم موجود لكل بادئة ونبدأ من بعده
-- =============================================

WITH to_update AS (
  SELECT
    id,
    created_at,
    CASE
      WHEN category = 'e-Devlet'                  THEN 'edevlet'
      WHEN category = 'إقامات'                     THEN 'residence'
      WHEN category = 'أنواع الإقامات'              THEN 'residence'
      WHEN category = 'الإقامة والأوراق'            THEN 'residence'
      WHEN category = 'معاملات رسمية'              THEN 'official'
      WHEN category = 'الحياة اليومية'              THEN 'daily'
      WHEN category = 'السكن والحياة'              THEN 'housing'
      WHEN category = 'العمل والاستثمار'            THEN 'work'
      WHEN category = 'العمل والدخل'               THEN 'work'
      WHEN category = 'الدراسة والتعليم'            THEN 'education'
      WHEN category = 'الصحة والتأمين'             THEN 'health'
      WHEN category = 'الفيزا والتأشيرات'           THEN 'visa'
      WHEN category = 'خدمات السوريين'             THEN 'syrians'
      WHEN category = 'الكملك والحماية المؤقتة'     THEN 'kimlik'
      WHEN category = 'أفكار مشاريع'               THEN 'business'
      WHEN category = 'خدمات e-Devlet'             THEN 'edevlet'
      ELSE 'guide'
    END AS prefix
  FROM public.articles
  WHERE slug IS NULL
),

-- نجيب أعلى رقم موجود لكل بادئة من الـ slugs الحالية
existing_max AS (
  SELECT
    p.prefix,
    COALESCE(MAX(
      CAST(SUBSTRING(a.slug FROM '-([0-9]+)$') AS INTEGER)
    ), 0) AS max_num
  FROM (SELECT DISTINCT prefix FROM to_update) p
  LEFT JOIN public.articles a
    ON a.slug IS NOT NULL
    AND a.slug ~ ('^' || p.prefix || '-[0-9]+$')
  GROUP BY p.prefix
),

-- نرقّم المقالات الجديدة بدءاً من max_num + 1
numbered AS (
  SELECT
    t.id,
    t.prefix || '-' || (
      COALESCE(e.max_num, 0)
      + ROW_NUMBER() OVER (PARTITION BY t.prefix ORDER BY t.created_at ASC)
    ) AS new_slug
  FROM to_update t
  LEFT JOIN existing_max e ON e.prefix = t.prefix
)

UPDATE public.articles
SET slug = numbered.new_slug
FROM numbered
WHERE articles.id = numbered.id;
