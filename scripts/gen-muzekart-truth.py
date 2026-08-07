# -*- coding: utf-8 -*-
"""MüzeKart: the deferred keep, finally resolved on the primary source.

The 171-char travel-muzekart stub was one of the thin-campaign's two
deliberate keeps — held because resident eligibility was unverified. Now
verified, and the primary source OVERTURNS the circulating claim:

  destek.ktb.gov.tr (Ministry support page, "Müzekart'ı Kimler Alabilir?"),
  verbatim: «Müzekart'ı Türkiye Cumhuriyeti vatandaşları, 5203 Sayılı
  Kanuna tabi Mavi Kart sahipleri ve Kuzey Kıbrıs Türk Cumhuriyeti
  vatandaşları tarafından alınabilir.»

  → The ordinary foreign RESIDENT is NOT in the official text. The
    "residents can buy it with an ikamet" line repeated by agency blogs —
    and by our own old stub («هوية تركية قد يمنحك فئة مختلفة») — is a
    laundered rumour. Refused.
  → The same official page ADDS: foreign STUDENTS enrolled in Turkey
    (secondary/higher ed) get a discounted student-rate card on showing
    student ID. That is the fact our audience actually needs.
  → Non-eligible visitors: the official Museum Pass product line on
    muze.gov.tr (country e-card + regional cards). No validity-days claim
    printed — the fetched page doesn't state one.

Also fixes yesterday's imprecision in student-benefits-discounts (the
museums paragraph implied preferential rates for residents generally) via
an exact needle replacement.

Category fixed too: the stub sat in «أنواع الإقامات» (a residence-types
bucket, wrong) → moved to «السكن والحياة» (daily life).

Silent like the batch: replica sandwich (title changes → the article-log
trigger would otherwise ping the bell).
"""
import json, os, re, urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_env = {}
for _l in open(os.path.join(REPO, '.env.local'), encoding='utf-8-sig').read().splitlines():
    if '=' in _l and not _l.lstrip().startswith('#'):
        _k, _v = _l.split('=', 1)
        _env[_k.strip()] = _v.strip()
_URL, _KEY = _env['NEXT_PUBLIC_SUPABASE_URL'], _env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
_H = {'apikey': _KEY, 'Authorization': 'Bearer ' + _KEY}


def get(p):
    return json.load(urllib.request.urlopen(urllib.request.Request(_URL + '/rest/v1/' + p, headers=_H)))


def q(s):
    return str(s).replace("'", "''")


def arr(items):
    return 'ARRAY[' + ', '.join("'" + q(x) + "'" for x in items) + ']::text[]'


SLUG = 'travel-muzekart'
r = get('articles?select=id,slug,status&slug=eq.' + SLUG)[0]
assert r['id'] == r['slug'] and r['status'] == 'approved'
for s in ('student-benefits-discounts-turkey-2026', 'transcript-edevlet', 'tourist-vs-student-residence-2025'):
    rr = get('articles?select=status&slug=eq.' + s)
    assert rr and rr[0]['status'] == 'approved', s

BEN_NEEDLE = ('لبطاقة المتاحف (Müzekart) فئات وأسعار تفضيلية للمقيمين تتغير تعرفتها دورياً — انظر '
              '<a href="/article/travel-muzekart">صفحة MüzeKart</a> وتحقق من الفئة الطلابية عند '
              'الشراء من المنافذ الرسمية.')
ben = get('articles?select=details&slug=eq.student-benefits-discounts-turkey-2026')[0]['details']
assert BEN_NEEDLE in ben, 'benefits needle drifted'
BEN_REPL = ('بطاقة المتاحف (Müzekart) يحصرها النص الرسمي بالمواطنين وحاملي المافي كارت — لكنه يمنح '
            'الطالب الأجنبي المقيّد في تركيا بطاقة مخفّضة ببطاقته الطلابية، وللسائح منتجات Museum '
            'Pass: الفئات كلها في <a href="/article/travel-muzekart">صفحة MüzeKart</a>.')

TITLE = 'MüzeKart في تركيا: من يحق له شراؤها فعلاً بنص الوزارة — وخيار الطالب الأجنبي والسائح والمقيم'
INTRO = ('تتداول المدونات أن «المقيم الأجنبي يشتري MüzeKart بوثيقة إقامته» — والنص الرسمي لوزارة '
         'الثقافة والسياحة لا يقول ذلك. هذه الصفحة تنقل لك الجواب من صفحة دعم الوزارة نفسها: من '
         'يحق له البطاقة السنوية حرفياً، ولماذا الطالب الأجنبي المقيّد في تركيا في وضع أفضل مما '
         'يظن (بطاقة مخفّضة ببطاقته الطلابية)، وما خيارات من ليس في النص — من منتجات Museum Pass '
         'الرسمية إلى التذاكر الفردية — حتى لا تشتري وهماً ولا تفوّت حقاً.')

DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الجواب الرسمي الحرفي</strong></p>'
    '<p style="margin:0;">صفحة دعم وزارة الثقافة والسياحة («من يستطيع الحصول على Müzekart؟») '
    'تحصر البطاقة السنوية في ثلاث فئات: <strong>مواطنو الجمهورية التركية</strong>، '
    'و<strong>حاملو المافي كارت</strong> الخاضعون للقانون 5203، و<strong>مواطنو قبرص '
    'الشمالية</strong>. المقيم الأجنبي العادي — بإقامة أو كملك — <strong>ليس في '
    'النص</strong>.</p></div>'

    '<h2>الاستثناء الذي يخص جمهورنا: الطالب الأجنبي</h2>'
    '<p>الصفحة الرسمية نفسها تضيف ما لا تذكره المدونات: <strong>الطالب الأجنبي المقيّد في '
    'تركيا</strong> — في التعليم الثانوي أو العالي (دبلوم متوسط، بكالوريوس، دراسات عليا) — '
    'يحصل على بطاقة <strong>بالتعرفة الطلابية المخفّضة</strong> بإبراز بطاقته الطلابية. فإن '
    'كنت طالباً فوثيقتك الجامعية مفتاحك: استخرجها من '
    '<a href="/article/transcript-edevlet">e-Devlet في دقيقة</a>، وضمّ هذا الخصم إلى '
    '<a href="/article/student-benefits-discounts-turkey-2026">عُدّة خصومات الطالب '
    'كاملة</a>.</p>'

    '<h2>لست مواطناً ولا طالباً؟ إليك الصورة بلا تجميل</h2>'
    '<ul>'
    '<li><strong>ما يتداول عن الشراء بوثيقة الإقامة</strong> لا سند له في النص الرسمي — '
    'قد تصادف كشكاً يبيعك، لكنك تشتري ما قد يُرفض عند أول تحقق هوية في البوابات. لا '
    'تبنِ عليه ولا تدفع لوسيط «يفعّلها» لك.</li>'
    '<li><strong>منتجات Museum Pass الرسمية</strong> على muze.gov.tr مفتوحة للجميع: '
    'بطاقة إلكترونية على مستوى تركيا وبطاقات إقليمية (إسطنبول، كبادوكيا، إيجه، '
    'المتوسط) بصلاحية أيام محددة لكل منتج — صُممت للزائر أصلاً، وقد تكون أوفر من '
    'التذاكر الفردية إن كنت ستزور مواقع عدة في فترة قصيرة.</li>'
    '<li><strong>التذاكر الفردية</strong> تبقى الأساس لمن يزور موقعاً أو موقعين — '
    'احسبها قبل شراء أي بطاقة.</li>'
    '</ul>'

    '<h2>ماذا تغطي هذه البطاقات أصلاً؟</h2>'
    '<p>متاحف وزارة الثقافة والسياحة ومواقعها الأثرية — وهي الشبكة الأوسع في البلد. '
    'وبعض المعالم الشهيرة تتبع جهات أخرى بأنظمة تذاكر مستقلة (كالقصور التابعة لإدارة '
    'القصور الوطنية) والمتاحف الخاصة والبلدية خارج النظام غالباً — فلا تفترض أن بطاقة '
    'واحدة تفتح كل باب؛ تحقق من تبعية المَعلم قبل الذهاب.</p>'

    '<h2>الشراء والقنوات الرسمية</h2>'
    '<ul>'
    '<li>أكشاك البيع عند مداخل المتاحف الكبرى — بوثيقتك الشخصية (وللطالب: البطاقة '
    'الطلابية).</li>'
    '<li>تطبيق <strong>Mobil MüzeKart</strong> الرسمي.</li>'
    '<li>خدمة MüzeKart عبر <strong>e-Devlet</strong> — الوزارة تنشر دليلها الرسمي على '
    'muze.gov.tr.</li>'
    '</ul>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>أنا سوري على الحماية المؤقتة — هل أشتري MüzeKart؟</h3>'
    '<p>الكملك ليس في النص الرسمي للبطاقة السنوية. إن كنت طالباً مقيّداً فبابك التعرفة '
    'الطلابية ببطاقتك الجامعية؛ وإلا فمنتجات Museum Pass والتذاكر الفردية.</p>'
    '<h3>هل تفتح البطاقة المتاحف الخاصة؟</h3>'
    '<p>لا تفترض ذلك — النظام يغطي متاحف الوزارة ومواقعها؛ الخاصة والبلدية ومَعالم '
    'الجهات الأخرى بتذاكرها.</p>'
    '<h3>كم سعر البطاقة؟</h3>'
    '<p>التعرفات تُحدَّث دورياً ولا نثبّت رقماً يتقادم — خذ السعر الجاري من muze.gov.tr '
    'أو الكشك مباشرة.</p>')

