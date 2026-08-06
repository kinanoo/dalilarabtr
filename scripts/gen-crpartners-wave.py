# -*- coding: utf-8 -*-
"""Three gaps from the crpartners demand map — verified, then written our way.

The owner sent crpartners.av.tr's publications index (8 articles, 2026 and
late 2025) to cover on our site. Mapping them against our corpus:

  SKIPPED — ours is already stronger:
    * deportation 7-day guide      → deportation-rights (35K chars, the 7-day
                                     deadline pinned from law 7533 by us first)
    * G-99 code                    → the audited security_codes row is honest
                                     («لا يوجد تعريف رسمي منشور له») and bilingual
    * "2026 migration law changes" → roundup pages rot; the 7533 changes already
                                     live where they matter
    * work visa 2026               → turkey-work-visa-guide covers it; gets a
                                     cross-link to the new transition page
    * address proof                → folded into the bank guide (address is the
                                     top refusal cause) + existing address pages

  BUILT — real gaps:
    A. Bank account cluster: three stubs (121 + 174 + 325 chars), one of which
       told foreigners they need a «رقم TC». Verified the real mechanism:
       GİB's «Yabancılar İçin Potansiyel Vergi Kimlik Numarası» — free, online
       at dijital.gib.gov.tr/foreigners/kimlikNoBasvuru with a passport photo
       upload, or in person at any tax office (İstanbul Göç İdaresi publishes
       the same instructions). Rebuilt as one canonical; two stubs retire.
       Refused from the old stub: «البنوك المفضلة: Ziraat, Vakıf Katılım,
       Kuveyt Türk» — favouritism no one can verify and policies shift; kept
       instead the honest branch-discretion + written-refusal-reason strategy.
    B. humanitarian-residence: 323-char stub. Rebuilt on Law 6458 arts 46-47
       as amended: the (a)-(e) grant cases, valilik issues with Genel Müdürlük
       approval, ministry-set durations (NOT a fixed year — the fixed-year
       wording predates amendment), the 20-workday address duty (46/2), and
       art 42/2: humanitarian residence NEVER leads to long-term residence —
       the fact nobody tells people.
    C. Tourist residence → work permit: no page covered the transition. The
       official goc.gov.tr FAQ states, verbatim: «Yurt içi çalışma izni
       başvurularında yabancıya ait en az altı ay geçerli bir ikamet izninin
       bulunması gerekir» — and «Çalışma izni ... 6458 sayılı Kanun'un 27'nci
       maddesi uyarınca ikamet izni yerine geçer». What the official FAQ does
       NOT say is that tourist permits are excluded by name — law-firm pages
       assert it, the FAQ does not. We write exactly that boundary instead of
       laundering the firms' claim.

No replace() needles this time — the three content pages are full-column
rewrites and the cross-links are guarded appends, so CRLF in live rows cannot
bite. File still written newline='' on principle.
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


TRANSIT = 'tourist-to-work-permit-2026'

# ── preconditions ─────────────────────────────────────────────────────────
assert not get('articles?select=slug&slug=eq.' + TRANSIT), 'transition article exists'
bank = get('articles?select=details,views&slug=eq.bank-account-opening')[0]
assert len(bank['details'] or '') < 1000, 'bank page already rebuilt'
hum = get('articles?select=details&slug=eq.humanitarian-residence')[0]
assert len(hum['details'] or '') < 1000, 'humanitarian page already rebuilt'
for s in ('bank-account-documents', 'kimlik-bank-sim', 'work-permit-turkey-2026',
          'turkey-work-visa-guide', 'tourist-residence-renewal-turkey-2026',
          'kimlik-data-update', 'syrian-address-update-mandate-turkey',
          'foreigner-minimum-salary-2026', 'syria-work-permit-exemption-turkey-2026-07',
          'residence-rejection-appeal-turkey-2026', 'deportation-rights'):
    r = get('articles?select=status&slug=eq.' + s)
    assert r and r[0]['status'] == 'approved', s + ' not live'

# ═══════════════════════════════ A. BANK ═════════════════════════════════
BANK_TITLE = 'فتح حساب بنكي في تركيا للأجانب والسوريين 2026: الرقم الضريبي مجاناً، والأوراق، وسبب الرفض الأول'
BANK_INTRO = ('فتح الحساب البنكي متاح قانوناً للأجانب في تركيا، لكنّ الممارسة صارت أدقّ: البنوك '
              'تُعمل سياسات تحقّق متشدّدة، والفرع قد يرفض ما يقبله فرع آخر. هذا الدليل يعطيك '
              'المسار الصحيح: الرقم الضريبي تستخرجه مجاناً بنفسك أونلاين خلال دقائق، وإثبات '
              'العنوان هو سبب الرفض الأول فجهّزه قبل أي شيء، وإن رُفضت فاطلب السبب مكتوباً '
              'وجرّب فرعاً أو بنكاً آخر.')
BANK_DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الخلاصة</strong></p>'
    '<p style="margin:0;">تحتاج ثلاثة أشياء: <strong>هوية</strong> (جواز أو كملك أو إقامة)، '
    'و<strong>رقماً ضريبياً</strong> — وهو مجاني وتستخرجه أونلاين بنفسك — '
    'و<strong>إثبات عنوان</strong>. والثالث هو ما يُسقط أكثر الطلبات، لا الأوّلان.</p></div>'

    '<h2>الرقم الضريبي: مجاني، أونلاين، خلال دقائق — ولا وسيط</h2>'
    '<p>من ليس له رقم هوية أجنبي يستخرج <strong>«الرقم الضريبي المحتمل للأجانب»</strong> '
    '(<span dir="ltr">Yabancılar İçin Potansiyel Vergi Kimlik Numarası</span>) بإحدى طريقتين:</p>'
    '<ol>'
    '<li><strong>أونلاين</strong> من بوّابة مصلحة الضرائب: '
    '<span dir="ltr">dijital.gib.gov.tr</span> ← خدمة طلب رقم الهوية للأجانب — تعبّئ النموذج '
    'وترفع <strong>صورة صفحة بيانات جوازك</strong> ويصلك الرقم. بلا حساب مسبق وبلا رسم.</li>'
    '<li><strong>حضورياً</strong> في أي مديرية ضرائب (Vergi Dairesi): جواز السفر الأصلي مع '
    'صورة عن صفحة البيانات وطلب خطّي بسيط.</li>'
    '</ol>'
    '<p>وإن كان معك <strong>رقم هوية أجنبي يبدأ بـ99</strong> (كملك أو إقامة) فهو يقوم مقام '
    'الرقم الضريبي في أنظمة أكثر الجهات — قدّمه أوّلاً، ولا تستخرج رقماً منفصلاً إلا إن طلبه '
    'البنك صراحةً.</p>'
    '<div style="background:#fee2e2;border-right:4px solid #dc2626;padding:14px 18px;margin:18px 0;">'
    '<p style="margin:0;">كلّ من يعرض عليك «استخراج الرقم الضريبي» بمقابل يبيعك خدمة مجانية. '
    'الخدمة رسمية ومباشرة ولا تحتاج وسيطاً ولا تكلّف ليرة واحدة.</p></div>'

    '<h2>إثبات العنوان — سبب الرفض الأول</h2>'
    '<p>أكثر الطلبات تسقط هنا: عنوان غير مسجَّل، أو بيانات لا تطابق الهوية. جهّز واحداً من:</p>'
    '<ul>'
    '<li><strong>وثيقة العنوان</strong> (<span dir="ltr">Yerleşim Yeri Belgesi</span>) من '
    'e-Devlet مجاناً — أقوى إثبات، وتتطلّب أن يكون عنوانك مسجَّلاً فعلاً في النفوس. '
    'إن لم يكن مسجَّلاً فابدأ من '
    '<a href="/article/kimlik-data-update">تحديث بيانات الكملك والعنوان</a>.</li>'
    '<li><strong>فاتورة خدمات حديثة باسمك</strong> (كهرباء/ماء/غاز/إنترنت) — تقبلها بنوك '
    'كثيرة بديلاً أو مكمّلاً.</li>'
    '</ul>'
    '<p>وتذكّر أنّ تسجيل العنوان أصلاً واجب قانوني بمهلة — تفصيله في '
    '<a href="/article/syrian-address-update-mandate-turkey">تحديث العنوان الإجباري</a>.</p>'

    '<h2>الأوراق التي تطلبها البنوك عادةً</h2>'
    '<table><thead><tr><th>الورقة</th><th>ملاحظة</th></tr></thead><tbody>'
    '<tr><td>جواز السفر أو الكملك أو بطاقة الإقامة</td><td>سارية المفعول؛ بعض البنوك تطلب '
    'ترجمة محلَّفة للجواز</td></tr>'
    '<tr><td>الرقم الضريبي أو رقم الهوية الأجنبي (99…)</td><td>استخرجه مجاناً كما أعلاه</td></tr>'
    '<tr><td>إثبات العنوان</td><td>وثيقة e-Devlet أو فاتورة حديثة</td></tr>'
    '<tr><td>رقم هاتف تركي مسجَّل باسمك</td><td>يلزم للتطبيق والرسائل — '
    '<a href="/article/gecici-koruma-hat-guncelleme-2026">تحديث بيانات الخط</a></td></tr>'
    '<tr><td>ما قد يُضاف بحسب البنك</td><td>إثبات دخل أو عمل، وثيقة طالب للطلاب، سبب فتح '
    'الحساب</td></tr>'
    '</tbody></table>'

    '<h2>حين يرفض الفرع</h2>'
    '<p>البنك ليس ملزماً بفتح حساب لكل طالب؛ سياسات التحقّق (KYC) تقديرية وتختلف بين بنك '
    'وآخر، بل بين فرع وفرع في البنك نفسه، وتتبدّل بين فترة وأخرى — ولهذا لا ننشر قائمة '
    '«بنوك تقبل وبنوك ترفض»: القائمة تفسد قبل أن تقرأها. الاستراتيجية التي تعمل:</p>'
    '<ol>'
    '<li><strong>ملفّ كامل من أول زيارة</strong>: هوية + رقم ضريبي + إثبات عنوان متطابق '
    'البيانات + هاتف باسمك.</li>'
    '<li><strong>اطلب سبب الرفض بوضوح</strong> — فإن كان نقص ورقة عالجته، وإن كان سياسة فرع '
    'فالفرع التالي ليس ملزماً بها.</li>'
    '<li><strong>جرّب فرعاً آخر ثم بنكاً آخر</strong> — الرفض هنا لا يُسجَّل قيداً عليك.</li>'
    '</ol>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>هل يستطيع حامل الكملك فتح حساب؟</h3>'
    '<p>نعم قانوناً — الكملك هوية معتمدة ورقمه (99…) يقوم مقام الرقم الضريبي. العقبة العملية '
    'هي نفسها للجميع: إثبات العنوان وتقدير الفرع. '
    '<a href="/article/kimlik-temporary-protection-syria-2026">حقوق حامل الكملك</a>.</p>'
    '<h3>هل أستطيع الفتح وأنا خارج تركيا؟</h3>'
    '<p>الفتح عن بُعد لغير المقيمين شأن كل بنك وشروطه، ولا مسار رسمياً موحّداً ننشره — '
    'اسأل البنك مباشرةً ولا تدفع لوسيط يعدك به.</p>'
    '<h3>لماذا يطلبون رقم هاتف باسمي أنا؟</h3>'
    '<p>لأنّ التطبيق والتحقّق بالرسائل مربوطان بالخط. خطّ مسجَّل باسم غيرك يعطّلك لاحقاً حتى '
    'لو قُبل عند الفتح — <a href="/article/gecici-koruma-hat-guncelleme-2026">حدّث بيانات '
    'خطّك</a> قبل مراجعة البنك.</p>'
)
BANK_STEPS = [
    'جهّز هويتك: جواز سفر ساري أو كملك أو بطاقة إقامة.',
    'استخرج الرقم الضريبي مجاناً: أونلاين من dijital.gib.gov.tr برفع صورة الجواز، أو من أي '
    'مديرية ضرائب — وإن كان معك رقم 99 فقدّمه هو.',
    'جهّز إثبات العنوان: وثيقة العنوان من e-Devlet أو فاتورة حديثة باسمك — وطابق البيانات مع هويتك.',
    'تأكّد أنّ خطّ هاتفك مسجَّل باسمك أنت.',
    'راجع الفرع بالملفّ كاملاً واذكر سبب فتح الحساب بوضوح.',
    'إن رُفضت: اطلب السبب، عالج النقص إن وُجد، وجرّب فرعاً أو بنكاً آخر.',
]
BANK_TIPS = [
    'الرقم الضريبي مجاني — من يطلب منك مالاً لاستخراجه يبيعك خدمة رسمية مجانية.',
    'إثبات العنوان يُسقط طلبات أكثر ممّا يُسقطها الجواز والرقم معاً — ابدأ منه.',
    'رقم الهوية الأجنبي (99…) يقوم مقام الرقم الضريبي عند أكثر الجهات.',
    'الرفض تقدير فرع لا قيد عليك — الفرع التالي غير ملزم به.',
    'لا قائمة «بنوك تقبل السوريين» ثابتة؛ السياسات تتبدّل والقوائم المتداولة تفسد سريعاً.',
    'اطلب سبب الرفض دائماً: نقص ورقة يُعالَج، وسياسة فرع تُتجاوَز بفرع آخر.',
]
BANK_DOCS = [
    'جواز السفر (وقد تُطلب ترجمة محلَّفة) أو الكملك أو بطاقة الإقامة',
    'الرقم الضريبي المحتمل — أو رقم الهوية الأجنبي 99 إن وُجد',
    'وثيقة العنوان من e-Devlet أو فاتورة خدمات حديثة باسمك',
    'رقم هاتف تركي مسجَّل باسمك',
    'بحسب البنك: إثبات دخل/عمل أو وثيقة طالب',
]
BANK_FEES = ('استخراج الرقم الضريبي مجاني تماماً (أونلاين أو في مديرية الضرائب). وفتح الحساب '
             'نفسه بلا رسم في الغالب، وقد تفرض بنوك رسوم بطاقة أو حدّاً أدنى للإيداع — اسأل '
             'الفرع قبل التوقيع.')
BANK_WARN = ('البنك غير ملزم بفتح حساب، والتقدير للفرع وفق سياسات التحقّق — فرفضك في فرع لا '
             'يعني رفضك في كل مكان. ولا تشترِ «خدمة استخراج رقم ضريبي» ولا «واسطة فتح حساب»: '
             'الأولى مجانية رسمياً والثانية لا صفة لها. وبيانات العنوان يجب أن تطابق هويتك '
             'حرفاً بحرف.')
BANK_SOURCE = ('مصلحة الضرائب التركية (GİB) — خدمة «الرقم الضريبي المحتمل للأجانب» على '
               'dijital.gib.gov.tr وivd.gib.gov.tr (مجانية، برفع صورة الجواز)؛ وتعليمات '
               'مديرية هجرة إسطنبول المنشورة حول استخراج الرقم الضريبي للأجانب '
               '(istanbul.goc.gov.tr)؛ ووثيقة العنوان Yerleşim Yeri Belgesi عبر e-Devlet '
               '(turkiye.gov.tr)')
BANK_TAGS = ['حساب بنكي', 'الرقم الضريبي', 'خدمات السوريين', 'إثبات العنوان', 'دليل', '2026']
BANK_SEO_T = 'فتح حساب بنكي في تركيا للأجانب 2026: الرقم الضريبي والأوراق'
BANK_SEO_D = ('الرقم الضريبي تستخرجه مجاناً أونلاين من بوابة الضرائب برفع صورة الجواز، '
              'وإثبات العنوان هو سبب الرفض الأول — الأوراق كاملة واستراتيجية التعامل مع '
              'رفض الفرع، للسوريين وكل الأجانب.')

# ══════════════════════════ B. HUMANITARIAN ══════════════════════════════
HUM_TITLE = 'الإقامة الإنسانية في تركيا (İnsani İkamet) 2026: حالاتها الست في القانون، ومدّتها، وما لا تفتحه لك'
HUM_INTRO = ('الإقامة الإنسانية ليست خياراً تطلبه لأنّ غيرها تعذّر — هي إذن استثنائي تصدره '
             'الولاية بموافقة المديرية العامة للهجرة في حالات عدّدتها المادة 46 من القانون '
             '6458 حصراً: مصلحة الطفل الفضلى، وتعذّر الترحيل، ودعاوى قضائية قائمة، وحالات '
             'طارئة لا يتاح فيها إذن آخر. وهذا الدليل يشرح الحالات الست، ومن يقرّر، وواجب '
             'تسجيل العنوان خلال عشرين يوم عمل، والحقيقة التي لا تُقال: سنوات الإنسانية لا '
             'تُوصلك إلى الإقامة طويلة الأمد.')
HUM_DETAILS = (
    '<div style="background:#eff6ff;border-right:4px solid #3b82f6;padding:14px 18px;margin:0 0 20px;">'
    '<p style="margin:0;"><strong>ضع التوقّع الصحيح أوّلاً:</strong> هذه ليست إقامة «عامة» '
    'تُطلب حين يتعذّر غيرها، بل إذن استثنائي لحالات نصّ عليها القانون حصراً، وتقديرُ منحه '
    'للإدارة. فاعرف حالتك قبل أن تبني عليها.</p></div>'

    '<h2>الحالات الست في المادة 46</h2>'
    '<p>تُمنح الإقامة الإنسانية — بموافقة المديرية العامة وتصدرها الولايات — في هذه الحالات:</p>'
    '<ol>'
    '<li><strong>مصلحة الطفل الفضلى</strong>: حين تقتضي حماية طفلٍ إبقاءَه في وضع قانوني.</li>'
    '<li><strong>تعذُّر إخراج الأجنبي من تركيا</strong> رغم قرار الترحيل أو حظر الدخول — '
    'الترحيل مستحيل عملياً أو غير معقول.</li>'
    '<li><strong>عدم اتخاذ قرار ترحيل</strong> استناداً إلى المادة 55 (الفئات التي لا يجوز '
    'ترحيلها أصلاً — راجع <a href="/article/deportation-rights">حقوق من صدر بحقّه قرار '
    'ترحيل</a>).</li>'
    '<li><strong>طعن قضائي قائم</strong> على معاملات جرت بحقّك (ترحيل، إبعاد…) — الإقامة '
    'تجسر المدّة حتى يفصل القضاء.</li>'
    '<li><strong>إجراءات إعادة إلى بلد اللجوء الأول أو بلد ثالث آمن</strong> الجارية.</li>'
    '<li><strong>حالة طارئة</strong> لا يتاح فيها الحصول على أي إذن إقامة آخر رغم وجوب '
    'معالجة الوضع.</li>'
    '</ol>'

    '<h2>المدّة: يحدّدها القرار، لا القانون</h2>'
    '<p>النصّ الحالي يترك المدد <strong>لما تحدّده الوزارة</strong> في كل منح — فلا تفترض '
    '«سنة قابلة للتجديد» لأنّك قرأتها في صفحة قديمة؛ الصياغة التي كانت تحدّد سنةً كحدّ أقصى '
    'عُدّلت. مدّتك هي ما في قرارك أنت، والتجديد مرهون ببقاء السبب الذي مُنحت لأجله.</p>'

    '<h2>واجبٌ يغفل عنه كثيرون: العنوان خلال 20 يوم عمل</h2>'
    '<p>المادة 46/2: على من مُنح إقامة إنسانية أن يسجّل عنوانه في نظام العناوين خلال '
    '<strong>عشرين يوم عمل</strong> من تاريخ الحصول عليها على الأكثر. أهملها فبدأت إقامتك '
    'بمخالفة. المسار في <a href="/article/kimlik-data-update">تسجيل وتحديث العنوان</a>.</p>'

    '<h2>متى تنتهي؟</h2>'
    '<p>المادة 47: تُلغى الإقامة الإنسانية — بموافقة المديرية العامة — حين يزول الشرط الذي '
    'أوجب منحها، ولا تنتظر نهاية المدة المكتوبة. فهي مربوطة بسببها لا بتاريخها: زال السبب، '
    'زال الإذن.</p>'

    '<div style="background:#fff7ed;border-right:4px solid #ea580c;padding:14px 18px;margin:18px 0;">'
    '<p style="margin:0 0 8px;"><strong>الحقيقة التي لا تُقال: لا طريق منها إلى الإقامة '
    'طويلة الأمد</strong></p>'
    '<p style="margin:0;">المادة 42/2 تستثني حامل الإقامة الإنسانية صراحةً من حقّ الانتقال '
    'إلى الإقامة طويلة الأمد — مهما طالت سنواته عليها. فمن يخطّط لاستقرار طويل في تركيا '
    'فليعمل من اليوم على التحوّل إلى إقامة أخرى (عمل، عائلية، دراسة) متى توافرت شروطها، '
    'لا على مراكمة سنوات الإنسانية.</p></div>'

    '<h2>كيف تُحضّر ملفّاً يُقنع؟</h2>'
    '<p>بما أنّ المنح تقديري ومربوط بحالة منصوصة، فالملفّ الذي يعمل هو ملفّ '
    '<strong>أدلّة</strong> لا ملفّ رجاء: ما يثبت انطباق حالتك أنت — تقارير طبية، أوراق '
    'دعوى قائمة، إثبات تعذّر السفر، وثائق الطفل — مرتّبةً على الحالة التي تستند إليها من '
    'الحالات الست. وإن رُفض طلبك فالاعتراض مسلوك: '
    '<a href="/article/residence-rejection-appeal-turkey-2026">رفض طلب الإقامة وكيف '
    'تعترض</a>.</p>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>هل الإقامة الإنسانية «بديل» عن الكملك للسوريين؟</h3>'
    '<p>لا. الحماية المؤقتة نظام قائم بذاته، والإنسانية حالات حصرية بتقدير الإدارة. '
    'من عليه كملك فوضعه يُدار من '
    '<a href="/article/kimlik-temporary-protection-syria-2026">صفحة الكملك والحماية '
    'المؤقتة</a>.</p>'
    '<h3>هل أستطيع العمل بها؟</h3>'
    '<p>الإقامة الإنسانية لا تُغني عن إذن العمل؛ العمل يحتاج إذنه الخاص — '
    '<a href="/article/work-permit-turkey-2026">إذن العمل في تركيا</a>.</p>'
    '<h3>مُنحت الإنسانية لتعذّر ترحيلي — هل تحميني من الترحيل لاحقاً؟</h3>'
    '<p>هي قائمة ما دام سببها قائماً (م47). إن تغيّر تقدير الإدارة لإمكان الترحيل عاد ملفّك '
    'إلى مساره — وحقوقك حينها في <a href="/article/deportation-rights">صفحة قرار '
    'الترحيل</a>، وميعاد الطعن سبعة أيام فقط.</p>'
)
HUM_STEPS = [
    'حدّد حالتك من الحالات الست في المادة 46 — فالطلب يُبنى على حالة منصوصة لا على حاجة عامة.',
    'اجمع أدلّة الحالة: تقارير، أوراق دعوى، وثائق الطفل، إثبات تعذّر السفر — مرتّبة عليها.',
    'راجع مديرية الهجرة في ولايتك وقدّم الطلب؛ القرار للولاية بموافقة المديرية العامة.',
    'إن مُنحت: سجّل عنوانك خلال 20 يوم عمل على الأكثر — واجب المادة 46/2.',
    'تابع سبب منحك: التجديد والبقاء مربوطان ببقائه لا بالتاريخ.',
    'واعمل بالتوازي على التحوّل لإقامة أخرى متى توافرت شروطها — الإنسانية لا تقود إلى طويلة الأمد.',
    'وإن رُفض الطلب: اعترض وفق مسار رفض الإقامة، ولا تفوّت المواعيد.',
]
HUM_TIPS = [
    'إذن استثنائي لحالات حصرية — ليس «الخيار الاحتياطي» لمن تعذّر غيره إلا في الحالة الطارئة المنصوصة.',
    'المدّة ما يحدّده قرارك أنت؛ لا تفترض سنةً لأنّ صفحة قديمة قالتها.',
    'العنوان خلال 20 يوم عمل — أوّل واجب بعد المنح وأكثره إغفالاً.',
    'المادة 42/2: سنوات الإنسانية لا تُحسب طريقاً إلى طويلة الأمد — خطّط للتحوّل مبكراً.',
    'تُلغى بزوال سببها ولو قبل تاريخها (م47).',
    'لا تُغني عن إذن العمل.',
]
HUM_DOCS = [
    'جواز السفر أو وثيقة الهوية المتاحة',
    'أدلّة الحالة المستنَد إليها: تقارير طبية، أوراق الدعوى القائمة، وثائق الطفل، إثبات تعذّر السفر',
    'إثبات السكن — وتسجيل العنوان بعد المنح خلال 20 يوم عمل',
    'ما تطلبه مديرية ولايتك لملفّ الإقامة (صور، تأمين إن طُلب)',
]
HUM_FEES = ('رسوم الإقامات تخضع لتعرفة رسمية تتغيّر سنوياً وتختلف بالحالة — اسأل مديريتك عن '
            'حالتك، ولا ننشر رقماً يتقادم. والاستشارة القانونية شأن تعاقدي.')
HUM_WARN = ('المنح تقديري للإدارة ضمن الحالات المنصوصة، والإذن يُلغى بزوال سببه ولو قبل '
            'تاريخه. والمادة 42/2 تستثنيه من طريق الإقامة طويلة الأمد صراحةً. وهذه الصفحة '
            'معلومات عامة لا استشارة في ملفّك — الملفّات الحسّاسة (ترحيل، دعاوى) تحتاج '
            'محامياً.')
HUM_SOURCE = ('قانون الأجانب والحماية الدولية رقم 6458 — المادة 46 بصيغتها المعدَّلة (حالات '
              'المنح، وموافقة المديرية العامة، والمدد التي تحدّدها الوزارة، وواجب تسجيل '
              'العنوان خلال 20 يوم عمل)، والمادة 47 (الإلغاء بزوال الشرط)، والمادة 42/2 '
              '(استثناء الإنسانية من الانتقال إلى طويلة الأمد) — النص الموحَّد المحدَّث')
HUM_TAGS = ['الإقامة الإنسانية', 'أنواع الإقامات', 'İnsani İkamet', 'دليل', '2026']
HUM_SEO_T = 'الإقامة الإنسانية في تركيا: حالاتها الست ومدتها وما لا تفتحه'
HUM_SEO_D = ('المادة 46 تحصر الإقامة الإنسانية في ست حالات، والمدّة يحدّدها القرار لا القانون، '
             'والعنوان واجب خلال 20 يوم عمل — والمادة 42/2 تقطع طريقها إلى الإقامة طويلة '
             'الأمد. الدليل الكامل بالمصادر.')

# ══════════════════════════ C. TRANSITION ════════════════════════════════
TR_TITLE = 'من الإقامة السياحية إلى إذن العمل في تركيا 2026: شرط الستة أشهر نصّاً، وما يقوله الرسمي وما لا يقوله'
TR_INTRO = ('هل يمكن التحوّل من الإقامة السياحية إلى إذن عمل دون مغادرة تركيا؟ النصّ الرسمي '
            'الوحيد المنشور يشترط للطلب الداخلي إقامةً سارية ستة أشهر على الأقل، وصاحبُ العمل '
            'هو من يقدّم الطلب إلكترونياً. أمّا «السياحية مستثناة بالاسم» التي تقرؤها على '
            'مواقع المحاماة فليست في النصّ الرسمي المنشور — والفرق بين الاثنين يحدّد خطّتك: '
            'متى تحاول من الداخل، ومتى يكون طريقك تأشيرة عمل من الخارج.')
TR_DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الخلاصة في ثلاثة أسطر</strong></p>'
    '<p style="margin:0;">1) الطلب الداخلي يشترط إقامة سارية <strong>ستة أشهر على الأقل</strong> '
    'يوم التقديم — نصّاً رسمياً. 2) الطلب يقدّمه <strong>صاحب العمل</strong> عبر النظام '
    'الإلكتروني، فلا عرض عمل حقيقياً = لا طلب أصلاً. 3) إن لم يتحقّق الشرطان فطريقك '
    '<strong>تأشيرة عمل من قنصلية بلدك</strong> — وهو مسار قائم لا عقوبة.</p></div>'

    '<h2>ما يقوله النصّ الرسمي — حرفياً</h2>'
    '<p>الأسئلة الرسمية لإذن العمل (goc.gov.tr) تنصّ: '
    '<span dir="ltr">«Yurt içi çalışma izni başvurularında yabancıya ait en az altı ay '
    'geçerli bir ikamet izninin bulunması gerekir»</span> — أي: للطلب من داخل تركيا يلزم أن '
    'تكون بيد الأجنبي إقامة سارية <strong>ستة أشهر على الأقل</strong>. وتنصّ أيضاً أنّ إذن '
    'العمل <strong>يقوم مقام إذن الإقامة</strong> بموجب المادة 27 من القانون 6458 — فمن '
    'قُبل طلبه لا يحتاج إقامة موازية ما دام الإذن سارياً.</p>'

    '<h2>وما لا يقوله</h2>'
    '<p>تقرأ على صفحات مكاتب المحاماة أنّ «الطلب الداخلي لا يُقبل من الإقامة السياحية» كقاعدة '
    'مطلقة. النصّ الرسمي المنشور <strong>لا يستثني السياحية بالاسم</strong> — الشرط المكتوب '
    'هو الصلاحية: ستة أشهر فأكثر يوم التقديم. لكن لا تقرأ هذا تطميناً زائداً: القبول تقديري '
    'لوزارة العمل وفق معايير التقييم، والصلاحية شرط دخول لا ضمان قبول، وسياسات التقييم '
    'تتشدّد وتلين. فالصواب عملياً: <strong>حقّق الشرط المكتوب، وجهّز ملفّ التقييم، ولا '
    'تشترِ وعداً بنتيجة</strong>.</p>'

    '<h2>احسب صلاحيتك قبل كل شيء</h2>'
    '<p>الشرط يقاس يوم التقديم: كم شهراً <em>يتبقّى</em> في إقامتك؟ سياحية مُنحت سنةً وبقي '
    'منها أربعة أشهر لا تحقّق الشرط. احسبها بدقّة عبر '
    '<a href="/tools/residence-calculator">حاسبة مدة الإقامة</a>، وراجع '
    '<a href="/article/tourist-residence-renewal-turkey-2026">تجديد الإقامة السياحية</a> '
    'إن كان التجديد أسبق خطوةً في حالتك.</p>'

    '<h2>الطلب يقدّمه صاحب العمل — وهذا مربط الفرس</h2>'
    '<p>طلب إذن العمل للموظّف يقدّمه <strong>صاحب العمل</strong> عبر النظام الإلكتروني '
    '(e-İzin عبر بوّابة calismaizni.gov.tr)، ويُقيَّم الملف بمعايير تخصّ الشركة نفسها — '
    'عدد العاملين الأتراك، ورأس المال، والراتب المصرَّح — تفصيلها في '
    '<a href="/article/work-permit-turkey-2026">دليل إذن العمل: الشروط والمعايير</a> '
    'و<a href="/article/foreigner-minimum-salary-2026">جدول الرواتب الإلزامية للأجانب</a>. '
    'فابحث عن صاحب عمل مستعدّ للتقديم قبل أن تبحث عن «طريقة تحويل».</p>'

    '<h2>وإن لم يتحقّق الشرطان: مسار الخارج</h2>'
    '<p>من ليست بيده إقامة تحقّق الشرط، أو انتهت صلاحيته، طريقه <strong>تأشيرة العمل من '
    'قنصلية بلد إقامته</strong>: يقدّم هو طلب التأشيرة في القنصلية ويقدّم صاحبُ العمل طلبه '
    'إلكترونياً في المدّة نفسها، ويكمل الملفّان بعضهما. التفصيل في '
    '<a href="/article/turkey-work-visa-guide">دليل تأشيرة العمل</a>. وهذا مسار عادي لا '
    '«عقوبة» — كثيرون يسلكونه لأنّه أنظف من انتظار شروط الداخل.</p>'

    '<div style="background:#eff6ff;border-right:4px solid #3b82f6;padding:14px 18px;margin:18px 0;">'
    '<p style="margin:0;"><strong>لحامل الكملك:</strong> هذه الصفحة لحاملي الإقامات. '
    'السوريون تحت الحماية المؤقتة لهم نظام مختلف كلّياً — وثيقة الإعفاء من تصريح العمل '
    'بتسهيلاتها الجديدة: '
    '<a href="/article/syria-work-permit-exemption-turkey-2026-07">إعفاء تصريح العمل '
    'للسوريين</a> و<a href="/article/work-permit-exemption-2026">دليل الإعفاء الكامل</a>.</p></div>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>هل أعمل أثناء دراسة الطلب؟</h3>'
    '<p>لا — العمل قبل صدور الإذن عملٌ بلا تصريح بعقوباته على العامل وصاحب العمل معاً. '
    'انتظر الصدور.</p>'
    '<h3>رُفض الطلب — هل خسرت إقامتي؟</h3>'
    '<p>رفض إذن العمل لا يُلغي إقامتك القائمة بذاته؛ تبقى بصلاحيتها. راجع سبب الرفض — كثير '
    'منه معايير شركة لا شخصك — ويمكن التقديم من جديد بعد المعالجة.</p>'
    '<h3>قُبل الطلب — ماذا عن إقامتي السياحية؟</h3>'
    '<p>إذن العمل يقوم مقام الإقامة (م27) — صلاحيته هي صلاحية بقائك، ولا تحتاج تجديد '
    'السياحية بالتوازي.</p>'
)
TR_STEPS = [
    'احسب المتبقّي من إقامتك يوم التقديم — الشرط الرسمي: ستة أشهر سارية على الأقل.',
    'أمّن عرض عمل حقيقياً: صاحب العمل هو من يقدّم الطلب، فلا مسار بدونه.',
    'راجع معايير التقييم التي تخصّ الشركة (العاملون الأتراك، رأس المال، الراتب الإلزامي).',
    'يقدّم صاحب العمل الطلب عبر النظام الإلكتروني e-İzin.',
    'لا تعمل قبل صدور الإذن — العمل بلا تصريح عقوبته عليك وعلى الشركة.',
    'إن صدر الإذن: هو نفسه إقامتك (م27) — لا تجديد موازياً للسياحية.',
    'وإن لم يتحقّق الشرط: اسلك تأشيرة العمل من قنصلية بلدك بالتنسيق مع صاحب العمل.',
]
TR_TIPS = [
    'الشرط المكتوب صلاحية الإقامة (6 أشهر+) لا نوعها — واستثناء السياحية بالاسم ليس في النص الرسمي المنشور.',
    'الصلاحية شرط دخول لا ضمان قبول — التقدير لوزارة العمل وفق معايير التقييم.',
    'ابحث عن صاحب عمل مستعدّ للتقديم قبل البحث عن «طريقة تحويل» — هو مربط الفرس.',
    'مسار الخارج (تأشيرة عمل قنصلية) مسار عادي لا عقوبة، وأنظف لمن لا يحقّق شرط الداخل.',
    'إذن العمل يقوم مقام الإقامة — قبوله يحلّ مسألة بقائك كاملة.',
    'حامل الكملك خارج هذه الصفحة: نظامه الإعفاء بتسهيلاته الجديدة.',
]
TR_DOCS = [
    'إقامة سارية ستة أشهر على الأقل يوم التقديم (للمسار الداخلي)',
    'جواز سفر ساري',
    'عقد أو عرض عمل — وملفّ الشركة يقدّمه صاحب العمل إلكترونياً',
    'للمسار الخارجي: طلب تأشيرة العمل في قنصلية بلد إقامتك بالتوازي مع طلب صاحب العمل',
]
TR_FEES = ('رسوم إذن العمل وبطاقته تخضع لتعرفة رسمية سنوية تتغيّر — راجع صفحة رسوم إذن العمل '
           'قبل الدفع، ولا تعتمد رقماً متداولاً. وتقديم الطلب الإلكتروني نفسه عبر النظام '
           'الرسمي بلا وسيط.')
TR_WARN = ('شرط الستة أشهر يقاس بالمتبقّي من إقامتك يوم التقديم لا بمدّتها الأصلية. والقبول '
           'تقديري لوزارة العمل — لا تشترِ وعداً بنتيجة. والعمل قبل صدور الإذن عملٌ بلا تصريح '
           'بعقوباته. وحاملو الكملك نظامهم الإعفاء لا هذا المسار.')
TR_SOURCE = ('الأسئلة الرسمية لإذن العمل على goc.gov.tr — نصّ شرط الإقامة السارية ستة أشهر '
             'للطلب الداخلي «Yurt içi çalışma izni başvurularında yabancıya ait en az altı '
             'ay geçerli bir ikamet izninin bulunması gerekir»، وقيام إذن العمل مقام الإقامة '
             'وفق المادة 27 من القانون 6458؛ ونظام الطلبات الإلكتروني calismaizni.gov.tr '
             '(وزارة العمل والضمان الاجتماعي)؛ وقانون العمل الدولي رقم 6735 لمعايير التقييم')
TR_TAGS = ['إذن العمل', 'الإقامة السياحية', 'تأشيرة العمل', 'العمل والاستثمار', 'دليل', '2026']
TR_SEO_T = 'التحويل من الإقامة السياحية إلى إذن عمل: شرط الستة أشهر'
TR_SEO_D = ('النص الرسمي يشترط للطلب الداخلي إقامة سارية 6 أشهر — ولا يستثني السياحية بالاسم '
            'كما تقول مواقع المحاماة. متى تقدّم من الداخل، ومتى تكون تأشيرة العمل من الخارج '
            'طريقك، ومن يقدّم الطلب فعلاً.')

# ── cross-links (guarded appends) ────────────────────────────────────────
LINK_TOURIST = ('<p style="margin-top:1rem;">وإن كان هدفك من الإقامة أبعد من السياحة: '
                '<a href="/article/tourist-to-work-permit-2026">التحوّل من السياحية إلى إذن '
                'العمل — شرط الستة أشهر وما يقوله النص الرسمي</a>.</p>')
LINK_WP = ('<p style="margin-top:1rem;">ولمن يقدّم من داخل تركيا بإقامة قائمة: '
           '<a href="/article/tourist-to-work-permit-2026">شرط الستة أشهر للطلب الداخلي — '
           'النص الرسمي وحدوده</a>.</p>')
LINK_WV = ('<p style="margin-top:1rem;">وقبل أن تختار مسار الخارج، تحقّق هل يحقّ لك الطلب من '
           'الداخل: <a href="/article/tourist-to-work-permit-2026">التحوّل من الإقامة '
           'السياحية إلى إذن العمل</a>.</p>')

# ── predicate self-checks ────────────────────────────────────────────────
for label, body, needles in [
    ('bank', BANK_DETAILS, ['dijital.gib.gov.tr', 'Yerleşim Yeri Belgesi', 'kimlik-data-update',
                            'مجانية', '99']),
    ('humanitarian', HUM_DETAILS, ['46/2', 'عشرين يوم عمل', '42/2', 'deportation-rights',
                                   'residence-rejection-appeal-turkey-2026']),
    ('transition', TR_DETAILS, ['en az altı ay', 'ستة أشهر على الأقل', 'المادة 27',
                                'residence-calculator', 'syria-work-permit-exemption-turkey-2026-07']),
]:
    for n in needles:
        assert n in body, 'PREDICATE WOULD LIE: %r not in %s' % (n, label)
assert 'Ziraat' not in BANK_DETAILS, 'the unverifiable bank list leaked back'
assert 'سنة قابلة للتجديد' not in HUM_DETAILS or 'لا تفترض' in HUM_DETAILS
# The page QUOTES the law-firm claim in order to bound it — that is the
# presence-of-refutation pattern, not laundering. What must hold is that the
# refutation itself is present alongside it.
assert 'لا يستثني السياحية بالاسم' in TR_DETAILS, 'the refutation went missing'

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


def art_sql(slug, title, intro, details, steps, tips, docs, fees, warn, source,
            tags, cat, seo_t, seo_d):
    return ART % (slug, slug, q(title), q(intro), q(details), arr(steps), arr(tips),
                  arr(docs), q(fees), q(warn), q(source), arr(tags), q(cat),
                  q(seo_t), q(seo_d))


sql = _no_bare_percent("""-- ============================================================================
-- موجة crpartners: ثلاث فجوات حقيقية — البنوك، والإنسانية، والتحويل إلى إذن عمل
-- ============================================================================
-- من فهرس منشورات crpartners.av.tr (8 مقالات، 2026 وأواخر 2025) بعد إسقاطه
-- على تغطيتنا:
--
--   تُرك عمداً (تغطيتنا أقوى): الترحيل (35 ألف حرف عندنا وميعاد السبعة أيام
--   مثبَّت من القانون 7533)، وG-99 (صفّ security_codes المدقَّق يقول بأمانة
--   «لا يوجد تعريف رسمي منشور له»)، وجولة «تغييرات 2026» (صفحات الجولات
--   تتعفّن)، وتأشيرة العمل (مغطّاة، تُربط بالجديد)، وإثبات العنوان (طُوي في
--   دليل البنوك لأنّه سبب الرفض الأول).
--
--   بُني (فجوات فعلية):
--   أ. البنوك: ثلاثة أنقاض (121+174+325 حرفاً) أحدها يقول إنّ «رقم TC»
--      مطلوب. الآلية الحقيقية تحقّقنا منها: «الرقم الضريبي المحتمل للأجانب»
--      مجاني أونلاين من dijital.gib.gov.tr برفع صورة الجواز، أو حضورياً في
--      أي مديرية ضرائب (تعليمات مديرية هجرة إسطنبول المنشورة). ورُفضت قائمة
--      «البنوك المفضلة: Ziraat, Vakıf Katılım, Kuveyt Türk» — تفضيل لا
--      يُتحقّق منه وسياساتٌ تتبدّل؛ وبقيت استراتيجية «اطلب سبب الرفض مكتوباً
--      وجرّب فرعاً آخر» لأنّها صادقة ونافعة.
--   ب. الإنسانية: نقض 323 حرفاً أُعيد بناؤه على المواد 46-47 بصيغتها
--      المعدَّلة: الحالات الست، والولاية تصدر بموافقة المديرية العامة،
--      والمدد «بما تحدّده الوزارة» لا سنة ثابتة (صياغة السنة عُدّلت)،
--      وواجب العنوان خلال 20 يوم عمل (46/2)، والمادة 42/2: لا طريق منها
--      إلى الإقامة طويلة الأمد — الحقيقة التي لا يقولها أحد.
--   ج. التحويل سياحية←عمل: لا صفحة كانت تغطّيه. النصّ الرسمي الوحيد
--      (goc.gov.tr) يشترط للطلب الداخلي إقامة سارية ستة أشهر — حرفياً:
--      «Yurt içi çalışma izni başvurularında yabancıya ait en az altı ay
--      geçerli bir ikamet izninin bulunması gerekir» — وإذن العمل يقوم مقام
--      الإقامة (م27). أمّا «السياحية مستثناة بالاسم» فليست في النص الرسمي
--      المنشور — كُتبت الحدود كما هي بدل غسل ادّعاء مكاتب المحاماة.
--
-- الأرشفة في بلوك DO بمعالج استثناء (كالسابق): إن رفض العمود قيمة 'archived'
-- تُتخطّى بإشعار ويثبت الباقي، والتحويلات 301 في next.config.ts تعمل بكل حال.
--
-- آمن لإعادة التشغيل.
-- ============================================================================

