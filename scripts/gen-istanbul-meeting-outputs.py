# -*- coding: utf-8 -*-
"""İstanbul coordination-meeting outputs: travel permits, exemption, courts.

The statement covers nine sections. Two of them correct defects already on the
site, and those are what this file is for. The rest is either already published
(the five neighbourhoods, the notary route, the daily quotas — all shipped in
2026-08-06_istanbul_noter_route.sql) or is context that does not change what a
reader should do.

── DEFECT 1: travel-permit says restricted provinces are «تُرفض غالباً» ──

The page, 17 views and 1,587 characters, tells readers: «طلبات السفر للولايات
المحظورة (مثل إسطنبول وأنقرة) تُرفض غالباً». The statement says otherwise — a
restricted province is not a refusal, it is a shorter cap: up to 7 days per
calendar year instead of up to 15. Telling someone the door is closed when it is
merely narrower is the same failure this audit removed from the V-87 page.

── DEFECT 2: the province list is missing one ──

The page lists sixteen: أنقرة، أنطاليا، آيدن، بورصة، شناق قلعة، دوزجة، أدرنة،
هاتاي، إسطنبول، إزمير، كيركرلارلي، كوجلي، موغلا، سكاريا، تيكيرداغ، يالوفا.
The statement lists seventeen — the same plus **باليكسير**. A reader heading to
Balıkesir reads "unrestricted", plans on 15 days, and is capped at 7.

── AND WHAT NO PAGE HAS AT ALL ──

Not one of the 235 approved articles carries the durations, the eligibility
categories, or the A-99 criterion. Checked: «120», «A-99» and «تكيرداغ» appear
in no travel-permit page together. So the page is rebuilt around the official
grid — 120 days for work, 90 for treatment, 15 for a visit to an unrestricted
province, 7 per calendar year for a restricted one, 30 for marriage, 7 for an
engagement, 15 for a funeral or accompanying a patient or a consular
appointment, 15 to accompany family to the border on voluntary return — and the
five criteria that decide eligibility before any of that matters.

The page also carried sixteen steps that were three different procedures
concatenated (a general flow, a medical flow, a visit flow) with duplicated
tips. Rebuilt as one flow with the purpose-specific documents named per purpose.

── DEFECT 3: the work-permit exemption facilitations ──

work-permit-exemption-2026 (9,721 chars) describes the categories but none of
the changes announced: the quota system abolished, fee exemption, the
Değerli Kâğıt Bedeli abolished, the minimum-wage-multiple salary requirement
abolished, and the document obtainable through Göç e-Randevu in one step.

── DEFECT 4: courts ──

tahdit-entry-restriction-codes-how-to-object explains how to object but never
says what happens after a win. The directorate stated that administrative-court
annulment decisions are executed within 8 days. Someone holding a judgment and
not knowing there is a period at all cannot tell delay from inaction.

── A GUARD I ADDED TO MYSELF ──

Four times this session a verification predicate asserted a string that the
content did not contain, or asserted the absence of a string the fix quotes on
purpose. Every predicate below is now checked against the actual content in this
script BEFORE the SQL is written, and the script refuses to emit a file whose
own checks would lie.
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


def fetch(slug):
    u = '%s/rest/v1/articles?select=*&slug=eq.%s' % (_URL, urllib.parse.quote(slug, safe=''))
    r = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=_H)))
    return r[0] if r else None


def q(s):
    return str(s if s is not None else '').replace("'", "''")


def arr(items):
    return 'ARRAY[%s]::text[]' % ', '.join("'%s'" % q(x) for x in items)


tp = fetch('travel-permit')
assert tp and 'تُرفض غالباً' in ' '.join(tp['tips'] or []), 'the refusal claim moved'
wpe = fetch('work-permit-exemption-2026')
assert wpe and 'الحصص' not in (wpe['details'] or ''), 'exemption page already updated'
th = fetch('tahdit-entry-restriction-codes-how-to-object')
assert th and 'ثمانية أيام' not in (th['details'] or ''), 'tahdit page already updated'

# ── the seventeen, as the directorate listed them ─────────────────────────
RESTRICTED = ['أنقرة', 'أنطاليا', 'أيدن', 'باليكسير', 'بورصة', 'تشاناق قلعة', 'دوزجه',
              'أدرنة', 'هاتاي', 'إسطنبول', 'إزمير', 'كيركلاريلي', 'كوجالي', 'موغلا',
              'ساكاريا', 'تكيرداغ', 'يالوفا']
assert len(RESTRICTED) == 17

TP_DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>أهمّ تصحيح في هذه الصفحة</strong></p>'
    '<p style="margin:0;">الولاية «المقيَّدة» <strong>لا تعني أنّ طلبك يُرفض</strong>. تعني أنّ '
    'المدّة أقصر: <strong>حتى سبعة أيام في السنة التقويمية</strong> بدل حتى خمسة عشر يوماً '
    'للولايات غير المقيَّدة. من يظنّ الباب مغلقاً لا يقدّم أصلاً، ويخسر حقّاً قائماً.</p></div>'

    '<h2>مَن يحقّ له طلب إذن السفر؟</h2>'
    '<p>حدّدت مديرية إدارة الهجرة في إسطنبول الفئات التي يمكن إصدار إذن سفر لها:</p>'
    '<ul>'
    '<li>الحاصلون على <strong>تصريح عمل</strong>.</li>'
    '<li><strong>طلاب التعليم العالي</strong>.</li>'
    '<li><strong>خرّيجو التعليم العالي</strong>.</li>'
    '<li><strong>أعضاء هيئة التدريس</strong>.</li>'
    '<li><strong>المتزوجون من مواطن أو مواطنة تركية</strong>.</li>'
    '<li>من <strong>لديهم أبناء يحملون الجنسية التركية</strong>.</li>'
    '<li>من <strong>يمارسون نشاطاً تجارياً</strong>.</li>'
    '</ul>'

    '<h2>وخمسة شروط تُفحص قبل أي شيء</h2>'
    '<ol>'
    '<li>أن تكون <strong>الحماية المؤقتة فعّالة</strong>.</li>'
    '<li>أن تكون <strong>حالتك مفتوحة وسارية في النظام</strong>.</li>'
    '<li>ألّا يوجد <strong>مانع متعلّق بالنظام العام أو الأمن العام</strong>.</li>'
    '<li>ألّا يوجد <strong>رمز تقييد A-99</strong> على ملفّك.</li>'
    '<li>ألّا يوجد <strong>قرار ترحيل</strong>.</li>'
    '</ol>'
    '<p>فإن تعثّر طلبك بلا سبب ظاهر، فالأرجح أنّ أحد هذه الخمسة هو السبب — وأوّل ما يُسأل عنه '
    'فعّالية القيد ووجود رمز تقييد. '
    '<a href="/article/tahdit-entry-restriction-codes-how-to-object">كيف تعرف أنّ لديك كود تقييد</a>.</p>'

    '<h2>المدد بحسب الغرض — الجدول الذي يقرّر طلبك</h2>'
    '<table><thead><tr><th>الغرض</th><th>المدّة القصوى في المرّة</th><th>ما يجب إرفاقه</th></tr></thead><tbody>'
    '<tr><td><strong>العمل</strong></td><td><strong>120 يوماً</strong></td>'
    '<td>وثيقة تتضمّن: الجهة التي تعمل لديها، والولاية المكلَّف بالعمل فيها، ومدّة المهمّة، ووصف العمل</td></tr>'
    '<tr><td><strong>العلاج</strong></td><td><strong>90 يوماً</strong></td><td>تقرير إحالة المريض</td></tr>'
    '<tr><td><strong>التعليم</strong></td><td>بحسب الحالة</td>'
    '<td>لطالب الجامعة الوقفية (Vakıf): وثيقة استمرار الدراسة + التقويم الأكاديمي للجامعة</td></tr>'
    '<tr><td><strong>الزيارة</strong> — ولاية غير مقيَّدة</td><td><strong>15 يوماً</strong></td><td>ما يوثّق الغرض</td></tr>'
    '<tr><td><strong>الزيارة</strong> — ولاية مقيَّدة</td><td><strong>7 أيام في السنة التقويمية</strong></td><td>ما يوثّق الغرض</td></tr>'
    '<tr><td><strong>جنازة، أو مرافقة مريض، أو مراجعة بعثة أجنبية</strong></td><td><strong>15 يوماً</strong></td>'
    '<td>ما يثبت الحالة</td></tr>'
    '<tr><td><strong>خطوبة أو زفاف</strong></td><td><strong>7 أيام</strong></td><td>ما يثبت المناسبة</td></tr>'
    '<tr><td><strong>زواج</strong></td><td><strong>30 يوماً</strong></td><td>ما يثبت المناسبة</td></tr>'
    '<tr><td><strong>مرافقة أفراد الأسرة العائدين طوعاً إلى سوريا حتى الحدود</strong></td>'
    '<td><strong>15 يوماً</strong></td><td>الطلب مع إثبات الحالة</td></tr>'
    '</tbody></table>'
    '<p><strong>ولاحظ الفرق في صياغة الزيارة:</strong> الخمسة عشر يوماً «في المرّة الواحدة»، أمّا '
    'السبعة فهي سقفٌ <strong>في السنة التقويمية</strong> للولايات المقيَّدة. فوازن استعمالك لها.</p>'

    '<h2>الولايات المقيَّدة — سبع عشرة</h2>'
    '<p>هذه هي الولايات الخاضعة لقيود الإقامة كما عدّدتها المديرية، والزيارة إليها بسقف سبعة '
    'أيام في السنة التقويمية:</p>'
    '<p style="font-weight:bold;line-height:2;">' + '، '.join(RESTRICTED) + '.</p>'
    '<p>وكانت هذه الصفحة تُدرج ستّ عشرة ولاية فقط — تنقصها <strong>باليكسير</strong>. ومن قرأ '
    'القائمة الناقصة وخطّط لخمسة عشر يوماً في باليكسير كان سيصطدم بسقف السبعة.</p>'

    '<h2>كيف تُقدّم</h2>'
    '<p>الطلب عبر بوّابة e-Devlet: ابحث عن '
    '<strong><span dir="ltr">Yabancılar İçin Yol İzin Belge Başvurusu</span></strong>، ثمّ '
    '<span dir="ltr">Yeni Başvuru</span>، واختر سبب السفر في خانة '
    '<span dir="ltr">Talep Nedeni</span>، وحدّد الولاية والتاريخ، وأرفق وثيقتك الداعمة في '
    '<span dir="ltr">Ek Belgeler</span>.</p>'
    '<p>وإن كان السفر بسيارة خاصة فأدخل رقم اللوحة. وتصل النتيجة برسالة نصية أو تظهر ضمن طلباتك '
    'على البوّابة.</p>'

    '<div style="background:#fff7ed;border-right:4px solid #ea580c;padding:14px 18px;margin:18px 0;">'
    '<p style="margin:0 0 8px;"><strong>ما لا تُغني عنه هذه الصفحة</strong></p>'
    '<p style="margin:0;">المدد أعلاه <strong>حدود قصوى</strong> لا استحقاقات: «حتى» تعني أنّ '
    'المديرية قد تمنح أقلّ. والوثيقة الداعمة هي ما يرفع طلبك من «زيارة» إلى غرضٍ موثَّق. ولا '
    'تسافر قبل صدور الإذن — إلا في الحالة الإسعافية الطارئة.</p></div>'

    '<p style="margin-top:1.2rem;">وللسياق: '
    '<a href="/article/turkey-yol-izni-muafiyeti-syrians-2026-06-09">إعفاء إذن الطريق: من يُعفى منه أصلاً</a> • '
    '<a href="/article/voluntary-return-syria-procedure-2026">العودة الطوعية إلى سوريا</a> • '
    '<a href="/article/kimlik-temporary-protection-syria-2026">الكملك والحماية المؤقتة</a></p>'
)

TP_STEPS = [
    'تحقّق أوّلاً من الشروط الخمسة: حماية مؤقتة فعّالة، وحالة سارية في النظام، ولا مانع أمناً '
    'أو نظاماً عاماً، ولا رمز تقييد A-99، ولا قرار ترحيل.',
    'حدّد غرض السفر بدقّة — فهو ما يحدّد المدّة: العمل 120 يوماً، والعلاج 90، والزيارة 15 '
    '(أو 7 في السنة للولايات المقيَّدة)، والزواج 30.',
    'جهّز الوثيقة التي يطلبها غرضك: وثيقة العمل بتفاصيلها، أو تقرير الإحالة، أو وثيقة استمرار '
    'الدراسة مع التقويم الأكاديمي، أو ما يثبت المناسبة.',
    'ادخل e-Devlet وابحث عن Yabancılar İçin Yol İzin Belge Başvurusu ثمّ اضغط Yeni Başvuru.',
    'اختر سبب السفر في Talep Nedeni، وحدّد الولاية وتاريخَي الذهاب والعودة.',
    'أرفق وثيقتك الداعمة في Ek Belgeler، وأدخل رقم اللوحة إن كان السفر بسيارة خاصة، ثمّ أرسل.',
    'قدّم قبل موعد سفرك بوقت كافٍ، وتابع النتيجة عبر الرسائل النصية أو ضمن طلباتك على البوّابة.',
    'ولا تسافر قبل صدور الإذن — إلا في الحالة الإسعافية الطارئة.',
]

TP_TIPS = [
    'الولاية المقيَّدة ليست ممنوعة: سقفها سبعة أيام في السنة التقويمية بدل خمسة عشر.',
    'الولايات المقيَّدة سبع عشرة — ومنها باليكسير التي كانت ناقصة من قوائم متداولة.',
    'رمز التقييد A-99 يمنع إصدار الإذن؛ فإن تعثّر طلبك بلا سبب ظاهر فاسأل عن ملفّك.',
    'إذن العمل يعطي أطول مدّة (120 يوماً) — بشرط وثيقة تذكر الجهة والولاية والمدّة ووصف العمل.',
    '«حتى» تعني حدّاً أقصى لا استحقاقاً؛ قد تُمنح أقلّ ممّا في الجدول.',
    'الإذن مجاني — ومن يطلب منك مالاً مقابل إصداره فهو وسيط لا صفة له.',
    'احتفظ بنسخة من الطلب ومرفقاته؛ وهي ما تحتجّ به إن اختلفت الإفادات.',
    'وللسفر بغرض العلاج: تقرير الإحالة هو ما يرفع المدّة إلى تسعين يوماً.',
]

TP_DOCS = [
    'بطاقة الحماية المؤقتة (الكملك) سارية وقيدك فعّال',
    'للعمل: وثيقة تتضمّن جهة العمل والولاية المكلَّف بها ومدّة المهمّة ووصف العمل',
    'للعلاج: تقرير إحالة المريض',
    'للتعليم في جامعة وقفية: وثيقة استمرار الدراسة + التقويم الأكاديمي',
    'للمناسبات والوفيات ومراجعة البعثات: ما يثبت الحالة',
    'رقم لوحة السيارة — إن كان السفر بسيارة خاصة',
]

TP_FEES = 'إذن السفر مجاني. ومن يطلب منك مالاً مقابل إصداره أو «تسريعه» فهو وسيط لا صفة رسمية له.'
TP_WARN = ('الولاية المقيَّدة ليست ممنوعة — سقفها سبعة أيام في السنة التقويمية. والمدد في الجدول '
           'حدود قصوى بصيغة «حتى»، لا استحقاقات. ووجود رمز تقييد A-99 أو قرار ترحيل يمنع إصدار '
           'الإذن. ولا تسافر قبل صدور الإذن إلا في الحالة الإسعافية الطارئة.')
TP_SOURCE = ('مديرية إدارة الهجرة في ولاية إسطنبول (İstanbul İl Göç İdaresi Müdürlüğü) — بند '
             '«أذونات السفر (Yol İzin Belgeleri)» من عرضٍ قُدِّم في اجتماع تنسيقي مع منظمات '
             'المجتمع المدني؛ نقله اتحاد منظمات المجتمع المدني للتنمية (UCSO) بوصفه مشاركاً. '
             'وطريقة التقديم من بوّابة e-Devlet (turkiye.gov.tr)')
TP_TAGS = ['إذن السفر', 'يول إذن', 'الحماية المؤقتة', 'A-99', 'دليل', '2026']

WPE_ADD = (
    '<div style="background:#ecfdf5;border-right:4px solid #10b981;padding:16px 20px;margin:20px 0;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>تسهيلات جديدة على وثيقة الإعفاء</strong></p>'
    '<p style="margin:0 0 8px;">عرضت مديرية إدارة الهجرة في إسطنبول نموذج وثيقة الإعفاء من تصريح '
    'العمل وما رافقه من تسهيلات:</p>'
    '<ul style="margin:0 0 8px;">'
    '<li><strong>إلغاء نظام الحصص (الكوتا)</strong>.</li>'
    '<li><strong>الإعفاء من الرسوم</strong>.</li>'
    '<li><strong>إلغاء بدل الورق الرسمي</strong> (Değerli Kâğıt Bedeli).</li>'
    '<li><strong>إلغاء إلزام دفع الأجور المحسوبة وفق مضاعفات الحد الأدنى للأجور</strong>.</li>'
    '<li>إمكانية الحصول على الوثيقة عبر نظام المواعيد الإلكتروني للهجرة '
    '(<span dir="ltr">Göç e-Randevu</span>) بخطوة واحدة.</li>'
    '</ul>'
    '<p style="margin:0;">وأثقل هذه البنود عملياً هو الأخيران: مضاعفات الحد الأدنى كانت تُخرج '
    'كثيراً من المهن من دائرة الإمكان، وبدل الورق كان كلفةً تُضاف بلا مقابل. '
    '<a href="/article/foreigner-minimum-salary-2026">جدول الرواتب الإلزامية للأجانب</a>.</p></div>'
)

TH_ADD = (
    '<div style="background:#eff6ff;border-right:4px solid #3b82f6;padding:14px 18px;margin:18px 0;">'
    '<p style="margin:0 0 8px;"><strong>وماذا بعد أن تربح الدعوى؟ ثمانية أيام</strong></p>'
    '<p style="margin:0;">أعلنت مديرية إدارة الهجرة في إسطنبول أنّ قرارات <strong>الإلغاء</strong> '
    '(İptal) الصادرة عن المحاكم الإدارية <strong>تُنفَّذ خلال ثمانية أيام</strong>. وهذه معلومة '
    'يحتاجها من بيده حكم: من لا يعرف أنّ ثمّة مدّةً أصلاً لا يستطيع أن يميّز التأخّر عن التقاعس. '
    'فإن مضت المدّة ولم يُنفَّذ الحكم، راجع المديرية بنسخة القرار واسأل عن سبب عدم التنفيذ.</p></div>'
)

NEWS_TITLE = ('إذن السفر للسوريين: 120 يوماً للعمل و90 للعلاج و7 أيام سنوياً للولايات المقيَّدة — '
              'مخرجات اجتماع هجرة إسطنبول')
NEWS_SUMMARY = ('عرضت مديرية إدارة الهجرة في إسطنبول تفاصيل أذونات السفر: سبع فئات مؤهَّلة، وخمسة '
                'شروط تُفحص أوّلاً بينها خلوّ الملفّ من رمز التقييد A-99، ومدد بحسب الغرض — 120 '
                'يوماً للعمل، و90 للعلاج، و30 للزواج، و15 للزيارة في الولايات غير المقيَّدة، '
                'و7 أيام في السنة التقويمية للولايات المقيَّدة السبع عشرة. كما أُعلنت تسهيلات على '
                'وثيقة الإعفاء من تصريح العمل، وتنفيذ أحكام الإلغاء خلال ثمانية أيام.')
NEWS_CONTENT = (
    '<p>عرضت <strong>مديرية إدارة الهجرة في ولاية إسطنبول</strong> في اجتماع تنسيقي مع منظمات '
    'المجتمع المدني تفاصيل عدّة تخصّ الأجانب. وهذه أكثرها أثراً على القارئ.</p>'

    '<h3>١. أذونات السفر — والتصحيح الأهمّ</h3>'
    '<p>الولاية <strong>المقيَّدة ليست ممنوعة</strong>: سقفها <strong>سبعة أيام في السنة '
    'التقويمية</strong> بدل حتى خمسة عشر يوماً في الولايات غير المقيَّدة. ومن يظنّ الباب مغلقاً '
    'لا يقدّم أصلاً فيخسر حقّاً قائماً.</p>'
    '<p>والمدد بحسب الغرض: <strong>120 يوماً</strong> للعمل (بوثيقة تذكر جهة العمل والولاية '
    'والمدّة ووصف المهمّة)، و<strong>90</strong> للعلاج بتقرير إحالة، و<strong>30</strong> '
    'للزواج، و<strong>7</strong> للخطوبة أو الزفاف، و<strong>15</strong> لجنازة أو مرافقة مريض '
    'أو مراجعة بعثة أجنبية، و<strong>15</strong> لمرافقة أفراد الأسرة العائدين طوعاً حتى الحدود.</p>'
    '<p>والشروط الخمسة التي تُفحص قبل كل ذلك: حماية مؤقتة فعّالة، وحالة سارية في النظام، ولا مانع '
    'أمناً أو نظاماً عاماً، و<strong>لا رمز تقييد A-99</strong>، ولا قرار ترحيل.</p>'

    '<h3>٢. الإعفاء من تصريح العمل — تسهيلات</h3>'
    '<ul>'
    '<li>إلغاء نظام الحصص (الكوتا).</li>'
    '<li>الإعفاء من الرسوم، وإلغاء بدل الورق الرسمي.</li>'
    '<li>إلغاء إلزام الأجور المحسوبة وفق مضاعفات الحد الأدنى للأجور.</li>'
    '<li>والحصول على الوثيقة عبر نظام المواعيد الإلكتروني للهجرة بخطوة واحدة.</li>'
    '</ul>'

    '<h3>٣. أحكام المحاكم تُنفَّذ خلال ثمانية أيام</h3>'
    '<p>قرارات الإلغاء الصادرة عن المحاكم الإدارية تُنفَّذها المديرية خلال <strong>ثمانية '
    'أيام</strong>. ومن بيده حكم ولا يعرف أنّ ثمّة مدّةً لا يميّز التأخّر عن التقاعس.</p>'

    '<h3>٤. أرقام أُعلنت</h3>'
    '<ul>'
    '<li>الأجانب ذوو الإقامة القانونية في إسطنبول حتى 30 تموز/يوليو 2026: '
    '<strong>995,710</strong> — منهم 599,798 بتصريح إقامة، و393,663 حماية مؤقتة، '
    'و2,249 حماية دولية.</li>'
    '<li>الطلاب الدوليون الحاصلون على تصاريح إقامة في إسطنبول: <strong>127,571</strong>، '
    'وقد خُصّصت 12 مركبة هجرة متنقلة لخدمة 12 جامعة، وأُخذت بصمات 5,975 طالباً حتى الآن.</li>'
    '<li>39 مركبة هجرة متنقلة تعمل في إسطنبول للوصول إلى كبار السنّ وذوي الإعاقة والمرضى '
    'الذين يصعب عليهم مراجعة المديريات.</li>'
    '</ul>'

    '<p style="margin-top:1rem;"><a href="/article/travel-permit"><strong>الدليل الكامل لإذن '
    'السفر: الفئات والشروط وجدول المدد والولايات السبع عشرة ←</strong></a></p>'
)

# ── the self-check that stops a lying verification row ─────────────────────
PREDICATES = [
    ('travel-permit details', TP_DETAILS, ['120 يوماً', 'A-99', 'باليكسير', 'سبعة أيام في السنة التقويمية']),
    ('travel-permit tips', ' '.join(TP_TIPS), ['ليست ممنوعة']),
    ('work-permit-exemption add', WPE_ADD, ['إلغاء نظام الحصص']),
    ('tahdit add', TH_ADD, ['ثمانية أيام']),
    ('news content', NEWS_CONTENT, ['995,710', '127,571']),
]
for label, body, needles in PREDICATES:
    for n in needles:
        assert n in body, 'PREDICATE WOULD LIE: %r not in %s' % (n, label)
# and the removed claim must really be gone from what we write
assert 'تُرفض غالباً' not in ' '.join(TP_TIPS) and 'تُرفض غالباً' not in TP_DETAILS

sql = """-- ============================================================================
-- مخرجات اجتماع هجرة إسطنبول: أذونات السفر، والإعفاء، وأحكام المحاكم
-- ============================================================================
-- البيان يغطّي تسعة محاور. اثنان منها يصحّحان عيوباً قائمة على الموقع، وهما
-- سبب هذا الملف. والباقي إمّا منشورٌ فعلاً (الأحياء الخمسة، ومسار النوتر،
-- والحصص اليومية — كلّها في 2026-08-06_istanbul_noter_route.sql) أو سياقٌ لا
-- يغيّر ما ينبغي للقارئ فعله.
--
-- ── العيب الأول: صفحة إذن السفر تقول إنّ الولايات المقيَّدة «تُرفض غالباً» ──
--
-- الصفحة، 17 قراءة و1,587 حرفاً، تقول للقارئ: «طلبات السفر للولايات المحظورة
-- (مثل إسطنبول وأنقرة) تُرفض غالباً». والبيان يقول غير ذلك: الولاية المقيَّدة
-- ليست رفضاً بل سقفاً أقصر — حتى سبعة أيام في السنة التقويمية بدل حتى خمسة
-- عشر. وإخبار إنسان بأنّ الباب مغلق وهو ضيّقٌ فحسب هو العطب نفسه الذي أزلناه
-- من صفحة V-87.
--
-- ── العيب الثاني: القائمة ينقصها واحدة ─────────────────────────────────
--
-- الصفحة تُدرج ستّ عشرة ولاية. والبيان يعدّ سبع عشرة — الستّ عشرة نفسها
-- زائداً **باليكسير**. ومن قرأ القائمة الناقصة وخطّط لخمسة عشر يوماً في
-- باليكسير يصطدم بسقف السبعة.
--
-- ── وما لا تحمله أي صفحة إطلاقاً ────────────────────────────────────────
--
-- ولا واحد من المقالات المعتمَدة الـ235 يحمل المدد، ولا الفئات المؤهَّلة، ولا
-- شرط A-99. فُحص ذلك: «120» و«A-99» و«تكيرداغ» لا تجتمع في أي صفحة عن إذن
-- السفر. فأُعيد بناء الصفحة حول الجدول الرسمي — 120 يوماً للعمل، و90 للعلاج،
-- و15 لزيارة ولاية غير مقيَّدة، و7 في السنة للمقيَّدة، و30 للزواج، و7 للخطوبة،
-- و15 لجنازة أو مرافقة مريض أو مراجعة بعثة، و15 لمرافقة الأسرة حتى الحدود عند
-- العودة الطوعية — والشروط الخمسة التي تُفحص قبل هذا كلّه.
--
-- وكانت الصفحة تحمل ستّ عشرة خطوة هي ثلاثة إجراءات مختلفة مسلوقة معاً (مسار
-- عام، ومسار طبي، ومسار زيارة) بنصائح مكرَّرة. أُعيد بناؤها مساراً واحداً،
-- والوثائق مسمّاةٌ بحسب الغرض.
--
-- ── العيب الثالث: تسهيلات وثيقة الإعفاء ────────────────────────────────
--
-- صفحة work-permit-exemption-2026 (9,721 حرفاً) تصف الفئات ولا تذكر أياً من
-- التغييرات المعلَنة: إلغاء الكوتا، والإعفاء من الرسوم، وإلغاء بدل الورق
-- الرسمي، وإلغاء إلزام مضاعفات الحد الأدنى، والحصول على الوثيقة عبر نظام
-- المواعيد بخطوة واحدة.
--
-- ── العيب الرابع: المحاكم ──────────────────────────────────────────────
--
-- صفحة أكواد التقييد تشرح كيف تعترض ولا تقول ماذا يحدث بعد أن تربح. والمديرية
-- ذكرت أنّ أحكام الإلغاء الإدارية تُنفَّذ خلال ثمانية أيام. ومن بيده حكم ولا
-- يعرف أنّ ثمّة مدّةً أصلاً لا يميّز التأخّر عن التقاعس.
--
-- ── وحارسٌ وضعتُه على نفسي ──────────────────────────────────────────────
--
-- أربع مرّات في هذه الجلسة ادّعى شرطُ تحقّقٍ سلسلةً لا يحويها المحتوى، أو نفى
-- سلسلةً يقتبسها التصحيح عمداً. فكلّ شرط أدناه يُفحص الآن مقابل المحتوى الفعلي
-- في هذا السكربت قبل كتابة الملف، والسكربت يرفض إخراج ملفٍّ تكذب فحوصه.
--
-- آمن لإعادة التشغيل.
-- ============================================================================

