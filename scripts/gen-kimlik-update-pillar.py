# -*- coding: utf-8 -*-
"""Kimlik data-update: consolidate the fragmented coverage into one pillar.

── why we lose the query (recon) ──────────────────────────────────────────

The owner googled «تحديث بيانات الكملك» and competitors outrank us. Not
because the page is missing — because the coverage is SPLIT four ways:
kimlik-data-update (3.7K, zero tags, address-heavy, 1 outlink),
kimlik-renewal-documents (2.5K fragment on the same query, id != slug),
kimlik-appointments (randevu how-to) and kimlik-renewal-steps (the
«تجديد» disambiguation, 13.8K). Four thin-to-mid pages dilute what one
strong page would hold — the exact cannibalization the thin-content
campaign was about.

── the fix ────────────────────────────────────────────────────────────────

1. kimlik-data-update REBUILT into the definitive pillar (~9K): the
   official verification project (YIMER page the owner sent + UNHCR help
   page), the three official booking channels, the 2026 randevu-account
   flow, the merged documents list, appointment-day rules, the 30-day
   rebooking penalty and the TP-cancellation risk, the 20-work-day
   address clause kept verbatim from the current page, a city section
   (Istanbul/Gaziantep/Urfa/Mersin/Hatay) on existing city assets, and a
   disambiguation box for the OTHER «تحديث بيانات» (the BTK phone-line
   one) that the query cloud constantly confuses.
2. kimlik-renewal-documents RETIRED (status='draft', id!=slug so update
   by slug) behind a next.config 301 to the pillar; its two inbound
   links rewritten by exact single-line needles.
3. Reverse links added (guarded appends) from the three heavy pages that
   did not link the pillar: the TP pillar, the phone-line page, the
   address-mandate page. kimlik-appointments already links it.

Facts adopted only from the two official pages (YIMER, UNHCR help) and
the competitor texture that they confirm (account-based randevu flow,
congested-province deferred-SMS behaviour — framed as practice, not law).
No money figures. Silent batch (replica sandwich): strengthening, not
news — only the pillar's title changes and no bell row should fire.
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


PILLAR = 'kimlik-data-update'
FRAG = 'kimlik-renewal-documents'

r = get('articles?select=id,slug,status&slug=eq.' + PILLAR)[0]
assert r['id'] == r['slug'] == PILLAR and r['status'] == 'approved'
fr = get('articles?select=id,slug,status&slug=eq.' + FRAG)[0]
assert fr['status'] == 'approved' and fr['id'] != fr['slug']  # update-by-slug only

LINKS = ['identity-kimlik-iptal-v160', 'kimlik-renewal-steps', 'kimlik-appointments',
         'syrian-address-update-mandate-turkey', 'gecici-koruma-hat-guncelleme-2026',
         'turkcell-hat-dogrulama-resimli-rehber-2026-06', 'immigration-offices-istanbul',
         'istanbul-goc-randevu-noter-2026', 'kimlik-temporary-protection-syria-2026',
         'lost-kimlik-replacement', 'syrian-kimlik-transfer',
         'gaziantep-open-neighborhoods-list-2026-06-17', 'urfa-closed-neighborhoods-list-2026']
for s in LINKS:
    rr = get('articles?select=status&slug=eq.' + s)
    assert rr and rr[0]['status'] == 'approved', s + ' not live'

N1 = '<a href="/article/kimlik-renewal-documents">الأوراق المطلوبة</a>'
R1 = '<a href="/article/kimlik-data-update">الأوراق المطلوبة</a>'
N2 = ('<a href="/article/kimlik-renewal-documents">أوراق تحديث البيانات</a> و'
      '<a href="/article/kimlik-renewal-steps">خطوات تحديث البيانات</a>')
R2 = ('<a href="/article/kimlik-data-update">أوراق تحديث البيانات وخطواته</a> و'
      '<a href="/article/kimlik-renewal-steps">حقيقة «تجديد الكملك»</a>')
assert get('articles?select=details&slug=eq.kimlik-renewal-steps')[0]['details'].count(N1) == 1
assert get('articles?select=details&slug=eq.lost-passport-turkey')[0]['details'].count(N2) == 1

TITLE = ('تحديث بيانات الكملك في تركيا 2026: رابط حجز الموعد الرسمي والأوراق والخطوات — '
         'ولايةً بولاية، والفرق بينه وبين تحديث الخط')
INTRO = ('«تحديث البيانات» (Veri Güncelleme) هو الإجراء الحقيقي الوحيد على بطاقة الحماية '
         'المؤقتة — مشروع رسمي تديره إدارة الهجرة، إلزامي، ومسؤوليتك الشخصية بنص صفحات '
         'الدولة نفسها. ومع ذلك تعيش حوله سوق كاملة من الروابط المزيفة والوسطاء الذين '
         'يبيعونك موعداً مجانياً. هذا الدليل يعطيك كل شيء من المصادر الرسمية: القنوات '
         'الثلاث للحجز (وأولها randevu.goc.gov.tr مجاناً)، وملف الأوراق كاملاً، وما يحدث '
         'يوم الموعد، وعقوبة تفويته (ثلاثون يوماً انتظاراً — وفي الإهمال المتمادي خطر '
         'إلغاء الحماية نفسها)، وخصوصيات إسطنبول وغازي عنتاب وأورفا ومرسين وهاتاي — '
         'وتنبيهاً مهماً: تحديث بيانات «الخط» رسالة أخرى وإجراء آخر.')

DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الخلاصة قبل التفاصيل</strong></p>'
    '<p style="margin:0;">التحديث <strong>مجاني بالكامل</strong> وقنواته الرسمية ثلاث لا '
    'رابع لها: الحجز الإلكتروني عبر <strong>randevu.goc.gov.tr</strong>، أو الاتصال بخط '
    '<strong>157</strong> (يرد بالعربية، على مدار الساعة)، أو مراجعة مديرية الهجرة في '
    'ولايتك. صاحب البيانات <strong>يحضر بنفسه</strong> — لا قريب ولا مكتب ولا وكيل. وكل '
    'من يبيعك «موعداً» أو «تجديداً» يبيعك شيئاً مجانياً أو غير موجود.</p></div>'

    '<div style="background:#eff6ff;border-right:4px solid #3b82f6;padding:14px 18px;margin:0 0 20px;">'
    '<p style="margin:0;"><strong>وصلتك رسالة من توركسل أو فودافون أو تورك تيليكوم؟</strong> '
    'ذاك إجراء آخر تماماً: تحديث بيانات <strong>خط الهاتف</strong> بقرار هيئة الاتصالات '
    'BTK، له مهله وطريقته الخاصة — لا علاقة له بموعد الهجرة. اقرأ: '
    '<a href="/article/gecici-koruma-hat-guncelleme-2026">تحديث بيانات الخط: المهل '
    'والخطوات</a> و<a href="/article/turkcell-hat-dogrulama-resimli-rehber-2026-06">'
    'الدليل المصوّر خطوة بخطوة</a>.</p></div>'

    '<h2>ما هو تحديث بيانات الكملك — ولماذا هو إلزامي؟</h2>'
    '<p>مشروع رسمي لإدارة الهجرة يعيد التحقق من بيانات السوريين تحت الحماية المؤقتة '
    'ويحدّثها: صفحة UNHCR التعريفية تقول بالحرف إن «تحديث البيانات إلزامي وهو مسؤولية '
    'الفرد»، وإن العملية تُسهّل التعرف على ذوي الاحتياجات والحالات الأشد ضعفاً. وصفحة '
    'YİMER الرسمية (البوابة العربية لإدارة الهجرة) تسمّي ضمن ولايات المشروع: هاتاي '
    'ومرسين وأضنة وكيليس وإسطنبول وغازي عنتاب وماردين — مع ولايات أخرى كثيرة تغطي '
    'عملياً أماكن وجود السوريين كلها. البطاقة نفسها بلا رسم وبلا «انتهاء صلاحية» — '
    'فما يسمّيه البعض «تجديد الكملك» إجراء لا وجود له، وحقيقته مشروحة في '
    '<a href="/article/kimlik-renewal-steps">صفحة الحسم: تجديد الكملك لا يوجد — '
    'والموجود هو التحديث</a>.</p>'

    '<h2>من يجب عليه التحديث؟</h2>'
    '<ul>'
    '<li>حامل البطاقة <strong>القديمة بالأبيض والأسود</strong> — من أوائل المستهدفين '
    'بنص صفحة UNHCR.</li>'
    '<li>كل من تغيّرت حالته ولم يبلّغ: <strong>ولادة، وفاة، زواج، طلاق، تغيير '
    'عنوان</strong>.</li>'
    '<li>من لم تُسجَّل حالته الخاصة أساساً (إعاقة، مرض مزمن، حالة ضعف).</li>'
    '<li>ومن استدعته مديريته برسالة نصية أو إشعار — <strong>الاستدعاء تكليف لا '
    'خيار</strong>.</li>'
    '</ul>'

    '<h2>حجز الموعد في 2026 — خطوة بخطوة</h2>'
    '<ol>'
    '<li>ادخل <strong>randevu.goc.gov.tr</strong> وأنشئ حساباً: رقمك الأجنبي (يبدأ '
    'بـ99) + رقم هاتف <strong>فعال باسمك</strong> + بريد إلكتروني وكلمة سر. النظام صار '
    'حسابياً — رموز التحقق وتفاصيل الموعد تصلك برسائل، فخطٌّ مقطوع يعني موعداً '
    'ضائعاً.</li>'
    '<li>اختر معاملة تحديث البيانات (Veri Güncelleme) وولايتك، واملأ البيانات '
    '<strong>كما هي في كملكك حرفياً</strong> — أي اختلاف إملائي يعلّق الطلب.</li>'
    '<li>خذ لقطة لرقم الطلب واحفظ استمارة PDF إن ظهرت — هي إثباتك عند أي التباس.</li>'
    '<li>في الولايات المزدحمة (إسطنبول، غازي عنتاب، بورصة، إزمير) قد يظهر «استلمنا '
    'طلبك وستصلك رسالة بالموعد» — هذا سلوك معتاد لا خطأ: <strong>انتظر الرسالة ولا '
    'تكرر الطلب</strong>.</li>'
    '<li>لا يناسبك الإلكتروني؟ اتصل بـ<strong>157</strong> (عربي، مجاني، على مدار '
    'الساعة) أو راجع مديريتك — وكل تفاصيل نظام المواعيد في '
    '<a href="/article/kimlik-appointments">دليل حجز موعد الهجرة</a>.</li>'
    '</ol>'

    '<h2>ملف الأوراق — خذ الأصول كلها</h2>'
    '<p>قاعدة UNHCR: أحضر <strong>الوثائق الأصلية</strong> وكل ما يدعم بياناتك:</p>'
    '<ul>'
    '<li>بطاقة الكملك الحالية + جواز السفر إن وُجد.</li>'
    '<li>دفتر العائلة، وثيقة الزواج أو الطلاق، وثائق المواليد الجدد.</li>'
    '<li>إثبات العنوان: عقد إيجار موثق، فواتير خدمات باسمك، أو بيان من المختار.</li>'
    '<li>الشهادات الدراسية ورخصة القيادة إن وُجدت.</li>'
    '<li>التقارير الطبية لأصحاب الحالات الخاصة — تسجيلها يفتح باب المساعدات '
    'المخصصة.</li>'
    '<li>رقم الموعد أو رسالة التأكيد.</li>'
    '</ul>'

    '<h2>يوم الموعد: ماذا يحدث في المديرية؟</h2>'
    '<p><strong>الحضور شخصي</strong> — الجواب الرسمي صريح في أن أحداً لا يُنجز المعاملة '
    'نيابة عنك، ولا تُرسل قريباً ليحجز أو يحضر عنك، والأطفال المشمولون يحضرون مع ولي '
    'أمرهم. في الموعد: تُراجع بياناتك حقلاً حقلاً، وتُؤخذ البصمات والصورة عند اللزوم، '
    'وتُصحَّح الأخطاء وتُسجَّل التغييرات، وقد تُمنح وثيقة معاملة أو تُبلَّغ بموعد '
    'استلام البطاقة المحدثة. صحّح كل خطأ تراه في الجلسة نفسها — الاسم، تاريخ الميلاد، '
    'تهجئة الأسماء اللاتينية — فالخطأ الذي يبقى في القيد يتناسخ في كل معاملة '
    'بعدها.</p>'

    '<h2>فوّت الموعد؟ أهملت الاستدعاء؟ — العواقب بلا تجميل</h2>'
    '<ul>'
    '<li>من فوّت موعده ينتظر <strong>30 يوماً</strong> قبل أن يستطيع الحجز من جديد — '
    'بنص صفحة UNHCR.</li>'
    '<li>الإهمال المتمادي للاستدعاءات قد يصل إلى <strong>إلغاء صفة الحماية '
    'المؤقتة</strong> — أي فقدان الأساس القانوني للوجود والصحة والتعليم والمساعدات. '
    'وإن وجدت قيدك معلقاً أو ملغى فابدأ من '
    '<a href="/article/identity-kimlik-iptal-v160">صفحة الإبطال (İptal) وإعادة '
    'التفعيل</a>.</li>'
    '<li>وتذكّر أن تغيير العنوان تحديداً <strong>لا ينتظر استدعاءً</strong>: القانون '
    '5490 يلزمك بتبليغه خلال <strong>عشرين يوم عمل</strong> («yirmi iş günü içinde») '
    'والنص يشمل الأجانب صراحة — لا «شهر ونصف» كما يشيع. التفاصيل والعواقب في '
    '<a href="/article/syrian-address-update-mandate-turkey">دليل تحديث العنوان '
    'الإجباري</a>.</li>'
    '</ul>'

    '<h2>ولايةً بولاية: ما يختلف وما لا يختلف</h2>'
    '<p>القنوات الثلاث واحدة في كل تركيا — ما يختلف هو الزحام والترتيبات المحلية:</p>'
    '<ul>'
    '<li><strong>إسطنبول:</strong> الضغط الأعلى والمواعيد بالرسائل المؤجلة — عناوين '
    'المقار وأرقامها في <a href="/article/immigration-offices-istanbul">دليل مقار '
    'الهجرة في إسطنبول</a>، ولتسليم أوراق الإقامة يوجد '
    '<a href="/article/istanbul-goc-randevu-noter-2026">مسار النوتر بلا انتظار '
    'الموعد</a> (للإقامات لا لتحديث الكملك).</li>'
    '<li><strong>غازي عنتاب:</strong> من ولايات المشروع المسماة رسمياً — وإن كان '
    'تحديثك يتضمن عنواناً جديداً فراجع '
    '<a href="/article/gaziantep-open-neighborhoods-list-2026-06-17">قائمة الأحياء '
    'المفتوحة رسمياً</a> قبل توقيع أي عقد.</li>'
    '<li><strong>شانلي أورفا:</strong> القاعدة نفسها — '
    '<a href="/article/urfa-closed-neighborhoods-list-2026">قائمة أورفا الرسمية</a>.</li>'
    '<li><strong>مرسين وهاتاي وأضنة وكيليس وماردين:</strong> كلها ضمن ولايات المشروع '
    'بنص صفحة YİMER — القنوات ذاتها، والمديرية المختصة هي مديرية ولايتك المسجل '
    'فيها.</li>'
    '<li>مسجّل في ولاية وتقيم في أخرى؟ لا تحدّث «من بعيد» — انظر '
    '<a href="/article/syrian-kimlik-transfer">نقل الكملك بين الولايات</a> أولاً.</li>'
    '</ul>'

    '<h2>ماذا يفتح لك التحديث؟ — ليس عبئاً فقط</h2>'
    '<p>القيد المحدَّث هو مفتاح استمرار كل الخدمات: العلاج بلا تعليق، وتسجيل الأطفال '
    'في المدارس، والمعاملات البنكية والنوتر التي تتحقق من القيد لحظياً. والأهم لمن '
    'حاله خاصة: صفحة UNHCR صريحة في أن العملية «تسهّل التعرف على ذوي الاحتياجات '
    'الخاصة والحالات الأشد ضعفاً» — أي أن تسجيل الإعاقة أو المرض المزمن أو حالة '
    'الضعف في الموعد نفسه قد يكون شرط وصولك إلى المساعدات المخصصة، ومنها مسارات '
    'الدعم كبطاقة الهلال الأحمر: '
    '<a href="/article/kizilay-card-application">من يستحق SUY وكيف يتقدم</a>.</p>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>كيف أتحقق بنفسي أن عنواني المسجل صحيح — قبل أي موعد؟</h3>'
    '<p>من e-Devlet برقمك الأجنبي: استخرج وثيقة الإقامة السكنية (Yerleşim Yeri '
    'Belgesi) المجانية وقارن العنوان المطبوع بعنوانك الفعلي — إن اختلفا فأنت داخل '
    'مهلة العشرين يوم عمل شئت أم أبيت، فبادر قبل أن تبادرك مراجعة أو استدعاء.</p>'
    '<h3>ما الرابط الرسمي لحجز موعد تحديث البيانات؟</h3>'
    '<p><strong>randevu.goc.gov.tr</strong> — لا غيره. الروابط المتداولة في المجموعات '
    'إما تعيد إليه وإما تصطادك؛ اكتبه بنفسك في المتصفح.</p>'
    '<h3>هل التحديث مدفوع؟ وهل يحتاج وسيطاً؟</h3>'
    '<p>مجاني بالكامل: البطاقة بلا أجر بنص المادة 22/3 من لائحة الحماية المؤقتة، '
    'والموعد مجاني، و157 مجاني. ولا وسيط أصلاً — الحضور شخصي بحكم الإجراء.</p>'
    '<h3>كم يستغرق وصول الموعد؟</h3>'
    '<p>يختلف بالولاية وضغطها — لا وعد مدة صادقاً. المضمون: الحصص تنفد سريعاً، فاحجز '
    'فور علمك بحاجتك للتحديث، وفي الولايات المزدحمة انتظر رسالة الموعد ولا تكرر '
    'الطلب.</p>'
    '<h3>أنا خارج ولايتي المسجل فيها — أحدّث في أقرب مديرية؟</h3>'
    '<p>المعاملة في مديرية ولاية قيدك. إن كان انتقالك دائماً فمسار '
    '<a href="/article/syrian-kimlik-transfer">النقل بين الولايات</a> يسبق التحديث.</p>'
    '<h3>فقدت بطاقتي قبل الموعد — ماذا أفعل؟</h3>'
    '<p>البدل مجاني وخطواته في <a href="/article/lost-kimlik-replacement">صفحة فقدان '
    'الكملك</a> — ثم احضر موعدك بوثيقة المحضر أو البدل.</p>'
    '<h3>ما علاقة كل هذا بالكملك نفسه وحقوقه؟</h3>'
    '<p>الصورة الكاملة لوضع الحماية المؤقتة وحقوقه في '
    '<a href="/article/kimlik-temporary-protection-syria-2026">دليل الكملك '
    'الشامل</a>.</p>')

STEPS = ['حدّد سبب تحديثك: استدعاء، تغيير حالة (زواج/ولادة/عنوان)، أو بطاقة قديمة.',
         'أنشئ حساباً في randevu.goc.gov.tr برقمك الأجنبي وهاتف فعال باسمك.',
         'احجز معاملة Veri Güncelleme واحفظ رقم الطلب ولقطة الشاشة.',
         'اجمع الأصول: الكملك، الجواز، دفتر العائلة، إثبات العنوان، التقارير الطبية.',
         'احضر بنفسك في الموعد — وصحّح كل خطأ في القيد بالجلسة نفسها.',
         'استلم وثيقة المعاملة أو موعد البطاقة المحدثة واحتفظ بها.',
         'تغيّر عنوانك لاحقاً؟ بلّغ خلال 20 يوم عمل دون انتظار استدعاء.']
TIPS = ['القنوات الرسمية ثلاث فقط: randevu.goc.gov.tr، وخط 157، ومديرية ولايتك.',
        'كل شيء مجاني — من يبيعك موعداً أو «تجديداً» محتال بنص الإجراء نفسه.',
        'الحضور شخصي: لا قريب ولا وكيل ولا مكتب يقوم مقامك.',
        'رسالة «ستصلك رسالة بالموعد» في الولايات المزدحمة طبيعية — لا تكرر الطلب.',
        'فوات الموعد = 30 يوماً انتظاراً قبل حجز جديد — بنص صفحة UNHCR.',
        'رسالة توركسل/فودافون عن «تحديث البيانات» إجراء آخر (الخط لا الكملك).',
        'الخطأ الذي لا تصححه في الجلسة يتناسخ في كل معاملة بعدها.']
DOCS = ['بطاقة الكملك + جواز السفر إن وُجد',
        'دفتر العائلة ووثائق الزواج/الطلاق/المواليد',
        'إثبات العنوان: عقد موثق أو فواتير أو بيان مختار',
        'الشهادات الدراسية ورخصة القيادة إن وُجدت',
        'التقارير الطبية لأصحاب الحالات الخاصة',
        'رقم الموعد أو رسالة التأكيد']
FEES = ('لا رسوم إطلاقاً: البطاقة والبدل بلا أجر بنص المادة 22/3 من لائحة الحماية '
        'المؤقتة، والموعد عبر randevu.goc.gov.tr مجاني، وخط 157 مجاني. أي مبلغ يُطلب '
        'منك — لموعد أو «تجديد» أو «تسريع» — احتيال فبلّغ عنه.')
WARN = ('الاستدعاء تكليف لا خيار: تجاهله المتمادي قد يصل إلى إلغاء صفة الحماية المؤقتة '
        'نفسها بنص صفحة UNHCR — وفوات الموعد وحده يكلفك 30 يوماً انتظاراً. ولا ترسل '
        'أحداً مكانك فالمعاملة شخصية. وتبليغ تغيير العنوان مهلته 20 يوم عمل مستقلاً عن '
        'أي استدعاء.')
SOURCE = ('صفحة YİMER الرسمية عن مشروع تحديث بيانات السوريين تحت الحماية المؤقتة '
          '(yimer.gov.tr — ولايات المشروع وقنوات المراجعة)؛ وصفحة مفوضية اللاجئين '
          'UNHCR تركيا عن التحقق من بيانات السوريين (help.unhcr.org/turkiye — إلزامية '
          'التحديث، الأوراق، قنوات الحجز الثلاث، عقوبة الثلاثين يوماً وخطر إلغاء '
          'الحماية)؛ ونظام المواعيد randevu.goc.gov.tr وخط 157؛ والمادة 22 من لائحة '
          'الحماية المؤقتة (لا أجر على البطاقة)؛ والمادة 50 من قانون خدمات النفوس 5490 '
          '(تبليغ العنوان خلال عشرين يوم عمل)')
TAGS = ['تحديث بيانات الكملك', 'حجز موعد', 'randevu', 'الكملك والحماية المؤقتة',
        'تحديث البيانات', 'دليل', '2026']
SEO_T = 'تحديث بيانات الكملك 2026: رابط الحجز الرسمي والأوراق والخطوات'
SEO_D = ('الدليل الكامل من المصادر الرسمية: حجز موعد تحديث بيانات الكملك عبر '
         'randevu.goc.gov.tr أو 157 مجاناً، ملف الأوراق، ما يحدث يوم الموعد، عقوبة '
         'التفويت (30 يوماً) وخطر إلغاء الحماية — وخصوصيات إسطنبول وغازي عنتاب وأورفا '
         'ومرسين وهاتاي.')

TP_APPEND = ('<p style="margin-top:1rem;"><strong>بياناتك هي كملكك:</strong> التحديث '
             'الدوري إلزامي ومجاني — دليله الكامل بالرابط الرسمي والأوراق والعواقب: '
             '<a href="/article/kimlik-data-update">تحديث بيانات الكملك خطوة بخطوة '
             '←</a></p>')
HAT_APPEND = ('<p style="margin-top:1rem;"><strong>تنبيه الالتباس الشائع:</strong> هذا '
              'المقال عن تحديث بيانات <strong>خط الهاتف</strong> (قرار BTK). أما «تحديث '
              'بيانات الكملك» لدى إدارة الهجرة فإجراء آخر بموعد ومسار مختلفين: '
              '<a href="/article/kimlik-data-update">دليله الكامل هنا ←</a></p>')
ADDR_APPEND = ('<p style="margin-top:1rem;"><strong>العنوان جزء من الصورة:</strong> '
               'تبليغ العنوان أحد بنود تحديث بيانات الكملك الأشمل — بالرابط الرسمي '
               'والأوراق وقواعد الموعد: <a href="/article/kimlik-data-update">الدليل '
               'الكامل لتحديث بيانات الكملك ←</a></p>')

for nd in ('randevu.goc.gov.tr', '157', '30 يوماً', 'عشرين يوم عمل', '22/3', '5490',
           'هاتاي ومرسين وأضنة وكيليس وإسطنبول وغازي عنتاب وماردين', 'Veri Güncelleme',
           'يحضر بنفسه', 'إلغاء صفة الحماية المؤقتة'):
    assert nd in DETAILS + WARN, 'PREDICATE WOULD LIE: %r' % nd
body = DETAILS + INTRO + FEES + WARN
assert not re.search(r'\d[\d.,]*\s*(?:ليرة|TL|دولار|\$)', body)
assert '%' not in body + TP_APPEND + HAT_APPEND + ADDR_APPEND
assert len(DETAILS) > 8000, len(DETAILS)
for a in (TP_APPEND, HAT_APPEND, ADDR_APPEND):
    assert 'kimlik-data-update' in a
assert FRAG not in DETAILS  # the pillar must not link the retiring fragment

COLS = ('id, slug, title, intro, details, steps, tips, documents, fees, warning, '
        'source, tags, category, status, seo_title, seo_description, last_update')
assert len(COLS.split(',')) == 17
vals = ["'" + q(PILLAR) + "'", "'" + q(PILLAR) + "'", "'" + q(TITLE) + "'",
        "'" + q(INTRO) + "'", "'" + q(DETAILS) + "'", arr(STEPS), arr(TIPS), arr(DOCS),
        "'" + q(FEES) + "'", "'" + q(WARN) + "'", "'" + q(SOURCE) + "'", arr(TAGS),
        "'الكملك والحماية المؤقتة'", "'approved'", "'" + q(SEO_T) + "'",
        "'" + q(SEO_D) + "'", 'CURRENT_DATE']
assert len(vals) == 17

sql = ("""-- ============================================================================
-- تحديث بيانات الكملك: توحيد التغطية المشظاة في ركيزة واحدة تتصدر الاستعلام
-- ============================================================================
-- المالك بحث «تحديث بيانات الكملك» فوجد المنافسين قبله — والسبب ليس غياب
-- الصفحة بل تشظّيها: أربع صفحات تتقاسم الاستعلام (الركيزة 3.7 ألف بلا وسوم،
-- وشظية أوراق 2.5 ألف، وصفحة مواعيد، وصفحة «التجديد») فتضعف كلها.
--
-- الحل: (1) إعادة بناء kimlik-data-update ركيزةً شاملة (~9.5 ألف حرف) على
-- المصدرين الرسميين اللذين أرسلهما المالك (صفحة YİMER + صفحة UNHCR):
-- القنوات الثلاث، مسار الحساب في randevu لعام 2026، ملف الأوراق مدمجاً من
-- الشظية، يوم الموعد، عقوبة الثلاثين يوماً وخطر إلغاء الحماية، بند العنوان
-- (20 يوم عمل — محفوظ حرفياً)، قسم الولايات، وصندوق فك الالتباس مع «تحديث
-- بيانات الخط». (2) تقاعد شظية kimlik-renewal-documents (id != slug —
-- تحديث بالـslug حصراً) مع 301 في next.config وإعادة كتابة رابطيها
-- الواردين بإبرتين دقيقتين. (3) ثلاث وصلات عائدة محروسة من الصفحات الثقيلة.
--
-- صامت (تقوية لا خبر): كل الـDML داخل replica ولا صف أخبار.
-- آمن لإعادة التشغيل.
-- ============================================================================

