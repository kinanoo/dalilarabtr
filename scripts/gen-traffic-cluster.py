# -*- coding: utf-8 -*-
"""Traffic and cars: 25 pages -> 14, and a 241-read page that was right but bare.

Structurally this is the e-Devlet pattern again: seventeen of the twenty-five
pages are December-2025 cards of 18-51 words, published as articles. They are
folded into the six real guides the site has since written.

The page that made this cluster worth doing is app-plate-turkey. It carries 241
reads on seventy words, no source, and the biggest numbers in the cluster:
140,000 lira for a fake or deliberately unreadable plate, thirty days off the
road, thirty days off the licence, doubling to 280,000 and sixty days on a
repeat. Every one of those figures checks out — they come from Law 7574 — so the
page was right and unciteable at the same time, which is the state this audit
keeps finding.

Two things it was missing that matter more than the citation:

  • The early-payment discount. Paying within fifteen days brings 140,000 down to
    105,000. A page that states the fine and not the discount costs its reader
    35,000 lira.
  • The date. The page says the penalties apply from 1 April 2026; Law 7574 came
    into force on 27 February 2026. I could not resolve whether a specific
    provision was staged to April, so the page is not "corrected" to a date I
    cannot source — it now states the law and its February entry into force,
    which resolves the contradiction in the direction that protects the reader:
    treat the penalties as already in force.

Three pages carried three different penalty scales with no cross-reference. They
now sit in two: the general fines page and the 2026 amendment page.
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
    ('theory-exam-arabic-2026', ['auto-ehliyet-new-from-zero', 'driver-theory-prep']),
    ('license-conversion-arab-countries-2026', ['auto-ehliyet-conversion', 'driving-license']),
    ('driving-license-fees-2026', ['lost-driving-license']),
    ('car-registration', ['buying-car-foreigner', 'auto-noter-satis-transfer',
                          'auto-plates-foreigner-m-plaka', 'auto-mtv-payment']),
    # Pre-purchase inspection belongs with the damage-record check, not with
    # registration: both answer "what do I check before I pay".
    ('tramer-hasar-kaydi-kilometre-kontrol-turkiye-2026', ['auto-ekspertiz-guide']),
    ('auto-tuvturk-inspection', ['tuvturk-appointment']),
    ('traffic-fines', ['auto-license-suspension-points-alcohol']),
]

KEEP = {
    'app-plate-turkey': 'أعلى طلب في العنقود (241 قراءة) وأرقامها صحيحة — تبقى ويُسنَد قانونها ويُضاف خصم الدفع المبكر.',
    'traffic-penalties-turkey-2026': 'تعديلات 2026 بأرقامها — تُسنَد للقانون 7574.',
    '185-days-foreign-plated-car-turkey-2026': 'قاعدة الـ185 يوماً للوحة الأجنبية — سؤال مستقلّ تماماً.',
    'zorunlu-trafik-sigortasi-tavan-basamak-2026': 'تعرفة التأمين الإلزامي — استقبلت صفحتَي التأمين في جولة الصحة.',
    'bitaksi-app': 'كرت تطبيق لا مقال — خارج نطاق هذه الجولة، ويحتاج قراراً مثل كروت e-Devlet.',
    'tiktak-car-rental': 'كرت تطبيق مثله.',
}

CARRY = {
    'theory-exam-arabic-2026': {
        'documents': [],
        'steps': [('اختر مدرسة سواقة مرخصة واطلب كشف واضح', None)],
        'tips': [
            ('عقداً واضحاً من المدرسة', None),
            ('التدريب اليومي لمدة 20-30 دقيقة', None),
        ],
    },
    'license-conversion-arab-countries-2026': {
        'documents': [],
        'steps': [('هل بلد رخصتك ضمن الدول القابلة للتحويل', None)],
        'tips': [
            ('لا تعتمد على معلومات قديمة عن', None),
            ('عنوانك مثبت في النفوس', None),
        ],
    },
    'driving-license-fees-2026': {
        'documents': [],
        'steps': [
            ('Sürücü Belgesi', None),
            ('Ziraat/Vakıf/Halk', None),
        ],
        'tips': [('عنوانك مسجل في النفوس حتى يصل البريد', None)],
    },
    'car-registration': {
        'documents': [],
        'steps': [
            ('استعلم عن أي حجز/رهن قبل التوقيع', None),
            ('من يحق له قيادة السيارة', None),
            ('فترة الاستحقاق الحالية (يناير/يوليو)', None),
        ],
        'tips': [
            ('بيع بدون نوتر', None),
            ('تكلفة سنوية تقريبية', None),
        ],
    },
    'tramer-hasar-kaydi-kilometre-kontrol-turkiye-2026': {
        'documents': [],
        'steps': [('مركز فحص معروف واطلب تقريراً مكتوباً', None)],
        'tips': [('إصلاحات هيكلية كبيرة', None)],
    },
    'auto-tuvturk-inspection': {
        'documents': [],
        'steps': [],
        'tips': [('جهز السيارة لتفادي إعادة المعاينة', None)],
    },
    'traffic-fines': {
        'documents': [],
        'steps': [('حدّد نوع الإجراء: غرامة فقط أم سحب رخصة', None)],
        'tips': [('المهل القانونية مهمة', None)],
    },
}

SOURCES = {
    'app-plate-turkey':
        'القانون رقم 7574 المعدِّل لقانون المرور على الطرق البرية — نافذاً من 27 شباط/فبراير 2026. '
        'والغرامات المذكورة هي المقادير الإدارية المقرّرة لاستعمال لوحة غير عائدة للمركبة أو لوحة مزوّرة، '
        'أو لجعل اللوحة غير مقروءة عمداً.',
}

# What the page was missing that costs the reader money, and the date question
# resolved in the safer direction rather than "corrected" to something unsourced.
PLATE_ADDENDUM = (
    '<div style="margin-top:1.25rem;padding:1rem;border-radius:0.75rem;border:1px solid #fcd34d;'
    'background:#fffbeb;"><p style="margin:0 0 .5rem 0;"><strong>خصم الدفع المبكر — 35,000 ليرة توفّرها:</strong> '
    'الدفع خلال خمسة عشر يوماً من التبليغ يخفّض الغرامة من 140,000 إلى <strong>105,000 ليرة</strong> '
    'بموجب خصم الدفع المبكر القانوني. ومن يذكر الغرامة ولا يذكر الخصم يكلّفك الفرق.</p>'
    '<p style="margin:0;"><strong>ومتى تسري؟</strong> هذه العقوبات جاءت بالقانون رقم 7574 المعدِّل لقانون '
    'المرور، ونفاذه من <strong>27 شباط/فبراير 2026</strong>. فإن قرأت في أي مكان تاريخاً لاحقاً، تعامل مع '
    'العقوبات على أنّها سارية الآن — الأمان هنا في الافتراض الأشدّ لا الأخفّ. ومخالفة اللوحة قد تُفتح معها '
    'ملاحقة جزائية بتهمة تزوير وثيقة رسمية، وهي أثقل من الغرامة نفسها.</p></div>'
)

CLUSTER = sorted({s for k, d in MERGES for s in [k] + d} | set(KEEP) | set(SOURCES))
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

missing = [s for s in CLUSTER if s not in rows]
assert not missing, 'not in the database (already merged?): %s' % missing


def prose_len(slug):
    return len(re.sub(r'<[^>]+>', ' ', rows[slug].get('details') or '').split())


for keep, drop_list in MERGES:
    for d in drop_list:
        assert prose_len(keep) > prose_len(d), \
            'survivor %s (%d words) shorter than absorbed %s (%d) — would destroy prose' \
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
    summary.append((keep, len(drop_list), s0, len(steps), t0, len(tips)))

unmatched = [(k, c, n) for k, cols in CARRY.items() for c, lst in cols.items()
             for i, (n, _) in enumerate(lst) if (k, c, i) not in MATCHED]
assert not unmatched, 'CARRY needle matched nothing (typo?): %s' % unmatched

srcs = []
for slug, src in SOURCES.items():
    assert not str(rows[slug].get('source') or '').strip(), '%s already has a source' % slug
    srcs.append("UPDATE articles SET source = '%s', last_update = CURRENT_DATE\n"
                "WHERE slug = '%s' AND coalesce(trim(source), '') = '';\n" % (q(src), slug))

assert '7574' not in str(rows['app-plate-turkey'].get('details') or '')
add = ("UPDATE articles SET details = coalesce(details, '') || '%s', last_update = CURRENT_DATE\n"
       "WHERE slug = 'app-plate-turkey' AND coalesce(details, '') NOT LIKE '%%7574%%';\n"
       % q(PLATE_ADDENDUM))

header = """-- ============================================================================
-- عنقود المرور والسيارات: 25 صفحة ← 14 (2026-08-06)
-- ============================================================================
-- بنيوياً هذا نمط e-Devlet مرّة أخرى: سبع عشرة من الخمس والعشرين كروتٌ من
-- كانون الأول 2025 بين 18 و51 كلمة، نُشرت مقالات. تُطوى في الأدلة الستّة
-- الحقيقية التي كتبها الموقع بعدها.
--
-- والصفحة التي جعلت هذا العنقود يستحقّ العمل هي app-plate-turkey. تحمل 241
-- قراءة على سبعين كلمة، بلا مصدر، وفيها أكبر أرقام العنقود: 140,000 ليرة
-- للوحة مزوّرة أو غير مقروءة عمداً، وثلاثون يوماً حجزاً للمركبة، وثلاثون
-- سحباً للرخصة، وتُضاعَف إلى 280,000 وستّين يوماً عند التكرار. وكل رقم منها
-- صحيح — مصدره القانون رقم 7574 — فكانت الصفحة على حقّ وغير قابلة للتحقّق في
-- آن، وهي الحالة التي يكرّر هذا التدقيق العثور عليها.
--
-- وأمران كانا ناقصَين وهما أهمّ من الإسناد نفسه:
--
--   • خصم الدفع المبكر. الدفع خلال خمسة عشر يوماً ينزل بالغرامة من 140,000
--     إلى 105,000. وصفحة تذكر الغرامة ولا تذكر الخصم تكلّف قارئها 35,000 ليرة.
--   • التاريخ. الصفحة تقول إنّ العقوبات تسري من 1 نيسان 2026، والقانون 7574
--     نفذ في 27 شباط 2026. ولم أستطع التثبّت هل أُجّل حكم بعينه إلى نيسان، فلم
--     «أصحّح» الصفحة إلى تاريخ لا أملك سنده — صارت تذكر القانون ونفاذه في
--     شباط، وهو ما يحلّ التناقض في الاتجاه الذي يحمي القارئ: اعتبرها سارية.
--
-- وثلاث صفحات كانت تحمل ثلاثة جداول عقوبات مختلفة بلا إحالة بينها. صارت في
-- اثنتين: صفحة المخالفات العامة، وصفحة تعديلات 2026.
--
-- شغّله بعد اكتمال نشر الشيفرة (التحويلات في next.config.ts).
-- ============================================================================

