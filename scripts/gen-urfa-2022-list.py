# -*- coding: utf-8 -*-
"""A 2022 list published as 2026 advice, telling readers to avoid open housing.

Item 4 of the work order.

Three pages on this site answer "which Şanlıurfa neighbourhoods are closed to
foreigner address registration". The longest one — 15,861 characters, the
fullest writing of the three — answers 170. The other two answer 26, the zones
tool answers 26, and the /zones banner prints «أورفا (26 مغلق)».

The 170 page is not merely out of date. It is operative advice:

  steps[1]  «ابحث في قائمة هذا المقال … لو ظهر، الحي مغلق — لا تستأجر بنيّة الكيمليك»
  tips[0]   «احفظ هذا المقال على هاتفك — افتحه أمام المختار»
  الخلاصة   «تجنّب Akçakale و Eyyübiye و Haliliye … وفكّر جدياً في Karaköprü»

It tells the reader to use a list from 31 August 2022 as the decision rule for
signing a lease. Against the province's June 2026 list:

    القضاء        2022   مغلق اليوم
    Akçakale        41        7
    Eyyübiye        31        4
    Harran          27        1
    Haliliye        25        9
    Viranşehir      20        0   ← فُتح بالكامل
    Suruç            8        4
    Ceylanpınar      6        0   ← فُتح بالكامل
    Birecik          3        1
    Bozova           3        0   ← فُتح بالكامل
    Karaköprü        3        0   ← فُتح بالكامل
    Siverek          3        0   ← فُتح بالكامل
    Halfeti          1        0   ← فُتح بالكامل
    Hilvan           1        0   ← فُتح بالكامل
    ──────────────────────────────
    المجموع        172       26

A hundred and forty-six of them reopened. Seven of the thirteen districts are
now open end to end. The page names three districts to avoid and one to prefer;
the one it recommends, Karaköprü, is fully open — and so are six others it
never mentions as options.

WHAT THIS DOES NOT DO: delete the page. The 2022 Excel is still the operative
list in 61 of 63 provinces — only Şanlıurfa and Konya have published a revised
one — and this page carries the mechanism (the 25%→20% threshold, what the
muhtar does, the Yerleşim Yeri Belgesi chain) at a length the other two do not.
Deleting it would destroy writing to fix a frame. So the frame is what changes:
the page is re-dated in its title, opened with what was reopened, its per-
district headings show 2022→today, and every instruction that told the reader
to decide from the old list now sends them to the live checker instead.

Also corrected here: the national page sourced its 80% figure to a Facebook
post. UCSO reported it; the Ministry of the Interior review of 21 May 2026 and
the provincial directorate's list of 6 June are what decided it. The reporter
is named as a reporter.

The companion fix is in code, not SQL: src/app/zones/[slug]/page.tsx published
`dateModified: new Date()` in its Dataset structured data whenever no row
carried a reopening — which is 58 of the 63 provinces. Those pages told Google
their data was modified at that moment, refreshed every ten minutes, on rows
untouched since 5 January 2026.
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


# ── the live counts, read from the same table the tool reads ───────────────
zones = []
for off in range(0, 20000, 1000):
    r = urllib.request.Request(_URL + '/rest/v1/zones?select=city,district,status&order=district.asc',
                               headers=dict(_H, Range='%d-%d' % (off, off + 999)))
    part = json.load(urllib.request.urlopen(r))
    zones += part
    if len(part) < 1000:
        break
urfa = [z for z in zones if z['city'] == 'Şanlıurfa']
was, now = {}, {}
for z in urfa:
    was[z['district']] = was.get(z['district'], 0) + 1
    if z['status'] == 'closed':
        now[z['district']] = now.get(z['district'], 0) + 1
TOTAL_WAS, TOTAL_NOW = len(urfa), sum(now.values())
OPENED = TOTAL_WAS - TOTAL_NOW
FULLY_OPEN = sorted(d for d in was if now.get(d, 0) == 0)
assert TOTAL_WAS == 172 and TOTAL_NOW == 26, 'zones table moved: %d/%d' % (TOTAL_NOW, TOTAL_WAS)

ROWS = ''.join(
    '<tr><td>%s</td><td>%d</td><td>%s</td></tr>' % (
        d, was[d],
        ('<strong>%d</strong>' % now[d]) if now.get(d) else '<strong>لا شيء — فُتح بالكامل</strong>')
    for d in sorted(was, key=lambda k: -was[k]))

TOP = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 22px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>اقرأ هذا أوّلاً: القائمة أدناه قائمة 2022، '
    'وقد أُلغي معظمها.</strong></p>'
    '<p style="margin:0 0 10px;">في 6 حزيران/يونيو 2026 أصدرت مديرية الهجرة في شانلي أورفا قائمةً '
    'رسميةً جديدة، تنفيذاً لمراجعة وزارة الداخلية المعلَنة في 21 أيار/مايو 2026 بإعادة فتح الأحياء '
    'التي نزلت فيها نسبة المقيمين السوريين تحت 20%%. '
    'فمن أصل <strong>%d</strong> حياً في قائمة 2022 بقي <strong>%d</strong> حياً مغلقاً فقط — '
    'أي أنّ <strong>%d</strong> حياً أُعيد فتحها.</p>'
    '<p style="margin:0 0 10px;">و<strong>%d</strong> أقضية من أصل ثلاثة عشر صارت مفتوحة بالكامل: %s. '
    'ونصّ القائمة الرسمية نفسه يقول: '
    '«YUKARIDA İSMİ BULUNAN MAHALLELER HARİÇ İLDEKİ TÜM MAHALLELER İKAMETE AÇILMIŞTIR» — '
    'أي أنّ كل أحياء الولاية مفتوحة عدا المذكورة في تلك القائمة.</p>'
    '<p style="margin:0;"><strong>فلا تقرّر من هذه الصفحة.</strong> '
    '<a href="/zones/%s" style="color:#047857;font-weight:bold;">افتح حالة أحياء أورفا الحيّة ←</a> '
    ' أو اقرأ '
    '<a href="/article/urfa-closed-neighborhoods-list-2026" style="color:#047857;font-weight:bold;">'
    'القائمة الرسمية الجديدة (26 حياً)</a>. '
    'وتبقى هذه الصفحة منشورةً لأنّ قائمة 2022 ما زالت هي المعمول بها في ستّين ولايةً أخرى لم تصدر '
    'لها قائمة محدَّثة بعد، ولأنّها تشرح الآلية نفسها: متى يُغلق الحي، وماذا يفعل المختار، وكيف '
    'تُستخرج وثيقة العنوان.</p></div>'
) % (TOTAL_WAS, TOTAL_NOW, OPENED, len(FULLY_OPEN), '، '.join(FULLY_OPEN),
     urllib.parse.quote('Şanlıurfa', safe=''))

a = fetch('urfa-closed-neighborhoods-residence-2026')
D = a['details']
assert TOP[:60] not in D, 'correction block already applied'

# ── every place the page still decides for the reader ─────────────────────
# The needle runs to the closing </ul> on purpose. An earlier draft stopped at
# the fourth <li> and appended the table after a </ul>, which orphaned the fifth
# <li> — the one naming the source — inside a leftover list. Replacing a list
# means replacing the whole list.
_SRC_LI = ('    <li>المصدر: <a href="https://www.goc.gov.tr" target="_blank" rel="noopener noreferrer" '
           'style="color:#0369a1;font-weight:bold;">goc.gov.tr</a> — قائمة Excel رسمية بتاريخ 31/08/2022 '
           '(آخر قائمة شاملة منشورة)</li>')
NUM_OLD = (
    '    <li><strong>170</strong> حياً مغلقاً — الأعلى على مستوى تركيا</li>\n'
    '    <li><strong>13</strong> قضاءً من أصل 13 قضاءً في الولاية (لا قضاء يخلو من حي مغلق واحد على الأقلّ)</li>\n'
    '    <li><strong>Akçakale</strong> الأعلى بين الأقضية بـ41 حياً مغلقاً (قضاء حدودي مباشر مع سوريا)</li>\n'
    '    <li><strong>Karaköprü</strong> الأقلّ كثافة إغلاق بين الأقضية الرئيسية بـ3 أحياء فقط — وهو غالباً الخيار الأنسب للسوريين الباحثين عن منطقة صالحة للتسجيل</li>\n'
    + _SRC_LI + '\n  </ul>'
)
NUM_NEW = (
    '    <li>قائمة 2022 ضمّت <strong>%d</strong> حياً مغلقاً موزّعة على ثلاثة عشر قضاءً — وكانت أورفا حينها الأعلى في تركيا</li>\n'
    '    <li>وقائمة 6 حزيران/يونيو 2026 أبقت <strong>%d</strong> حياً مغلقاً فقط، فأعادت فتح <strong>%d</strong></li>\n'
    '    <li>و<strong>%d</strong> أقضية صارت مفتوحة بالكامل: %s</li>\n'
    + _SRC_LI + '\n'
    '    <li>والقائمة النافذة اليوم: مديرية الهجرة في شانلي أورفا، 6/6/2026</li>\n  </ul>\n'
    '  <table style="width:100%%;border-collapse:collapse;margin-top:14px;font-size:15px;">\n'
    '    <thead><tr><th style="text-align:right;padding:6px 8px;">القضاء</th>'
    '<th style="text-align:right;padding:6px 8px;">في قائمة 2022</th>'
    '<th style="text-align:right;padding:6px 8px;">مغلق اليوم</th></tr></thead>\n'
    '    <tbody>' + ROWS + '</tbody>\n  </table>'
) % (TOTAL_WAS, TOTAL_NOW, OPENED, len(FULLY_OPEN), '، '.join(FULLY_OPEN))
assert D.count(NUM_OLD) == 1, 'numbers block moved'

HEADS = [
    ('<h3>🔴 Akçakale (41 حي مغلق) — أعلى كثافة إغلاق</h3>',
     '<h3>Akçakale — كان 41 حياً مغلقاً في 2022، والمغلق اليوم %d</h3>' % now.get('Akçakale', 0)),
    ('<h3>🟠 Eyyübiye (31 حي مغلق) — مركز المدينة القديم</h3>',
     '<h3>Eyyübiye — كان 31 حياً مغلقاً في 2022، والمغلق اليوم %d</h3>' % now.get('Eyyübiye', 0)),
    ('<h3>🟠 Harran (26 حي مغلق) — قضاء ريفي زراعي</h3>',
     '<h3>Harran — كان 27 حياً مغلقاً في 2022، والمغلق اليوم %d</h3>' % now.get('Harran', 0)),
    ('<h3>🟠 Haliliye (25 حي مغلق) — وسط المدينة الحديث</h3>',
     '<h3>Haliliye — كان 25 حياً مغلقاً في 2022، والمغلق اليوم %d — وهو أكثر الأقضية إغلاقاً الآن</h3>'
     % now.get('Haliliye', 0)),
    ('<h3>🟢 Karaköprü (3 أحياء مغلقة فقط) — الخيار الأفضل اليوم</h3>',
     '<h3>Karaköprü — كانت 3 أحياء مغلقة في 2022، والقضاء اليوم مفتوح بالكامل</h3>'),
    ('<h3>🟡 Viranşehir (20 حي مغلق) — قضاء كبير شمال شرق</h3>',
     '<h3>Viranşehir — كان 20 حياً مغلقاً في 2022، والقضاء اليوم مفتوح بالكامل</h3>'),
]
for old, _ in HEADS:
    assert D.count(old) == 1, 'heading moved: %r' % old[:40]

CONC_OLD = ('<p>شانلي أورفا تحتلّ المركز الأوّل في تركيا بعدد الأحياء المغلقة أمام تسجيل إقامة '
            'الأجانب (170 حياً). إن كنت سورياً تبحث عن سكن جديد في الولاية، <strong>تجنّب Akçakale '
            'و Eyyübiye و Haliliye للأحياء المُدرجة أعلاه، وافحص قائمة Harran و Viranşehir بدقّة، '
            'وفكّر جدياً في Karaköprü</strong> حيث يبقى الإغلاق محصوراً في 3 أحياء فقط.</p>')
CONC_NEW = ('<p>كانت أورفا أعلى ولايات تركيا إغلاقاً بـ%d حياً في قائمة 2022. ولم تعد كذلك: '
            'المغلق اليوم %d حياً، وأثقل الأقضية صار Haliliye بـ%d ثم Akçakale بـ%d، '
            'و%d أقضية مفتوحة بالكامل.</p>'
            '<p><strong>ولا تبنِ قرار سكنك على هذه الصفحة ولا على أي قائمة مطبوعة.</strong> '
            'افحص اسم الحي بالتحديد في '
            '<a href="/zones/%s" style="font-weight:bold;">صفحة أحياء أورفا الحيّة</a>، '
            'ثمّ أكّده عند المختار قبل التوقيع. فالمختار هو المرجع الإداري الأخير، وربع ساعة من '
            'السؤال توفّر عليك شهوراً.</p>') % (
    TOTAL_WAS, TOTAL_NOW, now.get('Haliliye', 0), now.get('Akçakale', 0), len(FULLY_OPEN),
    urllib.parse.quote('Şanlıurfa', safe=''))
assert D.count(CONC_OLD) == 1, 'conclusion moved'

STEP1_OLD = ('2️⃣ ابحث في قائمة هذا المقال — افتح القضاء المعني أعلاه. ابحث عن اسم الحي. '
             'لو ظهر، الحي مغلق — لا تستأجر بنيّة الكيمليك.')
STEP1_NEW = ('2️⃣ افحص الاسم في القائمة الحيّة لا في هذه الصفحة — افتح /zones/Şanlıurfa وابحث عن '
             'اسم الحي. القائمة أدناه قائمة 2022 وقد فُتح %d حياً منها؛ ظهور الاسم فيها لا يعني '
             'أنّه مغلق اليوم.') % OPENED
TIP0_OLD = 'احفظ هذا المقال على هاتفك — افتحه أمام المختار للتأكيد المزدوج'
TIP0_NEW = ('احفظ رابط /zones/Şanlıurfa على هاتفك لا قائمة 2022 — الأولى تتحدّث والثانية لا')
TIP2_OLD = 'Karaköprü أفضل خيار للسوريين الذين يبحثون عن مرونة في اختيار الحي'
TIP2_NEW = ('Karaköprü وViranşehir وCeylanpınar وBozova وSiverek وHalfeti وHilvan مفتوحة بالكامل '
            'اليوم — لم يعد الخيار محصوراً في قضاء واحد')
steps, tips = list(a['steps'] or []), list(a['tips'] or [])
assert steps[1] == STEP1_OLD, 'steps[1] moved: %r' % steps[1][:60]
assert tips[0] == TIP0_OLD and tips[2] == TIP2_OLD, 'tips moved'
steps[1], tips[0], tips[2] = STEP1_NEW, TIP0_NEW, TIP2_NEW

rep = "'%s' || details" % q(TOP)
for old, new in [(NUM_OLD, NUM_NEW), (CONC_OLD, CONC_NEW)] + HEADS:
    rep = "replace(%s, '%s', '%s')" % (rep, q(old), q(new))

WARN = ('القائمة المفصَّلة في هذه الصفحة صادرة في 31/08/2022، وقد فُتح %d حياً منها بقائمة '
        'مديرية الهجرة في أورفا الصادرة في 6 حزيران/يونيو 2026 — فلم يبق مغلقاً إلا %d. '
        'فلا تستعملها لتقرّر أين تسكن؛ استعملها لتفهم الآلية، وافحص الاسم في صفحة أحياء أورفا '
        'الحيّة. والمختار هو المرجع الإداري الأخير وقراره ينفذ.') % (OPENED, TOTAL_NOW)

SQL = ["""UPDATE articles SET
    title = 'أحياء شانلي أورفا المغلقة: قائمة 2022 الكاملة (%d حياً) — وما بقي منها اليوم %d',
    details = %s,
    steps = %s,
    tips = %s,
    warning = '%s',
    source = 'قائمة Excel الرسمية «Kapalı Mahalleler» على goc.gov.tr بتاريخ 31/08/2022 (القائمة الشاملة الأخيرة) + قائمة مديرية الهجرة في شانلي أورفا الصادرة في 6/6/2026 + مراجعة وزارة الداخلية المعلَنة في 21/5/2026',
    last_update = CURRENT_DATE
