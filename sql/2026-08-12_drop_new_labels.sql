-- ============================================================================
-- إزالة لغة «مقال جديد / جديد اليوم» من كل السطوح — الفكرة كلها لا الأثر فقط
-- ============================================================================
-- المالك: «كلمة مقال جديد وجديد اليوم هيك أمور مو مناسب تظهر في المقالات
-- والأخبار والتلغرام والموقع — شيّلها وشيل فكرتها كلها».
--
-- المصدر ثلاثي:
--   1. تريغرات السجل (log_new_article/update/scenario/faq/tool) تلصق بادئة
--      «مقال جديد: » وأخواتها على العنوان قبل أن يصل جرس الإشعارات — فتظهر
--      البادئة في الجرس وفي لوحة النشاط. تُعاد كتابتها بلا بادئة.
--   2. البادئة نفسها محفوظة في صفوف notifications و admin_activity_log
--      القديمة — تُنظَّف بالحذف من بداية النص فقط (لا يُمس المتن).
--   3. عنوان محتوى فعلي كتبه محرر آخر: «جديد اليوم: لمّ الشمل…» في مقال
--      وخبر — يُقصّ العنوان ويبقى الموضوع.
--
-- والبادئة «تم نشر N مقالات جديدة» في التجميع تبقى: تلك عدّاد لا وسم دعائي،
-- ولا بديل لها في صف واحد يمثّل عدة مقالات.
-- (البادئة في قناة تلغرام والدفع أُزيلت في الكود — pipeline.ts).
-- آمن لإعادة التشغيل.
-- ============================================================================

-- ── 1) التريغرات: العنوان هو العنوان، بلا بادئة ─────────────────────────────
CREATE OR REPLACE FUNCTION log_new_article()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.title = NEW.title THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM admin_activity_log
        WHERE entity_id = NEW.id::TEXT AND event_type = 'new_article';
    END IF;
    INSERT INTO admin_activity_log (event_type, title, detail, entity_id, entity_table)
    VALUES ('new_article', COALESCE(NEW.title, 'بدون عنوان'),
            COALESCE(NEW.category, ''), NEW.id::TEXT, 'articles');
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_new_update()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.title = NEW.title THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM admin_activity_log
        WHERE entity_id = NEW.id::TEXT AND event_type = 'new_update';
    END IF;
    INSERT INTO admin_activity_log (event_type, title, detail, entity_id, entity_table)
    VALUES ('new_update', COALESCE(NEW.title, 'بدون عنوان'),
            COALESCE(NEW.type, ''), NEW.id::TEXT, 'updates');
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_new_scenario()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.title = NEW.title THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM admin_activity_log
        WHERE entity_id = NEW.id::TEXT AND event_type = 'new_scenario';
    END IF;
    INSERT INTO admin_activity_log (event_type, title, detail, entity_id, entity_table)
    VALUES ('new_scenario', COALESCE(NEW.title, 'بدون عنوان'),
            COALESCE(NEW.category, ''), NEW.id::TEXT, 'consultant_scenarios');
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_new_faq()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.question = NEW.question THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM admin_activity_log
        WHERE entity_id = NEW.id::TEXT AND event_type = 'new_faq';
    END IF;
    INSERT INTO admin_activity_log (event_type, title, detail, entity_id, entity_table)
    VALUES ('new_faq', LEFT(COALESCE(NEW.question, 'بدون سؤال'), 80),
            COALESCE(NEW.category, ''), NEW.id::TEXT, 'faqs');
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_new_tool()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.name = NEW.name THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM admin_activity_log
        WHERE entity_id = NEW.id::TEXT AND event_type = 'new_tool';
    END IF;
    INSERT INTO admin_activity_log (event_type, title, detail, entity_id, entity_table)
    VALUES ('new_tool', COALESCE(NEW.name, 'بدون اسم'),
            COALESCE(NEW.description, ''), NEW.id::TEXT, 'tools_registry');
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 2) تنظيف البادئات المحفوظة في الصفوف القائمة ────────────────────────────
-- «جديد اليوم» تأتي أحياناً بتاريخ داخلها («جديد اليوم 12 أغسطس:») فالنمط
-- يسمح بحروف قليلة قبل النقطتين.
UPDATE admin_activity_log SET title = regexp_replace(
    title, '^(مقال جديد|خبر|سيناريو جديد|سؤال جديد|أداة جديدة)\s*:\s*', '')
 WHERE title ~ '^(مقال جديد|خبر|سيناريو جديد|سؤال جديد|أداة جديدة)\s*:';

