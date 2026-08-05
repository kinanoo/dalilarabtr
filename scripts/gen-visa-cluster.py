# -*- coding: utf-8 -*-
"""The visa cluster: 19 pages -> 8, and one sourcing rule enforced.

Two pillars measured as genuinely separate and both survive:
  • turkey-visa-types-2026 (1,085 reads) — what a visa COSTS, by nationality.
  • syria-turkey-visa-types-2026 (245)   — the seven visa TYPES open to Syrians.
Their overlap is below the 18% floor; they answer different questions.

What sits under them does not. Five of the seven type pages are 130-190-word
stubs overlapping each other by 18-39% — the parent already tabulates all seven
in one comparison table — and four December-2025 pages restate "which visa do I
need / is e-Visa enough / who is exempt", which the price pillar answers by
nationality. A treatment-visa stub duplicates the 508-word medical-visa page.

The sourcing problem is the reason this cluster mattered more than its size.

CLAUDE.md is explicit: attribute content to the primary source, never to a
social-media page. Eight pages here sourced their fees to a Facebook post by a
civil-society union (UCSO) — $125 transit, $145 study, $165 haulage. The
statutory Turkish fee for the same transit visa, verified against the migration
authority's own table (goc.gov.tr, effective 01.01.2026 per Resmî Gazete
31.12.2025 no. 33124), is 9,376.40 TL — roughly $234 at current rates. That is
not a small discrepancy, and the site published both numbers without ever noting
that they disagree or that one of them came off Facebook.

The fix is not to delete the dollar figures: a reader applying through the
authorized office inside Syria genuinely needs to know what that office charges,
and an NGO announcement is the only account of it we have. The fix is to say
exactly that — who announced it, that it is not a Turkish government
publication, what the statutory fee is, and to link the pillar that carries it.
Same treatment as the consular fees.

While verifying I also re-checked the price pillar's whole table against
goc.gov.tr. Every figure matches: 9,376.40 / 31,410.00 / 18,813.80 / 15,672.10.
It needed no correction.
"""
import json, os, re, urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

_env = {}
for _l in open(os.path.join(REPO, '.env.local'), encoding='utf-8-sig').read().splitlines():
    if '=' in _l and not _l.lstrip().startswith('#'):
        _k, _v = _l.split('=', 1)
        _env[_k.strip()] = _v.strip()
_URL, _KEY = _env['NEXT_PUBLIC_SUPABASE_URL'], _env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

MERGES = [
    # The seven types already live in one comparison table on the parent. Five of
    # the stubs are 130-190 words overlapping each other 18-39%. The
    # "visa from inside Syria" page (152 reads) asks the same question the parent
    # answers — the parent is the one that names the authorized office.
    ('syria-turkey-visa-types-2026', [
        'turkey-transit-visa-syrians-2026',
        'turkey-business-visa-syrians-2026',
        'turkey-meeting-conference-visa-syrians-2026',
        'turkey-sailor-visa-syrians-2026',
        'turkey-truck-driver-visa-syrians-2026',
        'turkey-visa-from-syria',
    ]),
    # 180-word stub vs a 508-word page on the same visa, sourced to mfa.gov.tr.
    ('turkey-medical-visa', ['turkey-treatment-visa-syrians-2026']),
    # "Which visa / e-Visa or embassy / who is exempt" is what the price pillar
    # answers, nationality by nationality, with the statutory fee table.
    ('turkey-visa-types-2026', [
        'turkey-visa-overview',
        'turkey-evisa-guide',
        'turkey-visa-europe-foreigners',
        'turkey-visa-arab-countries',
    ]),
]

KEEP = {
    'turkey-study-visa-syrians-2026': 'الدراسة سؤال قائم بذاته بحجم بحث حقيقي — 52 قراءة، ويُعمَّق لا يُدمج.',
    'turkey-visa-from-lebanon': 'مسار قطري محدّد من لبنان، 90 قراءة و488 كلمة.',
    'turkey-work-visa-guide': 'تأشيرة العمل (الدخول) غير إذن العمل (التوظيف) — عنقود آخر.',
    'work-visa-syrians-return-turkey-2026-06': 'عودة من غادر بالعودة الطوعية — سؤال مستقلّ وحسّاس.',
    'overstay-solutions': 'تجاوز المدة ومدد المنع — ليس عن الحصول على تأشيرة.',
}