STEPS = ['حدّد فئتك أولاً: مواطن/مافي كارت، طالب مقيّد، أم زائر — فلكلٍّ بابه.',
         'الطالب: استخرج وثيقة الطالب من e-Devlet واشترِ بالتعرفة الطلابية من الكشك.',
         'الزائر أو غير المؤهل: قارن منتجات Museum Pass على muze.gov.tr بالتذاكر الفردية.',
         'قبل الذهاب لمعلم بعينه: تحقق أنه يتبع الوزارة أصلاً لا جهة أخرى بتذاكرها.']
TIPS = ['«المقيم يشتريها بوثيقة الإقامة» إشاعة مدونات — النص الرسمي لا يذكرها.',
        'الطالب الأجنبي المقيّد يحصل على التعرفة الطلابية — حق رسمي كثيرون لا يعرفونه.',
        'لا تدفع لوسيط «يفعّل» بطاقة لغير مؤهل — قد تُرفض عند بوابة التحقق.',
        'زيارة موقع أو موقعين؟ التذاكر الفردية أوفر غالباً من أي بطاقة.',
        'الأسعار تُحدَّث دورياً — من muze.gov.tr أو الكشك، لا من مقال قديم.']
DOCS = ['للمواطن/المافي كارت: الهوية',
        'للطالب الأجنبي: البطاقة الطلابية أو وثيقة طالب حديثة من e-Devlet',
        'للزائر: جواز السفر لشراء منتجات Museum Pass']
FEES = ('تعرفات MüzeKart وMuseum Pass تُحدَّث دورياً وتختلف بالفئة والمنتج — لا نثبّت '
        'أرقاماً؛ السعر الجاري على muze.gov.tr أو في كشك المتحف مباشرة.')
WARN = ('لا تشترِ بطاقة بهوية غيرك ولا عبر وسيط يعدك بـ«تفعيلها» لغير المؤهلين — التحقق '
        'عند البوابات وارد والبطاقة قد تُرفض بلا استرداد. والنص الرسمي هو المرجع لا '
        'اجتهاد نقطة بيع.')
SOURCE = ('صفحة دعم وزارة الثقافة والسياحة «Müzekart’ı Kimler Alabilir?» '
          '(destek.ktb.gov.tr — النص الحرفي لحصر الأهلية بالمواطنين وحاملي المافي كارت '
          'بقانون 5203 ومواطني قبرص الشمالية، وتعرفة الطالب الأجنبي المخفّضة ببطاقته)؛ '
          'وموقع muze.gov.tr الرسمي (منتجات Museum Pass وتطبيق Mobil MüzeKart ودليل '
          'خدمة e-Devlet)')
TAGS = ['MüzeKart', 'المتاحف', 'خصومات الطلاب', 'السياحة', '2026']
SEO_T = 'MüzeKart للأجانب: من يحق له شراؤها فعلاً — بنص الوزارة'
SEO_D = ('النص الرسمي يحصر MüzeKart بالمواطنين والمافي كارت وقبرص الشمالية — لا «مقيم '
         'بوثيقة إقامة» كما تروّج المدونات. لكن الطالب الأجنبي المقيّد له تعرفة مخفّضة '
         'رسمياً، وللزائر منتجات Museum Pass. الفئات كلها بلا أوهام.')

for nd in ('5203', 'قبرص الشمالية', 'ليس في النص', 'التعرفة الطلابية', 'Museum Pass',
           'e-Devlet', 'Mobil MüzeKart'):
    assert nd in DETAILS, 'PREDICATE WOULD LIE: %r' % nd
body = DETAILS + INTRO + FEES + WARN
assert not re.search(r'\d[\d.,]*\s*(?:ليرة|TL|دولار|\$|يوم)', body), 'perishable figure leaked'
assert '15 يوم' not in body
assert '%' not in body + BEN_REPL
assert 'travel-muzekart' not in DETAILS

COLS = ('id, slug, title, intro, details, steps, tips, documents, fees, warning, '
        'source, tags, category, status, seo_title, seo_description, last_update')
assert len(COLS.split(',')) == 17
vals = ["'" + q(SLUG) + "'", "'" + q(SLUG) + "'", "'" + q(TITLE) + "'", "'" + q(INTRO) + "'",
        "'" + q(DETAILS) + "'", arr(STEPS), arr(TIPS), arr(DOCS), "'" + q(FEES) + "'",
        "'" + q(WARN) + "'", "'" + q(SOURCE) + "'", arr(TAGS), "'السكن والحياة'",
        "'approved'", "'" + q(SEO_T) + "'", "'" + q(SEO_D) + "'", 'CURRENT_DATE']
