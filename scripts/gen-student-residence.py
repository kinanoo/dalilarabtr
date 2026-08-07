# -*- coding: utf-8 -*-
"""Student residence: the missing pillar of the education cluster.

── the gap (recon against live rows) ──────────────────────────────────────

The owner sent studyfans.com/blogs/1052 (student visa + residency journey)
to cover. Mapped against our corpus: the study-visa page is 1,533 chars and
visa-only; the tourist-vs-student comparison compares but does not walk the
process; work-permit-students covers work. NO page walks the student-ikamet
process itself — application, the müracaat interim, renewal, and what comes
after graduation. That is this page: student-residence-permit-2026.

── what is taken from the source, and what is corrected ─────────────────

Adopted as demand map (their structure: journey → docs → renewal → after
graduation). Their verifiable mechanics kept: student visa not tourist;
passport validity ≥6 months; the renewal window opening 60 days before
expiry (standard e-ikamet mechanism); the fresh student-certificate
requirement (framed as "recent — directorates commonly want it new", not a
hard 30-day rule).

REFUSED from the source:
  * «4-8 weeks processing» — practice varies wildly; the page says don't
    build plans on processing promises, the müracaat document keeps you
    legal while pending.
  * «convert to tourist residency after graduation» — 2023-era advice that
    our own rebuilt comparison page disproves for 2026: the tourist permit
    is now the HARD one. Stated honestly with the link.

ADDED beyond the source (verified mechanisms):
  * The GSS opt-in window: foreign students may register into general
    health insurance within three months of first enrolment — miss it and
    private insurance is the only road. Framed as ask-SGK-within-3-months.
  * Student ikamet stands on FORMAL (örgün) enrolment — consistent with the
    art. 19 work rule already live on our students page; open education
    does not ground it.
  * The TP-holder boundary: a kimlik student switching to student ikamet
    passes through renunciation — routed to the warning page.

One guarded append: the study-visa page gains the natural next-step link to
this guide. No retirements, no redirects — pure addition.
"""
import json, os, re, urllib.parse, urllib.request

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
    return str(s if s is not None else '').replace("'", "''")


def arr(items):
    return 'ARRAY[%s]::text[]' % ', '.join("'%s'" % q(x) for x in items)


def _no_bare_percent(t):
    for i, line in enumerate(t.splitlines(), 1):
        if '%' in re.sub(r'%[s%]', '', line):
            raise AssertionError('bare %% in SQL template, line %d: %s' % (i, line.strip()))
    return t


SLUG = 'student-residence-permit-2026'
SV = 'turkey-study-visa-syrians-2026'

assert not get('articles?select=slug&slug=eq.' + SLUG), 'slug taken'
sv = get('articles?select=status,details&slug=eq.' + SV)[0]
assert sv['status'] == 'approved' and SLUG not in sv['details']
for s in ('tourist-vs-student-residence-2025', 'work-permit-students', 'private-universities-turkey-2026',
          'scholarship-turkiye-burslari', 'kimlik-to-residence', 'sgk-gss-health-insurance-turkey-2026',
          'residence-rejection-appeal-turkey-2026', 'transcript-edevlet', 'tomer-registration',
          'renting-house', 'bank-account-opening', 'tourist-to-work-permit-2026', 'work-permit-turkey-2026'):
    r = get('articles?select=status&slug=eq.' + s)
    assert r and r[0]['status'] == 'approved', s + ' not live'

DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>خريطة الرحلة كاملة</strong></p>'
    '<p style="margin:0;">قبول جامعي ← <strong>تأشيرة طالب</strong> (لا سياحية) ← دخول '
    'تركيا ← طلب <strong>إقامة الطالب عبر e-ikamet قبل انتهاء مهلة بقائك '
    'القانونية</strong> ← وثيقة المراجعة تُبقيك نظامياً حتى صدور البطاقة ← تجديدٌ يفتح '
    'بابه <strong>قبل 60 يوماً</strong> من الانتهاء. هذه الصفحة تمشي معك المسار كله.</p></div>'

    '<h2>المرحلة الأولى: التأشيرة — طالبٌ لا سائح</h2>'
    '<p>القادم للدراسة يدخل بتأشيرة <strong>طالب</strong> من ممثّلية تركيا في بلده — '
    'الدخول بسياحية ثم «التدبير من الداخل» طريقٌ يتعثّر ويعقّد ملفك الأول. الأساسيات: '
    'جواز يصلح <strong>ستة أشهر على الأقل</strong> بعد سفرك، وخطاب القبول الجامعي، '
    'وإثبات مقدرة مالية، وأوراق الممثّلية. وللسوريين خصوصيات مسارهم وشروطه: '
    '<a href="/article/turkey-study-visa-syrians-2026">تأشيرة الدراسة للسوريين '
    'وشرطاها</a>. والقادم من جنسية معفاة من التأشيرة يدخل بإعفائه — لكنّ '
    '<strong>الإقامة لا إعفاء منها</strong>: المرحلة الثانية تخصّه هو أيضاً.</p>'

    '<h2>المرحلة الثانية: طلب إقامة الطالب — الساعة تبدأ يوم دخولك</h2>'
    '<p>مهلة بقائك القانونية (مدة التأشيرة أو الإعفاء) هي نافذتك لتقديم الطلب — '
    '<strong>قدّم عبر نظام e-ikamet قبل انتهائها</strong>، ولا تنتظر «استقراراً» يأكل '
    'المهلة. بعد التقديم تحصل على <strong>وثيقة المراجعة</strong> (Müracaat Belgesi) '
    'التي تُبقي وجودك نظامياً حتى صدور البطاقة — ومدد الإصدار تتفاوت بالولاية والموسم، '
    'فلا تبنِ سفراً أو التزاماً على وعدِ مدة.</p>'
    '<p><strong>ملف الطلب المعتاد:</strong></p>'
    '<ul>'
    '<li>استمارة الطلب من النظام، موقَّعة.</li>'
    '<li>جواز السفر + صور صفحة البيانات و<strong>ختم الدخول</strong>.</li>'
    '<li>أربع صور بيومترية حديثة بخلفية بيضاء.</li>'
    '<li><strong>وثيقة الطالب</strong> (Öğrenci Belgesi) <strong>حديثة العهد</strong> — '
    'المديريات تريدها جديدة؛ استخرجها قبيل التقديم لا قبله بشهور: '
    '<a href="/article/transcript-edevlet">من e-Devlet خلال دقيقة</a>.</li>'
    '<li><strong>تأمين صحي</strong> — انظر الصندوق أدناه قبل أن تشتري.</li>'
    '<li>إثبات سكن — عقد إيجار أو وثيقة سكن جامعي '
    '(<a href="/article/renting-house">دليل الاستئجار وفخاخه</a>).</li>'
    '<li>إيصال رسم البطاقة — بالتعرفة الرسمية الجارية.</li>'
    '</ul>'

    '<div style="background:#eff6ff;border-right:4px solid #3b82f6;padding:14px 18px;margin:18px 0;">'
    '<p style="margin:0 0 8px;"><strong>صندوق التأمين — النافذة التي يفوّتها الجميع</strong></p>'
    '<p style="margin:0;">للطالب الأجنبي نافذةُ تسجيلٍ اختياري في التأمين الصحي العام '
    '(GSS) خلال <strong>الأشهر الثلاثة الأولى من أول قيد جامعي</strong> — اسأل مديرية '
    'SGK فور تسجيلك؛ فمن فوّتها بقي على التأمين الخاص طوال دراسته. والصورة الكاملة '
    'للتأمينين في <a href="/article/sgk-gss-health-insurance-turkey-2026">دليل SGK '
    'وGSS</a>.</p></div>'

    '<h2>المرحلة الثالثة: التجديد — بابه يُفتح قبل 60 يوماً</h2>'
    '<ul>'
    '<li>نافذة التجديد عبر e-ikamet تبدأ <strong>قبل 60 يوماً من انتهاء إقامتك</strong> '
    'وتمتد حتى الانتهاء — قدّم في أولها لا آخرها.</li>'
    '<li>وثيقة طالب <strong>جديدة</strong> تثبت استمرار قيدك — هي قلب ملف التجديد.</li>'
    '<li>جوازك صالحاً للمدة المطلوبة — جدّده قبل الإقامة إن قارب.</li>'
    '<li>فجوة بين إقامتين = مخالفة تتراكم — التجديد المتأخر أغلى دائماً.</li>'
    '</ul>'
    '<p>ورُفض طلبك أو تجديدك؟ لا تستسلم للورقة الأولى: '
    '<a href="/article/residence-rejection-appeal-turkey-2026">الاعتراض على رفض الإقامة '
    'بمواعيده</a>.</p>'

    '<h2>حقوقك على إقامة الطالب</h2>'
    '<ul>'
    '<li><strong>العمل</strong>: بإذن — والبكالوريوس بعد سنته الأولى وبدوام جزئي: '
    '<a href="/article/work-permit-students">عمل الطلاب الأجانب بنصّ القانون</a>.</li>'
    '<li><strong>وثائقك من e-Devlet</strong>: كشف الدرجات ووثيقة الطالب مجاناً برمز '
    'تحقّق.</li>'
    '<li><strong>حساب بنكي</strong> باسمك — يسهّل المنح والسكن والرسوم: '
    '<a href="/article/bank-account-opening">فتح الحساب خطوة بخطوة</a>.</li>'
    '<li>واللغة إن كانت عائقك: '
    '<a href="/article/tomer-registration">TÖMER والبديل المجاني</a>.</li>'
    '</ul>'

    '<h2>ماذا بعد التخرج؟ — بصدق 2026 لا بنصائح 2023</h2>'
    '<ol>'
    '<li><strong>الدراسات العليا</strong>: قبولٌ جديد يمدّد صفتك الطلابية — أنظف '
    'الطرق وأثبتها.</li>'
    '<li><strong>العمل</strong>: صاحب عمل يقدّم لك طلب إذن عمل — وخذ التوقيت على محمل '
    'الجدّ: إقامة الطالب تنتهي بانتهاء قيدك، فابدأ البحث <strong>قبل</strong> التخرج لا '
    'بعده (<a href="/article/work-permit-turkey-2026">دليل إذن العمل</a> و'
    '<a href="/article/tourist-to-work-permit-2026">شرط الستة أشهر للطلب الداخلي</a>).</li>'
    '<li><strong>«أحوّلها سياحية»</strong> — النصيحة المتداولة التي انتهى زمنها: '
    'السياحية اليوم هي الأصعب منحاً وتجديداً، ولا تصلح خطة بقاء — '
    '<a href="/article/tourist-vs-student-residence-2025">المقارنة الصادقة '
    'بواقع 2026</a>.</li>'
    '</ol>'

    '<div style="background:#fff7ed;border-right:4px solid #ea580c;padding:14px 18px;margin:18px 0;">'
    '<p style="margin:0;"><strong>لحامل الكملك الذي يدرس:</strong> أنت لست في هذا '
    'المسار — الانتقال من الحماية المؤقتة إلى إقامة الطالب يمرّ بتنازلٍ شبه نهائي '
    'له صفحته التحذيرية: <a href="/article/kimlik-to-residence">التحويل من الكملك '
    'إلى إقامة</a>. لا تتخذ القرار من صفحة عامة.</p></div>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>جنسيتي معفاة من التأشيرة — هل أحتاج إقامة الطالب؟</h3>'
    '<p>نعم — الإعفاء يُدخلك ولا يُقيمك: قدّم لإقامة الطالب ضمن مدة إعفائك كما يفعل '
    'حامل التأشيرة ضمن مدتها.</p>'
    '<h3>هل يؤسّس التعليم المفتوح إقامة طالب؟</h3>'
    '<p>إقامة الطالب تقوم على القيد <strong>النظامي</strong> الحضوري — التعليم المفتوح '
    'وعن بُعد لا يؤسّسها، كما لا يؤسّس حقّ العمل الطلابي.</p>'
    '<h3>غيّرت جامعتي أو مدينتي — ماذا عن إقامتي؟</h3>'
    '<p>صفتك الطلابية أساس إقامتك: التغيير يُبلَّغ ويُحدَّث في مهله (قيد جديد، وعنوان '
    'جديد) — اسأل مديرية ولايتك الجديدة فور الانتقال ولا تؤجل للتجديد.</p>'
    '<h3>هل أسافر خارج تركيا وأعود بإقامة الطالب؟</h3>'
    '<p>البطاقة السارية تخوّلك الخروج والعودة — لكن لا تسافر ووثيقة المراجعة وحدها '
    'بيدك إلا بعد سؤال مديريتك عن قواعد السفر أثناء الدراسة للطلب.</p>'
)
STEPS = [
    'أمّن القبول الجامعي أولاً — هو أساس التأشيرة والإقامة معاً.',
    'استخرج تأشيرة طالب من ممثلية تركيا في بلدك (لا تدخل سائحاً «لتدبّرها»).',
    'بعد الدخول: قدّم لإقامة الطالب عبر e-ikamet قبل انتهاء مهلتك القانونية.',
    'خلال أول 3 أشهر من قيدك: اسأل SGK عن نافذة التسجيل في GSS قبل شراء تأمين خاص.',
    'جهّز الملف: وثيقة طالب حديثة، صور بيومترية، سكن موثق، إيصال الرسم.',
    'احتفظ بوثيقة المراجعة حتى البطاقة — ولا تبنِ خططاً على وعود مدد.',
    'جدّد من أول نافذة الستين يوماً بوثيقة طالب جديدة — والفجوة مخالفة تتراكم.',
    'وقبل التخرج بفصل كامل: قرّر طريقك — دراسات عليا أم إذن عمل — لا بعده.',
]
TIPS = [
    'تأشيرة طالب لا سياحية — الدخول الخاطئ يعقّد الملف الأول كله.',
    'نافذة GSS ثلاثة أشهر من أول قيد — فوّتها فالتأمين الخاص طوال الدراسة.',
    'وثيقة الطالب تُستخرج قبيل التقديم — «حديثة العهد» شرط عملي.',
    'التجديد يفتح قبل 60 يوماً — قدّم في أولها.',
    'التعليم المفتوح لا يؤسس إقامة طالب ولا حق عمل طلابي.',
    '«التحويل لسياحية بعد التخرج» نصيحة انتهى زمنها — خطط للعمل أو الدراسات العليا مبكراً.',
    'حامل الكملك الدارس في مسار آخر — لا يقرر التحويل من صفحة عامة.',
]
DOCS = [
    'خطاب القبول الجامعي، وجواز يصلح 6 أشهر على الأقل بعد السفر',
    'استمارة e-ikamet + صور الجواز وختم الدخول + 4 صور بيومترية',
    'وثيقة الطالب (Öğrenci Belgesi) حديثة العهد',
    'تأمين صحي (GSS إن أدركت نافذته، أو خاص) وإثبات سكن',
    'إيصال رسم بطاقة الإقامة بالتعرفة الجارية',
]
FEES = ('رسوم التأشيرة والإقامة بتعرفات رسمية تُحدَّث سنوياً وتختلف بالجنسية والمدة — '
        'تظهر في مساري التقديم الرسميين، ولا نعتمد رقماً متداولاً. وقسط GSS الطلابي '
        'ضمن نافذته أوفر من الخاص عادةً — قارن قبل الشراء.')
