# -*- coding: utf-8 -*-
"""Transport-apps batch: eight scraps — five fold, one rebuilt, one rerouted,
one left on purpose.

── the calls, and why ─────────────────────────────────────────────────────

* NEW canonical istanbulkart-mavi-kart-2026: Istanbulkart + Mavi Kart are
  real public-transport topics (İBB), not app manuals. The two card stubs
  fold into it — including istanbulkart-hes-code, whose slug still carries
  the pandemic-era HES code; the page says plainly that requirement is gone.
  The three commercial-mobility stubs (BiTaksi, TikTak, Martı) fold in as
  honest MODE sections — what a taxi app changes and what it doesn't (the
  meter still sets the price), what minute-rental actually requires (a
  Turkish licence held for a provider-set period + a credit card in the same
  name — which excludes most newcomers, said plainly, with a link to the
  licence-conversion guide), and scooter ground rules. Terms of commercial
  apps shift; the page teaches the stable rules and names no prices.
* travel-tcdd-yht-app rebuilt small: state railways = our lane. Official
  sales channels only, ID-must-match-ticket, and the differentiator no
  competitor page has: a TP/kimlik holder's train ticket does NOT replace
  the inter-province travel permit — linked to our travel-permit guide.
* cimri-price-compare (120 chars, a shopping-comparison app) retires into
  the consumer-rights guide — the only topical home it has.
* travel-muzekart is LEFT LIVE on purpose: resident-vs-tourist museum-pass
  eligibility deserves verification in a future leisure batch; burying it
  behind an unrelated 301 buries a real question. Check block asserts it
  stays approved.

All eight rows id == slug (checked live); none has inbound links.
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


CANON = 'istanbulkart-mavi-kart-2026'
YHT = 'travel-tcdd-yht-app'
DEAD_CANON = ['istanbulkart-hes-code', 'istanbul-mavi-kart', 'bitaksi-app',
              'tiktak-car-rental', 'marti-scooter-rental']
DEAD_CONSUMER = ['cimri-price-compare']

assert not get('articles?select=slug&slug=eq.' + CANON), 'canonical slug taken'
y = get('articles?select=id,slug,status,details&slug=eq.' + YHT)[0]
assert y['status'] == 'approved' and y['id'] == y['slug'] and len(y['details'] or '') < 1000
for d in DEAD_CANON + DEAD_CONSUMER:
    r = get('articles?select=id,slug,status&slug=eq.' + d)
    assert r and r[0]['status'] == 'approved' and r[0]['id'] == r[0]['slug'], d
for s in ('license-conversion-arab-countries-2026', 'travel-permit',
          'consumer-arbitration-hakem-heyeti', 'istanbul-goc-randevu-noter-2026'):
    r = get('articles?select=status&slug=eq.' + s)
    assert r and r[0]['status'] == 'approved', s + ' not live'
mz = get('articles?select=status&slug=eq.travel-muzekart')[0]
assert mz['status'] == 'approved'

# ── the Istanbul transport canonical ─────────────────────────────────────
C_TITLE = 'المواصلات في إسطنبول 2026: Istanbulkart وMavi Kart — والتاكسي وتأجير الدقائق بقواعدها الثابتة'
C_INTRO = ('كل مواصلات إسطنبول العامة — مترو، باص، مترobüس، فيري — تُدفع ببطاقة واحدة: '
           'Istanbulkart. وهذا الدليل يرتّب ما يثبت من قواعدها: البطاقة المجهولة وشحنها، '
           'والبطاقة الشخصية ولماذا تحتاجها، واشتراك Mavi Kart الشهري ومتى يوفّر عليك '
           'فعلاً، وخصم التبديل بين الوسائط — ثم القواعد الثابتة للتاكسي وتطبيقاته '
           'وتأجير السيارات بالدقيقة والسكوترات، بلا أسعار تتقادم ولا شروحات تطبيقات '
           'تتغيّر كل شهر.')
C_DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الخلاصة</strong></p>'
    '<p style="margin:0;">اشترِ <strong>Istanbulkart</strong> من آلات البيع في المحطّات '
    'واشحنها — تكفيك للبدء. وإن صرت تركب يومياً: <strong>شخصِن</strong> بطاقتك ثم قارن '
    'كلفة شهرك باشتراك <strong>Mavi Kart</strong> الشهري المفتوح. ورمز HES من زمن '
    'الجائحة <strong>لم يعد مطلوباً</strong> في شيء.</p></div>'

    '<h2>Istanbulkart: البطاقة الواحدة لكل شيء</h2>'
    '<ul>'
    '<li><strong>الشراء والشحن</strong>: من آلات البيع (Biletmatik) في المحطّات ونقاط '
    'البيع المعتمدة. البطاقة المجهولة تعمل فوراً بلا أوراق.</li>'
    '<li><strong>خصم التبديل (Aktarma)</strong>: الانتقال بين وسيلة وأخرى خلال مهلة '
    'التبديل يُحتسب بتعرفة مخفَّضة تلقائياً — بشرط الدفع بالبطاقة نفسها.</li>'
    '<li><strong>بطاقة واحدة لشخص واحد عند البوّابات المخفَّضة</strong>؛ والعائلة تستطيع '
    'المرور ببطاقة مجهولة واحدة بالتعرفة الكاملة حيث يُسمح بتمريرها المتكرّر.</li>'
    '</ul>'

    '<h2>الشخصنة (Kişiselleştirme): متى تحتاجها؟</h2>'
    '<p>البطاقة <strong>الشخصية</strong> — تُستخرج عبر تطبيق İstanbulkart الرسمي أو مراكز '
    'الخدمة بهويتك — هي شرط كلّ ما يتجاوز التعرفة الكاملة:</p>'
    '<ul>'
    '<li><strong>الاشتراكات الشهرية</strong> (ومنها Mavi Kart).</li>'
    '<li><strong>الفئات المخفَّضة</strong>: طلاب، وكبار سنّ، وفئات اجتماعية — لكلٍّ شروط '
    'أهلية ووثائق تحدّدها البلدية؛ اسأل مركز الخدمة عن فئتك بوثائقك أنت.</li>'
    '<li><strong>استرجاع الرصيد</strong> عند فقدان البطاقة — المجهولة تذهب بمن وجدها.</li>'
    '</ul>'

    '<h2>Mavi Kart: متى يوفّر عليك الاشتراك الشهري؟</h2>'
    '<p>Mavi Kart اشتراك شهري يُحمَّل على بطاقة شخصية ويعطيك ركوباً مفتوحاً ضمن نطاقه '
    'خلال الشهر. الحساب الذي يقرّر — بلا أرقام تتقادم:</p>'
    '<ol>'
    '<li>احسب رحلاتك الفعلية في الشهر (ذهاباً وإياباً، بعدد أيام عملك).</li>'
    '<li>اضرب بتعرفة رحلتك المعتادة بعد خصم التبديل.</li>'
    '<li>قارن الناتج بسعر الاشتراك الجاري المعلن في التطبيق الرسمي.</li>'
    '</ol>'
    '<p>القاعدة العملية: من يركب مرّتين يومياً في أيام العمل غالباً ما يكون الاشتراك في '
    'مصلحته — لكن احسبها بنفسك بالأرقام الجارية لا بقاعدة منقولة.</p>'

    '<h2>وماذا عن رمز HES؟ انتهى</h2>'
    '<p>اشتراط ربط رمز HES بالبطاقة كان تدبير جائحة وانتهى بانتهائها — لا تحتاجه اليوم '
    'لشيء، وأي شرح يطلبه منك شرحٌ قديم.</p>'

    '<h2>التاكسي وتطبيقاته: ما يتغيّر وما يثبت</h2>'
    '<p>تطبيقات طلب التاكسي تعرض لك السيارة والسائق واللوحة قبل الركوب — قيمتها في '
    '<strong>التوثيق والأمان</strong> وتقدير الطريق. أمّا السعر فيحكمه <strong>العدّاد '
    'الرسمي</strong> بتعرفة البلدية، تطبيقاً كان الطلب أم إشارة يد:</p>'
    '<ul>'
    '<li>العدّاد يعمل من بداية الرحلة — «بلا عدّاد، سعر متّفق» ليست عرضاً بل مخالفة، '
    'وارفضها.</li>'
    '<li>لقطة شاشة لمسار التطبيق ولوحة السيارة هي حجّتك عند أي خلاف — والشكاوى تمرّ عبر '
    'قنوات البلدية والتطبيق نفسه.</li>'
    '<li>الدفع نقداً أو بالبطاقة بحسب السيارة — اسأل قبل الركوب لا بعد الوصول.</li>'
    '</ul>'

    '<h2>تأجير السيارات بالدقيقة: اقرأ الشرطين قبل أن تتحمّس</h2>'
    '<p>خدمات التأجير بالدقيقة تشترط عادةً <strong>رخصة قيادة تركية ممضيّاً عليها مدّة '
    'يحدّدها المزوّد</strong> و<strong>بطاقة ائتمان باسم صاحب الرخصة نفسه</strong> — '
    'وهذان الشرطان يستبعدان أكثر القادمين الجدد. فقبل أي تطبيق: هل رخصتك تركية أصلاً؟ '
    'تحويل الرخصة الأجنبية له مساره — '
    '<a href="/article/license-conversion-arab-countries-2026">تحويل رخصة القيادة '
    'العربية إلى تركية</a>. والتفاصيل (التصوير قبل الفتح، ومنطقة الإنهاء المسموحة، '
    'وتغطية التأمين وتحمّلاته) في شروط كل مزوّد — اقرأها فعلاً؛ التحمّل عند الحادث '
    'يفاجئ من لم يقرأ.</p>'

    '<h2>السكوترات الكهربائية: القواعد التي تثبت</h2>'
    '<ul>'
    '<li>مسح، ركوب، ثم <strong>ركن في مكان مسموح</strong> وإنهاء الرحلة في التطبيق — '
    'رحلة لم تُنهَ تظلّ تُحاسَب، وركنٌ سيّئ يجلب غرامة على حسابك.</li>'
    '<li>صوّر السكوتر عند الإنهاء — حجّتك إن ادّعى المزوّد خلاف ذلك.</li>'
    '<li>القواعد المرورية للسكوتر (السنّ، والخوذة، وأماكن السير) تحكمها اللوائح لا '
    'التطبيق.</li>'
    '</ul>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>هل أستطيع استخراج بطاقة شخصية بالكملك أو الإقامة؟</h3>'
    '<p>الشخصنة تتمّ بالهوية عبر التطبيق الرسمي أو المراكز — والكملك والإقامة هويّتان '
    'معتمدتان في المعاملات عموماً. الفئات المخفَّضة شأن آخر: لكلٍّ شروط أهلية، اسأل '
    'مركز الخدمة عن فئتك.</p>'
    '<h3>فقدت بطاقتي وفيها رصيد — ماذا أفعل؟</h3>'
    '<p>إن كانت شخصية: بلّغ عبر التطبيق/المركز وانقل رصيدك لبطاقة بديلة. وإن كانت '
    'مجهولة: رصيدها لحاملها — وهذا نفسه سبب شخصنة بطاقتك إن كنت تشحن مبالغ كبيرة.</p>'
    '<h3>أيّها أوفر لزائرٍ أياماً معدودة؟</h3>'
    '<p>بطاقة مجهولة تشحنها بقدر حاجتك — الاشتراكات لمن يركب يومياً، لا لزيارة '
    'أسبوع.</p>'
)
C_STEPS = [
    'اشترِ Istanbulkart مجهولة من آلات البيع في أي محطة واشحنها — تعمل فوراً.',
    'اركب وبدّل بين الوسائط بالبطاقة نفسها لتستفيد من خصم التبديل تلقائياً.',
    'صرتَ راكباً يومياً؟ شخصِن بطاقتك بهويتك عبر التطبيق الرسمي أو مركز الخدمة.',
    'احسب رحلاتك الشهرية وقارنها بسعر اشتراك Mavi Kart الجاري — وفعّله إن ربح الحساب.',
    'للفئات المخفَّضة (طالب، كبير سن…): اسأل مركز الخدمة عن شروط فئتك ووثائقها.',
    'وللتاكسي: اطلب بالتطبيق للتوثيق، ودع العدّاد يحكم السعر — وارفض «سعراً متفقاً» بلا عدّاد.',
]
C_TIPS = [
    'رمز HES انتهى مع الجائحة — أي شرح يطلبه شرح قديم.',
    'البطاقة المجهولة رصيدها لحاملها — شخصِن بطاقتك إن كنت تشحن كثيراً.',
    'خصم التبديل تلقائي بشرط البطاقة نفسها خلال المهلة.',
    'اشتراك الشهر يُقارَن بحسابك أنت بالأرقام الجارية — لا بقاعدة منقولة.',
    'تأجير الدقيقة يشترط رخصة تركية وبطاقة ائتمان بالاسم نفسه — حوّل رخصتك أولاً.',
    'العدّاد هو السعر في التاكسي — التطبيق يوثّق ولا يفاوض.',
]
C_DOCS = [
    'للبطاقة المجهولة: لا شيء — تُشترى وتُشحن مباشرة',
    'للشخصنة والفئات المخفَّضة: هويتك (كملك/إقامة/جواز) وما تطلبه البلدية لفئتك',
    'لتأجير الدقيقة: رخصة قيادة تركية بالمدة المطلوبة + بطاقة ائتمان بالاسم نفسه',
]
C_FEES = ('التعرفات وأسعار الاشتراكات تتغيّر بقرارات البلدية — لا ننشر أرقاماً تتقادم؛ '
          'التطبيق الرسمي وآلات المحطات تعرض الجاري دائماً. والبطاقة نفسها برسم رمزي '
          'عند الشراء.')
C_WARN = ('لا تشترِ بطاقات «مشحونة» من غير القنوات الرسمية — رصيد البطاقة المجهولة '
          'لحاملها ولا أثر يثبت حقّك. وفي التاكسي: العدّاد لا بديل عنه، و«السعر '
          'المتّفق» مخالفة تخسر بها حماية التعرفة. وشروط خدمات التأجير التجارية '
          'تتغيّر — اقرأ شروط المزوّد قبل كل استخدام.')
C_SOURCE = ('بطاقة İstanbulkart واشتراكاتها لدى بلدية إسطنبول الكبرى (İBB) — التطبيق '
            'الرسمي İstanbulkart ومراكز الخدمة وآلات البيع في المحطات؛ وتعرفة التاكسي '
            'بعدّاد البلدية؛ وشروط مزوّدي التأجير بالدقيقة والسكوترات كلٌّ لدى مزوّده')
C_TAGS = ['المواصلات', 'إسطنبول', 'Istanbulkart', 'Mavi Kart', 'دليل', '2026']
C_SEO_T = 'Istanbulkart وMavi Kart: دليل مواصلات إسطنبول الكامل'
C_SEO_D = ('البطاقة المجهولة والشخصية وخصم التبديل، وحساب متى يوفّر اشتراك Mavi Kart '
           'الشهري فعلاً، ونهاية رمز HES — مع القواعد الثابتة للتاكسي وتأجير الدقائق '
           'والسكوترات بلا أسعار تتقادم.')

# ── the YHT rebuild ──────────────────────────────────────────────────────
Y_TITLE = 'القطارات السريعة YHT في تركيا 2026: الحجز الرسمي، ومطابقة الهوية — وما لا تُغني عنه التذكرة'
Y_INTRO = ('القطار السريع YHT أريح وأرخص طرق التنقّل بين المدن الكبرى — والحجز كلّه عبر '
           'قنوات TCDD الرسمية ببياناتك الحقيقية، فالتذكرة تُطابَق بالهوية عند الصعود. '
           'وهنا التنبيه الذي لا تجده في شروحات التطبيقات: تذكرة القطار لا تُغني حامل '
           'الكملك عن إذن السفر بين الولايات.')
Y_DETAILS = (
    '<div style="background:#eff6ff;border-right:4px solid #3b82f6;padding:14px 18px;margin:0 0 20px;">'
    '<p style="margin:0;"><strong>لحامل الكملك قبل أي حجز:</strong> تذكرة YHT '
    '<strong>لا تُغني عن إذن السفر</strong> بين الولايات — والهويات تُفحص في القطارات. '
    'استخرج إذنك أولاً: <a href="/article/travel-permit">دليل إذن السفر الداخلي: المدد '
    'والشروط</a>، ثم احجز.</p></div>'

    '<h2>الحجز: القنوات الرسمية فقط</h2>'
    '<p>تذاكر YHT تُباع عبر قنوات <span dir="ltr">TCDD Taşımacılık</span> الرسمية: موقع '
    'الحجز الإلكتروني وتطبيقها الرسمي وشبابيك المحطات. أدخل بياناتك كما في هويتك '
    'حرفاً بحرف — <strong>التذكرة اسمية وتُطابَق بالهوية</strong> (كملك أو جواز أو '
    'إقامة) عند الصعود، وخطأ الاسم قد يعني رفض التذكرة.</p>'

    '<h2>ما يرفع حظّك بمقعد</h2>'
    '<ul>'
    '<li><strong>احجز مبكراً</strong>: مواسم الأعياد والعطل تنفد فيها التذاكر سريعاً، '
    'والحجز يفتح قبل السفر بمدة معلنة في القنوات الرسمية.</li>'
    '<li><strong>جرّب مواعيد الأطراف</strong> (الصباح الباكر وآخر الليل) حين تمتلئ '
    'الذروة.</li>'
    '<li><strong>فئات المقاعد</strong> (اقتصادي/أعمال) تظهر بأسعارها الجارية داخل مسار '
    'الحجز — ولا ننشر أرقاماً تتقادم.</li>'
    '<li><strong>الخصومات</strong> (أطفال، فئات عمرية) بشروطها الرسمية داخل النظام — '
    'تُطبَّق آلياً حين تُدخل البيانات الصحيحة.</li>'
    '</ul>'

    '<h2>يوم السفر</h2>'
    '<ul>'
    '<li>هويتك التي حجزت بها <strong>معك</strong> — هي ما يُطابَق بالتذكرة.</li>'
    '<li>احضر قبل الموعد بوقت كافٍ لأمن المحطة.</li>'
    '<li>التعديل والإلغاء بقواعد TCDD المعلنة — كلّما بكّرت قلّ الاقتطاع؛ اقرأ '
    'القاعدة في تذكرتك نفسها.</li>'
    '</ul>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>هل أحجز بجواز السفر أم بالكملك؟</h3>'
    '<p>بأيّ هوية معتمدة تحملها — المهم أن تكون بيانات الحجز مطابقة لها، وأن تحملها '
    'نفسها يوم السفر.</p>'
    '<h3>أنا على الحماية المؤقتة — هل تكفيني التذكرة للسفر إلى ولاية أخرى؟</h3>'
    '<p>لا. التذكرة نقلٌ، والانتقال بين الولايات لحامل الكملك يحتاج '
    '<a href="/article/travel-permit">إذن السفر</a> بغرضه ومدّته — استخرجه قبل الحجز '
    'لا بعده.</p>'
    '<h3>لا أجد تذاكر لموعدي — وسيط يعرض عليّ «تدبيرها»؟</h3>'
    '<p>ارفض. البيع رسمي اسميّ، وتذكرة باسم غيرك مرفوضة عند المطابقة — والوسيط يبيعك '
    'ورقة لا تركب بها.</p>'
)
Y_STEPS = [
    'حامل الكملك: استخرج إذن السفر أولاً — التذكرة لا تُغني عنه.',
    'احجز من قنوات TCDD الرسمية (الموقع/التطبيق/الشباك) ببيانات هويتك حرفاً بحرف.',
    'بكّر في مواسم الأعياد، وجرّب مواعيد الأطراف عند امتلاء الذروة.',
    'يوم السفر: الهوية نفسها معك، واحضر مبكراً لأمن المحطة.',
    'لتعديل أو إلغاء: طبّق قواعد TCDD المعلنة في تذكرتك — التبكير يقلّل الاقتطاع.',
]
Y_TIPS = [
    'التذكرة اسمية وتُطابَق بالهوية — خطأ الاسم = رفض عند الصعود.',
    'تذكرة القطار لا تُغني حامل الكملك عن إذن السفر بين الولايات.',
    'لا تشترِ من وسيط: تذكرة باسم غيرك لا تركب بها.',
    'الأسعار والفئات داخل مسار الحجز الرسمي — لا تعتمد رقماً متداولاً.',
]
Y_DOCS = [
    'هوية سارية (كملك/جواز/إقامة) — نفسها في الحجز ويوم السفر',
    'لحامل الكملك: إذن السفر ساري المفعول لوجهتك',
    'تذكرتك (إلكترونية تكفي) ورمز الحجز',
]
Y_FEES = ('الأسعار بحسب الخط والفئة وتظهر بأرقامها الجارية داخل مسار الحجز الرسمي — لا '
          'ننشر جدولاً يتقادم. والخصومات الرسمية تُطبَّق آلياً ببياناتك الصحيحة.')
Y_WARN = ('التذكرة اسمية والهوية تُفحص. وحامل الكملك يحتاج إذن سفر ساريَ المفعول '
          'للولاية المقصودة قبل الركوب — الغرامة والمساءلة على من سافر بلا إذن، '
          'والتذكرة لا تحميه.')
Y_SOURCE = ('قنوات البيع الرسمية لشركة TCDD Taşımacılık (الموقع الإلكتروني للحجز '
            'والتطبيق الرسمي وشبابيك المحطات)؛ وقواعد إذن السفر لحاملي الحماية المؤقتة '
            'لدى إدارة الهجرة (مفصَّلة في دليل إذن السفر)')
Y_TAGS = ['القطارات', 'YHT', 'السفر بين الولايات', 'المواصلات', 'دليل', '2026']
Y_SEO_T = 'قطارات YHT: الحجز الرسمي ومطابقة الهوية وإذن السفر للكملك'
Y_SEO_D = ('الحجز عبر قنوات TCDD الرسمية ببيانات مطابقة لهويتك — والتنبيه الغائب عن '
           'الشروحات: تذكرة القطار لا تُغني حامل الكملك عن إذن السفر بين الولايات.')

for label, body, needles in [
    ('canonical', C_DETAILS, ['HES', 'Aktarma', 'Mavi Kart', 'license-conversion-arab-countries-2026',
                              'العدّاد', 'Biletmatik']),
    ('yht', Y_DETAILS, ['travel-permit', 'TCDD', 'اسمية', 'لا تُغني']),
]:
    for n in needles:
        assert n in body, 'PREDICATE WOULD LIE: %r not in %s' % (n, label)
for dead in DEAD_CANON + DEAD_CONSUMER:
    assert ('href="/article/%s"' % dead) not in C_DETAILS + Y_DETAILS

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
-- دفعة تطبيقات التنقّل: ثمان قصاصات — خمس تُطوى، وواحدة تُبنى، وواحدة تُحوَّل، وواحدة تُترك
-- ============================================================================
-- * مرجعي جديد istanbulkart-mavi-kart-2026: بطاقتا المواصلات موضوع عام حقيقي
--   (بلدية إسطنبول) لا دليل تطبيق. يطوي نقيضَي البطاقات — ومنهما
--   istanbulkart-hes-code الذي ما زال slug‑ه يحمل رمز HES الجائحي؛ الصفحة
--   تقولها صراحة: انتهى. وتُطوى قصاصات BiTaksi/TikTak/Martı أقساماً صادقة
--   «بالقواعد الثابتة»: العدّاد يحكم سعر التاكسي لا التطبيق، وتأجير الدقيقة
--   يشترط رخصة تركية وبطاقة ائتمان بالاسم نفسه (وهو ما يستبعد أكثر القادمين
--   الجدد — مربوطاً بدليل تحويل الرخصة)، وقواعد السكوتر. بلا أسعار تتقادم.
-- * travel-tcdd-yht-app يُبنى صغيراً: قطار الدولة من صميم هويتنا. القنوات
--   الرسمية، والتذكرة الاسمية، والتمايز الذي لا تجده عند أحد: تذكرة القطار
--   لا تُغني حامل الكملك عن إذن السفر بين الولايات — مربوطاً بدليلنا.
-- * cimri-price-compare (120 حرفاً، تطبيق مقارنة أسعار) يتقاعد إلى دليل
--   حقوق المستهلك — بيته الموضوعي الوحيد.
-- * travel-muzekart تُترك حيّةً عمداً: أهلية المقيم لبطاقة المتاحف تستحق
--   تحقّقاً في دفعة سياحة/ترفيه قادمة، ودفنها خلف 301 غير ذي صلة يدفن
--   سؤالاً حقيقياً. بلوك الفحص يضمن بقاءها.
--
-- الصفوف الثمانية id == slug (فُحص)، ولا روابط واردة لأيٍّ منها.
-- آمن لإعادة التشغيل.
-- ============================================================================

-- 1. مرجعي مواصلات إسطنبول (جديد)
""" + art_sql(CANON, C_TITLE, C_INTRO, C_DETAILS, C_STEPS, C_TIPS, C_DOCS,
              C_FEES, C_WARN, C_SOURCE, C_TAGS, 'السكن والحياة', C_SEO_T, C_SEO_D) + """

-- 2. قطارات YHT (إعادة بناء — id == slug مفحوص)
""" + art_sql(YHT, Y_TITLE, Y_INTRO, Y_DETAILS, Y_STEPS, Y_TIPS, Y_DOCS,
              Y_FEES, Y_WARN, Y_SOURCE, Y_TAGS, 'السكن والحياة', Y_SEO_T, Y_SEO_D) + """

-- 3. التقاعد
UPDATE articles SET status = 'draft', last_update = CURRENT_DATE
WHERE slug IN (%s) AND status = 'approved';

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved'
       AND details LIKE '%%Mavi Kart%%' AND details LIKE '%%HES%%';
    IF n <> 1 THEN RAISE EXCEPTION 'the transport canonical did not land'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug = '%s';
    IF n <> 1 THEN RAISE EXCEPTION 'duplicate slug on the transport canonical'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved' AND details LIKE '%%لا تُغني%%';
    IF n <> 1 THEN RAISE EXCEPTION 'the YHT rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug IN (%s) AND status = 'approved';
    IF n > 0 THEN RAISE EXCEPTION '%% stub(s) still approved', n; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug = 'travel-muzekart' AND status = 'approved';
    IF n <> 1 THEN RAISE EXCEPTION 'muzekart must stay live for the leisure batch'; END IF;
END
$check$;

SELECT 'Istanbul transport canonical live (cards + modes)' AS البند,
       (details LIKE '%%Aktarma%%' AND details LIKE '%%العدّاد%%')::text AS النتيجة
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'YHT rebuilt with the kimlik travel-permit warning',
       (details LIKE '%%لا تُغني%%')::text
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'six stubs retired (want 0 approved)', count(*)::text
FROM articles WHERE slug IN (%s) AND status = 'approved'
UNION ALL
SELECT 'muzekart left live for the leisure batch', status
FROM articles WHERE slug = 'travel-muzekart';
""") % (', '.join("'%s'" % d for d in DEAD_CANON + DEAD_CONSUMER),
        CANON, CANON, YHT, ', '.join("'%s'" % d for d in DEAD_CANON + DEAD_CONSUMER),
        CANON, YHT, ', '.join("'%s'" % d for d in DEAD_CANON + DEAD_CONSUMER))

path = os.path.join(REPO, 'sql', '2026-08-07_transport_cluster.sql')
open(path, 'w', encoding='utf-8', newline='').write(sql)

_code = '\n'.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('المرجعي      : %s (جديد، %d حرفاً) — البطاقتان + أقسام الأنماط الثابتة' % (CANON, len(C_DETAILS)))
print('YHT          : %s — %d ← %d حرفاً (تحذير إذن السفر للكملك)' % (YHT, len(y['details'] or ''), len(Y_DETAILS)))
print('يتقاعد       : %s' % ', '.join(DEAD_CANON + DEAD_CONSUMER))
print('متروكة عمداً : travel-muzekart — لدفعة الترفيه')
print('quote parity :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written      :', path, len(sql), 'chars')
