# -*- coding: utf-8 -*-
"""Consolidate the work-permit cluster: 14 pages -> 8.

Everything that crosses over is copied VERBATIM from a page in the cluster; the
script writes no prose. What it does NOT do is decide for itself what crosses
over — see the CARRY table below for why heuristic filtering made the surviving
pages worse than leaving them alone.

The one exception is deliberate and marked: two pages state that the 2026
change "lifted the work-permit obligation" from temporary-protection holders.
The Turkish migration authority's own page says both routes remain open —
"بامكان الاجانب الذين لديهم حماية مؤقتة التقديم بطلب الحصول على إذن العمل أو
إعفاء من إذن العمل بعد ستة أشهر" — and one of our own pages already frames it
correctly. That is a factual correction, not a merge, so it is emitted as its
own UPDATE with the official sentence and its source.
"""
import json, os, re, urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Read the cluster straight from the database, not from a JSON dump beside the
# script: a dump goes stale the moment anyone edits an article in the admin, and
# regenerating from stale input would quietly undo their edit.
# utf-8-sig, not utf-8: the file carries a BOM, and Python's str.strip() does not
# treat U+FEFF as whitespace (JS trim() does), so the first key would come out as
# "﻿NEXT_PUBLIC_SUPABASE_URL" and only the first key would be missing.
_env = {}
for _l in open(os.path.join(REPO, '.env.local'), encoding='utf-8-sig').read().splitlines():
    if '=' in _l and not _l.lstrip().startswith('#'):
        _k, _v = _l.split('=', 1)
        _env[_k.strip()] = _v.strip()
_URL = _env['NEXT_PUBLIC_SUPABASE_URL']
_KEY = _env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

CLUSTER = [
    'work-permit-turkey-2026', 'work-permit-application', 'work-permit-documents',
    'work-permit-renewal', 'work-permit-fees-2026', 'work-permit-residence',
    'employment-work-permit-kimlik-vs-tourist',
    'muafiyet-bilgi-formu-kimlik-work-permit-exemption-sgk-2026',
    'exemption-work-permit-full-guide-2026-06',
]
_req = urllib.request.Request(
    '%s/rest/v1/articles?select=slug,documents,steps,tips,fees,source,warning,details&slug=in.(%s)'
    % (_URL, ','.join(CLUSTER)),
    headers={'apikey': _KEY, 'Authorization': 'Bearer ' + _KEY},
)
rows = {r['slug']: r for r in json.load(urllib.request.urlopen(_req))}
# Once the merge SQL has run the seven absorbed rows are gone, and a rerun would
# otherwise emit a half-empty file that looks valid. Fail instead.
missing = [s for s in CLUSTER if s not in rows]
assert not missing, 'not in the database (already merged?): %s' % missing

# survivor -> [absorbed...]
MERGES = [
    # The permit pillar. All six are 102-189 words asking the same question a
    # different way: how do I get / renew / what papers / what fees.
    ('work-permit-turkey-2026', [
        'work-permit-application',
        'work-permit-documents',
        'work-permit-renewal',
        'work-permit-fees-2026',
        'work-permit-residence',
        'employment-work-permit-kimlik-vs-tourist',
    ]),
    # The exemption pillar. muafiyet-bilgi-formu survives because it carries the
    # procedure (959 words, 9 steps); the full-guide's unique facts move into it.
    ('muafiyet-bilgi-formu-kimlik-work-permit-exemption-sgk-2026', [
        'exemption-work-permit-full-guide-2026-06',
    ]),
]

# Left alone, each for a stated reason. Merging on slug similarity would have
# destroyed all four.
KEEP = {
    'work-permit-exemption-2026':
        'قانون 6735 وفئاته المعفاة بحكم المهنة — سؤال مختلف عن إعفاء الحماية المؤقتة.',
    'syria-work-permit-exemption-turkey-2026-07': 'خبر مؤرَّخ بإعلان 26 حزيران، لا دليل إجراء.',
    'ciftci-syrians-decisions-work-permit-exemption-2026-06': 'خبر تصريحات الوزير.',
    'trader-leave-work-permit-turkey':
        'ليست عن إذن العمل رغم اسمها — عن دخول حامل الكملك إلى سوريا وعودته. 385 مشاهدة.',
    'work-permit-students': 'جمهور مختلف: الطالب الجامعي بدوام جزئي.',
}


