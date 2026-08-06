# -*- coding: utf-8 -*-
"""app-plate-turkey: an expired grace period sold as live advice — my own defect.

Item 2 of the work order, and the only one on the list that this audit created
rather than found.

In the traffic pass I appended a correction block to this page with
`details = coalesce(details,'') || '<div…>'` guarded by `NOT LIKE '%7574%'`.
The append worked. Nothing removed the paragraph it was correcting. So the page
now carries both halves, 600 characters apart:

    «ملاحظة: حتى 31 مارس 2026 لن تُطبَّق الغرامات — فقط توجيه وإرشاد.
     استغل الوقت وغيّر بلاكتك…»
    «…ونفاذه من 27 شباط/فبراير 2026. فإن قرأت في أي مكان تاريخاً لاحقاً،
     تعامل مع العقوبات على أنّها سارية الآن»

The first is imperative, present tense, and about a window that closed 128 days
ago. A reader who reads top-down and stops — which is most readers — walks away
believing enforcement has not started. Exposure is 140,000 lira, a 30-day
impound and a 30-day licence suspension.

Re-running the traffic file would not have fixed it: the guard sees 7574 and
skips. Append-only corrections need a paired delete, and this is the second time
that lesson has cost something in this audit.

The structural half is the same page. Two hundred and forty-one views — the
site's 16th most-read article — on 159 words with `steps`, `documents` and
`tips` all empty and `fees` null. No HowTo schema, because that is gated on
three steps. Nothing tells the reader what to actually do about a plate that
fails the check the page itself describes.

What goes in is drawn from what the site already establishes: the printing
centre named in this page's own text (Şoförler Odası), the e-Devlet fine lookup
that traffic-fines already documents, the fifteen-day early-payment discount
verified in the traffic pass, and the criminal-forgery exposure this page
already states. No requirement is invented — where a document list would have to
be guessed, the page says to confirm it at the centre instead of guessing for
the reader.
"""
import json, os, re, urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

_env = {}
for _l in open(os.path.join(REPO, '.env.local'), encoding='utf-8-sig').read().splitlines():
    if '=' in _l and not _l.lstrip().startswith('#'):
        _k, _v = _l.split('=', 1)
        _env[_k.strip()] = _v.strip()
_URL, _KEY = _env['NEXT_PUBLIC_SUPABASE_URL'], _env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

req = urllib.request.Request(
    '%s/rest/v1/articles?select=slug,title,details,steps,tips,documents,fees,source,warning,views'
    '&slug=eq.app-plate-turkey' % _URL,
    headers={'apikey': _KEY, 'Authorization': 'Bearer ' + _KEY},
)
row = json.load(urllib.request.urlopen(req))[0]
D = row['details'] or ''


def q(s):
    return str(s or '').replace("'", "''")


def arr(items):
    return 'ARRAY[%s]::text[]' % ', '.join("'%s'" % q(x) for x in items)


# ── the two paragraphs that must go ───────────────────────────────────────
OLD_HEAD = '<p><strong>العقوبات اعتباراً من 1 أبريل 2026:</strong></p>'
OLD_GRACE = ('<p>ملاحظة: حتى 31 مارس 2026 لن تُطبَّق الغرامات — فقط توجيه وإرشاد. '
             'استغل الوقت وغيّر بلاكتك من أقرب مركز طباعة معتمد (شوفيرلر أوداسي).</p>')
assert D.count(OLD_HEAD) == 1, 'the heading moved'
assert D.count(OLD_GRACE) == 1, 'the grace paragraph moved'
assert '7574' in D, 'the correction block is not on the page — run the traffic SQL first'

NEW_HEAD = ('<p><strong>العقوبات النافذة اليوم</strong> — بموجب القانون رقم 7574 المعدِّل لقانون '
            'المرور، ونفاذه من 27 شباط/فبراير 2026:</p>')
NEW_GRACE = ('<p><strong>ولا توجد مهلة سماح.</strong> تداولت صفحات كثيرة أنّ الغرامات لن تُطبَّق '
             'قبل 31 آذار/مارس 2026 وأنّ ما قبله «توجيه وإرشاد». تلك النافذة — إن وُجدت أصلاً — '
             'انقضت، والعقوبات مطبَّقة الآن. فإن كانت لوحتك لا تجتاز الفحص أعلاه، عاملها على أنّها '
             'مخالفة قائمة اليوم لا غداً.</p>')

