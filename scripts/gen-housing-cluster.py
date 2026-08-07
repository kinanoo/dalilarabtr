# -*- coding: utf-8 -*-
"""Housing batch: five rent scraps → one guide; two utility scraps → the monster.

── the batch ──────────────────────────────────────────────────────────────

Rent side (canonical: renting-house, rebuilt):
  renting-house                    252 chars   4v  ← canonical
  rent-increase-limit              389 chars   2v  ← retire (title still says 2025)
  deposit-return                   252 chars   2v  ← retire
  digital-lease-contract           151 chars  17v  ← retire (its fact folds in:
                                                     e-Devlet rental contracts,
                                                     late 2024, no noter, valid
                                                     for address registration)
  housing-advanced-aidat-dispute   224 chars   4v  ← retire
  housing-advanced-neighbor-noise  141 chars   0v  ← retire

Utility side (canonical already exists and is a 21,537-char guide):
  utilities-registration           266 chars   8v  ← retire → home-subscriptions
  exit-utility-deposit-refund      153 chars  15v  ← retire → home-subscriptions
  home-subscriptions-turkey-2026 covers DASK, güvence deposits, refunds and
  meters already (checked live) — so these two just fold behind 301s, no
  content work needed.

All eight rows have id == slug (checked live); no inbound links to any.

── the legal anchors of the rent rebuild ─────────────────────────────────

* Deposit: Turkish Code of Obligations (TBK) art. 342 — the deposit may not
  exceed THREE months' rent, and a cash deposit belongs in a bank account in
  the tenant's name, not in the landlord's pocket. The rule nobody applies
  but every tenant should know — stated as exactly that, plus the practical
  layer that actually wins disputes: receipts and a documented entry/exit
  condition.
* Increase: TBK art. 344 — the cap is the 12-month average TÜFE announced
  monthly; the temporary 25% cap era is over. No number published — the
  calculator computes the current one.
* The tahliye-taahhüdü trap: never sign an (often undated) eviction promise
  at contract time — it is the standard way tenants lose the home later.
* Deposit/rent disputes are NOT consumer-committee business (consistent
  with the consumer guide shipped an hour ago): written demand, then the
  civil route.

No FX-rent rules, no eviction-law deep dive, no numbers that rot.
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


CANON = 'renting-house'
DEAD_RENT = ['rent-increase-limit', 'deposit-return', 'digital-lease-contract',
             'housing-advanced-aidat-dispute', 'housing-advanced-neighbor-noise']
DEAD_UTIL = ['utilities-registration', 'exit-utility-deposit-refund']
UTIL_CANON = 'home-subscriptions-turkey-2026'

c = get('articles?select=id,slug,status,details&slug=eq.' + CANON)[0]
assert c['status'] == 'approved' and c['id'] == c['slug'] and len(c['details'] or '') < 1500
for d in DEAD_RENT + DEAD_UTIL:
    r = get('articles?select=id,slug,status&slug=eq.' + d)
    assert r and r[0]['status'] == 'approved' and r[0]['id'] == r[0]['slug'], d
u = get('articles?select=status,details&slug=eq.' + UTIL_CANON)[0]
assert u['status'] == 'approved' and len(u['details']) > 15000, 'the utilities monster shrank?!'
assert 'DASK' in u['details'], 'utilities canonical must cover DASK'
for s in ('syrian-address-update-mandate-turkey', 'kimlik-data-update',
          'consumer-arbitration-hakem-heyeti', 'bank-account-opening'):
    r = get('articles?select=status&slug=eq.' + s)
    assert r and r[0]['status'] == 'approved', s + ' not live'
assert os.path.isdir(os.path.join(REPO, 'src/app/tools/rent-increase-calculator'))

DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الخلاصة</strong></p>'
    '<p style="margin:0;">أربعة أشياء تحسم تجربة استئجارك كلّها: <strong>عقد مكتوب</strong> '
    '(والرقمي عبر e-Devlet يعتمد رسمياً)، و<strong>وديعة موثّقة</strong> — وسقفها في القانون '
    'ثلاثة أشهر إيجار — و<strong>زيادة سنوية بسقف TÜFE</strong> تحسبها حاسبتنا، '
    'و<strong>توقيعك</strong>: لا توقّع تعهّد إخلاء يوم توقيع العقد مهما قيل لك إنّه '
    '«روتين».</p></div>'

    '<h2>العقد: مكتوبٌ دائماً — والرقمي صار معتمداً</h2>'
    '<p>لا عقد شفهياً مهما بدا المالك طيّباً: العقد المكتوب شرطُ كلّ ما بعده — تثبيت '
    'العنوان، والاشتراكات، والإقامة. ومنذ أواخر 2024 تتيح تركيا <strong>عقد الإيجار '
    'الرقمي عبر e-Devlet</strong>: يوقّعه الطرفان إلكترونياً، <strong>بلا نوتر</strong>، '
    'وهو معتمد لتثبيت العنوان في النفوس. إن كان مؤجّرك مستعدّاً له فهو أنظف مسار؛ وإلا '
    'فعقد ورقي بهويّتَي الطرفين وتوقيعهما على كل صفحة.</p>'
    '<p>وبعد السكن مباشرةً: <strong>ثبّت عنوانك</strong> — واجبٌ بمهلة وتتوقّف عليه '
    'معاملاتك كلّها ('
    '<a href="/article/syrian-address-update-mandate-turkey">تحديث العنوان الإجباري</a> '
    'و<a href="/article/kimlik-data-update">تحديث بيانات الكملك</a>).</p>'

    '<h2>الوديعة (Depozito): سقفها القانوني ثلاثة أشهر — والتوثيق هو المعركة</h2>'
    '<p>قانون الموجبات التركي (المادة 342): الوديعة <strong>لا تتجاوز ثلاثة أشهر '
    'إيجار</strong>، والأصل في الوديعة النقدية أن <strong>تُودَع في حساب بنكي باسم '
    'المستأجر</strong> لا أن تدخل جيب المالك. قليلٌ من يطبّق هذا الأصل — لكن اعرفه: '
    'مالكٌ يطلب ستّة أشهر وديعةً يطلب ما لا يحقّ له.</p>'
    '<p>وعملياً، الوديعة تُخسَر بالتوثيق الناقص لا بالقانون:</p>'
    '<ul>'
    '<li><strong>إيصال</strong> بكل ما دفعت (وديعة وإيجاراً) — والتحويل البنكي المعنون '
    '«kira» أقوى إثبات (<a href="/article/bank-account-opening">حسابك البنكي</a>).</li>'
    '<li><strong>صوّر البيت يوم الاستلام</strong> — كلّ عيب موجود قبلك، بتاريخ الصور.</li>'
    '<li><strong>تسليمٌ موثّق عند الخروج</strong>: جولة مشتركة، وقراءات العدادات، '
    'وبراءة من المستحقّات.</li>'
    '</ul>'
    '<p>رفض المالك الردّ بلا سبب؟ مطالبة مكتوبة (يفضَّل عبر نوتر) ثم المسار القضائي '
    'المدني — <strong>وليست لجنة المستهلك</strong>: نزاعات الإيجار خارج اختصاصها.</p>'

    '<h2>الزيادة السنوية: سقفها متوسّط TÜFE — ولا رقم ثابتاً</h2>'
    '<p>الزيادة في العقود السكنية سقفها القانوني (المادة 344) هو <strong>متوسّط مؤشّر '
    'أسعار المستهلك لاثني عشر شهراً</strong>، ويتغيّر كل شهر بإعلان هيئة الإحصاء — '
    'وحقبة سقف الـ25% المؤقّت انتهت. لا تحفظ رقماً: '
    '<a href="/tools/rent-increase-calculator"><strong>احسب سقف زيادتك الشهر الجاري '
    'بحاسبتنا ←</strong></a></p>'
    '<ul>'
    '<li>الزيادة عند <strong>تجديد السنة</strong> لا في منتصفها.</li>'
    '<li>طلبُ أكثر من السقف لا يُلزمك — وما دفعتَه زائداً يمكن استرداده.</li>'
    '<li>وثّق كل اتفاق زيادة كتابةً.</li>'
    '</ul>'

    '<h2>الفخّ الذي يُخرج الناس من بيوتهم: تعهّد الإخلاء</h2>'
    '<p>يُدسّ أحياناً بين أوراق التوقيع <strong>تعهّد إخلاء</strong> '
    '(<span dir="ltr">tahliye taahhütnamesi</span>) — ورقة تتعهّد فيها بإخلاء البيت في '
    'تاريخ معيّن، وكثيراً ما تكون <strong>بلا تاريخ</strong> يملؤه المالك لاحقاً كما يشاء. '
    'توقيعها يوم العقد هو الطريقة النمطية التي يخسر بها المستأجرون بيوتهم بعد سنة. '
    '<strong>لا توقّع أي ورقة إخلاء مع العقد</strong> مهما قيل «إجراء شكلي» — والقاعدة '
    'العامة: لا توقّع ما لم تفهمه، ولا ورقةً فارغة التاريخ أبداً.</p>'

    '<h2>العائدات (Aidat) — من يدفع ماذا؟</h2>'
    '<p>في المجمّعات، الـAidat تغطّي خدمات التشغيل (نظافة، أمن، مصعد…) وتقع عادةً على '
    '<strong>الساكن</strong>؛ أمّا نفقات الملكية الكبرى (تجديدات هيكلية) فمنطقها على '
    '<strong>المالك</strong> — وحدّدا ذلك في العقد صراحةً قطعاً للنزاع. وارتفعت العائدات '
    'فجأة بلا تفسير؟ اطلب <strong>ميزانية الموقع مكتوبةً</strong> من الإدارة — حقّك — '
    'وقدّم اعتراضك كتابةً للإدارة واجتماع الملّاك.</p>'

    '<h2>الجيران والضوضاء: التدرّج يحميك</h2>'
    '<p>تفاهمٌ هادئ أولاً، ثم إدارة المجمّع كتابةً، ثم التوثيق (تواريخ، تسجيلات، شهود)، '
    'ثم البلاغ عند الضرورة (زابطة البلدية للإزعاج، والشرطة لما يتجاوزه). القفز فوق '
    'الدرجات ينقلب عليك — والتوثيق هو ما يفصل شكواك عن «كلام جيران».</p>'

    '<h2>العدادات والاشتراكات — دليلها المستقل</h2>'
    '<p>فتح الكهرباء والماء والغاز والإنترنت باسمك، وDASK الإلزامي، وتأمينات العدادات '
    'واستردادها عند الخروج — كلّه مفصَّل في '
    '<a href="/article/home-subscriptions-turkey-2026"><strong>دليل اشتراكات المنزل '
    'الكامل ←</strong></a></p>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>المالك يرفض عقداً مكتوباً — «كلمة شرف»؟</h3>'
    '<p>ارحل. بلا عقد لا تثبيت عنوان ولا اشتراكات باسمك ولا إثبات لأي حقّ — و«كلمة الشرف» '
    'لا تُبرَز في نزاع.</p>'
    '<h3>دفعت وديعةً نقداً بلا إيصال — ماذا الآن؟</h3>'
    '<p>اطلب الإيصال اليوم قبل أي خلاف، أو حوّل ما بقي من دفعاتك بنكياً بعنوان واضح — '
    'فالإثبات يُبنى من الآن فصاعداً على الأقل.</p>'
    '<h3>هل يطردني المالك إن رفضت زيادةً فوق السقف؟</h3>'
    '<p>رفضُ زيادةٍ غير قانونية ليس سبب إخلاء. أسباب الإخلاء محدّدة قانوناً — وهنا يظهر '
    'خطر تعهّد الإخلاء الموقَّع سلفاً: لا تعطِ أحداً سلاحاً جاهزاً.</p>'
)
STEPS = [
    'قبل التوقيع: اقرأ كل ورقة — ولا توقّع تعهّد إخلاء ولا ورقة فارغة التاريخ أبداً.',
    'اعقد كتابةً: عقد e-Devlet الرقمي إن أمكن (بلا نوتر ومعتمد للنفوس)، أو ورقي بهويتي الطرفين.',
    'وثّق الوديعة: سقفها 3 أشهر قانوناً — إيصال أو تحويل بنكي معنون، وصور البيت يوم الاستلام.',
    'ثبّت عنوانك في النفوس فور السكن — ثم افتح الاشتراكات باسمك (دليل الاشتراكات).',
    'عند التجديد: احسب سقف الزيادة بالحاسبة ولا تقبل رقماً محفوظاً.',
    'عند الخروج: جولة تسليم مشتركة، وقراءات عدادات، واسترداد الوديعة والتأمينات موثَّقاً.',
    'وعند النزاع: مطالبة مكتوبة أولاً — ونزاع الإيجار مساره قضائي مدني لا لجنة المستهلك.',
]
TIPS = [
    'سقف الوديعة ثلاثة أشهر إيجار بنصّ المادة 342 — من طلب ستّة طلب ما لا يحقّ له.',
    'تعهّد الإخلاء الموقَّع يوم العقد هو الطريقة النمطية لخسارة البيت بعد سنة — لا توقّعه.',
    'عقد e-Devlet الرقمي بلا نوتر ومعتمد لتثبيت العنوان — اسأل مؤجّرك عنه أولاً.',
    'سقف الزيادة متوسّط TÜFE لاثني عشر شهراً ويتغيّر شهرياً — الحاسبة لا الذاكرة.',
    'صور يوم الاستلام بتاريخها = وديعتك عند الخروج.',
    'الزيادة عند تجديد السنة فقط — ومنتصف العقد ليس موسمها.',
]
DOCS = [
    'هويتا الطرفين (كملك/إقامة/جواز) للعقد',
    'العقد المكتوب أو الرقمي عبر e-Devlet — نسخة كاملة بيدك',
    'إيصالات الوديعة والإيجار (أو حركات التحويل البنكي المعنونة)',
    'صور حالة البيت يوم الاستلام ويوم التسليم، وقراءات العدادات',
]
FEES = ('لا رسم على العقد الرقمي عبر e-Devlet. والوديعة سقفها القانوني ثلاثة أشهر إيجار. '
        'وسقف الزيادة السنوية متوسّط TÜFE المعلن شهرياً — احسبه بالحاسبة ولا تعتمد رقماً '
        'متداولاً.')
WARN = ('لا توقّع تعهّد إخلاء مع العقد ولا أي ورقة فارغة التاريخ. والوديعة فوق ثلاثة أشهر '
        'مخالفة للمادة 342. ونزاعات الإيجار خارج اختصاص لجنة المستهلك — مسارها مدني. '
        'والعقد الشفهي يترك كل حقوقك بلا إثبات.')
SOURCE = ('قانون الموجبات التركي (TBK) رقم 6098 — المادة 342 (سقف الوديعة ثلاثة أشهر '
          'وإيداعها باسم المستأجر) والمادة 344 (سقف الزيادة بمتوسّط TÜFE لاثني عشر شهراً)؛ '
          'وخدمة عقود الإيجار الرقمية عبر e-Devlet (أواخر 2024، بلا نوتر، معتمدة لتثبيت '
          'العنوان)؛ ومؤشّر TÜFE الشهري لهيئة الإحصاء TÜİK')
TAGS = ['الإيجار', 'السكن والحياة', 'الوديعة', 'زيادة الإيجار', 'دليل', '2026']
SEO_T = 'استئجار منزل في تركيا: العقد والوديعة وسقف الزيادة وفخّ الإخلاء'
SEO_D = ('سقف الوديعة 3 أشهر بنص القانون، والزيادة بمتوسط TÜFE تحسبها حاسبتنا، وعقد '
         'e-Devlet الرقمي بلا نوتر — وفخّ تعهّد الإخلاء الذي يُخرج المستأجرين من بيوتهم. '
         'دليل الاستئجار الكامل للأجانب والسوريين.')

for n in ['342', '344', 'tahliye', 'e-Devlet', 'rent-increase-calculator',
          'home-subscriptions-turkey-2026', 'syrian-address-update-mandate-turkey',
          'ليست لجنة المستهلك']:
    assert n in DETAILS, 'PREDICATE WOULD LIE: %r' % n
assert '25%' not in DETAILS or 'انتهت' in DETAILS
for dead in DEAD_RENT + DEAD_UTIL:
    assert ('href="/article/%s"' % dead) not in DETAILS

sql = _no_bare_percent("""-- ============================================================================
-- دفعة السكن: خمسة أنقاض إيجار ← دليل واحد، ونقيضا العدادات ← الدليل الوحش القائم
-- ============================================================================
-- renting-house (252 حرفاً) يُعاد بناؤه دليل الاستئجار الكامل على مرساتين
-- قانونيتين: المادة 342 (سقف الوديعة ثلاثة أشهر وإيداعها باسم المستأجر —
-- الأصل الذي لا يطبّقه أحد وعلى كل مستأجر معرفته) والمادة 344 (سقف الزيادة
-- بمتوسّط TÜFE — بلا رقم منشور، الحاسبة تحسبه)، ومعهما فخّ تعهّد الإخلاء
-- الموقَّع يوم العقد، وحقيقة عقد e-Devlet الرقمي (أواخر 2024، بلا نوتر،
-- معتمد للنفوس) المنقولة من نقض الـ17 قراءة قبل تقاعده.
--
-- وتتقاعد خمسة أنقاض إيجار إلى الدليل، ونقيضا العدادات إلى
-- home-subscriptions-turkey-2026 القائم أصلاً (21,537 حرفاً يغطّي DASK
-- والتأمينات والاسترداد — فُحص حيّاً) — لا بناء في شقّ العدادات إطلاقاً.
--
-- اتّساقٌ مع دليل المستهلك المنشور قبل ساعات: نزاع الإيجار والوديعة خارج
-- اختصاص لجنة التحكيم — مساره مطالبة مكتوبة ثم القضاء المدني.
--
-- الصفوف الثمانية id == slug (فُحص)، ولا روابط واردة لأيٍّ من المتقاعدة.
--
-- آمن لإعادة التشغيل.
-- ============================================================================

