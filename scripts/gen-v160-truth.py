# -*- coding: utf-8 -*-
"""V-160 means three things on this site, and one of them bills 11,604 lira.

Item 5 of the work order.

  security_codes.V160          «تجميد عنوان» — address freeze
  identity-kimlik-iptal-v160   «إبطال الكملك (İptal) … (V-160)» — card cancellation
  frozen-id-problem            «تجميد القيود (V-160 / إيقاف)» — record freeze

And the site already knows which is right. syria-turkey-border-crossings-2026,
453 views, says it in as many words: «راجعنا جدول الأكواد المدقَّق عندنا (125
كوداً) فوجدنا أنّ V-160 هو تجميد عنوان لا إبطال بطاقة». An earlier pass of this
same audit wrote that correction and never went back to fix the page it was
correcting — so the site publishes the rebuttal and the claim side by side.

── THE MONEY ──────────────────────────────────────────────────────────────

security_codes.V160.how_to_remove reads, in Arabic and in Turkish:

  «يُرفع عند تثبيت العنوان بعد مراجعة إدارة الهجرة وبعد دفع الغرامة التي تبلغ
   11604 ليرات حسب آخر التحديثات من ادارة الهجرة»

No instrument, no date, and «آخر التحديثات» is not a citation. It matters more
than the usual unsourced number because src/app/codes/[code]/page.tsx renders
how_to_remove verbatim as a FAQPage acceptedAnswer — so "pay 11,604 lira" is
offered to Google as a direct answer, in both languages.

Meanwhile consultant_scenarios.syrian-fix-address, the surface that wins when
two disagree, prices the same procedure at «مجاناً».

What could be verified, from T.C. Salzburg Başkonsolosluğu's address-declaration
note (mfa.gov.tr) updated 18/05/2026, for 2026:

  «adres bildirim yükümlülüğünü süresi içinde yerine getirmeyenlere 814,00 TL,
   gerçeğe aykırı adres beyanında bulunanlara ise 17.051,00 TL idari para
   cezası uygulanacaktır»

Neither is 11,604, and neither is a code-removal fee: both are Law 5490 art. 68
administrative fines imposed by the nüfus müdürlüğü. No published charge for
lifting V-160 was found in any primary source, so the page now says that, rather
than filling the gap with a number.

The stale-official-page trap recurred a third time while checking this. Three
nvi.gov.tr pages on this exact subject are frozen at 2015 and 2017 figures
(480/963 TL and 51/1.038 TL) with no date on the page. A .gov.tr domain is not
a date stamp.

── WHAT CHANGES ───────────────────────────────────────────────────────────

  security_codes.V160          the fee claim removed, AR and TR, replaced by the
                               real mechanism and the real Law 5490 figures
  frozen-id-problem            119 characters, and the only page that had V-160
                               right — built out as the page it should have been
  identity-kimlik-iptal-v160   V-160 out of the title; it is about card
                               cancellation, which is a different thing
  syrian-fix-address           «مجاناً» made precise

The companion fix is in code: /forms offered «عريضة إزالة أكواد المنع الأمنية
(G-87, V-160)» that downloaded the Turkish customs regulation from a lecturer's
course files, on a host that no longer resolves. Checking the rest of that list,
only one of five downloads served the document its label promised.
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


def fetch(table, col, val):
    u = '%s/rest/v1/%s?select=*&%s=eq.%s' % (_URL, table, col, urllib.parse.quote(val, safe=''))
    return json.load(urllib.request.urlopen(urllib.request.Request(u, headers=_H)))[0]


def q(s):
    return str(s if s is not None else '').replace("'", "''")


def arr(items):
    return 'ARRAY[%s]::text[]' % ', '.join("'%s'" % q(x) for x in items)


OUT = []

# ═══════════════════════════════════════════════════════════════════════════
# 1. the FAQPage answer that bills 11,604 lira
# ═══════════════════════════════════════════════════════════════════════════

code = fetch('security_codes', 'code', 'V160')
assert '11604' in (code['how_to_remove'] or ''), 'the fee claim moved'
assert '11604' in (code['how_to_remove_tr'] or ''), 'the TR fee claim moved'

AR = ('يُرفع الكود بإثبات عنوانك من جديد: احجز موعد تحديث بيانات في مديرية الهجرة بولايتك، '
      'واحضر بما يثبت سكنك فعلاً في العنوان (عقد إيجار مسجَّل أو فاتورة خدمات باسمك)، '
      'ويُرفع القيد بعد التحقّق. '
      'ولا نعرف رسماً منشوراً يُدفع مقابل رفع هذا الكود بعينه — فإن طلب منك أحد مبلغاً '
      'بوصفه «رسم رفع الكود» فاطلب سنده المكتوب. '
      'أمّا الغرامات الإدارية المتعلّقة بالعنوان فهي غير ذلك تماماً: تفرضها مديرية النفوس '
      'بموجب المادة 68 من قانون خدمات النفوس رقم 5490، ومقاديرها لعام 2026 هي 814 ليرة لمن '
      'لم يبلّغ عن عنوانه في المهلة، و17,051 ليرة لمن أدلى ببيان عنوان غير صحيح. '
      'وهاتان تُدفعان للنفوس ولا تُدفعان لرفع كود.')

TR = ('Kod, adresin yeniden tespitiyle kaldırılır: ilinizdeki Göç İdaresinden bilgi güncelleme '
      'randevusu alın ve adreste fiilen oturduğunuzu gösteren belgeyle (kayıtlı kira sözleşmesi '
      'veya adınıza fatura) başvurun; doğrulamadan sonra kısıtlama kaldırılır. '
      'Bu kodun kaldırılması için yayımlanmış herhangi bir ücret tespit edilememiştir — '
      'size «kod kaldırma ücreti» adı altında bir meblağ söylenirse yazılı dayanağını isteyin. '
      'Adresle ilgili idari para cezaları ise bambaşkadır: 5490 sayılı Nüfus Hizmetleri '
      'Kanununun 68 inci maddesi uyarınca nüfus müdürlüğünce uygulanır ve 2026 için adres '
      'bildirim yükümlülüğünü süresinde yerine getirmeyenlere 814,00 TL, gerçeğe aykırı adres '
      'beyanında bulunanlara 17.051,00 TL olarak belirlenmiştir. '
      'Bunlar nüfus müdürlüğüne ödenir, bir kodu kaldırmak için değil.')

OUT.append("""UPDATE security_codes SET
    how_to_remove = '%s',
    how_to_remove_tr = '%s'
