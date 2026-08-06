# -*- coding: utf-8 -*-
"""overstay-solutions: the page that costs a reader the right to appeal.

Item 1 of the post-audit work order, and the most harmful thing left on the site.
Twenty-three views, empty source, untouched since 2026-03-04 — and every load-
bearing number in it is contradicted by a sourced page on the same site.

THE DEADLINE. Its steps walk a reader through a deportation situation and then
say, unqualified: «يمكنك الطعن خلال 60 يوماً أمام المحكمة الإدارية». The site's
own deportation-rights page — sourced to Law 6458 — says the deadline for a
deportation decision is SEVEN days, that it is preclusive, and warns in as many
words: «وإن قرأت في مكان آخر «خمسة عشر يوماً» فلا تبنِ عليه شيئاً … ومن اعتمد
عليه خسر في اليوم الثامن». Sixty is worse than fifteen. A reader who trusts this
page loses the case on day eight without ever filing.

Three deadlines exist and the page collapses them into one:
    deportation decision  →  7 days   (Art. 53/3, as replaced by Law 7533, 21/11/2024)
    entry-ban decision    →  60 days  (general administrative annulment)
    administrative fine   →  15 days  (sulh ceza court, Law 5326 Art. 27)
deportation-rights states the split explicitly: «لا تخلط بين الميعادين: قرار
الترحيل سبعة أيام، وقرار حظر الدخول ستون».

THE BAN LADDER. The page publishes a fixed table — under 3 months = 1 year,
3-6 = 2 years, 6-12 = 5 years, over a year = 5+ — with no source. turkey-visa-
types-2026 (1,093 views, mfa.gov.tr + goc.gov.tr) gives roughly duration-matched
bans for the same facts, and deportation-rights says the ban is five years
maximum, exceeded only «عند وجود تهديد جدّي للنظام العام أو الأمن العام (المادة
9)». So the table hands the statutory ceiling to a mid-tier overstay and then
claims bans beyond the ceiling on duration alone. It is deleted rather than
corrected: there is no published ladder to replace it with, and inventing a
gentler one would repeat the error in the other direction.

THE DEPARTURE WINDOW. «7-30 يوماً» — Art. 56 sets the floor at fifteen, not
seven. A reader told he has seven days may leave in panic, or believe he is
already out of time when he is not.

AND TWO LINKS THAT GO NOWHERE. deportation-rights closes by linking
href="/overstay-solutions" and href="/detention-center-rights" — without the
/article/ prefix. Both resolve to the shared not-found shell: noindex, no h1,
and served with HTTP 200, so nothing in a status-code sweep would ever flag them.
Exactly two such links exist on the whole site and both are here.
"""
import json, os, re, urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

_env = {}
for _l in open(os.path.join(REPO, '.env.local'), encoding='utf-8-sig').read().splitlines():
    if '=' in _l and not _l.lstrip().startswith('#'):
        _k, _v = _l.split('=', 1)
        _env[_k.strip()] = _v.strip()
_URL, _KEY = _env['NEXT_PUBLIC_SUPABASE_URL'], _env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

rows = {}
for off in range(0, 700, 100):
    req = urllib.request.Request(
        '%s/rest/v1/articles?select=slug,title,details,steps,tips,documents,source,warning,views'
        '&status=eq.approved&order=slug.asc' % _URL,
        headers={'apikey': _KEY, 'Authorization': 'Bearer ' + _KEY,
                 'Range': '%d-%d' % (off, off + 99)},
    )
    part = json.load(urllib.request.urlopen(req))
    for r in part:
        rows[r['slug']] = r
    if len(part) < 100:
        break

for s in ('overstay-solutions', 'deportation-rights', 'tahdit-entry-restriction-codes-how-to-object'):
    assert s in rows, 'missing: %s' % s


def q(s):
    return str(s or '').replace("'", "''")


def arr(items):
    return 'ARRAY[%s]::text[]' % ', '.join("'%s'" % q(x) for x in items)


# ── the ban ladder comes out of the body ──────────────────────────────────
BODY = rows['overstay-solutions']['details'] or ''
LADDER_MARKERS = ['أقل من 3 أشهر', '3-6 أشهر', '6-12 شهر', 'أكثر من سنة']
for m in LADDER_MARKERS:
    assert m in BODY, 'ladder marker moved: %s' % m