-- أ. دليل البنوك — إعادة بناء كاملة على القناة الرسمية المجانية
""" + art_sql('bank-account-opening', BANK_TITLE, BANK_INTRO, BANK_DETAILS, BANK_STEPS,
              BANK_TIPS, BANK_DOCS, BANK_FEES, BANK_WARN, BANK_SOURCE, BANK_TAGS,
              'خدمات السوريين', BANK_SEO_T, BANK_SEO_D) + """

-- ب. الإقامة الإنسانية — إعادة بناء على المواد 46-47 و42/2
""" + art_sql('humanitarian-residence', HUM_TITLE, HUM_INTRO, HUM_DETAILS, HUM_STEPS,
              HUM_TIPS, HUM_DOCS, HUM_FEES, HUM_WARN, HUM_SOURCE, HUM_TAGS,
              'أنواع الإقامات', HUM_SEO_T, HUM_SEO_D) + """

-- ج. التحويل من السياحية إلى إذن العمل — مقال جديد
""" + art_sql(TRANSIT, TR_TITLE, TR_INTRO, TR_DETAILS, TR_STEPS, TR_TIPS, TR_DOCS,
              TR_FEES, TR_WARN, TR_SOURCE, TR_TAGS, 'العمل والاستثمار', TR_SEO_T, TR_SEO_D) + """

