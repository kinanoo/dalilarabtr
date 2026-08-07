# -*- coding: utf-8 -*-
"""Work batch: three rebuilds on statutory anchors, five retirements to real
canonicals, one section the big guide was missing.

── the map (recon against live rows) ──────────────────────────────────────

REBUILT:
  severance-pay-kidem-tazminati   785→ full   kıdem on 1475 m.14: the five
                                              entitlement paths, 30 days per
                                              year, the ceiling named but not
                                              numbered — the calculator
                                              computes; ALO 170 folded in.
  unemployment-benefit-iskur      658→ full   4447: 600/900/1080 premium days
                                              → 180/240/300 benefit days, 40%
                                              of average gross capped at 80%
                                              of minimum wage, 30-day window.
  work-permit-students            412→ small  6735 m.19: örgün students only;
                                              associate/bachelor after the
                                              first year and part-time.

RETIRED (all to targets that actually carry the content):
  employment-worker-rights-kidem-alo170 → severance canonical (ALO 170 section)
  employment-5-turks-rule               → work-permit-turkey-2026 (covers 5:1 — checked)
  work-without-permit-risks-2025        → work-permit-turkey-2026 (gets the
                                          missing «بلا تصريح» section first)
  employment-freelance-legal            → bagimsiz-calisma-izni-2026 (10.7K)
  company-setup                         → open-company-turkey-2026

LINK REWRITE: worker-rights-turkey-2026 links the retiring alo170 stub —
single-line href needle, CRLF-immune.

DEFERRED: business-licenses-turkey (764 chars) — licences/ruhsat is its own
topic for a business batch; left live, asserted.

No fine amounts, no kıdem ceiling figure, no benefit lira amounts — all
change on schedule; mechanisms + the calculator instead.
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


KIDEM = 'severance-pay-kidem-tazminati'
ISKUR = 'unemployment-benefit-iskur'
STUD = 'work-permit-students'
WP = 'work-permit-turkey-2026'
DEAD = ['employment-worker-rights-kidem-alo170', 'employment-5-turks-rule',
        'work-without-permit-risks-2025', 'employment-freelance-legal', 'company-setup']

for s in (KIDEM, ISKUR, STUD):
    r = get('articles?select=id,slug,status,details&slug=eq.' + s)[0]
    assert r['status'] == 'approved' and r['id'] == r['slug'] and len(r['details'] or '') < 1500, s
w = get('articles?select=status,details&slug=eq.' + WP)[0]
assert w['status'] == 'approved' and 'العمل بلا تصريح' not in w['details']
for d in DEAD:
    r = get('articles?select=id,slug,status&slug=eq.' + d)
    assert r and r[0]['status'] == 'approved' and r[0]['id'] == r[0]['slug'], d
wr = get('articles?select=details&slug=eq.worker-rights-turkey-2026')[0]
assert '/article/employment-worker-rights-kidem-alo170' in wr['details']
for s in ('bagimsiz-calisma-izni-2026', 'open-company-turkey-2026', 'business-licenses-turkey',
          'foreigner-minimum-salary-2026', 'work-injury-is-kazasi-foreigners-2026',
          'tourist-to-work-permit-2026'):
    r = get('articles?select=status&slug=eq.' + s)
    assert r and r[0]['status'] == 'approved', s + ' not live'
assert os.path.isdir(os.path.join(REPO, 'src/app/tools/severance-calculator'))

# ═══════════════ A. KIDEM ═══════════════
K_TITLE = 'تعويض نهاية الخدمة (Kıdem Tazminatı) للأجنبي في تركيا 2026: حالات الاستحقاق الخمس وكيف يُحسب — وخط ALO 170'
K_INTRO = ('العامل الأجنبي المسجَّل يخضع لقانون العمل التركي وله تعويض نهاية الخدمة كالعامل '
           'التركي تماماً: سنة عملٍ مسجَّلة على الأقل، ثم ثلاثون يوماً من الأجر الإجمالي عن '
           'كل سنة. المفتاح ليس الحساب — حاسبتنا تتكفّل به — بل معرفة حالات الاستحقاق '
           'الخمس: فليس كل ترك عملٍ يُسقط التعويض، وليس كل فصلٍ يمنحه. وخط ALO 170 هو '
           'بابك الرسمي للشكوى حين يُنكر حقّك.')
K_DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الخلاصة</strong></p>'
    '<p style="margin:0;"><strong>سنة مسجَّلة على الأقل</strong> عند صاحب العمل نفسه ← '
    '<strong>30 يوم أجر إجمالي عن كل سنة</strong> (وبالنسبة لكسور السنة) ← ضمن حالة '
    'استحقاق من الخمس أدناه. جرّب رقمك الآن: '
    '<a href="/tools/severance-calculator"><strong>حاسبة تعويض نهاية الخدمة ←</strong></a></p></div>'

    '<h2>متى تستحقّه؟ الحالات الخمس</h2>'
    '<p>الاستحقاق ليس تلقائياً بانتهاء العمل — القانون (المادة 14 من قانون 1475 السارية) '
    'يحصره في حالات:</p>'
    '<ol>'
    '<li><strong>فصلك دون سبب مبرِّر مشروع</strong> — الفصل التأديبي المشروع (الحالات '
    'الجسيمة في المادة 25/II) يُسقطه، وما عداه لا.</li>'
    '<li><strong>تركك العمل بسبب مبرِّر</strong> (المادة 24): أجر غير مدفوع، أو ظروف '
    'صحية، أو إخلال جوهري من صاحب العمل — الاستقالة المسبَّبة قانوناً تحفظ حقّك.</li>'
    '<li><strong>الخدمة العسكرية</strong> (للمكلّفين بها).</li>'
    '<li><strong>التقاعد</strong> أو استيفاء شروط سنّ/أقساط التقاعد.</li>'
    '<li><strong>زواج المرأة العاملة</strong> — إن تركت العمل خلال سنة من الزواج.</li>'
    '</ol>'
    '<p>وفي الوفاة يذهب التعويض للورثة. أمّا <strong>الاستقالة العادية بلا سبب</strong> '
    'فتُسقطه — وهنا تقع أكثر الخسائر: من يريد الترك فليعرف أولاً هل حالته ضمن '
    'المادة 24 أم لا.</p>'

    '<h2>كيف يُحسب؟</h2>'
    '<ul>'
    '<li>الأساس: <strong>الأجر الإجمالي الأخير</strong> «المُلبَّس» '
    '(<span dir="ltr">giydirilmiş brüt</span>) — أي مع المزايا النقدية والعينية المنتظمة '
    '(طعام، مواصلات…)، لا الصافي الذي يصلك.</li>'
    '<li><strong>30 يوماً عن كل سنة كاملة</strong>، وكسور السنة بالنسبة والتناسب.</li>'
    '<li>يوجد <strong>سقف رسمي</strong> للتعويض عن كل سنة يُحدَّث مطلع كل سنة ومنتصفها — '
    'لا ننشر رقمه لأنه يتقادم؛ '
    '<a href="/tools/severance-calculator">الحاسبة</a> تعتمد الجاري.</li>'
    '<li>ما تعرفه من راتبك الإلزامي كأجنبي يظهر هنا أيضاً: '
    '<a href="/article/foreigner-minimum-salary-2026">جدول الرواتب الإلزامية</a>.</li>'
    '</ul>'

    '<h2>الشرط الذي يُسقط كل شيء: التسجيل</h2>'
    '<p>التعويض يُبنى على علاقة عمل <strong>مسجَّلة في SGK</strong>. سنواتُ عملٍ بلا '
    'تسجيل لا تدخل الحساب إلا بإثباتها قضائياً — وهي معركة أصعب. فمن يعمل اليوم بلا '
    'تسجيل يخسر تعويض غده: راجع '
    '<a href="/article/work-permit-turkey-2026">دليل إذن العمل</a> لتصحيح وضعك.</p>'

    '<h2>أُنكر حقّك؟ ALO 170 ثم القضاء</h2>'
    '<ol>'
    '<li><strong>اطلب كتابةً</strong> من صاحب العمل — المطالبة الموثَّقة أول الأدلة.</li>'
    '<li><strong>اتصل بـ<span dir="ltr">ALO 170</span></strong> — الخط الرسمي لوزارة العمل '
    'للشكاوى العمالية والضمان: يسجّل شكواك ويحيلها للتفتيش.</li>'
    '<li><strong>الوساطة الإلزامية ثم دعوى العمل</strong> — نزاعات العمل تمرّ بالوسيط '
    'أولاً، ولها مُهل تقادم؛ لا تؤجّل سنوات ثم تسأل.</li>'
    '</ol>'
    '<p>وإن كانت شكواك إصابة عمل فمسارها الخاص: '
    '<a href="/article/work-injury-is-kazasi-foreigners-2026">إصابة العمل للأجانب</a>.</p>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>عملت 3 سنوات عند صاحبين مختلفين — هل تُجمع؟</h3>'
    '<p>الأصل أنّ الحساب عند صاحب العمل الواحد. الانتقال بين شركات المجموعة الواحدة أو '
    'نقل المنشأة له أحكامه — وثّق كل عقودك واسأل مختصاً في حالتك.</p>'
    '<h3>صاحب العمل يعرض «تصفية» أقل من الحساب مقابل الدفع فوراً؟</h3>'
    '<p>اعرف رقمك من الحاسبة قبل أي توقيع — وتوقيعك على «إبراء» بمبلغ أقل قد يُحتجّ به '
    'عليك. لا توقّع إبراءً إلا بما استلمته فعلاً.</p>'
    '<h3>هل يُقتطع منه ضرائب؟</h3>'
    '<p>تعويض نهاية الخدمة ضمن السقف معفى من ضريبة الدخل (يُقتطع رسم الدمغة فقط) — '
    'فالمبلغ يصلك شبه كامل ضمن السقف.</p>'
)
K_STEPS = [
    'تحقّق أولاً: هل أتممت سنة مسجَّلة عند صاحب العمل نفسه؟',
    'حدّد حالتك من حالات الاستحقاق الخمس — وقبل أي استقالة اعرف هل سببك ضمن المادة 24.',
    'اجمع أوراقك: العقد، وقسائم الراتب، ووثيقة خدمات SGK من e-Devlet.',
    'احسب المستحقّ بالحاسبة (الأجر الإجمالي الملبَّس × 30 يوماً × السنوات، بالسقف الجاري).',
    'اطلب كتابةً، ثم ALO 170 إن أُنكر حقّك، ثم الوساطة فدعوى العمل.',
    'لا توقّع إبراءً بمبلغ أقل من المستلَم فعلاً.',
]
K_TIPS = [
    'الاستقالة العادية بلا سبب تُسقط التعويض — والاستقالة المسبَّبة (م24) تحفظه: اعرف الفرق قبل الترك.',
    'الحساب على الإجمالي الملبَّس لا الصافي — المزايا المنتظمة تدخل.',
    'السقف يُحدَّث مرتين سنوياً — الحاسبة تعتمد الجاري، لا رقماً محفوظاً.',
    'سنوات العمل غير المسجَّل لا تدخل إلا بإثبات قضائي — التسجيل هو التعويض.',
    'ALO 170 رسمي ومجاني — والشكوى المبكرة أقوى من المتأخرة.',
    'التعويض ضمن السقف معفى من ضريبة الدخل.',
]
K_DOCS = [
    'عقد العمل وقسائم الراتب',
    'وثيقة الخدمات من SGK (Tescil ve Hizmet Dökümü) عبر e-Devlet',
    'ما يوثّق حالة الاستحقاق: إخطار الفصل، أو أدلة السبب المبرِّر، أو وثيقة الزواج/التقاعد',
    'مراسلات المطالبة المكتوبة',
]
K_FEES = ('المطالبة وALO 170 مجانيان. والتعويض ضمن السقف الرسمي معفى من ضريبة الدخل '
          '(رسم الدمغة فقط). والسقف يُحدَّث مطلع كل سنة ومنتصفها — الحاسبة تعتمده.')
K_WARN = ('الاستقالة بلا سبب قانوني تُسقط التعويض. ونزاعات العمل لها وساطة إلزامية ومُهل '
          'تقادم. ولا توقّع إبراءً بمبلغ لم تستلمه. وهذه الصفحة معلومات عامة — الحالات '
          'المركّبة (شركات متعددة، عمل غير مسجَّل) تحتاج مختصاً.')
K_SOURCE = ('المادة 14 من قانون العمل رقم 1475 (السارية بموجب المادة الانتقالية 6 من '
            'القانون 4857) — حالات الاستحقاق والحساب بثلاثين يوماً عن السنة؛ والمادتان 24 '
            'و25 من القانون 4857 (السبب المبرِّر للعامل والفصل التأديبي)؛ وسقف التعويض '
            'المحدَّث نصف سنوياً؛ وخط ALO 170 الرسمي لوزارة العمل والضمان الاجتماعي')
K_TAGS = ['تعويض نهاية الخدمة', 'حقوق العامل', 'العمل والاستثمار', 'ALO 170', 'دليل', '2026']
K_SEO_T = 'تعويض نهاية الخدمة في تركيا: حالات الاستحقاق الخمس وحسابه'
K_SEO_D = ('سنة مسجَّلة ثم 30 يوم أجر إجمالي عن كل سنة — لكن ضمن حالات الاستحقاق الخمس: '
           'الاستقالة العادية تُسقطه والمسبَّبة تحفظه. الحساب بالحاسبة، والشكوى عبر '
           'ALO 170، للأجانب والسوريين.')

# ═══════════════ B. İŞKUR ═══════════════
I_TITLE = 'بدل البطالة (İşsizlik Ödeneği) للأجانب في تركيا 2026: أيام الأقساط الثلاث، والمهلة الثلاثون، وكم يصلك'
I_INTRO = ('فقدت عملك المسجَّل دون إرادتك؟ لك بدل بطالة من İŞKUR كالعامل التركي — بشرط '
           'أقساطك لا جنسيتك. القاعدة الصلبة: 600 يوم أقساط في السنوات الثلاث الأخيرة '
           'تعطيك 180 يوم بدل، و900 تعطيك 240، و1080 تعطيك 300 — والتقديم خلال ثلاثين '
           'يوماً من انتهاء العمل، وكل تأخير يأكل من أيامك.')
I_DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الخلاصة</strong></p>'
    '<p style="margin:0;">شرطان يقرّران كل شيء: <strong>فقدان العمل دون إرادتك</strong> '
    '(لا استقالة عادية ولا فصلاً تأديبياً مشروعاً)، و<strong>أيام أقساطك</strong> في '
    'السنوات الثلاث الأخيرة. والتقديم <strong>خلال 30 يوماً</strong> عبر e-Devlet أو '
    'مكتب İŞKUR.</p></div>'

    '<h2>الشروط — كما في القانون 4447</h2>'
    '<ol>'
    '<li><strong>انتهاء العمل دون إرادة العامل ودون خطئه الجسيم</strong>: انتهاء العقد، '
    'أو الفصل غير التأديبي، أو إغلاق المنشأة. الاستقالة العادية تُسقط الحقّ (إلا '
    'المسبَّبة قانوناً).</li>'
    '<li><strong>آخر 120 يوماً خاضعاً لعقد عمل</strong> قبل الانتهاء.</li>'
    '<li><strong>600 يوم أقساط بطالة على الأقل</strong> خلال السنوات الثلاث الأخيرة.</li>'
    '<li><strong>التقديم خلال 30 يوماً</strong> من انتهاء العمل، مع التسجيل باحثاً عن '
    'عمل.</li>'
    '</ol>'

    '<h2>كم يوماً — وكم مبلغاً؟</h2>'
    '<table><thead><tr><th>أيام أقساطك في آخر 3 سنوات</th><th>أيام البدل</th></tr></thead>'
    '<tbody>'
    '<tr><td>600 يوم فأكثر</td><td><strong>180 يوماً</strong></td></tr>'
    '<tr><td>900 يوم فأكثر</td><td><strong>240 يوماً</strong></td></tr>'
    '<tr><td>1080 يوماً فأكثر</td><td><strong>300 يوم</strong></td></tr>'
    '</tbody></table>'
    '<p>والمبلغ الشهري: <strong>40% من متوسط أجرك الإجمالي</strong> في الأشهر الأربعة '
    'الأخيرة، بسقف <strong>80% من الحد الأدنى الإجمالي للأجور</strong> الجاري — فلا '
    'ننشر ليرات تتقادم؛ اضرب النسبة بأرقامك أنت '
    '(<a href="/article/foreigner-minimum-salary-2026">الحد الأدنى الجاري هنا</a>). '
    'وتأمينك الصحي مغطّى خلال مدة البدل.</p>'

    '<h2>كيف تقدّم؟</h2>'
    '<ol>'
    '<li>عبر <strong>e-Devlet</strong> (خدمة طلب بدل البطالة) أو مكتب İŞKUR في '
    'منطقتك — خلال الثلاثين يوماً.</li>'
    '<li>سجّل <strong>باحثاً عن عمل</strong> في İŞKUR — جزء من الطلب نفسه.</li>'
    '<li>تابع رسائل İŞKUR: مراجعات الحضور ورفض عرض عمل مناسب بلا عذر يوقفان البدل.</li>'
    '</ol>'
    '<div style="background:#fff7ed;border-right:4px solid #ea580c;padding:14px 18px;margin:18px 0;">'
    '<p style="margin:0;"><strong>مهلة الثلاثين لا ترحم:</strong> التأخّر بعدها لا يُسقط '
    'الطلب كلّياً لكنه <strong>يقتطع أيام التأخير من مدة استحقاقك</strong> — كل يوم '
    'تسويف يوم بدلٍ محروق.</p></div>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>أنا سوري بإذن عمل — هل أستحق؟</h3>'
    '<p>البدل يُبنى على أقساطك المسجَّلة لا جنسيتك: عملٌ مسجَّل بأقساط بطالة مدفوعة '
    'يفتح الحقّ بالشروط نفسها. عملٌ بلا تسجيل لا أقساط له — ولا بدل.</p>'
    '<h3>استقلت لأنّ راتبي لا يُدفع — هل خسرت البدل؟</h3>'
    '<p>الترك بسبب مبرِّر قانوناً (كالأجر غير المدفوع) يُعامل معاملة الفقدان دون إرادة — '
    'وثّق السبب جيداً، فهو مفتاح البدل والتعويض معاً: '
    '<a href="/article/severance-pay-kidem-tazminati">تعويض نهاية الخدمة</a>.</p>'
    '<h3>وجدت عملاً أثناء البدل؟</h3>'
    '<p>أبلغ İŞKUR فوراً — الاستمرار في القبض مع عمل جديد يُسترد بغرامات.</p>'
)
I_STEPS = [
    'تحقّق من حالتك: انتهاء دون إرادتك (أو ترك مسبَّب موثَّق) + آخر 120 يوماً بعقد.',
    'اجمع أيام أقساطك من وثيقة SGK عبر e-Devlet — 600 فأكثر في آخر 3 سنوات.',
    'قدّم خلال 30 يوماً من انتهاء العمل: e-Devlet أو مكتب İŞKUR، مع تسجيل باحث عن عمل.',
    'احسب المتوقَّع: 40% من متوسط إجمالي آخر 4 أشهر، بسقف 80% من الحد الأدنى الجاري.',
    'تابع التزامات İŞKUR أثناء الصرف، وأبلغ فوراً عند إيجاد عمل.',
]
I_TIPS = [
    '600/900/1080 يوم أقساط = 180/240/300 يوم بدل — احفظ سلّمك.',
    'مهلة الثلاثين: التأخير يقتطع من أيامك لا من الإجراء فقط.',
    'الحق بالأقساط لا بالجنسية — والعمل غير المسجَّل بلا بدل.',
    'الاستقالة المسبَّبة الموثَّقة تحفظ البدل والتعويض معاً.',
    'تأمينك الصحي مغطّى خلال مدة البدل.',
    'لا ننشر مبلغاً بالليرة — النسبة ثابتة والحد الأدنى يتغيّر: اضربها بأرقامك.',
]
I_DOCS = [
    'وثيقة خدمات SGK (أيام الأقساط) من e-Devlet',
    'ما يوثّق انتهاء العمل وسببه (إخطار، فسخ، أدلة السبب المبرِّر)',
    'حساب e-Devlet للتقديم — أو هويتك لمكتب İŞKUR',
    'حساب بنكي باسمك لاستلام البدل',
]
I_FEES = ('الطلب مجاني. والبدل 40% من متوسط إجمالي آخر أربعة أشهر بسقف 80% من الحد '
          'الأدنى الإجمالي الجاري — لا ننشر مبلغاً يتقادم. والتأمين الصحي مشمول خلال '
          'المدة.')
I_WARN = ('التقديم خلال 30 يوماً — التأخير يقتطع من أيام استحقاقك. والاستقالة العادية '
          'والفصل التأديبي المشروع يُسقطان الحقّ. ورفض عرض عمل مناسب أو التخلّف عن '
          'مراجعات İŞKUR يوقف الصرف. والقبض مع عمل جديد دون إبلاغ يُسترد بغرامات.')
I_SOURCE = ('قانون التأمين ضد البطالة رقم 4447 — شروط الاستحقاق (آخر 120 يوماً بعقد، '
            'و600 يوم أقساط في ثلاث سنوات)، وسلّم المدد 600/900/1080 ← 180/240/300، '
            'ومقدار البدل (40% من المتوسط بسقف 80% من الحد الأدنى)؛ وقنوات التقديم '
            'الرسمية İŞKUR وe-Devlet')
I_TAGS = ['بدل البطالة', 'İŞKUR', 'العمل والاستثمار', 'SGK', 'دليل', '2026']
I_SEO_T = 'بدل البطالة في تركيا للأجانب: 600 يوماً تعطيك 180 — والمهلة 30'
I_SEO_D = ('سلّم القانون: 600/900/1080 يوم أقساط = 180/240/300 يوم بدل، والمبلغ 40% من '
           'متوسط أجرك بسقف 80% من الحد الأدنى، والتقديم خلال 30 يوماً وإلا اقتُطع من '
           'أيامك — بالأقساط لا بالجنسية.')

# ═══════════════ C. STUDENTS ═══════════════
S_TITLE = 'عمل الطلاب الأجانب في تركيا 2026: ما يسمح به القانون فعلاً — السنة الأولى والدوام الجزئي'
S_INTRO = ('هل يحقّ للطالب الأجنبي العمل في تركيا؟ نعم — بنصّ المادة 19 من قانون العمل '
           'الدولي 6735، وبحدودها: طلاب التعليم النظامي فقط، وطالب الدبلوم المتوسط '
           'والبكالوريوس لا يتقدّم إلا بعد إتمام سنته الأولى ويعمل بدوام جزئي، وإذن '
           'العمل نفسه لا يسقط — صاحب العمل يقدّمه. العمل «على الأسود» يهدّد إقامتك '
           'الدراسية نفسها.')
S_DETAILS = (
    '<div style="background:#eff6ff;border-right:4px solid #3b82f6;padding:14px 18px;margin:0 0 20px;">'
    '<p style="margin:0;"><strong>القاعدة في سطر:</strong> الحقّ موجود (المادة 19 من '
    'القانون 6735) لكنه ليس إعفاءً — <strong>إذن العمل مطلوب</strong>، ويقدّمه صاحب '
    'العمل، وقيود المرحلة الجامعية تحكم متى وكيف.</p></div>'

    '<h2>من يستطيع — ومتى؟</h2>'
    '<table><thead><tr><th>وضعك الدراسي</th><th>حقّك في العمل</th></tr></thead><tbody>'
    '<tr><td><strong>دبلوم متوسط (Ön Lisans) وبكالوريوس (Lisans)</strong> — تعليم نظامي</td>'
    '<td>بعد <strong>إتمام السنة الأولى</strong>، و<strong>بدوام جزئي</strong> وفق أحكام '
    'الدوام الجزئي في قانون العمل</td></tr>'
    '<tr><td><strong>ماجستير ودكتوراه</strong></td>'
    '<td>دون قيد السنة الأولى والدوام الجزئي المذكورَين</td></tr>'
    '<tr><td><strong>برامج غير نظامية</strong> (تعليم مفتوح/عن بُعد)</td>'
    '<td>خارج نطاق المادة 19 — لا تُبنى عليها</td></tr>'
    '</tbody></table>'

    '<h2>الإجراء: صاحب العمل يقدّم — لا أنت</h2>'
    '<p>كأي إذن عمل: يجد الطالب صاحبَ عمل مستعداً للتقديم إلكترونياً، وتُقيَّم الشركة '
    'بمعاييرها — التفصيل في <a href="/article/work-permit-turkey-2026">دليل إذن '
    'العمل</a>. وإقامتك الدراسية تبقى أساس وجودك القانوني؛ الإذن ينظّم عملك ولا '
    'يستبدل بها.</p>'

    '<h2>ما الذي يخسره من يعمل بلا إذن؟</h2>'
    '<ul>'
    '<li>غرامات على العامل وصاحب العمل — تُحدَّث سنوياً.</li>'
    '<li>تهديد مباشر <strong>لإقامتك الدراسية</strong> ومستقبل ملفّك.</li>'
    '<li>عمل بلا SGK: لا إصابات عمل مغطّاة ولا أقساط تُحسب لك لاحقاً '
    '(<a href="/article/severance-pay-kidem-tazminati">التعويض</a> و'
    '<a href="/article/unemployment-benefit-iskur">بدل البطالة</a> يُبنيان عليها).</li>'
    '</ul>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>أنا سوري بكملك وأدرس — أيّ نظام يحكمني؟</h3>'
    '<p>حامل الحماية المؤقتة نظام عمله مختلف (الإعفاء وتسهيلاته) — '
    '<a href="/article/syria-work-permit-exemption-turkey-2026-07">إعفاء تصريح العمل '
    'للسوريين</a>، ولا تنطبق عليه قيود المادة 19 نفسها.</p>'
    '<h3>هل التدريب الجامعي الإلزامي (staj) عمل يحتاج إذناً؟</h3>'
    '<p>التدريب ضمن المنهاج شأنه أكاديمي تنظّمه الجامعة واتفاقيات التدريب — اسأل '
    'مكتب الطلاب الدوليين في جامعتك عن ترتيباته، ولا تخلطه بعقد عمل.</p>'
    '<h3>أعمل عن بُعد لشركة خارج تركيا؟</h3>'
    '<p>منطقة رمادية ضريبياً وقانونياً لا نبسّطها زوراً: القاعدة الآمنة أنّ العمل '
    'المؤدَّى من داخل تركيا يخضع لقواعدها — استشر مختصاً قبل البناء عليه.</p>'
)
S_STEPS = [
    'تحقّق من وضعك: تعليم نظامي؟ وأتممت السنة الأولى إن كنت دبلوماً/بكالوريوس؟',
    'جد صاحب عمل مستعداً للتقديم — الطلب طلبه هو عبر النظام الإلكتروني.',
    'اضبط الدوام جزئياً لمرحلة البكالوريوس وما دونها.',
    'حافظ على إقامتك الدراسية سارية — هي الأساس والإذن ينظّم العمل فقط.',
    'لا تعمل يوماً واحداً قبل صدور الإذن.',
]
S_TIPS = [
    'الحق بعد السنة الأولى وبدوام جزئي للبكالوريوس وما دونه — والدراسات العليا أوسع.',
    'التعليم المفتوح/عن بُعد خارج المادة 19.',
    'الإذن يقدّمه صاحب العمل — «سأعمل قليلاً بلا أوراق» يهدّد إقامتك الدراسية.',
    'حامل الكملك نظامه الإعفاء لا هذه المادة.',
    'العمل غير المسجَّل بلا SGK = بلا تعويض وبلا بدل بطالة لاحقاً.',
]
S_DOCS = [
    'وثيقة الطالب (Öğrenci Belgesi) الحالية وإثبات إتمام السنة الأولى عند اللزوم',
    'إقامة الطالب سارية المفعول',
    'جواز السفر',
    'وملف الشركة يقدّمه صاحب العمل إلكترونياً',
]
S_FEES = ('رسوم إذن العمل بتعرفتها السنوية الرسمية — راجعها قبل الدفع ولا تعتمد رقماً '
          'متداولاً. ولا رسم على «سؤال» مكتب الطلاب الدوليين في جامعتك: ابدأ منه.')
S_WARN = ('العمل قبل صدور الإذن عمل بلا تصريح بغراماته وتهديده لإقامتك الدراسية. وقيد '
          'السنة الأولى والدوام الجزئي لمرحلة البكالوريوس وما دونها نصٌّ لا اجتهاد. '
          'وبرامج التعليم المفتوح خارج هذا الحق.')
S_SOURCE = ('المادة 19 من قانون العمل الدولي رقم 6735 — حقّ طلاب التعليم العالي النظامي '
            'في العمل، وقيدا إتمام السنة الأولى والدوام الجزئي لمرحلتَي الدبلوم المتوسط '
            'والبكالوريوس؛ وأحكام الدوام الجزئي في قانون العمل 4857')
S_TAGS = ['عمل الطلاب', 'إذن العمل', 'الدراسة والتعليم', 'الطلاب الأجانب', 'دليل', '2026']
S_SEO_T = 'عمل الطلاب الأجانب في تركيا: بعد السنة الأولى وبدوام جزئي'
S_SEO_D = ('المادة 19 من قانون 6735: طلاب التعليم النظامي يعملون بإذن — البكالوريوس بعد '
           'السنة الأولى وبدوام جزئي، والدراسات العليا أوسع، والإذن يقدّمه صاحب العمل. '
           'وحامل الكملك نظامه الإعفاء.')

# ═══════════════ D. the missing section in the big guide ═══════════════
WP_ADD = (
    '<h2>العمل بلا تصريح: ما يخسره العامل قبل صاحب العمل</h2>'
    '<p>تشغيل أجنبي بلا إذن مخالفةٌ يحاسَب عليها <strong>الطرفان</strong>: غرامات إدارية '
    'على صاحب العمل وعلى العامل تُحدَّث سنوياً (فلا ننشر أرقاماً تتقادم)، وقد يتحمّل '
    'صاحب العمل نفقات إعادة العامل. والأثقل على العامل ليس الغرامة:</p>'
    '<ul>'
    '<li><strong>وضعه الإقامي على المحكّ</strong> — من الإبعاد إلى تعقيد أي ملف قادم.</li>'
    '<li><strong>لا SGK</strong>: إصابة العمل بلا غطاء، وسنوات الخدمة بلا أقساط — فلا '
    '<a href="/article/severance-pay-kidem-tazminati">تعويض نهاية خدمة</a> ولا '
    '<a href="/article/unemployment-benefit-iskur">بدل بطالة</a> يوم تحتاجهما.</li>'
    '<li><strong>لا ورقة تثبت حقّه</strong> عند أول خلاف على أجر.</li>'
    '</ul>'
    '<p>والتصحيح أرخص من البقاء: المسارات أعلاه، ولحامل الإقامة السياحية '
    '<a href="/article/tourist-to-work-permit-2026">شرط الستة أشهر للتحويل</a>، '
    'وللعمل المستقل <a href="/article/bagimsiz-calisma-izni-2026">إذن العمل '
    'المستقل</a>.</p>'
)

LINK_OLD = '/article/employment-worker-rights-kidem-alo170'
LINK_NEW = '/article/severance-pay-kidem-tazminati'

for label, body, needles in [
    ('kidem', K_DETAILS, ['1475', 'المادة 24', 'severance-calculator', 'ALO 170',
                          'giydirilmiş', 'work-injury-is-kazasi-foreigners-2026']),
    ('iskur', I_DETAILS, ['4447', '600', '1080', '300 يوم', '120', '30 يوماً',
                          '40%', '80%', 'severance-pay-kidem-tazminati']),
    ('students', S_DETAILS, ['المادة 19', '6735', 'السنة الأولى', 'دوام جزئي',
                             'syria-work-permit-exemption-turkey-2026-07']),
    ('wp add', WP_ADD, ['bagimsiz-calisma-izni-2026', 'tourist-to-work-permit-2026',
                        'unemployment-benefit-iskur']),
]:
    for nd in needles:
        assert nd in body, 'PREDICATE WOULD LIE: %r not in %s' % (nd, label)
for dead in DEAD:
    assert ('href="/article/%s"' % dead) not in K_DETAILS + I_DETAILS + S_DETAILS + WP_ADD
assert not re.search(r'\d[\d.,]*\s*(?:ليرة|TL)', K_DETAILS + I_DETAILS + S_DETAILS + WP_ADD), 'a lira figure leaked'

ART = """INSERT INTO articles (id, slug, title, intro, details, steps, tips, documents,
                      fees, warning, source, tags, category, status,
                      seo_title, seo_description, last_update)