NEW_BODY = (
    '<h3>تجاوز مدة الإقامة (Overstay)</h3>\r\n'
    '<p>تجاوز المدة يعرّضك لغرامة إدارية وقد يترتّب عليه حظر دخول. والأهم أن تعرف أنّ ما ينتظرك ليس '
    'إجراءً واحداً بل ثلاثة قرارات منفصلة، لكلٍّ منها ميعاد طعن مختلف — والخلط بينها هو ما يُسقِط '
    'الحقّ عملياً.</p>\r\n'
    '<h4>لا تصدّق أي «جدول» يربط مدة التجاوز بمدة المنع</h4>\r\n'
    '<p>تنتشر جداول تقول إنّ التجاوز أقلّ من ثلاثة أشهر يعني منعاً سنةً، وستّة أشهر تعني خمس سنوات، '
    'وهكذا. <strong>ولا سند لهذه الجداول.</strong> حظر الدخول في القانون رقم 6458 مدّته '
    '<strong>خمس سنوات كحدّ أقصى</strong>، ولا يُتجاوَز إلا عند وجود تهديد جدّي للنظام العام أو الأمن '
    'العام (المادة 9) — لا لمجرّد طول المدة. والتقدير في حدود ذلك يعود إلى الإدارة وينظر في ظروف كل '
    'حالة. فمن قرأ جدولاً ورتّب عليه قراره قد يظنّ أنّه خسر خمس سنوات وهو لم يخسرها، أو العكس.</p>\r\n'
    '<h4>ثلاثة قرارات، ثلاثة مواعيد</h4>\r\n'
    '<ul>\r\n'
    '<li><strong>قرار الترحيل: سبعة أيام.</strong> من تاريخ التبليغ، أمام المحكمة الإدارية، وهي '
    '<strong>مهلة مُسقِطة للحقّ</strong> (المادة 53/3 من القانون 6458 بصيغتها المستبدَلة بالقانون '
    '7533 في 21/11/2024). ومن قرأ في مكان آخر «خمسة عشر يوماً» أو «ستّين» ورتّب عليه، خسر في اليوم '
    'الثامن.</li>\r\n'
    '<li><strong>قرار حظر الدخول: ستّون يوماً.</strong> من التبليغ، أمام المحكمة الإدارية. وإن جاءك '
    'القراران في ورقة واحدة فلا تحسب لهما ميعاداً واحداً.</li>\r\n'
    '<li><strong>الغرامة الإدارية: خمسة عشر يوماً.</strong> أمام <em>محكمة الصلح الجزائية</em> '
    '(Sulh Ceza) لا أمام المحكمة الإدارية، من التبليغ أو التفهيم، وبفوات المدة يصير القرار نهائياً '
    '(المادة 27 من قانون المخالفات رقم 5326).</li>\r\n'
    '</ul>\r\n'
    '<p><strong>القاعدة العملية:</strong> إن لم تكن متأكّداً أي قرار بيدك، فتصرّف على أساس الميعاد '
    'الأضيق — سبعة أيام — واسأل بعدها. التصرّف المبكر لا يضرّك، والتأخّر يُسقِط.</p>\r\n'
    '<p>وللتفصيل الكامل عن الطعن على الترحيل، ومن يُحتجَز، وما يبقى لمن فاته الميعاد: '
    '<a href="/article/deportation-rights">حقوق من صدر بحقّه قرار ترحيل</a>.</p>'
)

STEPS = [
    'احسب عدد أيام التجاوز من تاريخ انتهاء الفيزا أو الإقامة، وسجّل التاريخ بدقّة.',
    'راجع إدارة الهجرة طوعياً قبل أن تُوقَف — المراجعة الطوعية تُقرأ لصالحك، والانتظار لا يُقرأ لصالحك.',
    'سجّل تاريخ تبليغك بكل قرار يُسلَّم إليك، ورقةً ورقة — منه تبدأ المواعيد، لا من تاريخ صدور القرار.',
    'إن صدر بحقّك قرار ترحيل: ارفع الدعوى خلال سبعة أيام أمام المحكمة الإدارية. لا تنتظر شيئاً آخر.',
    'إن صدر حظر دخول: ميعاده ستّون يوماً، ويُحسَب منفصلاً حتى لو جاء في الورقة نفسها.',
    'الغرامة الإدارية: ادفعها أو اعترض عليها خلال خمسة عشر يوماً أمام محكمة الصلح الجزائية — والدفع '
    'داخل المدة قد يخوّلك خصماً دون أن يُسقط حقّك في الطعن.',
    'إن نصّ القرار على مهلة للمغادرة فهي لا تقلّ عن خمسة عشر يوماً وتصل إلى ثلاثين (المادة 56) — '
    'اقرأ التاريخ المكتوب في ورقتك ولا تعتمد على تقدير.',
]

