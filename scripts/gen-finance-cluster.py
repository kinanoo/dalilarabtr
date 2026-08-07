# -*- coding: utf-8 -*-
"""Personal-finance batch: six scraps, three destinations, one deliberate leftover.

── the batch and its shape ────────────────────────────────────────────────

finance-findeks-credit-score  188  3v ─┐ fold as a section into the bank
finance-kkm-status            214  4v ─┘ guide (301 → bank-account-opening)
digital-kep                   181  3v ── fold into e-İmza (301 → digital-e-imza)
digital-e-imza                224  4v ── rebuilt as the e-İmza + KEP page
finance-taxfree-vat-refund    190  3v ── rebuilt (non-residents only)
finance-luxury-property-tax   185  3v ── LEFT LIVE on purpose: Değerli Konut
                                         Vergisi belongs to a future property
                                         batch with syrian-property-ownership;
                                         parking it behind an unrelated 301
                                         would bury a real topic.

All six rows id == slug (checked live); none has inbound links.

── verified before writing ───────────────────────────────────────────────

* KKM is over — from TCMB's own announcements: new openings and renewals for
  individuals ended 23 August 2025 (corporates 15 February 2025); existing
  accounts run to their maturity and close, no renewal. The stub asked «هل
  ما زالت متاحة؟» and told readers to ask their bank — the honest answer now
  has a date, so the question retires into the bank guide with the answer.
* e-İmza: the qualified electronic signature has the legal force of a wet
  signature under Law 5070, sold only by BTK-authorized providers (ESHS)
  with identity-verified delivery. KEP is the registered-email sibling:
  legally evidential send/receive proof via authorized providers (PTT among
  them). Two tools, one page — they are bought and used together, and
  neither is something most individuals need (the page says who does).
* Tax-Free: for NON-residents only; the shop must be an authorized tax-free
  retailer issuing the refund form; goods must leave Turkey within three
  months (KDV law, art. 11/1-b) and be stamped by customs BEFORE check-in,
  unused; the per-invoice minimum is set by regulation and updated — the
  page teaches the mechanism and says ask the shop for the current floor,
  publishing no number. TP holders and residents are excluded and the page
  says so up top.
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


BANK = 'bank-account-opening'
EIMZA = 'digital-e-imza'
TAXFREE = 'finance-taxfree-vat-refund'
DEAD_BANK = ['finance-findeks-credit-score', 'finance-kkm-status']
DEAD_KEP = ['digital-kep']

b = get('articles?select=status,details&slug=eq.' + BANK)[0]
assert b['status'] == 'approved' and 'Findeks' not in b['details'], 'bank already enriched'
ei = get('articles?select=id,slug,status,details&slug=eq.' + EIMZA)[0]
assert ei['status'] == 'approved' and ei['id'] == ei['slug'] and len(ei['details'] or '') < 1500
tf = get('articles?select=id,slug,status,details&slug=eq.' + TAXFREE)[0]
assert tf['status'] == 'approved' and tf['id'] == tf['slug'] and len(tf['details'] or '') < 1500
for d in DEAD_BANK + DEAD_KEP:
    r = get('articles?select=id,slug,status&slug=eq.' + d)
    assert r and r[0]['status'] == 'approved' and r[0]['id'] == r[0]['slug'], d
lux = get('articles?select=status&slug=eq.finance-luxury-property-tax')[0]
assert lux['status'] == 'approved', 'luxury-tax page should stay live for the property batch'

# ── 1. bank guide: Findeks + the KKM answer (guarded append) ─────────────
BANK_ADD = (
    '<h2>بعد فتح الحساب: سجلّك الائتماني (Findeks)</h2>'
    '<p>تعاملك البنكي كلّه يتجمّع في سجلّ ائتماني لدى مكتب السجلّ الائتماني، ودرجته '
    '(المعروفة باسم <span dir="ltr">Findeks</span>) هي ما ينظر إليه البنك حين تطلب بطاقةً '
    'أو قرضاً لاحقاً. القواعد بسيطة وبطيئة المفعول:</p>'
    '<ul>'
    '<li><strong>ادفع في الموعد</strong> — فواتير وأقساطاً وبطاقة؛ التأخير يُسجَّل ويبقى.</li>'
    '<li><strong>استخدام معتدل للبطاقة</strong> — سقفٌ مستهلَك دائماً بالكامل يقرأ سلبياً.</li>'
    '<li><strong>الوقت</strong> — سجلٌّ قصير بلا تاريخ يُقرأ حذراً؛ ابدأ صغيراً وبكّر.</li>'
    '</ul>'
    '<p>وتستطيع الاطّلاع على درجتك بنفسك عبر تطبيق Findeks أو من بنكك — اعرف رقمك قبل أن '
    'تطلب قرضاً، لا بعد الرفض.</p>'

    '<h2>وسؤال يتكرّر: حسابات KKM «المحمية من الصرف»؟ انتهت</h2>'
    '<p>نظام الوديعة المحمية من تقلّب الصرف (<span dir="ltr">KKM</span>) '
    '<strong>أُغلق أمام الفتح والتجديد</strong>: قرّر البنك المركزي إنهاء فتح وتجديد حسابات '
    'الأفراد اعتباراً من <strong>23 آب/أغسطس 2025</strong> (وحسابات الشركات قبلها في 15 '
    'شباط/فبراير 2025). الحسابات القائمة تجري حتى استحقاقها ثم تُغلق بلا تجديد. فمن يعرض '
    'عليك اليوم «فتح KKM» يعرض ما لم يعد موجوداً — وودائعك خياراتها الاعتيادية: بالليرة أو '
    'بالعملة الصعبة بحسب عرض بنكك.</p>'
)

# ── 2. e-İmza + KEP page ─────────────────────────────────────────────────
EI_TITLE = 'التوقيع الإلكتروني (e-İmza) وKEP في تركيا 2026: من يحتاجهما فعلاً، ومن أين يُشتريان'
EI_INTRO = ('أداتان تتردّدان في المعاملات الرسمية التركية: التوقيع الإلكتروني المؤهَّل '
            '(e-İmza) الذي يعادل توقيعك بالقلم قانوناً بموجب القانون 5070، وKEP — البريد '
            'الإلكتروني المسجَّل الذي يُنشئ إثبات إرسال واستلام معتمداً. أكثر الأفراد لا '
            'يحتاجون أيّاً منهما — وأصحاب الشركات والمعاملات الرسمية الكثيفة يحتاجونهما '
            'معاً غالباً. هذا الدليل يفصل من يحتاج ماذا، ومن أين تشتري، وممّا تحذر.')
EI_DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الخلاصة</strong></p>'
    '<p style="margin:0;"><strong>e-İmza</strong> = توقيعك بالقلم لكن رقمياً، بقوّة قانونية '
    'كاملة (القانون 5070). <strong>KEP</strong> = بريد إلكتروني رسمي يثبت الإرسال والاستلام. '
    'كلاهما يُشترى فقط من مزوّدين معتمدين لدى هيئة الاتصالات BTK، وبتحقّق هوية حضوري أو '
    'مكافئ له. ومعظم الأفراد لا يحتاجون أيّاً منهما.</p></div>'

    '<h2>التوقيع الإلكتروني المؤهَّل (e-İmza)</h2>'
    '<p>بموجب قانون التوقيع الإلكتروني رقم 5070، التوقيع الإلكتروني <strong>المؤهَّل</strong> '
    'يعادل التوقيع اليدوي في أثره القانوني. يصدر على شريحة/قرص USB أو بطاقة، '
    '<strong>حصراً من مزوّدي خدمات التصديق المعتمدين لدى BTK</strong> (قائمة المزوّدين '
    'المعتمدين منشورة على موقع الهيئة btk.gov.tr) — وبإجراء تسليم يتحقّق من هويتك.</p>'
    '<p><strong>من يحتاجه فعلاً؟</strong></p>'
    '<ul>'
    '<li>أصحاب الشركات ومديروها: تأسيس وتعديلات وإقرارات إلكترونية.</li>'
    '<li>المتعاملون مع أنظمة حكومية تشترطه (مناقصات، بوّابات مهنية، أنظمة قطاعية).</li>'
    '<li>من يوقّع عقوداً رقمية تتطلّب المستوى المؤهَّل.</li>'
    '</ul>'
    '<p>أمّا معاملات e-Devlet الاعتيادية للأفراد فتتمّ بكلمة المرور والتحقّق العادي — '
    '<strong>لا تشترِ e-İmza لأنّ أحداً «نصحك» به بلا معاملة تتطلّبه</strong>.</p>'

    '<h2>البريد المسجَّل KEP</h2>'
    '<p><span dir="ltr">KEP</span> (<span dir="ltr">Kayıtlı Elektronik Posta</span>) بريد '
    'إلكتروني ذو حجّية قانونية: كل إرسال واستلام فيه موثَّق بختم زمني يُحتجّ به. يُفتح لدى '
    'مزوّدي KEP المعتمدين (وPTT منهم) بتحقّق هوية، وتستعمله الشركات في المراسلات الرسمية '
    'والإخطارات بين الشركات وموثَّقة التاريخ.</p>'
    '<p><strong>وتنبيه دقيق:</strong> KEP غير بريدك العادي وغير أنظمة التبليغ القضائي '
    'الإلكتروني — لكلٍّ نظامه. إن طُلب منك «عنوان KEP» في معاملة شركة فهذا هو؛ وإن كان '
    'المطلوب تبليغات جهة قضائية فاسأل عن نظامها هي.</p>'

    '<h2>كيف تشتري — والفخّ الوحيد</h2>'
    '<ol>'
    '<li>اختر مزوّداً <strong>من قائمة BTK المعتمدة</strong> (للتوقيع) أو مزوّد KEP '
    'معتمداً (للبريد) — القائمتان منشورتان على موقع الهيئة.</li>'
    '<li>قدّم الطلب بهويتك (جواز/كملك/إقامة بحسب المزوّد) وأتمّ التحقّق الحضوري أو '
    'المعتمد.</li>'
    '<li>استلم الأداة وفعّلها، واحفظ رمزها — <strong>توقيعك المؤهَّل يلزمك قانوناً '
    'كتوقيع يدك</strong>: لا تُعِر الأداة أحداً ولا تشارك رمزها.</li>'
    '</ol>'
    '<p>والفخّ: وسطاء يبيعون «توقيعاً إلكترونياً» من خارج القائمة المعتمدة أو '
    'بأسعار مضاعفة. الشراء مباشر من المزوّدين المعتمدين، وأسعارهم معلنة عندهم.</p>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>هل أحتاج e-İmza لفتح شركة؟</h3>'
    '<p>معاملات الشركات الإلكترونية تتطلّبه في مواضع عدّة، والمحاسب الذي يؤسّس لك '
    'سيحدّد المطلوب في حالتك — راجع '
    '<a href="/article/open-company-turkey-2026">دليل فتح شركة في تركيا</a>.</p>'
    '<h3>هل يعمل بجواز أجنبي أم يلزم رقم تركي؟</h3>'
    '<p>المزوّدون يتحقّقون من الهوية ويربطون الشهادة برقمك التعريفي — ومتطلّبات الأجانب '
    'تختلف بين مزوّد وآخر؛ اسأل المزوّد المعتمد مباشرةً قبل الدفع.</p>'
    '<h3>ما مدّة الصلاحية؟</h3>'
    '<p>الشهادات تصدر بمدد اشتراك (سنة إلى ثلاث عادةً) ثم تُجدَّد لدى المزوّد نفسه — '
    'والتجديد أرخص من إصدار جديد غالباً.</p>'
)
EI_STEPS = [
    'حدّد أولاً هل معاملتك تتطلّب e-İmza أو KEP أصلاً — أكثر الأفراد لا يحتاجون أيّاً منهما.',
    'افتح قائمة المزوّدين المعتمدين على موقع BTK واختر منها حصراً.',
    'قدّم الطلب بهويتك وأتمّ تحقّق الهوية المطلوب.',
    'استلم الأداة/الحساب وفعّله، واحفظ الرموز — ولا تشاركها مع أحد.',
    'جدّد قبل الانتهاء لدى المزوّد نفسه.',
]
EI_TIPS = [
    'e-İmza المؤهَّل = توقيع يدك قانوناً (القانون 5070) — تعامل مع أداته كما تتعامل مع توقيعك.',
    'الشراء من قائمة BTK المعتمدة حصراً — الوسطاء خارجها فخّ سعرٍ وفخّ صلاحية.',
    'KEP للمراسلات الموثَّقة وليس بديل بريدك العادي — ولا تخلطه بأنظمة التبليغ القضائي.',
    'معاملات e-Devlet العادية لا تحتاج e-İmza — لا تشترِ ما لا تتطلّبه معاملة بعينها.',
    'متطلّبات الأجانب تختلف بين المزوّدين — اسأل قبل الدفع.',
]
EI_DOCS = [
    'هوية سارية (جواز/كملك/بطاقة إقامة) بحسب متطلّبات المزوّد',
    'رقم تعريفي (تركي أو أجنبي 99…) لربط الشهادة',
    'لمعاملات الشركات: أوراق الشركة التي يحدّدها محاسبك',
]
EI_FEES = ('الأسعار معلنة لدى المزوّدين المعتمدين وتختلف بالمدة والأداة — قارن بين مزوّدي '
           'قائمة BTK مباشرةً، ولا تدفع لوسيط خارجها سعراً مضاعفاً لخدمة معلنة السعر.')
EI_WARN = ('توقيعك المؤهَّل مُلزم كتوقيع يدك: لا تُعِر الأداة ولا تشارك الرمز أبداً. '
           'والشراء من خارج قائمة المزوّدين المعتمدين قد يعني شهادة بلا اعتماد. '
           'ولا تشترِ ما لا تتطلّبه معاملة محدّدة بيدك.')
EI_SOURCE = ('قانون التوقيع الإلكتروني رقم 5070 (التوقيع المؤهَّل يعادل اليدوي)؛ وقوائم '
             'مزوّدي خدمات التصديق الإلكتروني (ESHS) ومزوّدي KEP المعتمدين لدى هيئة '
             'المعلومات والاتصالات BTK (btk.gov.tr)؛ وخدمة KEP لدى PTT')
EI_TAGS = ['e-İmza', 'KEP', 'معاملات رسمية', 'الشركات', 'دليل', '2026']
EI_SEO_T = 'e-İmza وKEP في تركيا: من يحتاجهما ومن أين تشتري'
EI_SEO_D = ('التوقيع الإلكتروني المؤهَّل يعادل توقيع اليد (قانون 5070) ويُشترى من معتمدي '
            'BTK حصراً، وKEP بريد بحجّية قانونية — من يحتاجهما فعلاً، وخطوات الشراء، '
            'وفخّ الوسطاء. أكثر الأفراد لا يحتاجون أيّاً منهما.')

# ── 3. Tax-Free rebuild ──────────────────────────────────────────────────
TF_TITLE = 'التسوّق Tax-Free في تركيا 2026: استرداد الضريبة لغير المقيمين — الشروط والختم قبل الشحن'
TF_INTRO = ('تشتري من تركيا وتخرج بها؟ إن كنت غير مقيم فبإمكانك استرداد ضريبة القيمة '
            'المضافة على مشترياتك — بشروط يفشل فيها كثيرون في المطار: المتجر يجب أن يكون '
            'معتمداً لنظام الاسترداد، والبضاعة تغادر تركيا خلال ثلاثة أشهر غير مستعملة، '
            'وختم الجمارك يجب أن يتمّ قبل تسليم الحقائب لا بعده. وهذه الصفحة لغير المقيمين '
            'حصراً — المقيم وحامل الكملك خارج النظام أصلاً.')
TF_DETAILS = (
    '<div style="background:#eff6ff;border-right:4px solid #3b82f6;padding:14px 18px;margin:0 0 20px;">'
    '<p style="margin:0;"><strong>لمن هذا النظام؟</strong> لغير المقيمين في تركيا فقط. '
    'المقيم بإقامة، وحامل الكملك، ومن مركز حياته هنا — <strong>خارج النظام</strong>: '
    'الاسترداد مبنيّ على أنّ البضاعة تُصدَّر مع مسافر غير مقيم.</p></div>'

    '<h2>كيف يعمل — أربع محطّات</h2>'
    '<ol>'
    '<li><strong>في المتجر:</strong> ليس كل متجر مؤهّلاً — اسأل قبل الدفع: '
    '<span dir="ltr">Tax Free?</span> المتجر المعتمد في نظام الاسترداد يُصدر لك مع '
    'الفاتورة <strong>نموذج الاسترداد</strong> ببيانات جوازك. بلا هذا النموذج من المتجر '
    'نفسه لا استرداد لاحقاً مهما فعلت.</li>'
    '<li><strong>حدّ أدنى للفاتورة:</strong> يوجد حدّ أدنى لقيمة الفاتورة الواحدة يقرّره '
    'النظام ويُحدَّث دورياً — اسأل المتجر عن الحدّ الجاري، ولا تعتمد رقماً قرأته في '
    'صفحة قديمة.</li>'
    '<li><strong>في المطار — قبل تسليم الحقائب:</strong> اعرض البضاعة <strong>غير '
    'مستعملة</strong> مع النموذج والفاتورة والجواز على الجمارك للختم. '
    '<strong>الترتيب هو ما يُفشل الناس</strong>: من يسلّم حقيبته أولاً ثم يراجع الجمارك '
    'فقد أضاع استرداده — البضاعة يجب أن تكون معك للمعاينة.</li>'
    '<li><strong>القبض:</strong> بعد الختم تقبض عبر قنوات مشغّل الاسترداد — نقداً في '
    'مكاتب المطار أو على بطاقتك لاحقاً بحسب المشغّل المذكور في نموذجك.</li>'
    '</ol>'

    '<h2>قاعدة الأشهر الثلاثة</h2>'
    '<p>قانون ضريبة القيمة المضافة يشترط خروج البضاعة من تركيا خلال '
    '<strong>ثلاثة أشهر</strong> من الشراء (المادة 11/1-ب) — اشتريتَ ثم أجّلت سفرك أبعد '
    'من ذلك؟ سقط الاسترداد لتلك الفاتورة.</p>'

    '<h2>ما الذي لا يُستردّ؟</h2>'
    '<ul>'
    '<li>الخدمات كلّها: فنادق، مطاعم، علاج، تذاكر — الاسترداد <strong>للسلع</strong> '
    'المصدَّرة معك فقط.</li>'
    '<li>ما استُعمل قبل الخروج — البضاعة تُعرض بحالتها.</li>'
    '<li>فواتير دون الحدّ الأدنى الجاري.</li>'
    '<li>مشتريات من متاجر غير معتمدة في النظام.</li>'
    '</ul>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>أنا سوري بكملك وسأزور بلداً وأعود — هل أستفيد؟</h3>'
    '<p>لا. النظام لغير المقيمين، وأنت مقيم. وكذلك حامل الإقامة بأنواعها.</p>'
    '<h3>نسيت الختم وخرجت — هل أستدرك؟</h3>'
    '<p>عملياً لا: الختم الجمركي عند الخروج هو قلب الإجراء، وبدونه لا يصرف المشغّل '
    'شيئاً. الدرس لرحلتك التالية: الجمارك قبل الحقائب.</p>'
    '<h3>كم يصلني من الضريبة؟</h3>'
    '<p>أقلّ من نسبة الضريبة الاسمية — فمشغّل الاسترداد يقتطع عمولته. النسبة الصافية '
    'تظهر في نموذجك؛ اقرأها قبل أن تبني حساباتك عليها.</p>'
)
TF_STEPS = [
    'تأكّد أنّك غير مقيم — النظام لا يشمل المقيمين وحاملي الكملك.',
    'اسأل المتجر قبل الدفع: هل هو معتمد Tax-Free؟ وما الحدّ الأدنى الجاري للفاتورة؟',
    'استلم نموذج الاسترداد مع الفاتورة ببيانات جوازك — من المتجر نفسه وقت الشراء.',
    'في المطار: راجع الجمارك بالبضاعة غير المستعملة والنموذج والجواز قبل تسليم الحقائب.',
    'بعد الختم: اقبض عبر قناة المشغّل (نقداً في مكتبه أو على بطاقتك).',
    'وخطّط لخروج البضاعة خلال ثلاثة أشهر من الشراء — بعدها يسقط الحقّ.',
]
TF_TIPS = [
    'الترتيب في المطار هو كل شيء: الجمارك والختم قبل تسليم الحقائب — لا بعده.',
    'النموذج يصدر من المتجر وقت الشراء — لا يُستخرج لاحقاً بأثر رجعي.',
    'الحدّ الأدنى للفاتورة يُحدَّث دورياً — اسأل المتجر ولا تعتمد رقماً متداولاً.',
    'الخدمات لا تُستردّ — سلعٌ مصدَّرة معك فقط.',
    'الصافي أقل من نسبة الضريبة — للمشغّل عمولة تظهر في نموذجك.',
]
TF_DOCS = [
    'جواز السفر (به يُحرَّر نموذج الاسترداد في المتجر)',
    'نموذج الاسترداد + الفاتورة الأصلية',
    'البضاعة نفسها غير مستعملة لمعاينة الجمارك',
    'بطاقتك البنكية إن اخترت الاسترداد عليها',
]
TF_FEES = ('الاسترداد نفسه بلا رسم عليك — لكنّ مشغّل النظام يقتطع عمولة فيصلك أقلّ من نسبة '
           'الضريبة الاسمية؛ الصافي مذكور في نموذجك. والحدّ الأدنى للفاتورة يقرّره النظام '
           'ويُحدَّث — اسأل المتجر عن الجاري.')
TF_WARN = ('النظام لغير المقيمين حصراً. والختم الجمركي قبل تسليم الحقائب — الترتيب المعكوس '
           'يُسقط الاسترداد. والبضاعة تخرج خلال ثلاثة أشهر من الشراء غير مستعملة. '
           'ولا استدراك بعد الخروج بلا ختم.')
TF_SOURCE = ('قانون ضريبة القيمة المضافة رقم 3065 — المادة 11/1-ب (بيع السلع للمسافرين غير '
             'المقيمين وشرط إخراجها خلال ثلاثة أشهر بتأشير الجمارك)؛ ونظام البائع المعتمد '
             'ونموذج الاسترداد لدى مشغّلي الاسترداد المرخَّصين')
TF_TAGS = ['Tax Free', 'استرداد الضريبة', 'التسوق', 'غير المقيمين', 'دليل', '2026']
TF_SEO_T = 'Tax-Free تركيا لغير المقيمين: الختم قبل الحقائب وقاعدة 3 أشهر'
TF_SEO_D = ('استرداد ضريبة المشتريات لغير المقيمين: متجر معتمد ونموذج وقت الشراء، وختم '
            'الجمارك قبل تسليم الحقائب — الترتيب المعكوس يُسقط الحق — وخروج البضاعة خلال '
            '3 أشهر. المقيم وحامل الكملك خارج النظام.')

for label, body, needles in [
    ('bank add', BANK_ADD, ['Findeks', '23 آب/أغسطس 2025', '15 شباط/فبراير 2025']),
    ('eimza', EI_DETAILS, ['5070', 'BTK', 'KEP', 'open-company-turkey-2026', 'لا تشارك']),
    ('taxfree', TF_DETAILS, ['ثلاثة أشهر', '11/1-ب', 'قبل تسليم الحقائب', 'غير المقيمين']),
]:
    for n in needles:
        assert n in body, 'PREDICATE WOULD LIE: %r not in %s' % (n, label)
r = get('articles?select=status&slug=eq.open-company-turkey-2026')
assert r and r[0]['status'] == 'approved', 'open-company link target not live'
for dead in DEAD_BANK + DEAD_KEP:
    assert ('href="/article/%s"' % dead) not in BANK_ADD + EI_DETAILS + TF_DETAILS

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
-- دفعة المال الشخصي: ستّ قصاصات، ثلاث وجهات، ومتروكة واحدة عمداً
-- ============================================================================
-- * Findeks وKKM يُطويان قسمين في دليل البنوك (301 ← bank-account-opening).
--   وجواب KKM صار بتاريخ من المركزي نفسه: فتح وتجديد حسابات الأفراد انتهى
--   في 23/08/2025 (والشركات 15/02/2025)، والقائم يجري حتى استحقاقه.
-- * digital-e-imza يُعاد بناؤه صفحةَ e-İmza + KEP معاً (يُشتريان ويُستعملان
--   معاً، وكلاهما من معتمدي BTK حصراً — القانون 5070) ويتقاعد digital-kep
--   إليه.
-- * finance-taxfree-vat-refund يُعاد بناؤه لغير المقيمين حصراً: متجر معتمد،
--   ونموذج وقت الشراء، وختم الجمارك قبل تسليم الحقائب، وقاعدة الأشهر
--   الثلاثة (م11/1-ب) — وبلا حدٍّ أدنى منشور لأنّه يُحدَّث دورياً.
-- * finance-luxury-property-tax تُترك حيّةً عمداً: ضريبة السكن الفاخر
--   موضوع دفعة العقارات القادمة مع syrian-property-ownership — ودفنها خلف
--   301 غير ذي صلة يدفن موضوعاً حقيقياً.
--
-- الصفوف الستة id == slug (فُحص)، ولا روابط واردة لأيٍّ من المتقاعدة.
-- آمن لإعادة التشغيل.
-- ============================================================================

-- 1. دليل البنوك += Findeks + جواب KKM (محروس)
UPDATE articles SET
    details = details || '%s',
    last_update = CURRENT_DATE
WHERE slug = '%s' AND details NOT LIKE '%%Findeks%%';

-- 2. صفحة e-İmza + KEP (id == slug مفحوص، فالـupsert آمن)
""" + art_sql(EIMZA, EI_TITLE, EI_INTRO, EI_DETAILS, EI_STEPS, EI_TIPS, EI_DOCS,
              EI_FEES, EI_WARN, EI_SOURCE, EI_TAGS, 'معاملات رسمية', EI_SEO_T, EI_SEO_D) + """

-- 3. Tax-Free لغير المقيمين
""" + art_sql(TAXFREE, TF_TITLE, TF_INTRO, TF_DETAILS, TF_STEPS, TF_TIPS, TF_DOCS,
              TF_FEES, TF_WARN, TF_SOURCE, TF_TAGS, 'السكن والحياة', TF_SEO_T, TF_SEO_D) + """

-- 4. التقاعد
UPDATE articles SET status = 'draft', last_update = CURRENT_DATE
WHERE slug IN (%s) AND status = 'approved';

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved'
       AND details LIKE '%%Findeks%%' AND details LIKE '%%23 آب/أغسطس 2025%%';
    IF n <> 1 THEN RAISE EXCEPTION 'the bank enrichment did not land'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved' AND details LIKE '%%5070%%' AND details LIKE '%%KEP%%';
    IF n <> 1 THEN RAISE EXCEPTION 'the e-imza rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved' AND details LIKE '%%11/1-ب%%';
    IF n <> 1 THEN RAISE EXCEPTION 'the taxfree rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug IN (%s) AND status = 'approved';
    IF n > 0 THEN RAISE EXCEPTION '%% stub(s) still approved', n; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = 'finance-luxury-property-tax' AND status = 'approved';
    IF n <> 1 THEN RAISE EXCEPTION 'luxury-tax page must stay live for the property batch'; END IF;
END
$check$;

SELECT 'bank guide: Findeks + KKM ended (dated from TCMB)' AS البند,
       (details LIKE '%%Findeks%%' AND details LIKE '%%23 آب/أغسطس 2025%%')::text AS النتيجة
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'e-İmza + KEP page live (law 5070, BTK-only)', (details LIKE '%%5070%%')::text
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'Tax-Free rebuilt (customs before check-in, 3-month rule)',
       (details LIKE '%%قبل تسليم الحقائب%%')::text
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'three stubs retired (want 0 approved)', count(*)::text
FROM articles WHERE slug IN (%s) AND status = 'approved'
UNION ALL
SELECT 'luxury-tax left live for the property batch', status
FROM articles WHERE slug = 'finance-luxury-property-tax';
""") % (q(BANK_ADD), BANK,
        ', '.join("'%s'" % d for d in DEAD_BANK + DEAD_KEP),
        BANK, EIMZA, TAXFREE, ', '.join("'%s'" % d for d in DEAD_BANK + DEAD_KEP),
        BANK, EIMZA, TAXFREE, ', '.join("'%s'" % d for d in DEAD_BANK + DEAD_KEP))

path = os.path.join(REPO, 'sql', '2026-08-07_finance_cluster.sql')
open(path, 'w', encoding='utf-8', newline='').write(sql)

_code = '\n'.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('دليل البنوك  : += Findeks + نهاية KKM بتاريخ المركزي (%d حرفاً)' % len(BANK_ADD))
print('e-İmza + KEP : %s — %d ← %d حرفاً؛ يتقاعد digital-kep' % (EIMZA, len(ei['details'] or ''), len(EI_DETAILS)))
print('Tax-Free     : %s — %d ← %d حرفاً (لغير المقيمين حصراً)' % (TAXFREE, len(tf['details'] or ''), len(TF_DETAILS)))
print('يتقاعد       : %s' % ', '.join(DEAD_BANK + DEAD_KEP))
print('متروكة عمداً : finance-luxury-property-tax — لدفعة العقارات')
print('quote parity :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written      :', path, len(sql), 'chars')
