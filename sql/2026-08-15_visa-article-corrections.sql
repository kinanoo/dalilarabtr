-- ============================================================================
-- تدقيق مقال أنواع التأشيرات وتصحيحه + ربطه بخبر أمس (2026-08-15)
--
-- قُرئ المتن كاملاً (19,535 من 20,875 حرفاً — الناقص مقدّمةُ المقال ورأس
-- الجدول، سقطا من مطبوعة السجل) عبر
-- sql/2026-08-15_visa-article-audit-and-news-relink.sql.
--
-- ── تصحيح لترجيح خاطئ سبق تسجيله ────────────────────────────────────────────
-- قبل قراءة المتن رجّحتُ أن «(UCSO)» في العنوان اسمٌ خاطئ لمركز التقديم، لأن
-- المصادر تُجمع على أن المركز هو Visa FG. القراءة أبطلت الترجيح: UCSO هو
-- «اتحاد منظمات المجتمع المدني للتنمية»، مصدرُ معلومات المقال لا مركزُ
-- التقديم — والمقال يذكر Visa FG صحيحاً في ثلاثة مواضع. لا تصحيح مطلوباً هنا،
-- ويبقى الدرس: الترجيح من العنوان وحده ليس تدقيقاً.
--
-- ── ما وجده التدقيق فعلاً ───────────────────────────────────────────────────
--
-- 1) رابط داخلي مكسور (الأخطر). صندوق «فئة ثامنة: لم شمل العائلة» يشير إلى
--    /article/family-reunion-visa-update-syria-2026-08-12، ولا وجود له. المقال
--    القائم فعلاً — من مطبوعة الاستعلام نفسها — هو family-reunion-visa-syria-2026
--    («تأشيرة لمّ شمل العائلة من سوريا 2026»، معتمَد). فالقارئ الذي يضغط
--    «الأوراق والخطوات ←» يقع على 404 في أكثر لحظة يحتاج فيها الإرشاد.
--
-- 2) فقرة ختامية متجاوَزة وغير موثّقة: «للسوريين العائدين إلى سوريا بكيمليك
--    هناك تسهيلات قادمة أعلنت عنها وزارة الداخلية التركية وUCSO كجزء من حزمة
--    قرارات يونيو 2026». لم يُعثر على سند لهذه الحزمة، ونسبتها إلى وزارة
--    الداخلية دون نصّ إسنادٌ لا يجوز. وقد تجاوزها الواقع: تصريح سفير تركيا في
--    دمشق (13 آب) هو المستجدّ الموثَّق في هذا الباب. فتُستبدل بفقرة مسنَدة
--    تربط بالخبر، وتقول صراحةً إنه لا قرار نافذاً.
--
-- 3) الرابط /article/goc-idaresi-updates-2026 لم يظهر بين المقالات المعتمَدة،
--    ووجوده غير مؤكَّد. يزول بزوال الفقرة الحاضنة له في البند (2) — فإن كان
--    موجوداً لم نخسر شيئاً، وإن كان مفقوداً فقد أزلنا رابطاً مكسوراً ثانياً.
--
-- 4) إضافة عملية: عنوانا مكتبَي Visa FG. المقال يعطي الموقع الإلكتروني وحده،
--    والقارئ الذي حجز موعده يحتاج أن يعرف إلى أين يذهب بجسده.
--
-- ── ملاحظة على أسلوب الاستبدال ──────────────────────────────────────────────
-- المتن قُرئ من مطبوعة psql مقطَّعةً كل 800 حرف، والتقطيع يدسّ فراغاً عند
-- الحدود. لذلك لا تُستعمل سلاسل طويلة منسوخة من المطبوعة كمرساة:
--   * الرابط المكسور يُصلَح بـreplace على الـslug وحده — والـslug لا يحتمل
--     فراغاً، فلا يطاله التشويه.
--   * الفقرة تُستبدل بـregexp_replace بمرساة قصيرة و.*? — فأي تشويه داخلي
--     لا يُبطل المطابقة.
-- وكل تعديل يُتحقَّق منه بعده، فلا ينجح الملف صامتاً وهو لم يغيّر شيئاً.
--
-- idempotent. لا يحذف صفوفاً ولا يمسّ الخبر.
-- ============================================================================

DO $do$
DECLARE
  news_id   text;
  has_dest  boolean;
  n         integer;
  before_len integer;
