-- ============================================================================
-- مقال جامع: كل ما يخصّ سيارتك في تركيا 2026 (2026-08-17)
--
-- لماذا مقال جامع لا مقال جديد: المستودع فيه ~25 مقالاً عن السيارات (الرخصة،
-- النوتر، الفحص، HGS، المعاينة، النقاط السوداء، لوحات MA…). الناقص ليس مقالاً
-- آخر بل **خريطة**: صفحة واحدة تجيب «ماذا عليّ أن أعرف وأدفع ومتى؟» وتحيل إلى
-- التفاصيل. فهذا المقال هبٌّ (hub) بأرقام 2026 محقَّقة، لا تكرارٌ لما هو موجود.
--
-- المصادر (تحقّقت هيئة التحرير منها يوم 2026-08-17):
--   * وزارة الداخلية التركية — تمديد مهلة الخصم 25% من 15 يوماً إلى شهر:
--     https://www.icisleri.gov.tr/trafik-idari-para-cezalarinin-indirimli-odeme-suresi-bir-aya-uzatildi
--   * وكالة الأناضول (خطّ التحقّق) — نفي ادّعاء «السوريون يشترون سيارات بلا ضرائب»:
--     https://www.aa.com.tr/tr/teyithatti/aktuel/suriyeliler-vergisiz-otomobil-aliyor-iddiasi/1818549
--   * المديرية العامة للطرق (KGM) — بوابة الاستعلام عن مخالفات العبور:
--     https://webihlaltakip.kgm.gov.tr/WebIhlalSorgulama/Sayfalar/Sorgulama.aspx
--   * مركز معلومات ومراقبة التأمين (SBM) — استعلام البوليصة وسجل الأضرار TRAMER:
--     https://www.sbm.org.tr/
--   * رئاسة إدارة الإيرادات (GİB) — MTV والدفع: https://dijital.gib.gov.tr/
--   * TÜVTÜRK — دورات المعاينة والرسوم: https://www.tuvturk.com.tr/
--   * أرقام العقوبات 2026 مقابَلة بين تغطيات تركية متعدّدة (Allianz، DenizBank،
--     HDI، sigortam.net) واتُّفق على المتطابق منها فقط.
--
-- ── ما صُحِّح صراحةً في المتن ────────────────────────────────────────────────
--   1) «خصم 25% خلال 15 يوماً» — قديم. اللائحة الصادرة 31.01.2024 مدّت المهلة
--      إلى **شهر**، ووزارة الداخلية تنشره على موقعها. وأكثر المواقع التجارية
--      التركية ما زالت تكتب 15 يوماً حتى اليوم، فيخسر القارئ الخصم أو يظنّه
--      ضاع وهو باقٍ.
--   2) «السوريون يشترون سيارات بلا ضرائب» — نفته وكالة الأناضول: حامل الحماية
--      المؤقتة يدفع ÖTV وMTV ورسوم المعاينة كالمواطن التركي تماماً، ولا إعفاء.
--   3) الرابط الذي وصلنا (وسيط تأميني تجاري يستعلم برقم الرخصة) وُضع في سياقه:
--      قناة **شراء** عروض، لا قناة رسمية للتحقّق من وجود بوليصة. الرسمي:
--      e-Devlet، ورسالة TRAFIK <اللوحة> إلى 5664، وSBM.
--
-- ── الروابط الداخلية ────────────────────────────────────────────────────────
-- scripts/_article-corpus.json لقطة قديمة لا مصدر حقيقة. فبدل الرجاء أن تكون
-- الـslugs موجودة، يُنشئ هذا الملف دالة strip_dead_article_links() تُزيل أي
-- رابط داخلي بلا مقال معتمَد وتُبقي نصّه — فلا 404 يصل قارئاً، ولا يفشل المقال
-- لأن مقالاً آخر مفقود.
--
-- idempotent: ON CONFLICT (id) DO UPDATE.
-- ============================================================================

-- ─── 0) أداة عامة: نزع الروابط الداخلية الميتة ──────────────────────────────
-- تُستعمل هنا وفي كل مقال قادم. لا تلمس الروابط الخارجية ولا السليمة.
CREATE OR REPLACE FUNCTION public.strip_dead_article_links(p_html text)
RETURNS text
LANGUAGE plpgsql
AS $fn$
DECLARE
  out_html text := p_html;
  bad      text;
  esc      text;
