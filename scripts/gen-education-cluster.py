# -*- coding: utf-8 -*-
"""Education: 27 pages -> 18, and the four scholarship pages that must NOT merge.

The shape is familiar by now — three strong pillars with 20-to-131-word cards
orbiting them. School registration is 1,089 words and had four separate stubs
restating pieces of it, one of them twenty words long. Diploma equivalency is
824 words and had two.

The interesting call in this cluster is the one NOT to merge. Four scholarship
pages look like a classic pile: 1,077 words on Türkiye Bursları, then 645 on the
university programmes, 581 on application tips and 413 on the overview, with a
measured 24% overlap between two of them. Every previous pass would have folded
the three into the one. Here that would destroy 1,639 words of real writing,
because the generator carries list items and deletes the page — and 24% overlap
across four substantial guides is topical proximity, not duplication. They stay.
What they lacked was any link between them, and that is a separate, smaller job
than a merge.

Two sources filled. The attestation page carries 155 reads on 373 words with an
empty source, and it describes the chain a student's Turkish document takes to
be usable in Syria — that chain runs through the Turkish governorate's apostille
and then the Syrian consulate, and the page now says so. TÖMER registration gets
the language-centre framing it was missing.
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

MERGES = [
    ('school-registration-turkey', [
        'enroll-child-turkish-public-school',
        'school-transfer',
        'school-types-turkey',
        'kimlik-school-enrollment',
    ]),
    ('diploma-denklik-syrians-arabs-2026', ['highschool-denklik', 'school-equivalency']),
    ('study-in-turkey-universities-2026', ['education-universities']),
    ('yks-vs-yos-placement-by-schooling-2026', ['yos-exam-guide']),
    ('tourist-vs-student-residence-2025', ['student-residence']),
]

KEEP = {
    'scholarship-turkiye-burslari': 'منحة الحكومة التركية — 1,077 كلمة.',
    'scholarship-university-programs': '645 كلمة عن برامج الجامعات — دمجها في المنحة الحكومية يُتلف كتابةً حقيقية.',
    'scholarship-application-tips': '581 كلمة عن الملفّ نفسه — سؤال «كيف أقوّي طلبي» لا «ما هي المنحة».',
    'scholarship-turkey-overview': '413 كلمة خريطةً عامة للمنح — تداخلها 24% تقارُبٌ موضوعي لا تكرار.',
    'private-universities-turkey-2026': 'الجامعات الخاصة — 600 كلمة.',
    'masters-phd-turkey-foreigners-2026': 'الماجستير والدكتوراه — 627 كلمة.',
    'after-yos-turkey-university-tercih-application-registration-2026': 'ما بعد اليوس والتفضيلات — 738 كلمة.',
    'kyk-yurt-devlet-yabanci-suriyeli-ogrenciler-2026': 'السكن الجامعي الحكومي — 749 كلمة.',
    'mesem-vocational-training-syrians-foreigners-turkey-2026': 'التدريب المهني — 604 كلمات.',
    'turkey-study-visa-syrians-2026': 'تأشيرة الدراسة — دخول لا إقامة، وعنقود التأشيرات.',
    'work-permit-students': 'عمل الطالب بدوام جزئي — عنقود إذن العمل.',
}

CARRY = {
    'school-registration-turkey': {
        'documents': [],
        'steps': [
            ('Nakil', None),      # the transfer procedure has a name
            ('e-Okul', None),
        ],
        'tips': [
            ('PICTES', None),     # the support programme for Syrian pupils
            ('إمام خطيب', None),
            ('منحاً للطلاب المتفوقين', None),
            ('العنوان هو المفتاح', None),
            ('Seviye', None),     # placement year for a child who never enrolled
        ],
    },
    'diploma-denklik-syrians-arabs-2026': {
        'documents': [],
        'steps': [('مديرية التربية', None)],
        'tips': [
            ('اختبار بديل', None),          # you can equivalence without the original
            ('المعادلة مجانية', None),
            ('بعض الولايات توفره بالعربية', None),
        ],
    },
    'study-in-turkey-universities-2026': {
        'documents': [('Dengi', None)],
        'steps': [('مرتين سنوياً', None)],
        'tips': [],
    },
    'yks-vs-yos-placement-by-schooling-2026': {
        'documents': [],
        'steps': [('ÖSYM لمواعيد', None)],
        'tips': [
            ('لا تنتظر صدور النتيجة', None),
            ('اختر جامعات متعددة', None),
        ],
    },
    'tourist-vs-student-residence-2025': {
        'documents': [('Öğrenci Belgesi', None)],
        'steps': [('Öğrenci İkameti', None)],
        'tips': [('وثيقة طالب قديمة', None)],
    },
}

SOURCES = {
    'document-attestation-turkey-to-syria-students-2026':
        'سلسلة التصديق المعمول بها: تصديق الوثيقة التركية لدى الجهة التركية المختصة (الولاية — Valilik — '
        'أو الجهة التي تُصدّق حسب نوع الوثيقة)، ثمّ تصديقها في القنصلية العامة للجمهورية العربية السورية. '
        'والتفاصيل والرسوم تتغيّر، فأكّدها في القنصلية قبل التوجّه — راجع دليل القنصليات على /consulates.',
    'tomer-registration':
        'مراكز تعليم اللغة التركية للأجانب (TÖMER) التابعة للجامعات التركية — شروط التسجيل والمستويات '
        'والرسوم تحدّدها كل جامعة على حدة، فراجع صفحة المركز في الجامعة التي تقصدها.',
}


def prose_len(slug):
    return len(re.sub(r'<[^>]+>', ' ', rows[slug].get('details') or '').split())


CLUSTER = sorted({s for k, d in MERGES for s in [k] + d} | set(KEEP) | set(SOURCES))
missing = [s for s in CLUSTER if s not in rows]
assert not missing, 'not in the database (already merged?): %s' % missing

for keep, drop_list in MERGES:
    for d in drop_list:
        assert prose_len(keep) > prose_len(d), \
            'survivor %s (%d words) shorter than absorbed %s (%d)' % (keep, prose_len(keep), d, prose_len(d))

# The scholarship four must still all be there when this runs: the whole point of
# the pass is that they were not merged.
for s in ('scholarship-turkiye-burslari', 'scholarship-university-programs',
          'scholarship-application-tips', 'scholarship-turkey-overview'):
    assert s in rows, 'a scholarship page went missing: %s' % s


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
    summary.append((keep, len(drop_list), s0, len(steps), t0, len(tips)))

unmatched = [(k, c, n) for k, cols in CARRY.items() for c, lst in cols.items()
             for i, (n, _) in enumerate(lst) if (k, c, i) not in MATCHED]
assert not unmatched, 'CARRY needle matched nothing (typo?): %s' % unmatched

srcs = []
for slug, src in SOURCES.items():
    assert not str(rows[slug].get('source') or '').strip(), '%s already has a source' % slug
    srcs.append("UPDATE articles SET source = '%s', last_update = CURRENT_DATE\n"
                "WHERE slug = '%s' AND coalesce(trim(source), '') = '';\n" % (q(src), slug))

header = """-- ============================================================================
-- عنقود التعليم: 27 صفحة ← 18 (2026-08-06)
-- ============================================================================
-- الشكل صار مألوفاً: ثلاثة أعمدة قوية تدور حولها كروت بين 20 و131 كلمة. تسجيل
-- المدارس 1,089 كلمة وحوله أربع صفحات تعيد أجزاءه، إحداها عشرون كلمة. ومعادلة
-- الشهادات 824 كلمة وحولها اثنتان.
--
-- ── والقرار المهمّ هنا هو ألّا نَدمج ──────────────────────────────────────
--
-- أربع صفحات منح تبدو كومةً كلاسيكية: 1,077 كلمة عن منحة الحكومة التركية، ثمّ
-- 645 عن برامج الجامعات، و581 عن تقوية الطلب، و413 خريطةً عامة — وبين اثنتين
-- منها تداخل مقيس 24%.
--
-- كل تمريرة سابقة كانت ستطوي الثلاث في الواحدة. وهنا سيُتلف ذلك 1,639 كلمة من
-- كتابة حقيقية، لأنّ المولّد ينقل عناصر القوائم ثمّ يحذف الصفحة. وتداخل 24%
-- بين أربعة أدلّة موسّعة تقارُبٌ موضوعي لا تكرار: واحدة تجيب «ما هي المنحة»،
-- وأخرى «أي البرامج»، وثالثة «كيف أقوّي ملفّي». تبقى الأربع.
--
-- وما ينقصها ليس الدمج بل الربط بينها — وهو عمل أصغر وأدقّ، مؤجَّل عن قصد.
--
-- ── ومصدران يُسدّان ──────────────────────────────────────────────────────
--
-- صفحة تصديق وثائق الطلاب تحمل 155 قراءة على 373 كلمة بحقل مصدر فارغ، وتصف
-- السلسلة التي تمرّ بها الوثيقة التركية لتصلح للاستعمال في سوريا: تصديق الجهة
-- التركية المختصة ثمّ القنصلية السورية. صارت تقولها.
--
-- شغّله بعد اكتمال نشر الشيفرة (التحويلات في next.config.ts).
-- ============================================================================

