# -*- coding: utf-8 -*-
"""Birth cluster: three stubs → one guide — plus the archive mystery, surfaced.

── the cluster ────────────────────────────────────────────────────────────

birth-registration-turkey        357 chars  37 views   ← canonical (best slug)
kimlik-newborn-addition          246 chars  15 views   ← retire
family-birth-registration-flow   251 chars   5 views   ← retire

The Turkish-side facts are already verified IN OUR CORPUS: children-passport-
syria (18K chars) carries law 5490 art. 15 with paragraph numbers — the
30-day duty (15/1), the hospital's own 5-workday duty (15/2), oral declaration
for home births (15/4), who must report (15/5), and the Formül A multilingual
birth record. The canonical is rebuilt on those, and hands the Syrian
consulate/passport leg to children-passport-syria instead of duplicating it.

── two traps this file steps around ──────────────────────────────────────

1. birth-registration-turkey's id does NOT equal its slug (checked live —
   the only such row among the four inspected). An ON CONFLICT (id) upsert
   with id='birth-registration-turkey' would not conflict and would create a
   SECOND row with the same slug (slug has no unique constraint). So the
   rebuild is a plain UPDATE ... WHERE slug = ..., not an upsert.
2. maternity-leave-turkey-analik-izni links family-birth-registration-flow;
   retiring it would leave that link a redirect hop. The href is rewritten
   with a short single-line replace() needle — no newlines, so the CRLF
   corruption class from the entry-ban file cannot occur.

── the archive mystery ───────────────────────────────────────────────────

Both earlier consolidation files archived their stubs inside a DO block with
an EXCEPTION handler (so a constraint could not roll back the whole file).
Checked live after the owner ran both: ALL FIVE stubs are still approved —
the handler fired both times, and the NOTICE text scrolled away unseen.

This file makes the failure readable instead of silent:
  * the archive DO captures SQLERRM into a session GUC
    (set_config('app.archive_err', ...)), and the review SELECT prints it —
    so whatever refuses status='archived' finally shows on screen;
  * two diagnostic SELECTs list the CHECK constraints and the triggers on
    `articles`, because those are the two suspects (a status CHECK, or a
    notification trigger choking on the transition);
  * the seven stubs (3 kizilay + 2 bank + 2 birth) are all retried in one
    place.
Whatever the outcome, the user-facing behaviour is already correct: every
retired slug has a 301 in next.config.ts.
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


def get(p):
    return json.load(urllib.request.urlopen(urllib.request.Request(_URL + '/rest/v1/' + p, headers=_H)))


def q(s):
    return str(s if s is not None else '').replace("'", "''")


def arr(items):
    return 'ARRAY[%s]::text[]' % ', '.join("'%s'" % q(x) for x in items)


def _no_bare_percent(t):
    for i, line in enumerate(t.splitlines(), 1):
        if '%' in re.sub(r'%[s%]', '', line):
            raise AssertionError('bare %% in SQL template, line %d: %s' % (i, line.strip()))
    return t


CANON = 'birth-registration-turkey'
DEAD = ['kimlik-newborn-addition', 'family-birth-registration-flow']
ALL_STUBS = ['red-crescent-card', 'kizilay-card-problems', 'kizilay-card-apply',
             'bank-account-documents', 'kimlik-bank-sim'] + DEAD

# ── preconditions ─────────────────────────────────────────────────────────
c = get('articles?select=id,slug,status,details&slug=eq.' + CANON)[0]
assert c['status'] == 'approved' and len(c['details'] or '') < 1000, 'canonical already rebuilt'
assert c['id'] != c['slug'], 'id==slug now?! — switch back to upsert if so'
for d in DEAD:
    r = get('articles?select=id,slug,status&slug=eq.' + d)
    assert r and r[0]['status'] == 'approved', d + ' not live'
mat = get('articles?select=details&slug=eq.maternity-leave-turkey-analik-izni')[0]
assert '/article/family-birth-registration-flow' in mat['details'], 'maternity link moved'
for s in ('children-passport-syria', 'kimlik-temporary-protection-syria-2026',
          'kimlik-data-update', 'family-reunion-visa-syria-2026'):
    r = get('articles?select=status&slug=eq.' + s)
    assert r and r[0]['status'] == 'approved', s + ' not live'

DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الخلاصة</strong></p>'
    '<p style="margin:0;">التبليغ عن المولود <strong>إلزامي خلال 30 يوماً</strong> إلى مديرية '
    'النفوس أو المشفى نفسه. اطلب من النفوس <strong>بيان الولادة متعدد اللغات '
    '(Formül A)</strong> — هو الوثيقة التي يُبنى عليها كل ما بعدها. والولادة في تركيا '
    '<strong>لا تمنح الجنسية التركية</strong>: الطفل يتبع وضع والديه.</p></div>'

    '<h2>واجب التبليغ — بنصّ القانون</h2>'
    '<p>قانون خدمات النفوس رقم 5490، المادة 15:</p>'
    '<table><thead><tr><th>الحالة</th><th>القاعدة</th></tr></thead><tbody>'
    '<tr><td>كل مولود حيّ داخل تركيا</td><td>تبليغ إلزامي خلال <strong>30 يوماً</strong> إلى '
    'مديرية النفوس (Nüfus Müdürlüğü) أو إلى المشفى الذي جرت فيه الولادة (م15/1)</td></tr>'
    '<tr><td>الولادة في مشفى</td><td>المشفى نفسه ملزم بتبليغ النفوس خلال <strong>5 أيام '
    'عمل</strong> (م15/2) — لكن لا تتّكل على ذلك: تحقّق بنفسك من أنّ القيد تمّ</td></tr>'
    '<tr><td>الولادة في البيت بلا كادر صحي</td><td>التبليغ إلى النفوس <strong>ببيان '
    'شفهي</strong> (م15/4) — فغياب تقرير المشفى لا يمنع القيد</td></tr>'
    '<tr><td>على من يقع الواجب؟</td><td>الولي أو الوصي أو القيّم؛ وعند غيابهم الجدّ أو الجدّة '
    'أو الإخوة البالغون أو من يكون الطفل عنده (م15/5)</td></tr>'
    '</tbody></table>'
    '<p>وإن فاتتك الثلاثون يوماً: <strong>سجّل فوراً ولا تؤجّل أكثر</strong> — التأخّر لا '
    'يمنع القيد، وكلّ ما بعده من معاملات الطفل متوقّف عليه.</p>'

    '<h2>الوثيقة التي تطلبها بالاسم: Formül A</h2>'
    '<p>بعد القيد اطلب من النفوس <strong>بيان الولادة متعدد اللغات</strong> '
    '(<span dir="ltr">Formül A</span>). هو المستند الذي تتعامل به القنصليات والجهات الخارجية، '
    'وطلبُه في اليوم نفسه يوفّر عليك مراجعةً كاملة لاحقاً.</p>'

    '<h2>هل يأخذ الطفل الجنسية التركية؟</h2>'
    '<p><strong>لا.</strong> تركيا لا تمنح الجنسية بحقّ الأرض؛ المولود يتبع جنسية والديه '
    'ووضعهما القانوني. وما يتغيّر بحسب وضع الوالدين هو الخطوة التالية:</p>'

    '<h3>والدان على الحماية المؤقتة (كملك)</h3>'
    '<p>يُضاف الطفل إلى قيد العائلة لدى <strong>مديرية الهجرة في ولايتكم</strong> ويصدر له '
    'رقم أجنبي يبدأ بـ99 وبطاقته. راجعوا المديرية بأسرع ما يمكن ومعكم إثبات الولادة وكملك '
    'الوالدين — فالصحة والتطعيم وكلّ معاملات الطفل معلّقة على رقمه. '
    '(<a href="/article/kimlik-temporary-protection-syria-2026">دليل الكملك والحماية '
    'المؤقتة</a>، و<a href="/article/kimlik-data-update">تحديث البيانات والعنوان</a>.)</p>'

    '<h3>والدان بإقامة (سياحية، عمل، عائلية…)</h3>'
    '<p>الطفل يحتاج ترتيب وضعه الإقامي هو أيضاً — لا يُغطّى تلقائياً بإقامة والديه إلى ما لا '
    'نهاية. راجع مديرية الهجرة في ولايتك مبكراً واسأل عن إقامة الطفل بحسب نوع إقامتكما، '
    'ولا تبنِ على مهلة سمعتها من غير المديرية.</p>'

    '<h3>ثم الشقّ السوري: التسجيل القنصلي والجواز — بترتيبه الصحيح</h3>'
    '<p>لمن أراد تثبيت الطفل في السجلّات السورية واستخراج جوازه: الترتيب الصحيح ستّ مراحل '
    'تبدأ من القيد التركي أعلاه ولا تنتهي بالجواز إلا بعد تثبيت الواقعة في سورية — الدليل '
    'الكامل: <a href="/article/children-passport-syria">جواز سفر سوري لطفل وُلد في تركيا: '
    'الترتيب الصحيح للخطوات</a>. وابدأ بتصديق شهادة الولادة قبل مراجعة البعثة.</p>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>المشفى لم يعطنا شيئاً — ماذا نفعل؟</h3>'
    '<p>تقرير الولادة حقّكم، اطلبوه. وسواء أعطاكم أم لا: قيد النفوس هو الأصل، وFormül A '
    'تصدر من النفوس لا من المشفى.</p>'
    '<h3>وُلد الطفل قبل أن نحدّث عنواننا — هل نسجّله على العنوان القديم؟</h3>'
    '<p>سجّلوا الولادة أولاً ولا تربطوها بمعاملة العنوان؛ ثم عالجوا العنوان في مساره '
    '(<a href="/article/kimlik-data-update">تحديث البيانات</a>). تعليق القيد على معاملة '
    'أخرى هو ما يوقعكم في التأخير.</p>'
    '<h3>الأب خارج تركيا — من يبلّغ؟</h3>'
    '<p>المادة 15/5 تحلّ هذا: الواجب على الولي الحاضر، وعند الغياب على الجدّ أو الجدّة أو '
    'الإخوة البالغين أو من يكون الطفل عنده. غياب أحد الوالدين لا يعطّل القيد.</p>'
)
STEPS = [
    'بلّغ عن الولادة خلال 30 يوماً: مديرية النفوس أو المشفى نفسه — وإن جرت الولادة في البيت '
    'فببيان شفهي للنفوس.',
    'تحقّق بنفسك من أنّ قيد النفوس تمّ ولا تتّكل على تبليغ المشفى وحده.',
    'اطلب بيان الولادة متعدد اللغات (Formül A) من النفوس في اليوم نفسه.',
    'إن كنتم على الكملك: راجعوا مديرية الهجرة لإضافة الطفل وإصدار رقمه (99…) بأسرع ما يمكن.',
    'وإن كنتم بإقامة: اسألوا المديرية عن ترتيب إقامة الطفل بحسب إقامتكما.',
    'للشقّ السوري (القيد والجواز): اتبعوا ترتيب المراحل الست في دليل جواز الطفل — التصديق '
    'قبل البعثة.',
    'احتفظوا بنسخ من كل وثيقة: تقرير المشفى، وFormül A، وما يصدر عن الهجرة.',
]
TIPS = [
    'الثلاثون يوماً واجب قانوني — وفواتها لا يمنع القيد: سجّل فوراً ولو تأخّرت.',
    'Formül A اطلبها بالاسم؛ هي ما تعتمده القنصليات، وطلبها لاحقاً مراجعة كاملة زائدة.',
    'الولادة في تركيا لا تمنح الجنسية التركية — الطفل يتبع والديه.',
    'صحة الطفل وتطعيماته معلّقة على رقمه — لا تؤجّلوا مراجعة الهجرة لحاملي الكملك.',
    'لا تربطوا قيد الولادة بمعاملة أخرى (عنوان، تجديد) — كلٌّ في مساره.',
    'غياب الأب لا يعطّل التبليغ: المادة 15/5 تسمّي من يقوم مقامه.',
]
DOCS = [
    'تقرير الولادة من المشفى (Doğum Raporu) — أو بيان شفهي للنفوس إن كانت الولادة في البيت',
    'هوية الوالدين: الكملك أو جواز السفر أو بطاقة الإقامة',
    'بعد القيد: بيان الولادة متعدد اللغات (Formül A) من النفوس',
    'لحاملي الكملك: كملك الوالدين لمراجعة مديرية الهجرة وإضافة الطفل',
]
FEES = ('قيد الولادة لدى النفوس مجاني. ولا رسم على التبليغ. وما يُدفع لاحقاً يخصّ معاملات '
        'أخرى (تصديق، قنصلية، جواز) في مساراتها — لا تدفعوا لوسيط مقابل «تسجيل المولود».')
WARN = ('التبليغ خلال 30 يوماً واجب المادة 15 من قانون 5490 — والتأخّر لا يمنع القيد فلا '
        'تؤجّلوا أكثر. والولادة في تركيا لا تمنح الجنسية. وترتيب الشقّ السوري له تسلسل صحيح '
        'يبدأ من القيد التركي — قفزُ مرحلةٍ يعيدكم إلى أولها.')
SOURCE = ('قانون خدمات النفوس رقم 5490 — المادة 15 (فقرات 1 و2 و4 و5: مهلة الثلاثين يوماً، '
          'وواجب المشفى خلال 5 أيام عمل، والبيان الشفهي لولادة البيت، ومن يقع عليه التبليغ)؛ '
          'وبيان الولادة متعدد اللغات Formül A وفق تعميم المديرية العامة للنفوس؛ وإضافة '
          'المولود لقيد الحماية المؤقتة لدى مديريات إدارة الهجرة (goc.gov.tr)')
TAGS = ['المواليد', 'تسجيل الولادة', 'الكملك والحماية المؤقتة', 'النفوس', 'دليل', '2026']
SEO_T = 'تسجيل المولود في تركيا: مهلة 30 يوماً وFormül A خطوة بخطوة'
SEO_D = ('التبليغ إلزامي خلال 30 يوماً (المادة 15 من قانون 5490)، والمشفى ملزم خلال 5 أيام '
         'عمل، وFormül A هي الوثيقة التي تطلبها بالاسم — ثم إضافة الطفل للكملك أو ترتيب '
         'إقامته، والترتيب الصحيح للشق السوري.')

LINK_FIX_OLD = '/article/family-birth-registration-flow'
LINK_FIX_NEW = '/article/birth-registration-turkey'

for label, body, needles in [
    ('canonical', DETAILS, ['30 يوماً', 'Formül A', '15/4', '15/5', 'children-passport-syria',
                            'لا تمنح الجنسية']),
]:
    for n in needles:
        assert n in body, 'PREDICATE WOULD LIE: %r not in %s' % (n, label)
assert LINK_FIX_OLD not in DETAILS, 'canonical must not link a retiring slug'

sql = _no_bare_percent("""-- ============================================================================
-- عنقود المواليد: ثلاثة أنقاض ← دليل واحد — ولغز الأرشفة يُكشف على الشاشة
-- ============================================================================
-- birth-registration-turkey (357 حرفاً، 37 قراءة) يُعاد بناؤه دليلاً كاملاً
-- على المادة 15 من قانون 5490 — المثبَّتة أصلاً في دليل جواز الطفل عندنا —
-- ويتقاعد النقضان kimlik-newborn-addition وfamily-birth-registration-flow
-- (التحويلات 301 في next.config.ts).
--
-- فخّان تفاداهما هذا الملف:
-- 1. id هذا الصفّ لا يساوي slug (فُحص حيّاً) — فالإدماج UPDATE لا INSERT،
--    وإلا أنشأ ON CONFLICT (id) صفّاً ثانياً بالـslug نفسه بصمت.
-- 2. صفحة إجازة الأمومة تربط النقض المتقاعد — رابطها يُعاد كتابته بإبرة
--    قصيرة بلا أسطر (فلا يطالها عطب CRLF).
--
-- ── ولغز الأرشفة ──────────────────────────────────────────────────────
-- ملفّا التوحيد السابقان أرشفا أنقاضهما في بلوك DO بمعالج استثناء. فُحص
-- حيّاً بعد تشغيلك لهما: الأنقاض الخمسة كلّها ما زالت approved — المعالج
-- التقط خطأً في المرّتين ونصُّه ضاع في رسائل المحرّر. هذا الملف يجعله
-- مقروءاً: الخطأ يُلتقط في متغيّر جلسة ويطبعه استعلام المراجعة الأخير،
-- ومعه استعلامان يعرضان قيود CHECK والمشغّلات (triggers) على جدول articles
-- — فهما المشتبهان. والأنقاض السبعة كلّها يُعاد محاولتها هنا دفعةً واحدة.
-- وسلوك الزائر صحيح في كل الأحوال: كل slug متقاعد له 301.
--
-- آمن لإعادة التشغيل.
-- ============================================================================

