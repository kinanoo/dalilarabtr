# -*- coding: utf-8 -*-
"""Address registration and closed neighbourhoods: 15 pages -> 9, and a wiring fix.

The finding here is not duplication. It is that the site already owns the answer
and the pages that need it never point at it.

/zones is a searchable checker over 1,166 neighbourhoods in 63 provinces, sourced
from the provincial migration directorates and stamped with its own as-of date.
Twelve of the fifteen pages in this cluster — the ones a reader lands on when
they search «حيّي مغلق» — do not link to it once. They tell the reader to call
157 and ask the muhtar, which is what you write when you have nothing better,
and we have something better.

Two facts were wrong and both are now sourced:

  • The strongest page in the cluster (781 words) told readers to update their
    address "within 20 days". Law 5490 (Nüfus Hizmetleri Kanunu), article 51,
    says twenty WORKING days, and says it applies to foreigners resident in
    Türkiye too. That is roughly a week of difference on a deadline that carries
    a fine.
  • Another page called the same rule "the common rule" rather than naming the
    article. Now it cites it.

Two pillars survive because there are two different questions:
  • «حيّي مغلق، ماذا أفعل؟»   → address-registration-closed
  • «تحديث العنوان إجباري؟»  → syrian-address-update-mandate-turkey
Five pages restating one or the other are folded in, and the December-2025
Istanbul page is superseded by the June-2026 sourced one.

Same discipline as the previous merges: nothing crosses over unless it is named
below, and every text correction must match exactly once or generation fails.
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
    # «الحي مغلق أمام تسجيل الأجانب» — one question, three December-2025 pages.
    ('address-registration-closed', [
        'address-registration-problems',
        'identity-closed-address-reset',
    ]),
    # «تحديث العنوان واجب، وكيف أستخرج وثيقته» — the obligation, the deadline
    # and the document that proves it are one journey.
    ('syrian-address-update-mandate-turkey', [
        'identity-adres-beyani-20-days-uavt',
        'kimlik-address-proof',
        'edevlet-adres-belgesi',
    ]),
]

# Not merged: redirected to the June-2026 sourced Istanbul page instead. The
# December-2025 page is a method ("how to check") that /zones now does better,
# and its Istanbul framing belongs with the current Istanbul list.
REDIRECT_ONLY = {'istanbul-closed-areas': 'istanbul-closed-neighborhoods-lift-2026'}

KEEP = {
    'gaziantep-zones-lift-2026-06-09': 'خبر مؤرَّخ، 2,895 قراءة، ويربط بالأداة أصلاً.',
    'istanbul-closed-neighborhoods-lift-2026': 'قائمة إسطنبول الرسمية 7 حزيران، ويربط بالأداة.',
    'gaziantep-open-neighborhoods-list-2026-06-17': 'قائمة عنتاب المفتوحة، تربط بالأداة.',
    'closed-neighborhoods-80-percent-reduction-2026': 'الخبر الوطني، يُضاف له رابط الأداة.',
    'urfa-closed-neighborhoods-list-2026': 'قائمة أورفا، يُضاف لها رابط الأداة.',
    'urfa-closed-neighborhoods-residence-2026': '1,605 كلمة عن أثر الإغلاق على الإقامة — سؤال آخر.',
    'konya-closed-neighborhoods-list-2026': 'قائمة قونيا، يُضاف لها رابط الأداة.',
}

CARRY = {
    'address-registration-closed': {
        'documents': [],
        'steps': [
            # "Zeroing the old address" — the one procedural fact neither the
            # survivor nor the other page states.
            ('اطلب تحديث القيد القديم', None),
        ],
        'tips': [
            ('لا تثبّت عنواناً غير حقيقي', None),
            ('نقص بسيط في العقد', None),
        ],
    },
    'syrian-address-update-mandate-turkey': {
        'documents': [
            ('كود UAVT للعقار', None),
        ],
        'steps': [
            ('Yerleşim Yeri (İkametgah) Belgesi Sorgulama', None),
            ('اطلبه من البلدية/المختار', None),
        ],
        'tips': [
            ('تطابق العنوان مع عقد الإيجار', None),
            ('بنك/إنترنت/دوائر', None),
        ],
    },
}

# Wrong facts and dead weight on the survivors themselves.
EDITS = {
    'address-registration-closed': {
        'steps': [
            # This is the step the checker exists for. Leaving it as "ask around"
            # while we own a 1,166-neighbourhood list is the whole finding.
            ('تحقق من وضع الحي عبر القنوات الرسمية',
             'تحقّق من وضع الحي في فاحص المناطق المحظورة على /zones — يغطّي 1,166 حيّاً في 63 ولاية '
             'ويعرض تاريخ آخر تحديث للقائمة. ثم أكّده مع المختار أو النفوس، فالقوائم تتغيّر.'),
        ],
    },
    'syrian-address-update-mandate-turkey': {
        'steps': [
            ('حدّث العنوان خلال 20 يوماً',
             'فور الانتقال إلى منزل جديد: بلّغ عن العنوان خلال 20 يوم عمل — المادة 51 من قانون '
             'خدمات النفوس رقم 5490، وهي تسري على الأجانب المقيمين أيضاً.'),
        ],
    },
}

# The carried step names the exact e-Devlet service; the survivor's own step
# says the same thing vaguely. Replace in place instead of listing both.
SUPERSEDES = {
    'Yerleşim Yeri (İkametgah) Belgesi Sorgulama': 'احصل على وثيقة العنوان',
}

# The link to the checker, appended to every page in the cluster that lacks it.
ZONES_CTA = (
    '<div style="margin-top:1.25rem;padding:1rem;border-radius:0.75rem;border:1px solid #a7f3d0;'
    'background:#ecfdf5;"><p style="margin:0;"><strong>تحقّق من حيّك قبل أي خطوة:</strong> '
    'عندنا فاحص يغطّي 1,166 حيّاً في 63 ولاية، ويبيّن ما إذا كان حيّك ما زال مغلقاً أمام تسجيل '
    'الأجانب أم أُعيد فتحه، مع تاريخ آخر تحديث للقائمة. '
    '<a href="/zones" style="color:#047857;font-weight:bold;">افتح فاحص المناطق المحظورة ←</a> '
    'والمختار يبقى المرجع الإداري الأخير عند أي شكّ.</p></div>'
)
NEEDS_ZONES_CTA = [
    'address-registration-closed',
    'syrian-address-update-mandate-turkey',
    'closed-neighborhoods-80-percent-reduction-2026',
    'urfa-closed-neighborhoods-list-2026',
    'urfa-closed-neighborhoods-residence-2026',
    'konya-closed-neighborhoods-list-2026',
]

CORRECTIONS = [
    ('syrian-address-update-mandate-turkey', 'details',
     '<p style="margin: 0;"><strong>القاعدة الذهبية:</strong> فور الانتقال إلى مسكن جديد، خلال 20 يوماً كحد أقصى — حتى لو كان الانتقال داخل نفس الحي.</p>',
     '<p style="margin: 0;"><strong>القاعدة الذهبية:</strong> فور الانتقال إلى مسكن جديد، بلّغ عن العنوان '
     'خلال <strong>20 يوم عمل</strong> — حتى لو كان الانتقال داخل نفس الحي. والمدة منصوص عليها في المادة 51 '
     'من قانون خدمات النفوس رقم 5490، وتسري على الأجانب المقيمين في تركيا كما تسري على المواطنين. '
     'وانتبه: عشرون <em>يوم عمل</em> لا عشرون يوماً تقويمياً — الجُمَع والعطل الرسمية لا تُحتسب.</p>'),
]

RETITLE = {
    'address-registration-closed': (
        'الحي المغلق أمام تسجيل الأجانب 2026: كيف تتحقّق قبل توقيع العقد وماذا تفعل عند الرفض',
        'قبل أن تدفع عربوناً: تحقّق إن كان الحي مغلقاً أمام تثبيت نفوس الأجانب عبر فاحص المناطق، '
        'وما البدائل عند الرفض، وكيف تُحدَّث القيود على عنوانك القديم.'),
    'syrian-address-update-mandate-turkey': (
        'تحديث العنوان الإجباري في تركيا 2026: مهلة 20 يوم عمل وعواقب التأخير',
        'المادة 51 من قانون النفوس 5490 توجب تبليغ العنوان خلال 20 يوم عمل من الانتقال، وتسري على '
        'الأجانب. الخطوات عبر e-Devlet أو النفوس، وكود UAVT، ووثيقة العنوان، وما يحدث عند التأخير.'),
}

CLUSTER = sorted({s for k, d in MERGES for s in [k] + d} | set(REDIRECT_ONLY) |
                 set(KEEP) | set(NEEDS_ZONES_CTA) | {c[0] for c in CORRECTIONS})
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


MATCHED, EDITED, SUPERSEDED = set(), set(), set()


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
            EDITED.add((keep, col, needle))
            target[hit[0]] = repl if repl is not None else target[hit[0]]
            if repl is None:
                target.pop(hit[0])
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
                        target[idx] = ('استخرج وثيقة العنوان من e-Devlet عبر خدمة '
                                       '«Yerleşim Yeri (İkametgah) Belgesi Sorgulama» واحتفظ بها PDF.')
                        SUPERSEDED.add(sup)
                    elif not already(take, target):
                        target.append(take)
                else:
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

assert set(SUPERSEDES.values()) == SUPERSEDED,     'SUPERSEDES never fired: %s' % (set(SUPERSEDES.values()) - SUPERSEDED)
unmatched = [(k, c, n) for k, cols in CARRY.items() for c, lst in cols.items()
             for i, (n, _) in enumerate(lst) if (k, c, i) not in MATCHED]
assert not unmatched, 'CARRY needle matched nothing (typo?): %s' % unmatched

fixes = []
for slug, col, old, new in CORRECTIONS:
    cur = str(rows[slug].get(col) or '')
    n = cur.count(old)
    assert n == 1, 'correction %s.%s matched %d times:\n  %s' % (slug, col, n, old[:100])
    fixes.append("UPDATE articles SET %s = replace(%s, '%s', '%s'), last_update = CURRENT_DATE\nWHERE slug = '%s';\n"
                 % (col, col, q(old), q(new), slug))

# The checker link. Appended rather than woven in: a generated insertion at an
# arbitrary point inside hand-written HTML is how you silently break a page.
ctas = []
for slug in NEEDS_ZONES_CTA:
    cur = str(rows[slug].get('details') or '')
    assert '/zones' not in cur, '%s already links to the checker' % slug
    ctas.append("UPDATE articles SET details = coalesce(details, '') || '%s', last_update = CURRENT_DATE\n"
                "WHERE slug = '%s' AND coalesce(details, '') NOT LIKE '%%/zones%%';\n"
                % (q(ZONES_CTA), slug))

header = """-- ============================================================================
-- عنقود العنوان والأحياء المغلقة: توحيد وتوصيل (2026-08-06)
-- ============================================================================
-- المشكلة هنا ليست تكراراً. المشكلة أنّ الجواب موجود على الموقع، والصفحات
-- التي تحتاجه لا تشير إليه.
--
-- /zones فاحص يغطّي 1,166 حيّاً في 63 ولاية، مصدره مديريات الهجرة في
-- الولايات، ويعرض تاريخ آخر تحديث للقائمة. واثنتا عشرة صفحة من خمس عشرة في
-- هذا العنقود — وهي التي يهبط عليها من يبحث «حيّي مغلق» — لا تربط به ولا
-- مرّة واحدة. تقول للقارئ «اتصل بـ157 واسأل المختار»، وهو ما يُكتب حين لا
-- يوجد أفضل، ونحن نملك ما هو أفضل.
--
-- وخطآن وقائعيان، كلاهما صار مسنَداً:
--
--   • أقوى صفحة في العنقود (781 كلمة) تقول «حدّث العنوان خلال 20 يوماً».
--     المادة 51 من قانون خدمات النفوس رقم 5490 تقول عشرين **يوم عمل**،
--     وتنصّ على سريانها على الأجانب المقيمين في تركيا. الفرق نحو أسبوع
--     كامل على مهلة تترتّب عليها غرامة.
--   • وصفحة أخرى تسمّي القاعدة نفسها «القاعدة الشائعة» بلا مادة. الآن
--     تُذكر المادة.
--
-- عمودان يبقيان لأنّ السؤالين مختلفان:
--   • «حيّي مغلق، ماذا أفعل؟»   ← address-registration-closed
--   • «تحديث العنوان إجباري؟»   ← syrian-address-update-mandate-turkey
--
-- وخمس صفحات تعيد صياغة أحدهما تُدمج، وصفحة إسطنبول من كانون الأول 2025
-- تُحوَّل إلى قائمة حزيران 2026 المسنَدة.
--
-- القاعدة: لا يُنقل عنصر إلا مسمّى في المولّد، وكل تصحيح نصّي يجب أن يطابق
-- مرّة واحدة تماماً وإلا فشل التوليد.
--
-- شغّله بعد اكتمال نشر الشيفرة (التحويلات في next.config.ts).
-- ============================================================================

