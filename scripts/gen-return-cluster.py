# -*- coding: utf-8 -*-
"""Leaving for Syria: 18 pages -> 9, two mislabelled codes, and one broker route.

The highest-consequence cluster on the site. A wrong answer here does not cost a
reader a wasted trip; it costs them their temporary protection, permanently.

Three findings, in order of harm.

1. TWO PAGES ATTACH THE WRONG CODE TO A CONSEQUENCE, and the site's own audited
   table is what proves it. security_codes holds 125 entries checked against
   authoritative sources in an earlier pass, and it says:
       V-87  = عودة طوعية        (voluntary return, administrative)
       G-87  = تهديد الأمن العام  (threat to public security)
       V-160 = تجميد عنوان        (address freeze, until the person is located)
   syria-visit-official tells readers an irregular crossing gets them G-87 — a
   public-security code, far graver than what it describes. travel-permit-2026
   tells them travelling without a permit cancels the kimlik under V-160, when
   V-160 is an address freeze and not a cancellation. Neither claim survives.
   Neither is carried into the survivor either: this file does not move a code
   label it cannot match to the audited table.

2. ONE PAGE IS A BROKER ROUTE. syria-travel-permits-kimlik-holders-2026 is
   eleven words of body and four steps, and the steps are: apply to become a
   member of an unnamed "organization", ask them to file for your permit, wait
   ten to twenty days, then go to the crossing on VERBAL approval. That is the
   thing every other page in this cluster warns against, and CLAUDE.md forbids
   routing readers through intermediaries outright. It is deleted with nothing
   carried across — the only page in ten passes handled that way.

3. The rest is the usual shape: a 1,397-word voluntary-return pillar with five
   30-to-175-word restatements orbiting it, and a travel-permit page with two.

What the survivor gains instead of the code labels is the consequence stated
plainly — leaving without prior permission can end the protection — with the
codes page linked so a reader can look up what any code they are actually shown
means, rather than being told in advance which one they will get.
"""
import json, os, re, urllib.parse, urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

_env = {}
for _l in open(os.path.join(REPO, '.env.local'), encoding='utf-8-sig').read().splitlines():
    if '=' in _l and not _l.lstrip().startswith('#'):
        _k, _v = _l.split('=', 1)
        _env[_k.strip()] = _v.strip()
_URL, _KEY = _env['NEXT_PUBLIC_SUPABASE_URL'], _env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

# Arabic slugs break PostgREST's in.() — fetch everything and filter locally.
rows = {}
for off in range(0, 700, 100):
    req = urllib.request.Request(
        '%s/rest/v1/articles?select=slug,title,documents,steps,tips,fees,source,warning,details,views'
        '&status=eq.approved&order=slug.asc' % _URL,
        headers={'apikey': _KEY, 'Authorization': 'Bearer ' + _KEY,
                 'Range': '%d-%d' % (off, off + 99)},
    )
    part = json.load(urllib.request.urlopen(req))
    for r in part:
        rows[r['slug']] = r
    if len(part) < 100:
        break

ARABIC_SLUG = next((s for s in rows if 'عودة-طوع' in s), None)
assert ARABIC_SLUG, 'the voluntary-return question page is gone'

# Yol İzin is INTERNAL travel between Turkish provinces. Crossing into Syria is
# a different procedure with a different authority and a different consequence.
# The first draft of this file merged them, which is the same conflation this
# audit keeps correcting on the site — caught here before it shipped.
MERGES = [
    ('travel-permit', ['travel-permit-2026']),
    ('syria-turkey-border-crossings-2026', [
        'syria-visit-official',
        # Deleted, not merged — see DELETE_ONLY.
        'syria-travel-permits-kimlik-holders-2026',
    ]),
    ('voluntary-return-syria-procedure-2026', [
        'kimlik-leaving-turkey',
        'leaving-turkey-final',
        'exit-cancel-residence-return-card',
        'exit-close-bank-accounts',
        ARABIC_SLUG,
    ]),
]

