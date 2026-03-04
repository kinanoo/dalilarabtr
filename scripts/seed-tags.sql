-- =============================================
-- تعبئة التاغات للمقالات الموجودة
-- يُشغّل في Supabase SQL Editor بعد add-article-tags.sql
-- آمن: UPDATE فقط — لا يحذف أي شيء
-- =============================================

-- ======== مقالات الـ seed (9 مقالات) ========

-- التجنيس
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['citizenship'])
WHERE slug = 'citizenship-general' AND NOT ('citizenship' = ANY(COALESCE(tags, '{}')));

UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['citizenship'])
WHERE slug = 'citizenship-syrians' AND NOT ('citizenship' = ANY(COALESCE(tags, '{}')));

UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['citizenship'])
WHERE slug = 'citizenship-investment' AND NOT ('citizenship' = ANY(COALESCE(tags, '{}')));

-- المرور
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['driving-license'])
WHERE slug = 'driving-license' AND NOT ('driving-license' = ANY(COALESCE(tags, '{}')));

UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['fines'])
WHERE slug = 'traffic-fines' AND NOT ('fines' = ANY(COALESCE(tags, '{}')));

UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['car'])
WHERE slug = 'car-registration' AND NOT ('car' = ANY(COALESCE(tags, '{}')));

-- لمّ الشمل
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['family-reunion'])
WHERE slug = 'family-reunion' AND NOT ('family-reunion' = ANY(COALESCE(tags, '{}')));

UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['family-reunion'])
WHERE slug = 'family-reunion-syrians' AND NOT ('family-reunion' = ANY(COALESCE(tags, '{}')));

UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['spouse', 'family-reunion'])
WHERE slug = 'spouse-residence' AND NOT ('spouse' = ANY(COALESCE(tags, '{}')));

-- ======== تعبئة تلقائية للمقالات القديمة بناءً على المحتوى ========

-- بطاقة الهلال الأحمر
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['kizilay'])
WHERE NOT ('kizilay' = ANY(COALESCE(tags, '{}')))
AND (title ILIKE '%هلال%' OR title ILIKE '%kızılay%' OR title ILIKE '%kizilay%' OR title ILIKE '%SUY%');

-- خدمات القنصلية
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['consulate'])
WHERE NOT ('consulate' = ANY(COALESCE(tags, '{}')))
AND (title ILIKE '%قنصلية%' OR title ILIKE '%سفارة%' OR title ILIKE '%جواز سفر سوري%');

-- المواليد والأطفال
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['children'])
WHERE NOT ('children' = ANY(COALESCE(tags, '{}')))
AND (title ILIKE '%مولود%' OR title ILIKE '%مواليد%' OR title ILIKE '%أطفال%' OR title ILIKE '%طفل%');

-- تجديد
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['renewal'])
WHERE NOT ('renewal' = ANY(COALESCE(tags, '{}')))
AND (title ILIKE '%تجديد%' OR title ILIKE '%تمديد%');

-- رخصة القيادة
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['driving-license'])
WHERE NOT ('driving-license' = ANY(COALESCE(tags, '{}')))
AND (title ILIKE '%رخصة%قيادة%' OR title ILIKE '%رخصة%سواقة%' OR title ILIKE '%ehliyet%');

-- المخالفات
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['fines'])
WHERE NOT ('fines' = ANY(COALESCE(tags, '{}')))
AND (title ILIKE '%مخالف%' OR title ILIKE '%غرامة%');

-- تسجيل سيارة
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['car'])
WHERE NOT ('car' = ANY(COALESCE(tags, '{}')))
AND (title ILIKE '%سيارة%' OR title ILIKE '%مركبة%' OR title ILIKE '%رخصة%سير%');

-- لمّ الشمل
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['family-reunion'])
WHERE NOT ('family-reunion' = ANY(COALESCE(tags, '{}')))
AND (title ILIKE '%لم شمل%' OR title ILIKE '%لمّ شمل%' OR title ILIKE '%جمع شمل%');

-- إذن العمل
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['work-permit'])
WHERE NOT ('work-permit' = ANY(COALESCE(tags, '{}')))
AND (title ILIKE '%إذن عمل%' OR title ILIKE '%اذن عمل%' OR title ILIKE '%تصريح عمل%' OR title ILIKE '%çalışma izni%');

-- التأمين
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['insurance'])
WHERE NOT ('insurance' = ANY(COALESCE(tags, '{}')))
AND (title ILIKE '%تأمين صحي%' OR title ILIKE '%SGK%' OR title ILIKE '%sigorta%');

-- المدارس
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['schools'])
WHERE NOT ('schools' = ANY(COALESCE(tags, '{}')))
AND (title ILIKE '%مدرسة%' OR title ILIKE '%مدارس%' OR title ILIKE '%تسجيل%مدرس%');

-- المنح الدراسية
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['scholarships'])
WHERE NOT ('scholarships' = ANY(COALESCE(tags, '{}')))
AND (title ILIKE '%منح%' OR title ILIKE '%بورسة%' OR title ILIKE '%türkiye bursları%');

-- السياحة العلاجية
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['medical-tourism'])
WHERE NOT ('medical-tourism' = ANY(COALESCE(tags, '{}')))
AND (title ILIKE '%سياحة علاج%' OR title ILIKE '%علاج%تركيا%');

-- تصاريح السفر
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['travel-permit'])
WHERE NOT ('travel-permit' = ANY(COALESCE(tags, '{}')))
AND (title ILIKE '%تصريح سفر%' OR title ILIKE '%إذن سفر%' OR title ILIKE '%اذن سفر%');

-- التجنيس (عام)
UPDATE articles SET tags = array_cat(COALESCE(tags, '{}'), ARRAY['citizenship'])
WHERE NOT ('citizenship' = ANY(COALESCE(tags, '{}')))
AND (title ILIKE '%جنسية%' OR title ILIKE '%تجنيس%' OR title ILIKE '%vatandaşlık%');

-- ======== تم! ========
-- للتحقق:
-- SELECT slug, title, tags FROM articles WHERE array_length(tags, 1) > 0 ORDER BY slug;
