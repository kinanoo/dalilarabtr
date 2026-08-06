# -*- coding: utf-8 -*-
"""Medical tourism: one page contradicted another, and three quoted surgery prices with no source.

Deferred twice on purpose during the health and visa passes, because it needed a
sourcing decision rather than a merge. Here it is.

THE CONTRADICTION IS THE HARM, NOT THE PRICES.

medical-tourism-guide lists among Türkiye's advantages "easy travel — an
e-Visa for most countries". turkey-medical-visa, which has 93 reads and is
sourced to mfa.gov.tr, says the opposite in its own opening: the Turkish MFA
states the e-Visa is valid ONLY when the purpose of travel is tourism or trade,
and other purposes are issued from embassies and consulates. Its own warning
already reads "do not use the e-Visa system for treatment".

So a reader planning a treatment trip lands on the guide, reads that an e-Visa
covers them, buys one, and is refused — or worse, turned back at the border after
paying a clinic deposit. That is the same class of error as the work-permit page
telling readers to wait for a booking system that already worked, and it is
corrected the same way: the guide now states the rule and links the page that
carries the evidence.

THE PRICES ARE KEPT, LABELLED FOR WHAT THEY ARE.

The three pages quote hard ranges — zircon crowns $150-300 a tooth, implants
$500-1000, LASIK $500-1000 for both eyes, ICL $2000-4000 — and "60-70% cheaper
than Europe", with no source anywhere. No Turkish authority publishes private
clinic prices; there is no tariff to check these against, unlike the visa fees
that the migration directorate does publish and that this audit verified line by
line.

Deleting them is not the honest option either: price IS the question a reader
arrives with, and the ranges are the only orientation available. So each page now
says plainly that these are indicative market ranges, that no official Turkish
tariff exists for private treatment, and that the only number that binds anyone
is a written quote from the clinic. Same treatment as the UCSO visa figures and
the lawyer fee on the V-87 page.

NOT MERGED, and that is deliberate. Three pages of 56-74 prose words look like
the card pattern retired elsewhere, but here the prose IS the content — the price
tables live in `details`, not in list columns, and the generator carries lists
only. Merging would delete the very thing readers come for. They stay separate,
sourced and cross-linked.
"""
import json, os, re, urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

_env = {}
for _l in open(os.path.join(REPO, '.env.local'), encoding='utf-8-sig').read().splitlines():
    if '=' in _l and not _l.lstrip().startswith('#'):
        _k, _v = _l.split('=', 1)
        _env[_k.strip()] = _v.strip()
_URL, _KEY = _env['NEXT_PUBLIC_SUPABASE_URL'], _env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

PAGES = ['medical-tourism-guide', 'medical-tourism-dental', 'medical-tourism-eyes']

rows = {}
for off in range(0, 700, 100):
    req = urllib.request.Request(
        '%s/rest/v1/articles?select=slug,title,details,source,views&status=eq.approved&order=slug.asc' % _URL,
        headers={'apikey': _KEY, 'Authorization': 'Bearer ' + _KEY,
                 'Range': '%d-%d' % (off, off + 99)},
    )
    part = json.load(urllib.request.urlopen(req))
    for r in part:
        rows[r['slug']] = r
    if len(part) < 100:
        break

for s in PAGES + ['turkey-medical-visa']:
    assert s in rows, 'missing: %s' % s
for s in PAGES:
    assert not str(rows[s].get('source') or '').strip(), '%s already has a source' % s


def q(s):
    return str(s or '').replace("'", "''")


# ── the contradiction ─────────────────────────────────────────────────────
WRONG_EVISA = '<li>سهولة السفر (تأشيرة إلكترونية لمعظم الدول)</li>'
RIGHT_EVISA = (
    '<li>سهولة الوصول جغرافياً ورحلات مباشرة من معظم العواصم — <strong>لكن انتبه: التأشيرة '
    'الإلكترونية لا تصلح للعلاج.</strong> وزارة الخارجية التركية تنصّ على أنّ الإلكترونية صالحة '
    'للسياحة أو التجارة فقط، وأنّ باقي الأغراض تُمنح من السفارات والقنصليات. '
    '<a href="/article/turkey-medical-visa">التأشيرة العلاجية: الوثائق والخطوات ←</a></li>'
)
assert rows['medical-tourism-guide']['details'].count(WRONG_EVISA) == 1, 'the e-Visa line moved'