def norm(t):
    t = re.sub(r'<[^>]+>', ' ', str(t or ''))
    t = re.sub(r'[ً-ْ]', '', t)
    t = t.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ة', 'ه').replace('ى', 'ي')
    t = re.sub(r'[^\wء-ي\s]', ' ', t)
    return ' '.join(t.split()).lower()


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


# ── what actually crosses over ────────────────────────────────────────────
#
# The first version of this script filtered migrated items heuristically —
# length, plus a regex for anything naming a system, a document or a number —
# and the result was worse than not merging at all: 18 "documents" listing the
# passport three times, 20 "steps" opening e-İzin three times, and a wait of
# "30 days" on one line and "30-45 days" on the next. Arabic restates the same
# requirement in completely different words, so token-overlap dedup cannot see
# it, and a checklist that repeats itself reads as machine-written to a reader
# and to Google alike. The six absorbed pages were 102-189 words of generic
# advice; almost nothing in them is a fact the 1,399-word survivor lacks.
#
# So selection is explicit. Each entry below is a substring that must match
# exactly one migrated candidate, and only matched candidates survive. The
# optional second element is a cleaned form, used ONLY to strip a glued section
# header, a dangling connector or an emoji — never to rewrite the sentence.
# Everything not listed is dropped and printed, so the drops are reviewable.
CARRY = {
    'work-permit-turkey-2026': {
        # Nothing. Every migrated document line restated one of the survivor's
        # eight at lower precision.
        'documents': [],
        'steps': [
            # The survivor covers applying, not renewing. This is the window.
            ('قبل 60 يوماً', None),
            # Names the exact e-Devlet service that proves SGK is really paid.
            ('Hizmet Dökümü', None),
        ],
        'tips': [
            ('مسجّلاً في SGK', None),
            ('İŞKUR', None),                    # free permit route for Syrians
            ('Yeminli Tercüman', None),         # sworn translator → notary
            ('شهادة الخبرة المهنية قد تُقبل', None),
            ('لا تدفع لوسطاء', None),
        ],
    },
    'muafiyet-bilgi-formu-kimlik-work-permit-exemption-sgk-2026': {
        'documents': [],
        'steps': [],                            # both restated existing steps
        'tips': [
            # NOT CARRIED, deliberately: the dropped page's "the exemption period
            # was extended from six months to three years by the 15 Oct 2024
            # Resmî Gazete amendment". The amendment is real — Uluslararası
            # İşgücü Kanunu Uygulama Yönetmeliği art. 48/1(h), "altı aya" → "üç
            # yıla" — but 48/1(h) covers foreigners whom a public institution
            # certifies as bringing significant economic, socio-cultural,
            # technological or educational contribution. It does not touch
            # temporary protection. On THIS page, one line under a step that says
            # "wait six months from your kimlik date", a reader would read it as
            # their own wait or their own exemption. Dropping a true sentence
            # that is false in this context is the whole point of curating.
            ('المهن المحظورة تبقى محظورة', None),
            ('صلاحيتها قصيرة', None),
            ('نشطة وغير مُبطلة', None),
            ('الإعفاء السنوي من إذن السفر',
             'تفعيل التأمين (السيغورتا) بموجب الإعفاء يمنح عادةً الإعفاء السنوي من إذن السفر، فيكتمل وضعك القانوني.'),
            ('تُحدَّث الأنظمة الإلكترونية', None),
            ('لا تدفع مالاً لمن يَعِد',
             'لا تدفع مالاً لمن يَعِد بتسريع معاملة أو تغيير وضع قانوني.'),
        ],
    },
}


