-- =====================================================
-- Auto-fill SEO fields for all articles
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Fill seo_title where NULL
--    Format: "العنوان | دليل العرب في تركيا"
--    Truncated to 60 chars for optimal Google display
UPDATE articles
SET seo_title = LEFT(title || ' | دليل العرب في تركيا', 60)
WHERE seo_title IS NULL AND title IS NOT NULL;

-- 2. Fill seo_description where NULL
--    Uses intro field, truncated to 160 chars for optimal Google snippet
UPDATE articles
SET seo_description = LEFT(
    COALESCE(intro, 'دليل شامل حول ' || title || ' في تركيا — معلومات محدثة وموثوقة للعرب المقيمين في تركيا.'),
    160
)
WHERE seo_description IS NULL;

-- 3. Auto-generate seo_keywords from category + title
UPDATE articles
SET seo_keywords = ARRAY[
    title,
    category,
    'تركيا',
    'دليل العرب',
    CASE category
        WHEN 'الإقامات' THEN 'إقامة تركيا'
        WHEN 'e-Devlet' THEN 'إي دولات'
        WHEN 'السكن والحياة' THEN 'السكن في تركيا'
        WHEN 'العمل والاستثمار' THEN 'العمل في تركيا'
        WHEN 'الصحة والتأمين' THEN 'التأمين الصحي تركيا'
        WHEN 'الفيزا والتأشيرات' THEN 'فيزا تركيا'
        WHEN 'الدراسة والتعليم' THEN 'الدراسة في تركيا'
        WHEN 'المرور والقيادة' THEN 'رخصة القيادة تركيا'
        ELSE 'معلومات تركيا'
    END
]
WHERE seo_keywords IS NULL OR array_length(seo_keywords, 1) IS NULL;

-- 4. Verify results
SELECT
    count(*) AS total_articles,
    count(seo_title) AS with_seo_title,
    count(seo_description) AS with_seo_description,
    count(CASE WHEN array_length(seo_keywords, 1) > 0 THEN 1 END) AS with_seo_keywords
FROM articles;
