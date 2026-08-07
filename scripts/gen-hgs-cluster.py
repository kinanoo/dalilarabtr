# -*- coding: utf-8 -*-
"""HGS cluster: three pages, one system — and one of them sells a dead one.

── the cluster ────────────────────────────────────────────────────────────

hgs-highway-toll-system   737 chars  25 views  ← canonical; its penalty
                                                 timeline is already right
auto-hgs-ogs              165 chars   8 views  ← retire; its TITLE still
                                                 advertises OGS
toll-violation-check      182 chars   8 views  ← retire; its KGM plate-query
                                                 URL folds into the canonical

── what was verified for this rebuild ────────────────────────────────────

* The canonical's graduated penalty timeline matches law 6001 art. 30 as
  amended: within 15 days of the crossing — the toll only, no penalty;
  within the following 30 days (to day 45) — toll + its equal as penalty;
  after that — toll + four times. Its existing source is the official PTT
  ihlalli-geçiş payment service on turkiye.gov.tr. Kept, tabled, sourced.
* OGS was discontinued on 31 March 2022 — HGS is the only system. Bank OGS
  accounts were converted; anyone "selling OGS" today sells nothing. The
  retiring stub's title still says OGS, which is exactly why it retires.
* Checking channels that exist: e-Devlet (PTT HGS services), PTT's
  hgsmusteri.ptt.gov.tr, the HGS Mobil app, and KGM's public plate query
  (webihlaltakip.kgm.gov.tr) which needs only the plate — that last one is
  the entire useful content of toll-violation-check, folded in.
* The label is tied to the vehicle/plate — selling the car or changing the
  plate without updating the record moves other people's crossings onto
  you (kept from the retiring stub; it is the honest, useful part).

Nothing is asserted about current toll AMOUNTS — they change by operator
and year; the page teaches the mechanism and the deadlines instead.
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


CANON = 'hgs-highway-toll-system'
DEAD = ['auto-hgs-ogs', 'toll-violation-check']

c = get('articles?select=id,slug,status,details&slug=eq.' + CANON)[0]
assert c['status'] == 'approved' and c['id'] == c['slug']
assert len(c['details'] or '') < 1500, 'canonical already rebuilt'
for d in DEAD:
    r = get('articles?select=id,slug,status&slug=eq.' + d)
    assert r and r[0]['status'] == 'approved' and r[0]['id'] == r[0]['slug'], d
for s in ('app-plate-turkey', 'traffic-fines', 'car-registration',
          'tramer-hasar-kaydi-kilometre-kontrol-turkiye-2026'):
    r = get('articles?select=status,slug&slug=eq.' + s)
    if s.startswith('tramer') and not r:
        # the listing truncated the slug; resolve it
        r = get('articles?select=status,slug&slug=like.tramer*')
    assert r and r[0]['status'] == 'approved', s + ' not live'
TRAMER = get('articles?select=slug&slug=like.tramer*')[0]['slug']

DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الخلاصة</strong></p>'
    '<p style="margin:0;">HGS هو نظام العبور <strong>الوحيد</strong> للطرق السريعة والجسور '
    'المأجورة في تركيا — ملصق تديره PTT ويرتبط بلوحة سيارتك. عبرت بلا رصيد؟ '
    '<strong>لديك 15 يوماً تدفع فيها أجر العبور فقط بلا أي غرامة</strong> — والتأخير بعدها '
    'هو ما يحوّل ليراتٍ إلى أضعافها.</p></div>'

    '<h2>أولاً: OGS انتهى — لا تشترِ ما لا وجود له</h2>'
    '<p>نظام OGS المصرفي القديم <strong>أُلغي نهائياً في 31 آذار/مارس 2022</strong> وحُوّلت '
    'حساباته إلى HGS. كلّ العبور اليوم على HGS وحده — فمن يعرض عليك «جهاز OGS» أو «اشتراك '
    'OGS» يبيعك نظاماً ميّتاً.</p>'

    '<h2>كيف تحصل على HGS وتشحنه</h2>'
    '<table><thead><tr><th>ماذا</th><th>أين</th></tr></thead><tbody>'
    '<tr><td><strong>الحصول على الملصق</strong></td><td>فروع PTT (ومعك رخصة السير '
    'والهوية)، أو البنوك المشاركة</td></tr>'
    '<tr><td><strong>شحن الرصيد</strong></td><td>فروع PTT، وتطبيق HGS Mobil، وموقع '
    '<span dir="ltr">hgsmusteri.ptt.gov.tr</span>، وقنوات بنكك، وe-Devlet — وفعّل الشحن '
    'التلقائي إن كنت تعبر كثيراً</td></tr>'
    '<tr><td><strong>الاستعلام عن الرصيد والعبورات</strong></td><td>القنوات نفسها؛ '
    'والمخالفات لها استعلام مستقلّ أدناه</td></tr>'
    '</tbody></table>'
    '<p>الملصق <strong>مربوط بلوحة السيارة</strong> لا بك أنت: بعت السيارة أو غيّرت اللوحة؟ '
    'حدّث القيد فوراً — وإلا صارت عبورات غيرك على حسابك، أو عبوراتك أنت مخالفاتٍ على '
    'المالك القديم.</p>'

    '<h2>عبرت بلا رصيد؟ هذا هو السلّم — والوقت هو كل شيء</h2>'
    '<p>العبور بلا رصيد كافٍ (ihlalli geçiş) لا يُوقفك على البوّابة — يُسجَّل، ثم يجري '
    'عليه سلّم المادة 30 من القانون 6001 بصيغته المعدَّلة:</p>'
    '<table><thead><tr><th>متى تدفع؟</th><th>ماذا تدفع؟</th></tr></thead><tbody>'
    '<tr><td>خلال <strong>15 يوماً</strong> من تاريخ العبور</td>'
    '<td><strong>أجر العبور فقط — بلا غرامة</strong></td></tr>'
    '<tr><td>في الثلاثين يوماً التالية (حتى اليوم 45)</td>'
    '<td>أجر العبور + غرامة بمثله (الضعف إجمالاً)</td></tr>'
    '<tr><td>بعد اليوم 45</td>'
    '<td>أجر العبور + غرامة بأربعة أمثاله</td></tr>'
    '</tbody></table>'
    '<p>فالقاعدة العملية واحدة: <strong>استعلم وادفع في أول أسبوعين بعد أي سفر</strong> — '
    'هذه المهلة هدية القانون، وتفويتها هو ما يجعل فاتورة جسرٍ واحد أضعافاً.</p>'

    '<h2>أين تستعلم عن المخالفات — ثلاث قنوات</h2>'
    '<ol>'
    '<li><strong>استعلام KGM العام باللوحة</strong> '
    '(<span dir="ltr">webihlaltakip.kgm.gov.tr</span>): يكفي رقم اللوحة — استعمله قبل شراء '
    'سيارة مستعملة أيضاً لترى مخالفاتها المعلّقة.</li>'
    '<li><strong>e-Devlet</strong>: خدمات PTT — الاستعلام عن العبور المخالف ودفعه.</li>'
    '<li><strong>قنوات PTT</strong>: موقع <span dir="ltr">hgsmusteri.ptt.gov.tr</span> '
    'وتطبيق HGS Mobil.</li>'
    '</ol>'
    '<p>وإن رأيت مخالفةً تظنّها خطأً (لوحة مقروءة غلطاً، عبور لم يقع): '
    '<strong>مهلة الاعتراض 15 يوماً من التبليغ</strong> — لا تنتظر.</p>'

    '<h2>حالات تُكلّف الناس فوق ما يجب</h2>'
    '<ul>'
    '<li><strong>سيارة مستأجرة:</strong> عبوراتها على حساب جهاز السيارة؛ والمكاتب تحمّلك '
    'المخالفة لاحقاً وقد تضيف رسوم خدمة — اسأل عن سياسة المكتب قبل الاستلام، واحتفظ '
    'بأوقات رحلاتك.</li>'
    '<li><strong>سيارة اشتريتها للتوّ:</strong> استعلم باللوحة عن مخالفات معلّقة قبل الشراء '
    '(ومعها <a href="/article/' + '%TRAMER%' + '">سجلّ الضرر والكيلومترات</a>)، وحدّث قيد '
    'HGS باسمك بعد النقل — '
    '(<a href="/article/car-registration">تسجيل وشراء سيارة في تركيا</a>).</li>'
    '<li><strong>سيارة بلوحة أجنبية:</strong> النظام يقرأ اللوحات الأجنبية أيضاً — '
    'والمخالفات تلحقك عند المعابر والمعاملات.</li>'
    '</ul>'

    '<h2>وماذا عن مخالفات السرعة والمرور؟</h2>'
    '<p>هذه صفحة رسوم العبور. مخالفات المرور (سرعة، إشارة، وقوف) نظام آخر بغرامات أخرى — '
    'تفصيلها في <a href="/article/traffic-fines">مخالفات المرور والغرامات في تركيا</a>. '
    'ولأصحاب السيارات عموماً: <a href="/article/app-plate-turkey">تنبيه بلاكة APP</a>.</p>'
)
STEPS = [
    'احصل على ملصق HGS من فرع PTT (رخصة السير + الهوية) أو من بنك مشارك — ولا تشترِ «OGS» من أحد.',
    'الصق الملصق واشحن رصيداً يناسب استخدامك — وفعّل الشحن التلقائي إن كنت تعبر كثيراً.',
    'بعد كل سفر فيه طرق مأجورة أو جسور: استعلم خلال الأسبوعين الأولين.',
    'ظهر عبور بلا رصيد؟ ادفعه خلال 15 يوماً من تاريخ العبور — أجر العبور فقط بلا غرامة.',
    'تظنّ المخالفة خطأً؟ اعترض خلال 15 يوماً من التبليغ.',
    'بعت السيارة أو غيّرت اللوحة؟ حدّث قيد HGS في اليوم نفسه.',
    'قبل شراء سيارة مستعملة: استعلم باللوحة على استعلام KGM عن مخالفات معلّقة.',
]
TIPS = [
    'مهلة الـ15 يوماً هدية القانون: أجر العبور فقط بلا غرامة — بعدها الضعف، وبعد 45 يوماً خمسة أمثال المبلغ إجمالاً.',
    'OGS أُلغي منذ 31/03/2022 — كل من يبيعه يبيع نظاماً ميّتاً.',
    'الملصق مربوط باللوحة لا بالشخص — تحديث القيد عند البيع يحميك من عبورات غيرك.',
    'استعلام KGM يعمل باللوحة وحدها — استعمله قبل شراء أي سيارة مستعملة.',
    'المستأجر يدفع مخالفات فترة استئجاره — اسأل المكتب عن سياسته قبل الاستلام.',
    'رسوم العبور نفسها تتغيّر بالمشغّل والسنة — لا تعتمد رقماً متداولاً، والمهم المهل لا المبالغ.',
]
DOCS = [
    'لاستخراج الملصق من PTT: رخصة سير السيارة (Ruhsat) + هويتك (كملك/إقامة/جواز)',
    'لدفع مخالفة: رقم اللوحة — عبر e-Devlet أو قنوات PTT أو استعلام KGM',
    'للاعتراض: ما يدعم الخطأ (إثبات مكانك/سيارتك وقت العبور المزعوم) خلال 15 يوماً من التبليغ',
]
FEES = ('رسوم العبور تختلف بالطريق والجسر والمشغّل وتتغيّر دورياً — لا ننشر مبالغ تتقادم. '
        'الثابت هو السلّم: 15 يوماً بلا غرامة، ثم المثل حتى اليوم 45، ثم أربعة الأمثال. '
        'وملصق HGS نفسه برسم رمزي عند الإصدار.')
WARN = ('لا تؤجّل الدفع: بعد اليوم 45 تدفع خمسة أمثال أجر العبور إجمالاً. ومهلة الاعتراض 15 '
        'يوماً من التبليغ. والملصق مربوط باللوحة — بيع السيارة دون تحديث القيد يجعل عبورات '
        'المشتري على حسابك. وOGS ملغى منذ 2022 فلا تدفع لمن يعرضه.')
SOURCE = ('قانون الطرق السريعة رقم 6001 — المادة 30 بصيغتها المعدَّلة (سلّم العبور المخالف: '
          '15 يوماً بلا غرامة، ثم المثل حتى 45 يوماً، ثم أربعة الأمثال)؛ وخدمة دفع العبور '
          'المخالف لـPTT على بوابة e-Devlet (turkiye.gov.tr)؛ واستعلام المخالفات العام لمديرية '
          'الطرق webihlaltakip.kgm.gov.tr؛ وإلغاء نظام OGS في 31/03/2022 وتحويل حساباته إلى HGS')
TAGS = ['HGS', 'الطرق السريعة', 'المرور والسيارات', 'مخالفات', 'دليل', '2026']
SEO_T = 'HGS في تركيا: الشحن، ومهلة الـ15 يوماً، واستعلام المخالفات'
SEO_D = ('HGS هو نظام العبور الوحيد (OGS ملغى منذ 2022): كيف تحصل عليه وتشحنه، وسلّم غرامة '
         'العبور بلا رصيد — 15 يوماً بلا غرامة ثم الضعف ثم خمسة الأمثال — وثلاث قنوات '
         'للاستعلام بينها استعلام KGM باللوحة وحدها.')

DETAILS = DETAILS.replace('%TRAMER%', TRAMER)
for n in ['31 آذار/مارس 2022', '15 يوماً', 'اليوم 45', 'webihlaltakip', 'traffic-fines',
          'app-plate-turkey', 'car-registration', TRAMER]:
    assert n in DETAILS, 'PREDICATE WOULD LIE: %r' % n
for dead in DEAD:
    assert ('href="/article/%s"' % dead) not in DETAILS

sql = _no_bare_percent("""-- ============================================================================
-- عنقود HGS: ثلاث صفحات لنظام واحد — وإحداها تبيع نظاماً ميّتاً
-- ============================================================================
-- hgs-highway-toll-system (737 حرفاً، 25 قراءة) يُعاد بناؤه مرجعياً كاملاً؛
-- وسلّم الغرامة فيه كان صحيحاً أصلاً ومطابقاً للمادة 30 من القانون 6001
-- المعدَّلة (15 يوماً بلا غرامة ← المثل حتى 45 ← أربعة الأمثال بعدها) —
-- بقي وتحوّل جدولاً مصدَّراً.
--
-- ويتقاعد نقضان: auto-hgs-ogs الذي ما زال عنوانه يعرض OGS — والنظام أُلغي
-- نهائياً في 31/03/2022 وحُوّلت حساباته إلى HGS — وtoll-violation-check
-- الذي كل محتواه النافع رابط استعلام KGM باللوحة، وقد طُوي في المرجعي.
--
-- لا مبالغ عبور في الصفحة عمداً: تتغيّر بالمشغّل والسنة؛ الصفحة تعلّم
-- الآلية والمُهل — وهي الثابت الذي يوفّر المال فعلاً.
--
-- آمن لإعادة التشغيل.
-- ============================================================================