# Every absorbed page repeats "apply through Visa FG, the mission decides" as its
# two steps; the parent already says both. What is carried is the handful of
# concrete requirements that exist on exactly one page — a photo size, a
# notarised invitation, a passport validity that differs from the rest.
CARRY = {
    'syria-turkey-visa-types-2026': {
        'documents': [
            # NOT carried: the photo spec, the criminal record and the one-year
            # passport for haulage. The parent already states all three, in
            # different words that the overlap filter cannot see — which is how
            # the first pass produced a checklist listing each one twice.
            ('خطاب رسمي + موثّق من كاتب العدل',
             'للتأشيرة التجارية: خطاب دعوة رسمي موثّق من كاتب العدل'),
            ('وثائق الشركة (غرفة التجارة + سجل تجاري + ضريبة)',
             'للتأشيرة التجارية: وثائق الشركة الداعية — غرفة التجارة والسجل التجاري والبيان الضريبي'),
            ('عقد بحري ساري', 'لتأشيرة البحّارة: عقد بحري ساري ووثائق السفينة وشهادات بحرية مناسبة'),
            ('إثبات إقامة قانونية في بلد التقديم إن كان خارج سوريا',
             'إن كنت تقدّم من خارج سوريا: إثبات إقامة قانونية في بلد التقديم (إقامة أو فيزا أو ختم دخول)'),
        ],
        'steps': [],
        'tips': [
            # Same reason: sworn translation, under-12s and the annual haulage
            # visa are all already on the parent.
            ('لا قائمة موحّدة كباقي التأشيرات',
             'تأشيرة البحّارة وحدها بلا قائمة وثائق موحّدة — تُحدَّد حالةً بحالة بحسب العقد البحري'),
            ('لا تقدم ببيانات متناقضة', None),
        ],
    },
    'turkey-medical-visa': {
        'documents': [
            ('وثيقة USHAŞ أو HİB (جوهري)', None),
            ('موافقة كاتب العدل للقاصرين المرافقين', None),
        ],
        'steps': [],
        'tips': [('بدون وثيقة USHAŞ أو HİB الرفض مضمون', None)],
    },
    'turkey-visa-types-2026': {
        'documents': [],
        'steps': [
            ('مطابقة للآلة المقروءة (MRZ)', None),
        ],
        'tips': [
            ('لا تخلط بين “إعفاء” و”e-Visa”', None),
            ('أي خطأ في رقم الجواز/الاسم', None),
            ('تقدّم من بلد ليس بلد جنسيتك', None),
        ],
    },
}

EDITS = {}
# The carried line is the precise version of one the survivor states loosely:
# the medical page calls the USHAŞ/HİB document "if requested" when it is the
# gate the whole application turns on.
SUPERSEDES = {
    'وثيقة USHAŞ أو HİB (جوهري)': 'وثيقة/دعوة علاجية من مستشفى',
}

# ── the sourcing correction ───────────────────────────────────────────────
UCSO_SOURCE = (
    'اتحاد منظمات المجتمع المدني للتنمية (UCSO) — facebook.com/ucso.sy — منشور رسمي بقلم عبد الغني نجمي، '
    'بتوجيه السيد مهدي داود (رئيس الاتحاد). الجهة المعتمدة للطلبات في سوريا: Visa FG — sy.visafg.com/ar.'
)
UCSO_SOURCE_FIXED = (
    'الأرقام بالدولار في هذه الصفحة مصدرها إعلان اتحاد منظمات المجتمع المدني للتنمية (UCSO) على صفحته '
    'على فيسبوك — وهو اتحاد أهلي، لا جهة حكومية تركية، ولم نجد الأرقام منشورةً على أي موقع رسمي تركي. '
    'أمّا الرسم القانوني التركي فتنشره رئاسة إدارة الهجرة (goc.gov.tr) نافذاً من 1 كانون الثاني 2026 '
    'بموجب الجريدة الرسمية 31 كانون الأول 2025 العدد 33124. والجهة المذكورة للتقديم في سوريا: '
    'Visa FG — sy.visafg.com/ar.'
)