VALUES ('%s', '%s', '%s', '%s', '%s', %s, %s, %s, '%s', '%s', '%s', %s, '%s', 'approved',
        '%s', '%s', CURRENT_DATE)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, intro = EXCLUDED.intro, details = EXCLUDED.details,
    steps = EXCLUDED.steps, tips = EXCLUDED.tips, documents = EXCLUDED.documents,
    fees = EXCLUDED.fees, warning = EXCLUDED.warning, source = EXCLUDED.source,
    tags = EXCLUDED.tags, category = EXCLUDED.category, status = EXCLUDED.status,
    seo_title = EXCLUDED.seo_title, seo_description = EXCLUDED.seo_description,
    last_update = EXCLUDED.last_update;"""


def art_sql(slug, title, intro, details, steps, tips, docs, fees, warn, source, tags, cat, st, sd):
    return ART % (slug, slug, q(title), q(intro), q(details), arr(steps), arr(tips),
                  arr(docs), q(fees), q(warn), q(source), arr(tags), q(cat), q(st), q(sd))


sql = _no_bare_percent("""-- ============================================================================
-- دفعة العمل: ثلاث إعادات بناء على مراسٍ قانونية، وخمسة تقاعدات لمرجعيات قائمة
-- ============================================================================
-- * التعويض (kıdem): م14/1475 السارية — حالات الاستحقاق الخمس (الاستقالة
--   العادية تُسقط والمسبَّبة م24 تحفظ)، والحساب على الإجمالي الملبَّس بثلاثين
--   يوماً للسنة، والسقف مسمّى لا مرقّم (يُحدَّث نصف سنوياً — الحاسبة تعتمده)،
--   وALO 170 مطويّ قسماً. نقض ALO يتقاعد إليه ورابط worker-rights يُعاد
--   توجيهه بإبرة سطر واحد.
-- * بدل البطالة: القانون 4447 — 600/900/1080 ← 180/240/300، وآخر 120 يوماً
--   بعقد، و40%% بسقف 80%% من الحد الأدنى (نسب لا ليرات)، ومهلة الثلاثين التي
--   «تأكل من أيامك».
-- * عمل الطلاب: م19/6735 — النظامي فقط، والبكالوريوس بعد السنة الأولى وبدوام
--   جزئي، والدراسات العليا أوسع، والإذن يقدّمه صاحب العمل. وحامل الكملك
--   يُوجَّه لنظام الإعفاء.
-- * دليل إذن العمل الكبير يكسب قسمه الناقص «العمل بلا تصريح» (محروس) —
--   والعامل يخسر قبل صاحب العمل: الوضع الإقامي، وSGK وما يُبنى عليها.
-- * خمسة تقاعدات إلى مرجعيات تحمل المحتوى فعلاً: قاعدة 5:1 إلى دليل الإذن
--   (يغطّيها — فُحص)، وبلا-تصريح إليه بعد إضافة قسمه، والفريلانس إلى صفحة
--   العمل المستقل (10.7 ألف حرف)، وتأسيس الشركة إلى دليل فتح الشركة، وALO
--   إلى التعويض. وbusiness-licenses-turkey مؤجَّلة لدفعة الأعمال — تبقى حيّة.
--
-- الصفوف الثمانية id == slug (فُحص). لا أرقام ليرات في أي صفحة (مؤكَّد آلياً).
-- آمن لإعادة التشغيل.
-- ============================================================================