BEGIN
  IF out_html IS NULL THEN RETURN NULL; END IF;

  FOR bad IN
    SELECT DISTINCT m[1]
    FROM regexp_matches(p_html, 'href="/article/([^"]+)"', 'g') AS m
    WHERE NOT EXISTS (
      SELECT 1 FROM public.articles a
      WHERE a.slug = m[1] AND a.status = 'approved'
    )
  LOOP
    -- الـslug قد يحمل محارف لها معنى في التعابير النمطية (نقطة، أقواس) —
    -- تُهرَّب قبل الاستعمال بدل الثقة بأنها لن ترد.
    esc := regexp_replace(bad, '([.^$*+?()\[\]{}|\\])', '\\\1', 'g');
    -- [^>]*? لا [^>]* : في Postgres يحدّد **أوّل** مُكمِّم جشعَ التعبير كلّه،
    -- فمُكمِّم جشع في المقدّمة يُبطل كسل .*? بعده ويبتلع حتى آخر </a> في
    -- الصفحة. درسٌ دُفع ثمنه في تعديل سابق.
    out_html := regexp_replace(
      out_html,
      '<a href="/article/' || esc || '"[^>]*?>(.*?)</a>',
      '\1', 'gs');
    RAISE NOTICE 'نُزع رابط داخلي بلا مقال معتمَد: /article/%', bad;
  END LOOP;

  RETURN out_html;
END
$fn$;

COMMENT ON FUNCTION public.strip_dead_article_links(text) IS
  'تُزيل من متن HTML أي رابط /article/<slug> لا يقابله مقال معتمَد، وتُبقي نصّ الرابط. استعملها على كل متن قبل الإدراج بدل الاعتماد على لقطة الـcorpus.';

