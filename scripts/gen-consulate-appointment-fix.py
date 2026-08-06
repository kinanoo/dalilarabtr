# -*- coding: utf-8 -*-
"""Step one says «visit the consulate website». There is no website.

Item 8 of the work order. syrian-consulate-appointment, 104 views.

The page contradicts itself inside one screen. The body says booking is through
the app and only the app — «يجب الحجز عبر التطبيق حصرا» — and links the Play
Store. Then the steps open with:

    steps[0]  «الدخول للمنصة: قم بزيارة موقع القنصلية الإلكتروني.»
    tips[0]   «تابع الموقع باستمرار»

A website the body says is not the channel, that the row never names, and that
does not exist. A reader who follows step one has nowhere to go, and the page is
104 views of a procedure whose first instruction is a dead end.

Confirmed while checking: MOFA SY is the sole official channel for consular
appointments; there is no web booking platform to name.

AND THE GAP NOBODY LOGGED. The row carried one download link — Google Play.
Every iPhone reader had no path at all. The App Store listing does exist and was
verified through Apple's own lookup API rather than a search page:

    MOFA SY — id6755138946 — bundle app.mofa.sy — v3.0.2, updated 2026-05-14
    seller: EMBASSY OF THE SYRIAN ARAB REPUBLIC IN DOHA

That seller string is worth publishing on its own. The page already warns about
fake links and brokers but gives the reader no way to tell a real listing from a
counterfeit. The publisher name is that way, and it is the kind of detail a
counterfeit cannot copy. Note the bundle ids differ by platform — app.mofa.sy on
iOS, sy.mofa.app on Android — which looks wrong at a glance and is not; saying so
stops a cautious reader from rejecting the genuine app.

Also fixed: «المنصة الإلكترونية الرسميةالتابعة» (missing space) and «حصرا..»
(double period) — small, but on a 104-view page they read as carelessness right
where the page is asking to be trusted about fraud.
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
    return json.load(urllib.request.urlopen(urllib.request.Request(u, headers=_H)))[0]


def q(s):
    return str(s if s is not None else '').replace("'", "''")


def arr(items):
    return 'ARRAY[%s]::text[]' % ', '.join("'%s'" % q(x) for x in items)


a = fetch('syrian-consulate-appointment')
D = a['details']

OLD = ('<p>اعتباراً من عام 2024-2026، تم حصر حجز المواعيد في القنصلية السورية العامة في إسطنبول '
       'عبر المنصة الإلكترونية الرسميةالتابعة لوزارة الخارجية والمغتربين. لا يمكن الدخول للقنصلية '
       'بدون موعد مسبق، ويجب الحجز عبر التطبيق حصرا.. وهذا رابط تحميل التطبيق<br>'
       '<a target="_blank" rel="noopener noreferrer" class="text-emerald-600 underline" '
       'href="https://play.google.com/store/apps/details?id=sy.mofa.app&amp;hl=ar">'
       'https://play.google.com/store/apps/details?id=sy.mofa.app&amp;hl=ar</a></p>')
assert D.count(OLD) == 1, 'the app paragraph moved'

NEW = (
    '<p>حجز المواعيد في القنصلية السورية العامة في إسطنبول محصورٌ في التطبيق الرسمي '
    '<strong>MOFA SY</strong> التابع لوزارة الخارجية والمغتربين. ولا يمكن الدخول إلى القنصلية '
    'بلا موعد مسبق.</p>'
    '<p><strong>ولا يوجد موقع إلكتروني للحجز.</strong> نقولها صراحةً لأنّ كثيراً ممّا يُنشر — '
    'وهذه الصفحة نفسها كانت منه — يطلب منك «زيارة موقع القنصلية». لا تبحث عن موقع، ولا تُدخل '
    'بياناتك في أي صفحة تدّعي أنّها منصّة الحجز. القناة واحدة: التطبيق.</p>'
    '<h3>تحميل التطبيق</h3>'
    '<ul>'
    '<li><strong>أندرويد:</strong> <a target="_blank" rel="noopener noreferrer" '
    'class="text-emerald-600 underline" '
    'href="https://play.google.com/store/apps/details?id=sy.mofa.app&amp;hl=ar">'
    'متجر Google Play</a></li>'
    '<li><strong>آيفون:</strong> <a target="_blank" rel="noopener noreferrer" '
    'class="text-emerald-600 underline" '
    'href="https://apps.apple.com/tr/app/mofa-sy/id6755138946">App Store</a></li>'
    '</ul>'
    '<div style="background:#fff7ed;border-right:4px solid #ea580c;padding:14px 18px;margin:16px 0;">'
    '<p style="margin:0 0 8px;"><strong>كيف تتأكّد أنّ التطبيق هو الأصلي؟</strong></p>'
    '<p style="margin:0 0 8px;">لا تكتفِ بالاسم — التطبيقات المزيّفة تنسخ الاسم والأيقونة. '
    'انظر إلى <strong>اسم الناشر</strong> في صفحة المتجر: النسخة الرسمية منشورة باسم سفارة '
    'الجمهورية العربية السورية (<span dir="ltr">EMBASSY OF THE SYRIAN ARAB REPUBLIC</span>). '
    'وإن رأيت ناشراً باسم شخص أو شركة وسيطة فليس هو.</p>'
    '<p style="margin:0;">وملاحظة تربك بعض المتنبّهين: معرّف التطبيق يختلف بين النظامين — '
    '<span dir="ltr">app.mofa.sy</span> على آيفون و<span dir="ltr">sy.mofa.app</span> على '
    'أندرويد. هذا طبيعي ولا يدلّ على تزوير.</p></div>'
)
assert 'apps.apple.com' not in D, 'the iOS link is already there'

STEPS = [
    'حمّل تطبيق MOFA SY من متجر هاتفك — ولا تبحث عن «موقع» للحجز، فلا وجود له.',
    'تحقّق قبل التثبيت أنّ الناشر هو سفارة الجمهورية العربية السورية، لا شخصاً ولا وسيطاً.',
    'أنشئ حسابك داخل التطبيق واستكمل بياناتك.',
    'اختر البعثة (إسطنبول أو غازي عنتاب) ثم نوع المعاملة: جواز سفر، تصديق، وكالة…',
    'ابحث عن المواعيد المتاحة وأكّد الحجز.',
    'احفظ إيصال الموعد واطبعه، واحتفظ بنسخة على هاتفك لإبرازها عند الدخول.',
    'احضر قبل الموعد بخمس عشرة دقيقة — التأخّر قد يُلغي الموعد.',
]

TIPS = [
    'المواعيد تُفتح في أوقات غير معلَنة — فعّل تنبيهات التطبيق وتابعه، لا موقعاً.',
    'الحجز مجاني رسمياً؛ ومن يطلب مالاً مقابل «تدبير موعد» فهو وسيط لا صفة له.',
    'اسم الناشر في المتجر هو ما يميّز التطبيق الأصلي عن المزيّف — لا الاسم ولا الأيقونة.',
    'اختلاف معرّف التطبيق بين آيفون وأندرويد طبيعي، فلا ترفض النسخة الصحيحة بسببه.',
    'إن كنت في جنوب تركيا فراجع قنصلية غازي عنتاب — نفس التطبيق، وازدحام أقلّ غالباً.',
    'جهّز أوراق معاملتك قبل الموعد؛ الموعد لا يُمدَّد ولا يُعوَّض بسهولة.',
]

SOURCE = ('وزارة الخارجية والمغتربين — الجمهورية العربية السورية (mofaex.gov.sy) + '
          'صفحة التطبيق الرسمي MOFA SY على متجري Google Play (sy.mofa.app) و'
          'App Store (id6755138946، الناشر: سفارة الجمهورية العربية السورية)')

TAGS = ['consulate', 'قنصلية', 'حجز موعد', 'MOFA SY', 'جواز سفر سوري', 'إسطنبول', '2026']

sql = """-- ============================================================================
-- الخطوة الأولى تقول «زُر موقع القنصلية». ولا موقع.
-- ============================================================================
-- البند الثامن من أمر العمل. صفحة syrian-consulate-appointment، 104 قراءات.
--
-- الصفحة تناقض نفسها في شاشةٍ واحدة. المتن يقول إنّ الحجز عبر التطبيق وحده —
-- «يجب الحجز عبر التطبيق حصرا» — ويضع رابط متجر Play. ثمّ تبدأ الخطوات بـ:
--
--     steps[0]  «الدخول للمنصة: قم بزيارة موقع القنصلية الإلكتروني.»
--     tips[0]   «تابع الموقع باستمرار»
--
-- موقعٌ يقول المتن إنّه ليس القناة، ولا يسمّيه الصفّ في أي حقل، ولا وجود له.
-- ومن يتبع الخطوة الأولى لا يجد إلى أين يذهب — وهي 104 قراءات لإجراءٍ أولى
-- تعليماته طريقٌ مسدود.
--
-- وتأكّد أثناء الفحص أنّ MOFA SY هو القناة الرسمية الوحيدة للمواعيد القنصلية،
-- فلا منصّة ويب تُسمّى أصلاً.
--
-- ── والثغرة التي لم يسجّلها أحد ────────────────────────────────────────
--
-- الصفّ يحمل رابط تحميل واحداً: Google Play. فكلّ قارئ يحمل آيفون كان بلا
-- طريق إطلاقاً. وصفحة App Store موجودة فعلاً، وتحقّقتُ منها عبر واجهة البحث
-- الرسمية لدى Apple لا عبر صفحة نتائج:
--
--     MOFA SY — id6755138946 — المعرّف app.mofa.sy — الإصدار 3.0.2، محدَّث
--     في 14/5/2026 — الناشر: EMBASSY OF THE SYRIAN ARAB REPUBLIC IN DOHA
--
-- واسم الناشر هذا يستحقّ النشر بذاته. الصفحة تحذّر من الروابط المزيّفة ومن
-- السماسرة، ولا تعطي القارئ وسيلةً واحدة ليميّز الأصلي من المقلَّد. اسم الناشر
-- هو تلك الوسيلة، وهو ممّا لا يستطيع المقلِّد نسخه. ونضيف ملاحظة تمنع رفضاً
-- في محلّه الخطأ: معرّف التطبيق يختلف بين النظامين (app.mofa.sy على آيفون
-- وsy.mofa.app على أندرويد) — وهذا طبيعي لا دليل تزوير.
--
-- ويُصلَح كذلك: «المنصة الإلكترونية الرسميةالتابعة» (مسافة ناقصة) و«حصرا..»
-- (نقطتان). صغيران، لكنّهما على صفحةٍ بـ104 قراءات يُقرآن إهمالاً في الموضع
-- الذي تطلب فيه الصفحة أن يُوثَق بها في أمر الاحتيال.
--
-- آمن لإعادة التشغيل. لا يحتاج نشر شيفرة.
-- ============================================================================

