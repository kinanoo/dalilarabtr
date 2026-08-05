# -*- coding: utf-8 -*-
"""Consolidate and correct the Syrian-consulate cluster: 21 pages -> 15.

This cluster is the site's highest-demand one (3,657 reads across 21 pages) and
it was also its least accurate. Three findings drove the work, in order of harm:

1. The single most-read consular page told readers to "wait for the electronic
   appointment system to open at mofaex.gov.sy". The ministry's own e-services
   page says the system is live, as both a web portal and the MOFA SY app. That
   line sat in front of 1,518 readers telling them to wait for something that
   already works.

2. Three of our pages published three different fees for the SAME passport:
   $200; "$200 expedited / $400 ordinary" (inverted — expedited cheaper than
   ordinary); and a `fees` column reading "$300-800". The ministry publishes no
   fee schedule at all (mofaex.gov.sy/consular-services is a 404), so none of
   these could be sourced. Someone travels to Gaziantep with the wrong money.

3. One page routed passport bookings through syrian-embassy.com — not a
   government domain. That page is deleted outright; nothing crosses over.

The photo specification was contradictory too: 4x6 cm on one page, 4x4 on two
others including the one reproducing the consulate's own issued procedural
guide. 4x4 is kept and 4x6 dropped, but as the consulate's published figure and
not as something we verified with the ministry — the difference is stated on the
page rather than smoothed over.

Same discipline as the work-permit merge: nothing is carried unless it is named
in CARRY below, so a merge cannot quietly bloat a page with restatements. What
is new here is CORRECTIONS — targeted replacements of wrong sentences. Each one
must match exactly once or the script fails, so a silent no-op is impossible.
"""
import json, os, re, urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# utf-8-sig: the env file carries a BOM and Python's strip() leaves U+FEFF in
# place (JS trim() removes it), so plain utf-8 loses the first key only.
_env = {}
for _l in open(os.path.join(REPO, '.env.local'), encoding='utf-8-sig').read().splitlines():
    if '=' in _l and not _l.lstrip().startswith('#'):
        _k, _v = _l.split('=', 1)
        _env[_k.strip()] = _v.strip()
_URL, _KEY = _env['NEXT_PUBLIC_SUPABASE_URL'], _env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

# survivor -> [absorbed...]
MERGES = [
    # «القنصلية السورية في غازي عنتاب» — 2,451 reads across three URLs.
    # The guide survives rather than the 1,518-read news page: its slug is
    # evergreen where the other is dated, and the news page's own opening
    # paragraph already calls the guide "الدليل الدائم المحدّث".
    ('syrian-consulate-gaziantep-guide', [
        'gaziantep-syrian-consulate-opens-2026-06-11',
        'alqnslya-alswrya-fy-ghazy-antab-mttlbat',
    ]),
    # «حجز موعد القنصلية» — the survivor is the only one of the three that
    # describes the system as it actually works today.
    ('syrian-consulate-appointment', [
        'syrian-consular-appointments-app',
        'passport-booking-system-legacy',
    ]),
    # Consular stamping: documents and powers of attorney are the same counter,
    # the same appointment type and the same chain. Two ~100-word pages.
    ('syrian-document-attestation', ['agency-attestation-legacy']),
    # "I renewed my passport — now what?" is the second half of the renewal
    # journey, not a separate question.
    ('syrian-passport-renewal', ['identity-passport-renewal-update']),
]

# Left alone, each for a stated reason.
KEEP = {
    'syrian-consulate-services-turkey-2026':
        'تجيب «ما الخدمات؟» لا «أين القنصلية؟» — لكنّها تحمل ثلاثة أرقام رسوم متناقضة، فتُصحَّح لا تُدمج.',
    'document-attestation-turkey-to-syria-students-2026':
        'الاتجاه المعاكس: تصديق وثيقة تركية للاستعمال في سوريا. سؤال آخر.',
    'children-passport-syria': 'جواز الأطفال — 2,997 كلمة، دليل قائم بذاته.',
    'lost-passport-turkey': 'الجواز المفقود — 2,634 كلمة، ويبدأ بمحضر الشرطة لا بالقنصلية.',
    'turkish-embassy-beirut-family': 'السفارة التركية في بيروت — جهة أخرى وبلد آخر.',
    'identity-apostille-kaymakam-valilik': 'الأبوستيل التركي، مسار إداري تركي لا قنصلي.',
}

