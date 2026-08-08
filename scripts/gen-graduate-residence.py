# -*- coding: utf-8 -*-
"""Graduate residence: the YOK second-year decision — news + companion guide.

── the source (primary, held in hand) ─────────────────────────────────────

The owner sent the YOK circular itself: E-95916564-301.06.02-52864, dated
02.08.2026, "Turkiye'de Yuksekogrenimini Tamamlayanlara Verilecek Kisa
Donem Ikamet Izni Hk.", signed Prof. Dr. Naci Gundogan (Baskan Vekili),
distributed to all universities, based on the Migration Management
(Goc Idaresi Baskanligi) letter of 29.07.2026 no. 59277437-000-493089.
Public circulation verified across Turkish outlets (bianet, yenicag, bha,
egitimsitesi) reporting identical mechanics on 03-05.08.2026.

The mechanics, from the letter verbatim:
 * Existing ground: 6458 art. 31/1 graduates clause — completed higher
   education in Turkiye + apply within SIX MONTHS of graduation date →
   short-term ikamet, once only, max one year (art. 31/4).
 * NEW: holders of that one-year permit may re-apply — while it still
   runs or within up to 90 DAYS from its end date — and, meeting the
   art. 32 conditions, receive ONE more year issued under another clause
   of art. 31/1 (the letter cites the adli/idari-requirement clause,
   because the graduates clause is once-only by statute). Total: 2 years.

── corrections to the intermediary's Arabic text ──────────────────────────

 * "اتموا دراستهم العليا" reads as postgraduate-only — the letter says
   yuksekogrenim (higher education, bachelor's and up). Corrected.
 * The second year is NOT an extension of the same clause — it is a new
   permit on a different clause; that legal detail is why the decision
   was needed at all. Stated.
 * Attribution goes to the primary sources (YOK circular + Goc Idaresi
   letter), not to the civil-society channel that relayed it.

── what gets published (LOUD — this news must spread) ─────────────────────

 1. articles: graduate-residence-permit-turkey-2026 (new canonical guide)
 2. student-residence-permit-2026: the post-graduation list gains the
    graduate-permit option by exact needle insert (guarded)
 3. updates: pinned news row, link → the new guide, default created_at
    so the bell/push/Telegram pipeline picks it up
No replica sandwich, by design.
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


SLUG = 'graduate-residence-permit-turkey-2026'
GUIDE = 'student-residence-permit-2026'
assert not get('articles?select=slug&slug=eq.' + SLUG), 'slug taken'
for s in (GUIDE, 'tourist-to-work-permit-2026', 'work-permit-turkey-2026',
          'masters-phd-turkey-foreigners-2026', 'tourist-vs-student-residence-2025',
          'kimlik-to-residence', 'residence-rejection-appeal-turkey-2026'):
    r = get('articles?select=id,status&slug=eq.' + s)
    assert r and r[0]['status'] == 'approved', s + ' not live'
    assert r[0]['id'] == s, s + ' id != slug'

NEEDLE = '<li><strong>«أحوّلها سياحية»</strong>'
gd = get('articles?select=details&slug=eq.' + GUIDE)[0]['details']
assert gd.count(NEEDLE) == 1, 'guide needle drifted'
assert SLUG not in gd
assert not get('updates?select=id&link=eq./article/' + SLUG), 'news row exists'

NEW_LI = ('<li><strong>إقامة ما بعد التخرج</strong>: لك مهلة <strong>ستة أشهر من تاريخ '
          'تخرجك</strong> لطلب إقامة قصيرة لسنة — وبقرار جديد (آب/أغسطس 2026) تستطيع طلب '
          'سنة ثانية، فيصير المجموع سنتين: '
          '<a href="/article/graduate-residence-permit-turkey-2026">دليل القرار الجديد '
          'كاملاً</a>.</li>')

TITLE = ('إقامة ما بعد التخرج في تركيا 2026: سنة بمهلة الستة أشهر — وقرار جديد يضيف سنة '
         'ثانية فيصير المجموع سنتين')
INTRO = ('كان خريج الجامعات التركية الدولي يملك فرصة واحدة: التقديم خلال ستة أشهر من تخرجه '
         'على إقامة قصيرة الأمد لسنة واحدة، لمرة واحدة، ثم يُسأل عن أساس بقاء جديد. في '
         'مطلع آب/أغسطس 2026 تغيّرت المعادلة: كتاب رسمي عمّمته رئاسة مجلس التعليم العالي '
         'YÖK على الجامعات كلها — بناءً على كتاب رئاسة إدارة الهجرة — أقرّ منح من حصل على '
         'إقامة الخريج السنوية سنةً ثانية بطلب جديد، ليصبح مجموع ما بعد التخرج سنتين '
         'كاملتين. هذا الدليل يشرح الأساس القانوني والقرار الجديد والمهل الثلاث التي لا '
         'تسامح فيها — ولماذا هاتان السنتان أثمن جسر بين مقعد الدراسة وإذن العمل.')

DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>القرار الجديد في ثلاثة أسطر</strong></p>'
    '<p style="margin:0;">من تخرّج في التعليم العالي التركي وحصل — بالتقديم خلال '
    '<strong>ستة أشهر من تاريخ التخرج</strong> — على إقامة الخريج القصيرة لسنة واحدة، '
    'يستطيع الآن التقديم مجدداً (وإقامته سارية أو خلال مهلة أقصاها <strong>90 يوماً من '
    'تاريخ انتهائها</strong>) ليُمنح <strong>سنة ثانية</strong> إن استوفى شروط المادة 32 '
    '— فيصبح المجموع <strong>سنتين</strong> بعد التخرج. كتاب YÖK إلى الجامعات بتاريخ 2 '
    'آب/أغسطس 2026، بناءً على كتاب رئاسة إدارة الهجرة بتاريخ 29 تموز/يوليو 2026.</p></div>'

    '<h2>الأساس القانوني — ولماذا احتاجت السنةُ الثانية قراراً؟</h2>'
    '<p>بند الخريجين في المادة 31 من قانون الأجانب والحماية الدولية 6458 يمنح من أتمّ '
    '<strong>تعليمه العالي في تركيا</strong> — بكالوريوس فما فوق، لا الدراسات العليا وحدها '
    'كما تكتب بعض الصفحات الناقلة — إقامةً قصيرة الأمد إذا قدّم <strong>خلال ستة أشهر من '
    'تاريخ تخرجه</strong>. لكن القانون نفسه يقيّد هذا البند: <strong>لمرة واحدة، وبحد '
    'أقصى سنة واحدة</strong>. ولهذا لم يكن تمديده ممكناً — فجاء الحل في الكتاب الجديد: '
    'السنة الثانية <strong>لا تُمدَّد على بند الخريجين بل تُصدَر إقامةً جديدة على بند آخر '
    'من المادة نفسها</strong> (البند الذي يغطي من تقتضي قرارات الجهات الإدارية بقاءهم)، '
    'كما سمّاهما كتاب YÖK نصاً. التفصيل القانوني هذا يعنيك عملياً في شيء واحد: السنة '
    'الثانية <strong>طلب جديد يُقيَّم بشروطه</strong> لا خانة تجديد تلقائية.</p>'

    '<h2>المهل الثلاث التي لا تسامح فيها</h2>'
    '<ol>'
    '<li><strong>ستة أشهر من تاريخ التخرج</strong> لطلب السنة الأولى — الساعة تدق من '
    'تاريخ التخرج الرسمي في وثيقتك (الدبلوم أو وثيقة التخرج المؤقتة Geçici Mezuniyet '
    'Belgesi)، لا من يوم استلامك الورق. فوّتها فقد أغلق الباب — البند لمرة واحدة.</li>'
    '<li><strong>سنة الإقامة الأولى</strong> — استعملها للبحث عن عمل أو قبول دراسات '
    'عليا، لا للانتظار.</li>'
    '<li><strong>مهلة السنة الثانية</strong>: قدّم وإقامتك الأولى سارية، أو خلال '
    '<strong>90 يوماً من تاريخ انتهائها</strong> كحد أقصى بنص الكتاب — ولا تتعمد '
    'الفجوة: التقديم المبكر يبقيك في وضع نظامي متصل.</li>'
    '</ol>'

    '<h2>ملف الطلب — عبر e-ikamet كأي إقامة قصيرة</h2>'
    '<ul>'
    '<li>استمارة e-ikamet + جواز ساري للمدة المطلوبة + صور بيومترية.</li>'
    '<li><strong>وثيقة التخرج</strong> (الدبلوم أو المؤقتة) — هي التي تثبت أنك ضمن '
    'مهلة الستة أشهر في طلب السنة الأولى، وأساس الصفة في الثانية.</li>'
    '<li>تأمين صحي ساري — انتبه: انتهت معه صفتك الطلابية ونافذة GSS الطلابية؛ راجع '
    'خياراتك في <a href="/article/sgk-gss-health-insurance-turkey-2026">دليل SGK '
    'وGSS</a>.</li>'
    '<li>إثبات سكن وعنوان، وإثبات مقدرة مالية للمدة المطلوبة.</li>'
    '<li>للسنة الثانية: الشروط العامة للمادة 32 نفسها — والرفض ليس نهاية الطريق: '
    '<a href="/article/residence-rejection-appeal-turkey-2026">الاعتراض بمواعيده</a>.</li>'
    '</ul>'

    '<h2>لماذا هاتان السنتان أثمن مما تبدوان؟</h2>'
    '<ul>'
    '<li><strong>جسر إلى إذن العمل:</strong> إقامة الخريج السنوية إقامة سارية تؤسس '
    'الطلب الداخلي على إذن العمل عبر صاحب عمل — راجع '
    '<a href="/article/tourist-to-work-permit-2026">شرط الستة أشهر للطلب الداخلي</a> ثم '
    '<a href="/article/work-permit-turkey-2026">دليل إذن العمل كاملاً</a>. سنتان تعنيان '
    'موسمي توظيف كاملين بدل سباق محموم.</li>'
    '<li><strong>وقت للدراسات العليا:</strong> قدّم للماجستير من داخل تركيا بلا قطيعة '
    'إقامة — <a href="/article/masters-phd-turkey-foreigners-2026">دليل الماجستير '
    'والدكتوراه</a> — وبقبولك تعود إلى إقامة الطالب من جديد.</li>'
    '<li><strong>بديل عن وهم السياحية:</strong> كان الخريجون يُنصحون بـ«التحويل '
    'لسياحية» — وهي اليوم الأصعب منحاً كما تشرح '
    '<a href="/article/tourist-vs-student-residence-2025">المقارنة الصادقة</a>. إقامة '
    'الخريج أساس مخصص لك بنص القانون — استعمله.</li>'
    '</ul>'

    '<div style="background:#fff7ed;border-right:4px solid #ea580c;padding:14px 18px;margin:18px 0;">'
    '<p style="margin:0;"><strong>لحامل الكملك الخريج:</strong> أساس بقائك هو الحماية '
    'المؤقتة نفسها — لست بحاجة لهذا الجسر، والانتقال منه إلى نظام الإقامات قرار شبه '
    'نهائي له صفحته التحذيرية: <a href="/article/kimlik-to-residence">التحويل من '
    'الكملك إلى إقامة</a>.</p></div>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>تخرجت قبل ثلاثة أشهر — هل ما زال بابي مفتوحاً؟</h3>'
    '<p>نعم — احسب ستة أشهر من تاريخ التخرج في وثيقتك الرسمية وقدّم قبل انقضائها. '
    'ومن جاوز الستة أشهر فقد فاته هذا البند تحديداً — وتبقى أمامه أسس الإقامة الأخرى '
    'كلٌّ بشروطه.</p>'
    '<h3>هل تسمح لي إقامة الخريج بالعمل؟</h3>'
    '<p>الإقامة ليست إذن عمل — هي أساس بقاء قانوني تبحث خلاله عن صاحب عمل يقدّم لك '
    'طلب إذن العمل، وعندها يصبح إذن العمل نفسه إقامتك.</p>'
    '<h3>أنا في سنتي الأخيرة الآن — ماذا أفعل اليوم؟</h3>'
    '<p>خطط قبل التخرج: حدّث سيرتك وابدأ البحث، وفور صدور وثيقة تخرجك قدّم على إقامة '
    'الخريج ولا تنتظر نهاية الستة أشهر. رحلتك حتى هذه النقطة مشروحة في '
    '<a href="/article/student-residence-permit-2026">دليل إقامة الطالب كاملاً</a>.</p>'
    '<h3>هل يشمل القرار خريجي التعليم المفتوح؟</h3>'
    '<p>نص البند يتحدث عمّن أتمّ تعليمه العالي في تركيا دون تفصيل في الكتاب المعمَّم — '
    'ولأن إدارات الهجرة تتعامل مع المفتوح تعاملاً خاصاً في الإقامات الطلابية أصلاً، '
    'اسأل مديرية ولايتك قبل البناء عليه إن كانت شهادتك من التعليم المفتوح.</p>')

STEPS = ['قبل التخرج بفصل: حدّث سيرتك وابدأ البحث عن عمل أو قبول دراسات عليا.',
         'فور صدور وثيقة تخرجك: قدّم عبر e-ikamet على إقامة الخريج — لا تنتظر نهاية الستة أشهر.',
         'جهّز الملف: وثيقة التخرج، تأمين صحي، إثبات سكن ومقدرة مالية.',
         'استعمل السنة الأولى بجدية: موسم توظيف كامل أو ملف دراسات عليا.',
         'قدّم للسنة الثانية وإقامتك سارية — أو خلال 90 يوماً من انتهائها كحد أقصى.',
         'حصلت على عمل؟ صاحب العمل يقدّم طلب إذن العمل وهو يصبح إقامتك الجديدة.']
TIPS = ['الساعة تدق من تاريخ التخرج الرسمي في الوثيقة — لا من يوم استلامك الورق.',
        'بند الخريجين لمرة واحدة بنص القانون — تفويت الستة أشهر لا يُصلحه شيء.',
        'السنة الثانية طلب جديد يُقيَّم بشروط المادة 32 — لا تجديد تلقائي.',
        'القرار يخص خريجي التعليم العالي كله (بكالوريوس فأعلى) — لا الدراسات العليا وحدها.',
        'بتخرجك أغلقت نافذة GSS الطلابية — رتّب تأمينك قبل تقديم الطلب.',
        'إقامة الخريج تؤسس الطلب الداخلي على إذن العمل — هذه قيمتها الحقيقية.',
        'حامل الكملك لا يحتاج هذا الجسر — ولا يقرر التحويل من صفحة عامة.']
DOCS = ['وثيقة التخرج: الدبلوم أو وثيقة التخرج المؤقتة (Geçici Mezuniyet Belgesi)',
        'جواز سفر ساري للمدة المطلوبة + صور بيومترية',
        'تأمين صحي ساري (نافذة GSS الطلابية أُغلقت بالتخرج)',
        'إثبات سكن وعنوان + إثبات مقدرة مالية',
        'استمارة e-ikamet موقّعة وإيصال الرسم']
FEES = ('رسوم الإقامة القصيرة الأمد بالتعرفة الرسمية الجارية (رسم وثيقة الإقامة + الرسوم '
        'المرتبطة) وتُحدَّث دورياً — خذ الأرقام من نظام e-ikamet عند التقديم لا من أي '
        'مقال.')
WARN = ('مهلة الستة أشهر تُحسب من تاريخ التخرج الرسمي ولا تُستعاد إن فاتت — والبند لمرة '
        'واحدة بنص القانون. والسنة الثانية ليست حقاً تلقائياً بل طلب جديد بشروط المادة '
        '32 وضمن مهلته (وإقامتك سارية أو خلال 90 يوماً من انتهائها كحد أقصى). ولا تخلط '
        'بينها وبين تجديد إقامة الطالب — إقامة الطالب انتهت بانتهاء قيدك.')
SOURCE = ('كتاب رئاسة مجلس التعليم العالي YÖK إلى الجامعات رقم E-95916564-301.06.02-52864 '
          'بتاريخ 2 آب/أغسطس 2026 («بشأن إقامة قصيرة الأمد لمن أتموا تعليمهم العالي في '
          'تركيا»)، بناءً على كتاب رئاسة إدارة الهجرة رقم 59277437-000-493089 بتاريخ 29 '
          'تموز/يوليو 2026؛ والمادتان 31 و32 من قانون الأجانب والحماية الدولية 6458 '
          '(قيد المرة الواحدة والسنة الواحدة لبند الخريجين في المادة 31)')
TAGS = ['إقامة ما بعد التخرج', 'الخريجون الدوليون', 'أنواع الإقامات', 'e-ikamet',
        'خبر_رئيسي', 'دليل', '2026']
SEO_T = 'إقامة ما بعد التخرج في تركيا: سنتان الآن — القرار الجديد كاملاً'
SEO_D = ('قرار YÖK وإدارة الهجرة (آب 2026): خريج الجامعات التركية الدولي يحصل على سنة '
         'ثانية من إقامة الخريج — المجموع سنتان بعد التخرج. مهلة الستة أشهر، نافذة '
         'الـ90 يوماً، الملف والشروط، ولماذا هي جسرك إلى إذن العمل.')

N_TITLE = 'رسمياً: سنة إقامة ثانية لخريجي الجامعات التركية الأجانب — المجموع صار سنتين بعد التخرج'
N_SUMMARY = ('كتاب رسمي عمّمته رئاسة مجلس التعليم العالي YÖK على الجامعات، بناءً على كتاب '
             'رئاسة إدارة الهجرة: من حصل على إقامة الخريج السنوية (بالتقديم خلال ستة أشهر '
             'من تخرجه) يستطيع طلب سنة ثانية — وإقامته سارية أو خلال 90 يوماً من انتهائها '
             '— بشروط المادة 32. القرار يخص خريجي التعليم العالي كله، بكالوريوس فأعلى.')
N_CONTENT = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:16px 20px;">'
    '<p style="margin:0 0 10px;"><strong>ما الجديد؟</strong> كان بند الخريجين في قانون '
    '6458 يمنح سنة واحدة لمرة واحدة (بالتقديم خلال ستة أشهر من التخرج) — القرار الجديد '
    'يضيف <strong>سنة ثانية بطلب جديد</strong>، فيصبح مجموع ما بعد التخرج '
    '<strong>سنتين كاملتين</strong>.</p>'
    '<p style="margin:0 0 10px;"><strong>لمن؟</strong> كل من أتمّ تعليمه العالي في تركيا '
    '— بكالوريوس فما فوق، لا الدراسات العليا وحدها كما تناقلت بعض الصفحات.</p>'
    '<p style="margin:0 0 10px;"><strong>المهلتان:</strong> ستة أشهر من تاريخ التخرج '
    'للسنة الأولى، والسنة الثانية بطلب يُقدَّم والإقامة الأولى سارية أو خلال 90 يوماً '
    'من انتهائها كحد أقصى.</p>'
    '<p style="margin:0;"><strong>لماذا يهمك؟</strong> سنتان تعنيان موسمي توظيف كاملين '
    'للوصول إلى إذن عمل، أو وقتاً مريحاً لقبول دراسات عليا — التفاصيل والملف والشروط في '
    '<a href="/article/graduate-residence-permit-turkey-2026"><strong>الدليل الكامل '
    'لإقامة ما بعد التخرج ←</strong></a></p></div>')

for nd in ('90 يوماً', 'ستة أشهر', 'سنتين', 'المادة 32', 'لمرة واحدة', 'بكالوريوس',
           'Geçici Mezuniyet Belgesi', 'e-ikamet', '2 آب/أغسطس 2026',
           '29 تموز/يوليو 2026'):
    assert nd in DETAILS or nd in SOURCE, 'PREDICATE WOULD LIE: %r' % nd
body = DETAILS + INTRO + FEES + WARN + N_CONTENT + N_SUMMARY
assert not re.search(r'\d[\d.,]*\s*(?:ليرة|TL|دولار|\$)', body)
assert '%' not in body
assert 'الدراسات العليا وحدها' in DETAILS or 'لا الدراسات العليا وحدها' in N_CONTENT
assert len(DETAILS) > 3500
assert NEW_LI.rstrip().endswith('</li>') and SLUG in NEW_LI

COLS = ('id, slug, title, intro, details, steps, tips, documents, fees, warning, '
        'source, tags, category, status, seo_title, seo_description, last_update')
assert len(COLS.split(',')) == 17
vals = ["'" + q(SLUG) + "'", "'" + q(SLUG) + "'", "'" + q(TITLE) + "'", "'" + q(INTRO) + "'",
        "'" + q(DETAILS) + "'", arr(STEPS), arr(TIPS), arr(DOCS), "'" + q(FEES) + "'",
        "'" + q(WARN) + "'", "'" + q(SOURCE) + "'", arr(TAGS), "'أنواع الإقامات'",
        "'approved'", "'" + q(SEO_T) + "'", "'" + q(SEO_D) + "'", 'CURRENT_DATE']
assert len(vals) == 17

sql = ("""-- ============================================================================
-- إقامة ما بعد التخرج: قرار السنة الثانية — خبر مثبّت + دليل مرافق + تحديث
-- ============================================================================
-- المصدر الأولي بأيدينا: كتاب YÖK رقم E-95916564-301.06.02-52864 بتاريخ
-- 2/8/2026 (المعمَّم على الجامعات كلها)، بناءً على كتاب رئاسة إدارة الهجرة
-- رقم 59277437-000-493089 بتاريخ 29/7/2026. التداول العام مؤكَّد في صحف
-- تركية عدة بالآليات نفسها.
--
-- تصحيحان على نص الوسيط المتداول: القرار لخريجي التعليم العالي كله
-- (بكالوريوس فأعلى) لا «الدراسات العليا» فقط؛ والسنة الثانية إقامة جديدة
-- على بند آخر من المادة 31 (بند الخريجين لمرة واحدة بنص القانون) — أي طلب
-- يُقيَّم بشروط المادة 32 لا تجديد تلقائي. والنسبة للمصدر الأولي لا للقناة
-- الناقلة، وفق قاعدة الموقع.
--
-- النشر صاخب عمداً — خبرٌ يجب أن ينتشر: صف أخبار مثبّت (pinned) بتاريخ
-- افتراضي كي يلتقطه خط الإشعارات والدفع وتلغرام، والمقال يظهر جرسُه.
-- آمن لإعادة التشغيل (الخبر بحارس WHERE NOT EXISTS والمقال upsert).
-- ============================================================================