-- أ. التعويض
""" + (art_sql(KIDEM, K_TITLE, K_INTRO, K_DETAILS, K_STEPS, K_TIPS, K_DOCS,
              K_FEES, K_WARN, K_SOURCE, K_TAGS, 'العمل والاستثمار', K_SEO_T, K_SEO_D)).replace('%', '%%') + """

-- ب. بدل البطالة
""" + (art_sql(ISKUR, I_TITLE, I_INTRO, I_DETAILS, I_STEPS, I_TIPS, I_DOCS,
              I_FEES, I_WARN, I_SOURCE, I_TAGS, 'العمل والاستثمار', I_SEO_T, I_SEO_D)).replace('%', '%%') + """

-- ج. عمل الطلاب
""" + (art_sql(STUD, S_TITLE, S_INTRO, S_DETAILS, S_STEPS, S_TIPS, S_DOCS,
              S_FEES, S_WARN, S_SOURCE, S_TAGS, 'العمل والاستثمار', S_SEO_T, S_SEO_D)).replace('%', '%%') + """

-- د. قسم «بلا تصريح» في الدليل الكبير (محروس)
UPDATE articles SET details = details || '%s', last_update = CURRENT_DATE
WHERE slug = '%s' AND details NOT LIKE '%%العمل بلا تصريح%%';