WARN = ('قدّم للإقامة قبل انتهاء مهلة بقائك القانونية — التأخير مخالفة تسبق ملفك. ومدد '
        'الإصدار تتفاوت فلا تبنِ عليها سفراً. ووثيقة طالب قديمة تُرجع الملف. وإقامة '
        'الطالب تنتهي بانتهاء القيد — خطة ما بعد التخرج تُصنع قبله.')
SOURCE = ('نظام إقامة الطالب في قانون الأجانب والحماية الدولية 6458 وطلبات e-ikamet '
          '(التقديم ضمن مدة البقاء القانوني، ووثيقة المراجعة، ونافذة التجديد قبل 60 '
          'يوماً)؛ وتأشيرة الطالب عبر ممثليات تركيا (konsolosluk.gov.tr)؛ ونافذة تسجيل '
          'الطلاب الأجانب الاختياري في GSS خلال ثلاثة أشهر من أول قيد (قانون 5510 — '
          'راجع مديرية SGK)؛ وقيام الصفة الطلابية على القيد النظامي')
TAGS = ['إقامة الطالب', 'تأشيرة الدراسة', 'e-ikamet', 'الدراسة والتعليم', 'دليل', '2026']
SEO_T = 'إقامة الطالب في تركيا: من التأشيرة إلى البطاقة والتجديد'
SEO_D = ('الرحلة كاملة: تأشيرة طالب لا سياحية، وطلب e-ikamet قبل انتهاء مهلتك، ونافذة '
         'GSS الثلاثية التي يفوتها الجميع، والتجديد قبل 60 يوماً — وما بعد التخرج بصدق '
         '2026: السياحية لم تعد خطة.')

