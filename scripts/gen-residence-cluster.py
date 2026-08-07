# -*- coding: utf-8 -*-
"""Residence batch: two careful rebuilds, two folds into proven canonicals.

── the map ────────────────────────────────────────────────────────────────

FOLDS (targets verified live):
  tourist-residence (260, 7v)        → tourist-residence-renewal-turkey-2026
                                       (8K, 400v — covers what the permit IS
                                       plus the e-ikamet flow; checked).
  real-estate-residence (919, 3v)    → buying-property-turkey-2026 (23K —
                                       covers residence-by-property in situ,
                                       including the Syrian bar and the
                                       anti-evasion notes; checked).

REBUILT:
  tourist-vs-student-residence-2025  → the 2026 comparison it should be: the
  (704, 23v, stale title)              tourist permit is now the HARD one
                                       (tightened scrutiny, closed
                                       neighbourhoods, refusals common) and
                                       the student permit the stable one
                                       (tied to enrolment, opens student
                                       work) — with the honest decision
                                       table and routes.
  kimlik-to-residence (294, 11v)     → the sensitive one, written to the
                                       rights-cluster bar: renouncing
                                       temporary protection (vazgeçme) is
                                       effectively irreversible, so the page
                                       is a WARNING page before a steps
                                       page. The real paths (family
                                       residence via marriage to a citizen;
                                       student residence — both requiring
                                       renunciation, consistent with our
                                       study-visa page which already
                                       carries the renunciation condition),
                                       the general short-term route stated
                                       as varying practice (passport +
                                       documented legal entry; provinces
                                       differ), what is NOT a path (a work
                                       permit does not convert a TP holder
                                       to a work residence — his regime is
                                       the exemption), and the ordering
                                       rule: never renounce before the
                                       alternative is secured in writing.

All four rows id == slug (checked); no inbound links. No lira figures and
no thresholds (the 200k-type numbers live in the property monster with
their sources).
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


COMP = 'tourist-vs-student-residence-2025'
K2R = 'kimlik-to-residence'
DEAD = ['tourist-residence', 'real-estate-residence']

for s in (COMP, K2R):
    r = get('articles?select=id,slug,status,details&slug=eq.' + s)[0]
    assert r['status'] == 'approved' and r['id'] == r['slug'] and len(r['details'] or '') < 1200, s
for d in DEAD:
    r = get('articles?select=id,slug,status&slug=eq.' + d)
    assert r and r[0]['status'] == 'approved' and r[0]['id'] == r[0]['slug'], d
ren = get('articles?select=status,details&slug=eq.tourist-residence-renewal-turkey-2026')[0]
assert ren['status'] == 'approved' and len(ren['details']) > 6000
mon = get('articles?select=status,details&slug=eq.buying-property-turkey-2026')[0]
assert mon['status'] == 'approved' and 'الإقامة العقارية' in mon['details']
for s in ('residence-rejection-appeal-turkey-2026', 'work-permit-students', 'turkey-study-visa-syrians-2026',
          'private-universities-turkey-2026', 'tourist-to-work-permit-2026', 'family-reunion',
          'turkish-citizenship-marriage-syrians-gaziantep', 'kimlik-temporary-protection-syria-2026',
          'syria-work-permit-exemption-turkey-2026-07', 'humanitarian-residence'):
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


C_DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الخلاصة التي انقلبت</strong></p>'
    '<p style="margin:0;">قبل سنوات كانت السياحية «السهلة» والطالب «المشروطة». اليوم انعكست '
    'الصورة: <strong>السياحية صارت الأصعب</strong> — تدقيق مشدَّد، وأحياء مغلقة للتسجيل، '
    'ورفض شائع — و<strong>إقامة الطالب هي الأثبت</strong> لمن له قيد دراسي حقيقي: تُمنح '
    'وتتجدّد بربطها بالقيد، وتفتح عمل الطالب.</p></div>'

    '<h2>المقارنة على أرض 2026</h2>'
    '<table><thead><tr><th></th><th>السياحية (Kısa Dönem)</th><th>الطالب (Öğrenci)</th></tr></thead><tbody>'
    '<tr><td><strong>أساس المنح</strong></td>'
    '<td>إقناع المديرية بسبب بقاء + سكن موثَّق + قدرة مالية + تأمين — والتقدير لها</td>'
    '<td><strong>قيدك الدراسي الفعلي</strong> في مؤسسة معترف بها — أساس موضوعي</td></tr>'
    '<tr><td><strong>واقع القبول</strong></td>'
    '<td>تشدّد متصاعد: رفض شائع، وتدقيق عناوين وكشوف، وولايات وأحياء مغلقة أمام التسجيل</td>'
    '<td>مستقر لمن قيده سليم — والمشاكل غالباً أوراق لا مبدأ</td></tr>'
    '<tr><td><strong>التجديد</strong></td>'
    '<td>معركة متكرّرة بالمعايير نفسها المتشدّدة</td>'
    '<td>يتبع استمرار القيد — وثيقة طالب جديدة وملف مرتّب</td></tr>'
    '<tr><td><strong>العمل</strong></td>'
    '<td>لا تفتح عملاً — وللتحويل لإذن عمل شرط الستة أشهر</td>'
    '<td>تفتح <strong>عمل الطالب</strong> (بعد السنة الأولى وبدوام جزئي للبكالوريوس)</td></tr>'
    '<tr><td><strong>الكلفة النمطية</strong></td>'
    '<td>رسوم + تأمين خاص لكامل المدة</td>'
    '<td>رسوم أخف عادةً + تأمين — وبعض الفئات تُعفى؛ اسأل مديريتك</td></tr>'
    '</tbody></table>'

    '<h2>فمن أين تبدأ أنت؟</h2>'
    '<ul>'
    '<li><strong>قادم للدراسة فعلاً؟</strong> لا تسلك السياحية «مرحلةً مؤقتة» — قبولك '
    'الجامعي هو ملفّك: <a href="/article/turkey-study-visa-syrians-2026">تأشيرة الدراسة '
    'وشروطها</a> ثم إقامة الطالب، و'
    '<a href="/article/private-universities-turkey-2026">دليل الجامعات الخاصة</a>.</li>'
    '<li><strong>مقيم سياحياً وتريد البقاء طويلاً؟</strong> السياحية ليست خطة استقرار: '
    'إمّا قيد دراسي حقيقي يحوّلك للطالب، وإمّا عقد عمل يفتح '
    '<a href="/article/tourist-to-work-permit-2026">التحويل لإذن العمل (شرط الستة '
    'أشهر)</a>.</li>'
    '<li><strong>تجديدك السياحي على الأبواب؟</strong> '
    '<a href="/article/tourist-residence-renewal-turkey-2026">دليل التجديد خطوة '
    'بخطوة</a> — وإن رُفضت: '
    '<a href="/article/residence-rejection-appeal-turkey-2026">الاعتراض على الرفض '
    'بمواعيده</a>.</li>'
    '</ul>'

    '<h2>أخطاء تُكلّف الملف</h2>'
    '<ul>'
    '<li><strong>قيد «شكلي» في معهد لأجل الإقامة</strong>: القيد غير الفعلي يُكتشف '
    'ويُسقط الإقامة والسمعة معاً — إقامة الطالب لطالبٍ يدرس.</li>'
    '<li><strong>عنوان في حي مغلق للتسجيل</strong>: تحقّق قبل عقد الإيجار لا بعده.</li>'
    '<li><strong>كشف بنكي «مفبرك»</strong> بإيداع كبير مفاجئ — التدقيق يقرأ الحركة لا '
    'الرصيد.</li>'
    '<li><strong>تأمين أرخص لا تعترف به المديرية</strong> — اسأل عن المواصفات المقبولة '
    'قبل الشراء.</li>'
    '</ul>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>أنا طالب لغة (TÖMER) لا جامعة — أيّهما لي؟</h3>'
    '<p>قيد معاهد اللغة ليس قيداً جامعياً يؤسّس إقامة طالب عادةً — كثير من دارسي اللغة '
    'على سياحية بواقعها الصعب. اسأل مديريتك عن حالة معهدك، ولا تبنِ على وعد المعهد.</p>'
    '<h3>هل أستطيع التحوّل من السياحية إلى الطالب داخل تركيا؟</h3>'
    '<p>التحوّل بين أنواع الإقامات وارد عبر e-ikamet متى توافر أساس النوع الجديد '
    '(قبول وقيد فعلي) — قدّم قبل انتهاء إقامتك القائمة ولا تدع فجوة.</p>'
    '<h3>وحامل الكملك؟</h3>'
    '<p>هذه المقارنة لحاملي الإقامات. الانتقال من الحماية المؤقتة إلى أي إقامة بابٌ '
    'آخر بتحذيراته الثقيلة: <a href="/article/kimlik-to-residence">التحويل من الكملك '
    'إلى إقامة — والتنازل الذي لا رجعة عنه</a>.</p>'
)

K_DETAILS = (
    '<div style="background:#fee2e2;border:2px solid #dc2626;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>اقرأ هذا قبل أي خطوة</strong></p>'
    '<p style="margin:0;">الانتقال من الحماية المؤقتة إلى إقامة يمرّ غالباً '
    'بـ<strong>التنازل عن الكملك (Vazgeçme)</strong> — وهو قرار '
    '<strong>شبه نهائي</strong>: العودة إلى الحماية بعد التنازل غير مضمونة إطلاقاً. '
    'فالقاعدة الذهبية: <strong>لا تتنازل قبل أن يكون البديل مضموناً</strong> — ومن '
    'تنازل ثم رُفض طلبه بقي بلا وضع.</p></div>'

    '<h2>المسارات الحقيقية — وما يتطلّبه كلٌّ منها</h2>'

    '<h3>1. الزواج من مواطن/مواطنة تركية ← الإقامة العائلية</h3>'
    '<p>أوضح المسارات وأثبتها: زواج مدني مسجَّل يؤسّس إقامة عائلية برعاية الزوج '
    'المواطن — ويتطلّب الخروج من الحماية المؤقتة إلى نظام الإقامات. راجع '
    '<a href="/article/family-reunion">إقامة لمّ الشمل العائلية</a>، وبعد سنواتها '
    'ينفتح باب <a href="/article/turkish-citizenship-marriage-syrians-gaziantep">'
    'الجنسية عبر الزواج</a>.</p>'

    '<h3>2. القيد الجامعي ← إقامة الطالب</h3>'
    '<p>الطالب الجامعي يستطيع الانتقال إلى إقامة طالب — وشرط التخلّي عن الحماية '
    'المؤقتة حاضر في هذا المسار (وهو نفسه المذكور في شروط '
    '<a href="/article/turkey-study-visa-syrians-2026">تأشيرة الدراسة</a> لمن يقدّم '
    'من الخارج). قيدٌ فعلي مستمر، وملف كامل، وقرارٌ يُتّخذ بعين مفتوحة: إقامة الطالب '
    'تنتهي بانتهاء الدراسة — ماذا بعدها؟ خطّط للخطوة التالية قبل التنازل لا بعده.</p>'

    '<h3>3. المسار العام (قصيرة الأمد): الأضيق والأكثر تفاوتاً</h3>'
    '<p>طلب إقامة قصيرة الأمد عبر e-ikamet متاح نظرياً — وعملياً تربطه الممارسة بشروط '
    'مشدَّدة يتقدّمها <strong>جواز سفر ساري ودخول نظامي موثَّق</strong>، ويتفاوت '
    'التطبيق بين ولاية وأخرى تفاوتاً واسعاً (وتتردّد في الممارسة اشتراطات على تاريخ '
    'الدخول وطريقته لا نصّ منشوراً موحّداً لها). فلا تبنِ على تجربة غيرك في ولاية '
    'أخرى: <strong>اسأل مديرية ولايتك أنت عن حالتك أنت</strong> قبل أي ترتيب — '
    'وقبل أي تنازل.</p>'

    '<h3>وما ليس مساراً أصلاً</h3>'
    '<ul>'
    '<li><strong>إذن العمل لا يحوّل حامل الكملك إلى «إقامة عمل»</strong> — عمل حامل '
    'الحماية المؤقتة يجري داخل نظامه عبر '
    '<a href="/article/syria-work-permit-exemption-turkey-2026-07">الإعفاء '
    'وتسهيلاته</a>، ويبقى كملكه كملكاً.</li>'
    '<li><strong>الإقامة الإنسانية ليست «بديلاً يُطلب»</strong> — حالات حصرية بتقدير '
    'الإدارة: <a href="/article/humanitarian-residence">تفصيلها هنا</a>.</li>'
    '</ul>'

    '<h2>الترتيب الذي يحميك — خطوةً خطوة</h2>'
    '<ol>'
    '<li><strong>أسِّس البديل أولاً</strong>: عقد الزواج المسجَّل، أو القبول والقيد '
    'الجامعي الفعلي، أو تأكيد المديرية لمسارك العام.</li>'
    '<li><strong>اسأل مديرية ولايتك عن التسلسل الإجرائي</strong> في حالتك: متى يقع '
    'التنازل ضمن معاملة الإقامة؟ وما مصيرك إن رُفض الطلب؟ اطلب الجواب واضحاً قبل '
    'البدء.</li>'
    '<li><strong>وثّق كل شيء</strong>: قرارات، وإيصالات، وأسماء، وتواريخ.</li>'
    '<li><strong>الملفات المركّبة تحتاج محامياً قبل التنازل لا بعده</strong> — كلفة '
    'الاستشارة لا تُقارن بكلفة البقاء بلا وضع.</li>'
    '</ol>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>لماذا أنتقل أصلاً — ما الذي تعطيه الإقامة ولا يعطيه الكملك؟</h3>'
    '<p>حرية السفر الدولي بجواز، ومسارات التجنيس الاعتيادية، وإقامة بلا قيد الولاية. '
    'ومقابلها تخسر مظلّة الحماية وخدماتها. الموازنة فردية بحتة — '
    '<a href="/article/kimlik-temporary-protection-syria-2026">ما يعطيه الكملك '
    'بالتفصيل</a>.</p>'
    '<h3>تنازلت سابقاً وأريد العودة للحماية؟</h3>'
    '<p>لا تفترض إمكانها — إعادة التسجيل بعد التنازل استثناء ضيّق لا قاعدة، والتسجيل '
    'الجديد مجمَّد أصلاً منذ 2022 إلا استثناءات. راجع مديريتك بواقعك الحالي.</p>'
    '<h3>هل يشمل التنازل عائلتي كلّها؟</h3>'
    '<p>القيود فردية والملفات عائلية التشابك — اسأل عن أثر خطوتك على كل فرد قبل '
    'التوقيع، خاصة الأطفال.</p>'
)

for label, body, needles in [
    ('comparison', C_DETAILS, ['السياحية صارت الأصعب', 'عمل الطالب', 'tourist-residence-renewal-turkey-2026',
                               'residence-rejection-appeal-turkey-2026', 'tourist-to-work-permit-2026',
                               'turkey-study-visa-syrians-2026', 'kimlik-to-residence']),
    ('kimlik2res', K_DETAILS, ['Vazgeçme', 'شبه نهائي', 'لا تتنازل قبل', 'family-reunion',
                               'syria-work-permit-exemption-turkey-2026-07', 'humanitarian-residence',
                               'اسأل مديرية ولايتك', 'kimlik-temporary-protection-syria-2026']),
]:
    for nd in needles:
        assert nd in body, 'PREDICATE WOULD LIE: %r not in %s' % (nd, label)
ALL = C_DETAILS + K_DETAILS
for dead in DEAD:
    assert ('href="/article/%s"' % dead) not in ALL
assert not re.search(r'\d[\d.,]*\s*(?:ليرة|TL|دولار|\$)', ALL), 'a money figure leaked'
assert '%' not in ALL
assert 'قبل 2016' not in ALL, 'the circulating date-rule must stay practice-framed, not asserted'

arts = '\n\n'.join([
    art_sql(slug=COMP,
            title='السياحية أم الطالب؟ مقارنة إقامتَي 2026 — الصورة انقلبت',
            intro='قبل سنوات كانت الإقامة السياحية «السهلة» وإقامة الطالب «المشروطة». اليوم انعكست الصورة تماماً: السياحية صارت الأصعب — تدقيق مشدَّد ورفض شائع وأحياء مغلقة للتسجيل — والطالب هي الأثبت لمن له قيد دراسي حقيقي، وتفتح فوق ذلك عمل الطالب. هذه المقارنة على أرض الواقع، وجدول القرار، ومن أين يبدأ كلُّ حال.',
            details=C_DETAILS,
            steps=arr(['حدّد وضعك الحقيقي: دارس فعلاً؟ باحث عن استقرار؟ مجدِّد سياحية؟',
                       'القادم للدراسة: تأشيرة الدراسة فالقيد فإقامة الطالب — لا تسلك السياحية «مرحلة».',
                       'المقيم سياحياً الباحث عن بقاء: قيد دراسي حقيقي أو عقد عمل يفتح التحويل — السياحية ليست خطة.',
                       'قبل أي عقد إيجار: تحقّق أن الحي مفتوح للتسجيل.',
                       'جهّز ملفاً يقرأه المدقّق: حركة حساب طبيعية، وتأمين بمواصفات مقبولة، وعنوان مطابق.',
                       'ورُفضت؟ مسار الاعتراض بمواعيده — لا تعد بالملف نفسه.']),
            tips=arr(['السياحية اليوم معركة تجديد متكررة — الطالب أساس موضوعي يتجدد بالقيد.',
                      'قيد «شكلي» لأجل الإقامة يُكتشف ويُسقط أكثر مما يبني.',
                      'إقامة الطالب تفتح عمل الطالب (بعد السنة الأولى، جزئياً للبكالوريوس).',
                      'الكشف البنكي يُقرأ حركةً لا رصيداً — الإيداع المفاجئ الكبير علامة ضدك.',
                      'دارس اللغة ليس طالباً جامعياً في نظر الإقامة عادةً — اسأل مديريتك.',
                      'حامل الكملك خارج هذه المقارنة — بابه صفحة التحويل بتحذيراتها.']),
            docs=arr(['للسياحية: جواز، سكن موثَّق بحي مفتوح، قدرة مالية بحركة طبيعية، تأمين مقبول',
                      'للطالب: قبول وقيد فعلي، وثيقة طالب، سكن، تأمين',
                      'للتحوّل بين النوعين: أساس النوع الجديد + طلب e-ikamet قبل انتهاء القائم']),
            fees='رسوم الإقامات بتعرفة رسمية سنوية تختلف بالنوع والمدة والجنسية — راجع صفحة رسوم الإقامة الجارية ولا تعتمد رقماً متداولاً. والتأمين الخاص كلفته الحقيقية بحسب العمر والمدة.',
            warn='القيد الدراسي غير الفعلي طريق إسقاط لا بناء. والعنوان في حي مغلق يُفشل الملف قبل أن يبدأ. والسياحية ليست خطة استقرار طويل — خطّط للتحويل من اليوم الأول.',
            source='نظام الإقامات في قانون الأجانب والحماية الدولية 6458 (قصيرة الأمد والطالب) وطلبات e-ikamet؛ وواقع التطبيق المشدَّد على القصيرة الأمد كما توثّقه أدلتنا المرتبطة (التجديد، والاعتراض على الرفض، والأحياء المغلقة)؛ وحق عمل الطالب في المادة 19 من قانون 6735',
            tags=arr(['الإقامة السياحية', 'إقامة الطالب', 'أنواع الإقامات', 'مقارنة', 'دليل', '2026']),
            cat='أنواع الإقامات',
            seo_t='السياحية أم الطالب 2026؟ الصورة انقلبت — والمقارنة الصادقة',
            seo_d='السياحية صارت الأصعب: تدقيق ورفض شائع وأحياء مغلقة — والطالب الأثبت لمن قيده حقيقي وتفتح عمل الطالب. جدول المقارنة، ومن أين يبدأ كل حال، وأخطاء تكلف الملف.'),
    art_sql(slug=K2R,
            title='التحويل من الكملك إلى إقامة 2026: المسارات الحقيقية — والتنازل الذي لا رجعة عنه',
            intro='قبل أي حديث عن الأوراق: الانتقال من الحماية المؤقتة إلى إقامة يمرّ بالتنازل عن الكملك (Vazgeçme) — وهو قرار شبه نهائي لا عودة مضمونة بعده، والتسجيل الجديد بالحماية مجمَّد أصلاً منذ 2022. هذه الصفحة تحذير قبل أن تكون خطوات: المسارات الحقيقية الثلاثة، وما ليس مساراً، والترتيب الوحيد الآمن — البديل المضمون أولاً ثم التنازل، وليس العكس أبداً.',
            details=K_DETAILS,
            steps=arr(['قبل كل شيء: هل تفهم أن التنازل شبه نهائي وأن العودة للحماية غير مضمونة؟',
                       'حدّد مسارك الحقيقي: زواج من مواطن؟ قيد جامعي فعلي؟ أم المسار العام الضيّق؟',
                       'أسِّس البديل كاملاً أولاً — عقد مسجَّل أو قيد فعلي أو تأكيد المديرية.',
                       'اسأل مديرية ولايتك عن التسلسل: متى يقع التنازل؟ وما مصيرك إن رُفض الطلب؟',
                       'الملف المركّب: محامٍ قبل التنازل لا بعده.',
                       'وثّق كل قرار وإيصال واسم وتاريخ.']),
            tips=arr(['القاعدة الذهبية: البديل المضمون أولاً — من تنازل ثم رُفض بقي بلا وضع.',
                      'إذن العمل لا يحوّل الكملك إلى إقامة عمل — نظام حامل الحماية هو الإعفاء.',
                      'المسار العام يتفاوت بين الولايات تفاوتاً واسعاً — تجربة غيرك ليست دليلك.',
                      'إقامة الطالب تنتهي بانتهاء الدراسة — خطّط لما بعدها قبل التنازل.',
                      'أثر الخطوة على أفراد عائلتك يُسأل عنه قبل التوقيع — خاصة الأطفال.',
                      'وازن بعينين مفتوحتين: سفرٌ وجنسية اعتيادية مقابل خسارة مظلة الحماية.']),
            docs=arr(['بحسب المسار: عقد الزواج المسجَّل، أو القبول والقيد الجامعي، أو ما تحدّده مديريتك للمسار العام',
                      'جواز سفر ساري (ركن كل المسارات عملياً)',
                      'ملف الإقامة المعتاد: سكن، تأمين، صور، رسوم',
                      'وقبلها كلها: جواب المديرية المكتوب/الواضح عن تسلسل حالتك']),
            fees='رسوم الإقامة بتعرفتها الرسمية بحسب النوع والمدة — وليست الكلفة الحقيقية للقرار: الكلفة هي ما تتنازل عنه. لا تدفع لوسيط يعدك «بتحويل مضمون» — لا وجود له.',
            warn='التنازل عن الحماية المؤقتة شبه نهائي والعودة غير مضمونة والتسجيل الجديد مجمَّد منذ 2022. لا تتنازل قبل ضمان البديل. والمسار العام ممارسة متفاوتة بين الولايات لا قاعدة منشورة موحدة — مرجعك مديريتك ومحاميك، وهذه الصفحة معلومات عامة لا استشارة في ملفك.',
            source='نظام الحماية المؤقتة (لائحة الحماية المؤقتة) وأحكام التنازل عنها، ونظام الإقامات في القانون 6458 وطلبات e-ikamet؛ وتجميد تسجيل الحماية المؤقتة الجديد منذ حزيران 2022 (موثَّق في دليلنا المرتبط)؛ وشرط التخلي عن الحماية في مسار الطالب كما في شروط تأشيرة الدراسة الرسمية',
            tags=arr(['الكملك', 'التحويل إلى إقامة', 'الحماية المؤقتة', 'التنازل', 'دليل', '2026']),
            cat='الكملك والحماية المؤقتة',
            seo_t='تحويل الكملك إلى إقامة: المسارات الحقيقية والتنازل النهائي',
            seo_d='الانتقال من الحماية المؤقتة يمرّ بتنازل شبه نهائي لا عودة مضمونة بعده — المسارات الثلاثة الحقيقية (زواج، طالب، العام الضيق)، وما ليس مساراً، والقاعدة: البديل المضمون أولاً.'),
])
arts = arts.replace('%', '%%')

sql = _no_bare_percent("""-- ============================================================================
-- دفعة الإقامات: إعادتا بناء حذرتان، وطيّتان إلى مرجعيين مثبتين
-- ============================================================================
-- * المقارنة (سياحية/طالب) بعنوان 2026: الصورة انقلبت — السياحية صارت الأصعب
--   والطالب الأثبت، بجدول قرار وأخطاء تكلّف الملف، وربط كامل بأدلة التجديد
--   والاعتراض والتحويل للعمل.
-- * تحويل الكملك إلى إقامة — بمعيار العنقود الحقوقي: صفحة تحذير قبل الخطوات.
--   التنازل (Vazgeçme) شبه نهائي، والمسارات الحقيقية ثلاثة (زواج المواطن،
--   والطالب — بشرط التخلي الحاضر أصلاً في صفحة تأشيرة الدراسة عندنا —
--   والعام الضيق المصوغ ممارسةً متفاوتة لا قاعدة)، وما ليس مساراً (إذن العمل
--   لا يحوّل)، والقاعدة الذهبية: البديل المضمون أولاً. وقاعدة «دخول قبل
--   2016» المتداولة لم تُنشر كنص — مؤكَّد آلياً.
-- * tourist-residence ← دليل التجديد (8 آلاف حرف، 400 قراءة).
-- * real-estate-residence ← وحش العقارات (يغطيها بمصادرها وقيد السوريين).
--
-- الصفوف الأربعة id == slug (فُحص). لا مبالغ مالية (مؤكَّد آلياً).
-- آمن لإعادة التشغيل.
-- ============================================================================