# ── what crosses over ─────────────────────────────────────────────────────
# Each entry: (needle matching exactly one candidate, cleaned form or None).
# A cleaned form only strips a glued header, fixes a run-together sentence, or
# reunites a fact split across two list items — never invents a claim.
CARRY = {
    'syrian-consulate-gaziantep-guide': {
        'documents': [
            ('حتى لو منتهي الصلاحية', None),
            ('اخراج قيد ب صورة او هوية شخصية',
             'إخراج قيد مصدّق (من المختار والسلطة المحلية وشاهدَين، ومصدّق من وزارة الخارجية السورية '
             'أو المكاتب القنصلية)، أو هوية شخصية'),
        ],
        # The absorbed steps are either wrong (wait for the booking system to
        # open) or already on the survivor in the same words.
        'steps': [],
        'tips': [
            ('لا تقبل بعملة الدولار القديمة',
             'القنصلية لا تقبل الدولار من الإصدارات القديمة — احمل العملة الجديدة حصراً.'),
            # Age brackets from the consulate's own issued procedural guide.
            ('أقل من 12 سنة',
             'الأطفال دون 12 سنة: لا بصمات، وحضور الأب أو الجدّ إلزامي؛ وعند غياب الأب تُطلب '
             'وصاية شرعية مصدّقة من داخل سوريا حصراً.'),
            ('من 12 إلى 70 سنة', 'من 12 إلى 70 سنة: البصمات إلزامية.'),
            ('أكثر من سبعين',
             'فوق السبعين: الحضور الشخصي إلزامي، ولا إعفاء منه إلا بإثبات العجز بتقرير طبي معتمد '
             'صادر رسمياً من بلد الإقامة.'),
            ('مدة صلاحية الجواز',
             'الدليل الإجرائي الذي نشرته القنصلية يذكر رسم 200 دولار للجواز العادي وصلاحية ست سنوات. '
             'وزارة الخارجية والمغتربين لا تنشر جدول رسوم على موقعها، فأكّد الرقم عند حجز موعدك ولا '
             'تعتمد على رقم من وسيط.'),
            ('وكلس وهاتاي',
             'القنصلية تخدم سوريّي ولايات الجنوب — غازي عنتاب وكلس وهاتاي وشانلي أورفا ومرسين وأضنة — '
             'بدل السفر إلى إسطنبول لإنجاز معاملة واحدة.'),
        ],
    },
    'syrian-consulate-appointment': {
        'documents': [('المستندات المطلوبة للخدمة القنصلية نفسها', None)],
        'steps': [
            ('تأكد أن الرابط حكومي',
             'تأكّد أنّ رابط التحميل رسمي قبل إدخال أي بيانات — تنتشر روابط مزيفة باسم القنصلية.'),
        ],
        'tips': [('التنبيهات/التذكيرات مفيدة', 'فعّل تنبيهات التطبيق كي لا يفوتك الموعد.')],
    },
    'syrian-document-attestation': {
        'documents': [('نص الوكالة مطبوع', 'نصّ الوكالة مطبوعاً (للوكالات)')],
        'steps': [
            ('تحضير النص',
             'للوكالة: حضّر نصّها — يُفضَّل أن يكتبه محامٍ في سوريا ويُرسله إليك مطبوعاً.'),
            ('حضور الموكل شخصياً',
             'الوكالة تتطلّب حضور الموكِّل شخصياً — لا تُقبل بالنيابة.'),
            ('ترسل بالبريد إلى سوريا',
             'بعد الختم القنصلي تُرسل الوكالة بالبريد إلى سوريا لتصديقها من وزارة الخارجية هناك.'),
        ],
        'tips': [
            ('الوكالة العامة خطيرة', None),
            ('صلاحية الوكالة', None),
        ],
    },
    'syrian-passport-renewal': {
        'documents': [],
        'steps': [
            ('تحقق من تطابق الاسم', None),
            ('راجع الجهة المختصة لتحديث رقم الجواز', None),
        ],
        'tips': [
            ('أي اختلاف في رقم الجواز', None),
            ('احتفظ بالجواز القديم', None),
        ],
    },
}