WHERE slug = 'urfa-closed-neighborhoods-residence-2026';""" % (
    TOTAL_WAS, TOTAL_NOW, rep, arr(steps), arr(tips), q(WARN))]

# ── the national page: a Facebook post is the reporter, not the decision ──
b = fetch('closed-neighborhoods-80-percent-reduction-2026')
assert 'facebook.com' in (b['source'] or ''), 'sourcing already changed'
SQL.append("""UPDATE articles SET
    source = 'مراجعة وزارة الداخلية التركية المعلَنة في 21/5/2026 + القوائم الولائية الصادرة عن مديريات الهجرة (أورفا 6/6/2026، قونيا) — نقلها اتحاد منظمات المجتمع المدني للتنمية (UCSO) في 6/6/2026',
    last_update = CURRENT_DATE
WHERE slug = 'closed-neighborhoods-80-percent-reduction-2026';""")

c = fetch('urfa-closed-neighborhoods-list-2026')
assert 'UCSO' in (c['source'] or ''), 'urfa-list sourcing already changed'
SQL.append("""UPDATE articles SET
    source = 'مديرية الهجرة في شانلي أورفا — القائمة الرسمية الصادرة في 6/6/2026، تنفيذاً لمراجعة وزارة الداخلية المعلَنة في 21/5/2026؛ نقلها اتحاد منظمات المجتمع المدني للتنمية (UCSO)',
    last_update = CURRENT_DATE