UPDATE articles SET
    title = 'نظام HGS في تركيا 2026: الحصول والشحن، ومهلة الـ15 يوماً الذهبية، واستعلام المخالفات باللوحة',
    intro = '%s',
    details = '%s',
    steps = %s, tips = %s, documents = %s,
    fees = '%s', warning = '%s', source = '%s', tags = %s,
    category = 'المرور والسيارات', seo_title = '%s', seo_description = '%s',
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
       AND details LIKE '%%اليوم 45%%' AND details LIKE '%%webihlaltakip%%';
    IF n <> 1 THEN RAISE EXCEPTION 'the HGS rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug = '%s';
    IF n <> 1 THEN RAISE EXCEPTION 'duplicate slug'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug IN (%s) AND status = 'approved';
    IF n > 0 THEN RAISE EXCEPTION '%% stub(s) still approved', n; END IF;
END
$check$;

SELECT 'HGS rebuilt: ladder table + OGS-is-dead + KGM plate query' AS البند,
       (details LIKE '%%اليوم 45%%' AND details LIKE '%%2022%%')::text AS النتيجة
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'category moved to المرور والسيارات', (category = 'المرور والسيارات')::text
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'stubs retired (want 0 approved)', count(*)::text
FROM articles WHERE slug IN (%s) AND status = 'approved';
""") % (q('كل الطرق السريعة والجسور المأجورة في تركيا على نظام واحد اليوم: HGS من PTT '
          '(نظام OGS المصرفي أُلغي نهائياً في 2022). هذا الدليل يعطيك الحصول والشحن، '
          'والمعلومة التي توفّر المال فعلاً: بعد أي عبور بلا رصيد لديك 15 يوماً تدفع فيها '
          'أجر العبور فقط بلا غرامة — ثم يتضاعف، وبعد 45 يوماً يصير خمسة أمثال. '
          'واستعلام المخالفات يعمل برقم اللوحة وحده.'),
        q(DETAILS), arr(STEPS), arr(TIPS), arr(DOCS), q(FEES), q(WARN), q(SOURCE), arr(TAGS),
        q(SEO_T), q(SEO_D), CANON,
        ', '.join("'%s'" % d for d in DEAD),
        CANON, CANON, ', '.join("'%s'" % d for d in DEAD),
        CANON, CANON, ', '.join("'%s'" % d for d in DEAD))

path = os.path.join(REPO, 'sql', '2026-08-07_hgs_cluster.sql')
open(path, 'w', encoding='utf-8', newline='').write(sql)

_code = '\n'.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('المرجعي      : %s — %d ← %d حرفاً + انتقال إلى «المرور والسيارات»' % (CANON, len(c['details'] or ''), len(DETAILS)))
print('يتقاعد       : %s ← draft' % ', '.join(DEAD))
print('مصحَّح       : OGS ملغى منذ 31/03/2022 — النقض كان يعرضه في عنوانه')
print('روابط        : traffic-fines + app-plate-turkey + car-registration + %s' % TRAMER)
print('quote parity :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written      :', path, len(sql), 'chars')
