# -*- coding: utf-8 -*-
"""Family-reunification visa now accepted in Damascus and Aleppo — and the page
that still sends readers to Beirut.

The owner's tip: the Turkish missions in Syria added «لم شمل العائلة» to the
visa categories accepted at the application centre, so people no longer have to
travel to Beirut to apply. Useful for Syrians whose relative in Turkey is a
Turkish spouse or a work-permit holder.

VERIFIED at sy.visafg.com/ar/re on 6 Aug 2026. The centre serves two official
missions, both linked from its own footer: the Turkish Embassy in Damascus
(damascus.be.mfa.gov.tr) and the Consulate General in Aleppo
(halep-bk.mfa.gov.tr). «لم شمل العائلة» is listed among its categories with a
full document list, and — this is the part that had to be checked before
publishing anything — the family-reunification block carries NO Beirut
restriction.

A NEAR-MISS WORTH RECORDING. The page does contain «إذا لم يستوفِ المتقدم
واحداً على الأقل من الشرطين المذكورين أعلاه، يمكنه التقديم فقط من خلال مكتب
بيروت», and read out of context that sentence would have turned this news into
its opposite. Pulling the surrounding lines shows it sits under the STUDENT visa
and refers to two student conditions (a prior university registration, or a
final acceptance for someone who gave up temporary protection). It does not
touch family reunification. A single grep would have published the wrong story.

WHAT MATTERS MORE THAN THE NEWS.

turkish-embassy-beirut-family, 29 views, is 137 characters long and its entire
content is one sentence: «تُعتبر السفارة التركية في بيروت المنفذ الرئيسي
للسوريين المقيمين في سوريا لإجراء معاملات لم الشمل إلى تركيا». That is now
false, and it is the expensive kind of false — it sends a family across a border
for something they can now do in their own city.

AND THE GAP. syria-turkey-visa-types-2026, 259 views, enumerates seven visa
types for Syrians and family reunification is not among them. So this is new
content, not a duplicate: the site's own visa guide has an eighth category
missing. A companion article is required by the publishing checklist anyway —
this is a procedure the reader performs, so the news announces and the article
explains.

The article keeps two things separate that are constantly confused:
  • the family-reunification VISA, applied for in Syria, which lets you ENTER;
  • the family RESIDENCE permit (Aile İkamet İzni), applied for at Göç İdaresi
    AFTER arriving, which is what family-reunion (77 views) covers.
Neither page previously mentioned the other.
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


assert fetch('family-reunion-visa-syria-2026') is None, 'the article already exists'
beirut = fetch('turkish-embassy-beirut-family')
assert 'المنفذ الرئيسي' in (beirut['details'] or ''), 'the Beirut claim moved'
types = fetch('syria-turkey-visa-types-2026')
assert 'لم شمل' not in (types['details'] or ''), 'the visa guide already covers it'

SLUG = 'family-reunion-visa-syria-2026'
TITLE = 'تأشيرة لمّ شمل العائلة من سوريا 2026: التقديم من دمشق وحلب — الأوراق والخطوات'
INTRO = ('صارت «لم شمل العائلة» ضمن فئات التأشيرات المقبولة في مركز طلبات التأشيرات التركية في '
         'سوريا، فأصبح التقديم ممكناً من دمشق وحلب بدل السفر إلى بيروت. هذا دليل ما يُطلب منك '
         'بالضبط، وكيف تُقدَّم، وما الفرق بين هذه التأشيرة وبين إقامة لمّ الشمل داخل تركيا.')

DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الجديد باختصار</strong></p>'
    '<p style="margin:0;">«لم شمل العائلة» صارت من فئات التأشيرات المقبولة في مركز طلبات '
    'التأشيرات التركية في سوريا، بمكتبَيه في <strong>دمشق</strong> و<strong>حلب</strong>. '
    'وكان الطريق المعتاد قبل ذلك هو السفر إلى <strong>بيروت</strong> للتقديم.</p></div>'

    '<h2>أوّلاً: تأشيرة أم إقامة؟ لا تخلط بينهما</h2>'
    '<p>هذان إجراءان مختلفان، ومن يخلط بينهما يضيّع وقته في المكان الخطأ:</p>'
    '<ul>'
    '<li><strong>تأشيرة لمّ شمل العائلة</strong> — تُطلب من <strong>سوريا</strong>، وتُدخلك '
    'تركيا. وهي موضوع هذه الصفحة.</li>'
    '<li><strong>إقامة لمّ الشمل (Aile İkamet İzni)</strong> — تُطلب من '
    '<strong>داخل تركيا</strong> لدى مديرية الهجرة بعد وصولك، وهي ما يتيح لك البقاء. '
    '<a href="/article/family-reunion">شروطها وإجراءاتها هنا</a>.</li>'
    '</ul>'
    '<p>فالترتيب: تأشيرة من سوريا ← دخول إلى تركيا ← طلب إقامة لمّ الشمل هناك.</p>'

    '<h2>أين تُقدَّم</h2>'
    '<p>عبر مركز طلبات التأشيرات الذي يخدم <strong>سفارة تركيا في دمشق</strong> و'
    '<strong>القنصلية العامة في حلب</strong>:</p>'
    '<ul>'
    '<li><strong>دمشق:</strong> مساكن برزة، أوتوستراد حاميش، مقابل مول قاسيون، رقم 4.</li>'
    '<li><strong>حلب:</strong> دوار المحافظة، زقاق سامح جبل، رقم 2، المحافظة.</li>'
    '<li><strong>الدوام:</strong> تقديم الطلبات من الأحد إلى الخميس 9:00–12:30 و13:30–14:30، '
    'وإيداع الجوازات من الأحد إلى الخميس 14:30–16:00. والجمعة عطلة.</li>'
    '</ul>'

    '<h2>الأوراق المطلوبة</h2>'
    '<h3>من مقدّم الطلب في سوريا</h3>'
    '<ul>'
    '<li>جواز سفر ساري ستّة أشهر على الأقلّ بعد تاريخ المغادرة المقصود، وفيه صفحتان فارغتان.</li>'
    '<li>صورتان بيومتريتان بخلفية بيضاء، لا يتجاوز عمرهما ستّة أشهر، مقاس 40×55 مم.</li>'
    '<li>استمارة طلب التأشيرة موقَّعة (متاحة ضمن الاستمارات القابلة للتنزيل).</li>'
    '<li>وثيقة السجل العدلي.</li>'
    '<li>سجلّ عائلي مع ترجمته.</li>'
    '<li>نسخة عن وثيقة العائلة.</li>'
    '</ul>'
    '<h3>ممّن يستضيفك في تركيا</h3>'
    '<ul>'
    '<li>دعوة من تركيا، وعنوان فيها (عقد إيجار أو ما يقوم مقامه).</li>'
    '<li>نسخ من الإقامة أو تصريح العمل للأقارب في تركيا.</li>'
    '</ul>'
    '<h3>الإثبات المالي</h3>'
    '<ul>'
    '<li>كشف حساب مصرفي <strong>بالنسخة الأصلية مختوماً وموقَّعاً</strong>، تظهر فيه حركة '
    'الحساب في الأشهر الثلاثة الأخيرة على الأقلّ.</li>'
    '<li>وبيان من صاحب العمل أو الشركة يتضمّن الاسم واللقب ورقم جواز السفر والمسمّى الوظيفي '
    'والراتب — أو إثبات ملكية شركة موثَّق لدى كاتب العدل.</li>'
    '</ul>'
    '<h3>وثائق تحسّن حال الطلب (اختيارية)</h3>'
    '<ul>'
    '<li>إن سبق لك السفر: نسخ صفحات جوازك القديم والجديد ذات الصلة.</li>'
    '<li>وثيقة ملكية عقار في تركيا إن وُجدت.</li>'
    '</ul>'

    '<div style="background:#fff7ed;border-right:4px solid #ea580c;padding:14px 18px;margin:18px 0;">'
    '<p style="margin:0 0 8px;"><strong>الأطفال والقاصرون — هنا يقع أكثر الرفض</strong></p>'
    '<p style="margin:0 0 8px;">الأطفال دون <strong>12 سنة</strong> لم يعودوا مطالَبين بالحضور '
    'شخصياً لتقديم الطلب. لكن إن لم يتقدّم الوالدان معاً، فيجب إحضار '
    '<strong>موافقة موثَّقة لدى كاتب العدل</strong> من ولي الأمر الغائب، وأن تشمل ثلاثة بنود '
    'بالتحديد:</p>'
    '<ul style="margin:0 0 8px;"><li>الإذن بالسفر.</li><li>الموافقة على التقديم للحصول على '
    'تأشيرة.</li><li>الموافقة على التقديم للإقامة في أي بلد آخر.</li></ul>'
    '<p style="margin:0;">وناقصُ أحد هذه البنود يُعامَل معاملة الموافقة المفقودة — فراجعها '
    'كلمةً كلمة قبل أن تدفع رسم النوتر.</p></div>'

    '<h2>تفاصيل تُسقط الطلبات</h2>'
    '<ul>'
    '<li><strong>الترجمة:</strong> تُقبل الترجمات المحلَّفة إلى <strong>التركية</strong> فقط. '
    'وأي وثيقة صادرة بلغة أخرى تُترجَم إلى التركية بمترجم محلَّف.</li>'
    '<li><strong>كشف الحساب:</strong> الأصل المختوم الموقَّع — لا صورة ولا نسخة مطبوعة من '
    'التطبيق.</li>'
    '<li><strong>الحجوزات:</strong> لا تشترِ تذاكر ولا فنادق قبل الموافقة. تُطلب حجوزات الطيران '
    'والفنادق <strong>بعد</strong> الموافقة على التأشيرة لا قبلها.</li>'
    '<li><strong>وللبعثة الدبلوماسية الحق</strong> في طلب معلومات أو وثائق إضافية — فالقائمة '
    'أعلاه حدّ أدنى لا سقف.</li>'
    '</ul>'

    '<div style="background:#eff6ff;border-right:4px solid #3b82f6;padding:14px 18px;margin:18px 0;">'
    '<p style="margin:0 0 8px;"><strong>ملاحظة تخصّ فئة أخرى، حتى لا تُنقل خطأً</strong></p>'
    '<p style="margin:0;">يرد في صفحة المركز شرطٌ يقول إنّ من لا يستوفي أحد شرطين يقدّم '
    '«فقط من مكتب بيروت». ذلك الشرط يخصّ <strong>تأشيرة الدراسة</strong> وحدها (تسجيل جامعي '
    'سابق، أو قبول نهائي لمن تخلّى عن الحماية المؤقتة)، ولا علاقة له بلمّ شمل العائلة. '
    '<a href="/article/turkey-study-visa-syrians-2026">تفصيل شرطَي تأشيرة الدراسة</a>.</p></div>'

    '<p style="margin-top:1.2rem;">وللسياق: '
    '<a href="/article/syria-turkey-visa-types-2026">أنواع التأشيرات التركية للسوريين ورسومها</a> • '
    '<a href="/article/family-reunion">إقامة لمّ الشمل داخل تركيا</a> • '
    '<a href="/article/syria-turkey-border-crossings-2026">العبور بين سوريا وتركيا</a></p>'
)

STEPS = [
    'تأكّد أولاً أنّ قريبك في تركيا يحمل وضعاً قانونياً سارياً (إقامة أو تصريح عمل) — نسخته '
    'من ضمن الأوراق المطلوبة، ولا طلب بدونها.',
    'اطلب منه الدعوة وعنوانه في تركيا (عقد الإيجار أو ما يقوم مقامه)، وكشف حسابه المصرفي '
    'الأصلي مختوماً وموقَّعاً.',
    'جهّز أوراقك في سوريا: الجواز والصور البيومترية والسجل العدلي والسجلّ العائلي ووثيقة العائلة.',
    'ترجم كل وثيقة غير تركية إلى التركية عند مترجم محلَّف — الترجمات بلغات أخرى لا تُقبل.',
    'إن كان بين المتقدّمين قاصر ولم يتقدّم الوالدان معاً: استخرج موافقة النوتر من الولي الغائب، '
    'وتحقّق أنّها تنصّ على السفر وعلى التأشيرة وعلى الإقامة في بلد آخر — الثلاثة معاً.',
    'احجز موعدك وقدّم الطلب في مكتب دمشق أو حلب ضمن ساعات التقديم (الأحد–الخميس).',
    'أودع جواز السفر في وقت الإيداع المحدَّد (14:30–16:00).',
    'وبعد الموافقة فقط: اشترِ تذاكر الطيران واحجز الفندق، فهي تُطلب في هذه المرحلة.',
    'وبعد وصولك تركيا: قدّم طلب إقامة لمّ الشمل لدى مديرية الهجرة — التأشيرة تُدخلك، والإقامة '
    'هي ما يُبقيك.',
]

TIPS = [
    'التأشيرة تُدخلك وحسب؛ البقاء يحتاج إقامة لمّ الشمل تُطلب داخل تركيا بعد الوصول.',
    'لا تشترِ تذكرة ولا تحجز فندقاً قبل الموافقة — تُطلب بعدها لا قبلها.',
    'كشف الحساب يجب أن يكون الأصل مختوماً وموقَّعاً، وبحركة ثلاثة أشهر على الأقلّ.',
    'الترجمة إلى التركية فقط وبمترجم محلَّف؛ الترجمة الإنجليزية لا تُغني.',
    'موافقة الولي الغائب تسقط إن نقصها بندٌ من الثلاثة — اقرأها قبل توقيع النوتر.',
    'شرط «مكتب بيروت» المنشور على صفحة المركز يخصّ تأشيرة الدراسة، لا لمّ الشمل.',
    'للبعثة أن تطلب وثائق إضافية؛ فالقائمة حدّ أدنى، واستيفاؤها لا يضمن الموافقة.',
]

DOCUMENTS = [
    'جواز سفر ساري ستّة أشهر بعد تاريخ المغادرة، وفيه صفحتان فارغتان',
    'صورتان بيومتريتان بخلفية بيضاء، عمرهما ستّة أشهر فأقلّ، مقاس 40×55 مم',
    'استمارة طلب التأشيرة موقَّعة',
    'وثيقة السجل العدلي',
    'سجلّ عائلي مع الترجمة، ونسخة عن وثيقة العائلة',
    'دعوة من تركيا وعنوان فيها (عقد إيجار أو ما يقوم مقامه)',
    'نسخ من إقامة أو تصريح عمل الأقارب في تركيا',
    'كشف حساب مصرفي أصلي مختوم وموقَّع بحركة ثلاثة أشهر على الأقلّ',
    'بيان من صاحب العمل يتضمّن الاسم ورقم الجواز والمسمّى الوظيفي والراتب، أو إثبات ملكية شركة موثَّق',
    'موافقة نوتر من الولي الغائب — إن وُجد قاصر ولم يتقدّم الوالدان معاً',
]

FEES = ('رسم التأشيرة يختلف بحسب الفئة ويُعلَن لدى مركز الطلبات — تحقّق من الرقم الساري قبل '
        'الذهاب. وتُضاف عليه كلفة الترجمة المحلَّفة وتصديق النوتر لموافقة الولي إن لزمت. '
        'ولا نشر رقماً هنا لأنّنا لم نجد تعرفةً رسمية منشورة نعتمدها.')

WARNING = ('استيفاء الأوراق لا يضمن الموافقة — وللبعثة الدبلوماسية أن تطلب وثائق إضافية. '
           'ولا تشترِ تذاكر أو حجوزات قبل صدور الموافقة. وانتبه أنّ هذه تأشيرة دخول: البقاء '
           'في تركيا يحتاج طلب إقامة لمّ الشمل لدى مديرية الهجرة بعد الوصول. '
           'ولا تدفع لوسيط يعدك بتسريع الطلب.')

SOURCE = ('مركز طلبات التأشيرات التركية في سوريا (sy.visafg.com) — صفحة الوثائق المطلوبة، '
          'قسم «لم شمل العائلة»، مُراجَعة في 6 آب/أغسطس 2026؛ والمركز يخدم سفارة تركيا في '
          'دمشق (damascus.be.mfa.gov.tr) والقنصلية العامة في حلب (halep-bk.mfa.gov.tr)')

TAGS = ['لم شمل العائلة', 'تأشيرة', 'دمشق', 'حلب', 'سوريا', 'دليل', '2026']

NEWS_TITLE = ('تركيا تقبل طلبات تأشيرة لمّ شمل العائلة من دمشق وحلب — بعد أن كان الطريق بيروت')
NEWS_SUMMARY = ('صارت «لم شمل العائلة» ضمن فئات التأشيرات المقبولة في مركز طلبات التأشيرات '
                'التركية في سوريا بمكتبَي دمشق وحلب، بعد أن كان التقديم يمرّ عبر بيروت. '
                'يهمّ هذا من له قريب في تركيا بإقامة أو تصريح عمل، أو زوج/زوجة تركي. '
                'وقائمة الأوراق والخطوات كاملةً في دليلنا — مع تنبيه أنّ شرط «مكتب بيروت» '
                'المنشور على الصفحة نفسها يخصّ تأشيرة الدراسة لا لمّ الشمل.')
NEWS_CONTENT = (
    '<p>أضاف مركز طلبات التأشيرات التركية في سوريا فئة <strong>«لم شمل العائلة»</strong> إلى '
    'الفئات المقبولة في مكتبَيه في <strong>دمشق</strong> و<strong>حلب</strong>، ونشر لها قائمة '
    'وثائق كاملة. وكان الطريق المعتاد قبل ذلك هو السفر إلى <strong>بيروت</strong> للتقديم.</p>'
    '<p>والمركز يخدم <strong>سفارة تركيا في دمشق</strong> و<strong>القنصلية العامة في حلب</strong>، '
    'وكلتاهما مرتبطة من صفحته الرسمية.</p>'
    '<h3>لمن يهمّ هذا؟</h3>'
    '<p>لمن له في تركيا قريبٌ ذو وضع قانوني ساري — إقامة أو تصريح عمل — أو زوج/زوجة يحمل '
    'الجنسية التركية. فمن ضمن الأوراق المطلوبة نسخةٌ من إقامة القريب أو تصريح عمله، ودعوةٌ '
    'منه وعنوانه في تركيا.</p>'
    '<div style="background:#fff7ed;border-right:4px solid #ea580c;padding:14px 18px;margin:16px 0;">'
    '<p style="margin:0 0 8px;"><strong>وتنبيه يمنع خطأً شائعاً في النقل</strong></p>'
    '<p style="margin:0;">ترد على صفحة المركز عبارة أنّ من لا يستوفي أحد شرطين يقدّم '
    '«فقط من مكتب بيروت». وهي تخصّ <strong>تأشيرة الدراسة</strong> وحدها — شرطاها تسجيل جامعي '
    'سابق، أو قبول نهائي لمن تخلّى عن الحماية المؤقتة — ولا تنطبق على لمّ شمل العائلة.</p></div>'
    '<h3>قبل أن تذهب</h3>'
    '<ul>'
    '<li>الترجمات المحلَّفة إلى <strong>التركية</strong> فقط.</li>'
    '<li>كشف الحساب المصرفي <strong>أصلاً</strong> مختوماً وموقَّعاً، بحركة ثلاثة أشهر على الأقلّ.</li>'
    '<li>لا تشترِ تذاكر ولا تحجز فندقاً قبل الموافقة — تُطلب بعدها.</li>'
    '<li>وإن كان بين المتقدّمين قاصر ولم يتقدّم الوالدان معاً، فموافقة النوتر من الولي الغائب '
    'يجب أن تنصّ على السفر وعلى التأشيرة وعلى الإقامة في بلد آخر — الثلاثة معاً.</li>'
    '</ul>'
    '<p><strong>وتذكّر الفرق:</strong> هذه <em>تأشيرة</em> تُدخلك تركيا. أمّا البقاء فيحتاج '
    '<em>إقامة لمّ الشمل</em> تُطلب لدى مديرية الهجرة بعد الوصول.</p>'
    '<p style="margin-top:1rem;"><a href="/article/%s"><strong>الدليل الكامل: الأوراق '
    'والخطوات وعناوين المكتبين وساعات الدوام ←</strong></a></p>' % SLUG
)

# ── the page that still points at Beirut ──────────────────────────────────
BEIRUT_NEW = (
    '<div style="background:#fff7ed;border:2px solid #ea580c;border-radius:12px;padding:18px 22px;margin:0 0 18px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>تحديث: بيروت لم تعد الطريق لمّ الشمل.</strong></p>'
    '<p style="margin:0;">صارت «لم شمل العائلة» ضمن فئات التأشيرات المقبولة في مركز طلبات '
    'التأشيرات التركية في سوريا، بمكتبَي <strong>دمشق</strong> و<strong>حلب</strong> — فلا داعي '
    'للسفر إلى لبنان لهذا الغرض. '
    '<a href="/article/%s" style="font-weight:bold;">الأوراق والخطوات وعناوين المكتبين ←</a></p></div>'
    '<p>وكانت هذه الصفحة تقول إنّ السفارة التركية في بيروت هي «المنفذ الرئيسي» للسوريين المقيمين '
    'في سوريا لمعاملات لمّ الشمل. صحّ ذلك في وقته ولم يعد صحيحاً، ونتركه مذكوراً هنا لأنّ كثيرين '
    'ما زالوا يبحثون عنه ويستحقّون أن يعرفوا أنّه تغيّر.</p>'
    '<p>ويبقى مسار بيروت قائماً لفئاتٍ أخرى وحالات لا يخدمها مكتبا دمشق وحلب — منها شرط '
    '<a href="/article/turkey-study-visa-syrians-2026">تأشيرة الدراسة</a> لمن لا يستوفي شرطَيها. '
    'فتحقّق من فئتك قبل أن تحجز سفراً.</p>'
) % SLUG

sql = """-- ============================================================================
-- تأشيرة لمّ شمل العائلة تُقبل من دمشق وحلب — والصفحة التي ما زالت تقول «بيروت»
-- ============================================================================
-- تحقّقتُ من sy.visafg.com/ar/re يوم 6 آب/أغسطس 2026. المركز يخدم بعثتين
-- رسميّتين مرتبطتين من تذييل صفحته: سفارة تركيا في دمشق
-- (damascus.be.mfa.gov.tr) والقنصلية العامة في حلب (halep-bk.mfa.gov.tr).
-- و«لم شمل العائلة» مدرجة بين فئاته بقائمة وثائق كاملة — والأهمّ، وهو ما وجب
-- فحصه قبل نشر أي شيء: قسم لمّ الشمل لا يحمل أي قيد بيروت.
--
-- ── ومزلقٌ يستحقّ التسجيل ───────────────────────────────────────────────
--
-- الصفحة تحوي فعلاً عبارة «إذا لم يستوفِ المتقدم واحداً على الأقل من الشرطين
-- المذكورين أعلاه، يمكنه التقديم فقط من خلال مكتب بيروت». ولو قُرئت خارج
-- سياقها لقلبت هذا الخبر إلى نقيضه. وسحبُ الأسطر المحيطة يُظهر أنّها تحت
-- تأشيرة الدراسة وتشير إلى شرطَين طلابيَّين (تسجيل جامعي سابق، أو قبول نهائي
-- لمن تخلّى عن الحماية المؤقتة). ولا تمسّ لمّ شمل العائلة. بحثٌ نصّي واحد كان
-- كفيلاً بنشر القصّة الخطأ.
--
-- ── وما هو أهمّ من الخبر ────────────────────────────────────────────────
--
-- صفحة turkish-embassy-beirut-family، 29 قراءة، طولها 137 حرفاً ومحتواها كلّه
-- جملة واحدة: «تُعتبر السفارة التركية في بيروت المنفذ الرئيسي للسوريين
-- المقيمين في سوريا لإجراء معاملات لم الشمل إلى تركيا». وهذا صار خطأً، وهو من
-- الخطأ المكلف: يُرسل أسرةً عبر حدود لأمرٍ صارت تفعله في مدينتها.
--
-- ── والثغرة ────────────────────────────────────────────────────────────
--
-- صفحة syria-turkey-visa-types-2026، 259 قراءة، تُعدّد سبع فئات تأشيرات
-- للسوريين، وليس لمّ شمل العائلة بينها. فهذا محتوى جديد لا تكرار: دليلُ
-- التأشيرات على الموقع تنقصه فئة ثامنة. والمقال المرافق واجبٌ بقائمة النشر
-- أصلاً — فهذا إجراء يفعله القارئ بنفسه، والخبر يُعلن والمقال يشرح.
--
-- والمقال يفصل ما يُخلط بينه دائماً:
--   • تأشيرة لمّ الشمل، تُطلب من سوريا، وتُدخلك؛
--   • إقامة لمّ الشمل (Aile İkamet İzni)، تُطلب لدى الهجرة بعد الوصول، وهي ما
--     تغطّيه صفحة family-reunion (77 قراءة).
-- ولم تكن أيٌّ منهما تذكر الأخرى.
--
-- آمن لإعادة التشغيل: ON CONFLICT للمقال، وWHERE NOT EXISTS للخبر.
-- ============================================================================