DELETE_ONLY = {'syria-travel-permits-kimlik-holders-2026'}

KEEP = {
    'voluntary-return-syria-appointment-system-2026': 'نظام مواعيد العودة الطوعية — إجراء مستقلّ.',
    'goc-idaresi-syrians-return-figures-2026-06': 'أرقام إدارة الهجرة — خبر مؤرَّخ.',
    'syrian-passport-renewal': 'الجواز السوري — عنقود القنصلية.',
    'work-visa-syrians-return-turkey-2026-06': 'فيزا العمل للعائدين — مسار دخول لا خروج.',
    'akcakale-border-passport-syrians-2026': 'معبر أقجة قلعة تحديداً.',
    'kilis-trade-permit-6-months-2026': 'إجازة التاجر من كلس — إجراء ولاية بعينها.',
    'undocumented-status': 'بدون أوراق — سؤال مختلف: تسوية وضع لا مغادرة.',
}

CARRY = {
    'travel-permit': {
        'documents': [],
        'steps': [('أرفق وثيقة تثبت السبب', None)],
        'tips': [('إذن السفر ضروري لقطع تذاكر', None)],
    },
    'syria-turkey-border-crossings-2026': {
        'documents': [],
        'steps': [('اخرج وعُد عبر المعبر الرسمي المحدد فقط', None)],
        'tips': [
            ('هذا البرنامج موسمي وقد يتوقف', None),
            ('تجنّب السماسرة الذين يدّعون ترتيب إجازات مدفوعة', None),
        ],
    },
    'voluntary-return-syria-procedure-2026': {
        'documents': [],
        'steps': [
            ('تأكد من عدم وجود ديون أو منع سفر', None),
            ('أوقف أوامر الدفع التلقائي', None),
            ('اطلب وثيقة/إشعار إغلاق الحساب', None),
        ],
        'tips': [
            ('لا تتخذ قرار العودة تحت ضغط', None),
            ('لا تترك معاملات معلقة قد تتحول لدين', None),
            ('لا تعتمد على “قالوا لي”', None),
        ],
    },
}

# NOT carried, deliberately:
#   • «إبطال الكملك (Code V-160)» — V-160 is an address freeze in the audited
#     table, not a cancellation.
#   • «ووضع كود G-87» for an irregular crossing — G-87 is a public-security code.
#   Both are replaced by the block below, which states the consequence and sends
#   the reader to the codes page instead of predicting a code for them.

CODES_BLOCK = (
    '<div style="margin-top:1.25rem;padding:1rem;border-radius:0.75rem;border:1px solid #fecaca;'
    'background:#fef2f2;"><p style="margin:0 0 .5rem 0;"><strong>ما الذي تخاطر به فعلاً:</strong> '
    'الخروج من تركيا بلا إذن مسبق من مديرية الهجرة قد يُنهي وضعك تحت الحماية المؤقتة — وهذه هي '
    'النتيجة التي تعنيك، لا رمز بعينه.</p>'
    '<p style="margin:0;"><strong>وعن الأكواد:</strong> تتداول صفحات كثيرة أنّ المخالفة «تضع كودَ كذا». '
    'راجعنا جدول الأكواد المدقَّق عندنا (125 كوداً) فوجدنا أنّ <strong>V-160</strong> هو تجميد عنوان لا '
    'إبطال بطاقة، وأنّ <strong>G-87</strong> كود أمني لتهديد الأمن العام لا نتيجةَ عبورٍ غير نظامي. '
    'فلا تصدّق من يخبرك سلفاً بالكود الذي ستناله — وإن رأيت كوداً على ملفك فابحث عن معناه في '
    '<a href="/codes" style="color:#b91c1c;font-weight:bold;">صفحة الأكواد الأمنية ←</a></p></div>'
)

SOURCES = {
    'travel-permit': None,   # already sourced; filled below only if empty
}