-- ─── 1) المقال ──────────────────────────────────────────────────────────────
INSERT INTO public.articles (
  id, slug, title, category, intro, details, steps, documents, tips,
  fees, warning, source, last_update, status, is_active
) VALUES (
  'car-in-turkey-complete-guide-2026',
  'car-in-turkey-complete-guide-2026',
  $t$سيارتك في تركيا 2026: التأمين والمخالفات والطرق السريعة والمعاينة — الدليل الجامع بالأرقام الرسمية$t$,
  $g$المرور والسيارات$g$,
  $i$خريطة واحدة لكل ما يخصّ سيارتك في تركيا: ما هو إلزامي وما هو اختياري، وكم يكلّف في 2026، ومن أين تستعلم وتدفع رسمياً. مع تصحيح خطأين شائعين: مهلة خصم المخالفات صارت شهراً لا 15 يوماً، وحامل الكملك يدفع ضرائب السيارة كالمواطن التركي تماماً.$i$,
  $c$<p>امتلاك سيارة في تركيا ليس معاملةً واحدة، بل <strong>خمس التزامات متوازية</strong> لكلٍّ منها موعدٌ وجهةٌ وغرامةٌ مختلفة: التأمين الإلزامي، والضريبة السنوية (MTV)، والمعاينة الدورية، ورسوم الطرق (HGS)، والمخالفات. من يعرف الخمسة يدفع أقلّ ممّن يكتشفها واحدةً واحدةً عند نقطة تفتيش.</p>

<p>هذه الصفحة خريطةٌ لا شرحٌ مفصّل: تعطيك الرقم والموعد والبوابة الرسمية، وتحيلك إلى الشرح المفصّل عند كل بند.</p>

<h2>🔖 البوابات الأربع التي تحفظها</h2>
<div style="background:#eff6ff;border-right:4px solid #2563eb;padding:14px 18px;margin:14px 0;border-radius:8px;">
<ul style="margin:0;padding-right:24px;line-height:2;">
<li><strong>e-Devlet</strong> — <code>turkiye.gov.tr</code>: المخالفات، السيارات المسجّلة باسمك، بوليصة التأمين وسجلّ الأضرار، نقاط رخصتك.</li>
<li><strong>الإيرادات الرقمية</strong> — <code>dijital.gib.gov.tr</code>: ضريبة MTV والدفع.</li>
<li><strong>المديرية العامة للطرق</strong> — <code>webihlaltakip.kgm.gov.tr</code>: مخالفات عبور الطرق والجسور.</li>
<li><strong>مركز معلومات التأمين SBM</strong> — <code>sbm.org.tr</code>: هل لسيارتك بوليصة سارية؟ وسجلّ TRAMER للأضرار.</li>
</ul>
</div>

<h2>1️⃣ التأمين: إلزامي واحد واختياري واحد</h2>
<p><strong>تأمين المرور الإلزامي (Zorunlu Trafik Sigortası)</strong> يغطّي الضرر الذي تُلحقه <strong>بالآخرين</strong> — لا بسيارتك. وهو إلزامي بقانون المرور 2918، وبدونه:</p>
<ul>
<li>غرامة <strong>1,246 ليرة</strong> (2026).</li>
<li>و<strong>منع السيارة من السير</strong> (trafikten men) — تُحجز حتى تُؤمّن، وهذا أثقل من الغرامة نفسها.</li>
</ul>

<p><strong>التأمين الشامل (Kasko)</strong> اختياري ويغطّي <strong>سيارتك أنت</strong>: السرقة، الحريق، الصدم، الطبيعة. لا يعوّضك تأمين المرور عن سيارتك إن كنت المخطئ — وهذا أكثر ما يُفاجئ أصحاب السيارات أول مرّة.</p>

<h3>كيف تعرف إن كان لسيارتك تأمين ساري؟ — القنوات الرسمية</h3>
<ul>
<li><strong>رسالة نصّية:</strong> أرسل <code>TRAFIK &lt;رقم اللوحة&gt;</code> إلى <strong>5664</strong>.</li>
<li><strong>e-Devlet:</strong> خدمة «Trafik Poliçe ve Hasar Bilgileri Sorgulama».</li>
<li><strong>SBM:</strong> عبر <code>sbm.org.tr</code> — وهو المرجع الذي تُغذّيه شركات التأمين كلّها.</li>
</ul>

<div style="background:#fef2f2;border:2px solid #dc2626;padding:16px 18px;margin:16px 0;border-radius:12px;">
<p style="margin:0 0 8px;font-weight:bold;color:#991b1b;">⚠️ فرّق بين «أشتري بوليصة» و«أتحقّق من وجودها»</p>
<p style="margin:0;color:#7f1d1d;line-height:1.8;">تنتشر مواقع تطلب <strong>بيانات رخصة سيارتك (ruhsat)</strong> لتعرض عليك أسعار تأمين. أكثرها وسطاء تجاريون مرخّصون، وبعضها ليس كذلك. الوسيط قناة <strong>شراء</strong> عروض، وليس جهةً رسمية للتحقّق. فإن أردت أن تعرف <strong>هل لسيارتك تأمين</strong> فاستعمل e-Devlet أو 5664 أو SBM — مجاناً وبلا إدخال بياناتك في موقع تجاري. وإن أردت الشراء فقارن، واشترِ من شركة تأمين أو وكيل مرخّص، وتأكّد أن البوليصة ظهرت في SBM بعد الدفع. <strong>البوليصة التي لا تظهر في SBM غير موجودة.</strong></p>
</div>

<h2>2️⃣ المخالفات: القاعدة التي تُوفّر عليك ربع المبلغ</h2>
<div style="background:#ecfdf5;border:2px solid #10b981;padding:16px 18px;margin:16px 0;border-radius:12px;">
<p style="margin:0 0 8px;font-weight:bold;color:#065f46;">✅ خصم 25% — والمهلة <u>شهر</u> لا 15 يوماً</p>
<p style="margin:0;color:#064e3b;line-height:1.8;">إن دفعت الغرامة خلال <strong>شهر</strong> من تاريخ تبليغك، تدفع <strong>75% فقط</strong>. المهلة كانت 15 يوماً، ومُدّت إلى شهر بلائحة صادرة في 31 كانون الثاني/يناير 2024، ووزارة الداخلية التركية تنشر ذلك على موقعها. ومع ذلك <strong>ما زالت أكثر المواقع التجارية التركية تكتب «15 يوماً»</strong> — فمن يقرأها يظنّ الخصم ضاع وهو باقٍ، أو يتعجّل بلا داعٍ. تحقّق من التاريخ في ورقة التبليغ لا من مقالٍ على الإنترنت.</p>
</div>

<p><strong>وإن تأخّرت:</strong> تُضاف غرامة تأخير شهرية (نحو <strong>3.7% شهرياً</strong> في 2026) على المبلغ الأصلي، وتتراكم. والمخالفة غير المدفوعة تعترض معاملات لاحقة: نقل الملكية والمعاينة قد يتعطّلان بسببها.</p>

<p><strong>الاستعلام والدفع:</strong> عبر e-Devlet برقم اللوحة أو رقم هويتك، أو عبر <code>dijital.gib.gov.tr</code>، أو من البنك. و<strong>الاعتراض</strong> يُقدَّم أمام محكمة الصلح الجزائية (Sulh Ceza Hakimliği) خلال المهلة المذكورة في التبليغ — وإن قُبل أُلغيت الغرامة ورُدّ ما دفعت.</p>

<h3>عقوبات 2026 — أرقام مقابَلة</h3>
<div style="overflow-x:auto;">
<table style="width:100%;border-collapse:collapse;font-size:14px;">
<thead><tr style="background:#1e293b;color:#fff;">
<th style="padding:10px;text-align:right;border:1px solid #334155;">المخالفة</th>
<th style="padding:10px;text-align:center;border:1px solid #334155;">الغرامة (ليرة)</th>
<th style="padding:10px;text-align:right;border:1px solid #334155;">ملاحظة</th>
</tr></thead>
<tbody>
<tr><td style="padding:9px;border:1px solid #cbd5e1;">قيادة بلا تأمين إلزامي</td><td style="padding:9px;text-align:center;border:1px solid #cbd5e1;font-weight:bold;">1,246</td><td style="padding:9px;border:1px solid #cbd5e1;">+ منع السيارة من السير</td></tr>
<tr style="background:#f8fafc;"><td style="padding:9px;border:1px solid #cbd5e1;">عدم ربط حزام الأمان</td><td style="padding:9px;text-align:center;border:1px solid #cbd5e1;font-weight:bold;">1,245</td><td style="padding:9px;border:1px solid #cbd5e1;">تشمل الراكب أيضاً</td></tr>
<tr><td style="padding:9px;border:1px solid #cbd5e1;">قيادة بلا معاينة سارية</td><td style="padding:9px;text-align:center;border:1px solid #cbd5e1;font-weight:bold;">2,717</td><td style="padding:9px;border:1px solid #cbd5e1;">يوم تأخير واحد يكفي</td></tr>
<tr style="background:#f8fafc;"><td style="padding:9px;border:1px solid #cbd5e1;">استعمال الهاتف أثناء القيادة</td><td style="padding:9px;text-align:center;border:1px solid #cbd5e1;font-weight:bold;">2,719</td><td style="padding:9px;border:1px solid #cbd5e1;">—</td></tr>
<tr><td style="padding:9px;border:1px solid #cbd5e1;">تجاوز الإشارة الحمراء</td><td style="padding:9px;text-align:center;border:1px solid #cbd5e1;font-weight:bold;">2,719</td><td style="padding:9px;border:1px solid #cbd5e1;">+ نقاط عقوبة</td></tr>
<tr style="background:#f8fafc;"><td style="padding:9px;border:1px solid #cbd5e1;">تجاوز السرعة حتى 30%</td><td style="padding:9px;text-align:center;border:1px solid #cbd5e1;font-weight:bold;">2,719</td><td style="padding:9px;border:1px solid #cbd5e1;">رادار</td></tr>
<tr><td style="padding:9px;border:1px solid #cbd5e1;">تجاوز السرعة حتى 50%</td><td style="padding:9px;text-align:center;border:1px solid #cbd5e1;font-weight:bold;">5,662</td><td style="padding:9px;border:1px solid #cbd5e1;">تتضاعف بالتكرار</td></tr>
<tr style="background:#fef2f2;"><td style="padding:9px;border:1px solid #cbd5e1;">القيادة تحت تأثير الكحول — أول مرّة</td><td style="padding:9px;text-align:center;border:1px solid #cbd5e1;font-weight:bold;color:#dc2626;">11,632</td><td style="padding:9px;border:1px solid #cbd5e1;">+ سحب الرخصة 6 أشهر</td></tr>
<tr style="background:#fef2f2;"><td style="padding:9px;border:1px solid #cbd5e1;">— ثاني مرّة</td><td style="padding:9px;text-align:center;border:1px solid #cbd5e1;font-weight:bold;color:#dc2626;">14,583</td><td style="padding:9px;border:1px solid #cbd5e1;">+ سحب سنتين</td></tr>
<tr style="background:#fef2f2;"><td style="padding:9px;border:1px solid #cbd5e1;">— ثالث مرّة وما بعدها</td><td style="padding:9px;text-align:center;border:1px solid #cbd5e1;font-weight:bold;color:#dc2626;">23,442</td><td style="padding:9px;border:1px solid #cbd5e1;">+ <strong>إلغاء الرخصة</strong></td></tr>
</tbody>
</table>
</div>
<p style="font-size:13px;color:#64748b;">الأرقام للسيارات الخاصّة، وتُراجَع سنوياً بمعدّل إعادة التقييم. الرقم النافذ هو المكتوب في ورقة التبليغ لا في هذا الجدول.</p>

<h2>3️⃣ الطرق السريعة والجسور (HGS): المهلة أهمّ من الرسم</h2>
<p>الطرق والجسور المأجورة تعمل بالشارة الإلكترونية <strong>HGS</strong>. الخطر ليس في رسم العبور — بل في تركه بلا دفع، لأن الغرامة <strong>تتضاعف بالوقت</strong>:</p>
<div style="background:#fffbeb;border-right:4px solid #f59e0b;padding:14px 18px;margin:14px 0;border-radius:8px;">
<ul style="margin:0;padding-right:24px;line-height:2;">
<li><strong>خلال 15 يوماً</strong> من العبور: تدفع الرسم فقط — <strong>بلا غرامة</strong>.</li>
<li><strong>من اليوم 16 إلى 45:</strong> الرسم + <strong>مِثله غرامةً</strong> (ضعف).</li>
<li><strong>بعد اليوم 45:</strong> الرسم + <strong>أربعة أمثاله</strong>.</li>
</ul>
</div>
<p>ولهذا القاعدة العملية: <strong>راقب رصيد الشارة قبل كل سفر طويل</strong>، واستعلم بعد أي رحلة على <code>webihlaltakip.kgm.gov.tr</code> برقم اللوحة. عبور واحد برصيد صفر يكلّفك خمسة أمثال إن نسيته 45 يوماً.</p>

<h2>4️⃣ المعاينة الدورية (TÜVTÜRK)</h2>
<ul>
<li><strong>الدورة:</strong> السيارة الخاصّة تُعايَن أول مرّة <strong>بعد 3 سنوات</strong> من أول تسجيل، ثم <strong>كل سنتين</strong>.</li>
<li><strong>الرسوم 2026:</strong> نحو <strong>3,288 ليرة</strong> للمعاينة + <strong>460 ليرة</strong> لقياس العادم ≈ <strong>4,110 ليرة</strong> إجمالاً.</li>
<li><strong>التأخير:</strong> يُضاف نحو <strong>5% شهرياً</strong> على رسم المعاينة، <strong>ويُغرَّم</strong> من يقود بلا معاينة سارية بـ<strong>2,717 ليرة</strong> — ويوم واحد تأخير يكفي.</li>
</ul>
<p>احجز موعدك مسبقاً؛ الوقوف على الطابور بلا موعد قد يستهلك يومك، والمواعيد تضيق في نهايات الأشهر.</p>

<h2>5️⃣ ضريبة السيارة السنوية (MTV)</h2>
<p>تُدفع على <strong>قسطين</strong>: الأول حتى <strong>31 كانون الثاني/يناير</strong>، والثاني في <strong>تموز/يوليو</strong>. تُحسَب بحسب عمر السيارة وسعة محرّكها وقيمتها، وتُدفع عبر <code>dijital.gib.gov.tr</code> أو e-Devlet أو البنك.</p>
<p><strong>التأخير يُنتج غرامة تأخير شهرية</strong>، والأهمّ: <strong>دَين MTV يعطّل معاملاتك</strong> — نقل الملكية والمعاينة قد يتوقّفا حتى تسدّده. فاجعل تسديدها أول ما تفعله في كانون الثاني وتموز.</p>

<h2>6️⃣ الشراء والبيع ونقل الملكية</h2>
<p>نقل ملكية السيارة يتمّ <strong>في النوتر (كاتب العدل)</strong> ويُسجَّل فورياً. وتغيّر مهمّ في 2026: <strong>أُلغي نظام الرسم الثابت لبيع السيارات في النوتر، وصار الرسم نسبياً يُحسب على سعر البيع المعلَن</strong> — أي أن كلفة النوتر لسيارة غالية صارت أعلى بكثير من قبل. اسأل النوتر عن الرقم قبل الموعد لا بعده.</p>
<p><strong>ولا تشترِ مستعملة بلا فحص خبرة (ekspertiz)</strong>: كلفته أقلّ بكثير من عطبٍ واحد مخفيّ، وتقريره يكشف الحوادث المُصلَحة. وقبل الشراء استعلم عن <strong>سجلّ الأضرار (TRAMER)</strong> عبر SBM، وعن أي دَين أو حجز على السيارة.</p>

<h2>7️⃣ للسوريين والأجانب — ثلاث نقاط تُغني عن أسئلة كثيرة</h2>
<div style="background:#f0fdf4;border:2px solid #16a34a;padding:16px 18px;margin:16px 0;border-radius:12px;">
<p style="margin:0 0 10px;"><strong>1. هل يستطيع حامل الكملك شراء سيارة وتسجيلها؟</strong> نعم، بالإجراءات نفسها: هوية سارية، ورقم ضريبي، والتسجيل في النوعية والمرور.</p>
<p style="margin:0 0 10px;"><strong>2. تصحيح ادّعاء متداوَل:</strong> يُقال إن «السوريين يشترون سيارات بلا ضرائب». <strong>هذا غير صحيح</strong> — نفته وكالة أنباء الأناضول عبر خطّ التحقّق: حامل الحماية المؤقتة يدفع <strong>ضريبة الاستهلاك الخاصّ (ÖTV) وضريبة MTV ورسوم المعاينة</strong> كالمواطن التركي تماماً، <strong>ولا إعفاء ولا استثناء</strong>. من يعرض عليك «سيارة بلا ضريبة لأنك سوري» فهو يبيعك مشكلة قانونية لا سيارة.</p>
<p style="margin:0;"><strong>3. اللوحات الأجنبية (MA-MZ) لا تُنقل ملكيتها داخل تركيا</strong> — لأنها دخلت بنظام الإدخال المؤقّت. لا يمكن لمقيم أن يشتري سيارة بلوحة أجنبية غير مُخلَّصة؛ يجب أن تُستورد نهائياً وتُخلَّص جمركياً أولاً وتأخذ لوحة تركية. وكثيرٌ من «العروض المغرية» بلوحة أجنبية تنتهي بحجز السيارة على الحدود أو غرامة جمركية.</p>
</div>

<h2>⚠️ خمسة أخطاء تكلّف مالاً</h2>
<ol style="line-height:2;">
<li><strong>الاعتماد على «15 يوماً» لخصم المخالفة.</strong> المهلة شهر — راجع ورقة التبليغ.</li>
<li><strong>الظنّ أن تأمين المرور يغطّي سيارتك.</strong> يغطّي الآخرين فقط؛ سيارتك تحتاج Kasko.</li>
<li><strong>ترك عبور HGS بلا دفع.</strong> 15 يوماً بلا غرامة، ثم ضعف، ثم خمسة أمثال.</li>
<li><strong>تأجيل المعاينة «أسبوعاً واحداً».</strong> يوم تأخير = غرامة 2,717 ليرة إن أُوقفت.</li>
<li><strong>شراء بلا فحص خبرة وبلا استعلام TRAMER.</strong> الحوادث المُصلَحة لا تُرى بالعين.</li>
</ol>

<p><strong>ملاحظة تحريرية:</strong> الأرقام أعلاه هي المعلنة لعام 2026 وتُراجَع سنوياً بمعدّل إعادة التقييم، وبعضها يختلف بحسب نوع المركبة. المرجع النافذ دائماً هو ورقة التبليغ أو البوابة الرسمية، لا هذه الصفحة. نحدّثها مع كل تعديل رسمي. — هيئة تحرير دليل العرب</p>$c$,
  ARRAY[
    $s1$تحقّق أولاً من الأساسيات الثلاثة لسيارتك مجاناً: أرسل TRAFIK ورقم لوحتك إلى 5664 لمعرفة إن كان التأمين سارياً، وافتح e-Devlet للمخالفات والسيارات المسجّلة باسمك، وwebihlaltakip.kgm.gov.tr لمخالفات الطرق.$s1$,
    $s2$سدّد أي مخالفة قائمة خلال شهر من تاريخ التبليغ لتدفع 75% فقط. تاريخ التبليغ هو المرجع لا تاريخ المخالفة.$s2$,
    $s3$افتح dijital.gib.gov.tr وتحقّق من دَين MTV. القسط الأول حتى 31 كانون الثاني والثاني في تموز — والدَين يعطّل نقل الملكية والمعاينة.$s3$,
    $s4$اعرف موعد معاينتك القادم: أول معاينة بعد 3 سنوات من التسجيل ثم كل سنتين. احجز موعد TÜVTÜRK مسبقاً، وميزانيتها نحو 4,110 ليرة في 2026.$s4$,
    $s5$اشحن شارة HGS قبل أي سفر طويل، واستعلم بعد الرحلة. الدفع خلال 15 يوماً يُلغي الغرامة كاملةً.$s5$,
    $s6$قبل شراء أي سيارة مستعملة: فحص خبرة (ekspertiz) + استعلام سجلّ الأضرار TRAMER عبر SBM + التأكّد من خلوّها من دَين أو حجز، ثم النوتر — واسأل عن رسم النوتر مسبقاً فهو نسبيّ على سعر البيع منذ 2026.$s6$
  ],
  ARRAY[
    $d1$رخصة السيارة (Araç Ruhsatı)$d1$,
    $d2$بطاقة الهوية أو الكملك أو الإقامة$d2$,
    $d3$الرقم الضريبي (Vergi Numarası)$d3$,
    $d4$رخصة قيادة سارية معترف بها$d4$,
    $d5$بوليصة تأمين المرور الإلزامي$d5$,
    $d6$تقرير المعاينة الدورية الساري$d6$
  ],
  ARRAY[
    $p1$خصم 25% على المخالفة متاح خلال شهر من التبليغ — لا 15 يوماً كما يشيع.$p1$,
    $p2$البوليصة التي لا تظهر في SBM غير موجودة. تحقّق بعد أي شراء تأمين.$p2$,
    $p3$عبور HGS واحد منسيّ 45 يوماً يكلّفك خمسة أمثال رسمه.$p3$,
    $p4$دَين MTV أو مخالفة قائمة قد يعطّل نقل الملكية والمعاينة — سدّد قبل أن تحتاج المعاملة.$p4$,
    $p5$رسم النوتر لبيع السيارات صار نسبياً على سعر البيع منذ 2026 لا ثابتاً — اسأل قبل الموعد.$p5$
  ],
  $f$أرقام 2026: قيادة بلا تأمين إلزامي 1,246 ليرة + منع السيارة من السير · بلا معاينة 2,717 · الهاتف أثناء القيادة 2,719 · الإشارة الحمراء 2,719 · السرعة حتى 30% 2,719 وحتى 50% 5,662 · الكحول 11,632 ثم 14,583 ثم 23,442 مع إلغاء الرخصة. المعاينة الدورية نحو 3,288 + 460 للعادم ≈ 4,110. خصم 25% عند الدفع خلال شهر من التبليغ، وغرامة تأخير نحو 3.7% شهرياً.$f$,
  $w$الأرقام معلنة لعام 2026 وتُراجَع سنوياً بمعدّل إعادة التقييم، وتختلف بحسب نوع المركبة. المرجع النافذ هو ورقة التبليغ أو البوابة الرسمية لا هذه الصفحة. وتنبيه خاصّ: المواقع التي تطلب بيانات رخصة سيارتك لعرض أسعار تأمين هي وسطاء تجاريون؛ للتحقّق من وجود بوليصة استعمل e-Devlet أو 5664 أو SBM مجاناً.$w$,
  $src$وزارة الداخلية التركية (تمديد مهلة الخصم إلى شهر) · المديرية العامة للطرق KGM · مركز معلومات ومراقبة التأمين SBM · رئاسة الإيرادات GİB · TÜVTÜRK · وكالة الأناضول — خطّ التحقّق (نفي ادّعاء الإعفاء الضريبي للسوريين)$src$,
  '2026-08-17',
  'approved',
  true
)
ON CONFLICT (id) DO UPDATE SET
  slug        = EXCLUDED.slug,
  title       = EXCLUDED.title,
  category    = EXCLUDED.category,
  intro       = EXCLUDED.intro,
  details     = EXCLUDED.details,
  steps       = EXCLUDED.steps,
  documents   = EXCLUDED.documents,
  tips        = EXCLUDED.tips,
  fees        = EXCLUDED.fees,
  warning     = EXCLUDED.warning,
  source      = EXCLUDED.source,
  last_update = EXCLUDED.last_update,
  status      = EXCLUDED.status,
  is_active   = EXCLUDED.is_active;

