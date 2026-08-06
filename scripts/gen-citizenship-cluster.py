# -*- coding: utf-8 -*-
"""The citizenship cluster: 17 pages -> 12, and six missing sources.

This cluster is the largest remaining by reads and its problem is different
again. There is very little duplicate prose — what there is instead is a set of
correct claims with nothing behind them. Six pages carried an empty `source`
field, including the 228-read tracking hub and an 88-read page stating a
three-year legal condition.

Both of those claims turn out to be right. The marriage page's "you cannot begin
until three full years after the marriage contract" is Türk Vatandaşlığı Kanunu
5901, article 16: marriage to a Turkish citizen does not confer citizenship, and
a foreigner married for at least three years whose marriage is still standing
may apply. Verified and now cited. Being right is not the same as being
checkable, and a reader deciding whether to wait another year deserves the
article number.

The merges are small and chosen on one rule that this cluster made explicit:
because the generator carries list items and deletes the page, the survivor must
always be the page with the most PROSE, or the merge destroys writing. So the
1,190-word tracking hub absorbs the 103-word restatement, the 627-word paths
page absorbs a 315-word and a 248-word version of itself, and the 833-word
real-estate page absorbs the 247-word one — never the other way round, even
where the shorter page has more reads.

Three pages that look mergeable are deliberately kept, because on inspection
they answer different questions:
  • the official-link page carries a finding worth more than its length: the
    widely-shared query URL does not exist, and turkiye.gov.tr returns 200 for
    pages that are not there, so "the link opened" proves nothing.
  • the stage-message dictionary is 1,573 words of decoding Turkish status
    strings; the hub links to it already.
  • the kimlik page exists for one sentence — years under temporary protection
    do not count toward the residence requirement — which nothing else says.
"""
import json, os, re, urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

_env = {}
for _l in open(os.path.join(REPO, '.env.local'), encoding='utf-8-sig').read().splitlines():
    if '=' in _l and not _l.lstrip().startswith('#'):
        _k, _v = _l.split('=', 1)
        _env[_k.strip()] = _v.strip()
_URL, _KEY = _env['NEXT_PUBLIC_SUPABASE_URL'], _env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

# survivor -> absorbed. Survivor is ALWAYS the longer page: prose is not carried.
MERGES = [
    ('citizenship-track-general', ['citizenship-track-status']),
    ('turkish-citizenship-all-paths-2026', ['citizenship-general', 'citizenship-by-residence-2025']),
    ('citizenship-syrians', ['citizenship-syrian-conditions']),
    ('real-estate-citizenship', ['citizenship-investment']),
]

KEEP = {
    'citizenship-status-check': 'الرابط الرسمي — وفيها كشف يستحقّ أكثر من طولها: الرابط المتداول غير موجود، والموقع يرجّع 200 لصفحات غير موجودة.',
    'turkish-citizenship-stages-tracking-2026': 'قاموس رسائل المراحل، 1,573 كلمة، والعمود يحيل إليه أصلاً.',
    'citizenship-for-kimlik-holders-2026': 'جملة لا يقولها غيره: سنوات الحماية المؤقتة لا تُحتسب في شرط الإقامة.',
    'citizenship-by-investment-overview': 'المسارات غير العقارية (إيداع/شركة/توظيف) — لا تغطّيها صفحة العقار.',
    'turkish-citizenship-marriage-syrians-gaziantep': 'مسار الزواج — سؤال مستقلّ، ويُسنَد للمادة 16.',
    'gaziantep-citizenship-decision-syrians-2026': 'إعلان نفوس عنتاب للتقديم العام — خبر مؤرَّخ.',
    'turkish-citizenship-rejection-appeal-annulment-lawsuit-2026': 'الطعن على الرفض والإسقاط — موضوع قانوني قائم بذاته.',
}

CARRY = {
    'citizenship-track-general': {
        'documents': [],
        'steps': [],
        # The only thing the 103-word page said that the hub does not.
        'tips': [('تابع عبر CİMER كل 2-3 أشهر', None)],
    },
    'turkish-citizenship-all-paths-2026': {
        'documents': [],
        'steps': [],
        'tips': [
            ('إذن عمل رسمي يقوّي ملفك', None),
            ('تحديث بيانات العنوان والبصمة', None),
            ('ترجمات ناقصة/أوراق غير مصدقة', None),
        ],
    },
    'citizenship-syrians': {
        'documents': [],
        # The mechanic that decides everything: you cannot apply, you are
        # nominated. Nothing on the survivor says it.
        'steps': [('تلقّي إشعار بالترشيح', None)],
        'tips': [('لا يوجد تسريع رسمي', None)],
    },
    'real-estate-citizenship': {
        'documents': [],
        'steps': [('تقييم SPK', None)],
        'tips': [
            ('صالح لمدة 3 أشهر', None),
            ('لا تدفع نقداً أبداً', None),
        ],
    },
}