FEE_CAVEAT = (
    '<div style="margin-top:1.25rem;padding:1rem;border-radius:0.75rem;border:1px solid #fcd34d;'
    'background:#fffbeb;"><p style="margin:0 0 .5rem 0;"><strong>عن الأرقام بالدولار في هذه الصفحة:</strong> '
    'مصدرها إعلان اتحاد منظمات المجتمع المدني للتنمية (UCSO) — وهو اتحاد أهلي لا جهة حكومية تركية. '
    'لم نعثر على هذه الأرقام منشورةً على أي موقع رسمي تركي، فلا نستطيع تأكيدها.</p>'
    '<p style="margin:0 0 .5rem 0;">والرسم القانوني الذي تنشره رئاسة إدارة الهجرة التركية للتأشيرة، '
    'نافذاً من 1 كانون الثاني 2026 (الجريدة الرسمية 31 كانون الأول 2025، العدد 33124): '
    '<strong>9,376.40 ليرة</strong> لتأشيرة الدخول بمرّة واحدة أو تأشيرة العبور، و<strong>31,410.00 ليرة</strong> '
    'لمتعدّدة الدخول. وهو رقم مختلف عمّا يذكره إعلان الاتحاد.</p>'
    '<p style="margin:0;">الاحتمال الأرجح أنّ الفرق يعود إلى ما يتقاضاه المكتب المعتمد داخل سوريا لا إلى '
    'الرسم القانوني نفسه — لكنّه احتمال لا تأكيد. <strong>أكّد المبلغ في المكتب قبل الدفع</strong>، وراجع '
    '<a href="/article/turkey-visa-types-2026" style="color:#b45309;font-weight:bold;">جدول الرسوم القانونية '
    'بالليرة ومَن يُعفى منها</a>.</p></div>'
)

CORRECTIONS = [
    ('syria-turkey-visa-types-2026', 'source', UCSO_SOURCE, UCSO_SOURCE_FIXED),
]

# Cross-links between the two pillars: each answers what the other does not, and
# neither linked to the other.
CROSSLINK = {
    'syria-turkey-visa-types-2026': FEE_CAVEAT,
    'turkey-visa-types-2026': (
        '<div style="margin-top:1.25rem;padding:1rem;border-radius:0.75rem;border:1px solid #a7f3d0;'
        'background:#ecfdf5;"><p style="margin:0;"><strong>سوري وتقدّم من داخل سوريا؟</strong> '
        'الأنواع السبعة المفتوحة أمامك — العبور والاجتماعات والتجارية والدراسة والعلاج والنقل البري والبحّارة — '
        'ووثائق كلّ نوع، والمكتب المعتمد للتقديم، في '
        '<a href="/article/syria-turkey-visa-types-2026" style="color:#047857;font-weight:bold;">'
        'دليل التأشيرات التركية للسوريين ←</a></p></div>'
    ),
}

RETITLE = {}

CLUSTER = sorted({s for k, d in MERGES for s in [k] + d} | set(KEEP) |
                 {c[0] for c in CORRECTIONS} | set(CROSSLINK))
_req = urllib.request.Request(
    '%s/rest/v1/articles?select=slug,title,documents,steps,tips,fees,source,warning,details,views&slug=in.(%s)'
    % (_URL, ','.join(CLUSTER)),
    headers={'apikey': _KEY, 'Authorization': 'Bearer ' + _KEY},
)
rows = {r['slug']: r for r in json.load(urllib.request.urlopen(_req))}
missing = [s for s in CLUSTER if s not in rows]
assert not missing, 'not in the database (already merged?): %s' % missing


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


