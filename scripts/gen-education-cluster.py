# -*- coding: utf-8 -*-
"""Education-services finale: the deferred trio becomes real, plus one free fold.

── the trio (deferred across three batches, now due) ─────────────────────

transcript-edevlet (204, 3v)   → the student-documents page: Transkript AND
                                 Öğrenci Belgesi from e-Devlet — barcoded,
                                 instant, free; when a wet stamp is still
                                 demanded (öğrenci işleri); and where these
                                 papers actually go: attestation files, the
                                 student work permit, the student travel
                                 permit.
tomer-registration (265, 4v)   → the Turkish-language page: TÖMER centres
                                 and CEFR levels, the placement test, C1 as
                                 the usual bar for Turkish-medium study —
                                 and the alternative nobody sells because
                                 it is free: Halk Eğitim public courses.
btk-akademi-courses (186, 8v)  → the free-courses page: a state platform
                                 (BTK), free with certificates, e-Devlet
                                 login, mostly-Turkish caveat stated.

── plus one free fold spotted in the final sweep ─────────────────────────

deportation-centers-rights (123 chars, 8v) duplicates the exact topic of
detention-center-rights (27,008 chars, built from Turkish law in the rights
cluster). It folds behind a 301. A 123-char scrap next to a 27K guide is
pure query dilution on the site's most sensitive topic.

── deliberately left for named future batches ────────────────────────────

undocumented-status (sensitive, needs the rights-cluster verification bar),
tourist-vs-student-residence-2025 + tourist-residence + kimlik-to-residence
(the residence batch), and the singles judged one by one later. Asserted
live where referenced.

All four rows id == slug (checked). No lira figures (asserted).
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


TRANS = 'transcript-edevlet'
TOMER = 'tomer-registration'
BTK = 'btk-akademi-courses'
DEAD = ['deportation-centers-rights']

for s in (TRANS, TOMER, BTK):
    r = get('articles?select=id,slug,status,details&slug=eq.' + s)[0]
    assert r['status'] == 'approved' and r['id'] == r['slug'] and len(r['details'] or '') < 1000, s
for d in DEAD:
    r = get('articles?select=id,slug,status&slug=eq.' + d)
    assert r and r[0]['status'] == 'approved' and r[0]['id'] == r[0]['slug'], d
dt = get('articles?select=status,details&slug=eq.detention-center-rights')[0]
assert dt['status'] == 'approved' and len(dt['details']) > 20000, 'the detention canonical must be intact'
for s in ('school-registration-turkey', 'scholarship-turkiye-burslari', 'private-universities-turkey-2026',
          'work-permit-students', 'travel-permit', 'document-attestation-turkey-to-syria-students-2026',
          'mesem-vocational-training-syrians-foreigners-turkey-2026'):
    r = get('articles?select=status&slug=eq.' + s)
    assert r and r[0]['status'] == 'approved', s + ' not live'

ART = """INSERT INTO articles (id, slug, title, intro, details, steps, tips, documents,
                      fees, warning, source, tags, category, status,
                      seo_title, seo_description, last_update)