# NOT carried: «تكاليف النوتر والترجمة قد تتجاوز 5,000-10,000 ليرة». It is an
# unsourced money figure of exactly the kind this audit has been removing from
# the consular and visa pages, and it would be inconsistent to import one here.

EDITS = {}
SUPERSEDES = {}

# ── the empty source fields ───────────────────────────────────────────────
SOURCES = {
    'citizenship-track-general':
        'المديرية العامة للنفوس والجنسية (nvi.gov.tr) — خدمة «Vatandaşlık Başvurusu Sorgulama» على بوّابة '
        'e-Devlet، ومنصّة e-içişleri، ومركز الاتصال الرئاسي CİMER.',
    'turkish-citizenship-stages-tracking-2026':
        'المديرية العامة للنفوس والجنسية — صفحة الاستعلام vatan.nvi.gov.tr، وخدمة الاستعلام على e-Devlet. '
        'رسائل الحالة منقولة كما تظهر في النظام.',
    'turkish-citizenship-marriage-syrians-gaziantep':
        'قانون الجنسية التركية رقم 5901، المادة 16 (mevzuat.gov.tr): الزواج من مواطن تركي لا يمنح الجنسية '
        'مباشرةً، ويحقّ التقديم لمن مضى على زواجه ثلاث سنوات على الأقل والزواج قائم. والوثائق بحسب إعلان '
        'مديرية النفوس في غازي عنتاب.',
}

# The three-year rule is stated on the page already and is correct. What it
# lacked was the article number, which is what turns a claim into something the
# reader can check for themselves.
MARRIAGE_CITE = (
    '<div style="margin-top:1.25rem;padding:1rem;border-radius:0.75rem;border:1px solid #bfdbfe;'
    'background:#eff6ff;"><p style="margin:0;"><strong>السند القانوني لشرط الثلاث سنوات:</strong> '
    'المادة 16 من قانون الجنسية التركية رقم 5901 تنصّ على أنّ الزواج من مواطن تركي <em>لا يمنح</em> '
    'الجنسية بذاته، وأنّ من كان متزوّجاً من مواطن تركي منذ ثلاث سنوات على الأقل ولا يزال زواجه قائماً '
    'يجوز له التقدّم بطلب. والبتّ يعود إلى لجنة فحص طلبات الجنسية في الولاية ثمّ إلى الوزارة — '
    'أي أنّ استيفاء الشرط يفتح باب التقديم ولا يضمن القبول.</p></div>'
)

CLUSTER = sorted({s for k, d in MERGES for s in [k] + d} | set(KEEP) | set(SOURCES))
_req = urllib.request.Request(
    '%s/rest/v1/articles?select=slug,title,documents,steps,tips,fees,source,warning,details,views&slug=in.(%s)'
    % (_URL, ','.join(CLUSTER)),
    headers={'apikey': _KEY, 'Authorization': 'Bearer ' + _KEY},
)
rows = {r['slug']: r for r in json.load(urllib.request.urlopen(_req))}
missing = [s for s in CLUSTER if s not in rows]
assert not missing, 'not in the database (already merged?): %s' % missing

# The survivor must be the longer page — the rule this cluster made explicit.
def prose_len(slug):
    return len(re.sub(r'<[^>]+>', ' ', rows[slug].get('details') or '').split())


for keep, drop_list in MERGES:
    for d in drop_list:
        assert prose_len(keep) > prose_len(d), \
            'survivor %s (%d words) is shorter than absorbed %s (%d) — the merge would destroy prose' \
            % (keep, prose_len(keep), d, prose_len(d))


def norm(t):
    t = re.sub(r'<[^>]+>', ' ', str(t or ''))
    t = re.sub(r'[ً-ْ]', '', t)
    for a, b in (('أ', 'ا'), ('إ', 'ا'), ('آ', 'ا'), ('ة', 'ه'), ('ى', 'ي')):
        t = t.replace(a, b)
    return ' '.join(re.sub(r'[^\wء-ي\s]', ' ', t).split()).lower()