MANUAL_SOURCES = {
    'syria-visit-official': None,
    'leaving-turkey-final': None,
}


def prose_len(slug):
    return len(re.sub(r'<[^>]+>', ' ', rows[slug].get('details') or '').split())


CLUSTER = sorted({s for k, d in MERGES for s in [k] + d} | set(KEEP))
missing = [s for s in CLUSTER if s not in rows]
assert not missing, 'not in the database (already merged?): %s' % missing

for keep, drop_list in MERGES:
    for d in drop_list:
        assert prose_len(keep) > prose_len(d), \
            'survivor %s (%d words) shorter than absorbed %s (%d)' % (keep, prose_len(keep), d, prose_len(d))


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
    s0, t0 = len(steps), len(tips)
    for ds in drop_list:
        dropped.append(ds)
        if ds in DELETE_ONLY:
            continue
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
    summary.append((keep, len(drop_list), s0, len(steps), t0, len(tips)))

unmatched = [(k, c, n) for k, cols in CARRY.items() for c, lst in cols.items()
             for i, (n, _) in enumerate(lst) if (k, c, i) not in MATCHED]
assert not unmatched, 'CARRY needle matched nothing (typo?): %s' % unmatched

# The mislabelled codes must not survive on the survivor either.
for keep, _ in MERGES:
    blob = json.dumps([rows[keep].get('details'), rows[keep].get('steps'), rows[keep].get('tips')],
                      ensure_ascii=False)
    assert 'V-160' not in blob and 'G-87' not in blob, '%s already carries a code label' % keep

# One block on EACH page that carried a wrong label: V-160 was on the internal
# travel stub, G-87 on the Syria-visit stub. A first attempt wrote it only to
# travel-permit, which left the correction off the 451-read border page where
# readers actually land — see sql/2026-08-06_codes_block_border_page.sql for the
# follow-up that fixed it in production.
CODES_PAGES = ('travel-permit', 'syria-turkey-border-crossings-2026')
codes_sql = '
'.join(
    "UPDATE articles SET details = coalesce(details, '') || '" + q(CODES_BLOCK) + "', "
    "last_update = CURRENT_DATE
"
    "WHERE slug = '" + sl + "' AND coalesce(details, '') NOT LIKE '%الأكواد المدقَّق%';
"
    for sl in CODES_PAGES)

header = """-- ============================================================================
-- عنقود المغادرة إلى سوريا: 18 صفحة ← 9 (2026-08-06)
-- ============================================================================
-- أخطر عنقود على الموقع. الجواب الخاطئ هنا لا يكلّف القارئ رحلة ضائعة — يكلّفه
-- حمايته المؤقتة، نهائياً.
--
-- ── 1) صفحتان تُلصقان الكود الخطأ بالنتيجة ────────────────────────────────
--
-- وجدول الأكواد المدقَّق عندنا هو ما يُثبت ذلك: 125 كوداً روجعت على مصادر
-- معتمدة في تدقيق سابق، وهي تقول:
--     V-87  = عودة طوعية        (إداري)
--     G-87  = تهديد الأمن العام  (أمن وجرائم)
--     V-160 = تجميد عنوان        (حتى العثور على الشخص أو تثبيت عنوانه)
--
-- صفحة «زيارة سوريا بالكملك» تقول للقارئ إنّ العبور غير الرسمي يضع كود G-87 —
-- وهو كود أمني أثقل بكثير ممّا تصفه. وصفحة «أذونات السفر 2026» تقول إنّ السفر
-- بلا إذن يُبطل الكملك بالكود V-160 — وV-160 تجميد عنوان لا إبطال بطاقة.
-- الادّعاءان لا يبقيان، ولا يُنقلان إلى الصفحة الباقية: هذا الملف لا ينقل
-- تسمية كود لا يطابق الجدول المدقَّق.
--
-- ── 2) صفحة تمرّ بوسيط ───────────────────────────────────────────────────
--
-- «اجازات ل سوريا 2026» متنها إحدى عشرة كلمة، وخطواتها الأربع: قدّم طلباً
-- لتصير عضواً في «المنظمة»، واطلب منهم رفع طلبك، وانتظر عشرة إلى عشرين يوماً،
-- ثم اذهب إلى المعبر بـ«الموافقة الشفهية». وهذا بعينه ما تحذّر منه كل صفحة
-- أخرى في العنقود، وما يمنعه CLAUDE.md صراحةً. تُحذف ولا يُنقل منها حرف —
-- الصفحة الوحيدة التي عوملت هكذا في عشر تمريرات.
--
-- ── 3) والباقي الشكل المعتاد ─────────────────────────────────────────────
--
-- عمود العودة الطوعية (1,397 كلمة) تدور حوله خمس صفحات بين 30 و175 كلمة تعيد
-- صياغته، وصفحة إذن السفر ومعها اثنتان.
--
-- وما تكسبه الصفحة الباقية بدل تسميات الأكواد: النتيجة مقولةً صراحةً — المغادرة
-- بلا إذن مسبق قد تُنهي الحماية — ورابط صفحة الأكواد ليبحث القارئ عن معنى أي
-- كود يراه فعلاً، بدل أن يُقال له سلفاً أيّ كود سيناله.
--
-- شغّله بعد اكتمال نشر الشيفرة (التحويلات في next.config.ts).
-- ============================================================================

"""