SV_ADD = ('<p style="margin-top:1rem;">وبعد وصولك بالتأشيرة تبدأ المرحلة الثانية: '
          '<a href="/article/student-residence-permit-2026"><strong>إقامة الطالب من '
          'الطلب إلى التجديد — الدليل الكامل ←</strong></a></p>')

for nd in ['e-ikamet', 'Müracaat', '60 يوماً', 'الأشهر الثلاثة الأولى', 'Öğrenci Belgesi',
           'turkey-study-visa-syrians-2026', 'tourist-vs-student-residence-2025',
           'work-permit-students', 'kimlik-to-residence', 'residence-rejection-appeal-turkey-2026',
           'sgk-gss-health-insurance-turkey-2026', 'النظامي']:
    assert nd in DETAILS, 'PREDICATE WOULD LIE: %r' % nd
assert '4-8' not in DETAILS and 'أسابيع' not in DETAILS, 'a processing-time promise leaked'
assert not re.search(r'\d[\d.,]*\s*(?:ليرة|TL|دولار|\$)', DETAILS)
assert '%' not in DETAILS + SV_ADD
assert SLUG in SV_ADD

sql = _no_bare_percent("""-- ============================================================================
-- إقامة الطالب: الركن الغائب من عنقود التعليم — الرحلة كاملة بمعاييرنا
-- ============================================================================
-- فُحصت التغطية: صفحة التأشيرة (1,533 حرفاً) للتأشيرة وحدها، والمقارنة
-- تقارن ولا تمشي المسار، وصفحة العمل للعمل — ولا صفحة تمشي مسار إقامة
-- الطالب نفسه. هذه هي: student-residence-permit-2026.
--
-- من المصدر المرسَل أُخذت الخريطة (رحلة ← أوراق ← تجديد ← ما بعد التخرج)
-- وآلياته الثابتة (تأشيرة طالب لا سياحية؛ نافذة التجديد قبل 60 يوماً؛
-- وثيقة الطالب حديثة العهد). ورُفض منه: «المعالجة 4-8 أسابيع» (تتفاوت —
-- الصفحة تقول لا تبنِ على وعود مدد، ووثيقة المراجعة تُبقيك نظامياً)،
-- و«التحويل لسياحية بعد التخرج» (نصيحة 2023 التي تنقضها صفحتنا المقارنة
-- بواقع 2026 — قيلت بصدق مع الرابط).
--
-- وأُضيف ما لا يحمله المصدر: نافذة GSS الاختيارية خلال ثلاثة أشهر من أول
-- قيد (مَن فوّتها فالخاص طوال الدراسة)، وقيام الإقامة على القيد النظامي
-- (اتساقاً مع قاعدة م19 على صفحة العمل)، وحدّ حامل الكملك (التحويل يمرّ
-- بالتنازل — صفحته التحذيرية).
--
-- إضافة محضة: INSERT واحد + رابط «الخطوة التالية» محروس في صفحة التأشيرة.
-- لا تقاعد ولا تحويلات. لا أرقام مالية (مؤكَّد آلياً).
-- آمن لإعادة التشغيل.
-- ============================================================================

INSERT INTO articles (id, slug, title, intro, details, steps, tips, documents,
                      fees, warning, source, tags, category, status,
                      seo_title, seo_description, last_update)
VALUES ('%s', '%s', '%s', '%s', '%s', %s, %s, %s, '%s', '%s', '%s', %s,
        'الدراسة والتعليم', 'approved', '%s', '%s', CURRENT_DATE)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, intro = EXCLUDED.intro, details = EXCLUDED.details,
    steps = EXCLUDED.steps, tips = EXCLUDED.tips, documents = EXCLUDED.documents,
    fees = EXCLUDED.fees, warning = EXCLUDED.warning, source = EXCLUDED.source,
    tags = EXCLUDED.tags, category = EXCLUDED.category, status = EXCLUDED.status,
    seo_title = EXCLUDED.seo_title, seo_description = EXCLUDED.seo_description,
    last_update = EXCLUDED.last_update;

-- رابط الخطوة التالية في صفحة التأشيرة (محروس)
UPDATE articles SET details = details || '%s', last_update = CURRENT_DATE
WHERE slug = '%s' AND details NOT LIKE '%%student-residence-permit-2026%%';

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved'
       AND details LIKE '%%e-ikamet%%' AND details LIKE '%%60 يوماً%%'
       AND details LIKE '%%الأشهر الثلاثة الأولى%%';
    IF n <> 1 THEN RAISE EXCEPTION 'the student guide did not land'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug = '%s';
    IF n <> 1 THEN RAISE EXCEPTION 'duplicate slug'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND details LIKE '%%student-residence-permit-2026%%';
    IF n <> 1 THEN RAISE EXCEPTION 'the visa-page link did not land'; END IF;
END
$check$;

SELECT 'student guide live (e-ikamet + 60-day window + GSS window)' AS البند,
       (details LIKE '%%Müracaat%%')::text AS النتيجة
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'no 2023-era tourist-switch advice, comparison linked instead',
       (details LIKE '%%tourist-vs-student-residence-2025%%')::text
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'visa page links the next step', (details LIKE '%%student-residence-permit-2026%%')::text
FROM articles WHERE slug = '%s';
""") % (SLUG, SLUG,
        q('إقامة الطالب في تركيا 2026: الرحلة كاملة من التأشيرة إلى البطاقة — والتجديد قبل 60 يوماً، ونافذة التأمين التي يفوّتها الجميع'),
        q('من القبول الجامعي إلى بطاقة الإقامة بيدك: تأشيرة طالبٍ لا سائح، ثم طلب e-ikamet قبل انتهاء مهلتك القانونية، ووثيقة مراجعة تُبقيك نظامياً حتى الصدور، وتجديدٌ يفتح بابه قبل ستين يوماً. وفي الطريق نافذتان يفوّتهما الجميع: تسجيل GSS خلال أشهر قيدك الثلاثة الأولى، وخطة ما بعد التخرج التي تُصنع قبل التخرج لا بعده — بصدق واقع 2026 لا بنصائح المواقع القديمة.'),
        q(DETAILS), arr(STEPS), arr(TIPS), arr(DOCS), q(FEES), q(WARN), q(SOURCE), arr(TAGS),
        q(SEO_T), q(SEO_D),
        q(SV_ADD), SV,
        SLUG, SLUG, SV,
        SLUG, SLUG, SV)

path = os.path.join(REPO, 'sql', '2026-08-07_student_residence.sql')
open(path, 'w', encoding='utf-8', newline='').write(sql)

_code = '\n'.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('الدليل       : %s (جديد، %d حرفاً) — الرحلة كاملة' % (SLUG, len(DETAILS)))
print('من المصدر    : الخريطة + الآليات الثابتة (طالب لا سائح، 60 يوماً، وثيقة حديثة)')
print('رُفض منه     : «4-8 أسابيع» و«حوّلها سياحية بعد التخرج» (نصيحة 2023 المنقوضة)')
print('أُضيف        : نافذة GSS الثلاثية + القيد النظامي + حدّ حامل الكملك')
print('روابط داخلية : %d' % len(re.findall(r'href="/article/', DETAILS)))
print('quote parity :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written      :', path, len(sql), 'chars')