def already(item, existing):
    n = norm(item)
    if not n:
        return True
    ti = set(n.split())
    for e in existing:
        ne = norm(e)
        if n == ne or n in ne or ne in n:
            return True
        te = set(ne.split())
        if ti and te and len(ti & te) / len(ti | te) >= 0.55:
            return True
    return False


MATCHED = set()


def carried_form(keep, col, v):
    for i, (needle, cleaned) in enumerate(CARRY[keep][col]):
        if needle in v:
            MATCHED.add((keep, col, i))
            return cleaned if cleaned is not None else v
    return None


def clean_step(s):
    return re.sub(r'^\s*[0-9٠-٩]{1,2}\s*[.\-)]\s*', '', str(s)).strip()


def q(s):
    return str(s or '').replace("'", "''")


def arr(items):
    return 'ARRAY[%s]::text[]' % ', '.join("'%s'" % q(x) for x in items)


out, dropped, summary, drops_log = [], [], [], []

for keep, drop_list in MERGES:
    k = rows[keep]
    docs, steps, tips = (list(k.get(c) or []) for c in ('documents', 'steps', 'tips'))
    steps = [clean_step(s) for s in steps]
    d0, s0, t0 = len(docs), len(steps), len(tips)
    for ds in drop_list:
        d = rows[ds]
        for col, target in (('documents', docs), ('steps', steps), ('tips', tips)):
            for item in (d.get(col) or []):
                v = clean_step(item) if col == 'steps' else str(item)
                take = carried_form(keep, col, v)
                if take and not already(take, target):
                    target.append(take)
                elif not take:
                    drops_log.append((keep, col, v))
    sets = ['documents = %s' % arr(docs), 'steps = %s' % arr(steps), 'tips = %s' % arr(tips),
            'last_update = CURRENT_DATE']
    out.append("-- %s  ←  %d صفحة\nUPDATE articles SET\n    %s\nWHERE slug = '%s';\n"
               % (keep, len(drop_list), ',\n    '.join(sets), keep))
    dropped += drop_list
    summary.append((keep, len(drop_list), d0, len(docs), s0, len(steps), t0, len(tips)))

unmatched = [(k, c, n) for k, cols in CARRY.items() for c, lst in cols.items()
             for i, (n, _) in enumerate(lst) if (k, c, i) not in MATCHED]
assert not unmatched, 'CARRY needle matched nothing (typo?): %s' % unmatched

srcs = []
for slug, src in SOURCES.items():
    assert not str(rows[slug].get('source') or '').strip(), '%s already has a source' % slug
    srcs.append("UPDATE articles SET source = '%s', last_update = CURRENT_DATE\n"
                "WHERE slug = '%s' AND coalesce(trim(source), '') = '';\n" % (q(src), slug))

cite = ("UPDATE articles SET details = coalesce(details, '') || '%s', last_update = CURRENT_DATE\n"
        "WHERE slug = 'turkish-citizenship-marriage-syrians-gaziantep'\n"
        "  AND coalesce(details, '') NOT LIKE '%%المادة 16 من قانون الجنسية%%';\n" % q(MARRIAGE_CITE))
assert 'المادة 16' not in str(rows['turkish-citizenship-marriage-syrians-gaziantep'].get('details') or '')

