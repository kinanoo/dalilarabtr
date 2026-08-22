-- ============================================================================
-- مقال جامع: تصديق الوثائق والشهادات في تركيا 2026 (2026-08-21)
--
-- لماذا هذا المقال: بحث صاحب الموقع عن «تصديق شهادات تركية في تركيا» فلم يظهر
-- الموقع، وظهر منافسون. الفحص أثبت أن السبب ليس نقص تغطية — عندنا خمس صفحات في
-- العنقود (الأبوستيل، معادلة الجامعية، معادلة الثانوية، التصديق إلى سوريا،
-- النوتر) — بل أن لا واحدة منها تحمل عنوان السؤال العام؛ أوسعها معنوَنة
-- «من تركيا إلى سوريا — دليل الطلاب»، وهي أضيق من السؤال. فالناقص صفحة أمّ
-- تجيب عن السؤال العام وتوزّع القارئ على التفاصيل.
--
-- المصادر (تحقّقت هيئة التحرير منها يوم 2026-08-21):
--   * مؤتمر لاهاي للقانون الدولي الخاص — جدول حالة اتفاقية الأبوستيل
--     (المحدَّث 30 حزيران/يونيو 2026): تركيا طرف، صدّقت في 31-VII-1985 ونفذت
--     عليها 29-IX-1985، و«الجمهورية العربية السورية» غير واردة إطلاقاً بين
--     الأطراف الـ130:
--     https://www.hcch.net/en/instruments/conventions/status-table/?cid=41
--   * صفحات دليل العرب المعتمَدة والمحقَّقة سابقاً في العنقود نفسه.
--
-- ملاحظة تحريرية مقصودة: لا يذكر هذا المقال أي رقم رسوم لم يُتحقّق منه اليوم.
-- الرسوم تُحال إلى صفحاتها المتخصّصة حيث تُحدَّث بمصدرها.
--
-- idempotent: يُحدِّث إن وُجد الـslug ويُدرج إن لم يوجد.
-- ============================================================================

DO $art$
DECLARE
  v_slug    text := 'document-attestation-turkey-2026';
  v_title   text := $ti$تصديق الوثائق والشهادات في تركيا 2026: السلسلة الكاملة من الترجمة إلى الأبوستيل$ti$;
  v_cat     text := $ca$معاملات رسمية$ca$;
  v_details text := $c$<p>«تصديق الأوراق» في تركيا ليس إجراءً واحداً، بل <strong>سلسلة</strong> ترتيبها يقرّر نجاح المعاملة أو ردّها. وأكثر ما يُضيّع الوقت هنا خلطٌ بين ثلاثة أشياء مختلفة تماماً. هذه الصفحة تجمع السلسلة كلّها في مكان واحد، وتحيلك إلى تفاصيل كل محطّة.</p>

<h2>أولاً: ثلاثة إجراءات يخلط بينها الجميع</h2>
<p>قبل أن تتحرّك، اعرف أيّها تحتاج — فطلب الخطأ يعني رحلة ضائعة:</p>
<ul>
<li><strong>الترجمة المحلَّفة (Yeminli Tercüme):</strong> نقل الوثيقة إلى لغة أخرى بيد مترجم مسجَّل لدى النوتر. هي <em>لغة</em> لا اعتراف.</li>
<li><strong>التصديق (Tasdik):</strong> ختم جهة رسمية يشهد أن التوقيع والختم على الوثيقة صحيحان. هو <em>إثبات صحّة</em> لا اعتراف بالمضمون.</li>
<li><strong>المعادلة (Denklik):</strong> اعتراف رسمي بأن شهادتك تعادل نظيرتها التركية. هي <em>اعتراف بالمضمون</em>، وجهتها مجلس التعليم العالي للشهادة الجامعية ووزارة التربية للثانوية.</li>
</ul>
<p>القاعدة العملية: <strong>إن أردت استعمال وثيقتك خارج تركيا فأنت تحتاج تصديقاً. وإن أردت استعمال شهادتك داخل تركيا للدراسة أو العمل فأنت تحتاج معادلة.</strong> وكثيرون يطلبون التصديق وهم يقصدون المعادلة فيخسرون أسابيع.</p>