TIPS = [
    'راجع الهجرة فوراً ولا تنتظر — المراجعة الطوعية أفضل بكثير من أن تُوقَف.',
    'لا تحاول السفر عبر المطار قبل تسوية وضعك.',
    'أخطر خطأ في هذا الملف هو الخلط بين المواعيد: سبعة أيام للترحيل، وستّون لحظر الدخول، وخمسة عشر '
    'للغرامة. عند الشكّ اعمل بالأضيق.',
    'لا تعتمد على جدول يربط مدة التجاوز بمدة المنع — لا وجود لجدول رسمي منشور من هذا النوع.',
    'اطلب صورة من كل ورقة تُسلَّم إليك، وسجّل تاريخ التبليغ عليها بخطّ يدك في اليوم نفسه.',
    'لا يُشترط محامٍ لرفع الدعوى، ومن لا يستطيع دفع الرسم فله أن يطلب المساعدة القضائية مع الدعوى.',
]

SOURCE = (
    'قانون الأجانب والحماية الدولية رقم 6458 — المادة 9 (حظر الدخول ومدّته)، والمادة 53/3 بصيغتها '
    'المستبدَلة بالقانون رقم 7533 بتاريخ 21/11/2024 (ميعاد الطعن على قرار الترحيل: سبعة أيام)، '
    'والمادة 56 (مهلة المغادرة). وقانون المخالفات رقم 5326 — المادة 27 (الاعتراض على الغرامة '
    'الإدارية خلال خمسة عشر يوماً أمام محكمة الصلح الجزائية). وقانون المحاكمات الإدارية رقم 2577 '
    'للإطار العام لدعوى الإلغاء.'
)

WARNING = (
    'المواعيد هنا مُسقِطة للحقّ: من فات ميعاده خسر الطعن لا القضية فقط. وقرار الترحيل ميعاده سبعة '
    'أيام من التبليغ — أضيق ميعاد في هذا الملف كلّه. فإن لم تكن متأكّداً أي قرار بيدك، تصرّف على '
    'أساس السبعة أيام.'
)

# ── the two links that resolve to the not-found shell ─────────────────────
DEP = rows['deportation-rights']['details'] or ''
LINK_FIXES = [
    ('href="/overstay-solutions"', 'href="/article/overstay-solutions"'),
    ('href="/detention-center-rights"', 'href="/article/detention-center-rights"'),
]
for old, _ in LINK_FIXES:
    assert DEP.count(old) == 1, 'link moved or duplicated: %s' % old