WHERE slug = 'urfa-closed-neighborhoods-list-2026';""")

HEADER = """-- ============================================================================
-- قائمةُ 2022 تُنشَر نصيحةَ 2026، فتُبعد القارئ عن سكن مفتوح
-- ============================================================================
-- البند الرابع من أمر العمل.
--
-- ثلاث صفحات على الموقع تجيب سؤال «أي أحياء أورفا مغلقة أمام تسجيل عناوين
-- الأجانب». أطولها — 15,861 حرفاً، وأوفاها كتابةً — تجيب 170. والاثنتان
-- الأخريان تجيبان 26، وأداة /zones تجيب 26، وشريط الصفحة يطبع «أورفا (26 مغلق)».
--
-- وليست الصفحة قديمةً فحسب، بل هي نصيحةٌ عاملة:
--
--   steps[1]  «ابحث في قائمة هذا المقال … لو ظهر، الحي مغلق — لا تستأجر»
--   tips[0]   «احفظ هذا المقال على هاتفك — افتحه أمام المختار»
--   الخلاصة   «تجنّب Akçakale و Eyyübiye و Haliliye … وفكّر جدياً في Karaköprü»
--
-- أي أنّها تطلب من القارئ أن يقرّر توقيع عقد إيجاره بقائمةٍ من 31 آب 2022.
-- ومقابلتها بقائمة الولاية الصادرة في 6 حزيران 2026:
--
--     القضاء        2022   مغلق اليوم
--     Akçakale        41        7
--     Eyyübiye        31        4
--     Harran          27        1
--     Haliliye        25        9
--     Viranşehir      20        0   ← فُتح بالكامل
--     Suruç            8        4
--     Ceylanpınar      6        0   ← فُتح بالكامل
--     Birecik          3        1
--     Bozova           3        0   ← فُتح بالكامل
--     Karaköprü        3        0   ← فُتح بالكامل
--     Siverek          3        0   ← فُتح بالكامل
--     Halfeti          1        0   ← فُتح بالكامل
--     Hilvan           1        0   ← فُتح بالكامل
--     ──────────────────────────────
--     المجموع        172       26
--
-- مئةٌ وستّةٌ وأربعون حياً أُعيد فتحها. وسبعةٌ من ثلاثة عشر قضاءً صارت مفتوحة
-- من طرفها إلى طرفها. والصفحة تسمّي ثلاثة أقضية «تجنّبها» وقضاءً واحداً
-- تنصح به — والذي تنصح به، Karaköprü، مفتوحٌ بالكامل، ومثله ستّة لا تذكرها
-- خياراً أصلاً.
--
-- ── وما لا يفعله هذا الملف: حذف الصفحة ─────────────────────────────────
--
-- إكسل 2022 ما زالت هي القائمة المعمول بها في إحدى وستّين ولاية من ثلاث
-- وستّين — لم تصدر قائمة محدَّثة إلا لأورفا وقونيا — وهذه الصفحة تشرح الآلية
-- نفسها (عتبة 25% ثمّ 20%، وماذا يفعل المختار، وسلسلة وثيقة العنوان) بطولٍ
-- لا تبلغه الأخريان. فحذفها إتلافُ كتابةٍ لإصلاح إطار. الإطار هو ما يتغيّر:
-- التاريخ يدخل العنوان، وتُفتتح الصفحة بما أُعيد فتحه، وعناوين الأقضية تعرض
-- «2022 ← اليوم»، وكل تعليمةٍ كانت تطلب القرار من القائمة القديمة صارت تحيل
-- إلى الفاحص الحيّ.
--
-- ── ويُصحَّح معها الإسناد ───────────────────────────────────────────────
--
-- الصفحة الوطنية أسندت رقم الـ80% إلى منشور فيسبوك. اتحاد UCSO نقلَه؛ والذي
-- قرّره مراجعةُ وزارة الداخلية في 21 أيار 2026 وقائمةُ مديرية الهجرة في
-- 6 حزيران. فالناقل يُسمّى ناقلاً.
--
-- ── والإصلاح المرافق في الشيفرة لا في SQL ──────────────────────────────
--
-- src/app/zones/[slug]/page.tsx كانت تنشر dateModified = new Date() في بيانات
-- Dataset المهيكلة كلّما خلت صفوف الولاية من تاريخ إعادة فتح — وهي 58 ولاية من
-- 63. أي أنّ ثمانياً وخمسين صفحة كانت تخبر جوجل أنّ بياناتها عُدِّلت هذه اللحظة،
-- وتُحدِّث ذلك كل عشر دقائق، عن صفوفٍ لم تُمَسّ منذ 5 كانون الثاني 2026.
-- إشارةُ حداثةٍ ملفَّقة في حقلٍ يقرؤه الزاحف آلياً — وهو أسوأ موضع لها.
--
-- آمن لإعادة التشغيل.
-- ============================================================================