UPDATE articles SET
    details = replace(details, '%s', '%s'),
    steps = %s,
    tips = %s,
    source = '%s',
    tags = %s,
    warning = '%s',
    last_update = CURRENT_DATE
WHERE slug = 'syrian-consulate-appointment'
  AND details NOT LIKE '%%apps.apple.com%%';

-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — كل صفّ true
SELECT 'no more phantom website' AS البند,
       (array_to_string(steps, ' ') NOT LIKE '%%زيارة موقع القنصلية%%'
        AND array_to_string(tips, ' ') NOT LIKE '%%تابع الموقع%%'
        AND details LIKE '%%ولا يوجد موقع إلكتروني للحجز%%') AS سليم
FROM articles WHERE slug = 'syrian-consulate-appointment'
UNION ALL
SELECT 'iPhone readers have a link',
       (details LIKE '%%apps.apple.com%%' AND details LIKE '%%play.google.com%%')
FROM articles WHERE slug = 'syrian-consulate-appointment'
UNION ALL
SELECT 'publisher name published as the anti-fake check',
       (details LIKE '%%EMBASSY OF THE SYRIAN ARAB REPUBLIC%%')
FROM articles WHERE slug = 'syrian-consulate-appointment'
UNION ALL
SELECT 'typos fixed',
       (details NOT LIKE '%%الرسميةالتابعة%%' AND details NOT LIKE '%%حصرا..%%')