-- 1) الدليل المرافق
INSERT INTO articles (""" + COLS + """)
VALUES (""" + ',\n        '.join(vals) + """)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, intro = EXCLUDED.intro, details = EXCLUDED.details,
    steps = EXCLUDED.steps, tips = EXCLUDED.tips, documents = EXCLUDED.documents,
    fees = EXCLUDED.fees, warning = EXCLUDED.warning, source = EXCLUDED.source,
    tags = EXCLUDED.tags, category = EXCLUDED.category, status = EXCLUDED.status,
    seo_title = EXCLUDED.seo_title, seo_description = EXCLUDED.seo_description,
    last_update = EXCLUDED.last_update;

-- 2) قسم «ماذا بعد التخرج» في دليل إقامة الطالب يكسب الخيار الجديد (محروس)
UPDATE articles
   SET details = replace(details, '""" + q(NEEDLE) + """',
                         '""" + q(NEW_LI) + q(NEEDLE) + """'),
       last_update = CURRENT_DATE
 WHERE slug = '""" + GUIDE + """'
   AND position('graduate-residence-permit-turkey-2026' in details) = 0;

-- 3) الخبر المثبّت (بتاريخ افتراضي — الإشعارات مقصودة)
INSERT INTO updates (type, title, summary, content, link, category, date, active, pinned, source_name)
SELECT 'news',
       '""" + q(N_TITLE) + """',
       '""" + q(N_SUMMARY) + """',
       '""" + q(N_CONTENT) + """',
       '/article/""" + SLUG + """',
       'official',
       CURRENT_DATE,
       true,
       true,
       '""" + q('رئاسة مجلس التعليم العالي YÖK — كتاب رسمي معمَّم على الجامعات (2 آب/أغسطس 2026) بناءً على كتاب رئاسة إدارة الهجرة (29 تموز/يوليو 2026)') + """'