-- id IS the slug on this table — the same text value, and it is the primary
-- key. articles.slug carries no unique constraint of its own, so
-- `ON CONFLICT (slug)` fails with 42P10: there is no unique or exclusion
-- constraint matching the ON CONFLICT specification. CLAUDE.md documents the
-- right form in one line — «ON CONFLICT (id) DO UPDATE للمقالات» — and this
-- file did not follow it.
INSERT INTO articles (id, slug, title, intro, details, steps, tips, documents, fees, warning, source, tags, category, status, last_update)
VALUES ('%s', '%s', '%s', '%s', '%s', %s, %s, %s, '%s', '%s', '%s', %s, 'الفيزا والتأشيرات', 'approved', CURRENT_DATE)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, intro = EXCLUDED.intro, details = EXCLUDED.details,
    steps = EXCLUDED.steps, tips = EXCLUDED.tips, documents = EXCLUDED.documents,
    fees = EXCLUDED.fees, warning = EXCLUDED.warning, source = EXCLUDED.source,
    tags = EXCLUDED.tags, category = EXCLUDED.category, last_update = CURRENT_DATE;

-- الصفحة التي كانت ترسل القارئ إلى بيروت
UPDATE articles SET
    title = 'لمّ الشمل من سوريا: بيروت لم تعد الطريق — التقديم صار من دمشق وحلب',
    details = '%s',
    source = 'مركز طلبات التأشيرات التركية في سوريا (sy.visafg.com) — قسم «لم شمل العائلة»، مُراجَع في 6/8/2026',
    last_update = CURRENT_DATE