""") + arts + _no_bare_percent("""

-- الطيّتان
UPDATE articles SET status = 'draft', last_update = CURRENT_DATE
WHERE slug IN (%s) AND status = 'approved';

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved' AND details LIKE '%%السياحية صارت الأصعب%%';
    IF n <> 1 THEN RAISE EXCEPTION 'comparison rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved'
       AND details LIKE '%%Vazgeçme%%' AND details LIKE '%%لا تتنازل قبل%%';
    IF n <> 1 THEN RAISE EXCEPTION 'kimlik-to-residence rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug = '%s' AND details LIKE '%%قبل 2016%%';
    IF n > 0 THEN RAISE EXCEPTION 'the circulating date-rule leaked as text'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug IN (%s) AND status = 'approved';
    IF n > 0 THEN RAISE EXCEPTION '%% stub(s) still approved', n; END IF;
END
$check$;

SELECT 'comparison rebuilt (the picture flipped, 2026 title)' AS البند,
       (details LIKE '%%السياحية صارت الأصعب%%')::text AS النتيجة
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'kimlik-to-residence rebuilt (warning-first, vazgecme)',
       (details LIKE '%%Vazgeçme%%')::text
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'two stubs retired (want 0 approved)', count(*)::text
FROM articles WHERE slug IN (%s) AND status = 'approved';
""") % (', '.join("'%s'" % d for d in DEAD),
        COMP, K2R, K2R, ', '.join("'%s'" % d for d in DEAD),
        COMP, K2R, ', '.join("'%s'" % d for d in DEAD))

path = os.path.join(REPO, 'sql', '2026-08-07_residence_cluster.sql')
open(path, 'w', encoding='utf-8', newline='').write(sql)

_code = '\n'.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('المقارنة     : %s — 704 ← %d حرفاً (عنوان 2026، الصورة المنقلبة)' % (COMP, len(C_DETAILS)))
print('تحويل الكملك : %s — 294 ← %d حرفاً (تحذير أولاً: Vazgeçme شبه نهائي)' % (K2R, len(K_DETAILS)))
print('يتقاعد       : tourist-residence ← دليل التجديد | real-estate-residence ← وحش العقارات')
print('%% متبقية    :', sql.count('%%'))
print('quote parity :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written      :', path, len(sql), 'chars')