-- هـ. رابط worker-rights يتحوّل من نقض ALO إلى دليل التعويض (إبرة سطر واحد)
UPDATE articles SET details = replace(details, '%s', '%s'), last_update = CURRENT_DATE
WHERE slug = 'worker-rights-turkey-2026' AND details LIKE '%%%s%%';

-- و. التقاعد
UPDATE articles SET status = 'draft', last_update = CURRENT_DATE
WHERE slug IN (%s) AND status = 'approved';

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved'
       AND details LIKE '%%1475%%' AND details LIKE '%%ALO 170%%';
    IF n <> 1 THEN RAISE EXCEPTION 'kidem rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved'
       AND details LIKE '%%1080%%' AND details LIKE '%%40%%';
    IF n <> 1 THEN RAISE EXCEPTION 'iskur rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved' AND details LIKE '%%المادة 19%%';
    IF n <> 1 THEN RAISE EXCEPTION 'students rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND details LIKE '%%العمل بلا تصريح%%';
    IF n <> 1 THEN RAISE EXCEPTION 'the no-permit section did not land'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = 'worker-rights-turkey-2026' AND details LIKE '%%%s%%';
    IF n > 0 THEN RAISE EXCEPTION 'worker-rights still links the retired stub'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug IN (%s) AND status = 'approved';
    IF n > 0 THEN RAISE EXCEPTION '%% stub(s) still approved', n; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = 'business-licenses-turkey' AND status = 'approved';
    IF n <> 1 THEN RAISE EXCEPTION 'business-licenses must stay live'; END IF;
