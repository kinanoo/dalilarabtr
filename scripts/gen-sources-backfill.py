# -*- coding: utf-8 -*-
"""Seventeen pages that were sourced everywhere except in the source field.

This pass is not a topic cluster. It is the spine the previous nine passes kept
running into: pages that are right and cannot be checked.

Forty-three published pages carry an empty `source`. Fourteen of them cite
Turkish statutes by number and article INSIDE the text — 6458 on foreigners and
international protection, 5271 on criminal procedure, 2577 on administrative
procedure, 4857 on labour, 6305 on disaster insurance, 2644/6302 on the land
registry, 5490 on civil registration, and the Temporary Protection Regulation.
The content was sourced. The field was empty. That is a recording gap, and the
fix invents nothing: each source line below is assembled from the citations the
page itself makes, which is why this file can be generated rather than written.

Among those fourteen sit the site's three heaviest legal guides — 5,735 words on
deportation rights, 5,315 on what happens at a police station, 4,139 on removal
centres. Fifteen thousand words about detention and deportation, every one of
them citing article numbers in the body and none of them saying so in the field
a reader or a search engine looks at.

Three more are handled by hand because they cite nothing at all and carry real
traffic:

  • trader-leave-work-permit-turkey (385 reads) — the most-read unsourced page on
    the site. Its central claim is that a temporary-protection holder who leaves
    Türkiye without prior permission can lose the card. The claim is right and
    the consequence is total, so it now names the Temporary Protection Regulation
    and the provincial migration directorate where the application is actually
    filed. No article number is asserted, because I did not read one.
  • kizilay-card-application (177) — the SUY vulnerability criteria are the
    programme's own, run by Türk Kızılay with the social assistance foundations.
  • return-code-v87 (98) — the sixty-day window it warns about is the annulment
    period in Law 2577. Its lawyer-fee range of "30,000-50,000 lira" is not
    sourced and not sourceable — fees are not published — so the page keeps the
    warning and loses the invented number, the same rule applied to consular and
    visa fees earlier in this audit.
"""
import json, os, re, urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

_env = {}
for _l in open(os.path.join(REPO, '.env.local'), encoding='utf-8-sig').read().splitlines():
    if '=' in _l and not _l.lstrip().startswith('#'):
        _k, _v = _l.split('=', 1)
        _env[_k.strip()] = _v.strip()
_URL, _KEY = _env['NEXT_PUBLIC_SUPABASE_URL'], _env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

# Statute number -> how it is named in Arabic. Only these are recognised; a
# number the map does not know is not guessed at.
LAWS = {
    '6458': 'قانون الأجانب والحماية الدولية رقم 6458',
    '5271': 'قانون أصول المحاكمات الجزائية رقم 5271',
    '2577': 'قانون المحاكمات الإدارية رقم 2577',
    '4857': 'قانون العمل رقم 4857',
    '6305': 'قانون التأمين الإجباري ضد الكوارث رقم 6305',
    '2644': 'قانون الطابو رقم 2644',
    '6302': 'القانون رقم 6302 المعدِّل لقانون الطابو',
    '5901': 'قانون الجنسية التركية رقم 5901',
    '5490': 'قانون خدمات النفوس رقم 5490',
    '7574': 'القانون رقم 7574 المعدِّل لقانون المرور',
}
REGULATION = 'لائحة الحماية المؤقتة (Geçici Koruma Yönetmeliği)'

# The three that cite nothing. Written by hand, and deliberately naming only what
# I could establish — an authority and a regulation, never an article I have not
# read.
MANUAL = {
    'trader-leave-work-permit-turkey':
        REGULATION + ' ورئاسة إدارة الهجرة (goc.gov.tr) — طلبات إذن السفر لحاملي الحماية المؤقتة '
        'تُقدَّم إلى مديرية الهجرة أو الولاية في محل التسجيل، وهي الجهة التي تمنح الإذن المسبق. '
        'والوثائق المذكورة هنا بحسب ما تطلبه الولايات عملياً، وتختلف بينها — أكّدها في ولايتك قبل التقديم.',
    'kizilay-card-application':
        'برنامج بطاقة الهلال الأحمر (Kızılaykart / SUY) الذي ينفّذه الهلال الأحمر التركي (Türk Kızılay) '
        'بالتعاون مع أوقاف التضامن الاجتماعي (SYDV) التابعة لوزارة الأسرة والخدمات الاجتماعية. '
        'ومعايير الاستحقاق المذكورة هي معايير الضعف المعتمدة في البرنامج نفسه.',
    'return-code-v87':
        'قانون المحاكمات الإدارية رقم 2577 — مهلة رفع دعوى الإلغاء أمام المحكمة الإدارية ستّون يوماً من '
        'التبليغ. وأصل الكود ورفعه من اختصاص رئاسة إدارة الهجرة (goc.gov.tr).',
}