SET session_replication_role = 'replica';

-- 1) الركيزة
INSERT INTO articles (""" + COLS + """)
VALUES (""" + ',\n        '.join(vals) + """)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, intro = EXCLUDED.intro, details = EXCLUDED.details,
    steps = EXCLUDED.steps, tips = EXCLUDED.tips, documents = EXCLUDED.documents,
    fees = EXCLUDED.fees, warning = EXCLUDED.warning, source = EXCLUDED.source,
    tags = EXCLUDED.tags, category = EXCLUDED.category, status = EXCLUDED.status,
    seo_title = EXCLUDED.seo_title, seo_description = EXCLUDED.seo_description,
    last_update = EXCLUDED.last_update;

-- 2) إعادة كتابة الرابطين الواردين إلى الشظية (إبرتان دقيقتان)
UPDATE articles SET details = replace(details, '""" + q(N1) + """', '""" + q(R1) + """'),
       last_update = CURRENT_DATE
 WHERE slug = 'kimlik-renewal-steps' AND position('""" + q(N1) + """' in details) > 0;

UPDATE articles SET details = replace(details, '""" + q(N2) + """', '""" + q(R2) + """'),
       last_update = CURRENT_DATE
 WHERE slug = 'lost-passport-turkey' AND position('""" + q(N2) + """' in details) > 0;