WHERE slug = 'turkish-embassy-beirut-family' AND details LIKE '%%المنفذ الرئيسي%%';

-- الفئة الثامنة الناقصة من دليل التأشيرات (259 قراءة)
UPDATE articles SET
    details = details || '%s',
    last_update = CURRENT_DATE
WHERE slug = 'syria-turkey-visa-types-2026' AND details NOT LIKE '%%لم شمل العائلة%%';

-- وصفحة إقامة لمّ الشمل (77 قراءة) لم تكن تقول كيف يصل القريب أصلاً
UPDATE articles SET
    details = details || '%s',
    last_update = CURRENT_DATE
WHERE slug = 'family-reunion' AND details NOT LIKE '%%family-reunion-visa-syria-2026%%';

INSERT INTO updates (type, title, summary, content, link, source_url, source_name, category, date, active, pinned)
SELECT 'news', '%s', '%s', '%s', '/article/%s',
       'https://sy.visafg.com/ar/re',
       'مركز طلبات التأشيرات التركية في سوريا — صفحة الوثائق المطلوبة، قسم «لم شمل العائلة» (يخدم سفارة تركيا في دمشق والقنصلية العامة في حلب)',
       'official', DATE '2026-08-06', true, true
WHERE NOT EXISTS (SELECT 1 FROM updates WHERE title = '%s');

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE bad int;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = '%s' AND status = 'approved') THEN
        RAISE EXCEPTION 'the guide was not created';
    END IF;
    SELECT count(*) INTO bad FROM updates u
     WHERE u.title = '%s'
       AND NOT EXISTS (SELECT 1 FROM articles a WHERE a.status = 'approved'
                        AND '/article/' || a.slug = u.link);
    IF bad > 0 THEN RAISE EXCEPTION 'the news links to an article that is not live'; END IF;