UPDATE articles SET
    title = 'استئجار منزل في تركيا 2026: العقد الرقمي، وسقف الوديعة القانوني، وحساب الزيادة، وفخّ تعهّد الإخلاء',
    intro = '%s',
    details = '%s',
    steps = %s, tips = %s, documents = %s,
    fees = '%s', warning = '%s', source = '%s', tags = %s,
    category = 'السكن والحياة', seo_title = '%s', seo_description = '%s',
    last_update = CURRENT_DATE
WHERE slug = '%s';

UPDATE articles SET status = 'draft', last_update = CURRENT_DATE
WHERE slug IN (%s) AND status = 'approved';

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved'
       AND details LIKE '%%342%%' AND details LIKE '%%tahliye%%';
    IF n <> 1 THEN RAISE EXCEPTION 'the rent rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved' AND length(details) > 15000;
    IF n <> 1 THEN RAISE EXCEPTION 'the utilities canonical is not intact'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug IN (%s) AND status = 'approved';
    IF n > 0 THEN RAISE EXCEPTION '%% stub(s) still approved', n; END IF;
END
$check$;

SELECT 'rent guide rebuilt (art 342 + 344 + tahliye trap)' AS البند,
       (details LIKE '%%342%%' AND details LIKE '%%344%%')::text AS النتيجة
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'utilities canonical intact (>15K chars)', (length(details) > 15000)::text
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'seven stubs retired (want 0 approved)', count(*)::text
FROM articles WHERE slug IN (%s) AND status = 'approved';
""") % (q('استئجار بيت في تركيا أكثر من توقيع عقد: وديعة لها سقف قانوني لا يعرفه أكثر '
          'المستأجرين (ثلاثة أشهر — المادة 342)، وزيادة سنوية سقفها متوسّط TÜFE تحسبها '
          'حاسبتنا بدل رقم محفوظ، وعقد رقمي عبر e-Devlet صار معتمداً بلا نوتر، وورقة '
          'واحدة — تعهّد الإخلاء — توقيعها يوم العقد يُخرج الناس من بيوتهم بعد سنة. '
          'هذا الدليل يرتّبها كلّها.'),
        q(DETAILS), arr(STEPS), arr(TIPS), arr(DOCS), q(FEES), q(WARN), q(SOURCE), arr(TAGS),
        q(SEO_T), q(SEO_D), CANON,
        ', '.join("'%s'" % d for d in DEAD_RENT + DEAD_UTIL),
        CANON, UTIL_CANON, ', '.join("'%s'" % d for d in DEAD_RENT + DEAD_UTIL),
        CANON, UTIL_CANON, ', '.join("'%s'" % d for d in DEAD_RENT + DEAD_UTIL))

path = os.path.join(REPO, 'sql', '2026-08-07_housing_cluster.sql')
open(path, 'w', encoding='utf-8', newline='').write(sql)

_code = '\n'.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('الإيجار      : %s — %d ← %d حرفاً (م342 + م344 + فخّ الإخلاء + العقد الرقمي)' % (CANON, len(c['details'] or ''), len(DETAILS)))
print('يتقاعد إيجار : %s' % ', '.join(DEAD_RENT))
print('يتقاعد عدادات: %s ← %s (وحش قائم، %d حرفاً)' % (', '.join(DEAD_UTIL), UTIL_CANON, len(u['details'])))
print('quote parity :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written      :', path, len(sql), 'chars')