def carried_form(keep, col, v):
    """Return the form to store, or None to drop. Records the match for auditing."""
    for i, (needle, cleaned) in enumerate(CARRY[keep][col]):
        if needle in v:
            MATCHED.add((keep, col, i))
            return cleaned if cleaned is not None else v
    return None


MATCHED = set()


def clean_step(s):
    return re.sub(r'^\s*[0-9٠-٩]{1,2}\s*[.\-)]\s*', '', str(s)).strip()


def clean_prose(s):
    raw = str(s or '')
    parts = [p for p in re.split(r'\n+|\s{2,}', raw) if p.strip()]
    if len(parts) > 1 and len(parts[0].strip()) < 30:
        raw = ' '.join(parts[1:])
    return ' '.join(raw.split()).strip()


def q(s):
    return str(s or '').replace("'", "''")


def arr(items):
    return 'ARRAY[%s]::text[]' % ', '.join("'%s'" % q(x) for x in items)


out, dropped, summary, dropped_items = [], [], [], []

for keep, drop_list in MERGES:
    k = rows[keep]
    docs = list(k.get('documents') or [])
    steps = list(k.get('steps') or [])
    tips = list(k.get('tips') or [])
    d0, s0, t0 = len(docs), len(steps), len(tips)
    carried = []

    for ds in drop_list:
        d = rows[ds]
        for col, target in (('documents', docs), ('steps', steps), ('tips', tips)):
            for item in (d.get(col) or []):
                v = clean_step(item) if col == 'steps' else item
                take = carried_form(keep, col, v)
                if take and not already(take, target):
                    target.append(take)
                elif not take:
                    dropped_items.append((keep, col, v))
        # Facts that live only in the dropped page's prose. Same explicit gate:
        # a sentence pulled out of a paragraph carries its neighbours' grammar
        # with it, so it has to be chosen, not filtered.
        sents = [x.strip() for x in re.split(r'(?<=[.!؟])\s+', re.sub(r'<[^>]+>', ' ', d.get('details') or '')) if len(x.strip()) > 40]
        for s_ in sents:
            c = clean_prose(s_)
            if len(c) < 40:
                continue
            take = carried_form(keep, 'tips', c)
            if take and not already(take, tips + carried):
                carried.append(take)
            elif not take:
                dropped_items.append((keep, 'prose', c))

    tips += carried
    sets = ['documents = %s' % arr(docs), 'steps = %s' % arr(steps), 'tips = %s' % arr(tips)]
    for col in ('fees', 'source', 'warning'):
        if not (k.get(col) or '').strip():
            for ds in drop_list:
                if (rows[ds].get(col) or '').strip():
                    sets.append("%s = '%s'" % (col, q(rows[ds][col])))
                    break
    sets.append('last_update = CURRENT_DATE')
    out.append("-- %s  ←  %d صفحات\nUPDATE articles SET\n    %s\nWHERE slug = '%s';\n"
               % (keep, len(drop_list), ',\n    '.join(sets), keep))
    dropped += drop_list
    summary.append((keep, len(drop_list), d0, len(docs), s0, len(steps), t0, len(tips), len(carried)))

# A needle that matched nothing means a typo silently dropped a fact I meant to
# keep. That must fail loudly, not pass quietly.
unmatched = [(k, c, n) for k, cols in CARRY.items() for c, lst in cols.items()
             for i, (n, _) in enumerate(lst) if (k, c, i) not in MATCHED]
assert not unmatched, unmatched

# ── the factual correction ────────────────────────────────────────────────
OFFICIAL = ('المصدر الرسمي — رئاسة إدارة الهجرة التركية: «بامكان الاجانب الذين لديهم حماية مؤقتة '
            'التقديم بطلب الحصول على إذن العمل أو إعفاء من إذن العمل بعد ستة أشهر». '
            'أي أنّ الإعفاء لم يُلغِ إذن العمل — المساران قائمان معاً، والاختيار بينهما بحسب حالتك '
            'وصاحب العمل. (ar.goc.gov.tr، أذن العمل)')