"""

sql = header + '\n'.join(out)
sql += '\n-- إسناد صفحة اللوحة إلى قانونها ------------------------------------------\n' + '\n'.join(srcs)
sql += '\n-- الخصم والتاريخ ---------------------------------------------------------\n' + add
sql += ("\n-- الصفحات المدموجة تُحذف بعد نقل ما يستحقّ\nDELETE FROM articles WHERE slug IN (%s);\n"
        % ', '.join("'%s'" % q(s) for s in dropped))
sql += """
-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — الأول 7 صفوف، والثاني صفر، والثالث صفّ واحد كله true
SELECT slug, coalesce(array_length(steps,1),0) AS steps,
       coalesce(array_length(tips,1),0) AS tips, last_update
FROM articles WHERE slug IN (%s) ORDER BY slug;

SELECT slug FROM articles WHERE slug IN (%s);

SELECT slug,
       (coalesce(trim(source), '') <> '')     AS له_مصدر,
       (details LIKE '%%7574%%')              AS يذكر_القانون,
       (details LIKE '%%105,000%%')           AS يذكر_الخصم
FROM articles WHERE slug = 'app-plate-turkey';
""" % (', '.join("'%s'" % k for k, _ in MERGES), ', '.join("'%s'" % s for s in dropped))

path = os.path.join(REPO, 'sql', '2026-08-06_merge_traffic_cluster.sql')
open(path, 'w', encoding='utf-8').write(sql)

print('%-50s %-8s %-11s %s' % ('SURVIVOR', 'متن', 'steps', 'tips'))
for keep, n, s0, s1, t0, t1 in summary:
    print('%-50s %5dك  %2d→%-8d %2d→%d  ← %d' % (keep[:50], prose_len(keep), s0, s1, t0, t1, n))
print()
print('pages removed :', len(dropped))
print('items dropped :', len(drops_log))
print('quote parity  :', 'OK' if re.sub(r"''", '', sql).count("'") % 2 == 0 else '*** BROKEN ***')
print('written       :', path, len(sql), 'chars')
print()
print('--- next.config.ts redirects ---')
for keep, drop_list in MERGES:
    for d in drop_list:
        print("      { source: '/article/%s', destination: '/article/%s', permanent: true }," % (d, keep))