# The unsourced money figure goes, exactly as it went from the consular and visa
# pages. Lawyer fees are not published anywhere; a range invented here is the
# same failure in a different cluster.
FEE_FIX = (
    'أجور المحاماة قد تتجاوز 30,000 - 50,000 ليرة حسب تعقيد القضية.',
    'أجور المحاماة غير منشورة في أي تعرفة رسمية وتختلف بين محامٍ وآخر وبحسب تعقيد القضية — '
    'اطلب عرضاً مكتوباً قبل التوكيل، ولا تعتمد على رقم متداول.',
)

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


def q(s):
    return str(s or '').replace("'", "''")


def body(slug):
    return ' '.join(re.sub(r'<[^>]+>', ' ', rows[slug].get('details') or '').split())


derived, skipped = [], []
for slug, a in sorted(rows.items(), key=lambda kv: -(kv[1].get('views') or 0)):
    if str(a.get('source') or '').strip() or slug in MANUAL:
        continue
    t = body(slug)
    laws = [LAWS[n] for n in LAWS if re.search(r'(?<!\d)' + n + r'(?!\d)', t)]
    reg = REGULATION if 'لائحة الحماية المؤقتة' in t else ''
    doms = sorted({m.group(0) for m in re.finditer(r'[a-z0-9-]+\.gov\.tr', t)})
    parts = laws + ([reg] if reg else [])
    if not parts:
        # A government domain alone is a pointer, not a source. Pages with only
        # that are left for a pass that can actually verify them.
        skipped.append((slug, a.get('views') or 0, bool(doms)))
        continue
    line = '، و'.join(parts) + ' — كما هي مذكورة بموادّها في متن هذه الصفحة.'
    if doms:
        line += ' والجهات الرسمية: ' + '، '.join(doms[:4]) + '.'
    derived.append((slug, a.get('views') or 0, line))

assert derived, 'nothing to backfill — already done?'

# Every manual entry must still be empty, and must exist.
for slug in MANUAL:
    assert slug in rows, 'missing: %s' % slug
    assert not str(rows[slug].get('source') or '').strip(), '%s already has a source' % slug

old, new = FEE_FIX
assert body('return-code-v87').count(' '.join(old.split())) == 1 or old in (rows['return-code-v87'].get('details') or ''), \
    'the fee sentence is not where it was'

sql_parts = []
for slug, views, line in derived:
    sql_parts.append("-- %-46s %4d قراءة\nUPDATE articles SET source = '%s', last_update = CURRENT_DATE\n"
                     "WHERE slug = '%s' AND coalesce(trim(source), '') = '';\n" % (slug, views, q(line), slug))

manual_sql = []
for slug, line in MANUAL.items():
    manual_sql.append("-- %-46s %4d قراءة\nUPDATE articles SET source = '%s', last_update = CURRENT_DATE\n"
                      "WHERE slug = '%s' AND coalesce(trim(source), '') = '';\n"
                      % (slug, rows[slug].get('views') or 0, q(line), slug))

fee_sql = ("UPDATE articles SET details = replace(details, '%s', '%s'), last_update = CURRENT_DATE\n"
           "WHERE slug = 'return-code-v87' AND details LIKE '%%30,000 - 50,000%%';\n" % (q(old), q(new)))

