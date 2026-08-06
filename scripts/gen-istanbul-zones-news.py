# -*- coding: utf-8 -*-
"""The Istanbul neighbourhoods decision never got a news row.

The article exists and is the site's best-read piece on this
(istanbul-closed-neighborhoods-lift-2026, 337 views), and the coordination
meeting re-confirmed its figure. But `updates` has no row pointing at it —
checked all 27 active rows. So the decision never appeared in the homepage
rail, never reached /updates, and never fired a notification. The owner is
right that it was never published as news.

── what is verified, and what is only relayed ────────────────────────────

Verified two ways: **five** neighbourhoods remain closed in Istanbul, and our
own `zones` table matches the official list row for row — ÜNİVERSİTE
(Avcılar), ZAFER and KOZA (Esenyurt), MOLLA HÜSREV (Fatih), BEŞYOL
(Küçükçekmece). The directorate re-confirmed the count at the coordination
meeting after the 7 June list.

Relayed, not independently verified: that the closed list stood at 54 out of
roughly 961 neighbourhoods. That comes from the directorate's own presentation
as reported by UCSO. It is attributed in the text to that source rather than
stated as our own count, because it is not something our data can confirm.

── a number that looked wrong and is not ─────────────────────────────────

The article says 49 neighbourhoods reopened; our table holds 50 reopened rows
for Istanbul (55 total = 5 closed + 50 reopened). The difference is one
neighbourhood reopened in an earlier wave, before the 7 June list of 54. Both
figures are correct for what they describe, so neither is touched here.

── and what is deliberately NOT published ────────────────────────────────

Our table shows 764 neighbourhoods still closed nationwide. That is not in the
news copy. Zone freshness has already burned this site once — a 2022 Şanlıurfa
list was published as 2026 advice — and a nationwide headline count is exactly
the claim that rots silently. Istanbul's five are confirmed twice by the
directorate this year; the national picture is left to the checker, which
shows each province's own state and carries its own dates.
"""
import json, os, re, urllib.parse, urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_env = {}
for _l in open(os.path.join(REPO, '.env.local'), encoding='utf-8-sig').read().splitlines():
    if '=' in _l and not _l.lstrip().startswith('#'):
        _k, _v = _l.split('=', 1)
        _env[_k.strip()] = _v.strip()
_URL, _KEY = _env['NEXT_PUBLIC_SUPABASE_URL'], _env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
_H = {'apikey': _KEY, 'Authorization': 'Bearer ' + _KEY}


def get(path):
    return json.load(urllib.request.urlopen(urllib.request.Request(_URL + '/rest/v1/' + path, headers=_H)))


def q(s):
    return str(s if s is not None else '').replace("'", "''")


ART = 'istanbul-closed-neighborhoods-lift-2026'
art = get('articles?select=slug,status,title&slug=eq.' + ART)
assert art and art[0]['status'] == 'approved', 'the article must be live to link to it'

# the five, read from our own table rather than typed from memory
closed = get('zones?select=neighborhood,district&city=eq.%C4%B0stanbul&status=eq.closed&order=district.asc')
assert len(closed) == 5, 'expected five closed, found %d — verify before publishing' % len(closed)

existing = get('updates?select=id&link=eq.' + urllib.parse.quote('/article/' + ART, safe=''))
assert not existing, 'a news row for this article already exists'

DISTRICT_AR = {'Avcılar': 'أفجيلار', 'Esenyurt': 'إسنيورت', 'Fatih': 'الفاتح',
               'Küçükçekmece': 'كوتشوك تشكمجة'}
rows = ''.join(
    '<tr><td><strong>%s</strong></td><td>%s <span dir="ltr">(%s)</span></td></tr>'
    % (z['neighborhood'], DISTRICT_AR.get(z['district'], z['district']), z['district'])
    for z in closed)

TITLE = 'رسمي: خمسة أحياء فقط بقيت مغلقة أمام تسجيل الأجانب في إسطنبول — وما عداها مفتوح'
SUMMARY = ('أكّدت مديرية إدارة الهجرة في ولاية إسطنبول أنّ الأحياء المغلقة أمام تسجيل الأجانب '
           'انحصرت في <strong>خمسة</strong> فقط، وأنّ ما عداها في الولاية مفتوح. والخمسة هي: '
           'ÜNİVERSİTE في أفجيلار، وZAFER وKOZA في إسنيورت، وMOLLA HÜSREV في الفاتح، وBEŞYOL '
           'في كوتشوك تشكمجة. وأداة فاحص الأحياء عندنا تطابق القائمة الرسمية حيّاً بحيّ.')
