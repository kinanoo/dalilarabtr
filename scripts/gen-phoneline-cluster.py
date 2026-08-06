# -*- coding: utf-8 -*-
"""Phone-line verification: three pages, 1,056 reads, and a deadline in a month.

BTK decision 2026/İK-THD/125 of 11.05.2026 gives foreign subscribers six months
from 25 June 2026 to update their line records. Verified against the decision
itself: dormant lines restricted from 25 July 2026, everyone else from 5
September, starting with numbers ending 00 and 50 and running daily through 24
October, and the final deadline to apply is 25 December 2026.

Three of our pages answer that one question, and the traffic sits on the two
that answer it worst:

  • gecici-koruma-hat-guncelleme-2026 (233 reads) cites the decision number,
    links the BTK PDF, and lays out every date above correctly. Confirmed
    date by date; it needed no correction.
  • turkcell-yabanci-hat-kimlik-dogrulama-2026-06 (418 reads) opens with
    «عاجل ومهلة محدّدة» and never states what the deadline is. Urgency with no
    date is worse than no page.
  • tryqa-thdyth-byanat-kht-alhatf-shrka (405 reads) has NO source at all and
    advises «التريث والانتظار … أسبوعاً» on the strength of a phone call with an
    unnamed employee. It was written on 29 June. The restriction phase starts
    5 September. Telling four hundred people to wait, with no date and no
    source, on a compliance deadline, is the most harmful thing this audit has
    found.

So the best-sourced page absorbs the two with the traffic — the 308s carry the
authority across — and the concrete app steps the 418-read page did have (the
Turkcell flow, the three accepted documents, the green bar) come with it.

Left alone: the photographed GöçBil walkthrough, which is a genuinely different
artefact and already points at the legal page, and the e-Kayıt approval service,
which is a different BTK service entirely. Both get the source they were
missing.
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
    ('gecici-koruma-hat-guncelleme-2026', [
        'turkcell-yabanci-hat-kimlik-dogrulama-2026-06',
        'tryqa-thdyth-byanat-kht-alhatf-shrka',
    ]),
]

KEEP = {
    'turkcell-hat-dogrulama-resimli-rehber-2026-06':
        'تجربة مصوَّرة خطوة بخطوة عبر GöçBil — شكل مختلف لا نصّ مكرّر، وتُحيل إلى صفحة القانون.',
    'btk-ekayit-foreigners-phone-line-2026':
        'خدمة e-Kayıt للموافقة على فتح خط باسمك — خدمة أخرى تماماً، لا تحديث بيانات.',
}

CARRY = {
    'gecici-koruma-hat-guncelleme-2026': {
        'documents': [],
        'steps': [
            # Labelled, because the merge puts two alternative routes in one
            # list: the survivor's first four steps are the store route, these
            # five are the app route. Unlabelled they read as one nine-step
            # sequence nobody can follow.
            ('حدّث تطبيق المشغّل إلى أحدث إصدار',
             'المسار الثاني — عبر تطبيق المشغّل: حدّث التطبيق إلى أحدث إصدار، وسجّل الدخول '
             'برقم هاتفك ورمز التحقّق الذي يصلك برسالة نصية.'),
            ('تحديث بيانات الاشتراك', None),
            ('Devam Et', None),
            ('اختر وثيقتك', None),
            ('شريط أخضر', None),
        ],
        'tips': [
            ('احرص ان ترى بنفسك تثبيت الكملك', None),
        ],
    },
}

# NOT carried, and the reason is the point of this file: the 405-read page's
# «التريث والانتظار … أسبوعاً» lives in its prose, and prose is not carried at
# all here. Naming it so nobody reintroduces it by hand.
NEVER_CARRY_NOTE = 'التريث والانتظار'

EDITS = {
    'gecici-koruma-hat-guncelleme-2026': {
        'steps': [
            ('افتح رسالة مشغّلك أو راجع متجره الرسمي',
             'المسار الأول — عبر المتجر: افتح رسالة مشغّلك أو راجع متجره الرسمي واسأل عن '
             '«Abonelik Kaydı Güncelleme».'),
        ],
    },
}
SUPERSEDES = {}

CORRECTIONS = [
    # Two pages named a specific authority and a specific service and carried no
    # source field at all. The survivor's source is the decision PDF; these two
    # get the authority they describe.
    ('btk-ekayit-foreigners-phone-line-2026', 'source', None,
     'هيئة تكنولوجيا المعلومات والاتصالات التركية (BTK) — btk.gov.tr — خدمة '
     '«Yabancılar için e-Kayıt Başvurusu Onay İşlemleri» على بوّابة e-Devlet.'),
]

# The photographed walkthrough says "see our article on the law and the
# deadline" without a link. This is that link.
CROSSLINK = {
    'turkcell-hat-dogrulama-resimli-rehber-2026-06': (
        '<div style="margin-top:1.25rem;padding:1rem;border-radius:0.75rem;border:1px solid #fcd34d;'
        'background:#fffbeb;"><p style="margin:0;"><strong>المهلة والتواريخ الملزِمة:</strong> '
        'قرار BTK رقم 2026/İK-THD/125 يمنح المشتركين الأجانب ستة أشهر من 25 حزيران 2026 لتحديث بياناتهم، '
        'أي حتى <strong>25 كانون الأول 2026</strong>. والتقييد التدريجي يبدأ <strong>5 أيلول</strong> '
        'بالأرقام المنتهية بـ00 و50 ويستمرّ يومياً حتى 24 تشرين الأول. التفاصيل والمراجع في '
        '<a href="/article/gecici-koruma-hat-guncelleme-2026" style="color:#b45309;font-weight:bold;">'
        'دليل تحديث بيانات خطوط الهاتف: القرار والمهلة ←</a></p></div>'
    ),
}

RETITLE = {
    'gecici-koruma-hat-guncelleme-2026': (
        'تحديث بيانات خط الهاتف للأجانب في تركيا: المهلة حتى 25 كانون الأول 2026 والتقييد من 5 أيلول',
        'قرار BTK رقم 2026/İK-THD/125 يمهل المشتركين الأجانب حتى 25 كانون الأول 2026. التقييد التدريجي '
        'يبدأ 5 أيلول بحسب آخر رقمين. الخطوات عبر تطبيق المشغّل أو المتجر، والوثائق المقبولة، وماذا لو قُيّد خطّك.'),
}

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

# Guard the one thing that must never cross over.
assert NEVER_CARRY_NOTE in str(rows['tryqa-thdyth-byanat-kht-alhatf-shrka'].get('details') or ''), \
    'the "wait a week" advice is not where this file thinks it is — recheck before shipping'


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
    for col, target in (('documents', docs), ('steps', steps), ('tips', tips)):
        for needle, repl in EDITS.get(keep, {}).get(col, []):
            hit = [i for i, v in enumerate(target) if needle in str(v)]
            assert len(hit) == 1, 'EDIT %s.%s matched %d: %s' % (keep, col, len(hit), needle)
            target[hit[0]] = repl
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
    sets = ['documents = %s' % arr(docs), 'steps = %s' % arr(steps), 'tips = %s' % arr(tips)]
    if keep in RETITLE:
        t, dsc = RETITLE[keep]
        sets += ["title = '%s'" % q(t), "seo_title = '%s'" % q(t), "seo_description = '%s'" % q(dsc)]
    sets.append('last_update = CURRENT_DATE')
    out.append("-- %s  ←  %d صفحة\nUPDATE articles SET\n    %s\nWHERE slug = '%s';\n"
               % (keep, len(drop_list), ',\n    '.join(sets), keep))
    dropped += drop_list
    summary.append((keep, len(drop_list), d0, len(docs), s0, len(steps), t0, len(tips)))

unmatched = [(k, c, n) for k, cols in CARRY.items() for c, lst in cols.items()
             for i, (n, _) in enumerate(lst) if (k, c, i) not in MATCHED]
assert not unmatched, 'CARRY needle matched nothing (typo?): %s' % unmatched

fixes = []
for slug, col, old, new in CORRECTIONS:
    cur = str(rows[slug].get(col) or '')
    if old is None:
        assert not cur.strip(), '%s.%s is not empty — was expecting to fill a gap' % (slug, col)
        fixes.append("UPDATE articles SET %s = '%s', last_update = CURRENT_DATE\nWHERE slug = '%s';\n"
                     % (col, q(new), slug))
    else:
        assert cur.count(old) == 1
        fixes.append("UPDATE articles SET %s = replace(%s, '%s', '%s'), last_update = CURRENT_DATE\n"
                     "WHERE slug = '%s';\n" % (col, col, q(old), q(new), slug))

links = []
for slug, block in CROSSLINK.items():
    cur = str(rows[slug].get('details') or '')
    assert '/article/gecici-koruma-hat-guncelleme-2026' not in cur, '%s already links' % slug
    links.append("UPDATE articles SET details = coalesce(details, '') || '%s', last_update = CURRENT_DATE\n"
                 "WHERE slug = '%s' AND coalesce(details, '') NOT LIKE '%%gecici-koruma-hat-guncelleme%%';\n"
                 % (q(block), slug))

header = """-- ============================================================================
-- عنقود تحديث بيانات خطّ الهاتف: 3 صفحات ← 1، ومهلة بعد شهر (2026-08-06)
-- ============================================================================
-- قرار BTK رقم 2026/İK-THD/125 الصادر 11 أيار 2026 يمهل المشتركين الأجانب ستة
-- أشهر من 25 حزيران 2026 لتحديث سجلّات اشتراكاتهم. تحقّقنا من القرار نفسه:
-- الخطوط الخاملة تُقيَّد من 25 تموز، وباقي الخطوط من 5 أيلول بادئاً بالأرقام
-- المنتهية بـ00 و50 ثمّ يومياً حتى 24 تشرين الأول، والمهلة النهائية للتقديم
-- 25 كانون الأول 2026.
--
-- ثلاث صفحات عندنا تجيب هذا السؤال، والقراءات على أسوأ اثنتين:
--
--   • gecici-koruma-hat-guncelleme-2026 (233 قراءة) تذكر رقم القرار، وتربط
--     ملف BTK، وتسرد كل التواريخ أعلاه صحيحةً. راجعناها تاريخاً تاريخاً فلم
--     تحتج تصحيحاً.
--   • turkcell-yabanci-hat-kimlik-dogrulama-2026-06 (418 قراءة) تفتتح بـ«عاجل
--     ومهلة محدّدة» ولا تذكر المهلة أبداً. استعجال بلا تاريخ أسوأ من لا صفحة.
--   • tryqa-thdyth-byanat-kht-alhatf-shrka (405 قراءة) بلا أي مصدر، وتنصح
--     صراحةً بـ«التريث والانتظار … أسبوعاً» استناداً إلى مكالمة مع موظّف غير
--     مسمّى. كُتبت في 29 حزيران، والتقييد يبدأ 5 أيلول. أن تقول لأربعمئة
--     قارئ «انتظر» بلا تاريخ وبلا مصدر على مهلة نظامية — هذا أشدّ ما وجدناه
--     ضرراً في هذا التدقيق كلّه.
--
-- فالصفحة الأفضل إسناداً تبتلع صاحبتَي القراءات، والتحويلات تنقل إليها ثقلهما،
-- وتأتي معها خطوات التطبيق الملموسة التي كانت تنفرد بها صفحة الـ418: مسار
-- تطبيق توركسل، والوثائق الثلاث المقبولة، والشريط الأخضر.
--
-- وتبقى صفحتان: التجربة المصوَّرة عبر GöçBil — شكل مختلف لا نصّ مكرّر، وتُضاف
-- لها التواريخ الملزِمة ورابط الصفحة الباقية — وخدمة e-Kayıt للموافقة على فتح
-- خط باسمك، وهي خدمة أخرى تماماً. وكلتاهما كانت بلا حقل مصدر رغم أنّها تسمّي
-- جهة وخدمة بعينها.
--
-- شغّله بعد اكتمال نشر الشيفرة (التحويلات في next.config.ts).
-- ============================================================================