-- 3) تقاعد الشظية (id != slug — بالـslug حصراً، لا upsert)
UPDATE articles SET status = 'draft', last_update = CURRENT_DATE
 WHERE slug = '""" + FRAG + """' AND status = 'approved';

-- 4) الوصلات العائدة المحروسة
UPDATE articles SET details = details || '""" + q(TP_APPEND) + """', last_update = CURRENT_DATE
 WHERE slug = 'kimlik-temporary-protection-syria-2026'
   AND position('kimlik-data-update' in details) = 0;

UPDATE articles SET details = details || '""" + q(HAT_APPEND) + """', last_update = CURRENT_DATE
 WHERE slug = 'gecici-koruma-hat-guncelleme-2026'
   AND position('kimlik-data-update' in details) = 0;

UPDATE articles SET details = details || '""" + q(ADDR_APPEND) + """', last_update = CURRENT_DATE
 WHERE slug = 'syrian-address-update-mandate-turkey'
   AND position('kimlik-data-update' in details) = 0;

SET session_replication_role = 'origin';

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM articles
     WHERE slug = '""" + PILLAR + """' AND status = 'approved'
       AND position('randevu.goc.gov.tr' in details) > 0
       AND position('30 يوماً' in details) > 0
       AND position('هاتاي ومرسين وأضنة وكيليس وإسطنبول وغازي عنتاب وماردين' in details) > 0
       AND position('عشرين يوم عمل' in details) > 0
       AND length(details) > 8000;
    IF n <> 1 THEN RAISE EXCEPTION 'pillar rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug = '""" + PILLAR + """';
    IF n <> 1 THEN RAISE EXCEPTION 'duplicate pillar slug'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = '""" + FRAG + """' AND status = 'draft';
    IF n <> 1 THEN RAISE EXCEPTION 'fragment not retired'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE status = 'approved' AND position('/article/""" + FRAG + """' in details) > 0;
    IF n <> 0 THEN RAISE EXCEPTION 'approved pages still link the fragment: %', n; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug IN ('kimlik-temporary-protection-syria-2026',
                    'gecici-koruma-hat-guncelleme-2026',
                    'syrian-address-update-mandate-turkey')
       AND position('kimlik-data-update' in details) > 0;
    IF n <> 3 THEN RAISE EXCEPTION 'reverse links landed % of 3', n; END IF;
