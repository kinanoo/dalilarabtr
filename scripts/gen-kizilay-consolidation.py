# -*- coding: utf-8 -*-
"""One topic, four pages: consolidating the Kızılay/SUY cluster.

── the finding behind this ───────────────────────────────────────────────

92 of the site's 238 approved articles are under 800 characters; 62 are under
300. That thin mass competes for the same queries as guides of 30,000
characters that are genuinely good. The Kızılay card is the clearest case and
the one with the most traffic:

    kizilay-card-application   2,406 chars   181 views   ← the real guide
    red-crescent-card            722 chars    51 views   ← already just a pointer
    kizilay-card-problems        516 chars    10 views   ← unique content, no source
    kizilay-card-apply           491 chars     4 views   ← already just a pointer

246 views spread across four URLs for one topic. Two of them had already been
reduced to «للتفاصيل الكاملة: <link>» pointers in an earlier pass but left
live, so they kept being indexed and kept costing a reader a second click.

── a pair that looked identical and is not ───────────────────────────────

The same scan flagged identity-kimlik-iptal-v160 → frozen-id-problem. Not
merged: İptal (cancellation of the record) and V-160 (address freeze) are
different things, and the İptal page exists partly to correct that exact
confusion — it says so in its own text and points readers to the freeze page.
Redirecting it would commit the error it was written to fix.

── what is added to the canonical, and what is refused ───────────────────

Verified against platform.kizilaykart.org (the programme's own site):

  * Eligible statuses are broader than our guide implied. It leads on the
    99-prefixed foreigner number, i.e. temporary protection. The programme
    states «Geçici Koruma, Uluslararası Koruma, Uluslararası Koruma Başvuru
    Statüsü veya İnsani İkamet İzni» — international protection, an
    international-protection *application*, and humanitarian residence all
    qualify. Someone on humanitarian residence reading our page would have
    concluded they were excluded.
  * The programme is still running: ₺504.1 million disbursed in June 2026.
  * It is run by the Ministry of Family and Social Services with Türk Kızılay,
    funded by the EU under FRIT.
  * Money is drawn at ATMs and/or spent at POS terminals.
  * 168 is the Türk Kızılay call centre; it has served the SUY programme since
    November 2016 and is how you find your nearest application point.

Refused, from the unsourced problems stub:

  * «العمل الرسمي (SGK) يوقف البطاقة تلقائياً» — no official statement found.
    Rewritten as what is defensible: eligibility rests on the vulnerability
    criteria and is re-assessed, so a change in circumstances can affect it —
    ask rather than assume.
  * «يمكنك التقديم مرة أخرى بعد 6 أشهر» — no source. Dropped entirely.
  * «الخط الساخن 168 يعمل باللغة العربية» — 168 is verified; Arabic support on
    it is not. The claim is dropped, the number kept.

Kept from that stub because it costs nothing and protects the reader: never
sell or lend the card, and go to the service centre or 168 when it is lost.

── the archive step is isolated on purpose ───────────────────────────────

Retiring the three stubs sets status to 'archived' so they leave
sitemap-articles.xml, which filters on status='approved'. Every article row
currently reads 'approved' and no CHECK constraint on articles.status was
found in the repo — but "not found" is not "not there", and Supabase runs a
file as one transaction, so a constraint violation would roll back the merge
too. The UPDATE therefore sits in its own DO block with an EXCEPTION handler:
if the column refuses the value, the archive is skipped with a NOTICE and
everything else still commits. The 301s in next.config.ts do the user-facing
work either way.
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


CANON = 'kizilay-card-application'
DEAD = ['red-crescent-card', 'kizilay-card-problems', 'kizilay-card-apply']

canon = get('articles?select=slug,status,details,views&slug=eq.' + CANON)
assert canon and canon[0]['status'] == 'approved', 'the canonical must be live'
assert 'الاستحقاق أوسع' not in (canon[0]['details'] or ''), 'already consolidated'
for d in DEAD:
    r = get('articles?select=slug,status&slug=eq.' + d)
    assert r and r[0]['status'] == 'approved', '%s is not live — check before retiring' % d

ADD = (
    '<h2>مَن يستحقّ — تصحيحٌ مهمّ: الاستحقاق أوسع ممّا يظنّ كثيرون</h2>'
    '<p>يُقرأ هذا البرنامج غالباً على أنّه لحاملي <strong>الحماية المؤقتة</strong> وحدهم. '
    'ونصّ البرنامج أوسع: فهو لمن يحمل <strong>الحماية المؤقتة</strong>، أو '
    '<strong>الحماية الدولية</strong>، أو <strong>صفة طالب الحماية الدولية</strong> '
    '(أي أنّ طلبك ما زال قيد النظر)، أو <strong>إذن الإقامة الإنسانية</strong> '
    '(<span dir="ltr">İnsani İkamet</span>).</p>'
    '<p>فإن كنت على إقامة إنسانية أو حمايةٍ دولية وظننت أنّ الباب مغلق أمامك — راجع. '
    'ويبقى شرط أن ينطبق عليك أحد معايير الضعف المذكورة أعلاه؛ الصفة تفتح الباب، والمعيار '
    'هو ما يقرّر.</p>'

    '<h2>هل البرنامج ما زال قائماً؟ نعم</h2>'
    '<p>تسأل الناس كثيراً إن كان البرنامج قد أُوقف. الأرقام المنشورة على منصّة البرنامج '
    'نفسها تُظهر صرف <strong>504.1 مليون ليرة</strong> على المستفيدين في '
    '<strong>حزيران/يونيو 2026</strong>. فالبرنامج عامل، ومَن سمع خلاف ذلك فقد سمع شائعة.</p>'
    '<p>ويُنفَّذ بالتعاون بين <strong>وزارة الأسرة والخدمات الاجتماعية</strong> و'
    '<strong>الهلال الأحمر التركي</strong>، بتمويل من الاتحاد الأوروبي ضمن إطار '
    '<span dir="ltr">FRIT</span>. وهذا يعني أنّ قنواته رسمية بالكامل — ولا وسيط فيها.</p>'

    '<h2>كيف تصلك النقود</h2>'
    '<p>الصرف على بطاقة <span dir="ltr">Kızılaykart</span>: تسحب المبلغ من '
    '<strong>الصرّاف الآلي</strong>، أو تشتري به مباشرةً عبر <strong>أجهزة نقاط البيع</strong> '
    'في المتاجر. ولا يُصرف نقداً باليد من أي مكتب — فمن عرض عليك ذلك فليس من البرنامج.</p>'

    '<h2>الخطّ 168 — واستعماله الصحيح</h2>'
    '<p><strong>168</strong> هو مركز اتصال الهلال الأحمر التركي، ويخدم برنامج المساعدة '
    'النقدية منذ انطلاقه في تشرين الثاني/نوفمبر 2016. استعمله لتعرف '
    '<strong>أقرب نقطة تقديم إليك</strong>، ولتبلّغ عن مشكلة في بطاقتك.</p>'

    '<h2>حين تتعثّر البطاقة</h2>'
    '<table><thead><tr><th>الحالة</th><th>ما تفعله</th></tr></thead><tbody>'
    '<tr><td><strong>لم تُشحن هذا الشهر</strong></td>'
    '<td>راجع مركز خدمات الهلال الأحمر أو اتصل بـ168 واسأل عن <em>سبب</em> التوقّف في ملفّك '
    'بعينه — ولا تبنِ على سببٍ سمعته من غيرك، فالأسباب تختلف بين ملفّ وآخر</td></tr>'
    '<tr><td><strong>أُوقفت المساعدة</strong></td>'
    '<td>الاستحقاق قائم على معايير الضعف ويُعاد تقييمه؛ فتغيّر ظرفك قد يغيّر وضعك في '
    'البرنامج. اسأل عن السبب المسجَّل ولا تفترضه</td></tr>'
    '<tr><td><strong>فُقدت أو سُرقت</strong></td>'
    '<td>اتصل بـ168 فوراً لإيقافها، ثمّ راجع مركز الخدمات لاستبدالها ومعك الكملك</td></tr>'
    '<tr><td><strong>لم يُقبل طلبك</strong></td>'
    '<td>اسأل عن سبب الرفض، وراجع معايير الضعف أعلاه؛ وإن تغيّر ظرفك لاحقاً فراجع من جديد</td></tr>'
    '</tbody></table>'

    '<div style="background:#fee2e2;border-right:4px solid #dc2626;padding:14px 18px;margin:18px 0;">'
    '<p style="margin:0 0 8px;"><strong>لا تبِع بطاقتك ولا تُعرها لأحد</strong></p>'
    '<p style="margin:0;">البطاقة باسمك ومربوطة بملفّك، وإعطاؤها لغيرك يعرّض استحقاقك '
    'للإلغاء. والتقديم <strong>مجاني</strong> في كلّ قنواته — فمن طلب منك مالاً مقابل '
    '«تسجيلك» أو «تسريع» ملفّك فهو وسيط لا صفة له.</p></div>'
)

NEW_SRC = ('برنامج المساعدة النقدية للتماسك الاجتماعي (Sosyal Uyum Yardımı — SUY) عبر '
           'Kızılaykart، تنفيذ وزارة الأسرة والخدمات الاجتماعية والهلال الأحمر التركي '
           '(Türk Kızılay) بتمويل الاتحاد الأوروبي ضمن إطار FRIT — منصّة البرنامج الرسمية '
           'platform.kizilaykart.org (بيانات الصرف حتى حزيران/يونيو 2026)، ومركز اتصال '
           'الهلال الأحمر 168')

for n in ['الاستحقاق أوسع', 'İnsani İkamet', '504.1', '168', 'FRIT']:
    assert n in ADD, 'PREDICATE WOULD LIE: %r not in the added block' % n
for bad in ['بعد 6 أشهر', 'باللغة العربية', 'تُوقف تلقائياً']:
    assert bad not in ADD, 'an unverified claim leaked in: %r' % bad


def _no_bare_percent(t):
    """%-formatting reads a lone % as a conversion. In PL/pgSQL, RAISE uses %
    as its own placeholder, so it must be written %% here. Catch it before
    Python does, with a message that says which line."""
    for i, line in enumerate(t.splitlines(), 1):
        stripped = re.sub(r'%[s%]', '', line)
        if '%' in stripped:
            raise AssertionError('bare %% in SQL template, line %d: %s' % (i, line.strip()))
    return t


sql = _no_bare_percent("""-- ============================================================================
-- موضوع واحد وأربع صفحات: توحيد عنقود الهلال الأحمر (SUY)
-- ============================================================================
-- 92 من مقالات الموقع الـ238 المعتمَدة تحت 800 حرف، و62 تحت 300. وهذه الكتلة
-- الهزيلة تزاحم على الاستعلامات نفسها أدلّةً بثلاثين ألف حرف جيّدةً فعلاً.
-- وعنقود الهلال الأحمر أوضح الحالات وأكثرها قراءةً:
--
--     kizilay-card-application   2,406 حرفاً   181 قراءة   ← الدليل الحقيقي
--     red-crescent-card            722 حرفاً    51 قراءة   ← صار مؤشِّراً فقط
--     kizilay-card-problems        516 حرفاً    10 قراءات  ← محتوى فريد بلا مصدر
--     kizilay-card-apply           491 حرفاً     4 قراءات  ← صار مؤشِّراً فقط
--
-- 246 قراءة موزَّعة على أربعة روابط لموضوع واحد. واثنتان منها رُدَّتا في جولة
-- سابقة إلى مؤشِّرَين «للتفاصيل الكاملة: <رابط>» لكنّهما تُركتا حيّتين، فبقيتا
-- تُفهرَسان وتُكلّفان القارئ نقرةً ثانية.
--
-- ── زوجٌ بدا متطابقاً وليس كذلك ─────────────────────────────────────────
--
-- كشف الفحص نفسه identity-kimlik-iptal-v160 ← frozen-id-problem. ولم يُدمج:
-- الإبطال (İptal) وتجميد العنوان (V-160) شيئان مختلفان، وصفحة الإبطال موجودة
-- جزئياً لتصحيح هذا الالتباس بعينه — تقوله في متنها وتحيل القارئ إلى صفحة
-- التجميد. فتوجيهها إليها يرتكب الخطأ الذي كُتبت لتصحيحه.
--
-- ── ما أُضيف إلى الدليل، وما رُفض ──────────────────────────────────────
--
-- متحقَّق من منصّة البرنامج الرسمية platform.kizilaykart.org:
--
--   * الاستحقاق أوسع ممّا أوحى دليلنا. كان يتصدّره الرقم الأجنبي 99، أي
--     الحماية المؤقتة. ونصّ البرنامج: «Geçici Koruma, Uluslararası Koruma,
--     Uluslararası Koruma Başvuru Statüsü veya İnsani İkamet İzni» — فالحماية
--     الدولية، وطلبها قيد النظر، والإقامة الإنسانية كلّها مؤهَّلة. ومن كان على
--     إقامة إنسانية وقرأ صفحتنا لاستنتج أنّه مستثنى.
--   * البرنامج ما زال عاملاً: 504.1 مليون ليرة صُرفت في حزيران/يونيو 2026.
--   * تنفيذ وزارة الأسرة والخدمات الاجتماعية مع الهلال الأحمر التركي، بتمويل
--     الاتحاد الأوروبي ضمن إطار FRIT.
--   * الصرف سحباً من الصرّاف أو شراءً عبر نقاط البيع.
--   * 168 مركز اتصال الهلال الأحمر، يخدم البرنامج منذ تشرين الثاني 2016، ومنه
--     تعرف أقرب نقطة تقديم.
--
-- ومرفوضٌ من صفحة المشاكل غير المُسنَدة:
--
--   * «العمل الرسمي (SGK) يوقف البطاقة تلقائياً» — لم أجد له نصّاً رسمياً.
--     أُعيدت صياغته إلى ما يُدافَع عنه: الاستحقاق قائم على معايير الضعف
--     ويُعاد تقييمه، فتغيّر الظرف قد يغيّر الوضع — اسأل ولا تفترض.
--   * «يمكنك التقديم مرة أخرى بعد 6 أشهر» — بلا مصدر. حُذف كلّياً.
--   * «الخط 168 يعمل باللغة العربية» — الرقم متحقَّق منه، ودعم العربية عليه لا.
--     حُذف الادّعاء وبقي الرقم.
--
-- وأُبقي منها ما لا يكلّف شيئاً ويحمي القارئ: لا تبِع البطاقة ولا تُعرها،
-- وراجع المركز أو 168 عند الفقد.
--
-- ── وخطوة الأرشفة معزولة عمداً ─────────────────────────────────────────
--
-- إحالة الثلاث إلى التقاعد تضع status = 'archived' فتخرج من
-- sitemap-articles.xml الذي يرشّح على status='approved'. وكلّ صفوف المقالات
-- اليوم 'approved'، ولم أجد في المستودع قيد CHECK على articles.status — لكنّ
-- «لم أجد» ليست «غير موجود»، وSupabase يشغّل الملف معاملةً واحدة، فمخالفة قيدٍ
-- تُلغي الدمج معها. لذلك وُضع الـUPDATE في بلوك DO له معالج EXCEPTION: إن رفض
-- العمود القيمة تُتخطّى الأرشفة بإشعار ويُثبَّت الباقي. والتحويلات 301 في
-- next.config.ts تؤدّي العمل الظاهر للقارئ في الحالتين.
--
-- آمن لإعادة التشغيل.
-- ============================================================================