-- نقضا البنوك يتقاعدان (التحويلات 301 في next.config.ts)
DO $archive$
BEGIN
    UPDATE articles SET status = 'archived', last_update = CURRENT_DATE
     WHERE slug IN ('bank-account-documents', 'kimlik-bank-sim') AND status = 'approved';
EXCEPTION WHEN others THEN
    RAISE NOTICE 'archive skipped (%%) — the 301 redirects still apply', SQLERRM;
END
$archive$;

-- ربط داخلي محروس نحو مقال التحويل
UPDATE articles SET details = details || '%s', last_update = CURRENT_DATE
WHERE slug = 'tourist-residence-renewal-turkey-2026' AND details NOT LIKE '%%tourist-to-work-permit-2026%%';

UPDATE articles SET details = details || '%s', last_update = CURRENT_DATE
WHERE slug = 'work-permit-turkey-2026' AND details NOT LIKE '%%tourist-to-work-permit-2026%%';

UPDATE articles SET details = details || '%s', last_update = CURRENT_DATE
WHERE slug = 'turkey-work-visa-guide' AND details NOT LIKE '%%tourist-to-work-permit-2026%%';

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM articles
     WHERE slug = 'bank-account-opening' AND status = 'approved'
       AND details LIKE '%%dijital.gib.gov.tr%%' AND details LIKE '%%Yerleşim Yeri Belgesi%%';
    IF n <> 1 THEN RAISE EXCEPTION 'bank rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = 'humanitarian-residence' AND status = 'approved'
       AND details LIKE '%%عشرين يوم عمل%%' AND details LIKE '%%42/2%%';
    IF n <> 1 THEN RAISE EXCEPTION 'humanitarian rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = 'tourist-to-work-permit-2026' AND status = 'approved'
       AND details LIKE '%%en az altı ay%%';
    IF n <> 1 THEN RAISE EXCEPTION 'transition article did not land'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = 'bank-account-opening' AND details LIKE '%%Ziraat%%';
    IF n > 0 THEN RAISE EXCEPTION 'the unverifiable bank list is live again'; END IF;
