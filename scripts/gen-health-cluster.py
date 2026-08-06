# -*- coding: utf-8 -*-
"""Health and insurance: 20 pages -> 13, six pairs that were the same page twice.

No single dramatic finding here — this is the cluster where the site simply
wrote the same page more than once and then wrote a long, good version without
deleting the short ones. Three separate pages on compulsory earthquake cover
(DASK). Two on car insurance, neither of them the 1,025-word page that actually
explains the tariff. Two on e-Nabız, one of them 24 words. Two on booking a
hospital appointment. Four short pages restating what the 591-word SGK/GSS
pillar already says.

Every merge follows the rule the citizenship pass made explicit and this file
asserts: the survivor is the page with more prose, because list items are
carried and the page is then deleted. That flips the obvious choice twice here —
the car-insurance stubs go into the tariff page rather than into each other, and
the hospital-appointment stub goes into the MHRS guide even though the stub has
more reads.

Two boundaries checked rather than assumed:

  • GSS is not private insurance. The 87-word «أسعار السيكورتا» page is about the
    private policy a residence application needs, priced by age band — a
    different product from the state GSS scheme, so it is NOT merged into the
    GSS pillar despite the shared word. It stays, and it stays flagged: 87 words
    and no source for a page carrying a price table.
  • kimlik-work-and-sgk is filed under health but is about working without a
    permit. It goes to the work-permit pillar, not to an insurance page.

Left for a separate pass, deliberately: the three medical-tourism pages. They
are 56-74 words each with no source at all, and they carry dollar price ranges
for dental and eye surgery. That needs a sourcing decision, not a merge, and
doing it badly here would repeat the mistake the visa pass just corrected.
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
    ('dask-earthquake-insurance', ['earthquake-insurance', 'housing-advanced-dask']),
    # The tariff page is the pillar; the two stubs were orbiting nothing.
    ('zorunlu-trafik-sigortasi-tavan-basamak-2026', ['car-insurance', 'auto-insurance-trafik-vs-kasko']),
    ('e-nabiz-electronic-health-record-2026', ['e-nabiz-guide']),
    ('mhrs-guide-syrians-arabs-2026', ['hospital-appointment']),
    ('sgk-gss-health-insurance-turkey-2026', ['health-insurance-types', 'edevlet-sgk-dokumu']),
    ('syria-temporary-protection-health-2026', ['kimlik-health-services']),
    # Filed under health, actually about working without a permit.
    ('work-permit-turkey-2026', ['kimlik-work-and-sgk']),
]

KEEP = {
    'أسعار-السيكورتا-الصحية-في-تركيا-لعام-2026-دليل-شامل':
        'التأمين الخاص المطلوب للإقامة — منتج مختلف عن GSS رغم اشتراك الكلمة. تبقى، وتبقى موسومة: 87 كلمة وجدول أسعار بلا مصدر.',
    'mhrs-errors-troubleshooting-2026': 'أخطاء MHRS وحلولها — 708 كلمة على سؤال مختلف عن الحجز.',
    'gss-premium-2026-foreigners-syrians': 'قسط GSS بالأرقام — 740 كلمة.',
    'sgk-4a-vs-bagkur-4b-foreigners-2026': 'الفرق بين 4A و4B — سؤال مستقلّ.',
    'gss-debt-inquiry': 'الاستعلام عن دين GSS ودفعه.',
    'sgk-add-family-members-health-insurance-2026': 'إضافة أفراد العائلة — 628 كلمة، ويُسدّ مصدرها.',
    'kimlik-ilac-recete-katilim-payi-sgk-teb-2026': 'حصّة المريض في الدواء — رقم دقيق وسؤال منفصل.',
}

# Column matters: most of what is worth carrying here was filed as a STEP on the
# absorbed page, not a tip. The first pass put every needle under `tips` and the
# assert caught all ten of them.
CARRY = {
    'dask-earthquake-insurance': {
        'documents': [],
        'steps': [
            # Why the policy number matters in daily life — utility meters.
            ('عند فتح/نقل العدادات', None),
            ('وثّق الصور والفيديو بسرعة', None),
            ('تابع التقييم والتعويض', None),
        ],
        'tips': [('مساحة العقار ونوعه', None)],
    },
    'zorunlu-trafik-sigortasi-tavan-basamak-2026': {
        'documents': [],
        'steps': [
            ('التحمل (Muafiyet)', None),
            ('محضر حادث/كازا', None),
        ],
        'tips': [('الورش المعتمدة وحدود التعويض', None)],
    },
    'e-nabiz-electronic-health-record-2026': {
        'documents': [],
        'steps': [('اللقاحات والمواعيد والخريطة', None)],
        'tips': [],
    },
    'mhrs-guide-syrians-arabs-2026': {
        'documents': [], 'steps': [],
        # Missing an appointment has a consequence the guide never states.
        'tips': [('تكرار الغياب قد يسبب قيوداً', None)],
    },
    'sgk-gss-health-insurance-turkey-2026': {
        'documents': [],
        'steps': [
            ('أسنان/حمل/أمراض مزمنة', None),
            ('SGK Tescil ve Hizmet Dökümü', None),
        ],
        'tips': [
            ('لا تخلط بين تأمين الإقامة', None),
            ('البيان هو الدليل الرسمي', None),
        ],
    },
    'syria-temporary-protection-health-2026': {
        'documents': [],
        'steps': [
            ('مركز صحي/مركز أسرة', None),
            ('اطلب سبب الرفض بشكل واضح', None),
        ],
        'tips': [('تربط الخدمة بعنوانك', None)],
    },
    # Nothing crosses over: everything the SGK-and-work stub said, the
    # 1,399-word permit pillar already says, and says with the SGK service name.
    'work-permit-turkey-2026': {'documents': [], 'steps': [], 'tips': []},
}

SOURCES = {
    'sgk-add-family-members-health-insurance-2026':
        'مؤسسة الضمان الاجتماعي التركية (sgk.gov.tr) وبوّابة e-Devlet — خدمات تسجيل المُعالين ضمن التأمين الصحي.',
}

CLUSTER = sorted({s for k, d in MERGES for s in [k] + d} | set(KEEP) | set(SOURCES))
_req = urllib.request.Request(
    '%s/rest/v1/articles?select=slug,title,documents,steps,tips,fees,source,warning,details,views&slug=in.(%s)'
    % (_URL, ','.join(urllib.parse.quote(s, safe='') if any(ord(c) > 127 for c in s) else s
                      for s in CLUSTER)),
    headers={'apikey': _KEY, 'Authorization': 'Bearer ' + _KEY},
) if False else None

# PostgREST `in.()` with Arabic slugs is fragile; fetch everything and filter.
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

header = """-- ============================================================================
-- عنقود الصحة والتأمين: 20 صفحة ← 13 (2026-08-06)
-- ============================================================================
-- لا كشف مدوّياً هنا. هذا العنقود هو ببساطة حيث كُتبت الصفحة نفسها أكثر من
-- مرّة، ثمّ كُتبت نسخة طويلة جيّدة ولم تُحذف القصيرة.
--
-- ثلاث صفحات منفصلة عن تأمين الزلازل الإجباري (DASK). واثنتان عن تأمين
-- السيارة، وليست إحداهما الصفحة ذات الـ1,025 كلمة التي تشرح التعرفة فعلاً.
-- واثنتان عن e-Nabız إحداهما 24 كلمة. واثنتان عن حجز موعد المستشفى. وأربع
-- صفحات قصيرة تعيد ما يقوله عمود SGK/GSS ذو الـ591 كلمة.
--
-- وكل دمج يتبع القاعدة التي أظهرها عنقود الجنسية ويتحقّق منها هذا الملف:
-- الباقية هي الأطول متناً، لأنّ عناصر القوائم تُنقل ثمّ تُحذف الصفحة. وهذا
-- يقلب الاختيار البديهي مرّتين هنا — صفحتا تأمين السيارة تذهبان إلى صفحة
-- التعرفة لا إلى بعضهما، وصفحة حجز الموعد تذهب إلى دليل MHRS رغم أنّ لها
-- قراءات أكثر منه.
--
-- وحدّان فُحصا ولم يُفترضا:
--   • GSS ليس تأميناً خاصاً. صفحة «أسعار السيكورتا» ذات الـ87 كلمة تتحدّث عن
--     البوليصة الخاصة التي يطلبها ملفّ الإقامة، مسعّرةً بالفئة العمرية — منتج
--     مختلف عن نظام GSS الحكومي، فلا تُدمج فيه رغم اشتراك الكلمة. تبقى، وتبقى
--     موسومة: 87 كلمة وجدول أسعار بلا مصدر.
--   • kimlik-work-and-sgk مصنّفة تحت الصحة وهي عن العمل بلا إذن. تذهب إلى عمود
--     إذن العمل، لا إلى صفحة تأمين.
--
-- ومتروك لجولة مستقلّة عن قصد: صفحات السياحة العلاجية الثلاث. كلٌّ منها بين 56
-- و74 كلمة وبلا أي مصدر، وتحمل نطاقات أسعار بالدولار لعمليات الأسنان والعيون.
-- ذلك يحتاج قراراً في الإسناد لا دمجاً، وإنجازه على عجل هنا سيكرّر الخطأ الذي
-- صحّحه عنقود التأشيرات للتوّ.
--
-- شغّله بعد اكتمال نشر الشيفرة (التحويلات في next.config.ts).
-- ============================================================================