header = """-- ============================================================================
-- إسناد سبع عشرة صفحة كانت مسنَدة في كل مكان إلا في حقل المصدر (2026-08-06)
-- ============================================================================
-- هذه ليست تمريرة موضوع. هذه العمود الذي ظلّت التمريرات التسع السابقة تصطدم
-- به: صفحات على حقّ ولا يمكن التحقّق منها.
--
-- ثلاث وأربعون صفحة منشورة بحقل مصدر فارغ. أربع عشرة منها **تستشهد بالقوانين
-- التركية برقمها ومادّتها داخل المتن**: 6458 للأجانب والحماية الدولية، و5271
-- لأصول المحاكمات الجزائية، و2577 للمحاكمات الإدارية، و4857 للعمل، و6305
-- للتأمين ضد الكوارث، و2644/6302 للطابو، و5490 لخدمات النفوس، ولائحة الحماية
-- المؤقتة. المحتوى مسنَد. الحقل فارغ. فجوة تسجيل لا فجوة تحقّق.
--
-- والعلاج لا يخترع شيئاً: كل سطر مصدر أدناه مركَّب من الاستشهادات التي تقولها
-- الصفحة نفسها — ولهذا يمكن توليد هذا الملف بدل كتابته.
--
-- وبين الأربع عشرة تقع أثقل ثلاثة أدلّة قانونية على الموقع: 5,735 كلمة عن
-- حقوق المُرحَّل، و5,315 عمّا يجري في المخفر، و4,139 عن مراكز الترحيل. خمسة
-- عشر ألف كلمة عن التوقيف والترحيل، كلٌّ منها يذكر أرقام الموادّ في متنه، ولا
-- واحدة تقولها في الحقل الذي يقرأه القارئ ومحرّك البحث.
--
-- وثلاث صفحات عولجت باليد لأنّها لا تستشهد بشيء أصلاً وتحمل قراءات حقيقية:
--
--   • trader-leave-work-permit-turkey (385 قراءة) — أكثر صفحة بلا مصدر قراءةً
--     على الموقع. دعواها المركزية أنّ حامل الحماية المؤقتة الذي يغادر تركيا
--     بلا إذن مسبق قد يفقد بطاقته. الدعوى صحيحة والنتيجة كاملة، فصارت تسمّي
--     لائحة الحماية المؤقتة ومديرية الهجرة في الولاية حيث يُقدَّم الطلب فعلاً.
--     ولم أُثبت رقم مادّة، لأنّني لم أقرأ واحدة.
--   • kizilay-card-application (177) — معايير الضعف هي معايير البرنامج نفسه،
--     ينفّذه الهلال الأحمر التركي مع أوقاف التضامن الاجتماعي.
--   • return-code-v87 (98) — مهلة الستّين يوماً التي تحذّر منها هي مهلة دعوى
--     الإلغاء في القانون 2577. أمّا نطاق أجور المحاماة «30,000-50,000 ليرة»
--     فغير مسنَد وغير قابل للإسناد — الأجور لا تُنشر — فتبقى الصفحة بالتحذير
--     ويسقط الرقم المخترَع، وهي القاعدة نفسها المطبَّقة على رسوم القنصلية
--     والتأشيرات في هذا التدقيق.
--
-- آمن لإعادة التشغيل: كل تحديث مشروط بأن يكون الحقل فارغاً.
-- ============================================================================

"""

sql = header + '-- ── مركَّبة من استشهادات المتن نفسه ─────────────────────────────────────\n'
sql += '\n'.join(sql_parts)
sql += '\n-- ── مكتوبة باليد: لا استشهاد داخلياً ────────────────────────────────────\n'
sql += '\n'.join(manual_sql)
sql += '\n-- ── ورقم أجور محاماة لا يمكن إسناده ─────────────────────────────────────\n' + fee_sql
sql += """
-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — الأول يجب أن ينزل بعدد الصفحات بلا مصدر، والثاني صفر
SELECT count(*) AS صفحات_بلا_مصدر
FROM articles WHERE status = 'approved' AND coalesce(trim(source), '') = '';

SELECT slug FROM articles
WHERE status = 'approved' AND coalesce(trim(source), '') = ''
  AND slug IN (%s);

SELECT slug FROM articles WHERE details LIKE '%%30,000 - 50,000%%';
""" % ', '.join("'%s'" % s for s, _, _ in derived) if derived else ''

path = os.path.join(REPO, 'sql', '2026-08-06_backfill_sources.sql')
open(path, 'w', encoding='utf-8').write(sql)

print('مركَّبة من المتن :', len(derived))
for s, v, _ in derived:
    print('   %-48s %4d' % (s[:48], v))
print()
print('مكتوبة باليد   :', len(MANUAL))
print('رقم أُزيل      : 1 (أجور المحاماة في return-code-v87)')
print()
print('تُركت لتمريرة تالية (لا استشهاد ولا نطاق): %d صفحة، أثقلها:' % len(skipped))
for s, v, hasdom in sorted(skipped, key=lambda x: -x[1])[:8]:
    print('   %-48s %4d %s' % (s[:48], v, '(فيها نطاق حكومي فقط)' if hasdom else ''))
print()
print('quote parity :', 'OK' if re.sub(r"''", '', sql).count("'") % 2 == 0 else '*** BROKEN ***')
print('written      :', path, len(sql), 'chars')