# A carried item that says the same thing as one the survivor already has, only
# better, REPLACES it in place instead of being appended next to it. Without
# this the Gaziantep guide would have carried "عنتاب تخدم ولايات الجنوب" once
# generically and once with the province list — the exact self-repeating
# checklist the work-permit merge had to be rebuilt to avoid.
# carried needle -> needle identifying the survivor item it supersedes
SUPERSEDES = {
    'اخراج قيد ب صورة او هوية شخصية': 'بطاقة شخصية مع صورة عنها',
    'وكلس وهاتاي': 'سكان الجنوب لم يعودوا بحاجة',
    'المستندات المطلوبة للخدمة القنصلية نفسها': 'الوثائق الخاصة بالمعاملة المطلوبة',
}

# Edits to the SURVIVORS' own list items — wrong facts and broken lines that
# predate this merge. `None` deletes the item.
EDITS = {
    'syrian-consulate-appointment': {
        # Not a step: it points at a link "at the top of the article".
        'steps': [('رابط الحصول على التطبيق من غوغل بلاي', None)],
    },
    'syrian-document-attestation': {
        'steps': [
            # Another unsourced dollar figure, of the kind this file exists to remove.
            ('الرسم حوالي 25-50',
             'الختم القنصلي: قدّم الوثيقة للقنصلية ليوضع الختم عليها. الرسم غير منشور رسمياً — أكّده عند حجز الموعد.'),
            # Valilik is the provincial governorate; Kaymakamlık is the district
            # office — a different building. And which one legalises a foreign
            # consular seal differs by province and document type, so the honest
            # instruction is to confirm rather than to name the wrong one.
            ('مكتب الوالي (Kaymakamlık)',
             'التصديق التركي: بعد الختم القنصلي تُصدَّق الوثيقة لدى الجهة التركية المختصة — '
             'تختلف بحسب الولاية ونوع الوثيقة، فاسأل ولاية إقامتك (Valilik) عن الجهة الصحيحة قبل التوجّه.'),
        ],
    },
}