<h2>ثانياً: السلسلة بترتيبها الصحيح</h2>
<p>الترتيب ليس تفصيلاً — فالجهة ترفض ختم ورقة لم تُختم قبلها من الجهة السابقة:</p>
<ol>
<li><strong>الوثيقة الأصلية</strong> من جهتها المُصدِرة (الجامعة، مديرية التربية، النفوس، المحكمة).</li>
<li><strong>الترجمة المحلَّفة</strong> إن كانت الجهة المستقبِلة تطلب لغة أخرى.</li>
<li><strong>تصديق النوتر</strong> على الترجمة — النوتر يصدّق توقيع المترجم المحلَّف لا صحّة المضمون.</li>
<li><strong>الأبوستيل</strong> إن كانت الدولة المستقبِلة طرفاً في اتفاقية لاهاي.</li>
<li><strong>أو التصديق القنصلي</strong> إن كانت خارج الاتفاقية — وهنا يطول الطريق، وتفصيله أدناه.</li>
</ol>

<h2>ثالثاً: الأبوستيل — أين يُختم بالضبط</h2>
<p>تركيا طرف في اتفاقية لاهاي للأبوستيل منذ نفاذها عليها في أيلول/سبتمبر 1985، فوثيقتك التركية تُقبل في أي دولة طرف بختم واحد بدل سلسلة تصديقات. لكن <strong>الجهة المختصّة تختلف بحسب نوع الوثيقة</strong>، وهذا أكثر ما يُردّ الناس من الباب:</p>
<ul>
<li><strong>الوثائق الإدارية</strong> (شهادة ميلاد، سجل نفوس، شهادة دراسية، وثيقة بلدية): الأبوستيل عند <strong>الوالي (Valilik)</strong> أو <strong>القائمقام (Kaymakamlık)</strong> في الولاية أو القضاء التابعة له الجهة المُصدِرة.</li>
<li><strong>الوثائق القضائية</strong> (أحكام، ضبوط، أوراق صادرة عن محكمة أو نوتر): الأبوستيل في <strong>قصر العدل (Adliye)</strong>.</li>
</ul>
<p>أي أن ورقة صادرة عن محكمة لا تُختم عند الوالي، وشهادة ميلاد لا تُختم في قصر العدل — والذهاب إلى الجهة الخطأ يوم كامل ضائع.</p>

<h2>رابعاً: وثائقك متجهة إلى سوريا؟ لا أبوستيل لك</h2>
<p>هذه أهمّ فقرة لأكثر قرّائنا. راجعنا جدول حالة الاتفاقية لدى مؤتمر لاهاي في نسخته المحدَّثة (30 حزيران/يونيو 2026): <strong>الجمهورية العربية السورية ليست بين الأطراف الـ130</strong>. والنتيجة العملية:</p>
<ul>
<li><strong>الأبوستيل لا ينفع لسوريا</strong> — ولو ختمته فلن تعترف به الجهة السورية، وتكون قد دفعت رسماً بلا مقابل.</li>
<li>الطريق البديل هو <strong>التصديق التقليدي المتسلسل</strong>: تصديق الجهة التركية المختصّة، ثم <strong>وزارة الخارجية التركية</strong>، ثم <strong>القنصلية أو السفارة السورية</strong> في تركيا، ثم غالباً محطّة أخيرة داخل سوريا لدى الجهة المعنيّة.</li>
<li>ولأن الترتيب صارم، فإن تخطّي محطّة يُبطل ما بعدها ويعيدك إلى البداية.</li>
</ul>
<p>والتفصيل الكامل لهذا المسار — بحسب نوع الشهادة (تعليم مفتوح، مدارس مؤقتة، نظامية، مهنية) وبالوثائق الجامعية وكشف العلامات — مشروح في صفحته المخصّصة أسفل هذه الصفحة.</p>