"""

sql = header + '\n'.join(out)
sql += '\n-- سدّ حقل المصدر --------------------------------------------------------\n' + '\n'.join(srcs)
sql += ("\n-- الصفحات المدموجة تُحذف بعد نقل ما يستحقّ\nDELETE FROM articles WHERE slug IN (%s);\n"
        % ', '.join("'%s'" % q(s) for s in dropped))
sql += """
-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — الأول 7 صفوف، والثاني صفر
SELECT slug, coalesce(array_length(steps,1),0) AS steps,
       coalesce(array_length(tips,1),0) AS tips, last_update
FROM articles WHERE slug IN (%s) ORDER BY slug;

SELECT slug FROM articles WHERE slug IN (%s);

SELECT slug, (coalesce(trim(source), '') <> '') AS له_مصدر
FROM articles WHERE slug = 'sgk-add-family-members-health-insurance-2026';
""" % (', '.join("'%s'" % k for k, _ in MERGES), ', '.join("'%s'" % s for s in dropped))

path = os.path.join(REPO, 'sql', '2026-08-06_merge_health_cluster.sql')
open(path, 'w', encoding='utf-8').write(sql)

print('%-44s %-8s %-11s %s' % ('SURVIVOR', 'متن', 'steps', 'tips'))
for keep, n, s0, s1, t0, t1 in summary:
    print('%-44s %5dك   %2d→%-8d %2d→%d  ← %d' % (keep[:44], prose_len(keep), s0, s1, t0, t1, n))
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