# ── factual corrections, applied to pages that are NOT being merged away ──
# (slug, column, exact old substring, new substring). Each must match exactly
# once. `None` as the old value replaces the whole column.
ADDR = 'منطقة Günevler، شارع kemal köker، بلدية şehitkamil، الرمز البريدي 27560'
CORRECTIONS = [
    # ── the invented fee schedule ─────────────────────────────────────────
    ('syrian-consulate-services-turkey-2026', 'details',
     '<li><p>تجديد الجواز: 200 $ مستعجل -400 $ عادي </p></li>',
     '<li><p>وزارة الخارجية والمغتربين السورية لا تنشر جدول رسوم على موقعها، والأرقام المتداولة متضاربة. '
     'الدليل الإجرائي الذي نشرته قنصلية غازي عنتاب يذكر <strong>200 دولار للجواز العادي وصلاحية ست سنوات</strong>؛ '
     'وما عدا ذلك أكّده عند حجز الموعد، ولا تعتمد على رقم من وسيط.</p></li>'),
    ('syrian-consulate-services-turkey-2026', 'details',
     '<h3>المدة:</h3><p>عادةً 3 ايام المستعجل - 1ل 2 أشهر العادي.</p>',
     '<h3>المدة:</h3><p>مدّة الإنجاز غير منشورة رسمياً وتختلف بحسب البعثة وضغط المواعيد — اسأل عنها عند تقديم معاملتك.</p>'),
    ('syrian-consulate-services-turkey-2026', 'details',
     '<li><p><strong>الرسوم:</strong> 200 دولار حسب النوع</p></li>',
     '<li><p><strong>الرسوم:</strong> غير منشورة رسمياً — تُؤكَّد عند حجز الموعد</p></li>'),
    ('syrian-consulate-services-turkey-2026', 'fees', None,
     'لا تنشر وزارة الخارجية والمغتربين السورية جدول رسوم قنصلية على موقعها الرسمي. الرقم الوحيد المنشور من '
     'جهة رسمية هو ما ورد في الدليل الإجرائي لقنصلية غازي عنتاب: 200 دولار للجواز العادي، وصلاحيته ست سنوات. '
     'أكّد رسم معاملتك عند حجز الموعد، وادفع داخل القنصلية فقط.'),
    # ── the photo count ───────────────────────────────────────────────────
    ('syrian-consulate-services-turkey-2026', 'details',
     '<li><p>صور شخصية حديثة (6 صور بخلفية بيضاء)</p></li>',
     '<li><p>صور شخصية بخلفية بيضاء — الدليل الإجرائي لقنصلية غازي عنتاب يطلب صورتين قياس 4×4، '
     'وقد يختلف العدد بحسب المعاملة والبعثة، فأكّده عند حجز الموعد</p></li>'),
    # ── a consular office we cannot find in the ministry's own directory ──
    ('syrian-consulate-services-turkey-2026', 'details',
     '<li><p><strong>مرسين:</strong> مكتب قنصلي - لم يفتح بعد - </p></li>',
     '<li><p><strong>باقي المدن:</strong> دليل البعثات على موقع الوزارة لا يُدرج أي بعثة سورية أخرى في تركيا — '
     'لا سفارة في أنقرة ولا مكتب في مرسين أو إزمير أو أضنة (تحقّقنا منه في 5 آب/أغسطس 2026): '
     '<a href="/consulates">دليل القنصليات السورية في تركيا</a></p></li>'),
    # ── the address the ministry has since published ──────────────────────
    ('syrian-consulate-gaziantep-guide', 'details',
     'حتى تاريخ تحديث هذا الدليل لم تنشر وزارة الخارجية والمغتربين السورية عنوان شارع تفصيلياً على موقعها الرسمي، '
     'وتأكيد الموعد الذي يصلك عبر التطبيق الرسمي هو مرجعك لتفاصيل الحضور.',
     'وقد نشرت وزارة الخارجية والمغتربين السورية العنوان في دليل بعثاتها الرسمي: ' + ADDR +
     ' (تحقّقنا منه في 5 آب/أغسطس 2026). ويبقى تأكيد الموعد الذي يصلك عبر التطبيق مرجعك لتفاصيل الحضور.'),
    ('syrian-consulate-gaziantep-guide', 'details',
     'لا يوجد عنوان شارع تفصيلي منشور رسمياً حتى الآن — اعتمد على تأكيد موعدك وقنوات الوزارة الرسمية.',
     'والعنوان كما ينشره دليل البعثات الرسمي: ' + ADDR + ' (تحقّقنا منه في 5 آب/أغسطس 2026).'),
    ('syrian-consulate-gaziantep-guide', 'warning', None,
     'لا دخول من دون موعد مؤكَّد عبر تطبيق (MOFA SY) أو بوّابة الوزارة. الوزارة لا تنشر رقم هاتف لهذه القنصلية '
     'حتى 5 آب/أغسطس 2026، وتنشر العنوان في دليل بعثاتها: ' + ADDR + '. لا تعتمد على أرقام أو عناوين متداولة '
     'في أدلة قديمة أو حسابات غير رسمية، وأكّد الرسوم وتفاصيل معاملتك من قنوات وزارة الخارجية والمغتربين.'),
]

