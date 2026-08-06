# -*- coding: utf-8 -*-
"""Marriage cluster: two stubs fold into the existing canonical; one becomes real.

── the shape of this cluster is different ────────────────────────────────

civil-marriage-registration-turkey (2,586 chars) already exists and is GOOD —
built 2026-08-06 on Evlendirme Yönetmeliği arts 12/13 with the quoted Turkish
text, the e-Devlet route, the post-marriage notification duty and the
TP-cancellation risk for skipping it. So unlike the bank/birth clusters there
is no rebuild — there is:

  1. ONE enrichment: the sheikh-marriage warning lives only in the 113-char
     stub being retired, and it is the single most important warning for this
     audience. Migrated into the canonical as a proper section, stated
     precisely: a religious-only marriage has NO legal effect (no spousal
     inheritance, no alimony, complications registering children), civil
     comes first — the Civil Code (TMK art. 143) allows the religious
     ceremony only upon presentation of the family booklet — and the old
     criminal penalty for a religious-first ceremony was annulled by the
     Constitutional Court in 2015, so the page says "no legal effect", not
     "crime". No scare-mongering, no laundered penalty claims.
  2. TWO retirements: marriage-registration (113 chars) and
     family-civil-marriage-municipality (255 chars) → 301 → canonical,
     status='draft' — the value the live CHECK constraint actually allows
     (articles_status_check; discovered 2026-08-07, see the retire file).
  3. ONE real rebuild: family-register-foreign-marriage (188 chars) is a
     DISTINCT topic — recognising a marriage concluded abroad — and merging
     it would blur two different questions (the İptal/V-160 lesson). Rebuilt
     at ~3K chars around the legalisation mechanism, including the fact that
     decides most Syrian cases: Syria is not a party to the Apostille
     Convention, so Syrian documents take the consular legalisation chain,
     never an Apostille. The divorce case is routed to the existing
     tanıma-tenfiz page instead of being half-covered here.

Verified before writing: all four rows have id == slug (the birth-cluster
row did not — checked every time now), and no article or consultant scenario
links any of the three stubs, so no link rewrites are needed.
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


CANON = 'civil-marriage-registration-turkey'
FOREIGN = 'family-register-foreign-marriage'
DEAD = ['marriage-registration', 'family-civil-marriage-municipality']

# ── preconditions ─────────────────────────────────────────────────────────
c = get('articles?select=id,slug,status,details&slug=eq.' + CANON)[0]
assert c['status'] == 'approved' and c['id'] == c['slug']
assert 'زواج الشيخ' not in c['details'], 'canonical already enriched'
f = get('articles?select=id,slug,status,details&slug=eq.' + FOREIGN)[0]
assert f['status'] == 'approved' and f['id'] == f['slug']
assert len(f['details'] or '') < 1000, 'foreign-marriage page already rebuilt'
for d in DEAD:
    r = get('articles?select=id,slug,status&slug=eq.' + d)
    assert r and r[0]['status'] == 'approved' and r[0]['id'] == r[0]['slug'], d
for s in ('yabanci-bosanma-tanima-tenfiz-turkiye-2026', 'turkish-citizenship-marriage-syrians-gaziantep',
          'family-reunion-visa-syria-2026', 'birth-registration-turkey',
          'kimlik-temporary-protection-syria-2026'):
    r = get('articles?select=status&slug=eq.' + s)
    assert r and r[0]['status'] == 'approved', s + ' not live'

# ── 1. the canonical's missing section (guarded append) ──────────────────
SHEIKH_ADD = (
    '<h2>زواج الشيخ وحده لا يحميك — والمدني أولاً بنصّ القانون</h2>'
    '<p>الزواج الديني وحده (زواج الشيخ) <strong>لا أثر قانونياً له في تركيا</strong>: لا '
    'يرتّب إرثاً بين الزوجين، ولا نفقة، ويُعقّد تسجيل الأطفال ونسبهم في السجلّات — وكلّ '
    'حقوقك في الإقامة ولمّ الشمل والجنسية تُبنى على الزواج المسجَّل لا عليه.</p>'
    '<p>والترتيب الذي يرسمه القانون المدني التركي (المادة 143): العقد المدني أولاً، '
    'ثمّ المراسم الدينية لمن شاء — فالنصّ لا يجيز إجراء المراسم الدينية إلا بإبراز دفتر '
    'العائلة. ومن أجرى الديني أولاً فلا عقوبة جزائية على ذلك اليوم (المحكمة الدستورية '
    'ألغت التجريم سنة 2015) — لكن انعدام الأثر القانوني باقٍ كما هو: زواجك غير موجود في '
    'نظر الدولة حتى تعقده مدنياً.</p>'
    '<p>فإن كان زواجك الحالي شيخاً فقط: اعقداه في البلدية بالمسار أعلاه — فهذا يُنشئ '
    'الحقوق من تاريخ العقد المدني. وبعده تنفتح الأبواب المبنية عليه: '
    '<a href="/article/turkish-citizenship-marriage-syrians-gaziantep">الجنسية عبر '
    'الزواج</a>، و<a href="/article/family-reunion-visa-syria-2026">لمّ شمل العائلة</a>، '
    'وتسجيل المواليد في <a href="/article/birth-registration-turkey">دليل تسجيل '
    'المولود</a>.</p>'
    '<p style="margin-top:1rem;">وإن كان زواجك معقوداً <strong>خارج تركيا</strong> وتحتاج '
    'اعتماده هنا: <a href="/article/family-register-foreign-marriage">تثبيت الزواج الخارجي '
    'في تركيا</a>.</p>'
)

# ── 3. the foreign-marriage rebuild ──────────────────────────────────────
FT_TITLE = 'تثبيت الزواج المعقود خارج تركيا 2026: سلسلة التصديق الصحيحة، ولماذا لا «أبوستيل» للوثائق السورية'
FT_INTRO = ('تزوّجتما خارج تركيا وتحتاجان اعتماد الزواج هنا — لملفّ إقامة عائلية، أو لمّ شمل، '
            'أو تسجيل مولود، أو تحديث قيد الهجرة؟ المطلوب ليس «إعادة زواج» بل اعتماد وثيقتكما: '
            'تصديقٌ بحسب بلد الصدور — أبوستيل لدول الاتفاقية، وسلسلة التصديق القنصلية لغيرها '
            'وسوريا منها — ثم ترجمة محلَّفة، ثم تقديمها للجهة التي يحتاجها ملفّك. وهذا الدليل '
            'يرتّب الطريق ويحذّرك من خطأين يكلّفان شهوراً.')
FT_DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الخلاصة</strong></p>'
    '<p style="margin:0;">زواجٌ معقود بالأصول في بلده لا يُعاد عقده في تركيا — يُعتمَد '
    'بوثيقته: <strong>تصديق ← ترجمة محلَّفة ← الجهة صاحبة الملفّ</strong>. والسؤال الأول '
    'دائماً: هل بلد الصدور طرف في اتفاقية أبوستيل أم لا؟ — <strong>سوريا ليست طرفاً</strong>، '
    'فوثائقها تسلك سلسلة التصديق لا الأبوستيل.</p></div>'

    '<h2>متى تحتاج التثبيت أصلاً؟</h2>'
    '<ul>'
    '<li><strong>ملفّ إقامة عائلية أو لمّ شمل</strong> — الوثيقة المعتمدة شرط الملفّ '
    '(<a href="/article/family-reunion-visa-syria-2026">لمّ شمل العائلة من سوريا</a>).</li>'
    '<li><strong>تسجيل مولود</strong> وُلد في تركيا ونسبته إلى الزوجين '
    '(<a href="/article/birth-registration-turkey">تسجيل المولود</a>).</li>'
    '<li><strong>تحديث قيد الهجرة</strong>: حالتك الاجتماعية في ملفّ الحماية المؤقتة أو '
    'الإقامة يجب أن تطابق الواقع.</li>'
    '<li><strong>معاملات لاحقة</strong> تُبنى على الزواج: الجنسية عبر الزواج، والإرث، '
    'والتأمين الصحي للزوج.</li>'
    '</ul>'

    '<h2>الطريق بحسب بلد صدور الوثيقة</h2>'
    '<h3>بلد طرف في اتفاقية أبوستيل</h3>'
    '<p>ختم <strong>أبوستيل</strong> من السلطة المختصّة في بلد الصدور يكفي تصديقاً، ثم '
    'ترجمة محلَّفة في تركيا. لا حاجة لقنصليات.</p>'
    '<h3>بلد ليس طرفاً — وسوريا منها</h3>'
    '<p>لا يوجد «أبوستيل سوري»: من يعرض عليك ختم أبوستيل لوثيقة سورية يعرض شيئاً لا وجود '
    'له. الطريق هو <strong>سلسلة التصديق</strong>: توثيق الوثيقة في بلد الصدور حتى خارجيته، '
    'ثم تصديق الممثّلية التركية المعتمدة لذلك البلد (أو المسار المعتمد المعلن حينها)، ثم '
    'الترجمة المحلَّفة في تركيا. ورتّب الأختام بترتيبها — ختمٌ ناقص في أول السلسلة يُسقط '
    'ما بعده كلّه.</p>'

    '<h2>ثم ماذا بعد التصديق والترجمة؟</h2>'
    '<p>قدّم الوثيقة المعتمدة إلى <strong>الجهة صاحبة ملفّك أنت</strong>: مديرية الهجرة '
    'لملفّات الإقامة ولتحديث الحالة الاجتماعية في قيد الحماية المؤقتة، أو الجهة التي طلبت '
    'إثبات الزواج في معاملتك. وإن كان أحد الزوجين مواطناً تركياً فتسجيل الواقعة في قيد '
    'النفوس يجري عبر مساره الرسمي (القنصلية التركية في الخارج أو النفوس داخلها) — اسأل '
    'الجهة نفسها عن قائمة أوراقها ولا تعتمد قائمة منقولة.</p>'

    '<h2>خطآن يكلّفان شهوراً</h2>'
    '<ol>'
    '<li><strong>البدء بالترجمة قبل التصديق.</strong> الترجمة المحلَّفة تُجرى على الوثيقة '
    'المصدَّقة — ترجمةُ وثيقةٍ بلا أختامها تعني ترجمةً ثانية لاحقاً.</li>'
    '<li><strong>خلط الزواج بالطلاق.</strong> اعتماد زواج أجنبي معاملةُ توثيق إدارية؛ أمّا '
    'اعتماد <strong>طلاق</strong> أجنبي في تركيا فدعوى قضائية (تانيما/تنفيذ) لها شروطها — '
    'تفصيلها في <a href="/article/yabanci-bosanma-tanima-tenfiz-turkiye-2026">تثبيت الطلاق '
    'الأجنبي (Tanıma-Tenfiz)</a>. من عومل طلاقه معاملة الزواج ضاع ملفّه بين الجهتين.</li>'
    '</ol>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>تزوّجنا في سوريا بعقد شرعي غير مسجَّل في المحكمة — هل يكفي؟</h3>'
    '<p>الاعتماد يُبنى على وثيقة رسمية من بلد العقد. عقدٌ غير مثبَّت في سجلّات بلده يحتاج '
    'تثبيته هناك أولاً (تثبيت الزواج في المحكمة/السجل المدني السوري) قبل أن تبدأ سلسلة '
    'التصديق. السلسلة تنقل وثيقةً موجودة — لا تُنشئ زواجاً.</p>'
    '<h3>هل نستطيع بدل ذلك عقد زواج جديد في البلدية التركية؟</h3>'
    '<p>الزواج القائم المعتمد لا يُعاد عقده. وإن كان وضعكما لا وثيقة له إطلاقاً فراجعا '
    '<a href="/article/civil-marriage-registration-turkey">دليل الزواج المدني في تركيا</a> '
    'واسألا دائرة الزواج عن حالتكما بعينها.</p>'
    '<h3>كم يستغرق؟</h3>'
    '<p>لا مدّة موحّدة ننشرها — تتوقّف على بلد الصدور وسلسلته. الذي بيدك تقصيره: ابدأ '
    'بالتصديق قبل الترجمة، وسلّم الجهةَ ملفّاً كاملاً من أول مرّة.</p>'
)
FT_STEPS = [
    'حدّد الجهة التي تحتاج الوثيقة (هجرة، لمّ شمل، نفوس…) واسألها عن قائمتها — فهي مرجعك لا القوائم المنقولة.',
    'تأكّد أنّ الزواج مثبَّت رسمياً في سجلّات بلد العقد؛ وإلا فثبّته هناك أولاً.',
    'صدّق الوثيقة: أبوستيل إن كان بلد الصدور طرفاً في الاتفاقية — وسلسلة التصديق القنصلية لغيره (وسوريا منه).',
    'ترجم الوثيقة المصدَّقة ترجمةً محلَّفة في تركيا — بعد التصديق لا قبله.',
    'قدّم الوثيقة للجهة صاحبة الملفّ، وحدّث حالتك الاجتماعية في قيد الهجرة.',
    'احتفظ بنسخ عن كل مرحلة من السلسلة — الأختام تُسأل عنها لاحقاً.',
]
FT_TIPS = [
    'لا «أبوستيل» لوثيقة سورية — سوريا ليست طرفاً في الاتفاقية؛ الطريق سلسلة التصديق.',
    'الترتيب: تصديق ثم ترجمة — عكسُه يعني ترجمةً ثانية.',
    'الطلاق الأجنبي دعوى قضائية (تانيما/تنفيذ) لا معاملة توثيق — لا تخلط المسارين.',
    'السلسلة تنقل وثيقة موجودة ولا تُنشئ زواجاً — العقد غير المثبَّت يُثبَّت في بلده أولاً.',
    'اسأل الجهة صاحبة ملفّك عن قائمتها قبل أن تجمع شيئاً.',
]
FT_DOCS = [
    'وثيقة الزواج الرسمية من بلد العقد (مستخرَج حديث إن أمكن)',
    'التصديقات بحسب البلد: أبوستيل أو سلسلة التصديق كاملة الأختام',
    'الترجمة المحلَّفة في تركيا — على الوثيقة المصدَّقة',
    'هويتا الزوجين (جواز/كملك/إقامة) لما تطلبه الجهة المستقبِلة',
]
FT_FEES = ('رسوم التصديق تختلف ببلد الصدور ومراحله، والترجمة المحلَّفة بتعرفة المترجمين — '
           'لا رقم موحّداً ننشره. ولا تدفع لوسيط «يختصر السلسلة»: المراحل رسمية ولا تُختصر.')
FT_WARN = ('لا أبوستيل للوثائق السورية — من يعرضه يعرض ما لا وجود له. والترجمة قبل التصديق '
           'تُعاد. والطلاق الأجنبي لا يُعتمد بهذا المسار الإداري بل بدعوى تانيما/تنفيذ. '
           'والقائمة النهائية دائماً عند الجهة صاحبة ملفّك.')
FT_SOURCE = ('اتفاقية لاهاي لإلغاء التصديق (Apostille) — سوريا ليست دولةً طرفاً فيها '
             '(قائمة الأعضاء الرسمية، hcch.net)؛ ومسار التصديق القنصلي للوثائق الأجنبية '
             'المعمول به لدى الممثّليات التركية؛ ودعوى الاعتراف والتنفيذ للأحكام الأجنبية '
             '(قانون الدولي الخاص رقم 5718) لحالة الطلاق')
FT_TAGS = ['الزواج', 'تصديق الوثائق', 'أبوستيل', 'لم الشمل', 'دليل', '2026']
FT_SEO_T = 'تثبيت الزواج الخارجي في تركيا: التصديق والترجمة بالترتيب'
FT_SEO_D = ('زواج معقود خارج تركيا لا يُعاد عقده — يُعتمد بوثيقته: أبوستيل لدول الاتفاقية، '
            'وسلسلة التصديق للوثائق السورية (لا أبوستيل لسوريا)، ثم الترجمة المحلَّفة، '
            'والطلاق مساره دعوى مستقلة.')

for label, body, needles in [
    ('sheikh add', SHEIKH_ADD, ['143', '2015', 'family-register-foreign-marriage',
                                'turkish-citizenship-marriage-syrians-gaziantep']),
    ('foreign rebuild', FT_DETAILS, ['سوريا ليست طرفاً', 'yabanci-bosanma-tanima-tenfiz-turkiye-2026',
                                     'civil-marriage-registration-turkey', 'family-reunion-visa-syria-2026']),
]:
    for n in needles:
        assert n in body, 'PREDICATE WOULD LIE: %r not in %s' % (n, label)
for dead in DEAD:
    assert ('href="/article/%s"' % dead) not in SHEIKH_ADD + FT_DETAILS, 'links a retiring slug'

sql = _no_bare_percent("""-- ============================================================================
-- عنقود الزواج: النقضان يطويان في المرجعي القائم، والزواج الخارجي يصير صفحةً حقيقية
-- ============================================================================
-- شكل هذا العنقود مختلف: civil-marriage-registration-turkey (2,586 حرفاً)
-- موجود وجيّد — بُني في 2026-08-06 على المادتين 12 و13 من لائحة الزواج
-- بنصّهما، ومسار e-Devlet، وواجب التبليغ بعد العقد وخطر إهماله على الحماية
-- المؤقتة. فلا إعادة بناء هنا، بل:
--
--   1. إثراء واحد: تحذير «زواج الشيخ» يعيش فقط في نقض الـ113 حرفاً المتقاعد،
--      وهو أهمّ تحذير لهذا الجمهور. يُنقل قسماً كاملاً بصياغة دقيقة: الديني
--      وحده بلا أثر قانوني (لا إرث ولا نفقة وتعقيد في تسجيل الأطفال)،
--      والمدني أولاً بنصّ المادة 143 من القانون المدني (لا مراسم دينية إلا
--      بإبراز دفتر العائلة)، والتجريم القديم ألغته المحكمة الدستورية سنة
--      2015 — فالصفحة تقول «بلا أثر» لا «جريمة»: لا تهويل ولا عقوبات مغسولة.
--   2. تقاعدان: marriage-registration (113) وfamily-civil-marriage-
--      municipality (255) ← 301 ← المرجعي، بقيمة 'draft' التي يقبلها قيد
--      articles_status_check المكتشَف حديثاً.
--   3. إعادة بناء واحدة: family-register-foreign-marriage (188 حرفاً)
--      موضوع مستقلّ بحقّ — اعتماد زواج معقود في الخارج — ودمجه يخلط سؤالين
--      (درس İptal/V-160). يُبنى على آلية التصديق، وفيه الحقيقة التي تحسم
--      أكثر الحالات السورية: سوريا ليست طرفاً في اتفاقية أبوستيل، فوثائقها
--      تسلك سلسلة التصديق القنصلية لا الأبوستيل. وحالة الطلاق تُحال إلى
--      صفحة تانيما-تنفيذ القائمة بدل تغطيتها نصفاً هنا.
--
-- فُحص قبل الكتابة: id == slug في الصفوف الأربعة (صفّ المواليد خالَف ذلك
-- فصار الفحص دائماً)، ولا مقال ولا سيناريو مستشار يربط أياً من النقضين.
--
-- آمن لإعادة التشغيل.
-- ============================================================================