-- الدليل — UPDATE بالـslug (لا upsert: id هذا الصف يخالف slug)
UPDATE articles SET
    title = '%s', intro = '%s', details = '%s',
    steps = %s, tips = %s, documents = %s,
    fees = '%s', warning = '%s', source = '%s', tags = %s,
    category = 'خدمات السوريين', seo_title = '%s', seo_description = '%s',
    last_update = CURRENT_DATE
WHERE slug = '%s';

-- رابط صفحة إجازة الأمومة يتحوّل من النقض المتقاعد إلى الدليل
UPDATE articles SET
    details = replace(details, '%s', '%s'),
    last_update = CURRENT_DATE
WHERE slug = 'maternity-leave-turkey-analik-izni' AND details LIKE '%%%s%%';

-- محاولة الأرشفة السابعة — والخطأ إن وقع يُقرأ هذه المرّة
DO $archive$
BEGIN
    PERFORM set_config('app.archive_err', '', false);
    UPDATE articles SET status = 'archived', last_update = CURRENT_DATE
     WHERE slug IN (%s) AND status = 'approved';
EXCEPTION WHEN others THEN
    PERFORM set_config('app.archive_err', SQLERRM, false);
END
$archive$;

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved'
       AND details LIKE '%%Formül A%%' AND details LIKE '%%15/5%%';
    IF n <> 1 THEN RAISE EXCEPTION 'the birth guide did not land'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug = '%s';
    IF n <> 1 THEN RAISE EXCEPTION 'duplicate slug — the upsert trap happened anyway'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = 'maternity-leave-turkey-analik-izni' AND details LIKE '%%%s%%';
    IF n > 0 THEN RAISE EXCEPTION 'maternity still links the retired stub'; END IF;