# New titles for pages whose scope changed by absorbing another page.
RETITLE = {
    'syrian-document-attestation': (
        'تصديق الأوراق والوكالات في القنصلية السورية 2026',
        'تصديق وثيقة سورية للاستعمال في تركيا، وتنظيم وكالة وتصديقها — السلسلة كاملة من الخارجية السورية '
        'إلى القنصلية ثم الولاية، ومن يجب أن يحضر شخصياً.'),
}

CLUSTER = sorted({s for s, d in MERGES for s in [s] + d} |
                 {c[0] for c in CORRECTIONS} | set(KEEP))
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


MATCHED = set()


def carried_form(keep, col, v):
    for i, (needle, cleaned) in enumerate(CARRY[keep][col]):
        if needle in v:
            MATCHED.add((keep, col, i))
            return cleaned if cleaned is not None else v
    return None


def clean_step(s):
    return re.sub(r'^\s*[0-9٠-٩]{1,2}\s*[.\-)]\s*', '', str(s)).strip()


def clean_prose(s):
    return ' '.join(str(s or '').split()).strip()


def q(s):
    return str(s or '').replace("'", "''")


def arr(items):
    return 'ARRAY[%s]::text[]' % ', '.join("'%s'" % q(x) for x in items)


out, dropped, summary, drops_log = [], [], [], []

EDITED, SUPERSEDED = set(), set()

for keep, drop_list in MERGES:
    k = rows[keep]
    docs, steps, tips = (list(k.get(c) or []) for c in ('documents', 'steps', 'tips'))
    # The survivor's own steps get the same numeric-prefix strip as migrated
    # ones. Otherwise the merge itself produces a list numbered "1. 2. 3." for
    # the first five entries and unnumbered for the ones that just arrived.
    steps = [clean_step(s) for s in steps]
    # Wrong facts and broken lines that predate the merge.
    for col, target in (('documents', docs), ('steps', steps), ('tips', tips)):
        for needle, repl in EDITS.get(keep, {}).get(col, []):
            hit = [i for i, v in enumerate(target) if needle in str(v)]
            assert len(hit) == 1, 'EDIT %s.%s matched %d items: %s' % (keep, col, len(hit), needle)
            EDITED.add((keep, col, needle))
            if repl is None:
                target.pop(hit[0])
            else:
                target[hit[0]] = repl
    d0, s0, t0 = len(docs), len(steps), len(tips)
    prose = []

    for ds in drop_list:
        d = rows[ds]
        for col, target in (('documents', docs), ('steps', steps), ('tips', tips)):
            for item in (d.get(col) or []):
                v = clean_step(item) if col == 'steps' else str(item)
                take = carried_form(keep, col, v)
                if take:
                    sup = next((s for n, s in SUPERSEDES.items() if n in v), None)
                    idx = next((i for i, x in enumerate(target) if sup and sup in str(x)), None)
                    if idx is not None:
                        target[idx] = take
                        SUPERSEDED.add(sup)
                    elif not already(take, target):
                        target.append(take)
                else:
                    drops_log.append((keep, col, v))
        # Facts living only in the dropped page's prose. Same explicit gate: a
        # sentence pulled from a paragraph drags its neighbours' grammar along.
        body = re.sub(r'<[^>]+>', ' ', d.get('details') or '')
        for s_ in re.split(r'(?<=[.!؟])\s+', body):
            c = clean_prose(s_)
            if len(c) < 30:
                continue
            take = carried_form(keep, 'tips', c)
            if not take:
                continue
            sup = next((s for n, s in SUPERSEDES.items() if n in c), None)
            idx = next((i for i, x in enumerate(tips) if sup and sup in str(x)), None)
            if idx is not None:
                tips[idx] = take
                SUPERSEDED.add(sup)
            elif not already(take, tips + prose):
                prose.append(take)

    tips += prose
    sets = ['documents = %s' % arr(docs), 'steps = %s' % arr(steps), 'tips = %s' % arr(tips)]
    for col in ('fees', 'source'):
        if not str(k.get(col) or '').strip():
            for ds in drop_list:
                if str(rows[ds].get(col) or '').strip():
                    sets.append("%s = '%s'" % (col, q(rows[ds][col])))
                    break
    if keep in RETITLE:
        t, d_ = RETITLE[keep]
        sets += ["title = '%s'" % q(t), "seo_title = '%s'" % q(t), "seo_description = '%s'" % q(d_)]
    sets.append('last_update = CURRENT_DATE')
    out.append("-- %s  ←  %d صفحة\nUPDATE articles SET\n    %s\nWHERE slug = '%s';\n"
               % (keep, len(drop_list), ',\n    '.join(sets), keep))
    dropped += drop_list
    summary.append((keep, len(drop_list), d0, len(docs), s0, len(steps), t0, len(tips), len(prose)))

