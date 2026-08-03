-- إيقاف إشعارات «مقال جديد» الكاذبة عند تعديل مقال قائم
-- ===========================================================================
-- العطب المُشاهَد: تصل إشعارات «تم نشر 3 / 5 مقالات جديدة» بينما لم يُنشر شيء.
-- والنقر عليها يفتح /articles فلا يجد القارئ جديداً — لأنه لا يوجد جديد.
--
-- الدليل القاطع: أحدث published_at في قاعدة البيانات هو 2026-07-18، بينما وصلت
-- إشعارات «الآن» و«منذ 14 ساعة» و«منذ 23 ساعة». تلك كانت دفعات تحرير المحتوى
-- التي شُغّلت اليوم — لا مقالات جديدة.
--
-- السبب: الدالة log_new_article() مربوطة بـ AFTER INSERT OR UPDATE، وحارسها
-- الوحيد أن يبقى العنوان كما هو:
--     IF TG_OP = 'UPDATE' AND OLD.title = NEW.title THEN RETURN NEW;
-- وكل تحسين تحريري يغيّر العنوان — فينطلق الإشعار. وأسوأ من ذلك أن الدالة
-- كانت تحذف سجلّ النشاط القديم ثم تُدرج بديلاً عنه، فيُعامَل المقال القديم
-- كأنه نُشر للتوّ في كل مرة.
--
-- الإصلاح: الإشعار يعني «صار متاحاً للقراء لأول مرة» لا «تغيّر نصّه».
--   • عند الإنشاء (INSERT): يُسجَّل إن كان المقال معتمداً ونشطاً.
--   • عند التعديل (UPDATE): يُسجَّل **فقط** إذا كان هذا أول انتقال إلى حالة
--     منشورة — أي أنه لم يكن معتمداً أو كان مُطفأً، وصار الآن معتمداً ونشطاً.
--   • أي تعديل آخر — عنواناً كان أو متناً — لا يُنتج شيئاً.
--   • وأُلغي الحذف وإعادة الإدراج.
--
-- ملاحظة: كل الصفوف الحالية status='approved'، فلن يُطلق أي تعديل لاحق إشعاراً
-- على مقال قائم — وهو المطلوب بالضبط.
--
-- الملف idempotent (CREATE OR REPLACE + DROP/CREATE TRIGGER).
-- شغّله في Supabase → SQL Editor.

-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION log_new_article()
RETURNS TRIGGER AS $$
DECLARE
    v_should_log BOOLEAN := FALSE;
BEGIN
    -- «منشور» = معتمد وغير مُطفأ
    IF TG_OP = 'INSERT' THEN
        v_should_log := (NEW.status = 'approved' AND NEW.active IS NOT FALSE);

    ELSIF TG_OP = 'UPDATE' THEN
        -- أول انتقال إلى حالة منشورة فقط: مسودّة تُعتمد، أو مقال مُطفأ يُعاد تفعيله.
        v_should_log := (NEW.status = 'approved' AND NEW.active IS NOT FALSE)
                        AND (COALESCE(OLD.status, '') IS DISTINCT FROM 'approved'
                             OR OLD.active IS FALSE);
    END IF;

    IF NOT v_should_log THEN
        RETURN NEW;
    END IF;

    -- حارس إضافي: لا تُسجّل مرتين لنفس المقال إن كان له سجلّ سابق.
    IF EXISTS (
        SELECT 1 FROM admin_activity_log
        WHERE entity_id = NEW.id::TEXT AND event_type = 'new_article'
    ) THEN
        RETURN NEW;
    END IF;

    INSERT INTO admin_activity_log (event_type, title, detail, entity_id, entity_table)
    VALUES (
        'new_article',
        'مقال جديد: ' || COALESCE(NEW.title, 'بدون عنوان'),
        COALESCE(NEW.category, ''),
        NEW.id::TEXT,
        'articles'
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_article_log ON articles;
CREATE TRIGGER on_new_article_log
    AFTER INSERT OR UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION log_new_article();

-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — قرائي بالكامل. لا نجرّب بتعديل مقال حقيقي: لو كان الإصلاح ناقصاً
-- لأطلق ذلك الاختبار إشعاراً كاذباً فعلياً إلى المشتركين، وهو ما نحاول منعه.
--
-- المتوقَّع في النتيجة:
--   has_first_publish_guard = 1   (الدالة تشترط أول انتقال إلى النشر)
--   has_old_title_guard     = 0   (حارس العنوان القديم زال)
--   has_delete_reinsert     = 0   (الحذف وإعادة الإدراج زالا)
SELECT
    p.proname                                                        AS function_name,
    (pg_get_functiondef(p.oid) LIKE '%IS DISTINCT FROM ''approved''%')::int AS has_first_publish_guard,
    (pg_get_functiondef(p.oid) LIKE '%OLD.title = NEW.title%')::int         AS has_old_title_guard,
    (pg_get_functiondef(p.oid) LIKE '%DELETE FROM admin_activity_log%')::int AS has_delete_reinsert
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'log_new_article' AND n.nspname = 'public';

-- والترigger نفسه ما زال مربوطاً بالجدول
SELECT tgname AS trigger_name, pg_get_triggerdef(oid) AS definition
FROM pg_trigger
WHERE tgrelid = 'articles'::regclass AND NOT tgisinternal AND tgname = 'on_new_article_log';