header = """-- ============================================================================
-- عنقود الجنسية: 17 صفحة ← 12، وستّة حقول مصدر فارغة (2026-08-06)
-- ============================================================================
-- أكبر ما بقي قراءةً، ومشكلته من نوع آخر. لا يكاد يوجد فيه نصّ مكرّر — الموجود
-- بدل ذلك ادّعاءات صحيحة بلا سند خلفها. ستّ صفحات بحقل مصدر فارغ، منها عمود
-- التتبّع بـ228 قراءة، وصفحة بـ88 قراءة تقرّر شرطاً قانونياً بمدّة ثلاث سنوات.
--
-- وكلا الادّعاءين صحيح. شرط «لا تقديم قبل مرور ثلاث سنوات كاملة على عقد
-- الزواج» هو المادة 16 من قانون الجنسية التركية رقم 5901: الزواج من مواطن
-- تركي لا يمنح الجنسية بذاته، ومن مضى على زواجه ثلاث سنوات على الأقل والزواج
-- قائم يجوز له التقدّم. تحقّقنا منه وأُسنِد. وأن تكون على حقّ شيء، وأن يستطيع
-- القارئ التحقّق شيء آخر — ومن يوازن بين الانتظار سنة أخرى والتقديم اليوم
-- يستحقّ رقم المادة.
--
-- والدمج قليل ومحكوم بقاعدة أظهرها هذا العنقود صراحةً: لأنّ المولّد ينقل عناصر
-- القوائم ثمّ يحذف الصفحة، **يجب أن تكون الصفحة الباقية هي الأطول متناً** وإلا
-- أتلف الدمج كتابةً. فالعمود ذو الـ1,190 كلمة يبتلع إعادة صياغة من 103 كلمات،
-- وصفحة المسارات (627) تبتلع نسختين منها (315 و248)، وصفحة العقار (833) تبتلع
-- واحدة من 247 — ولا العكس أبداً، حتى حين تكون الأقصر أكثر قراءةً. والمولّد
-- يفشل إن اختُرقت هذه القاعدة.
--
-- وثلاث صفحات تبدو قابلة للدمج تُترك عمداً لأنّها تجيب أسئلة مختلفة:
--   • صفحة الرابط الرسمي تحمل كشفاً أثمن من طولها: الرابط المتداول غير موجود
--     أصلاً، وموقع turkiye.gov.tr يرجّع 200 لصفحات غير موجودة — فكون الرابط
--     «فتح» لا يثبت شيئاً.
--   • قاموس رسائل المراحل: 1,573 كلمة تفكّ رسائل الحالة التركية، والعمود يحيل
--     إليه أصلاً.
--   • صفحة الكملك موجودة من أجل جملة واحدة لا يقولها غيرها: سنوات الحماية
--     المؤقتة لا تُحتسب في شرط الإقامة.
--
-- ولم يُنقل «تكاليف النوتر والترجمة قد تتجاوز 5,000-10,000 ليرة»: رقم مالي بلا
-- سند، من النوع نفسه الذي أزلناه من صفحات القنصلية والتأشيرات، ونقله هنا كان
-- سيناقض ذلك.
--
-- شغّله بعد اكتمال نشر الشيفرة (التحويلات في next.config.ts).
-- ============================================================================

"""

sql = header + '\n'.join(out)
sql += '\n-- سدّ حقول المصدر الفارغة -----------------------------------------------\n' + '\n'.join(srcs)
sql += '\n-- سند المادة 16 على صفحة الزواج ----------------------------------------\n' + cite
sql += ("\n-- الصفحات المدموجة تُحذف بعد نقل ما يستحقّ\nDELETE FROM articles WHERE slug IN (%s);\n"
        % ', '.join("'%s'" % q(s) for s in dropped))
sql += """
-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — الأول 4 صفوف، والثاني صفر، والثالث 3 صفوف كلّها true
SELECT slug, coalesce(array_length(steps,1),0) AS steps,
       coalesce(array_length(tips,1),0) AS tips, last_update
FROM articles WHERE slug IN (%s) ORDER BY slug;

SELECT slug FROM articles WHERE slug IN (%s);

SELECT slug, (coalesce(trim(source), '') <> '') AS له_مصدر
FROM articles WHERE slug IN (%s) ORDER BY slug;

-- لا يبقى مقال جنسية بلا مصدر
SELECT slug FROM articles
WHERE status = 'approved' AND coalesce(trim(source), '') = ''
  AND (slug LIKE '%%citizenship%%' OR slug LIKE '%%vatandas%%');
""" % (', '.join("'%s'" % k for k, _ in MERGES),
       ', '.join("'%s'" % s for s in dropped),
       ', '.join("'%s'" % s for s in SOURCES))

path = os.path.join(REPO, 'sql', '2026-08-06_merge_citizenship_cluster.sql')
open(path, 'w', encoding='utf-8').write(sql)

print('%-38s %-12s %-12s %s' % ('SURVIVOR', 'prose', 'steps', 'tips'))
for keep, n, d0, d1, s0, s1, t0, t1 in summary:
    print('%-38s %5dك       %2d→%-9d %2d→%d  ← %d' % (keep[:38], prose_len(keep), s0, s1, t0, t1, n))
print()
print('pages removed :', len(dropped))
print('sources filled:', len(SOURCES))
print('items dropped :', len(drops_log))
print('quote parity  :', 'OK' if re.sub(r"''", '', sql).count("'") % 2 == 0 else '*** BROKEN ***')
print('written       :', path, len(sql), 'chars')
print()
print('--- next.config.ts redirects ---')
for keep, drop_list in MERGES:
    for d in drop_list:
        print("      { source: '/article/%s', destination: '/article/%s', permanent: true }," % (d, keep))