UPDATE articles SET
    details = details || '%s',
    source  = '%s',
    last_update = CURRENT_DATE
WHERE slug = '%s' AND details NOT LIKE '%%الاستحقاق أوسع%%';

DO $archive$
BEGIN
    UPDATE articles SET status = 'archived', last_update = CURRENT_DATE
     WHERE slug IN (%s) AND status = 'approved';
    RAISE NOTICE 'archived %% stub(s)', (SELECT count(*) FROM articles WHERE slug IN (%s) AND status = 'archived');
EXCEPTION WHEN others THEN
    RAISE NOTICE 'archive skipped (%%) — the 301 redirects still apply', SQLERRM;
END
$archive$;

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND details LIKE '%%İnsani İkamet%%' AND details LIKE '%%504.1%%';
    IF n <> 1 THEN RAISE EXCEPTION 'the canonical did not take the merge'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug = '%s' AND details LIKE '%%بعد 6 أشهر%%';
    IF n > 0 THEN RAISE EXCEPTION 'an unsourced claim reached the canonical'; END IF;
END
$check$;

SELECT 'canonical: wider eligibility + programme still running' AS البند,
       (details LIKE '%%الاستحقاق أوسع%%' AND details LIKE '%%504.1%%') AS سليم
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'canonical: card-trouble table added', (details LIKE '%%فُقدت أو سُرقت%%')
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'canonical: source cites the programme platform', (source LIKE '%%kizilaykart%%')
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'stubs retired (0 = the DO block skipped it; 301s still apply)',
       (count(*) = 0)::boolean FROM articles WHERE slug IN (%s) AND status = 'approved';