WHERE code = 'V160' AND how_to_remove LIKE '%%11604%%';""" % (q(AR), q(TR)))

# ═══════════════════════════════════════════════════════════════════════════
# 2. frozen-id-problem — 119 characters, and the only page that had it right
# ═══════════════════════════════════════════════════════════════════════════

fz = fetch('articles', 'slug', 'frozen-id-problem')
assert len(fz['details'] or '') < 400, 'frozen-id-problem is no longer a stub'

D = (
    '<p>«تجميد العنوان» هو ما يقابل الكود <strong>V-160</strong> في سجلّ إدارة الهجرة، واسمه '
    'بالتركية <strong>Adres Dondurma</strong>. ويُوضع في حالتين: أن تزور الشرطة عنوانك المسجَّل '
    'فلا تجدك فيه، أو أن تُضبط خارج ولاية تسجيلك بلا إذن سفر.</p>'

    '<h2>ما ليس عليه — وهذا أهمّ من تعريفه</h2>'
    '<p>يخلط كثيرون بين ثلاثة أشياء، ويكلّف الخلط مالاً:</p>'
    '<ul>'
    '<li><strong>V-160 ليس إبطالاً للكملك.</strong> بطاقتك لا تُلغى بهذا الكود؛ قيدك يُجمَّد '
    'حتى يُثبَّت عنوانك. وإلغاء الحماية المؤقتة إجراء آخر تصدره الولاية، وله سببه ومسطرته.</li>'
    '<li><strong>وليس كوداً أمنياً.</strong> تصنيفه في جدولنا «إداري» لا «أمني»، فلا تعامله '
    'معاملة G-87 ولا تشترِ له «حلّاً أمنياً».</li>'
    '<li><strong>ولا نعرف له رسم رفع منشوراً.</strong> راجعنا المصادر الرسمية فلم نجد مبلغاً '
    'مقرَّراً يُدفع مقابل رفع هذا الكود بعينه. فمن طلب منك مالاً بوصفه «رسم رفع الكود» '
    'فاطلب سنده المكتوب قبل أن تدفع.</li>'
    '</ul>'

    '<h2>والغرامات التي قد تسمع عنها — ما هي فعلاً</h2>'
    '<p>هناك غرامات إدارية تخصّ العنوان، لكنّها ليست رسم رفعِ كود. تفرضها <strong>مديرية '
    'النفوس</strong> بموجب المادة 68 من قانون خدمات النفوس رقم 5490، ومقاديرها لعام 2026:</p>'
    '<ul>'
    '<li>عدم التبليغ عن العنوان في المهلة: <strong>814 ليرة</strong>.</li>'
    '<li>الإدلاء ببيان عنوان غير صحيح: <strong>17,051 ليرة</strong>.</li>'
    '</ul>'
    '<p>وتُدفعان للنفوس، وقد لا تُفرضان عليك أصلاً. أمّا الأرقام التي تتداولها الصفحات بوصفها '
    '«غرامة الكود» فلم نجد لها سنداً منشوراً، ونبّهنا على ذلك في صفحة الكود نفسها.</p>'

    '<h2>لماذا يستحقّ المعالجة فوراً</h2>'
    '<p>التجميد يوقف ما هو معلَّق على القيد — المواعيد والخدمات والمساعدات — إلى أن يُرفع. '
    'والأثقل أنّ التخلّف عن واجب التبليغ عن العنوان ثلاث مرّات متتالية دون عذر يجيز للولاية '
    'إلغاء حمايتك المؤقتة (المادة 12/3 من لائحة الحماية المؤقتة). ومهلة التبليغ عن تغيير '
    'العنوان <strong>عشرون يوم عمل</strong> — لا يوماً تقويمياً — بالمادة 33/2(د) من اللائحة '
    'والمادة 50/3 من القانون 5490.</p>'
    '<p>ومع ذلك، لا يجوز تقييد <strong>التعليم والصحة الطارئة</strong> بحال (المادة 35/2).</p>'

    '<p style="margin-top:1.2rem;">وللتفصيل: '
    '<a href="/codes/V160">صفحة الكود V-160</a> • '
    '<a href="/article/address-registration-closed">الحي المغلق أمام تسجيل الأجانب</a> • '
    '<a href="/article/travel-permit">إذن السفر بين الولايات</a></p>'
)

S = [
    'احجز موعد «تحديث بيانات» في مديرية الهجرة بولايتك فوراً — التأخير يزيد التعقيد ولا يخفّفه.',
    'ثبّت عنوانك في النفوس قبل الموعد إن استطعت، فوثيقة العنوان هي ما يُبنى عليه رفع القيد.',
    'احضر بما يثبت سكنك فعلاً: عقد إيجار مسجَّل أو فاتورة خدمات باسمك — لا صورة عقد غير مسجَّل.',
    'اسأل صراحةً عن سبب وضع الكود واطلبه مكتوباً؛ فسبب «لم يُعثر عليه» يُعالَج غير سبب «ضُبط خارج ولايته».',
    'وإن طُلب منك مبلغ: اطلب سنده المكتوب واسم الغرامة. غرامة النفوس تُدفع للنفوس بإيصال، ولا تُدفع نقداً لأحد.',
    'تابع بعد المراجعة حتى يظهر رفع القيد في النظام، ولا تكتفِ بوعدٍ شفهي.',
]
T = [
    'V-160 تجميد عنوان لا إبطال بطاقة — ومن يخبرك بغير ذلك يبيعك حلّاً لمشكلة لا تملكها.',
    'لا رسم منشوراً لرفع الكود؛ وغرامتا العنوان (814 و17,051 ليرة) تخصّان النفوس لا رفع الكود.',
    'مهلة التبليغ عن تغيير العنوان عشرون يوم عمل، لا شهر ولا عشرون يوماً تقويمياً.',
    'التخلّف ثلاث مرّات متتالية عن واجب التبليغ يجيز إلغاء الحماية المؤقتة — وهذا الخطر الحقيقي.',
    'التعليم والصحة الطارئة لا يجوز تقييدهما مهما كان وضع قيدك.',
    'كن في المنزل عند كشف العنوان إن أمكن، أو اترك من يفتح ويشرح — أكثر الحالات تبدأ من زيارة لم يفتح فيها أحد.',
]
DOC = [
    'بطاقة الحماية المؤقتة (الكملك)',
    'عقد إيجار مسجَّل أو سند ملكية',
    'فاتورة خدمات (كهرباء/ماء/غاز) باسمك',
    'وثيقة العنوان (Yerleşim Yeri Belgesi) إن استخرجتها',
]

OUT.append("""UPDATE articles SET
    title = 'كود V-160 (تجميد العنوان): لماذا يُوضع، وكيف يُرفع، وكم يكلّف فعلاً',
    details = '%s',
    steps = %s, tips = %s, documents = %s,
    fees = '%s',
    warning = '%s',
    source = 'جدول الأكواد المدقَّق على /codes (125 كوداً) + قانون خدمات النفوس 5490 م.50 و68 + لائحة الحماية المؤقتة م.12/3 و33/2(د) و35/2 + نشرة بيان العنوان لدى القنصلية العامة في سالزبورغ (mfa.gov.tr) المحدَّثة في 18/5/2026',
    last_update = CURRENT_DATE