FROM articles WHERE slug = 'syrian-consulate-appointment'
UNION ALL
SELECT 'the Gaziantep link is a live article', (count(*) = 1)::boolean
FROM articles WHERE slug = 'syrian-consulate-gaziantep-guide' AND status = 'approved';
""" % (q(OLD), q(NEW), arr(STEPS), arr(TIPS), q(SOURCE), arr(TAGS),
       q('لا يوجد موقع إلكتروني لحجز المواعيد — القناة الرسمية الوحيدة تطبيق MOFA SY. '
         'فلا تُدخل بياناتك في أي صفحة تدّعي أنّها منصّة الحجز، وتحقّق من اسم الناشر في '
         'المتجر قبل التثبيت. والحجز مجاني: من يطلب مالاً مقابل موعد فهو وسيط لا صفة له. '
         'واحضر قبل موعدك بخمس عشرة دقيقة، فالتأخّر قد يُلغيه.'))

path = os.path.join(REPO, 'sql', '2026-08-06_consulate_appointment_channel.sql')
open(path, 'w', encoding='utf-8').write(sql)

_code = ' '.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('الموقع الوهمي : يُحذف من steps[0] وtips[0]، ويُقال صراحةً إنّه لا وجود له')
print('رابط آيفون    : يُضاف (id6755138946، مؤكَّد من واجهة Apple الرسمية)')
print('فحص التزوير   : اسم الناشر يُنشر — الصفحة كانت تحذّر بلا وسيلة تحقّق')
print('التباس المعرّف : يُشرَح (app.mofa.sy مقابل sy.mofa.app) كي لا يُرفض الأصلي')
print('خطوات : %d ← %d  |  نصائح : %d ← %d  |  وسوم : %d ← %d'
      % (len(a['steps'] or []), len(STEPS), len(a['tips'] or []), len(TIPS),
         len(a['tags'] or []), len(TAGS)))
print('quote parity  :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written       :', path, len(sql), 'chars')