-- ─── 2) الروابط الداخلية: تُضاف ثم يُنزَع الميت منها ────────────────────────
-- تُضاف بعد الإدراج لا قبله، كي تُقاس صلاحيتها بحالة القاعدة الآن — وليس بلقطة
-- corpus قديمة. أي slug غير موجود يُفقد رابطه ويبقى نصّه.
UPDATE public.articles
SET details = public.strip_dead_article_links(details || $link$

<h2>📚 التفاصيل الكاملة لكل بند</h2>
<div style="background:#f8fafc;border:1px solid #e2e8f0;padding:16px 20px;margin:16px 0;border-radius:8px;">
<ul style="margin:0;padding-right:24px;line-height:2.1;">
<li><a href="/article/auto-insurance-trafik-vs-kasko">التأمين الإلزامي مقابل الشامل: ماذا تختار؟</a></li>
<li><a href="/article/traffic-fines">مخالفات المرور والغرامات: الجدول الكامل</a></li>
<li><a href="/article/edevlet-plaka-ceza">الاستعلام عن المخالفات على سيارتك عبر e-Devlet</a></li>
<li><a href="/article/hgs-highway-toll-system">نظام HGS: الشريحة والرصيد ومخالفة العبور</a></li>
<li><a href="/article/toll-violation-check">معرفة مخالفات الطرق المأجورة ودفعها</a></li>
<li><a href="/article/tuvturk-appointment">حجز موعد معاينة السيارة (TÜVTÜRK)</a></li>
<li><a href="/article/auto-noter-satis-transfer">نقل الملكية في النوتر: ماذا يحدث داخل النوتر؟</a></li>
<li><a href="/article/auto-ekspertiz-guide">فحص الخبرة (Ekspertiz) قبل شراء مستعملة</a></li>
<li><a href="/article/car-registration">تسجيل وشراء سيارة في تركيا للأجانب</a></li>
<li><a href="/article/auto-plates-foreigner-m-plaka">اللوحات التركية مقابل لوحات الأجانب (MA-MZ)</a></li>
<li><a href="/article/185-days-foreign-plated-car-turkey-2026">شرط الـ185 يوماً لإدخال السيارات بلوحة أجنبية</a></li>
<li><a href="/article/auto-license-suspension-points-alcohol">النقاط السوداء وسحب الرخصة والكحول</a></li>
<li><a href="/article/license-conversion-arab-countries-2026">تحويل رخصة القيادة الأجنبية إلى تركية</a></li>
<li><a href="/article/auto-ehliyet-new-from-zero">استخراج رخصة تركية من الصفر</a></li>
</ul>
</div>$link$)
WHERE slug = 'car-in-turkey-complete-guide-2026'
  AND position('التفاصيل الكاملة لكل بند' in details) = 0;

