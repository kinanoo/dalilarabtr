-- ============================================================================
-- تصحيح رابط خبر التأشيرات + سحب نصّ مقال أنواع التأشيرات للتدقيق (2026-08-15)
--
-- سببان في ملف واحد:
--
-- 1) الرابط خاطئ. حسم ملفُ الخبر الرابطَ إلى أوّل مقال موجود في قائمة
--    المرشّحين، فوقع على work-visa-syrians-return-turkey-2026-06 (فيزا العمل).
--    وهو مقال صحيح في ذاته لكنه ضيّق: الخبر يتحدّث عن دخول تركيا عموماً،
--    والقارئ يحتاج خريطة أنواع التأشيرات كلّها لا نوعاً واحداً منها.
--    الوجهة الصحيحة: syria-turkey-visa-types-2026.
--
--    ولماذا وقع الخطأ أصلاً: ترتيب قائمة المرشّحين كان مبنياً على تخمين
--    «أيّها أقرب لحالة القارئ» لا على معرفة بما في كل مقال — وهذا بالضبط ما
--    يحدث حين تُبنى الأولوية على الأسماء بدل المحتوى.
--
-- 2) لا سبيل إلى قراءة متن المقال من بيئة التحرير: الموقع وقاعدة البيانات
--    محجوبان عنها شبكياً، وscripts/_article-corpus.json لا يحمل إلا العنوان
--    والتصنيف والحالة — لا المتن. فالتدقيق الحقيقي مستحيل بلا نصّ.
--
--    لذلك يطبع هذا الملف المقالَ كاملاً في سجل GitHub Actions (قراءة فقط)،
--    فيُقرأ من هناك ويُدقَّق ويُصحَّح في ملف تالٍ مبنيّ على النصّ الفعلي.
--    تدقيقٌ على مقال لم يُقرأ ليس تدقيقاً — هو تخمين بلغة واثقة.
--
-- المحتوى المطبوع عامّ ومنشور على الموقع أصلاً، فلا شيء سرّي في السجل.
--
-- idempotent. لا يحذف شيئاً ولا يعدّل متن أي مقال.
-- ============================================================================

-- ─── 1) تصحيح رابط الخبر ────────────────────────────────────────────────────
-- الشرط EXISTS مقصود: المقال قد لا يكون في القاعدة رغم وجوده في اللقطة
-- المحلية — وهي الفخّ الموثَّق في CLAUDE.md. ورابط خاطئ أسوأ من غياب رابط،
-- فإن غاب المقصود يُفرَّغ الحقل بدل تركه على وجهة خاطئة.
UPDATE public.updates u
SET link = CASE
  WHEN EXISTS (
    SELECT 1 FROM public.articles a
    WHERE a.slug = 'syria-turkey-visa-types-2026' AND a.status = 'approved'
  ) THEN '/article/syria-turkey-visa-types-2026'
  ELSE NULL
END
WHERE u.title = $t$تسهيلات مرتقبة لتأشيرات السوريين إلى تركيا — تخصّ من عاد نهائياً، ولم تدخل حيّز التنفيذ بعد$t$;

-- ─── 2) بطاقة تعريف المقال (كل الحقول عدا المتن) ───────────────────────────
SELECT jsonb_pretty(to_jsonb(a) - 'details') AS بطاقة_المقال
FROM public.articles a
WHERE a.slug = 'syria-turkey-visa-types-2026';

-- ─── 3) المتن كاملاً، مقطَّعاً كي يبقى مقروءاً في السجل ─────────────────────
-- psql يقصّ الأعمدة الطويلة جداً بصرياً؛ التقطيع إلى أجزاء ثابتة يضمن وصول
-- الحرف الأخير. الترتيب برقم الجزء فتُعاد الخياطة بلا لبس.
SELECT
  i                                   AS جزء,
  substr(a.details, (i - 1) * 800 + 1, 800) AS النص
FROM public.articles a,
     LATERAL generate_series(1, GREATEST(ceil(length(a.details) / 800.0)::int, 1)) AS i
WHERE a.slug = 'syria-turkey-visa-types-2026'
ORDER BY i;

-- ─── 4) المقالات القريبة، لبناء الروابط الداخلية على معرفة لا على تخمين ────
-- الخطأ في البند (1) وُلد من ترتيب قائمة مرشّحين بُني على الأسماء. هذه القائمة
-- تُظهر ما هو موجود فعلاً في هذا الباب كي تُبنى القوائم القادمة على الواقع.
SELECT slug, status, category, left(title, 80) AS العنوان
FROM public.articles
WHERE slug ILIKE '%visa%' OR slug ILIKE '%viza%' OR slug ILIKE '%fiza%'
   OR title ILIKE '%تأشير%' OR title ILIKE '%فيزا%' OR title ILIKE '%دخول تركيا%'
ORDER BY status, slug;

-- ─── 5) تحقّق ───────────────────────────────────────────────────────────────
DO $check$
DECLARE
  cur      text;
  has_dest boolean;
  body_len integer;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.articles
    WHERE slug = 'syria-turkey-visa-types-2026' AND status = 'approved'
  ) INTO has_dest;

  SELECT link INTO cur FROM public.updates
  WHERE title = $t$تسهيلات مرتقبة لتأشيرات السوريين إلى تركيا — تخصّ من عاد نهائياً، ولم تدخل حيّز التنفيذ بعد$t$;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'FAILED: لم يُعثر على الخبر أصلاً — راجع العنوان.';
  END IF;

  IF has_dest THEN
    IF cur IS DISTINCT FROM '/article/syria-turkey-visa-types-2026' THEN
      RAISE EXCEPTION 'FAILED: المقال موجود لكن الرابط لم يُضبط عليه (القيمة الحالية: %).', cur;
    END IF;
    SELECT length(details) INTO body_len FROM public.articles
    WHERE slug = 'syria-turkey-visa-types-2026';
    RAISE NOTICE 'OK: الرابط صار /article/syria-turkey-visa-types-2026. طول المتن % حرفاً — مطبوع أعلاه للتدقيق.', body_len;
  ELSE
    RAISE NOTICE 'تنبيه: المقال syria-turkey-visa-types-2026 غير موجود أو غير معتمَد في القاعدة، فأُفرِغ الرابط عمداً بدل تركه على وجهة خاطئة. الخبر سليم ومنشور.';
  END IF;
END
$check$;