<h2>خامساً: ماذا تحتاج بالضبط حسب وثيقتك</h2>
<table>
<thead><tr><th>وثيقتك</th><th>تحتاج</th><th>الجهة</th></tr></thead>
<tbody>
<tr><td>شهادة جامعية تركية لاستعمالها في الخارج</td><td>ترجمة ثم نوتر ثم أبوستيل</td><td>الوالي أو القائمقام</td></tr>
<tr><td>شهادة أجنبية لاستعمالها في تركيا</td><td>معادلة لا تصديقاً</td><td>مجلس التعليم العالي أو وزارة التربية</td></tr>
<tr><td>شهادة ميلاد أو سجل نفوس</td><td>أبوستيل إداري</td><td>الوالي أو القائمقام</td></tr>
<tr><td>حكم محكمة أو وكالة من نوتر</td><td>أبوستيل قضائي</td><td>قصر العدل</td></tr>
<tr><td>أي وثيقة متجهة إلى سوريا</td><td>تصديق قنصلي متسلسل</td><td>الخارجية التركية ثم القنصلية السورية</td></tr>
</tbody>
</table>

<h2>سادساً: خمسة أخطاء تُبطل المعاملة</h2>
<ol>
<li><strong>طلب أبوستيل لوثيقة متجهة إلى سوريا.</strong> ختم لا قيمة له، ورسم مدفوع بلا مقابل.</li>
<li><strong>الذهاب إلى الجهة الخطأ.</strong> الإداري عند الوالي والقائمقام، والقضائي في قصر العدل — ولا تبادل بينهما.</li>
<li><strong>الترجمة قبل معرفة ما تطلبه الجهة المستقبِلة.</strong> بعض الجهات تريد الترجمة بعد الختم لا قبله؛ اسأل أولاً ثم ترجم.</li>
<li><strong>مترجم غير محلَّف.</strong> النوتر لا يصدّق ترجمة مترجم غير مسجَّل لديه مهما كانت جودتها.</li>
<li><strong>الخلط بين التصديق والمعادلة.</strong> شهادتك الأجنبية لا تصير مقبولة في تركيا بختم تصديق — تحتاج معادلة.</li>
</ol>

<h2>سابعاً: الرسوم والوسطاء</h2>
<p>رسوم النوتر في تركيا <strong>تعرفة رسمية سنوية</strong> لا تخضع للمساومة، وتختلف بحسب نوع الوثيقة وعدد النسخ — فاسأل عن الرسم والمستند بيدك قبل بدء المعاملة. أمّا رسم المعادلة الجامعية فله رقمه المعلن لدى مجلس التعليم العالي، وتفصيله في صفحته.</p>
<p><strong>وتنبيه:</strong> كثير من المكاتب تعرض «إنجاز التصديق» بمبالغ تفوق التعرفة أضعافاً. لا مانع من الاستعانة بمكتب يوفّر عليك التنقّل، لكن اعرف التعرفة الرسمية أولاً كي تعرف ما تدفعه مقابل الخدمة وما تدفعه مقابل جهلك بالرقم.</p>

<p><strong>ملاحظة تحريرية:</strong> الجهات والترتيب أعلاه مبنيّة على القواعد النافذة وقت التحديث، والمرجع النافذ دائماً هو الجهة التي ستستقبل وثيقتك — فاسألها عمّا تطلبه بالضبط قبل أن تبدأ السلسلة. نحدّث هذه الصفحة مع كل تغيير رسمي. — هيئة تحرير دليل العرب</p>$c$;
  id_type    text;
  id_default text;
  cols       text := 'slug, title, category, details, status';
  vals       text := '$1, $2, $3, $4, $5';
  f          record;
  col_type   text;
  applied    text[] := ARRAY[]::text[];
  skipped    text[] := ARRAY[]::text[];