WHERE slug = 'frozen-id-problem';""" % (
    q(D), arr(S), arr(T), arr(DOC),
    q('لا نعرف رسماً منشوراً يُدفع مقابل رفع الكود، وموعد تحديث البيانات مجاني. والغرامات '
      'الإدارية المتعلّقة بالعنوان تفرضها النفوس بالمادة 68 من القانون 5490: 814 ليرة لعدم '
      'التبليغ في المهلة، و17,051 ليرة لبيان عنوان غير صحيح (مقادير 2026).'),
    q('لا تدفع مبلغاً بوصفه «رسم رفع الكود» قبل أن تطلب سنده المكتوب — لم نجد لهذا الرسم '
      'أثراً في أي مصدر رسمي. وحملة التحقّق من العناوين مستمرّة، والتخلّف ثلاث مرّات متتالية '
      'عن واجب التبليغ يجيز للولاية إلغاء حمايتك المؤقتة.')))

# ═══════════════════════════════════════════════════════════════════════════
# 3. the page whose title says V-160 is card cancellation
# ═══════════════════════════════════════════════════════════════════════════

ip = fetch('articles', 'slug', 'identity-kimlik-iptal-v160')
OLD = 'أحياناً تُستخدم تسميات مثل “V-160” في بعض السياقات الإجرائية، لكن المهم عملياً هو:'
assert (ip['details'] or '').count(OLD) == 1, 'iptal needle moved'
NEW = ('وتصحيحٌ لازم: <strong>V-160 ليس إبطالاً للكملك</strong> — هو كود «تجميد عنوان» '
       '(Adres Dondurma) يُوضع حين لا يُعثر عليك في عنوانك المسجَّل أو تُضبط خارج ولايتك بلا '
       'إذن سفر، وقيدك يُجمَّد ولا تُلغى بطاقتك. فإن كان ما تراه على ملفك هو V-160 فموضعه '
       '<a href="/article/frozen-id-problem">صفحة تجميد العنوان</a> لا هذه الصفحة. '
       'أمّا الإبطال فسببه ومسطرته غير ذلك، والمهم فيه عملياً هو:')

OUT.append("""UPDATE articles SET
    title = 'إبطال الكملك (İptal): الأسباب الشائعة وكيفية إعادة التفعيل',
    details = replace(details, '%s', '%s'),
    last_update = CURRENT_DATE