-- ─── 3) الوسوم (إن كان العمود موجوداً) ──────────────────────────────────────
-- ديناميكي عمداً: عمود tags قد لا يكون موجوداً في كل بيئة، وغيابه يجب أن
-- يُتخطّى لا أن يُسقط المقال كلَّه.
DO $tags$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = 'articles' AND c.column_name = 'tags'
  ) THEN
    EXECUTE $x$
      UPDATE public.articles
      SET tags = ARRAY['دليل','سيارات','مرور','تأمين','مخالفات','HGS','معاينة']
      WHERE slug = 'car-in-turkey-complete-guide-2026'
    $x$;
    RAISE NOTICE 'OK: أُضيفت الوسوم (يشمل «دليل» — والمقال فيه 6 خطوات، والحدّ 3).';
  ELSE
    RAISE NOTICE 'تخطٍّ: عمود tags غير موجود في هذه القاعدة.';
  END IF;
END
$tags$;

-- ─── 4) تحقّق ───────────────────────────────────────────────────────────────
DO $check$
DECLARE
  n         integer;
  body      text;
  n_steps   integer;
  dead      integer;
BEGIN
  SELECT COUNT(*) INTO n FROM public.articles
  WHERE slug = 'car-in-turkey-complete-guide-2026' AND status = 'approved';
  IF n <> 1 THEN
    RAISE EXCEPTION 'FAILED: توقّعنا مقالاً واحداً معتمَداً، ووجدنا %.', n;
  END IF;

  SELECT details, array_length(steps, 1) INTO body, n_steps
  FROM public.articles WHERE slug = 'car-in-turkey-complete-guide-2026';

  IF n_steps IS NULL OR n_steps < 3 THEN
    RAISE EXCEPTION 'FAILED: وسم «دليل» يتطلّب 3 خطوات على الأقل، والموجود %.', COALESCE(n_steps, 0);
  END IF;

  -- المعالم: استبدالٌ أو نزعُ روابط لا يجوز أن يبتر المتن.
  IF position('خصم 25%' in body) = 0
     OR position('SBM' in body) = 0
     OR position('HGS' in body) = 0
     OR position('ÖTV' in body) = 0 THEN
    RAISE EXCEPTION 'FAILED: معلَم أساسي غاب عن المتن — راجع الاستبدالات.';
  END IF;

  -- الشرط الذي لا يُتساهل فيه: لا رابط داخلي يقود إلى 404.
  SELECT COUNT(*) INTO dead
  FROM (
    SELECT DISTINCT m[1] AS slug
    FROM regexp_matches(body, 'href="/article/([^"]+)"', 'g') AS m
  ) q
  WHERE NOT EXISTS (
    SELECT 1 FROM public.articles a WHERE a.slug = q.slug AND a.status = 'approved'
  );

  IF dead > 0 THEN
    RAISE EXCEPTION 'FAILED: بقي % رابطاً داخلياً بلا مقال معتمَد — دالة النزع لم تعمل.', dead;
  END IF;

  RAISE NOTICE 'OK: المقال منشور. طول المتن % حرفاً، % خطوة، ولا رابط مكسور.',
    length(body), n_steps;
END
$check$;

-- ─── 5) مراجعة ──────────────────────────────────────────────────────────────
SELECT slug, category, status, last_update,
       length(details) AS طول_المتن,
       array_length(steps, 1) AS خطوات
FROM public.articles WHERE slug = 'car-in-turkey-complete-guide-2026';

SELECT DISTINCT m[1] AS الروابط_الداخلية_الباقية
FROM public.articles a, LATERAL regexp_matches(a.details, 'href="/article/([^"]+)"', 'g') AS m
WHERE a.slug = 'car-in-turkey-complete-guide-2026'
ORDER BY 1;