BEGIN
  SELECT c.data_type, c.column_default INTO id_type, id_default
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.table_name = 'articles' AND c.column_name = 'id';

  IF EXISTS (SELECT 1 FROM public.articles WHERE slug = v_slug) THEN
    UPDATE public.articles
    SET title = v_title, category = v_cat, details = v_details, status = 'approved'
    WHERE slug = v_slug;
    RAISE NOTICE 'المقال موجود — حُدِّثت حقوله الأساسية.';
  ELSE
    -- عمود id: إن كان له افتراضي فاتركه له؛ وإن كان uuid فولّد؛ وإن كان نصّياً
    -- فاجعله الـslug (وهو نمط المستودع).
    IF id_default IS NULL AND id_type IS NOT NULL THEN
      IF id_type = 'uuid' THEN
        cols := 'id, ' || cols; vals := 'gen_random_uuid(), ' || vals;
      ELSE
        cols := 'id, ' || cols; vals := '$1, ' || vals;
      END IF;
    END IF;
    EXECUTE format('INSERT INTO public.articles (%s) VALUES (%s)', cols, vals)
      USING v_slug, v_title, v_cat, v_details, 'approved';
    RAISE NOTICE 'المقال أُدرج.';
  END IF;

  -- الحقول النصّية: تُحوَّل إلى نوع العمود الفعلي لا إلى نوع مفترض
  -- (last_update من نوع date، وتمرير نصّ مُعلَّم إليه بلا تحويل يفشل).
  FOR f IN
    SELECT * FROM (VALUES
      ('intro',           $i$تصديق الأوراق في تركيا سلسلة لا إجراء واحد، وترتيبها يقرّر قبول المعاملة أو ردّها. هذه الصفحة تجمع السلسلة كاملة: الفرق بين الترجمة والتصديق والمعادلة، وأين يُختم الأبوستيل الإداري والقضائي، ولماذا لا ينفع الأبوستيل مع سوريا وما البديل.$i$),
      ('excerpt',         $ex$دليل جامع لتصديق الوثائق في تركيا 2026: الترجمة المحلَّفة، تصديق النوتر، الأبوستيل عند الوالي والقائمقام للإداري وفي قصر العدل للقضائي، والمسار القنصلي البديل للدول خارج اتفاقية لاهاي ومنها سوريا.$ex$),
      ('warning',         $w$الأبوستيل لا ينفع لوثيقة متجهة إلى سوريا: سوريا ليست طرفاً في اتفاقية لاهاي بحسب جدول مؤتمر لاهاي المحدَّث في 30 حزيران/يونيو 2026، فالمسار هو التصديق القنصلي المتسلسل. والجهة النافذة دائماً هي التي ستستقبل وثيقتك — اسألها عمّا تطلبه قبل أن تبدأ.$w$),
      ('source',          $src$مؤتمر لاهاي للقانون الدولي الخاص — جدول حالة اتفاقية الأبوستيل: تركيا طرف منذ 1985، وسوريا غير مدرجة$src$),
      ('seo_title',       $st$تصديق الوثائق والشهادات في تركيا 2026: الترجمة والنوتر والأبوستيل$st$),
      ('seo_description', $sd$كيف تصدّق شهادتك أو وثيقتك في تركيا خطوة بخطوة: الترجمة المحلَّفة، تصديق النوتر، الأبوستيل عند الوالي والقائمقام للوثائق الإدارية وفي قصر العدل للقضائية، والفرق بين التصديق والمعادلة، والمسار البديل لسوريا.$sd$),
      ('last_update',     '2026-08-21'),
      ('published_at',    '2026-08-21')
    ) AS t(col, val)
  LOOP
    SELECT pg_catalog.format_type(a.atttypid, a.atttypmod) INTO col_type
    FROM pg_attribute a
    WHERE a.attrelid = 'public.articles'::regclass
      AND a.attname = f.col AND a.attnum > 0 AND NOT a.attisdropped;
    IF col_type IS NULL THEN
      skipped := skipped || f.col; CONTINUE;
    END IF;
    EXECUTE format('UPDATE public.articles SET %I = $1::%s WHERE slug = $2', f.col, col_type)
      USING f.val, v_slug;
    applied := applied || f.col;
  END LOOP;

  -- حقول المصفوفات
  FOR f IN
    SELECT * FROM (VALUES
      ('steps', ARRAY[
        $s1$اسأل الجهة التي ستستقبل وثيقتك عمّا تطلبه بالضبط: ترجمة؟ أبوستيل؟ تصديق قنصلي؟ ابدأ من هنا لا من النوتر.$s1$,
        $s2$استخرج الوثيقة الأصلية من جهتها المُصدِرة: الجامعة أو مديرية التربية أو النفوس أو المحكمة.$s2$,
        $s3$ترجمها لدى مترجم محلَّف مسجَّل عند النوتر، ثم صدّق الترجمة لدى النوتر.$s3$,
        $s4$اختم الأبوستيل: الوثائق الإدارية عند الوالي أو القائمقام، والقضائية في قصر العدل.$s4$,
        $s5$إن كانت الدولة المستقبِلة خارج اتفاقية لاهاي — ومنها سوريا — فاسلك التصديق القنصلي المتسلسل بدل الأبوستيل.$s5$
      ]::text[]),
      ('documents', ARRAY[
        $d1$الوثيقة الأصلية من جهتها المُصدِرة$d1$,
        $d2$بطاقة الهوية أو الكملك أو الإقامة$d2$,
        $d3$ترجمة من مترجم محلَّف عند الحاجة$d3$,
        $d4$وكالة موثّقة إن كان غيرك ينجز المعاملة$d4$
      ]::text[]),
      ('tips', ARRAY[
        $p1$الأبوستيل ختم واحد يغني عن سلسلة — لكن للدول الأطراف في اتفاقية لاهاي فقط.$p1$,
        $p2$الإداري عند الوالي والقائمقام، والقضائي في قصر العدل — والخلط بينهما يوم ضائع.$p2$,
        $p3$التصديق يثبت صحّة التوقيع، والمعادلة تعترف بالمضمون. لا يُغني أحدهما عن الآخر.$p3$,
        $p4$رسوم النوتر تعرفة رسمية لا مساومة — اسأل عن الرسم والمستند بيدك.$p4$,
        $p5$لا تترجم قبل أن تعرف هل تريد الجهة المستقبِلة الترجمة قبل الختم أم بعده.$p5$
      ]::text[]),
      ('tags',         ARRAY['دليل','تصديق الوثائق','أبوستيل','النوتر','معادلة','معاملات رسمية']::text[]),
      ('seo_keywords', ARRAY['تصديق الوثائق في تركيا','تصديق الشهادات التركية','الأبوستيل في تركيا','تصديق شهادة جامعية تركيا','الترجمة المحلفة','الفرق بين التصديق والمعادلة','تصديق أوراق إلى سوريا']::text[])
    ) AS t(col, val)
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns c
               WHERE c.table_schema='public' AND c.table_name='articles' AND c.column_name=f.col) THEN
      EXECUTE format('UPDATE public.articles SET %I = $1 WHERE slug = $2', f.col) USING f.val, v_slug;
      applied := applied || f.col;
    ELSE
      skipped := skipped || f.col;
    END IF;
  END LOOP;

  -- المستودع استعمل is_active تاريخياً وقد يكون الاسم الحالي active.
  FOR f IN SELECT * FROM (VALUES ('is_active'), ('active')) AS t(col)
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns c
               WHERE c.table_schema='public' AND c.table_name='articles' AND c.column_name=f.col) THEN
      EXECUTE format('UPDATE public.articles SET %I = true WHERE slug = $1', f.col) USING v_slug;
    END IF;
  END LOOP;

  RAISE NOTICE 'حقول مضبوطة: %', array_to_string(applied, ', ');
  IF array_length(skipped, 1) > 0 THEN
    RAISE NOTICE 'حقول متخطّاة: %', array_to_string(skipped, ', ');
  END IF;
