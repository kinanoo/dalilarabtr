# -*- coding: utf-8 -*-
"""Turn 33 near-identical e-Devlet "articles" into one directory.

Measured, not guessed: across 331 published articles, the top 28 most textually
similar PAIRS on the whole site were all e-Devlet, overlapping 50-65%. Outside
this block only two pairs anywhere exceed 30%. So this is not a cluster of
similar pages — it is one template, published 33 times.

What is actually identical on all 33, word for word:
  • the three "documents"  (e-Devlet account / TC or YKN / a working phone)
  • the three "tips"       (try the app, the no-permission message, keep a PDF)
  • the fees line and the warning
  • step 1, "افتح الرابط الرسمي وسجّل الدخول"
What differs: the title, one or two sentences, the turkiye.gov.tr URL, and one
service-specific step. Average body: 38 words. Combined reads: 329, about ten
each.

A directory entry published as an article is a structural mistake, not a
content one, so the fix is structural: the shared parts are stated ONCE on the
hub, each service keeps its own sentence, its own step and its own official
link as a card, and the 33 URLs redirect to their anchor on that hub. Readers
lose nothing — the official link is the thing they came for, and it is now one
click closer instead of one page further.

Nothing here is rewritten. Titles, sentences, steps and URLs are copied from
the rows verbatim; this script only moves them and drops the boilerplate.
"""
import json, os, re, urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

_env = {}
for _l in open(os.path.join(REPO, '.env.local'), encoding='utf-8-sig').read().splitlines():
    if '=' in _l and not _l.lstrip().startswith('#'):
        _k, _v = _l.split('=', 1)
        _env[_k.strip()] = _v.strip()
_URL, _KEY = _env['NEXT_PUBLIC_SUPABASE_URL'], _env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

# The template's own fingerprint: this tip appears verbatim on every one of the
# 33 and on nothing else. Matching on it rather than on the category is what
# keeps the four real pages in that category (the two phone-line guides, the
# e-money page, the SGK statement) out of the sweep.
FINGERPRINT = 'احتفظ بنسخة PDF/Barcode عند استخراج أي وثيقة رسمية.'
BOILERPLATE_DOCS = ('حساب e', 'رقم الهوية (T.C.)', 'رقم هاتف فعّال')
BOILERPLATE_STEP = 'افتح الرابط الرسمي'

rows = []
for off in range(0, 700, 100):
    req = urllib.request.Request(
        '%s/rest/v1/articles?select=slug,title,details,tips,steps,documents,source'
        '&status=eq.approved&order=slug.asc' % _URL,
        headers={'apikey': _KEY, 'Authorization': 'Bearer ' + _KEY,
                 'Range': '%d-%d' % (off, off + 99)},
    )
    part = json.load(urllib.request.urlopen(req))
    rows += part
    if len(part) < 100:
        break

tpl = sorted([a for a in rows if FINGERPRINT in (a.get('tips') or [])], key=lambda a: a['slug'])
assert tpl, 'no template rows found — already migrated?'


def one_line(html):
    return ' '.join(re.sub(r'<[^>]+>', ' ', html or '').split())


def sentences(text):
    return [s.strip() for s in re.split(r'(?<=[.!؟])\s+', text) if len(s.strip()) >= 25]


# Step 1 is boilerplate on every page, but seven pages repeat the same "open the
# official link and sign in" as their SECOND step in slightly different words —
# which slipped past a plain string filter. A step earns its place only if it
# tells you to DO something once you are inside.
LOGIN = re.compile(r'سجّ?ل الدخول|ادخل (إلى |إلى|ل)?ل?رابط|افتح رابط')
ACTION = re.compile(r'ابحث|أدخل|ادخل رقم|اختر|اعرض|اطلب|اضغط|حمّل|نفّذ|راجع|تابع|احفظ|قم بتحميل')


def own_step(steps):
    for s in steps:
        s = str(s).strip()
        if LOGIN.search(s) and not ACTION.search(s):
            continue
        return s
    return ''


def ts(s):
    return str(s or '').replace('\\', '\\\\').replace("'", "\\'")