BEGIN
  SELECT length(details) INTO before_len
  FROM public.articles WHERE slug = 'syria-turkey-visa-types-2026';

  IF before_len IS NULL THEN
    RAISE EXCEPTION 'FAILED: المقال syria-turkey-visa-types-2026 غير موجود.';
  END IF;

  -- ─── 1) إصلاح الرابط المكسور ─────────────────────────────────────────────
  SELECT EXISTS (
    SELECT 1 FROM public.articles
    WHERE slug = 'family-reunion-visa-syria-2026' AND status = 'approved'
  ) INTO has_dest;

  IF has_dest THEN
    UPDATE public.articles
    SET details = replace(details,
          'family-reunion-visa-update-syria-2026-08-12',
          'family-reunion-visa-syria-2026')
    WHERE slug = 'syria-turkey-visa-types-2026';
    RAISE NOTICE 'OK(1): الرابط المكسور أُحيل إلى family-reunion-visa-syria-2026.';
  ELSE
    -- لا وجهة صالحة: يُنزع الرابط ويبقى النصّ. رابط مكسور أسوأ من نصّ بلا رابط.
    UPDATE public.articles
    SET details = regexp_replace(details,
          '<a href="/article/family-reunion-visa-update-syria-2026-08-12"[^>]*?>(.*?)</a>',
          '\1', 'gs')
    WHERE slug = 'syria-turkey-visa-types-2026';
    RAISE NOTICE 'OK(1): لا وجهة صالحة للمّ الشمل، فنُزع الرابط وبقي النصّ.';
  END IF;

  -- ─── 2) استبدال الفقرة المتجاوَزة بأخرى مسنَدة تربط بالخبر ───────────────
  SELECT id::text INTO news_id
  FROM public.updates
  WHERE title = $t$تسهيلات مرتقبة لتأشيرات السوريين إلى تركيا — تخصّ من عاد نهائياً، ولم تدخل حيّز التنفيذ بعد$t$
  LIMIT 1;

  -- بلا خبر لا رابط: التسلسل هنا حرج — لو دخل news_id فارغاً في التسلسل
  -- لصار details كلّه NULL، أي محو المقال. الشرط يمنع ذلك قطعاً.
  IF news_id IS NOT NULL THEN
    UPDATE public.articles
    SET details = regexp_replace(
      details,
      -- بلا \s* في المقدّمة عمداً: في تعابير Postgres يحدّد **أوّل مُكمِّم**
      -- جشعَ التعبير كلّه، لا كلُّ مُكمِّم نفسَه. فـ\s* الجشع كان يُبطل كسل
      -- .*? الذي بعده، فيبتلع النمط حتى آخر </p> في المتن — ومعه فقرة المصدر
      -- وصندوق الفئة الثامنة. أُمسك في الاختبار قبل النشر، وحارس المعالم
      -- أدناه يمنع عودته صامتاً.
      '<p>للسوريين العائدين.*?</p>',
      $h$<p style="background:#eff6ff;border-right:4px solid #2563eb;padding:14px 18px;border-radius:8px;"><strong>تحديث 15 آب/أغسطس 2026 — لمن عاد نهائياً إلى سوريا:</strong> قال سفير تركيا في دمشق نوح يلماز إن وزارة الخارجية التركية تعمل مع رئاسة إدارة الهجرة على <strong>تسهيل إجراءات التأشيرة</strong> لمن عادوا إلى سوريا ويرغبون في القدوم إلى تركيا مجدّداً، على أن تُتَّخذ الخطوات بعد موافقة رئيس الجمهورية.<br><strong>ولا قرار نافذاً حتى الآن:</strong> لا إعفاء من التأشيرة، ولا موعد معلن، ولا قناة تقديم بهذه الصفة. ومن يطلب منك مالاً مقابل «تسجيل اسمك في قوائم التسهيلات» فهو يبيعك انتظاراً — لا قوائم ولا أدوار. وحتى يصدر نصّ رسمي تبقى الأنواع المذكورة أعلاه هي الطريق الوحيد.<br><a href="/updates/$h$ || news_id || $h$" style="color:#1d4ed8;font-weight:bold;">اقرأ تفاصيل الخبر ومَن يشمله بالضبط ←</a></p>$h$,
      'gs')
    WHERE slug = 'syria-turkey-visa-types-2026';

    SELECT COUNT(*) INTO n FROM public.articles
    WHERE slug = 'syria-turkey-visa-types-2026'
      AND position('تحديث 15 آب/أغسطس 2026 — لمن عاد نهائياً' in details) > 0;

    IF n = 1 THEN
      RAISE NOTICE 'OK(2): الفقرة المتجاوَزة استُبدلت وربطت بالخبر /updates/%.', news_id;
    ELSE
      RAISE NOTICE 'تنبيه(2): لم تُطابَق الفقرة القديمة — المرساة لم تنطبق. الفقرة القديمة ما زالت مكانها وتحتاج ملفاً تالياً.';
    END IF;
  ELSE
    RAISE NOTICE 'تنبيه(2): لم يُعثر على الخبر، فتُخطّي استبدال الفقرة عمداً بدل المخاطرة بمحو المتن.';
  END IF;

  -- ─── 3) عنوانا مكتبَي Visa FG ────────────────────────────────────────────
  UPDATE public.articles
  SET details = details || $h$