MATCHED, SUPERSEDED = set(), set()


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
                if take:
                    sup = next((x for n, x in SUPERSEDES.items() if n in v), None)
                    idx = next((i for i, y in enumerate(target) if sup and sup in str(y)), None)
                    if idx is not None:
                        target[idx] = take
                        SUPERSEDED.add(sup)
                    elif not already(take, target):
                        target.append(take)
                else:
                    drops_log.append((keep, col, v))
    sets = ['documents = %s' % arr(docs), 'steps = %s' % arr(steps), 'tips = %s' % arr(tips),
            'last_update = CURRENT_DATE']
    out.append("-- %s  ←  %d صفحة\nUPDATE articles SET\n    %s\nWHERE slug = '%s';\n"
               % (keep, len(drop_list), ',\n    '.join(sets), keep))
    dropped += drop_list
    summary.append((keep, len(drop_list), d0, len(docs), s0, len(steps), t0, len(tips)))

assert set(SUPERSEDES.values()) == SUPERSEDED,     'SUPERSEDES never fired: %s' % (set(SUPERSEDES.values()) - SUPERSEDED)
unmatched = [(k, c, n) for k, cols in CARRY.items() for c, lst in cols.items()
             for i, (n, _) in enumerate(lst) if (k, c, i) not in MATCHED]
assert not unmatched, 'CARRY needle matched nothing (typo?): %s' % unmatched

fixes = []
for slug, col, old, new in CORRECTIONS:
    cur = str(rows[slug].get(col) or '')
    assert cur.count(old) == 1, 'correction %s.%s matched %d times' % (slug, col, cur.count(old))
    fixes.append("UPDATE articles SET %s = '%s', last_update = CURRENT_DATE\nWHERE slug = '%s';\n"
                 % (col, q(new), slug))

links = []
for slug, block in CROSSLINK.items():
    cur = str(rows[slug].get('details') or '')
    marker = 'turkey-visa-types-2026' if slug != 'turkey-visa-types-2026' else 'syria-turkey-visa-types-2026'
    assert '/article/' + marker not in cur, '%s already cross-links' % slug
    links.append("UPDATE articles SET details = coalesce(details, '') || '%s', last_update = CURRENT_DATE\n"
                 "WHERE slug = '%s' AND coalesce(details, '') NOT LIKE '%%/article/%s%%';\n"
                 % (q(block), slug, marker))

header = """-- ============================================================================
-- عنقود التأشيرات: 19 صفحة ← 8، وقاعدة إسناد تُطبَّق (2026-08-06)
-- ============================================================================
-- عمودان قِيسا فوجدا مختلفين فعلاً، فبقيا:
--   • turkey-visa-types-2026 (1,085 قراءة) — كم تكلّف التأشيرة بحسب الجنسية.
--   • syria-turkey-visa-types-2026 (245)   — الأنواع السبعة المتاحة للسوريين.
-- تداخلهما دون 18%، وكلٌّ يجيب سؤالاً لا يجيبه الآخر. وقد كانا لا يتقاطعان
-- برابط واحد، فأُضيف لكلٍّ منهما رابط إلى الآخر.
--
-- أمّا ما تحتهما فلا. خمس من صفحات الأنواع السبع بين 130 و190 كلمة وتتداخل
-- فيما بينها 18-39%، والصفحة الأمّ تجمع السبعة في جدول مقارنة واحد. وأربع
-- صفحات من كانون الأول 2025 تعيد سؤال «أي تأشيرة أحتاج / هل تكفي الإلكترونية
-- / من يُعفى» وهو ما يجيبه عمود الأسعار جنسيةً جنسية. وصفحة تأشيرة العلاج
-- (180 كلمة) تكرّر صفحة الفيزا الطبية (508 كلمات، مصدرها mfa.gov.tr).
--
-- ── لماذا كان هذا العنقود أهمّ من حجمه ──────────────────────────────────
--
-- CLAUDE.md صريح: انسب المحتوى لمصدره الأوّلي، ولا تنسبه لصفحة تواصل
-- اجتماعي. وثماني صفحات هنا تسنِد رسومها إلى منشور على فيسبوك لاتحاد أهلي
-- (UCSO): 125 دولاراً للعبور، و145 للدراسة، و165 للنقل البري.
--
-- والرسم القانوني التركي للتأشيرة نفسها — تحقّقنا منه من جدول رئاسة إدارة
-- الهجرة نفسها (goc.gov.tr)، نافذاً من 1 كانون الثاني 2026 بموجب الجريدة
-- الرسمية 31 كانون الأول 2025 العدد 33124 — هو 9,376.40 ليرة، أي نحو 234
-- دولاراً بأسعار اليوم. الفرق ليس هامشياً، والموقع كان ينشر الرقمين معاً بلا
-- إشارة إلى أنّهما يختلفان، ولا إلى أنّ أحدهما مأخوذ من فيسبوك.
--
-- والعلاج ليس حذف الأرقام بالدولار: من يقدّم عبر المكتب المعتمد داخل سوريا
-- يحتاج فعلاً أن يعرف ما يتقاضاه ذلك المكتب، وإعلان الاتحاد هو الرواية
-- الوحيدة المتاحة عنه. العلاج أن نقول ذلك بالضبط — مَن أعلنه، وأنّه ليس
-- منشوراً حكومياً تركياً، وما هو الرسم القانوني، ورابط الصفحة التي تحمله.
--
-- وأثناء التحقّق راجعنا جدول عمود الأسعار كلّه على goc.gov.tr: كل رقم فيه
-- مطابق — 9,376.40 و31,410.00 و18,813.80 و15,672.10. لم يحتج تصحيحاً.
--
-- شغّله بعد اكتمال نشر الشيفرة (التحويلات في next.config.ts).
-- ============================================================================

"""