WHERE slug = 'identity-kimlik-iptal-v160' AND title LIKE '%%V-160%%';""" % (q(OLD), q(NEW)))

# ═══════════════════════════════════════════════════════════════════════════
# 4. the surface that wins, priced at «مجاناً»
# ═══════════════════════════════════════════════════════════════════════════

sc = fetch('consultant_scenarios', 'id', 'syrian-fix-address')
assert (sc['cost'] or '').strip() == 'مجاناً', 'scenario cost moved: %r' % sc['cost']
COST = ('موعد تحديث البيانات مجاني، ولا نعرف رسماً منشوراً يُدفع مقابل رفع الكود نفسه. '
        'وما قد يُفرض عليك شيء آخر: غرامة إدارية عن العنوان بالمادة 68 من القانون 5490، '
        'تفرضها النفوس ومقاديرها لعام 2026 هي 814 ليرة لعدم التبليغ في المهلة و17,051 ليرة '
        'لبيان عنوان غير صحيح. فإن طُلب منك مبلغ بوصفه «رسم رفع الكود» فاطلب سنده المكتوب.')
OUT.append("""UPDATE consultant_scenarios SET
    cost = '%s', last_update = '2026-08'
WHERE id = 'syrian-fix-address' AND cost = 'مجاناً';""" % q(COST))

HEADER = """-- ============================================================================
-- V-160 يعني ثلاثة أشياء على هذا الموقع، وأحدها يُحصّل 11,604 ليرة
-- ============================================================================
-- البند الخامس من أمر العمل.
--
--   security_codes.V160          «تجميد عنوان»
--   identity-kimlik-iptal-v160   «إبطال الكملك (İptal) … (V-160)»
--   frozen-id-problem            «تجميد القيود (V-160 / إيقاف)»
--
-- والموقع يعرف أيّها الصحيح. صفحة syria-turkey-border-crossings-2026، 453 قراءة،
-- تقولها بالحرف: «راجعنا جدول الأكواد المدقَّق عندنا (125 كوداً) فوجدنا أنّ V-160
-- هو تجميد عنوان لا إبطال بطاقة». كتبَت تمريرةٌ سابقة من هذا التدقيق ذلك التصحيح
-- ولم تعد إلى الصفحة التي كانت تصحّحها — فالموقع ينشر الردّ والدعوى جنباً إلى جنب.
--
-- ── والمال ─────────────────────────────────────────────────────────────
--
-- حقل how_to_remove في الكود V160، بالعربية والتركية:
--
--   «يُرفع عند تثبيت العنوان بعد مراجعة إدارة الهجرة وبعد دفع الغرامة التي تبلغ
--    11604 ليرات حسب آخر التحديثات من ادارة الهجرة»
--
-- بلا أداة وبلا تاريخ، و«آخر التحديثات» ليست إسناداً. وهو أخطر من رقمٍ بلا مصدر
-- في موضع آخر، لأنّ src/app/codes/[code]/page.tsx يعرض how_to_remove حرفياً
-- بوصفه acceptedAnswer في سكيما FAQPage — أي أنّ «ادفع 11,604 ليرة» يُقدَّم
-- إلى جوجل جواباً مباشراً، وباللغتين.
--
-- وفي المقابل يسعّر consultant_scenarios.syrian-fix-address — وهو السطح الذي
-- يغلب عند التعارض — الإجراءَ نفسه بـ«مجاناً».
--
-- والذي أمكن التحقّق منه، من نشرة بيان العنوان لدى القنصلية العامة في سالزبورغ
-- (mfa.gov.tr) المحدَّثة في 18/5/2026، لعام 2026:
--
--   «adres bildirim yükümlülüğünü süresi içinde yerine getirmeyenlere 814,00 TL,
--    gerçeğe aykırı adres beyanında bulunanlara ise 17.051,00 TL idari para
--    cezası uygulanacaktır»
--
-- فلا 11,604 ولا رسمَ رفعِ كود: كلتاهما غرامة إدارية بالمادة 68 من القانون 5490
-- تفرضها مديرية النفوس. ولم نجد في أي مصدر أوّلي رسماً منشوراً لرفع V-160،
-- فصارت الصفحة تقول ذلك بدل أن تملأ الفراغ برقم.
--
-- وتكرّر فخّ «الصفحة الرسمية القديمة» للمرّة الثالثة في هذا التدقيق: ثلاث صفحات
-- على nvi.gov.tr في هذا الموضوع بعينه متجمّدة عند أرقام 2015 و2017
-- (480/963 ليرة و51/1.038 ليرة) وبلا تاريخ على الصفحة. النطاق الحكومي ليس ختم
-- تاريخ.
--
-- ── وما يتغيّر ─────────────────────────────────────────────────────────
--
--   security_codes.V160          يُحذف ادّعاء الرسم بالعربية والتركية، ويحلّ
--                                محلّه الإجراء الحقيقي وأرقام 5490 الحقيقية
--   frozen-id-problem            119 حرفاً، وهي الصفحة الوحيدة التي أصابت في
--                                V-160 — تُبنى لتكون الصفحة التي كان ينبغي أن تكون
--   identity-kimlik-iptal-v160   يخرج V-160 من عنوانها؛ موضوعها الإبطال وهو غيره
--   syrian-fix-address           «مجاناً» تصير دقيقة
--
-- والإصلاح المرافق في الشيفرة: صفحة /forms كانت تعرض «عريضة إزالة أكواد المنع
-- الأمنية (G-87, V-160)» تُنزِّل لائحةَ الجمارك التركية من ملفات مدرّس جامعي،
-- على مضيفٍ لم يعد يُحَلّ أصلاً. وبفحص بقية القائمة: واحدٌ من خمسة تنزيلات كان
-- يقدّم الوثيقة التي يعد بها اسمه.
--
-- آمن لإعادة التشغيل.
-- ============================================================================