sql = """-- ============================================================================
-- overstay-solutions: الصفحة التي تُسقِط حقّ القارئ في الطعن (2026-08-06)
-- ============================================================================
-- البند الأول من أمر عمل التدقيق، وأشدّ ما بقي على الموقع ضرراً. ثلاث وعشرون
-- قراءة، وحقل مصدر فارغ، ولم تُمسّ منذ 2026-03-04 — وكل رقم حامل فيها تناقضه
-- صفحة مسنَدة على الموقع نفسه.
--
-- ── الميعاد ──────────────────────────────────────────────────────────────
--
-- خطواتها تسير بالقارئ داخل وضع ترحيل، ثمّ تقول بلا قيد: «يمكنك الطعن خلال 60
-- يوماً أمام المحكمة الإدارية». وصفحة حقوق المُرحَّل عندنا — المسنَدة إلى
-- القانون 6458 — تقول إنّ ميعاد الطعن على قرار الترحيل **سبعة أيام**، وإنّها
-- مُسقِطة للحقّ، وتحذّر بنصّها: «وإن قرأت في مكان آخر «خمسة عشر يوماً» فلا
-- تبنِ عليه شيئاً … ومن اعتمد عليه خسر في اليوم الثامن». والستّون أسوأ من
-- الخمسة عشر. فمن يثق بهذه الصفحة يخسر في اليوم الثامن دون أن يرفع دعوى أصلاً.
--
-- والمواعيد ثلاثة تجمعها الصفحة في واحد:
--     قرار الترحيل   ← 7 أيام   (المادة 53/3، بالقانون 7533 في 21/11/2024)
--     حظر الدخول     ← 60 يوماً (الإطار العام لدعوى الإلغاء)
--     الغرامة        ← 15 يوماً (محكمة الصلح الجزائية، القانون 5326 المادة 27)
--
-- ── جدول المنع ──────────────────────────────────────────────────────────
--
-- تنشر الصفحة جدولاً ثابتاً: أقل من 3 أشهر = سنة، و3-6 = سنتان، و6-12 = خمس
-- سنوات، وأكثر من سنة = 5+ — بلا مصدر. وصفحة أنواع التأشيرات (1,093 قراءة،
-- mfa.gov.tr وgoc.gov.tr) تعطي مدداً تقارب مدة التجاوز نفسها، وصفحة حقوق
-- المُرحَّل تقول إنّ الحظر خمس سنوات كحدّ أقصى لا يُتجاوَز إلا عند تهديد جدّي
-- للنظام العام أو الأمن العام (المادة 9). فالجدول يمنح السقف القانوني لتجاوز
-- متوسّط، ثمّ يدّعي مدداً فوق السقف لمجرّد طول المدة.
--
-- ويُحذف ولا يُصحَّح: لا يوجد جدول منشور يحلّ محلّه، واختراع جدول ألطف تكرارٌ
-- للخطأ في الاتجاه الآخر.
--
-- ── مهلة المغادرة ───────────────────────────────────────────────────────
--
-- «7-30 يوماً» — والمادة 56 تجعل الحدّ الأدنى خمسة عشر لا سبعة. ومن قيل له
-- سبعة قد يغادر مذعوراً، أو يظنّ أنّ وقته انتهى وهو لم ينتهِ.
--
-- ── ورابطان لا يصلان إلى شيء ────────────────────────────────────────────
--
-- صفحة حقوق المُرحَّل تنتهي برابطين بلا بادئة /article/. وكلاهما يهبط على
-- صفحة «غير موجود» العامة: noindex، وبلا h1، **وبرمز 200** — فلا مسح لرموز
-- الحالة يكشفهما أبداً. وهما الرابطان الوحيدان من هذا النوع في الموقع كلّه.
--
-- آمن لإعادة التشغيل. لا يحتاج نشر شيفرة.
-- ============================================================================

-- ── 1) الصفحة نفسها ─────────────────────────────────────────────────────
UPDATE articles SET
    details = '%s',
    steps = %s,
    tips = %s,
    source = '%s',
    warning = '%s',
    last_update = CURRENT_DATE
WHERE slug = 'overstay-solutions';

-- ── 2) الرابطان اللذان يهبطان على صفحة «غير موجود» ──────────────────────
UPDATE articles SET
    details = replace(replace(details, '%s', '%s'), '%s', '%s'),
    last_update = CURRENT_DATE
WHERE slug = 'deportation-rights';

-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — الأول صفّ واحد كل أعمدته true، والثاني صفر
SELECT slug,
       (details NOT LIKE '%%أقل من 3 أشهر%%')                   AS جدول_المنع_أُزيل,
       (array_to_string(steps, ' ') LIKE '%%سبعة أيام%%')        AS ميعاد_السبعة,
       (array_to_string(steps, ' ') NOT LIKE '%%الطعن خلال 60 يوماً%%') AS الستون_لم_تعد_مطلقة,
       (array_to_string(steps, ' ') LIKE '%%خمسة عشر يوماً وتصل إلى ثلاثين%%') AS مهلة_المغادرة_صحيحة,
       (coalesce(trim(source), '') <> '')                       AS له_مصدر
FROM articles WHERE slug = 'overstay-solutions';

SELECT slug FROM articles
WHERE status = 'approved'
  AND (details LIKE '%%href="/overstay-solutions"%%'
       OR details LIKE '%%href="/detention-center-rights"%%');
""" % (q(NEW_BODY), arr(STEPS), arr(TIPS), q(SOURCE), q(WARNING),
       q(LINK_FIXES[0][0]), q(LINK_FIXES[0][1]), q(LINK_FIXES[1][0]), q(LINK_FIXES[1][1]))

path = os.path.join(REPO, 'sql', '2026-08-06_fix_overstay_deadlines.sql')
open(path, 'w', encoding='utf-8').write(sql)

print('جدول المنع        : يُحذف (بلا سند، ويناقض صفحتين مسنَدتين)')
print('خطوات             : %d ← %d' % (len(rows['overstay-solutions']['steps'] or []), len(STEPS)))
print('نصائح             : %d ← %d' % (len(rows['overstay-solutions']['tips'] or []), len(TIPS)))
print('مواعيد فُصلت      : 3 (ترحيل 7 / حظر 60 / غرامة 15)')
print('مهلة المغادرة     : 7-30 ← 15-30 (المادة 56)')
print('مصدر + تنبيه      : أُضيفا')
print('روابط soft-404    : 2 أُصلحت في deportation-rights')
print('quote parity      :', 'OK' if re.sub(r"''", '', sql).count("'") % 2 == 0 else '*** BROKEN ***')
print('written           :', path, len(sql), 'chars')