END
$check$;

SELECT slug AS الصفحة, status AS الحالة, length(details) AS الحجم,
       (position('kimlik-data-update' in details) > 0)::text AS يصل_للركيزة
  FROM articles
 WHERE slug IN ('""" + PILLAR + """', '""" + FRAG + """', 'kimlik-renewal-steps',
                'lost-passport-turkey', 'kimlik-temporary-protection-syria-2026',
                'gecici-koruma-hat-guncelleme-2026', 'syrian-address-update-mandate-turkey')
 ORDER BY slug;
""")

code = '\n'.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
assert re.sub(r"''", '', code).count("'") % 2 == 0, 'quote imbalance'
assert code.index("'replica'") < code.index('INSERT INTO articles') < code.index("'origin'") < code.index('DO $check$')
assert 'INSERT INTO updates' not in code
assert code.count("SET status = 'draft'") == 1
assert "WHERE slug = '" + FRAG + "' AND status = 'approved'" in code

path = os.path.join(REPO, 'sql', '2026-08-08_kimlik_update_pillar.sql')
open(path, 'w', encoding='utf-8', newline='').write(sql)
print('الركيزة  : %s الآن %d حرفاً (%d روابط داخلية) — كانت 3,697' % (
    PILLAR, len(DETAILS), len(re.findall(r'href="/article/', DETAILS))))
print('التقاعد  : %s (شظية 2.5 ألف تسرق الاستعلام) → draft + 301' % FRAG)
print('الإبرتان : kimlik-renewal-steps + lost-passport-turkey')
print('العائدة  : 3 وصلات محروسة من الصفحات الثقيلة')
print('written  :', path, len(sql), 'chars')