"""

VERIFY = """
-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — كل صفّ true
SELECT 'V160 fee claim removed' AS البند,
       (how_to_remove NOT LIKE '%11604%' AND how_to_remove_tr NOT LIKE '%11604%'
        AND how_to_remove LIKE '%5490%') AS سليم
FROM security_codes WHERE code = 'V160'
UNION ALL
SELECT 'frozen-id-problem rebuilt',
       (length(details) > 1500 AND details LIKE '%ليس إبطالاً للكملك%'
        AND coalesce(array_length(steps,1),0) >= 3)
FROM articles WHERE slug = 'frozen-id-problem'
UNION ALL
SELECT 'iptal page no longer claims V-160',
       (title NOT LIKE '%V-160%' AND details LIKE '%صفحة تجميد العنوان%')
FROM articles WHERE slug = 'identity-kimlik-iptal-v160'
UNION ALL
SELECT 'scenario cost precise', (cost NOT IN ('مجاناً') AND cost LIKE '%5490%')
FROM consultant_scenarios WHERE id = 'syrian-fix-address';
"""

sql = HEADER + '\n\n'.join(OUT) + '\n' + VERIFY
path = os.path.join(REPO, 'sql', '2026-08-06_v160_meaning_and_fee.sql')
open(path, 'w', encoding='utf-8').write(sql)

print('security_codes.V160 : 11,604 (بلا سند) → آلية الرفع + 814/17,051 بالمادة 68')
print('frozen-id-problem   : %d حرفاً → %d، مع %d خطوات و%d نصائح' % (len(fz['details'] or ''), len(D), len(S), len(T)))
print('identity-kimlik-iptal: V-160 يخرج من العنوان + تصحيح في المتن')
print('syrian-fix-address  : «مجاناً» → دقيقة')
print('quote parity        :', 'OK' if re.sub(r"''", '', sql).count("'") % 2 == 0 else '*** BROKEN ***')
print('written             :', path, len(sql), 'chars')