"""

sql = header + '\n'.join(out)
sql += '\n-- التصحيح الوقائعي: 20 يوم عمل، لا 20 يوماً ---------------------------\n' + '\n'.join(fixes)
sql += '\n-- توصيل الصفحات بالفاحص ------------------------------------------------\n' + '\n'.join(ctas)
sql += ("\n-- الصفحات المدموجة والمُحوَّلة تُحذف بعد نقل ما يستحقّ\nDELETE FROM articles WHERE slug IN (%s);\n"
        % ', '.join("'%s'" % q(s) for s in dropped + list(REDIRECT_ONLY)))
sql += """
-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — الأول صفّان، والثاني صفر، والثالث صفر، والرابع 6 صفوف كلّها true
SELECT slug, coalesce(array_length(documents,1),0) AS docs,
       coalesce(array_length(steps,1),0) AS steps,
       coalesce(array_length(tips,1),0)  AS tips, last_update
FROM articles WHERE slug IN (%s) ORDER BY slug;

SELECT slug FROM articles WHERE slug IN (%s);

-- لا يبقى «20 يوماً» بلا كلمة «عمل» في صفحة المهلة
SELECT slug FROM articles
WHERE slug = 'syrian-address-update-mandate-turkey'
  AND (details LIKE '%%خلال 20 يوماً%%' OR array_to_string(steps, ' ') LIKE '%%خلال 20 يوماً%%');