"""

sql = header + '\n'.join(out)
sql += '\n-- سدّ حقول المصدر -------------------------------------------------------\n' + '\n'.join(srcs)
sql += ("\n-- الصفحات المدموجة تُحذف بعد نقل ما يستحقّ\nDELETE FROM articles WHERE slug IN (%s);\n"
        % ', '.join("'%s'" % q(s) for s in dropped))
sql += """
-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — الأول 5 صفوف، والثاني صفر، والثالث 4 صفوف (المنح كلّها باقية)
SELECT slug, coalesce(array_length(steps,1),0) AS steps,
       coalesce(array_length(tips,1),0) AS tips, last_update
FROM articles WHERE slug IN (%s) ORDER BY slug;

SELECT slug FROM articles WHERE slug IN (%s);

SELECT slug FROM articles WHERE slug IN
  ('scholarship-turkiye-burslari', 'scholarship-university-programs',
   'scholarship-application-tips', 'scholarship-turkey-overview') ORDER BY slug;
""" % (', '.join("'%s'" % k for k, _ in MERGES), ', '.join("'%s'" % q(s) for s in dropped))

path = os.path.join(REPO, 'sql', '2026-08-06_merge_education_cluster.sql')
open(path, 'w', encoding='utf-8').write(sql)

print('%-46s %-8s %-11s %s' % ('SURVIVOR', 'متن', 'steps', 'tips'))
for keep, n, s0, s1, t0, t1 in summary:
    print('%-46s %5dك  %2d→%-8d %2d→%d  ← %d' % (keep[:46], prose_len(keep), s0, s1, t0, t1, n))
print()
print('pages removed :', len(dropped))
print('sources filled:', len(SOURCES))
print('NOT merged    : 4 صفحات منح (1,639 كلمة كانت ستُتلَف)')
print('items dropped :', len(drops_log))
print('quote parity  :', 'OK' if re.sub(r"''", '', sql).count("'") % 2 == 0 else '*** BROKEN ***')
print('written       :', path, len(sql), 'chars')
print()
print('--- next.config.ts redirects ---')
for keep, drop_list in MERGES:
    for d in drop_list:
        print("      { source: '/article/%s', destination: '/article/%s', permanent: true }," % (d, keep))