END
$art$;

-- ─── الروابط الداخلية: تُضاف ثم يُنزَع الميت منها بحالة القاعدة الآن ─────────
UPDATE public.articles
SET details = public.strip_dead_article_links(details || $link$

<h2>التفاصيل الكاملة لكل محطّة</h2>
<ul>
<li><a href="/article/identity-apostille-kaymakam-valilik">الأبوستيل في تركيا: الإداري عند الوالي والقائمقام والقضائي في قصر العدل</a></li>
<li><a href="/article/notary-fees">النوتر في تركيا: التعرفة الرسمية والمترجم المحلَّف وكيف تجد أقربه</a></li>
<li><a href="/article/document-attestation-turkey-to-syria-students-2026">تصديق الشهادات والأوراق من تركيا إلى سوريا: المسار كاملاً</a></li>
<li><a href="/article/diploma-denklik-syrians-arabs-2026">معادلة الشهادات الجامعية لدى مجلس التعليم العالي</a></li>
<li><a href="/article/high-school-equivalency-turkey-2026">معادلة الشهادة الثانوية لدى وزارة التربية</a></li>
<li><a href="/article/family-register-foreign-marriage">تثبيت الزواج المعقود خارج تركيا: سلسلة التصديق الصحيحة</a></li>
</ul>$link$)
WHERE slug = 'document-attestation-turkey-2026'
  AND details NOT LIKE '%التفاصيل الكاملة لكل محطّة%';