STEPS = [
    'افحص لوحتك بالعلامات الثلاث أعلاه: دقّة الأحرف والأرقام، والمهر البارد، وشريط الهولوغرام '
    'المتموّج فوق TR. وافحص اللوحتين معاً — الأمامية والخلفية.',
    'استعلم عمّا إذا كانت مخالفة قد سُجّلت عليك: ادخل e-Devlet وابحث عن «Trafik Cezası» واقرأ '
    'المخالفات المسجّلة على لوحتك.',
    'إن كانت هناك مخالفة مبلَّغة: احسب الخمسة عشر يوماً من تاريخ التبليغ — الدفع داخلها يخفّض '
    'الغرامة من 140,000 إلى 105,000 ليرة.',
    'وإن كانت لوحتك غير مطابقة: استبدلها في أقرب مركز طباعة لوحات معتمد تابع لغرفة السائقين '
    '(Şoförler Odası) — والمراكز المعتمدة وحدها هي التي تُصدر لوحة نظامية.',
    'اسأل المركز عن الأوراق المطلوبة ورسم الطباعة النافذ قبل أن تذهب — يختلفان بحسب المركز والولاية، '
    'ولا يوجد رقم موحّد منشور نعتمده هنا.',
    'احتفظ بإيصال الاستبدال مع أوراق السيارة: هو ما يثبت أنّك صحّحت الوضع وتاريخ تصحيحه.',
]

DOCS = [
    'رخصة السيارة (Ruhsat) — هي التي تحمل رقم اللوحة ورقم الهيكل.',
    'هويتك أو إقامتك، ووثيقة تُثبت صفتك إن لم تكن المالك المسجَّل.',
    'وأكّد القائمة في المركز قبل التوجّه — تختلف بحسب المركز والولاية.',
]

TIPS = [
    'لا مهلة سماح: العقوبات نافذة منذ 27 شباط/فبراير 2026 بموجب القانون 7574.',
    'الخصم لا يُذكر غالباً: الدفع خلال خمسة عشر يوماً من التبليغ ينزل بالغرامة إلى 105,000 ليرة — '
    'أي 35,000 فرقاً.',
    'التكرار خلال سنة يضاعف كلّ شيء: 280,000 ليرة، وستّون يوماً حجزاً وسحباً للرخصة.',
    'الأثقل ليس الغرامة: مخالفة اللوحة قد تُفتح معها ملاحقة جزائية بتهمة تزوير وثيقة رسمية.',
    'لا تشترِ لوحة من غير مركز معتمد مهما كان الفرق في السعر — هذا بعينه ما تعاقب عليه المادة.',
]

FEES = ('غرامة اللوحة غير النظامية 140,000 ليرة، وتنزل إلى 105,000 بالدفع خلال خمسة عشر يوماً من '
        'التبليغ. والتكرار خلال سنة 280,000 ليرة. أمّا رسم طباعة اللوحة نفسه فيحدّده المركز المعتمد '
        'ولا نعرف له رقماً موحّداً منشوراً — اسأل عنه قبل التوجّه.')

LINKS = ('<p style="margin-top:1rem;">وللمخالفات المرورية عموماً وكيفية الاستعلام عنها ودفعها: '
         '<a href="/article/traffic-fines">مخالفات المرور والغرامات</a>. '
         'ولبقية تعديلات 2026: '
         '<a href="/article/traffic-penalties-turkey-2026">العقوبات المرورية الجديدة</a>.</p>')
assert '/article/traffic-fines' not in D