<div style="background:#ecfdf5;border:2px solid #10b981;padding:16px 18px;margin:18px 0;border-radius:12px;">
  <p style="margin:0 0 8px;font-weight:bold;color:#065f46;">📍 أين يقع مكتب Visa FG فعلياً</p>
  <p style="margin:0 0 8px;color:#064e3b;line-height:1.8;">الموقع الإلكتروني للحجز والمتابعة، أمّا التقديم فيتمّ شخصياً في أحد مكتبين:</p>
  <ul style="margin:0;padding-right:24px;color:#064e3b;line-height:2;">
    <li><strong>دمشق:</strong> مساكن برزة، أوتوستراد حاميش، مقابل مول قاسيون، رقم 4</li>
    <li><strong>حلب:</strong> دوار المحافظة، زقاق سامح جبل، رقم 2</li>
  </ul>
  <p style="margin:8px 0 0;color:#065f46;font-size:13px;">بدأ استقبال طلبات التأشيرات التركية من سوريا في 10 شباط/فبراير 2025. أكّد العنوان وساعات العمل على <a href="https://sy.visafg.com/ar/" target="_blank" rel="noopener noreferrer" style="color:#047857;font-weight:bold;">sy.visafg.com/ar</a> قبل التوجّه، ولا تسلّم أوراقك لأحد خارج المكتب.</p>
</div>$h$
  WHERE slug = 'syria-turkey-visa-types-2026'
    AND position('أين يقع مكتب Visa FG فعلياً' in details) = 0;

  IF FOUND THEN
    RAISE NOTICE 'OK(3): أُضيف عنوانا مكتبَي دمشق وحلب.';
  ELSE
    RAISE NOTICE 'OK(3): العنوانان مضافان سلفاً — لا تكرار.';
  END IF;

  -- ─── 4) ختم التحديث ──────────────────────────────────────────────────────
  UPDATE public.articles
  SET last_update = '2026-08-15'
  WHERE slug = 'syria-turkey-visa-types-2026';
END
$do$;

-- ─── تحقّق نهائي ────────────────────────────────────────────────────────────
-- الشرط الذي لا يُتساهل فيه: ألّا يبقى في المقال رابطٌ يقود إلى 404.
DO $check$
DECLARE
  bad     integer;
  dead    text[];
  a       text;
  body    text;
  mark    text;
  -- معالم يجب أن تنجو من كل استبدال. استبدالٌ يبتلع أكثر ممّا قُصد به يُسقط
  -- أحدها، فيفشل الملف بدل أن ينجح وقد بتر المقال. هذا الحارس مضاف بعد أن
  -- فعل نمطٌ ذلك فعلاً في الاختبار: ابتلع فقرة المصدر وصندوق الفئة الثامنة.
  landmarks CONSTANT text[] := ARRAY[
    'Visa FG',
    'USHAŞ',
    'مترجم محلّف',
    'اتحاد منظمات المجتمع المدني',
    'وفئة ثامنة',
    'sy.visafg.com'
  ];
BEGIN
  SELECT details INTO body FROM public.articles
  WHERE slug = 'syria-turkey-visa-types-2026';

  IF body IS NULL OR length(body) < 8000 THEN
    RAISE EXCEPTION 'FAILED: المتن غاب أو انكمش إلى % حرفاً — استبدالٌ ابتلع أكثر ممّا قُصد.',
      COALESCE(length(body), 0);
  END IF;

  FOREACH mark IN ARRAY landmarks LOOP
    IF position(mark in body) = 0 THEN
      RAISE EXCEPTION 'FAILED: المَعلَم «%» اختفى من المتن — استبدالٌ ابتلع محتوى لم يُقصد.', mark;
    END IF;
  END LOOP;

  SELECT position('family-reunion-visa-update-syria-2026-08-12' in details)
  INTO bad FROM public.articles WHERE slug = 'syria-turkey-visa-types-2026';

  IF bad > 0 THEN
    RAISE EXCEPTION 'FAILED: الرابط المكسور ما زال في المتن — لم يُصلَح.';
  END IF;

  -- كل رابط داخلي في المقال يجب أن يقابله مقال معتمَد.
  SELECT array_agg(DISTINCT m[1]) INTO dead
  FROM public.articles art,
       LATERAL regexp_matches(art.details, 'href="/article/([^"]+)"', 'g') AS m
  WHERE art.slug = 'syria-turkey-visa-types-2026'
    AND NOT EXISTS (
      SELECT 1 FROM public.articles t
      WHERE t.slug = m[1] AND t.status = 'approved'
    );

  IF dead IS NOT NULL AND array_length(dead, 1) > 0 THEN
    FOREACH a IN ARRAY dead LOOP
      RAISE NOTICE 'تنبيه: رابط داخلي بلا مقال معتمَد — /article/%', a;
    END LOOP;
    RAISE NOTICE 'المجموع: % رابطاً معلَّقاً. يُعالَج في ملف تالٍ.', array_length(dead, 1);
  ELSE
    RAISE NOTICE 'OK: كل روابط المقال الداخلية تقود إلى مقالات معتمَدة.';
  END IF;
END
$check$;

-- ─── مراجعة ─────────────────────────────────────────────────────────────────
SELECT slug, status, last_update, length(details) AS طول_المتن
FROM public.articles WHERE slug = 'syria-turkey-visa-types-2026';

SELECT u.link AS رابط_الخبر, left(u.title, 60) AS الخبر
FROM public.updates u
WHERE u.title = $t$تسهيلات مرتقبة لتأشيرات السوريين إلى تركيا — تخصّ من عاد نهائياً، ولم تدخل حيّز التنفيذ بعد$t$;