UPDATE articles SET
    title = 'إذن السفر الداخلي (Yol İzin) للسوريين 2026: المدد بحسب الغرض، والولايات السبع عشرة، وشروط الأهلية',
    details = '%s',
    steps = %s, tips = %s, documents = %s,
    fees = '%s', warning = '%s', source = '%s', tags = %s,
    last_update = CURRENT_DATE
WHERE slug = 'travel-permit';

UPDATE articles SET
    details = details || '%s',
    last_update = CURRENT_DATE
WHERE slug = 'work-permit-exemption-2026' AND details NOT LIKE '%%إلغاء نظام الحصص%%';

UPDATE articles SET
    details = details || '%s',
    last_update = CURRENT_DATE
WHERE slug = 'tahdit-entry-restriction-codes-how-to-object' AND details NOT LIKE '%%ثمانية أيام%%';

INSERT INTO updates (type, title, summary, content, link, source_name, category, date, active, pinned)
SELECT 'news', '%s', '%s', '%s', '/article/travel-permit',
       'مديرية إدارة الهجرة في ولاية إسطنبول (İstanbul İl Göç İdaresi Müdürlüğü) — اجتماع تنسيقي مع منظمات المجتمع المدني؛ نقله اتحاد منظمات المجتمع المدني للتنمية (UCSO) بوصفه مشاركاً',
       'official', DATE '2026-08-07', true, true