unmatched = [(k, c, n) for k, cols in CARRY.items() for c, lst in cols.items()
             for i, (n, _) in enumerate(lst) if (k, c, i) not in MATCHED]
assert not unmatched, 'CARRY needle matched nothing (typo?): %s' % unmatched
# A supersede that never fired means the duplicate it was meant to collapse is
# still sitting on the page next to its replacement.
assert set(SUPERSEDES.values()) == SUPERSEDED, \
    'SUPERSEDES never fired: %s' % (set(SUPERSEDES.values()) - SUPERSEDED)

# ── the corrections ───────────────────────────────────────────────────────
fixes = []
for slug, col, old, new in CORRECTIONS:
    cur = str(rows[slug].get(col) or '')
    if old is None:
        fixes.append("UPDATE articles SET %s = '%s', last_update = CURRENT_DATE\nWHERE slug = '%s';\n"
                     % (col, q(new), slug))
        continue
    n = cur.count(old)
    assert n == 1, 'correction for %s.%s matched %d times, expected 1:\n  %s' % (slug, col, n, old[:90])
    fixes.append("UPDATE articles SET %s = replace(%s, '%s', '%s'), last_update = CURRENT_DATE\nWHERE slug = '%s';\n"
                 % (col, col, q(old), q(new), slug))