"""

VERIFY = """
-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — كل صفّ true
SELECT 'urfa-2022 reframed' AS البند,
       (title LIKE '%%قائمة 2022%%'
        AND details LIKE '%%اقرأ هذا أوّلاً%%'
        AND details NOT LIKE '%%تجنّب Akçakale%%'
        AND details NOT LIKE '%%الخيار الأفضل اليوم%%') AS سليم
FROM articles WHERE slug = 'urfa-closed-neighborhoods-residence-2026'
UNION ALL
SELECT 'urfa-2022 steps/tips',
       (array_to_string(steps, ' ') NOT LIKE '%%ابحث في قائمة هذا المقال%%'
        AND array_to_string(tips, ' ') NOT LIKE '%%احفظ هذا المقال على هاتفك%%')
FROM articles WHERE slug = 'urfa-closed-neighborhoods-residence-2026'
UNION ALL
SELECT 'national page off facebook', (source NOT LIKE '%%facebook%%')
FROM articles WHERE slug = 'closed-neighborhoods-80-percent-reduction-2026'
UNION ALL
SELECT 'no page claims 170 closed now', (count(*) = 0)::boolean FROM articles
  WHERE status = 'approved' AND title LIKE '%%170 حي)%%';
"""

sql = HEADER + '\n\n'.join(SQL) + '\n' + VERIFY
path = os.path.join(REPO, 'sql', '2026-08-06_urfa_2022_list_reframe.sql')
open(path, 'w', encoding='utf-8').write(sql)

print('أورفا 2022 : %d حياً  →  المغلق اليوم %d  (أُعيد فتح %d)' % (TOTAL_WAS, TOTAL_NOW, OPENED))
print('أقضية فُتحت بالكامل : %d — %s' % (len(FULLY_OPEN), '، '.join(FULLY_OPEN)))
print('عناوين أقضية مصحَّحة : %d' % len(HEADS))
print('خطوات/نصائح مصحَّحة  : steps[1], tips[0], tips[2]')
print('إسناد مصحَّح         : صفحتان (فيسبوك → وزارة الداخلية + المديرية الولائية)')
print('quote parity        :', 'OK' if re.sub(r"''", '', sql).count("'") % 2 == 0 else '*** BROKEN ***')
print('written             :', path, len(sql), 'chars')