sql = header + '\n'.join(out)
sql += '\n-- تصحيح الإسناد ---------------------------------------------------------\n' + '\n'.join(fixes)
sql += '\n-- تنبيه الرسوم، وربط العمودين ببعضهما -----------------------------------\n' + '\n'.join(links)
sql += ("\n-- الصفحات المدموجة تُحذف بعد نقل ما يستحقّ\nDELETE FROM articles WHERE slug IN (%s);\n"
        % ', '.join("'%s'" % q(s) for s in dropped))
sql += """
-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — الأول 3 صفوف، والثاني صفر، والثالث صفّان كلاهما true
SELECT slug, coalesce(array_length(documents,1),0) AS docs,
       coalesce(array_length(steps,1),0) AS steps,
       coalesce(array_length(tips,1),0)  AS tips, last_update
FROM articles WHERE slug IN (%s) ORDER BY slug;

SELECT slug FROM articles WHERE slug IN (%s);

SELECT slug,
       (source NOT LIKE '%%منشور رسمي بقلم%%')                AS إسناد_مصحَّح,
       (details LIKE '%%/article/turkey-visa-types-2026%%'
        OR details LIKE '%%/article/syria-turkey-visa-types-2026%%') AS العمودان_مترابطان
FROM articles WHERE slug IN ('syria-turkey-visa-types-2026', 'turkey-visa-types-2026') ORDER BY slug;
""" % (', '.join("'%s'" % k for k, _ in MERGES), ', '.join("'%s'" % s for s in dropped))

path = os.path.join(REPO, 'sql', '2026-08-06_merge_visa_cluster.sql')
open(path, 'w', encoding='utf-8').write(sql)

print('%-34s %-12s %-12s %s' % ('SURVIVOR', 'docs', 'steps', 'tips'))
for keep, n, d0, d1, s0, s1, t0, t1 in summary:
    print('%-34s %2d→%-9d %2d→%-9d %2d→%d  ← %d' % (keep[:34], d0, d1, s0, s1, t0, t1, n))
print()
print('pages removed :', len(dropped))
print('corrections   :', len(CORRECTIONS))
print('cross-links   :', len(CROSSLINK))
print('items dropped :', len(drops_log))
print('quote parity  :', 'OK' if re.sub(r"''", '', sql).count("'") % 2 == 0 else '*** BROKEN ***')
print('written       :', path, len(sql), 'chars')
print()
print('--- next.config.ts redirects ---')
for keep, drop_list in MERGES:
    for d in drop_list:
        print("      { source: '/article/%s', destination: '/article/%s', permanent: true }," % (d, keep))