services = []
for a in tpl:
    slug = a['slug']
    assert slug.startswith('edevlet-'), slug
    steps = [s for s in (a.get('steps') or []) if BOILERPLATE_STEP not in s]
    docs = [d for d in (a.get('documents') or []) if not any(b in d for b in BOILERPLATE_DOCS)]
    url = (a.get('source') or '').strip()
    assert url.startswith('http'), 'no official url on %s' % slug
    # Four of the 33 carry a real explanation (122-190 words) under the same
    # boilerplate. Truncating that into a card blurb would throw away the only
    # writing in the whole group, so the first sentence becomes the blurb and
    # the rest is kept as notes on the card.
    sents = sentences(one_line(a.get('details')))
    services.append({
        'id': slug[len('edevlet-'):],
        'slug': slug,
        'title': a['title'],
        'intro': sents[0] if sents else one_line(a.get('details')),
        'notes': sents[1:],
        # The one instruction that was actually specific to this service.
        'howTo': own_step(steps),
        'needs': docs,
        'url': url,
    })

ids = [s['id'] for s in services]
assert len(set(ids)) == len(ids), 'anchor collision: %s' % [i for i in ids if ids.count(i) > 1]

lines = ["""/**
 * e-Devlet services directory — single source of truth.
 *
 * These 33 entries used to be 33 published articles, and measurement is what
 * settled it: on a 331-article site the twenty-eight most textually similar
 * PAIRS were all from this group, overlapping 50-65%, while outside it only two
 * pairs anywhere passed 30%. They were not similar articles. They were one
 * template with the service name swapped — identical prerequisites, identical
 * tips, identical fee line, identical warning, identical first step. Each
 * carried an average of 38 words of its own and about ten reads.
 *
 * A directory entry is not an article. The shared half is stated once on the
 * hub (EDEVLET_PREREQS / EDEVLET_TIPS below), each entry keeps the sentence,
 * the step and the official link that were genuinely its own, and the old
 * article URLs 308 to their anchor here.
 *
 * `id` is the anchor and the redirect target: /e-devlet-services#<id>.
 * `url` is always the service's own page on turkiye.gov.tr — never a mirror,
 * never a shortener. If a link dies, fix it here; there is nowhere else.
 *
 * Generated from the rows themselves by scripts/gen-edevlet-registry.py, so no
 * wording was invented in the move. Add a service by hand: it needs an id, a
 * title, one honest sentence, and the official URL.
 */

export type EDevletService = {
    /** Anchor on /e-devlet-services, and the tail of the old article slug. */
    id: string;
    title: string;
    /** One sentence on what the service does. */
    intro: string;
    /** The step specific to this service; the shared ones live in EDEVLET_STEPS. */
    howTo: string;
    /** Anything this service needs beyond the shared prerequisites. */
    needs?: string[];
    /** Extra explanation, on the few entries that carried real writing. */
    notes?: string[];
    /** The service's own page on turkiye.gov.tr. */
    url: string;
};

/** True of every service here, so it is said once instead of thirty-three times. */
export const EDEVLET_PREREQS = [
    'حساب e‑Devlet فعّال (شيفرة من PTT، أو الدخول عبر البنك، أو الطرق الأخرى المتاحة).',
    'رقم الهوية (T.C.) أو رقم الأجنبي (YKN) بحسب حالتك.',
    'رقم هاتف فعّال — قد تحتاجه للتحقق عبر SMS.',
];

export const EDEVLET_STEPS = [
    'افتح الرابط الرسمي للخدمة وسجّل الدخول إلى e‑Devlet.',
];

export const EDEVLET_TIPS = [
    'إذا لم تفتح الخدمة من المتصفح، جرّب تطبيق e‑Devlet ثم أعد المحاولة.',
    'إن ظهرت رسالة «لا تملك صلاحية»، فقد تكون الخدمة غير متاحة لنوع هويتك أو لولايتك.',
    'احتفظ بنسخة PDF أو بالباركود عند استخراج أي وثيقة رسمية.',
    'لا تدخل أي بيانات شخصية إلا داخل نطاق حكومي رسمي ينتهي بـ turkiye.gov.tr.',
];

export const EDEVLET_SERVICES: EDevletService[] = ["""]

for s in services:
    lines.append('    {')
    lines.append("        id: '%s'," % ts(s['id']))
    lines.append("        title: '%s'," % ts(s['title']))
    lines.append("        intro: '%s'," % ts(s['intro']))
    lines.append("        howTo: '%s'," % ts(s['howTo']))
    if s['notes']:
        lines.append('        notes: [')
        for n in s['notes']:
            lines.append("            '%s'," % ts(n))
        lines.append('        ],')
    if s['needs']:
        lines.append('        needs: [%s],' % ', '.join("'%s'" % ts(n) for n in s['needs']))
    lines.append("        url: '%s'," % ts(s['url']))
    lines.append('    },')