""") % (q(ADD), q(NEW_SRC), CANON,
       ', '.join("'%s'" % d for d in DEAD), ', '.join("'%s'" % d for d in DEAD),
       CANON, CANON, CANON, CANON, CANON, ', '.join("'%s'" % d for d in DEAD))

path = os.path.join(REPO, 'sql', '2026-08-07_kizilay_consolidation.sql')
open(path, 'w', encoding='utf-8').write(sql)

_code = '\n'.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('الدليل المرجعي : %s — %d ← %d حرفاً (%d قراءة)'
      % (CANON, len(canon[0]['details'] or ''), len(canon[0]['details'] or '') + len(ADD), canon[0]['views'] or 0))
print('تُقاعَد        : %s' % ', '.join(DEAD))
print('أُضيف متحقَّقاً : الاستحقاق الأوسع (حماية دولية + إقامة إنسانية)، والبرنامج عامل')
print('               (504.1 مليون في حزيران 2026)، والجهة المنفِّذة، وطريقة الصرف، و168')
print('رُفض           : إيقاف SGK التلقائي، ومهلة 6 أشهر، ودعم 168 بالعربية — بلا سند')
print('لم يُدمج       : identity-kimlik-iptal-v160 — الإبطال ≠ تجميد العنوان')
print('quote parity   :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written        :', path, len(sql), 'chars')