VALUES ('{slug}', '{slug}', '{title}', '{intro}', '{details}', {steps}, {tips}, {docs},
        '{fees}', '{warn}', '{source}', {tags}, '{cat}', 'approved',
        '{seo_t}', '{seo_d}', CURRENT_DATE)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, intro = EXCLUDED.intro, details = EXCLUDED.details,
    steps = EXCLUDED.steps, tips = EXCLUDED.tips, documents = EXCLUDED.documents,
    fees = EXCLUDED.fees, warning = EXCLUDED.warning, source = EXCLUDED.source,
    tags = EXCLUDED.tags, category = EXCLUDED.category, status = EXCLUDED.status,
    seo_title = EXCLUDED.seo_title, seo_description = EXCLUDED.seo_description,
    last_update = EXCLUDED.last_update;"""


def art_sql(**kw):
    esc = {}
    for k, v in kw.items():
        esc[k] = q(v) if isinstance(v, str) and k not in ('slug', 'steps', 'tips', 'docs', 'tags') else v
    return ART.format(**esc)


T_DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الخلاصة</strong></p>'
    '<p style="margin:0;">وثيقتا الطالب الجامعي الأكثر طلباً — <strong>كشف الدرجات</strong> '
    '(<span dir="ltr">Transkript</span>) و<strong>وثيقة الطالب</strong> '
    '(<span dir="ltr">Öğrenci Belgesi</span>) — تستخرجهما <strong>مجاناً وفوراً</strong> من '
    'e-Devlet برمز تحقّق تقبله الجهات. لا طوابير قلم الطلاب إلا حين يُطلب ختمٌ رطب '
    'صراحةً.</p></div>'

    '<h2>الاستخراج من e-Devlet</h2>'
    '<ol>'
    '<li>ابحث في e-Devlet عن <span dir="ltr">Transkript Belgesi Sorgulama</span> لكشف '
    'الدرجات، أو <span dir="ltr">Öğrenci Belgesi Sorgulama</span> لوثيقة الطالب.</li>'
    '<li>اختر جامعتك وأنشئ الوثيقة — تصدر PDF <strong>برمز تحقّق</strong> تتثبّت به أي '
    'جهة من صحتها.</li>'
    '<li>الخدمة تغطّي الجامعات المربوطة بمنظومة التعليم العالي — وأغلب الجامعات الحكومية '
    'والكثير من الخاصة مربوطة؛ إن لم تجد جامعتك فمرجعك قلم شؤون الطلاب '
    '(Öğrenci İşleri).</li>'
    '</ol>'

    '<h2>متى تحتاج قلم الطلاب رغم كل شيء؟</h2>'
    '<ul>'
    '<li>حين تشترط الجهة <strong>ختماً رطباً وتوقيعاً</strong> نصّاً — بعض القنصليات '
    'وجهات الخارج ما زالت تطلبه.</li>'
    '<li>حين تحتاج صيغة خاصة (بالإنجليزية، أو بترويسة معيّنة، أو لسنوات محدّدة).</li>'
    '<li>جامعتك غير مربوطة بالخدمة.</li>'
    '</ul>'

    '<h2>إلى أين تذهب هاتان الوثيقتان عادةً؟</h2>'
    '<ul>'
    '<li><strong>ملفات التصديق والتعادل</strong> نحو سوريا وغيرها — كشف الدرجات ركن '
    'الملف: <a href="/article/document-attestation-turkey-to-syria-students-2026">مسار '
    'التصديق للطلاب والخريجين</a>.</li>'
    '<li><strong>إذن عمل الطالب</strong> — وثيقة الطالب من أساسياته: '
    '<a href="/article/work-permit-students">عمل الطلاب الأجانب</a>.</li>'
    '<li><strong>إذن السفر الدراسي</strong> لحامل الكملك في جامعة وقفية — وثيقة استمرار '
    'الدراسة مع التقويم الأكاديمي: <a href="/article/travel-permit">دليل إذن السفر</a>.</li>'
    '<li>المنح، والسكن الطلابي، وتخفيضات المواصلات — كلّها تسأل عن وثيقة الطالب.</li>'
    '</ul>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>تخرّجت — هل ما زلت أستخرج الكشف من e-Devlet؟</h3>'
    '<p>وثيقة الطالب تنتهي بانتهاء القيد؛ أمّا كشف درجات الخرّيج وشهادته فبحسب ربط '
    'جامعتك — جرّب الخدمة، وإلا فقلم الطلاب/الخرّيجين في جامعتك.</p>'
    '<h3>الجهة رفضت النسخة الإلكترونية؟</h3>'
    '<p>رمز التحقّق حجّتك أولاً — فإن أصرّت على الرطب فهو حقّها الإجرائي: قلم الطلاب '
    'يصدره، وخذ أكثر من نسخة ما دمت هناك.</p>'
)

M_DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الخلاصة</strong></p>'
    '<p style="margin:0;">TÖMER معاهد اللغة التركية التابعة للجامعات: اختبار تحديد مستوى، '
    'ثم سلّم <span dir="ltr">A1–C1</span>، وشهادة <strong>C1</strong> هي العتبة المعتادة '
    'للدراسة الجامعية بالتركية. رسومها تتفاوت بين جامعة وأخرى — '
    'و<strong>البديل المجاني الذي لا يبيعه لك أحد</strong>: دورات مراكز التعليم الشعبي '
    '(Halk Eğitim) الحكومية.</p></div>'

    '<h2>ما هو TÖMER — وكيف يعمل؟</h2>'
    '<p>معاهد لتعليم التركية تتبع الجامعات (أشهرها تاريخياً معهد جامعة أنقرة، ولكل جامعة '
    'كبرى معهدها اليوم). المسار المعتاد:</p>'
    '<ol>'
    '<li><strong>اختبار تحديد مستوى</strong> يضعك في مستواك الحقيقي — لا تدفع لمستوى '
    'تجاوزته.</li>'
    '<li><strong>السلّم الأوروبي A1 → C1</strong> على دورات (Kur) متتابعة.</li>'
    '<li><strong>شهادة إتمام المستوى</strong> — وC1 هي المطلوبة عادةً للبرامج الجامعية '
    'الناطقة بالتركية أو للإعفاء من سنة اللغة.</li>'
    '</ol>'

    '<h2>قبل أن تدفع: ثلاثة أسئلة</h2>'
    '<ul>'
    '<li><strong>هل جامعتك المستهدفة تقبل شهادة هذا المعهد؟</strong> القبول شأن كل '
    'جامعة — اسأل قسم القبول في جامعتك <em>المستهدفة</em> قبل التسجيل في أي معهد.</li>'
    '<li><strong>كم الرسم؟</strong> يتفاوت بين الجامعات ويتغيّر سنوياً — لا رقم ننشره؛ '
    'قارن بين معهدين أو ثلاثة في مدينتك.</li>'
    '<li><strong>هل تحتاج C1 فعلاً؟</strong> برامج الإنجليزية لا تطلبها، وبعض الجهات '
    'يكفيها ما دون — حدّد هدفك قبل طريقك.</li>'
    '</ul>'

    '<h2>البديل المجاني: مراكز التعليم الشعبي (Halk Eğitim)</h2>'
    '<p>مراكز حكومية في كل قضاء تقدّم دورات تركية <strong>مجانية</strong> بشهادات '
    'إتمام. ليست بديلاً مكافئاً لـC1 الجامعية في ملفات القبول عادةً، لكنها الطريق '
    'الأذكى لتعلّم اللغة للحياة والعمل بلا كلفة — واسأل مركز قضائك عن مواعيد الدورات. '
    'وللمهارات المهنية المجانية: '
    '<a href="/article/mesem-vocational-training-syrians-foreigners-turkey-2026">مراكز '
    'MESEM</a> و<a href="/article/btk-akademi-courses">منصة BTK Akademi</a>.</p>'

    '<h2>وبعد اللغة؟</h2>'
    '<p>الطريق الجامعي كاملاً عندنا: '
    '<a href="/article/private-universities-turkey-2026">الجامعات الخاصة</a>، و'
    '<a href="/article/scholarship-turkiye-burslari">منحة الحكومة التركية</a>، '
    'ولأولادك <a href="/article/school-registration-turkey">تسجيل المدارس</a>.</p>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>كم تستغرق من الصفر إلى C1؟</h3>'
    '<p>بحسب كثافة الدورات وانتظامك — المسار المتفرّغ أشهر عديدة لا أسابيع. من وعدك '
    'بـC1 في شهر يبيعك ورقة لا لغة.</p>'
    '<h3>هل شهادة TÖMER تكفي للجنسية أو الإقامة؟</h3>'
    '<p>لا شرط لغة عاماً في ملفات الإقامة الاعتيادية — والشهادة أداة قبول جامعي '
    'وعمل أساساً. لا تشترِ دورة لملفٍ لا يطلبها.</p>'
)

B_DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الخلاصة</strong></p>'
    '<p style="margin:0;"><span dir="ltr">BTK Akademi</span> منصة حكومية (تابعة لهيئة '
    'الاتصالات BTK) تقدّم دورات <strong>مجانية بشهادات</strong> — برمجة، وأمن معلومات، '
    'وتصميم، ومهارات رقمية. الدخول بحساب e-Devlet، والشهادة عند إتمام الدورة. '
    'قيدها الوحيد: المحتوى <strong>بالتركية غالباً</strong>.</p></div>'

    '<h2>ما الذي تجده فيها؟</h2>'
    '<ul>'
    '<li>مسارات برمجة وتطوير (بايثون، جافا، ويب…) من الصفر إلى المتقدم.</li>'
    '<li>أمن سيبراني، وشبكات، وذكاء اصطناعي، وتحليل بيانات.</li>'
    '<li>مهارات رقمية عامة تصلح لكل باحث عمل.</li>'
    '</ul>'
    '<p>الدورات ذاتية الوتيرة: فيديوهات وتمارين، وشهادة إلكترونية عند الإتمام تضيفها '
    'إلى سيرتك.</p>'

    '<h2>التسجيل</h2>'
    '<ol>'
    '<li>ادخل منصة <span dir="ltr">btkakademi.gov.tr</span>.</li>'
    '<li>سجّل بحساب <strong>e-Devlet</strong> (يعمل برقمك الأجنبي كما بالتركي) أو '
    'بإنشاء حساب على المنصة.</li>'
    '<li>اختر مسارك وابدأ — كل شيء مجاني.</li>'
    '</ol>'

    '<h2>قيمة الشهادة — بصراحة</h2>'
    '<p>شهادة إتمام دورة، لا شهادة جامعية ولا رخصة مهنية: قيمتها في '
    '<strong>المهارة التي بنيتها</strong> وفي إظهار الجدّية على السيرة — خاصة لمن يدخل '
    'سوق العمل التقني بلا شهادة رسمية في المجال. ولا يبيعك أحد «شهادة BTK معتمدة» '
    'بمقابل — المنصة مجانية بالكامل.</p>'

    '<h2>واللغة عائقك؟</h2>'
    '<p>المحتوى بالتركية غالباً — وهو نفسه تمرين لغة ممتاز لمن بلغ مستوى متوسطاً. '
    'وإن كانت لغتك دون ذلك فابدأ من '
    '<a href="/article/tomer-registration">دورات التركية (TÖMER والتعليم الشعبي '
    'المجاني)</a> بالتوازي. وللتدريب المهني الحرفي: '
    '<a href="/article/mesem-vocational-training-syrians-foreigners-turkey-2026">مراكز '
    'MESEM</a>. ولمن يسأل عن العمل بعد المهارة: '
    '<a href="/article/work-permit-turkey-2026">دليل إذن العمل</a>.</p>'
)

for label, body, needles in [
    ('transcript', T_DETAILS, ['Transkript', 'Öğrenci Belgesi', 'رمز تحقّق',
                               'document-attestation-turkey-to-syria-students-2026',
                               'work-permit-students', 'travel-permit']),
    ('tomer', M_DETAILS, ['A1', 'C1', 'Halk Eğitim', 'مجانية', 'اختبار تحديد مستوى',
                          'scholarship-turkiye-burslari', 'btk-akademi-courses']),
    ('btk', B_DETAILS, ['btkakademi.gov.tr', 'e-Devlet', 'بالتركية غالباً',
                        'tomer-registration', 'مجاني']),
]:
    for nd in needles:
        assert nd in body, 'PREDICATE WOULD LIE: %r not in %s' % (nd, label)
ALL = T_DETAILS + M_DETAILS + B_DETAILS
for dead in DEAD:
    assert ('href="/article/%s"' % dead) not in ALL
assert not re.search(r'\d[\d.,]*\s*(?:ليرة|TL)', ALL)
assert '%' not in ALL

arts = '\n\n'.join([
    art_sql(slug=TRANS,
            title='وثائق الطالب من e-Devlet: كشف الدرجات ووثيقة الطالب مجاناً وفوراً — ومتى يلزم الختم الرطب',
            intro='كشف الدرجات (Transkript) ووثيقة الطالب (Öğrenci Belgesi) — أكثر وثيقتين يطلبهما أي ملف طلابي — تستخرجهما مجاناً خلال دقيقة من e-Devlet برمز تحقّق تقبله الجهات. هذا الدليل يريك الاستخراج، ومتى يبقى قلم الطلاب لازماً (الختم الرطب والصيغ الخاصة)، وإلى أين تذهب الوثيقتان فعلاً: التصديق، وإذن عمل الطالب، وإذن السفر الدراسي.',
            details=T_DETAILS,
            steps=arr(['ابحث في e-Devlet عن Transkript Belgesi أو Öğrenci Belgesi Sorgulama.',
                       'اختر جامعتك وأنشئ الوثيقة وحمّلها PDF برمز التحقّق.',
                       'جامعتك غير مربوطة أو الجهة تشترط ختماً رطباً؟ قلم شؤون الطلاب.',
                       'وجّه الوثيقة لغرضها: تصديق، إذن عمل طالب، إذن سفر دراسي، منح وسكن.',
                       'خذ نسخاً إضافية عند مراجعة القلم — توفّر مراجعات قادمة.']),
            tips=arr(['رمز التحقّق هو الوثيقة — أكثر الجهات لا تحتاج ورقة أصلاً.',
                      'مجانية وفورية — لا تدفع لوسيط «يستخرجها».',
                      'الختم الرطب حقّ إجرائي لبعض الجهات — لا تجادل، استخرجه من القلم.',
                      'وثيقة الطالب تنتهي بانتهاء القيد — استخرج حاجتك في وقتها.',
                      'لملف التصديق نحو سوريا: الكشف ركن الملف — راجع دليله قبل الترتيب.']),
            docs=arr(['حساب e-Devlet (برقمك الأجنبي أو التركي)',
                      'لا شيء آخر للإلكترونية — وهويتك لقلم الطلاب عند الرطب']),
            fees='الاستخراج من e-Devlet مجاني بالكامل. ونسخ قلم الطلاب بحسب نظام جامعتك — وأكثرها مجاني أيضاً.',
            warn='بعض الجهات (قنصليات وجهات خارجية) تشترط الختم الرطب نصاً — اقرأ متطلب جهتك قبل الاكتفاء بالإلكترونية. ووثيقة الطالب لا تصدر بعد انتهاء قيدك.',
            source='خدمتا Transkript Belgesi Sorgulama وÖğrenci Belgesi Sorgulama على بوابة e-Devlet (turkiye.gov.tr) للجامعات المربوطة بمنظومة التعليم العالي — وثائق مرمَّزة للتحقّق؛ وأقلام شؤون الطلاب للصيغ الورقية',
            tags=arr(['كشف الدرجات', 'وثيقة الطالب', 'e-Devlet', 'الدراسة والتعليم', 'دليل', '2026']),
            cat='الدراسة والتعليم',
            seo_t='كشف الدرجات ووثيقة الطالب من e-Devlet مجاناً — خلال دقيقة',
            seo_d='Transkript وÖğrenci Belgesi برمز تحقّق تقبله الجهات، ومتى يبقى الختم الرطب لازماً — وإلى أين تذهب الوثيقتان: التصديق وإذن عمل الطالب وإذن السفر الدراسي.'),
    art_sql(slug=TOMER,
            title='تعلّم التركية 2026: معاهد TÖMER من A1 إلى C1 — والبديل المجاني في مراكز التعليم الشعبي',
            intro='C1 هي عتبة الدراسة الجامعية بالتركية — ومعاهد TÖMER الجامعية طريقها المعتاد: اختبار مستوى، فسلّم دورات، فشهادة. لكن قبل أن تدفع: تأكّد أن جامعتك المستهدفة تقبل شهادة معهدك، وقارن الرسوم بين المعاهد — واعرف البديل المجاني الذي لا يبيعه لك أحد: دورات مراكز التعليم الشعبي الحكومية لمن يريد اللغة للحياة والعمل.',
            details=M_DETAILS,
            steps=arr(['حدّد هدفك أولاً: قبول جامعي بالتركية (تحتاج C1 غالباً) أم لغة للحياة والعمل؟',
                       'لهدف الجامعة: اسأل قسم القبول في جامعتك المستهدفة أي شهادات يقبل — قبل أي تسجيل.',
                       'قارن رسوم معهدين أو ثلاثة في مدينتك — تتفاوت وتتغيّر سنوياً.',
                       'قدّم لاختبار تحديد المستوى ولا تدفع لمستوى تجاوزته.',
                       'وللغة الحياة: اسأل مركز التعليم الشعبي في قضائك عن الدورات المجانية.',
                       'تابع بانتظام — C1 مسار أشهر لا أسابيع.']),
            tips=arr(['اختبار تحديد المستوى يوفّر عليك دورات كاملة — لا تبدأ من الصفر افتراضاً.',
                      'قبول الشهادة شأن الجامعة المستهدفة — اسألها هي لا المعهد.',
                      'دورات Halk Eğitim مجانية بشهادات — الأذكى لغير هدف القبول الجامعي.',
                      'برامج الإنجليزية لا تطلب C1 — لا تشترِ ما لا يطلبه ملفك.',
                      'من وعدك بـC1 في شهر يبيعك ورقة لا لغة.']),
            docs=arr(['جواز/كملك/إقامة للتسجيل',
                      'لمعاهد الجامعات: ما يطلبه المعهد (صور، رسوم الدورة)',
                      'لمراكز التعليم الشعبي: هويتك — والدورات مجانية']),
            fees='رسوم معاهد TÖMER تتفاوت بين الجامعات وتتغيّر سنوياً — لا رقم ننشره؛ قارن بنفسك بين معاهد مدينتك. ودورات مراكز التعليم الشعبي مجانية.',
            warn='لا تسجّل في معهد قبل سؤال جامعتك المستهدفة عن الشهادات المقبولة لديها. ولا شرط لغة عاماً لملفات الإقامة الاعتيادية — لا تشترِ دورة لملف لا يطلبها.',
            source='معاهد تعليم التركية الجامعية (TÖMER) وسلّم المستويات الأوروبي A1–C1 وشهادة C1 كعتبة معتادة للبرامج الناطقة بالتركية؛ ودورات اللغة التركية المجانية في مراكز التعليم الشعبي (Halk Eğitim Merkezleri) التابعة لوزارة التربية',
            tags=arr(['TÖMER', 'تعلم التركية', 'الدراسة والتعليم', 'Halk Eğitim', 'دليل', '2026']),
            cat='الدراسة والتعليم',
            seo_t='تعلم التركية: TÖMER حتى C1 — والبديل المجاني Halk Eğitim',
            seo_d='C1 عتبة الدراسة بالتركية ومعاهد TÖMER طريقها — اختبار المستوى، ومقارنة الرسوم، وسؤال جامعتك المستهدفة أولاً. وللحياة والعمل: دورات مراكز التعليم الشعبي مجاناً.'),
    art_sql(slug=BTK,
            title='BTK Akademi: دورات برمجة وتقنية مجانية بشهادات من منصة حكومية — بحساب e-Devlet',
            intro='منصة حكومية تعطيك دورات برمجة وأمن معلومات ومهارات رقمية مجاناً بالكامل، بشهادة عند الإتمام، وتسجيل بحساب e-Devlet — تعمل برقمك الأجنبي كما بالتركي. قيدها الوحيد أنّ المحتوى بالتركية غالباً، وهذا نفسه تمرين لغة لمن بلغ مستوى متوسطاً. دليل مختصر صادق: ما تجده، وكيف تسجّل، وما قيمة الشهادة فعلاً.',
            details=B_DETAILS,
            steps=arr(['ادخل btkakademi.gov.tr وسجّل بحساب e-Devlet.',
                       'اختر مساراً يخدم هدفاً محدداً (وظيفة، مهارة) لا «دورات للتجميع».',
                       'تابع بوتيرتك وأتمّ التمارين — الشهادة عند الإتمام.',
                       'أضف المهارة والشهادة إلى سيرتك مع ما بنيته فعلاً.',
                       'لغتك دون المتوسط؟ وازِ الدورات بتعلم التركية.']),
            tips=arr(['مجانية بالكامل — من يبيعك «تسجيلاً» أو «شهادة معتمدة» بمقابل يحتال.',
                      'الشهادة قيمتها بالمهارة خلفها — أتمم التمارين لا الفيديوهات فقط.',
                      'المحتوى بالتركية غالباً — وهو تمرين لغة إضافي لا عائق فقط.',
                      'الدخول برقمك الأجنبي عبر e-Devlet يعمل.',
                      'للحِرَف اليدوية والمهن: مراكز MESEM هي البديل العملي.']),
            docs=arr(['حساب e-Devlet (أو حساب منصة جديد)',
                      'لا شيء آخر — لا رسوم ولا أوراق']),
            fees='مجانية بالكامل: الدورات والشهادات والتسجيل. أي مقابل يُطلب منك باسم المنصة احتيال.',
            warn='الشهادة شهادة إتمام دورة لا شهادة جامعية ولا رخصة مهنية — قيمتها بالمهارة التي بنيتها. والمحتوى بالتركية غالباً فقيّم مستواك قبل مسار متقدم.',
            source='منصة BTK Akademi الحكومية (btkakademi.gov.tr) التابعة لهيئة المعلومات والاتصالات BTK — دورات مجانية بشهادات إتمام، والدخول عبر e-Devlet',
            tags=arr(['BTK Akademi', 'دورات مجانية', 'البرمجة', 'الدراسة والتعليم', 'دليل', '2026']),
            cat='الدراسة والتعليم',
            seo_t='BTK Akademi: دورات تقنية مجانية بشهادات — بحساب e-Devlet',
            seo_d='منصة حكومية: برمجة وأمن معلومات ومهارات رقمية مجاناً بالكامل بشهادات إتمام، والتسجيل بحساب e-Devlet برقمك الأجنبي — والمحتوى بالتركية غالباً، وقيمة الشهادة بصراحة.'),
])
arts = arts.replace('%', '%%')

sql = _no_bare_percent("""-- ============================================================================
-- ختام خدمات التعليم: الثلاثية المؤجَّلة تصير حقيقية — وطيّة مجانية أخيرة
-- ============================================================================
-- * وثائق الطالب: كشف الدرجات ووثيقة الطالب من e-Devlet مجاناً برمز تحقّق —
--   ومتى يبقى الختم الرطب لازماً، وإلى أين تذهب الوثيقتان (التصديق، إذن عمل
--   الطالب، إذن السفر الدراسي).
-- * TÖMER: سلّم A1–C1 واختبار المستوى وسؤال الجامعة المستهدفة قبل الدفع —
--   والبديل المجاني الذي لا يبيعه أحد: مراكز التعليم الشعبي.
-- * BTK Akademi: منصة حكومية مجانية بشهادات، بصراحة كاملة عن قيمة الشهادة
--   وقيد اللغة.
-- * deportation-centers-rights (123 حرفاً) يتقاعد إلى دليل الاحتجاز الكامل
--   (27 ألف حرف) — قصاصة بجوار مرجع في أحسّ مواضيع الموقع = تمييع استعلام
--   محض.
--
-- الصفوف الأربعة id == slug (فُحص). لا أرقام ليرات (مؤكَّد آلياً).
-- آمن لإعادة التشغيل.
-- ============================================================================