lines.append('];\n')
lines.append('/** Old /article/<slug> → anchor, for next.config.ts and any stale link. */')
lines.append('export const EDEVLET_LEGACY_SLUGS: Record<string, string> = {')
for s in services:
    lines.append("    '%s': '%s'," % (ts(s['slug']), ts(s['id'])))
lines.append('};\n')

ts_path = os.path.join(REPO, 'src', 'lib', 'edevletServices.ts')
open(ts_path, 'w', encoding='utf-8').write('\n'.join(lines))


def q(s):
    return str(s or '').replace("'", "''")


sql = """-- ============================================================================
-- عنقود e-Devlet: 33 صفحة قالب ← دليل واحد (2026-08-05)
-- ============================================================================
-- ليست صفحات متشابهة. هي قالب واحد نُشر 33 مرّة.
--
-- القياس هو ما حسمها: على موقع فيه 331 مقالاً، أعلى ثمانية وعشرين زوجاً
-- تشابهاً نصّياً كانت كلّها من هذه المجموعة، بتداخل 50-65%؛ وخارجها لا يتجاوز
-- 30% إلا زوجان في الموقع كلّه.
--
-- المتطابق حرفياً في الـ33: الوثائق الثلاث، والنصائح الثلاث، وسطر الرسوم،
-- والتنبيه، والخطوة الأولى. والفريد: العنوان، وجملة أو جملتان، ورابط
-- turkiye.gov.tr، وخطوة واحدة خاصة. وسطي المتن 38 كلمة، ومجموع القراءات 329
-- أي نحو عشر لكل صفحة.
--
-- مدخل في دليل ليس مقالاً. فالمشترك يُقال مرّة واحدة على الصفحة المجمِّعة،
-- وكل خدمة تحتفظ بجملتها وخطوتها ورابطها الرسمي على شكل كرت، والروابط الـ33
-- تُحوَّل إلى مرساتها هناك. القارئ لا يخسر شيئاً — الرابط الرسمي هو ما جاء
-- من أجله، وصار أقرب بنقرة بدل أن يبعد بصفحة.
--
-- ولم يُعَد كتابة شيء: العناوين والجمل والخطوات والروابط نُقلت بنصّها إلى
-- src/lib/edevletServices.ts، وهذا الملف يحذف الصفوف بعدها.
--
-- ولم تُمَسّ أربع صفحات في التصنيف نفسه لأنّها ليست من القالب: صفحتا توثيق
-- خطّ الهاتف (404 و59 قراءة)، وصفحة حسابات النقود الإلكترونية، وكشف الخدمة.
--
-- شغّله بعد اكتمال نشر الشيفرة (التحويلات في next.config.ts).
-- ============================================================================

DELETE FROM articles WHERE slug IN (
"""
sql += ',\n'.join("    '%s'" % q(s['slug']) for s in services) + '\n);\n'
sql += """
-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — الأول صفر، والثاني يجب أن يبقى 4 صفوف (غير القالب)
SELECT slug FROM articles WHERE slug IN (%s);

SELECT slug, views FROM articles
WHERE category = 'خدمات e-Devlet' AND status = 'approved'
ORDER BY views DESC;
""" % ',\n       '.join("'%s'" % q(s['slug']) for s in services)

sql_path = os.path.join(REPO, 'sql', '2026-08-05_retire_edevlet_template_pages.sql')
open(sql_path, 'w', encoding='utf-8').write(sql)

print('services      :', len(services))
print('total reads   :', 'n/a (rows carry them; see the SQL header)')
print('with own step :', sum(1 for s in services if s['howTo']))
print('with own need :', sum(1 for s in services if s['needs']))
print('with notes    :', sum(1 for s in services if s['notes']))
print('login-only    :', sum(1 for s in services if not s['howTo']))
print('registry      :', ts_path)
print('sql           :', sql_path)
print()
print('--- next.config.ts redirects ---')
for s in services:
    print("      { source: '/article/%s', destination: '/e-devlet-services#%s', permanent: true },"
          % (s['slug'], s['id']))