assert len(vals) == 17

sql = ("""-- ============================================================================
-- MüzeKart: حسم التأجيل الأخير — النص الرسمي يقلب الإشاعة ويكشف حق الطالب
-- ============================================================================
-- الكعب الصغير (171 حرفاً) كان أحد «الإبقاءين المتعمدين» في حملة المحتوى
-- الرقيق، معلقاً حتى التحقق من الأهلية. تحقّقنا من المصدر الأولي:
--
--   صفحة دعم وزارة الثقافة والسياحة (destek.ktb.gov.tr) بنصها الحرفي:
--   «Müzekart'ı Türkiye Cumhuriyeti vatandaşları, 5203 Sayılı Kanuna tabi
--   Mavi Kart sahipleri ve Kuzey Kıbrıs Türk Cumhuriyeti vatandaşları
--   tarafından alınabilir.»
--
-- أي: «المقيم الأجنبي يشتريها بوثيقة إقامته» — الذي كان في كعبنا القديم
-- نفسه — إشاعة مغسولة تُرفض. والصفحة الرسمية ذاتها تمنح الطالب الأجنبي
-- المقيّد بطاقة بالتعرفة الطلابية المخفّضة — الحق الذي يخص جمهورنا فعلاً.
--
-- يصحح أيضاً جملة أمس في صفحة عُدّة الخصومات («تفضيلية للمقيمين») بإبرة
-- دقيقة، وينقل الصفحة من تصنيف «أنواع الإقامات» الخاطئ إلى «السكن والحياة».
-- صامت كالدفعة (replica حول المحتوى). آمن لإعادة التشغيل.
-- ============================================================================

SET session_replication_role = 'replica';

INSERT INTO articles (""" + COLS + """)
VALUES (""" + ',\n        '.join(vals) + """)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, intro = EXCLUDED.intro, details = EXCLUDED.details,
    steps = EXCLUDED.steps, tips = EXCLUDED.tips, documents = EXCLUDED.documents,
    fees = EXCLUDED.fees, warning = EXCLUDED.warning, source = EXCLUDED.source,
    tags = EXCLUDED.tags, category = EXCLUDED.category, status = EXCLUDED.status,
    seo_title = EXCLUDED.seo_title, seo_description = EXCLUDED.seo_description,
    last_update = EXCLUDED.last_update;

-- تصحيح جملة المتاحف في عُدّة الخصومات (إبرة مضبوطة، محروسة)
UPDATE articles
   SET details = replace(details, '""" + q(BEN_NEEDLE) + """', '""" + q(BEN_REPL) + """'),
       last_update = CURRENT_DATE
 WHERE slug = 'student-benefits-discounts-turkey-2026'
   AND position('""" + q(BEN_NEEDLE) + """' in details) > 0;

SET session_replication_role = 'origin';

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM articles
     WHERE slug = 'travel-muzekart' AND status = 'approved'
       AND category = 'السكن والحياة'
       AND position('5203' in details) > 0
       AND position('التعرفة الطلابية' in details) > 0
       AND position('Museum Pass' in details) > 0
       AND length(details) > 2500;
    IF n <> 1 THEN RAISE EXCEPTION 'muzekart rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug = 'travel-muzekart';
    IF n <> 1 THEN RAISE EXCEPTION 'duplicate slug'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = 'student-benefits-discounts-turkey-2026'
       AND position('تفضيلية للمقيمين' in details) = 0
       AND position('يحصرها النص الرسمي' in details) > 0;
    IF n <> 1 THEN RAISE EXCEPTION 'benefits correction did not land'; END IF;
END
$check$;

SELECT slug AS الصفحة, length(details) AS الحجم, category AS التصنيف, last_update AS آخر_تحديث
  FROM articles
 WHERE slug IN ('travel-muzekart', 'student-benefits-discounts-turkey-2026')
 ORDER BY slug;
""")

code = '\n'.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
assert re.sub(r"''", '', code).count("'") % 2 == 0, 'quote imbalance'
assert code.index("'replica'") < code.index('INSERT INTO') < code.index("'origin'") < code.index('DO $check$')
assert 'INSERT INTO updates' not in code

path = os.path.join(REPO, 'sql', '2026-08-07_muzekart_truth.sql')
open(path, 'w', encoding='utf-8', newline='').write(sql)
print('rebuild : travel-muzekart 171 -> %d chars | category -> السكن والحياة' % len(DETAILS))
print('fix     : benefits museums paragraph needle x%d in live row' % ben.count(BEN_NEEDLE))
print('links   : %d internal' % len(re.findall(r'href="/article/', DETAILS)))
print('written :', path, len(sql), 'chars')