CONTENT = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الخلاصة</strong></p>'
    '<p style="margin:0;">إن كنت تبحث عن سكن في إسطنبول أو تريد نقل قيدك إليها، '
    'فـ<strong>خمسة أحياء فقط</strong> مغلقة أمام تسجيل الأجانب. وكلّ ما عداها في الولاية '
    '<strong>مفتوح</strong> — ومن يظنّ إسطنبول مغلقةً كلّها يمتنع عن إجراءٍ يستطيعه.</p></div>'

    '<h3>الأحياء الخمسة</h3>'
    '<table><thead><tr><th>الحي</th><th>القضاء</th></tr></thead><tbody>' + rows + '</tbody></table>'
    '<p>وهذه القائمة نفسها التي صدرت في <strong>7 حزيران/يونيو 2026</strong>، '
    '<strong>وأكّدتها المديرية مرّةً ثانية</strong> في اجتماع تنسيقي مع منظمات المجتمع المدني. '
    'فمن يسأل: هل تغيّرت بعد ذلك؟ الجواب لا.</p>'

    '<h3>ما معنى «مغلق» هنا؟</h3>'
    '<p>الإغلاق يخصّ <strong>تسجيل الأجانب في الحي</strong> — أي قيد العنوان ونقل السكن إليه. '
    'وهو ليس منعاً من دخول الحي ولا من العمل فيه ولا من زيارته. والخلط بين الأمرين يجعل الناس '
    'تتجنّب أحياءً مفتوحة بلا سبب.</p>'

    '<h3>لا تعتمد على قائمةٍ منقولة — افحص حيّك</h3>'
    '<p>القوائم المتداولة على مجموعات التواصل تتأخّر شهوراً عن القرارات، وقد رأينا قوائم من '
    'سنوات سابقة تُنشر بوصفها حالية. '
    '<a href="/zones/%C4%B0stanbul"><strong>افحص حيّك بالاسم التركي في فاحص الأحياء ←</strong></a> '
    'وتظهر لك حالته كما هي عندنا.</p>'
    '<p>وإن كنت خارج إسطنبول فالحال يختلف بين ولاية وأخرى — '
    '<a href="/zones">افتح الفاحص واختر ولايتك</a>.</p>'

    '<h3>وللسياق الكامل</h3>'
    '<p>ذكرت المديرية في عرضها أنّ القائمة كانت <strong>54 حيّاً</strong> من نحو '
    '<strong>961 حيّاً</strong> في الولاية قبل القرار — وهذا رقمٌ نقلاً عن عرض المديرية، لا '
    'إحصاءً من عندنا. والقرار جاء ضمن موجة وطنية بدأت في 6 حزيران/يونيو 2026.</p>'
    '<p style="margin-top:1rem;">'
    '<a href="/article/' + ART + '"><strong>التفصيل الكامل للقرار وأسماء الأحياء ←</strong></a></p>'
    '<p>وللمقيم في إسطنبول أيضاً: '
    '<a href="/article/istanbul-goc-randevu-noter-2026">تسليم أوراق الإقامة عبر النوتر</a> • '
    '<a href="/article/kimlik-data-update">تحديث بيانات الكملك والعنوان</a></p>'
)
SOURCE = ('مديرية إدارة الهجرة في ولاية إسطنبول (İstanbul İl Göç İdaresi Müdürlüğü) — القائمة '
          'الرسمية الصادرة في 7 حزيران/يونيو 2026، وتأكيدها في اجتماع تنسيقي مع منظمات المجتمع '
          'المدني نقله اتحاد منظمات المجتمع المدني للتنمية (UCSO) بوصفه مشاركاً')

for label, body, needles in [('summary', SUMMARY, ['خمسة']),
                             ('content', CONTENT, ['/zones/%C4%B0stanbul', ART, '961'])]:
    for n in needles:
        assert n in body, 'PREDICATE WOULD LIE: %r not in %s' % (n, label)
for z in closed:
    assert z['neighborhood'] in CONTENT, 'missing neighbourhood %s' % z['neighborhood']