header = """-- ============================================================================
-- عنقود القنصليات السورية: توحيد وتصحيح (2026-08-05)
-- ============================================================================
-- أعلى عناقيد الموقع طلباً: 21 صفحة و3,657 قراءة. وكان أقلّها دقّة.
--
-- ثلاثة أخطاء وقائعية، مرتَّبة بحسب الضرر:
--
--   1) الصفحة الأكثر قراءة (1,518) تقول «انتظر فتح نظام حجز المواعيد
--      الإلكتروني عبر mofaex.gov.sy». صفحة الخدمات الإلكترونية في الوزارة
--      نفسها تقول إنّ النظام يعمل، بوّابةً وتطبيقاً باسم MOFA SY. أي أنّ
--      السطر كان يوقف 1,518 قارئاً بانتظار ما يعمل أصلاً.
--
--   2) ثلاث صفحات تنشر ثلاثة أرقام لرسم الجواز نفسه: 200 دولار، و«200
--      مستعجل / 400 عادي» (مقلوبة — المستعجل أرخص من العادي؟)، وحقل رسوم
--      يقول «300-800». والوزارة لا تنشر جدول رسوم أصلاً
--      (mofaex.gov.sy/consular-services يرجع 404)، فلا سند لأيٍّ منها.
--      النتيجة العملية: قارئ يسافر إلى عنتاب بمبلغ خاطئ.
--
--   3) صفحة توجّه حجز الجوازات إلى syrian-embassy.com — نطاق غير حكومي.
--      تُحذف كاملةً ولا يُنقل منها شيء.
--
-- وتناقض رابع في مقاس الصور: 4×6 في صفحة، و4×4 في صفحتين إحداهما تنقل
-- الدليل الإجرائي الذي نشرته القنصلية نفسها. يبقى 4×4 ويسقط 4×6، لكن
-- منسوباً إلى ما نشرته القنصلية لا إلى تحقّق منّا من الوزارة — والفرق
-- مكتوب في الصفحة لا مطموس.
--
-- ما يُدمج: 21 صفحة ← 15.
--   • عنتاب: 3 صفحات ← دليل واحد. الباقي هو الدليل لا الخبر: رابطه دائم
--     لا مؤرَّخ، وصفحة الخبر نفسها تُحيل إليه بوصفه «الدليل الدائم المحدّث».
--   • حجز الموعد: 3 ← 1.  • التصديق والوكالات: 2 ← 1.  • الجواز: 2 ← 1.
--
-- ما لا يُدمج ولكلٍّ سببه مكتوب في المولّد: تصديق تركيا←سوريا (اتجاه معاكس)،
-- جواز الأطفال، الجواز المفقود، السفارة التركية في بيروت، الأبوستيل التركي.
--
-- القاعدة: لا يُنقل عنصر إلا إن كان مسمّى صراحةً في المولّد، وكل تصحيح نصّي
-- يجب أن يطابق مرّة واحدة تماماً وإلا فشل التوليد — فلا تصحيح يمرّ بلا أثر.
--
-- شغّله بعد اكتمال نشر الشيفرة (التحويلات في next.config.ts).
-- ============================================================================

"""

sql = header + '\n'.join(out) + '\n-- التصحيحات الوقائعية ----------------------------------------------------\n' + '\n'.join(fixes)
sql += ("\n-- الصفحات المدموجة تُحذف بعد نقل ما يستحقّ النقل\nDELETE FROM articles WHERE slug IN (%s);\n"
        % ', '.join("'%s'" % q(s) for s in dropped))
sql += """
-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — الأول أربعة صفوف، والثاني صفر، والثالث صفر
SELECT slug, coalesce(array_length(documents,1),0) AS docs,
       coalesce(array_length(steps,1),0) AS steps,
       coalesce(array_length(tips,1),0)  AS tips, last_update
FROM articles WHERE slug IN (%s) ORDER BY slug;

SELECT slug FROM articles WHERE slug IN (%s);

-- لا يبقى أي رقم رسوم غير مسنَد ولا رابط غير حكومي
SELECT slug FROM articles
WHERE details LIKE '%%200 $ مستعجل%%' OR details LIKE '%%6 صور بخلفية%%'
   OR details LIKE '%%syrian-embassy.com%%' OR fees LIKE '%%300-800%%';
""" % (', '.join("'%s'" % k for k, _ in MERGES), ', '.join("'%s'" % s for s in dropped))

path = os.path.join(REPO, 'sql', '2026-08-05_merge_consulate_cluster.sql')
open(path, 'w', encoding='utf-8').write(sql)

print('%-40s %-13s %-13s %s' % ('SURVIVOR', 'docs', 'steps', 'tips (prose)'))
for keep, n, d0, d1, s0, s1, t0, t1, p in summary:
    print('%-40s %2d→%-10d %2d→%-10d %2d→%d (%d)  ← %d' % (keep[:40], d0, d1, s0, s1, t0, t1, p, n))
print()
print('pages removed  :', len(dropped))
print('corrections    :', len(CORRECTIONS))
print('items dropped  :', len(drops_log))
print('quote parity   :', 'OK' if re.sub(r"''", '', sql).count("'") % 2 == 0 else '*** BROKEN ***')
print('written        :', path, len(sql), 'chars')
print()
print('--- next.config.ts redirects ---')
for keep, drop_list in MERGES:
    for d in drop_list:
        print("      { source: '/article/%s', destination: '/article/%s', permanent: true }," % (d, keep))
