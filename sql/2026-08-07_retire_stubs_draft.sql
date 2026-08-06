-- ============================================================================
-- تقاعد الأنقاض السبعة — بالقيمة التي يقبلها القيد فعلاً
-- ============================================================================
-- تشخيص الملف السابق حسم اللغز: القاعدة الحيّة فيها قيد
--   articles_status_check: CHECK (status = ANY (ARRAY['pending','approved','rejected','draft']))
-- فقيمة 'archived' التي حاولتها ملفّات التوحيد الثلاثة مرفوضة — وهذا نصّ
-- الخطأ الذي كان معالج الاستثناء يبتلعه:
--   new row for relation "articles" violates check constraint "articles_status_check"
-- (القيد ليس في sql الإعداد داخل المستودع — complete_db_setup.sql يعرّف
-- العمود نصّاً حرّاً؛ القاعدة الحيّة أضافته لاحقاً. درسٌ مسجَّل.)
--
-- القيمة الصحيحة للتقاعد هي 'draft':
--   * مسموحة في القيد؛
--   * لوحة الإدارة تعرض غير المعتمد وغير المرفوض بوصفه «مسودة — غير ظاهر»
--     فيبقى قابلاً للاسترجاع بنقرة؛
--   * والموقع العام كلّه (صفحة المقال، والتصنيفات، وخرائط الموقع) يرشّح
--     على status = 'approved' فتختفي الصفحات من الفهرسة والعرض معاً.
-- وكل slug من السبعة له 301 في next.config.ts منذ ملفّه — فسلوك الزائر
-- لا يتغيّر بشيء.
--
-- آمن لإعادة التشغيل.
-- ============================================================================

UPDATE articles SET status = 'draft', last_update = CURRENT_DATE
WHERE slug IN ('red-crescent-card', 'kizilay-card-problems', 'kizilay-card-apply',
               'bank-account-documents', 'kimlik-bank-sim',
               'kimlik-newborn-addition', 'family-birth-registration-flow')
  AND status = 'approved';

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int;
BEGIN
    -- لا نقض بقي معتمَداً
    SELECT count(*) INTO n FROM articles
     WHERE slug IN ('red-crescent-card', 'kizilay-card-problems', 'kizilay-card-apply',
                    'bank-account-documents', 'kimlik-bank-sim',
                    'kimlik-newborn-addition', 'family-birth-registration-flow')
       AND status = 'approved';
    IF n > 0 THEN RAISE EXCEPTION '% stub(s) still approved', n; END IF;

    -- والأدلّة المرجعية الثلاثة التي تستقبل تحويلاتها ما زالت حيّة
    SELECT count(*) INTO n FROM articles
     WHERE slug IN ('kizilay-card-application', 'bank-account-opening', 'birth-registration-turkey')
       AND status = 'approved';
    IF n <> 3 THEN RAISE EXCEPTION 'a canonical target is not live'; END IF;
END
$check$;

SELECT slug AS الصفحة, status AS الحالة
FROM articles
WHERE slug IN ('red-crescent-card', 'kizilay-card-problems', 'kizilay-card-apply',
               'bank-account-documents', 'kimlik-bank-sim',
               'kimlik-newborn-addition', 'family-birth-registration-flow',
               'kizilay-card-application', 'bank-account-opening', 'birth-registration-turkey')
ORDER BY status, slug;