# The sentence is APPENDED, never assigned. Both survivors already carry a real
# warning — one about the penalty for working without a permit, one about the
# exemption's fees and SGK rules being liable to change — and an assignment here
# would have silently deleted both. The NOT LIKE guard makes the file safe to
# re-run: a second pass matches and skips instead of appending twice.
fix = ("-- تصحيح وقائعي، لا دمج ------------------------------------------------\n"
       "-- صفحتان تقولان إنّ قرار 2026 «رفع إلزام إذن العمل» عن حاملي الحماية\n"
       "-- المؤقتة. صفحة إدارة الهجرة التركية نفسها تقول غير ذلك: المساران قائمان.\n"
       "--\n"
       "-- الجملة الرسمية تُضاف إلى التنبيه القائم ولا تحلّ محلّه. للصفحتين تنبيهان\n"
       "-- حقيقيان لا يجوز محوهما: عقوبة العمل بلا إذن في الأولى، وتغيّر رسوم\n"
       "-- الإعفاء وقواعد ربطه بـSGK في الثانية. وشرط NOT LIKE يجعل الملف آمناً\n"
       "-- لإعادة التشغيل، فلا تتكرّر الجملة نفسها في التنبيه مرّتين.\n"
       "UPDATE articles\n"
       "SET warning = trim(coalesce(warning, '') || ' ' || '%s'),\n"
       "    last_update = CURRENT_DATE\n"
       "WHERE slug IN ('muafiyet-bilgi-formu-kimlik-work-permit-exemption-sgk-2026', 'work-permit-turkey-2026')\n"
       "  AND coalesce(warning, '') NOT LIKE '%%إعفاء من إذن العمل بعد ستة أشهر%%';\n"
       % q(OFFICIAL))

header = """-- ============================================================================
-- توحيد عنقود «إذن العمل»: 14 صفحة ← 8 (2026-08-05)
-- ============================================================================
-- أربع عشرة صفحة على موضوع واحد تتنافس بينها، وستّ منها بين 102 و189 كلمة
-- تسأل السؤال نفسه بصياغات مختلفة. المنافسون (takamul، ayaturk، douknowturkey)
-- ينشر كلٌّ منهم صفحة واحدة شاملة — ولهذا يسبقون.
--
-- ما يُدمج:
--   • عمود «إذن العمل» ← work-permit-turkey-2026 (412 مشاهدة، 1399 كلمة)
--     يبتلع: التقديم، الأوراق، التجديد، الرسوم، الإقامة، ومقارنة الكملك/السياحية.
--   • عمود «الإعفاء» ← muafiyet-bilgi-formu (959 كلمة، 9 خطوات)
--     يبتلع: الدليل الشامل للإعفاء.
--
-- ما لا يُدمج، ولكلٍّ سببه — الدمج بتشابه الاسم كان سيُتلفها:
--   • work-permit-exemption-2026 — قانون 6735 وفئاته المعفاة بحكم المهنة، سؤال آخر.
--   • trader-leave-work-permit-turkey — 385 مشاهدة، وهي أصلاً عن دخول التاجر
--     إلى سوريا وعودته لا عن إذن العمل، رغم ما يوحي به اسمها.
--   • work-permit-students — جمهور مختلف.
--   • الخبران المؤرَّخان (تصريحات الوزير، وإعلان 26 حزيران) — أخبار لا أدلّة.
--
-- القاعدة: هذا الملف مولَّد آلياً ولا يكتب جملة. كل ما يُنقل منقول بنصّه من
-- صفحة قائمة أو محذوفة، والاختيار صريح لا آلي.
--
-- ولماذا صريح: النسخة الأولى رشّحت بالطول وبوجود رقم أو اسم نظام، فأنتجت 18
-- «وثيقة» فيها الجواز ثلاث مرّات، و20 خطوة تفتح e-İzin ثلاث مرّات، ومدّة
-- انتظار «30 يوماً» في سطر و«30-45» في السطر التالي. العربية تعيد الشرط
-- نفسه بألفاظ مختلفة تماماً، فترشيح التشابه لا يراه — وقائمة تكرّر نفسها
-- أسوأ للقارئ ولجوجل من عدم الدمج أصلاً. فصار كل عنصر يُنقل مُختاراً بيده.
-- المحصّلة: العمود بقي 8 وثائق و8 خطوات و10 نصائح، لا 18 و20 و22.
--
-- وأُسقطت عمداً جملة صحيحة: «تمديد مدّة الإعفاء من 6 أشهر إلى 3 سنوات بتعديل
-- 15 تشرين الأول 2024». التعديل حقيقي (المادة 48/1-h من لائحة تطبيق قانون
-- العمالة الدولية: «altı aya» ← «üç yıla»)، لكنّه يخصّ الأجانب الذين تُبلّغ
-- جهة عامة بأنّ لهم إسهاماً اقتصادياً أو تقنياً أو تعليمياً مهمّاً — لا حاملي
-- الحماية المؤقتة. ووضعها تحت خطوة تقول «انتظر ستة أشهر من تاريخ كملكك»
-- يجعل القارئ يقرأها على نفسه. وهي موجودة اليوم على الصفحة المحذوفة وحدها،
-- فحذفها يزيلها من الموقع.
--
-- وفيه استثناء واحد مقصود ومعلَّم: تصحيح وقائعي في الأسفل.
--
-- شغّله بعد اكتمال نشر الشيفرة (التحويلات في next.config.ts).
-- ============================================================================

"""