SELECT slug, (details LIKE '%%/zones%%') AS يربط_بالفاحص
FROM articles WHERE slug IN (%s) ORDER BY slug;
""" % (', '.join("'%s'" % k for k, _ in MERGES),
       ', '.join("'%s'" % s for s in dropped + list(REDIRECT_ONLY)),
       ', '.join("'%s'" % s for s in NEEDS_ZONES_CTA))

path = os.path.join(REPO, 'sql', '2026-08-06_merge_address_cluster.sql')
open(path, 'w', encoding='utf-8').write(sql)

print('%-40s %-12s %-12s %s' % ('SURVIVOR', 'docs', 'steps', 'tips'))
for keep, n, d0, d1, s0, s1, t0, t1 in summary:
    print('%-40s %2d→%-9d %2d→%-9d %2d→%d  ← %d' % (keep[:40], d0, d1, s0, s1, t0, t1, n))
print()
print('pages removed  :', len(dropped) + len(REDIRECT_ONLY))
print('corrections    :', len(CORRECTIONS))
print('checker links  :', len(NEEDS_ZONES_CTA))
print('items dropped  :', len(drops_log))
print('quote parity   :', 'OK' if re.sub(r"''", '', sql).count("'") % 2 == 0 else '*** BROKEN ***')
print('written        :', path, len(sql), 'chars')
print()
print('--- next.config.ts redirects ---')
for keep, drop_list in MERGES:
    for d in drop_list:
        print("      { source: '/article/%s', destination: '/article/%s', permanent: true }," % (d, keep))
for src, dst in REDIRECT_ONLY.items():
    print("      { source: '/article/%s', destination: '/article/%s', permanent: true }," % (src, dst))