sql = """-- ============================================================================
-- app-plate-turkey: مهلة سماح منتهية تُقدَّم كنصيحة حاضرة — وهو عيب من صنعي
-- ============================================================================
-- البند الثاني من أمر العمل، والوحيد فيه الذي **أنشأه** هذا التدقيق لا كشفه.
--
-- في تمريرة المرور ألحقتُ بلوك تصحيح بهذه الصفحة عبر
--     details = coalesce(details,'') || '<div…>'
-- بحارس NOT LIKE '%%7574%%'. والإلحاق نجح. ولم يحذف شيءٌ الفقرةَ التي كان
-- يصحّحها. فصارت الصفحة تحمل النصفين معاً، بينهما ستّمئة حرف:
--
--   «ملاحظة: حتى 31 مارس 2026 لن تُطبَّق الغرامات — فقط توجيه وإرشاد.
--    استغل الوقت وغيّر بلاكتك…»
--   «…ونفاذه من 27 شباط/فبراير 2026. فإن قرأت في أي مكان تاريخاً لاحقاً،
--    تعامل مع العقوبات على أنّها سارية الآن»
--
-- الأولى بصيغة الأمر، وبزمن الحاضر، وعن نافذة أُغلقت قبل مئة وثمانية وعشرين
-- يوماً. ومن يقرأ من أعلى ويتوقّف — وهو أكثر القرّاء — يخرج مطمئنّاً إلى أنّ
-- التطبيق لم يبدأ. والتعرّض 140,000 ليرة، وحجز ثلاثين يوماً، وسحب الرخصة
-- ثلاثين.
--
-- وإعادة تشغيل ملفّ المرور ما كانت لتُصلحه: الحارس يرى 7574 فيتخطّى.
-- التصحيح بالإلحاق يحتاج حذفاً مقابلاً، وهذه ثاني مرّة يكلّف فيها هذا الدرس
-- شيئاً في هذا التدقيق.
--
-- ── والنصف الثاني بنيوي، وعلى الصفحة نفسها ──────────────────────────────
--
-- مئتان وإحدى وأربعون قراءة — السادسة عشرة على الموقع — على 159 كلمة، وحقول
-- steps وdocuments وtips فارغة كلّها، وfees فارغ. ولا سكيما HowTo لأنّها
-- مشروطة بثلاث خطوات. أي أنّ الصفحة تصف فحصاً ولا تقول للقارئ ماذا يفعل إن
-- رسبت لوحته فيه.
--
-- وما يدخل مستمدّ ممّا يثبته الموقع أصلاً: مركز الطباعة الذي تسمّيه هذه
-- الصفحة نفسها (غرفة السائقين)، واستعلام المخالفات على e-Devlet الذي توثّقه
-- صفحة مخالفات المرور، وخصم الخمسة عشر يوماً الذي تحقّقنا منه في تمريرة
-- المرور، والملاحقة الجزائية التي تذكرها الصفحة نفسها.
--
-- ولم يُخترع شرط واحد: حيث كانت قائمة الأوراق ستحتاج تخميناً، تقول الصفحة
-- «أكّدها في المركز» بدل أن تخمّن نيابةً عن القارئ. والرسم كذلك: لا رقم موحّد
-- منشور نعرفه، فلا نكتب رقماً.
--
-- آمن لإعادة التشغيل. لا يحتاج نشر شيفرة.
-- ============================================================================

UPDATE articles SET
    details = replace(replace(details, '%s', '%s'), '%s', '%s') || '%s',
    steps = %s,
    documents = %s,
    tips = %s,
    fees = '%s',
    last_update = CURRENT_DATE
WHERE slug = 'app-plate-turkey'
  AND details LIKE '%%31 مارس 2026%%';

-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — صفّ واحد، كل أعمدته true
SELECT slug,
       (details NOT LIKE '%%لن تُطبَّق الغرامات%%')      AS مهلة_السماح_أُزيلت,
       (details NOT LIKE '%%1 أبريل 2026%%')             AS التاريخ_الخطأ_أُزيل,
       (details LIKE '%%7574%%')                         AS القانون_مذكور,
       (coalesce(array_length(steps,1),0) >= 3)          AS له_خطوات,
       (coalesce(array_length(documents,1),0) > 0)       AS له_وثائق,
       (coalesce(trim(fees), '') <> '')                  AS له_رسوم,
       (details LIKE '%%/article/traffic-fines%%')       AS يربط_المخالفات
FROM articles WHERE slug = 'app-plate-turkey';
""" % (q(OLD_HEAD), q(NEW_HEAD), q(OLD_GRACE), q(NEW_GRACE), q(LINKS),
       arr(STEPS), arr(DOCS), arr(TIPS), q(FEES))

path = os.path.join(REPO, 'sql', '2026-08-06_fix_app_plate_grace_period.sql')
open(path, 'w', encoding='utf-8').write(sql)

print('مهلة السماح المنتهية : تُحذف (كانت تُقرأ كنصيحة حاضرة)')
print('تاريخ 1 أبريل        : يُستبدل بنفاذ القانون 7574 في 27 شباط')
print('خطوات   : %d ← %d' % (len(row['steps'] or []), len(STEPS)))
print('وثائق   : %d ← %d' % (len(row['documents'] or []), len(DOCS)))
print('نصائح   : %d ← %d' % (len(row['tips'] or []), len(TIPS)))
print('رسوم    : %s ← نصّ يذكر الخصم ويقرّ بأن رسم الطباعة غير منشور' % repr(row.get('fees')))
print('روابط   : 2 (مخالفات المرور + عقوبات 2026)')
print('quote parity :', 'OK' if re.sub(r"''", '', sql).count("'") % 2 == 0 else '*** BROKEN ***')
print('written      :', path, len(sql), 'chars')