-- ─── روابط عائدة من صفحات العنقود إلى الصفحة الأمّ ──────────────────────────
UPDATE public.articles
SET details = details || $back$
<p><strong>الصورة الكاملة:</strong> <a href="/article/document-attestation-turkey-2026">تصديق الوثائق والشهادات في تركيا — السلسلة كاملة من الترجمة إلى الأبوستيل</a></p>$back$
WHERE slug IN ('identity-apostille-kaymakam-valilik', 'notary-fees',
               'document-attestation-turkey-to-syria-students-2026',
               'diploma-denklik-syrians-arabs-2026', 'high-school-equivalency-turkey-2026')
  AND status = 'approved'
  AND details NOT LIKE '%document-attestation-turkey-2026%';

DO $check$
DECLARE n integer; n_back integer; n_len integer;
BEGIN
  SELECT COUNT(*) INTO n FROM public.articles
   WHERE slug = 'document-attestation-turkey-2026' AND status = 'approved';
  IF n <> 1 THEN
    RAISE EXCEPTION 'FAILED: hub article not present as approved (found %)', n;
  END IF;

  SELECT length(regexp_replace(details, '<[^>]+>', '', 'g')) INTO n_len
    FROM public.articles WHERE slug = 'document-attestation-turkey-2026';
  IF n_len < 4000 THEN
    RAISE EXCEPTION 'FAILED: hub body only % visible chars — too thin to compete', n_len;
  END IF;
  RAISE NOTICE 'الصفحة الأمّ: % حرفاً مرئياً.', n_len;

  SELECT COUNT(*) INTO n_back FROM public.articles
   WHERE details LIKE '%/article/document-attestation-turkey-2026%' AND status = 'approved';
  RAISE NOTICE 'صفحات تشير إلى الأمّ: %', n_back;
  RAISE NOTICE 'OK';
END
$check$;

SELECT slug, status, last_update,
       length(regexp_replace(details, '<[^>]+>', '', 'g')) AS visible_chars
  FROM public.articles
 WHERE slug = 'document-attestation-turkey-2026';