# ── the prices ────────────────────────────────────────────────────────────
PRICE_NOTE = (
    '<div style="margin-top:1.25rem;padding:1rem;border-radius:0.75rem;border:1px solid #fcd34d;'
    'background:#fffbeb;"><p style="margin:0 0 .5rem 0;"><strong>عن الأرقام في هذه الصفحة:</strong> '
    'هي نطاقات سوقية استرشادية جُمعت من عروض العيادات، ولا نستطيع إسنادها إلى تعرفة رسمية — '
    'لأنّ أسعار العلاج في القطاع الخاص في تركيا لا تنشرها أي جهة حكومية. فلا تعاملها كسعر مضمون.</p>'
    '<p style="margin:0;">الرقم الوحيد الذي يُلزم أحداً هو <strong>عرض سعر مكتوب من العيادة نفسها</strong> '
    'يذكر ما يشمله وما لا يشمله (الفحوصات، المتابعة، الإقامة، النقل). واطلبه قبل حجز أي تذكرة أو '
    'دفع أي عربون.</p></div>'
)

SOURCES = {
    'medical-tourism-guide':
        'الأرقام في هذه الصفحة نطاقات سوقية استرشادية من عروض العيادات ولا تستند إلى تعرفة رسمية — '
        'فالقطاع الخاص في تركيا لا تُنشر أسعاره حكومياً. أمّا شرط التأشيرة فمن وزارة الخارجية التركية '
        '(mfa.gov.tr): الإلكترونية للسياحة أو التجارة فقط، والعلاج من السفارة أو القنصلية. '
        'واعتماد JCI يُتحقَّق منه لكل مستشفى على حدة على jointcommissioninternational.org.',
    'medical-tourism-dental':
        'نطاقات سوقية استرشادية من عروض عيادات الأسنان، لا تعرفة رسمية — أسعار القطاع الخاص في تركيا '
        'لا تنشرها جهة حكومية. وشرط دخول العلاج: تأشيرة علاجية من السفارة أو القنصلية لا إلكترونية '
        '(وزارة الخارجية التركية، mfa.gov.tr).',
    'medical-tourism-eyes':
        'نطاقات سوقية استرشادية من عروض مراكز جراحة العيون، لا تعرفة رسمية — أسعار القطاع الخاص في '
        'تركيا لا تنشرها جهة حكومية. وشرط دخول العلاج: تأشيرة علاجية من السفارة أو القنصلية لا '
        'إلكترونية (وزارة الخارجية التركية، mfa.gov.tr).',
}

# The two treatment pages never mention the visa at all, which is its own gap:
# a reader books a clinic and discovers the visa problem at the airport.
VISA_LINK = (
    '<p style="margin-top:1rem;"><strong>قبل أن تحجز:</strong> العلاج في تركيا يحتاج '
    '<a href="/article/turkey-medical-visa">تأشيرة علاجية من السفارة أو القنصلية</a> — '
    'والتأشيرة الإلكترونية لا تغطّي العلاج، مهما قيل لك.</p>'
)

fixes = []
fixes.append(
    "-- التناقض: الصفحة تقول إنّ الإلكترونية تسهّل السفر للعلاج، والوزارة تقول عكسه\n"
    "UPDATE articles SET details = replace(details, '%s', '%s'), last_update = CURRENT_DATE\n"
    "WHERE slug = 'medical-tourism-guide';\n" % (q(WRONG_EVISA), q(RIGHT_EVISA))
)
for s in ('medical-tourism-dental', 'medical-tourism-eyes'):
    assert 'turkey-medical-visa' not in (rows[s]['details'] or ''), '%s already links the visa page' % s
    fixes.append(
        "UPDATE articles SET details = coalesce(details, '') || '%s', last_update = CURRENT_DATE\n"
        "WHERE slug = '%s' AND coalesce(details, '') NOT LIKE '%%turkey-medical-visa%%';\n"
        % (q(VISA_LINK), s)
    )

notes = []
for s in PAGES:
    assert 'نطاقات سوقية' not in (rows[s]['details'] or '')
    notes.append(
        "UPDATE articles SET details = coalesce(details, '') || '%s', last_update = CURRENT_DATE\n"
        "WHERE slug = '%s' AND coalesce(details, '') NOT LIKE '%%نطاقات سوقية%%';\n"
        % (q(PRICE_NOTE), s)
    )

srcs = ["UPDATE articles SET source = '%s', last_update = CURRENT_DATE\n"
        "WHERE slug = '%s' AND coalesce(trim(source), '') = '';\n" % (q(v), k)
        for k, v in SOURCES.items()]