sql = header + '\n'.join(out)
sql += '\n-- النتيجة الحقيقية، ورابط جدول الأكواد بدل تسمية مخترَعة ------------------\n' + codes_sql
sql += ("\n-- الصفحات المدموجة والمحذوفة\nDELETE FROM articles WHERE slug IN (%s);\n"
        % ', '.join("'%s'" % q(s) for s in dropped))
sql += """
-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — الأول صفّان، والثاني صفر، والثالث صفر (لا كود مخترَع بقي)
SELECT slug, coalesce(array_length(steps,1),0) AS steps,
       coalesce(array_length(tips,1),0) AS tips, last_update
FROM articles WHERE slug IN (%s) ORDER BY slug;

SELECT slug FROM articles WHERE slug IN (%s);

SELECT slug FROM articles
WHERE status = 'approved'
  AND (details LIKE '%%Code V-160%%' OR details LIKE '%%كود G-87%%'
       OR array_to_string(tips, ' ') LIKE '%%V-160%%');
""" % (', '.join("'%s'" % k for k, _ in MERGES), ', '.join("'%s'" % q(s) for s in dropped))

path = os.path.join(REPO, 'sql', '2026-08-06_merge_return_cluster.sql')
open(path, 'w', encoding='utf-8').write(sql)

print('%-42s %-8s %-11s %s' % ('SURVIVOR', 'متن', 'steps', 'tips'))
for keep, n, s0, s1, t0, t1 in summary:
    print('%-42s %5dك  %2d→%-8d %2d→%d  ← %d' % (keep[:42], prose_len(keep), s0, s1, t0, t1, n))
print()
print('pages removed  :', len(dropped), '(منها 1 حذف بلا نقل)')
print('items dropped  :', len(drops_log))
print('quote parity   :', 'OK' if re.sub(r"''", '', sql).count("'") % 2 == 0 else '*** BROKEN ***')
print('written        :', path, len(sql), 'chars')
print()
# Arabic slugs must be percent-encoded in next.config.ts — the matcher works on
# the encoded path, and the existing Arabic redirects in that file are encoded
# too. Left raw, the rule silently never fires.
print('--- next.config.ts redirects ---')
for keep, drop_list in MERGES:
    for d in drop_list:
        src = urllib.parse.quote(d, safe='-') if any(ord(c) > 127 for c in d) else d
        print("      { source: '/article/%s', destination: '/article/%s', permanent: true }," % (src, keep))