END
$check$;

SELECT 'kidem rebuilt (five paths + calculator + ALO 170)' AS البند,
       (details LIKE '%%1475%%' AND details LIKE '%%severance-calculator%%')::text AS النتيجة
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'iskur rebuilt (600/900/1080 ladder, 30-day window)',
       (details LIKE '%%1080%%')::text
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'students rebuilt (art 19: first year + part-time)',
       (details LIKE '%%المادة 19%%')::text
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'work-permit guide gained the no-permit section',
       (details LIKE '%%العمل بلا تصريح%%')::text
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'five stubs retired (want 0 approved)', count(*)::text
FROM articles WHERE slug IN (%s) AND status = 'approved'
UNION ALL
SELECT 'business-licenses left live for the business batch', status
FROM articles WHERE slug = 'business-licenses-turkey';
""") % (q(WP_ADD), WP,
        LINK_OLD, LINK_NEW, LINK_OLD,
        ', '.join("'%s'" % d for d in DEAD),
        KIDEM, ISKUR, STUD, WP, LINK_OLD, ', '.join("'%s'" % d for d in DEAD),
        KIDEM, ISKUR, STUD, WP, ', '.join("'%s'" % d for d in DEAD))

path = os.path.join(REPO, 'sql', '2026-08-07_work_cluster.sql')
open(path, 'w', encoding='utf-8', newline='').write(sql)

_code = '\n'.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('التعويض      : %s — 785 ← %d حرفاً (الحالات الخمس + الحاسبة + ALO 170)' % (KIDEM, len(K_DETAILS)))
print('بدل البطالة  : %s — 658 ← %d حرفاً (سلّم 600/900/1080 ومهلة الثلاثين)' % (ISKUR, len(I_DETAILS)))
print('عمل الطلاب   : %s — 412 ← %d حرفاً (م19: السنة الأولى + الجزئي)' % (STUD, len(S_DETAILS)))
print('دليل الإذن   : += قسم «العمل بلا تصريح» (%d حرفاً، محروس)' % len(WP_ADD))
print('يتقاعد       : %s' % ', '.join(DEAD))
print('مؤجَّلة      : business-licenses-turkey — لدفعة الأعمال')
print('quote parity :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written      :', path, len(sql), 'chars')