WHERE NOT EXISTS (SELECT 1 FROM updates WHERE link = '/article/""" + SLUG + """');

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM articles
     WHERE slug = '""" + SLUG + """' AND status = 'approved'
       AND position('90 يوماً' in details) > 0
       AND position('لمرة واحدة' in details) > 0
       AND position('المادة 32' in details) > 0
       AND length(details) > 3500;
    IF n <> 1 THEN RAISE EXCEPTION 'graduate guide did not land'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug = '""" + SLUG + """';
    IF n <> 1 THEN RAISE EXCEPTION 'duplicate slug'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = '""" + GUIDE + """'
       AND position('graduate-residence-permit-turkey-2026' in details) > 0;
    IF n <> 1 THEN RAISE EXCEPTION 'student-guide insert did not land'; END IF;

    SELECT count(*) INTO n FROM updates
     WHERE link = '/article/""" + SLUG + """' AND active AND pinned;
    IF n <> 1 THEN RAISE EXCEPTION 'news row missing or not pinned (% rows)', n; END IF;
END
$check$;

SELECT 'المقال' AS البند, slug AS المعرف, length(details)::text AS الحجم
  FROM articles WHERE slug = '""" + SLUG + """'
UNION ALL
SELECT 'دليل الطالب محدث', slug, (position('graduate-residence-permit-turkey-2026' in details) > 0)::text
  FROM articles WHERE slug = '""" + GUIDE + """'
UNION ALL
SELECT 'الخبر المثبت', link, pinned::text
  FROM updates WHERE link = '/article/""" + SLUG + """';
""")

code = '\n'.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
assert re.sub(r"''", '', code).count("'") % 2 == 0, 'quote imbalance'
assert code.count('INSERT INTO articles') == 1 and code.count('INSERT INTO updates') == 1
assert 'session_replication_role' not in code
assert 'WHERE NOT EXISTS' in code

path = os.path.join(REPO, 'sql', '2026-08-08_graduate_residence_news.sql')
open(path, 'w', encoding='utf-8', newline='').write(sql)
print('المقال  : %s (%d حرفاً، %d روابط)' % (SLUG, len(DETAILS),
      len(re.findall(r'href="/article/', DETAILS))))
print('التحديث : قسم ما بعد التخرج في %s (إبرة ×%d)' % (GUIDE, gd.count(NEEDLE)))
print('الخبر   : مثبّت pinned + إشعارات مقصودة (لا كتم هذه المرة)')
print('written :', path, len(sql), 'chars')