header = """-- ============================================================================
-- السياحة العلاجية: تناقض وثلاث صفحات أسعار بلا سند (2026-08-06)
-- ============================================================================
-- أُجّلت مرّتين عمداً في تمريرتَي الصحة والتأشيرات، لأنّها تحتاج قراراً في
-- الإسناد لا دمجاً. وهذا هو.
--
-- ── والضرر ليس في الأسعار، بل في التناقض ─────────────────────────────────
--
-- صفحة «دليل السياحة العلاجية» تعدّ من مزايا تركيا «سهولة السفر (تأشيرة
-- إلكترونية لمعظم الدول)». وصفحة «الفيزا الطبية» — 93 قراءة، ومصدرها
-- mfa.gov.tr — تقول عكس ذلك في مطلعها: وزارة الخارجية التركية تنصّ على أنّ
-- الإلكترونية صالحة للسياحة أو التجارة فقط، وأنّ باقي الأغراض تُمنح من
-- السفارات والقنصليات. وتنبيهها الخاص يقول حرفياً: لا تستخدم نظام e-Visa
-- لغرض العلاج.
--
-- فمن يخطّط لرحلة علاج يهبط على الدليل، فيقرأ أنّ الإلكترونية تكفيه، فيشتريها،
-- ثمّ يُرفض — أو يُعاد من الحدود بعد أن دفع عربوناً لعيادة. وهذا من صنف الخطأ
-- نفسه الذي كانت صفحة إذن العمل ترتكبه حين تقول «انتظر فتح نظام الحجز» وهو
-- يعمل، ويُصحَّح بالطريقة نفسها: القاعدة صريحةً، ورابط الصفحة التي تحمل الدليل.
--
-- والصفحتان العلاجيتان (الأسنان والعيون) لا تذكران التأشيرة إطلاقاً — وهي
-- ثغرة بذاتها: يحجز القارئ العيادة ثمّ يكتشف المشكلة في المطار. صارتا تذكرانها.
--
-- ── والأسعار تبقى، موسومةً بما هي ────────────────────────────────────────
--
-- الصفحات الثلاث تذكر نطاقات صريحة: تلبيسة الزيركون 150-300 دولاراً للسن،
-- والزراعة 500-1000، والليزك 500-1000 للعينين، وزراعة العدسات 2000-4000،
-- و«أقل بـ60-70% من أوروبا» — بلا مصدر في أي موضع.
--
-- ولا توجد تعرفة رسمية تُقاس عليها: أسعار العلاج في القطاع الخاص في تركيا لا
-- تنشرها جهة حكومية، بخلاف رسوم التأشيرة التي تنشرها إدارة الهجرة والتي
-- تحقّقنا منها سطراً سطراً في تمريرة سابقة.
--
-- وحذفها ليس الخيار الأمين أيضاً: السعر هو السؤال الذي يأتي به القارئ،
-- والنطاقات هي التوجيه الوحيد المتاح. فصارت كل صفحة تقول صراحةً إنّها نطاقات
-- سوقية استرشادية، وإنّه لا تعرفة رسمية للعلاج الخاص، وإنّ الرقم الوحيد
-- المُلزِم هو عرض سعر مكتوب من العيادة يذكر ما يشمله وما لا يشمله.
--
-- ── ولم تُدمج، عن قصد ────────────────────────────────────────────────────
--
-- ثلاث صفحات بين 56 و74 كلمة تبدو نمط الكروت الذي أُلغي في أماكن أخرى. لكنّ
-- المتن هنا **هو** المحتوى: جداول الأسعار في details لا في حقول القوائم،
-- والمولّد ينقل القوائم وحدها. فالدمج كان سيحذف بالضبط ما يأتي القارئ لأجله.
--
-- آمن لإعادة التشغيل. لا يحتاج نشر شيفرة.
-- ============================================================================

"""

sql = header
sql += '-- ── التناقض والربط بصفحة التأشيرة ───────────────────────────────────────\n' + '\n'.join(fixes)
sql += '\n-- ── وسم الأسعار بما هي ──────────────────────────────────────────────────\n' + '\n'.join(notes)
sql += '\n-- ── سدّ حقول المصدر ─────────────────────────────────────────────────────\n' + '\n'.join(srcs)
sql += """
-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — ثلاثة صفوف، وكل الأعمدة true، والأخير صفر
SELECT slug,
       (coalesce(trim(source), '') <> '')            AS له_مصدر,
       (details LIKE '%%نطاقات سوقية%%')             AS وسم_الأسعار,
       (details LIKE '%%turkey-medical-visa%%')      AS يربط_التأشيرة
FROM articles
WHERE slug IN ('medical-tourism-guide', 'medical-tourism-dental', 'medical-tourism-eyes')
ORDER BY slug;

SELECT slug FROM articles
WHERE details LIKE '%%سهولة السفر (تأشيرة إلكترونية لمعظم الدول)%%';
"""

path = os.path.join(REPO, 'sql', '2026-08-06_medical_tourism_sourcing.sql')
open(path, 'w', encoding='utf-8').write(sql)

print('صفحات عولجت    :', len(PAGES))
print('تناقض صُحّح     : 1 (التأشيرة الإلكترونية للعلاج)')
print('روابط أُضيفت    : 2 (الأسنان والعيون ← صفحة التأشيرة العلاجية)')
print('وسم أسعار       :', len(notes))
print('مصادر سُدّت     :', len(srcs))
print('لم تُدمج       : 3 (المتن هو المحتوى — الدمج كان سيحذف جداول الأسعار)')
print('quote parity   :', 'OK' if re.sub(r"''", '', sql).count("'") % 2 == 0 else '*** BROKEN ***')
print('written        :', path, len(sql), 'chars')