-- 1. قسم زواج الشيخ يُضاف إلى المرجعي (محروس)
UPDATE articles SET
    details = details || '%s',
    last_update = CURRENT_DATE
WHERE slug = '%s' AND details NOT LIKE '%%زواج الشيخ وحده لا يحميك%%';

-- 3. الزواج الخارجي — إعادة بناء كاملة (id == slug مفحوص، فالـupsert آمن)
INSERT INTO articles (id, slug, title, intro, details, steps, tips, documents,
                      fees, warning, source, tags, category, status,
                      seo_title, seo_description, last_update)
VALUES ('%s', '%s', '%s', '%s', '%s', %s, %s, %s, '%s', '%s', '%s', %s,
        'أنواع الإقامات', 'approved', '%s', '%s', CURRENT_DATE)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, intro = EXCLUDED.intro, details = EXCLUDED.details,
    steps = EXCLUDED.steps, tips = EXCLUDED.tips, documents = EXCLUDED.documents,
    fees = EXCLUDED.fees, warning = EXCLUDED.warning, source = EXCLUDED.source,
    tags = EXCLUDED.tags, category = EXCLUDED.category, status = EXCLUDED.status,
    seo_title = EXCLUDED.seo_title, seo_description = EXCLUDED.seo_description,
    last_update = EXCLUDED.last_update;