""") + arts + _no_bare_percent("""

-- الطيّة الأخيرة
UPDATE articles SET status = 'draft', last_update = CURRENT_DATE
WHERE slug IN (%s) AND status = 'approved';

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved' AND details LIKE '%%Öğrenci Belgesi%%';
    IF n <> 1 THEN RAISE EXCEPTION 'transcript rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved' AND details LIKE '%%Halk Eğitim%%';
    IF n <> 1 THEN RAISE EXCEPTION 'tomer rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved' AND details LIKE '%%btkakademi.gov.tr%%';
    IF n <> 1 THEN RAISE EXCEPTION 'btk rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = 'detention-center-rights' AND status = 'approved' AND length(details) > 20000;
    IF n <> 1 THEN RAISE EXCEPTION 'the detention canonical is not intact'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug IN (%s) AND status = 'approved';
    IF n > 0 THEN RAISE EXCEPTION '%% stub(s) still approved', n; END IF;
END
$check$;

SELECT 'student docs rebuilt (Transkript + Ogrenci Belgesi)' AS البند,
       (details LIKE '%%Öğrenci Belgesi%%')::text AS النتيجة
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'tomer rebuilt (A1-C1 + the free Halk Egitim alternative)',
       (details LIKE '%%Halk Eğitim%%')::text
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'btk rebuilt (free state platform, honest certificate value)',
       (details LIKE '%%btkakademi.gov.tr%%')::text
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'the 123-char scrap retired next to the 27K guide', count(*)::text
FROM articles WHERE slug IN (%s) AND status = 'approved';
""") % (', '.join("'%s'" % d for d in DEAD),
        TRANS, TOMER, BTK, ', '.join("'%s'" % d for d in DEAD),
        TRANS, TOMER, BTK, ', '.join("'%s'" % d for d in DEAD))

path = os.path.join(REPO, 'sql', '2026-08-07_education_cluster.sql')
open(path, 'w', encoding='utf-8', newline='').write(sql)

_code = '\n'.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('وثائق الطالب : %s — 204 ← %d حرفاً' % (TRANS, len(T_DETAILS)))
print('TÖMER        : %s — 265 ← %d حرفاً (+ بديل Halk Eğitim المجاني)' % (TOMER, len(M_DETAILS)))
print('BTK Akademi  : %s — 186 ← %d حرفاً' % (BTK, len(B_DETAILS)))
print('الطيّة       : deportation-centers-rights (123) ← دليل الاحتجاز (27 ألفاً)')
print('%% متبقية    :', sql.count('%%'))
print('quote parity :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written      :', path, len(sql), 'chars')