END
$check$;

-- ── المراجعة: البنود + تشخيص الأرشفة ──────────────────────────────────────
SELECT 'birth guide rebuilt (law 5490 art 15 + Formül A)' AS البند,
       (details LIKE '%%Formül A%%' AND details LIKE '%%30 يوماً%%')::text AS النتيجة
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'maternity page now links the guide',
       (details LIKE '%%%s%%')::text
FROM articles WHERE slug = 'maternity-leave-turkey-analik-izni'
UNION ALL
SELECT 'stubs still approved (want 0)',
       count(*)::text
FROM articles WHERE slug IN (%s) AND status = 'approved'
UNION ALL
SELECT 'archive error text (empty = success)',
       COALESCE(NULLIF(current_setting('app.archive_err', true), ''), '(none)')
UNION ALL
SELECT 'CHECK constraints on articles',
       COALESCE(string_agg(conname || ': ' || pg_get_constraintdef(oid), ' | '), '(none)')
FROM pg_constraint WHERE conrelid = 'articles'::regclass AND contype = 'c'
UNION ALL
SELECT 'triggers on articles',
       COALESCE(string_agg(tgname, ', '), '(none)')
FROM pg_trigger WHERE tgrelid = 'articles'::regclass AND NOT tgisinternal;
""") % (q(TITLE_ := 'تسجيل المولود الجديد في تركيا 2026: مهلة الثلاثين يوماً، وFormül A، وخطوة كل جنسية ووضع'),
        q('وُلد طفلكم في تركيا؟ ثلاثة أشياء تحكم كل ما بعدها: التبليغ إلزامي خلال 30 يوماً '
          '(والمشفى ملزم بدوره خلال 5 أيام عمل — لكن تحقّقوا بأنفسكم)، وبيان الولادة متعدد '
          'اللغات Formül A هو الوثيقة التي تُبنى عليها القنصلية والجواز، والولادة هنا لا تمنح '
          'الجنسية التركية. ثم يفترق الطريق بحسب وضعكم: إضافة الطفل للكملك، أو ترتيب إقامته، '
          'ثم الشقّ السوري بترتيبه الصحيح.'),
        q(DETAILS), arr(STEPS), arr(TIPS), arr(DOCS), q(FEES), q(WARN), q(SOURCE), arr(TAGS),
        q(SEO_T), q(SEO_D), CANON,
        LINK_FIX_OLD, LINK_FIX_NEW, LINK_FIX_OLD,
        ', '.join("'%s'" % s for s in ALL_STUBS),
        CANON, CANON, LINK_FIX_OLD,
        CANON, LINK_FIX_NEW,
        ', '.join("'%s'" % s for s in ALL_STUBS))

path = os.path.join(REPO, 'sql', '2026-08-07_birth_cluster.sql')
open(path, 'w', encoding='utf-8', newline='').write(sql)

_code = '\n'.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('الدليل        : %s — %d ← %d حرفاً (UPDATE لا upsert: id≠slug)' % (CANON, len(c['details'] or ''), len(DETAILS)))
print('يتقاعد        : %s (301 جاهزة)' % ', '.join(DEAD))
print('رابط الأمومة  : يُعاد توجيهه إلى الدليل بإبرة سطر واحد')
print('الأرشفة       : محاولة سابعة + نص الخطأ يُطبع + قيود CHECK والمشغّلات تُعرض')
print('quote parity  :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written       :', path, len(sql), 'chars')