UPDATE admin_activity_log SET title = regexp_replace(title, '^جديد اليوم[^:]{0,25}:\s*', '')
 WHERE title ~ '^جديد اليوم';

UPDATE notifications SET title = regexp_replace(
    title, '^(مقال جديد|خبر|سيناريو جديد|سؤال جديد|أداة جديدة)\s*:\s*', '')
 WHERE title ~ '^(مقال جديد|خبر|سيناريو جديد|سؤال جديد|أداة جديدة)\s*:';

UPDATE notifications SET title = regexp_replace(title, '^جديد اليوم[^:]{0,25}:\s*', '')
 WHERE title ~ '^جديد اليوم';

-- صفوف خط الإشعارات القديمة: العنوان كان لافتة («مقال جديد على دليل العرب»)
-- والموضوع في الرسالة — يُرفع الموضوع ليكون العنوان وتفرَّغ الرسالة، تماماً
-- كما صار الكود يفعل من الآن.
UPDATE notifications
   SET title = regexp_replace(message, '^جديد اليوم[^:]{0,25}:\s*', ''), message = ''
 WHERE title LIKE 'مقال جديد على دليل العرب%'
   AND message IS NOT NULL AND message <> '';

-- ── 3) عناوين المحتوى نفسه ─────────────────────────────────────────────────
UPDATE articles SET title = regexp_replace(title, '^جديد اليوم[^:]{0,25}:\s*', ''),
                    last_update = CURRENT_DATE
 WHERE title ~ '^جديد اليوم';

UPDATE updates SET title = regexp_replace(title, '^جديد اليوم[^:]{0,25}:\s*', '')
 WHERE title ~ '^جديد اليوم';

UPDATE updates SET summary = regexp_replace(summary, '^(تحديث اليوم|جديد اليوم)[^:]{0,25}:\s*', '')
 WHERE summary ~ '^(تحديث اليوم|جديد اليوم)';

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM articles WHERE title ~ '^(جديد اليوم|مقال جديد)';
    IF n <> 0 THEN RAISE EXCEPTION 'still % article titles with a promo prefix', n; END IF;

    SELECT count(*) INTO n FROM updates
     WHERE title ~ '^(جديد اليوم|خبر جديد)' OR summary ~ '^(جديد اليوم|تحديث اليوم)';
    IF n <> 0 THEN RAISE EXCEPTION 'still % update rows with a promo prefix', n; END IF;

    SELECT count(*) INTO n FROM notifications
     WHERE title ~ '^(مقال جديد|خبر|جديد اليوم)' OR title LIKE 'مقال جديد على دليل العرب%';
    IF n <> 0 THEN RAISE EXCEPTION 'still % notification rows with a label', n; END IF;

    -- the trigger source itself must no longer contain the label
    SELECT count(*) INTO n FROM pg_proc
     WHERE proname IN ('log_new_article', 'log_new_update', 'log_new_scenario',
                       'log_new_faq', 'log_new_tool')
       AND prosrc LIKE '%جديد: %';
    IF n <> 0 THEN RAISE EXCEPTION '% log functions still prepend a label', n; END IF;
END
$check$;

SELECT 'مقالات بعنوان دعائي' AS البند, count(*)::text AS العدد FROM articles WHERE title ~ '^(جديد اليوم|مقال جديد)\s*:'
UNION ALL SELECT 'أخبار بعنوان دعائي', count(*)::text FROM updates WHERE title ~ '^(جديد اليوم|خبر جديد)\s*:'
UNION ALL SELECT 'إشعارات ببادئة', count(*)::text FROM notifications WHERE title ~ '^(مقال جديد|خبر|جديد اليوم)\s*:'
UNION ALL SELECT 'المقال المصحح', title FROM articles WHERE slug = 'syria-family-reunion-update-2026-08-12';