-- 2. النقضان يتقاعدان بالقيمة القانونية 'draft'
UPDATE articles SET status = 'draft', last_update = CURRENT_DATE
WHERE slug IN (%s) AND status = 'approved';

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved' AND details LIKE '%%زواج الشيخ وحده لا يحميك%%';
    IF n <> 1 THEN RAISE EXCEPTION 'the sheikh section did not land'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved' AND details LIKE '%%سوريا ليست طرفاً%%';
    IF n <> 1 THEN RAISE EXCEPTION 'the foreign-marriage rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug = '%s';
    IF n <> 1 THEN RAISE EXCEPTION 'duplicate slug on the foreign-marriage page'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug IN (%s) AND status = 'approved';
    IF n > 0 THEN RAISE EXCEPTION '%% stub(s) still approved', n; END IF;
END
$check$;

SELECT 'canonical enriched: sheikh-marriage section' AS البند,
       (details LIKE '%%زواج الشيخ وحده لا يحميك%%')::text AS النتيجة
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'foreign-marriage rebuilt (no Apostille for Syria)',
       (details LIKE '%%سوريا ليست طرفاً%%')::text
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'stubs retired to draft (want 0 approved)',
       count(*)::text
FROM articles WHERE slug IN (%s) AND status = 'approved';
""") % (q(SHEIKH_ADD), CANON,
        FOREIGN, FOREIGN, q(FT_TITLE), q(FT_INTRO), q(FT_DETAILS),
        arr(FT_STEPS), arr(FT_TIPS), arr(FT_DOCS), q(FT_FEES), q(FT_WARN), q(FT_SOURCE),
        arr(FT_TAGS), q(FT_SEO_T), q(FT_SEO_D),
        ', '.join("'%s'" % d for d in DEAD),
        CANON, FOREIGN, FOREIGN, ', '.join("'%s'" % d for d in DEAD),
        CANON, FOREIGN, ', '.join("'%s'" % d for d in DEAD))

path = os.path.join(REPO, 'sql', '2026-08-07_marriage_cluster.sql')
open(path, 'w', encoding='utf-8', newline='').write(sql)

_code = '\n'.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('الإثراء       : %s + قسم زواج الشيخ (م143 + إلغاء التجريم 2015) — %d حرفاً' % (CANON, len(SHEIKH_ADD)))
print('إعادة البناء  : %s — %d ← %d حرفاً (لا أبوستيل لسوريا + مسار الطلاق منفصل)' % (FOREIGN, len(f['details'] or ''), len(FT_DETAILS)))
print('يتقاعد        : %s ← draft (القيمة القانونية المكتشفة)' % ', '.join(DEAD))
print('quote parity  :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written       :', path, len(sql), 'chars')