END
$check$;

SELECT 'guide created' AS البند, (count(*) = 1)::boolean AS سليم FROM articles WHERE slug = '%s' AND status = 'approved'
UNION ALL
SELECT 'beirut page corrected', (details LIKE '%%لم تعد الطريق%%') FROM articles WHERE slug = 'turkish-embassy-beirut-family'
UNION ALL
SELECT 'visa guide gained the 8th category', (details LIKE '%%لم شمل العائلة%%') FROM articles WHERE slug = 'syria-turkey-visa-types-2026'
UNION ALL
SELECT 'residence article links to the visa', (details LIKE '%%family-reunion-visa-syria-2026%%') FROM articles WHERE slug = 'family-reunion'
UNION ALL
SELECT 'news inserted once', (count(*) = 1)::boolean FROM updates WHERE title = '%s';
""" % (
    q(SLUG), q(SLUG), q(TITLE), q(INTRO), q(DETAILS), arr(STEPS), arr(TIPS), arr(DOCUMENTS),
    q(FEES), q(WARNING), q(SOURCE), arr(TAGS),
    q(BEIRUT_NEW),
    q('<div style="background:#ecfdf5;border-right:4px solid #10b981;padding:14px 18px;margin:18px 0;">'
      '<p style="margin:0 0 8px;"><strong>وفئة ثامنة أُضيفت: لم شمل العائلة</strong></p>'
      '<p style="margin:0;">لم تكن ضمن الأنواع السبعة أعلاه، وصارت مقبولةً في مكتبَي دمشق وحلب '
      'بعد أن كان الطريق بيروت. '
      '<a href="/article/' + SLUG + '" style="font-weight:bold;">الأوراق والخطوات ←</a></p></div>'),
    q('<div style="background:#eff6ff;border-right:4px solid #3b82f6;padding:14px 18px;margin:18px 0;">'
      '<p style="margin:0 0 8px;"><strong>وكيف يصل قريبك إلى تركيا أصلاً؟</strong></p>'
      '<p style="margin:0;">هذه الصفحة عن <strong>إقامة</strong> لمّ الشمل التي تُطلب من داخل '
      'تركيا. أمّا الدخول فيحتاج <strong>تأشيرة</strong> لمّ شمل العائلة، وصارت تُقدَّم من دمشق '
      'وحلب بعد أن كان الطريق بيروت — '
      '<a href="/article/' + SLUG + '" style="font-weight:bold;">أوراقها وخطواتها هنا</a>.</p></div>'),
    q(NEWS_TITLE), q(NEWS_SUMMARY), q(NEWS_CONTENT), q(SLUG), q(NEWS_TITLE),
    q(SLUG), q(NEWS_TITLE), q(SLUG), q(NEWS_TITLE),
)

path = os.path.join(REPO, 'sql', '2026-08-06_family_reunion_visa_syria.sql')
open(path, 'w', encoding='utf-8').write(sql)

_code = ' '.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('مقال جديد   : %s — %d حرفاً، %d خطوة، %d وثيقة، %d نصيحة'
      % (SLUG, len(DETAILS), len(STEPS), len(DOCUMENTS), len(TIPS)))
print('خبر         : مربوط بالمقال، مثبَّت (pinned)، ومصدره صفحة المركز')
print('بيروت       : الصفحة التي تقول «المنفذ الرئيسي» تُصحَّح وتُحيل إلى الجديد')
print('الفئة الثامنة: تُضاف إلى دليل التأشيرات (259 قراءة)')
print('الربط       : صفحة إقامة لمّ الشمل (77 قراءة) تُحيل إلى التأشيرة')
print('المزلق      : شرط «مكتب بيروت» يخصّ تأشيرة الدراسة — منصوصٌ عليه في الخبر والمقال')
print('quote parity:', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written     :', path, len(sql), 'chars')
