-- =============================================
-- تعيين التاغات للمقالات الموجودة التي لم تُغطَّ سابقاً
-- يُشغّل في Supabase SQL Editor
-- آمن: UPDATE فقط — لا يحذف أي شيء
-- =============================================

-- ======== تاغ consulate — خدمات السوريين ========
-- المقالات التي تتعلق بالقنصلية داخل قسم خدمات السوريين
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['consulate'])
WHERE category = 'خدمات السوريين'
AND NOT ('consulate' = ANY(COALESCE(tags, '{}')))
AND (
  title ILIKE '%قنصل%'
  OR title ILIKE '%سفارة%'
  OR title ILIKE '%جواز سفر سوري%'
  OR title ILIKE '%جواز%سفر%'
  OR title ILIKE '%توكيل%'
  OR title ILIKE '%وكالة%سوري%'
  OR title ILIKE '%بيان عائلي%'
  OR title ILIKE '%وثيقة سورية%'
  OR id ILIKE '%consulate%'
  OR id ILIKE '%passport%'
  OR id ILIKE '%embassy%'
);

-- ======== تاغ kizilay — خدمات السوريين ========
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['kizilay'])
WHERE category = 'خدمات السوريين'
AND NOT ('kizilay' = ANY(COALESCE(tags, '{}')))
AND (
  title ILIKE '%هلال%أحمر%'
  OR title ILIKE '%كيزيلاي%'
  OR title ILIKE '%kızılay%'
  OR title ILIKE '%kizilay%'
  OR title ILIKE '%SUY%'
  OR title ILIKE '%بطاقة مالية%'
  OR id ILIKE '%kizilay%'
  OR id ILIKE '%suy%'
);

-- ======== تاغ children — خدمات السوريين ========
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['children'])
WHERE category = 'خدمات السوريين'
AND NOT ('children' = ANY(COALESCE(tags, '{}')))
AND (
  title ILIKE '%مولود%'
  OR title ILIKE '%مواليد%'
  OR title ILIKE '%أطفال%'
  OR title ILIKE '%طفل%'
  OR title ILIKE '%ولادة%'
  OR title ILIKE '%تسجيل مولود%'
  OR id ILIKE '%birth%'
  OR id ILIKE '%child%'
  OR id ILIKE '%newborn%'
);

-- ======== تاغ renewal — الكملك والحماية المؤقتة ========
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['renewal'])
WHERE category = 'الكملك والحماية المؤقتة'
AND NOT ('renewal' = ANY(COALESCE(tags, '{}')))
AND (
  title ILIKE '%تجديد%'
  OR title ILIKE '%تمديد%'
  OR title ILIKE '%انتهاء%صلاحية%'
  OR id ILIKE '%renewal%'
  OR id ILIKE '%renew%'
);

-- ======== تاغ work-permit — العمل والاستثمار ========
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['work-permit'])
WHERE category = 'العمل والاستثمار'
AND NOT ('work-permit' = ANY(COALESCE(tags, '{}')))
AND (
  title ILIKE '%إذن عمل%'
  OR title ILIKE '%اذن عمل%'
  OR title ILIKE '%تصريح عمل%'
  OR title ILIKE '%رخصة عمل%'
  OR title ILIKE '%عمل%أجانب%'
  OR title ILIKE '%çalışma izni%'
  OR id ILIKE '%work-permit%'
  OR id ILIKE '%calisma%'
);

-- ======== تاغ schools — الدراسة والتعليم ========
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['schools'])
WHERE category = 'الدراسة والتعليم'
AND NOT ('schools' = ANY(COALESCE(tags, '{}')))
AND (
  title ILIKE '%مدرسة%'
  OR title ILIKE '%مدارس%'
  OR title ILIKE '%تسجيل%مدرس%'
  OR title ILIKE '%تعليم%أطفال%'
  OR title ILIKE '%معادلة%'
  OR id ILIKE '%school%'
  OR id ILIKE '%education%'
);

-- ======== تاغ family-reunion — أنواع الإقامات ========
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['family-reunion'])
WHERE category = 'أنواع الإقامات'
AND NOT ('family-reunion' = ANY(COALESCE(tags, '{}')))
AND (
  title ILIKE '%لم شمل%'
  OR title ILIKE '%لمّ شمل%'
  OR title ILIKE '%جمع شمل%'
  OR title ILIKE '%عائلية%'
  OR title ILIKE '%إقامة عائلية%'
  OR id ILIKE '%family%'
  OR id ILIKE '%reunion%'
  OR id ILIKE '%spouse%'
);

-- ======== تاغ medical-tourism — الصحة والتأمين ========
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['medical-tourism'])
WHERE category = 'الصحة والتأمين'
AND NOT ('medical-tourism' = ANY(COALESCE(tags, '{}')))
AND (
  title ILIKE '%سياحة علاج%'
  OR title ILIKE '%علاج%تركيا%'
  OR title ILIKE '%عملية%تجميل%'
  OR title ILIKE '%زراعة%شعر%'
  OR title ILIKE '%أسنان%تركيا%'
  OR title ILIKE '%عيون%'
  OR id ILIKE '%medical-tourism%'
  OR id ILIKE '%dental%'
  OR id ILIKE '%surgery%'
);

-- ======== للتحقق ========
-- SELECT category, slug, title, tags FROM articles
-- WHERE array_length(tags, 1) > 0
-- ORDER BY category, slug;