"""

sql = header + '\n'.join(out)
sql += '\n-- سدّ فجوات الإسناد -----------------------------------------------------\n' + '\n'.join(fixes)
sql += '\n-- التواريخ الملزِمة على التجربة المصوَّرة ----------------------------------\n' + '\n'.join(links)
sql += ("\n-- الصفحتان المدموجتان تُحذفان بعد نقل ما يستحقّ\nDELETE FROM articles WHERE slug IN (%s);\n"
        % ', '.join("'%s'" % q(s) for s in dropped))
sql += """
-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — الأول صفّ واحد، والثاني صفر، والثالث صفر (لا نصيحة انتظار بقيت)
SELECT slug, coalesce(array_length(steps,1),0) AS steps,
       coalesce(array_length(tips,1),0) AS tips, last_update
FROM articles WHERE slug IN (%s);

SELECT slug FROM articles WHERE slug IN (%s);

SELECT slug FROM articles WHERE details LIKE '%%التريث والانتظار%%';

SELECT slug, (coalesce(source,'') <> '') AS له_مصدر
FROM articles
WHERE slug IN ('btk-ekayit-foreigners-phone-line-2026', 'turkcell-hat-dogrulama-resimli-rehber-2026-06',
               'gecici-koruma-hat-guncelleme-2026')
ORDER BY slug;
""" % (', '.join("'%s'" % k for k, _ in MERGES), ', '.join("'%s'" % s for s in dropped))

path = os.path.join(REPO, 'sql', '2026-08-06_merge_phoneline_cluster.sql')
open(path, 'w', encoding='utf-8').write(sql)

print('%-38s %-12s %s' % ('SURVIVOR', 'steps', 'tips'))
for keep, n, d0, d1, s0, s1, t0, t1 in summary:
    print('%-38s %2d→%-9d %2d→%d  ← %d' % (keep[:38], s0, s1, t0, t1, n))
print()
print('pages removed :', len(dropped))
print('source gaps   :', len(CORRECTIONS))
print('cross-links   :', len(CROSSLINK))
print('items dropped :', len(drops_log))
print('quote parity  :', 'OK' if re.sub(r"''", '', sql).count("'") % 2 == 0 else '*** BROKEN ***')
print('written       :', path, len(sql), 'chars')
print()
print('--- next.config.ts redirects ---')
for keep, drop_list in MERGES:
    for d in drop_list:
        print("      { source: '/article/%s', destination: '/article/%s', permanent: true }," % (d, keep))