sql = """-- ============================================================================
-- قرار الأحياء المغلقة في إسطنبول: الخبر الذي لم يُنشر
-- ============================================================================
-- المقال موجود وهو الأكثر قراءةً عندنا في هذا الباب
-- (istanbul-closed-neighborhoods-lift-2026، 337 قراءة)، والاجتماع التنسيقي
-- أكّد رقمه. لكنّ جدول updates لا يحوي صفّاً يشير إليه — فُحصت الصفوف
-- الـ27 الفعّالة كلّها. فلم يظهر القرار في شريط الصفحة الرئيسية، ولا وصل إلى
-- /updates، ولا أطلق إشعاراً. وصاحب الموقع محقّ: لم يُنشر خبراً قطّ.
--
-- ── ما هو متحقَّق منه، وما هو منقول ────────────────────────────────────
--
-- متحقَّق بطريقين: بقاء **خمسة** أحياء مغلقة في إسطنبول، وجدول zones عندنا
-- يطابق القائمة الرسمية حيّاً بحيّ — ÜNİVERSİTE (أفجيلار)، وZAFER وKOZA
-- (إسنيورت)، وMOLLA HÜSREV (الفاتح)، وBEŞYOL (كوتشوك تشكمجة). وأكّدت
-- المديرية العدد ثانيةً في الاجتماع التنسيقي بعد قائمة 7 حزيران.
--
-- منقول لا متحقَّق منه عندنا: أنّ القائمة كانت 54 حيّاً من نحو 961. وهو من
-- عرض المديرية نفسها كما نقله UCSO، ونُسب في المتن إلى مصدره صراحةً بدل أن
-- يُقدَّم إحصاءً من عندنا — لأنّ بياناتنا لا تؤكّده.
--
-- ── رقم بدا خطأً وليس كذلك ──────────────────────────────────────────────
--
-- المقال يقول 49 حيّاً أُعيد فتحها، وجدولنا فيه 50 صفّاً «reopened» لإسطنبول
-- (55 إجمالاً = 5 مغلقة + 50 مفتوحة). والفارق حيٌّ أُعيد فتحه في موجة أسبق،
-- قبل قائمة الـ54. فالرقمان صحيحان لما يصفانه، ولم يُمسّ أيٌّ منهما.
--
-- ── وما امتنعتُ عن نشره عمداً ───────────────────────────────────────────
--
-- جدولنا يُظهر 764 حيّاً ما زال مغلقاً على مستوى تركيا. وهذا الرقم ليس في
-- المتن. فحداثة بيانات الأحياء أحرقت هذا الموقع مرّةً — قائمة أورفا 2022
-- نُشرت بوصفها إرشاداً لعام 2026 — والعدّ الوطني في عنوان خبرٍ هو بالضبط
-- الادّعاء الذي يفسد صامتاً. خمسة إسطنبول أكّدتها المديرية مرّتين هذا العام؛
-- والصورة الوطنية تُترك للفاحص، يعرض حال كل ولاية بتاريخها.
--
-- آمن لإعادة التشغيل.
-- ============================================================================

INSERT INTO updates (type, title, summary, content, link, source_name, category, date, active, pinned)
SELECT 'news', '%s', '%s', '%s', '/article/%s', '%s', 'official', CURRENT_DATE, true, true
WHERE NOT EXISTS (SELECT 1 FROM updates WHERE link = '/article/%s');

-- خبر إذن السفر أُدرج بتاريخ 2026-08-07 بينما تُرشِّح الصفحة الرئيسية على
-- تاريخ UTC — فبقي محجوزاً كخبرٍ مستقبلي ولم يظهر. CURRENT_DATE هو الساعة
-- نفسها التي يقارن بها المرشِّح.
UPDATE updates SET date = CURRENT_DATE
WHERE link = '/article/travel-permit' AND date > CURRENT_DATE;

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int; bad int;
BEGIN
    SELECT count(*) INTO n FROM updates WHERE link = '/article/%s';
    IF n <> 1 THEN RAISE EXCEPTION 'expected exactly one news row, found %%', n; END IF;

    SELECT count(*) INTO bad FROM updates u
     WHERE u.link = '/article/%s'
       AND NOT EXISTS (SELECT 1 FROM articles a WHERE a.status = 'approved'
                        AND '/article/' || a.slug = u.link);
    IF bad > 0 THEN RAISE EXCEPTION 'the news links to an article that is not live'; END IF;

    -- الأحياء الخمسة في المتن يجب أن تطابق الجدول، لا الذاكرة
    SELECT count(*) INTO bad FROM zones z
     WHERE z.city = 'İstanbul' AND z.status = 'closed'
       AND NOT EXISTS (SELECT 1 FROM updates u WHERE u.link = '/article/%s'
                        AND u.content LIKE '%%' || z.neighborhood || '%%');
    IF bad > 0 THEN RAISE EXCEPTION 'the news omits %% closed neighbourhood(s) that the zones table lists', bad; END IF;
END
$check$;

SELECT 'news row created' AS البند, (count(*) = 1)::boolean AS سليم
FROM updates WHERE link = '/article/%s'
UNION ALL
SELECT 'pinned + active', bool_and(pinned AND active) FROM updates WHERE link = '/article/%s'
UNION ALL
SELECT 'İstanbul closed = 5', (count(*) = 5)::boolean FROM zones WHERE city = 'İstanbul' AND status = 'closed'
UNION ALL
SELECT 'links to the live article', (count(*) = 1)::boolean
FROM articles WHERE slug = '%s' AND status = 'approved';
""" % (q(TITLE), q(SUMMARY), q(CONTENT), ART, q(SOURCE), ART,
       ART, ART, ART, ART, ART, ART)

path = os.path.join(REPO, 'sql', '2026-08-07_istanbul_zones_news.sql')
open(path, 'w', encoding='utf-8').write(sql)

_code = '\n'.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('الأحياء الخمسة قُرئت من الجدول لا من الذاكرة:')
for z in closed:
    print('   %-26s %s' % (z['neighborhood'], z['district']))
print('\nالمقال المرتبط : %s (%s)' % (ART, art[0]['status']))
print('صفّ خبر سابق  : لا يوجد — لهذا لم يظهر القرار في الشريط ولا في /updates')
print('الفاحص        : /zones/İstanbul مربوط في المتن')
print('لم يُنشر عمداً : العدّ الوطني (764 مغلقاً) — بيانات الأحياء تفسد صامتة')
print('quote parity  :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written       :', path, len(sql), 'chars')