END
$check$;

SELECT 'bank guide rebuilt on the free official channel' AS البند,
       (details LIKE '%%dijital.gib.gov.tr%%' AND details NOT LIKE '%%Ziraat%%') AS سليم
FROM articles WHERE slug = 'bank-account-opening'
UNION ALL
SELECT 'humanitarian: six cases + 20 workdays + 42/2',
       (details LIKE '%%عشرين يوم عمل%%' AND details LIKE '%%42/2%%')
FROM articles WHERE slug = 'humanitarian-residence'
UNION ALL
SELECT 'transition live with the official Turkish text', (details LIKE '%%en az altı ay%%')
FROM articles WHERE slug = 'tourist-to-work-permit-2026'
UNION ALL
SELECT 'three pages link the transition article', (count(*) = 3)::boolean
FROM articles WHERE slug IN ('tourist-residence-renewal-turkey-2026', 'work-permit-turkey-2026',
                             'turkey-work-visa-guide')
  AND details LIKE '%%tourist-to-work-permit-2026%%'
UNION ALL
SELECT 'bank stubs retired (0 = skipped; 301s apply anyway)', (count(*) = 0)::boolean
FROM articles WHERE slug IN ('bank-account-documents', 'kimlik-bank-sim') AND status = 'approved';
""") % (q(LINK_TOURIST), q(LINK_WP), q(LINK_WV))

path = os.path.join(REPO, 'sql', '2026-08-07_crpartners_wave.sql')
open(path, 'w', encoding='utf-8', newline='').write(sql)

_code = '\n'.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('أ. البنوك     : bank-account-opening — %d ← %d حرفاً؛ يتقاعد نقضان (301)' % (len(bank['details'] or ''), len(BANK_DETAILS)))
print('ب. الإنسانية  : humanitarian-residence — %d ← %d حرفاً (م46-47 + 42/2)' % (len(hum['details'] or ''), len(HUM_DETAILS)))
print('ج. التحويل    : %s — جديد، %d حرفاً، بالنص التركي الرسمي حرفياً' % (TRANSIT, len(TR_DETAILS)))
print('ربط           : 3 صفحات عمل/سياحية ← مقال التحويل (محروس)')
print('quote parity  :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written       :', path, len(sql), 'chars')