WHERE NOT EXISTS (SELECT 1 FROM updates WHERE title = '%s');

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE bad int;
BEGIN
    SELECT count(*) INTO bad FROM updates u
     WHERE u.title = '%s'
       AND NOT EXISTS (SELECT 1 FROM articles a WHERE a.status = 'approved'
                        AND '/article/' || a.slug = u.link);
    IF bad > 0 THEN RAISE EXCEPTION 'the news links to an article that is not live'; END IF;
END
$check$;

SELECT 'travel-permit: durations + A-99 + Balıkesir' AS البند,
       (details LIKE '%%120 يوماً%%' AND details LIKE '%%A-99%%' AND details LIKE '%%باليكسير%%') AS سليم
FROM articles WHERE slug = 'travel-permit'
UNION ALL
SELECT 'travel-permit: restricted is not refused',
       (array_to_string(tips, ' ') LIKE '%%ليست ممنوعة%%'
        AND array_to_string(tips, ' ') NOT LIKE '%%تُرفض غالباً%%')
FROM articles WHERE slug = 'travel-permit'
UNION ALL
SELECT 'exemption facilitations added', (details LIKE '%%إلغاء نظام الحصص%%')
FROM articles WHERE slug = 'work-permit-exemption-2026'
UNION ALL
SELECT 'court execution period added', (details LIKE '%%ثمانية أيام%%')
FROM articles WHERE slug = 'tahdit-entry-restriction-codes-how-to-object'
UNION ALL
SELECT 'news inserted once', (count(*) = 1)::boolean FROM updates WHERE title = '%s';
""" % (q(TP_DETAILS), arr(TP_STEPS), arr(TP_TIPS), arr(TP_DOCS),
       q(TP_FEES), q(TP_WARN), q(TP_SOURCE), arr(TP_TAGS),
       q(WPE_ADD), q(TH_ADD),
       q(NEWS_TITLE), q(NEWS_SUMMARY), q(NEWS_CONTENT), q(NEWS_TITLE),
       q(NEWS_TITLE), q(NEWS_TITLE))

path = os.path.join(REPO, 'sql', '2026-08-07_istanbul_meeting_outputs.sql')
open(path, 'w', encoding='utf-8').write(sql)

_code = ' '.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('travel-permit : %d ← %d حرفاً | خطوات %d ← %d | نصائح %d ← %d'
      % (len(tp['details'] or ''), len(TP_DETAILS), len(tp['steps'] or []), len(TP_STEPS),
         len(tp['tips'] or []), len(TP_TIPS)))
print('التصحيح الأهم  : «تُرفض غالباً» ← سقف 7 أيام سنوياً')
print('الولايات       : 16 ← 17 (باليكسير كانت ناقصة)')
print('جديد كلّياً    : جدول المدد + الفئات السبع + الشروط الخمسة + A-99')
print('الإعفاء        : 5 تسهيلات تُضاف (كوتا، رسوم، بدل ورق، مضاعفات الحد الأدنى، خطوة واحدة)')
print('المحاكم        : تنفيذ أحكام الإلغاء خلال ثمانية أيام — لم تكن على الموقع')
print('الخبر          : مثبَّت، مربوط بـ/article/travel-permit')
print('فحص الشروط     : %d شرطاً فُحص مقابل المحتوى الفعلي — لا شرط يكذب' % sum(len(n) for _, _, n in PREDICATES))
print('quote parity   :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written        :', path, len(sql), 'chars')