sql = header + '\n'.join(out) + '\n' + fix
sql += ("\n-- الصفحات المدموجة تُحذف بعد نقل حقائقها\nDELETE FROM articles WHERE slug IN (%s);\n"
        % ', '.join("'%s'" % q(s) for s in dropped))
sql += """
-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — الأول صفّان، والثاني صفر صفوف
--
-- العمودان الأخيران هما بيت القصيد: «تصحيح_مضاف» يجب أن يكون true في الصفّين،
-- و«تنبيه_قديم_باقٍ» يجب أن يكون true أيضاً — فإن ظهر false فقد استُبدل التنبيه
-- بدل أن يُضاف إليه، وهذا خطأ يجب التوقّف عنده لا تجاوزه.
SELECT slug, coalesce(array_length(documents,1),0) AS docs,
       coalesce(array_length(steps,1),0) AS steps,
       coalesce(array_length(tips,1),0)  AS tips,
       (warning LIKE '%%ستة أشهر%%')          AS تصحيح_مضاف,
       (warning LIKE '%%مخالفة قانونية%%'
        OR warning LIKE '%%قابلة للتغيير%%')  AS تنبيه_قديم_باق,
       last_update
FROM articles WHERE slug IN (%s) ORDER BY slug;

SELECT slug FROM articles WHERE slug IN (%s);
""" % (', '.join("'%s'" % k for k, _ in MERGES), ', '.join("'%s'" % s for s in dropped))

path = os.path.join(REPO, 'sql', '2026-08-05_merge_work_permit_cluster.sql')
open(path, 'w', encoding='utf-8').write(sql)

print('%-58s docs   steps  tips  (prose)' % 'SURVIVOR')
for keep, n, d0, d1, s0, s1, t0, t1, c in summary:
    print('%-58s %2d→%-3d %2d→%-3d %2d→%-3d (%d)  ← %d pages' % (keep[:58], d0, d1, s0, s1, t0, t1, c, n))
print()
print('pages removed :', len(dropped))
print('pages kept    :', len(KEEP), '→', list(KEEP))
print('quote parity  :', 'OK' if re.sub(r"''", '', sql).count("'") % 2 == 0 else '*** BROKEN ***')
print('written       :', path, len(sql), 'chars')
print()
print('--- next.config.ts redirects ---')
for keep, drop_list in MERGES:
    for d in drop_list:
        print("      { source: '/article/%s', destination: '/article/%s', permanent: true }," % (d, keep))
