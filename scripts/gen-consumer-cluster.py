# -*- coding: utf-8 -*-
"""Consumer cluster: four scraps → one rights guide with the remedy as spine.

── the cluster ────────────────────────────────────────────────────────────

consumer-arbitration-hakem-heyeti  766 chars   4v  ← canonical: already honest
consumer-14-day-return             229 chars   4v  ← retire
consumer-common-frauds             202 chars   4v  ← retire
consumer-cybercrime-report         180 chars  19v  ← retire

All four have id == slug and zero inbound links (checked live).

── what the rebuild stands on ────────────────────────────────────────────

* The remedy: Tüketici Hakem Heyeti (Trade Ministry) — free, no lawyer,
  filed via e-Devlet (TÜBİS). The monetary threshold is republished every
  year in the Resmî Gazete — the page keeps the existing honest pattern of
  teaching the mechanism and telling the reader to check the current figure,
  rather than publishing a number that rots. Decisions bind the company;
  objection goes to the consumer court within 15 days (TKHK 6502 art. 70).
* The right: 14-day withdrawal for distance sales (TKHK 6502 + the distance
  contracts regulation) — no reason needed; the exceptions that surprise
  people (perishables, personalised items, opened hygiene-sealed goods,
  unsealed software/digital content, services already performed); and the
  rule almost nobody knows, from the regulation itself: if the seller never
  informed you of the right, you are NOT bound by the 14 days — capped in
  all cases at one year.
* The boundary stated honestly: rent disputes are OUTSIDE the committee's
  jurisdiction — routed to the rent tool instead of half-promised here.
* Fraud prevention (from the stub + officially-warned patterns): the
  fake-police/prosecutor call (authorities never ask for money or "account
  safekeeping" by phone), rental-deposit scams, fake payment links — plus
  the reporting section folded from the cybercrime stub: evidence first
  (links, chats, dates, screenshots), bank first if money moved, then
  police/prosecutor; consumer disputes go to the committee, crimes go to
  the police — two different doors, and knowing which is half the battle.

No statistics, no invented thresholds, no scare copy.
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


CANON = 'consumer-arbitration-hakem-heyeti'
DEAD = ['consumer-14-day-return', 'consumer-common-frauds', 'consumer-cybercrime-report']

c = get('articles?select=id,slug,status,details&slug=eq.' + CANON)[0]
assert c['status'] == 'approved' and c['id'] == c['slug'] and len(c['details'] or '') < 1500
for d in DEAD:
    r = get('articles?select=id,slug,status&slug=eq.' + d)
    assert r and r[0]['status'] == 'approved' and r[0]['id'] == r[0]['slug'], d
for s in ('bank-account-opening', 'gecici-koruma-hat-guncelleme-2026'):
    r = get('articles?select=status&slug=eq.' + s)
    assert r and r[0]['status'] == 'approved', s + ' not live'
import os.path
assert os.path.isdir(os.path.join(REPO, 'src/app/tools/rent-increase-calculator')), 'rent tool missing'

DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الخلاصة</strong></p>'
    '<p style="margin:0;">لك في تركيا — مقيماً كنت بأي صفة — طريقُ استردادٍ مجاني بلا محامٍ: '
    '<strong>لجنة تحكيم المستهلك</strong>، تقدّم إليها من هاتفك عبر e-Devlet وقرارها '
    '<strong>مُلزم للشركة</strong>. ولك في الشراء أونلاين <strong>حقّ رجوع 14 يوماً بلا '
    'إبداء سبب</strong>. والاحتيال بابه الاستعجال — فمن استعجلك فقد كشف نفسه.</p></div>'

    '<h2>لجنة تحكيم المستهلك: سلاحك المجاني</h2>'
    '<p>لجان تحكيم المستهلك (<span dir="ltr">Tüketici Hakem Heyeti</span>) تتبع وزارة '
    'التجارة وتنظر <strong>مجاناً</strong> في نزاعاتك مع الشركات والمتاجر والبنوك: سلعة '
    'معيبة، رسوم غير مستحقّة، خدمة لم تُنفَّذ، إعلان مضلّل.</p>'
    '<ul>'
    '<li><strong>التقديم</strong>: إلكترونياً عبر e-Devlet (نظام TÜBİS) — بلا محامٍ وبلا '
    'رسوم، وبالمستندات: فاتورة/إيصال، مراسلات، صور.</li>'
    '<li><strong>حدّ القيمة</strong>: يُعلن كل سنة في الجريدة الرسمية — ما دون الحدّ '
    'فاللجنة طريقك الإلزامي الأول، وما فوقه فمحكمة المستهلك. '
    '<strong>تحقّق من رقم السنة الجارية قبل التقديم</strong> ولا تعتمد رقماً متداولاً.</li>'
    '<li><strong>القرار مُلزم</strong>: الشركة تنفّذه، ومن أراد الطعن — أنت أو هي — '
    'فأمام محكمة المستهلك خلال <strong>15 يوماً</strong> من التبليغ (المادة 70 من قانون '
    'حماية المستهلك 6502).</li>'
    '</ul>'
    '<p><strong>وحدود اختصاصها بصراحة:</strong> نزاعات <strong>الإيجار</strong> ليست من '
    'شأنها — للإيجار مساره القانوني الخاص، وابدأ من '
    '<a href="/tools/rent-increase-calculator">حاسبة الزيادة القانونية للإيجار</a> لتعرف '
    'موقفك رقمياً.</p>'

    '<h2>حقّ الرجوع 14 يوماً في الشراء عن بُعد — والقاعدة التي لا يعرفها أحد</h2>'
    '<p>في الشراء أونلاين (والهاتف وكل بيع عن بُعد) لك <strong>الرجوع خلال 14 يوماً من '
    'الاستلام بلا إبداء أي سبب</strong> — قانون حماية المستهلك 6502 ولائحة العقود عن بُعد. '
    'المتجر لا «يتكرّم» بالإرجاع؛ هو حقّك.</p>'
    '<p><strong>والقاعدة المجهولة:</strong> إن لم يُعلمك البائع بحقّ الرجوع أصلاً — لا في '
    'الموقع ولا في الفاتورة — <strong>فلستَ مقيّداً بالأربعة عشر يوماً</strong>، وينتهي '
    'الحقّ بكل الأحوال بعد سنة. فمتجرٌ أخفى الحقّ أطال مدّته.</p>'
    '<p><strong>الاستثناءات التي تفاجئ الناس</strong> — لا رجوع في:</p>'
    '<ul>'
    '<li>السلع سريعة التلف (طعام وأشباهه).</li>'
    '<li>المصنوع خصّيصاً لك أو المخصَّص بطلبك (نقش، مقاس خاص).</li>'
    '<li>سلع العناية الشخصية المفتوحة الغلاف الصحّي.</li>'
    '<li>البرامج والمحتوى الرقمي بعد فضّ الغلاف أو بدء التنزيل.</li>'
    '<li>الخدمة التي نُفّذت فعلاً بموافقتك قبل انقضاء المدة.</li>'
    '</ul>'
    '<p>رُفض إرجاعك المستحقّ؟ وثّق الطلب والرفض — وهذه بالضبط قضيةُ لجنة التحكيم أعلاه.</p>'

    '<h2>الاحتيال الشائع على الأجانب — والقاعدة الواحدة</h2>'
    '<p>الاحتيال كلّه يستهدف شيئاً واحداً: <strong>استعجالك أو خوفك</strong>. الأنماط '
    'المتكرّرة:</p>'
    '<table><thead><tr><th>النمط</th><th>العلامة الفاضحة</th></tr></thead><tbody>'
    '<tr><td><strong>«الشرطة/النيابة» تتصل وتطلب مالاً</strong> أو «تأمين حسابك بتحويله»</td>'
    '<td>الجهات الرسمية <strong>لا تطلب مالاً ولا تحويلات هاتفياً أبداً</strong>. '
    'أغلق واتصل بـ155 بنفسك</td></tr>'
    '<tr><td><strong>عقار «مغرٍ جداً» يطلب عربوناً قبل المعاينة</strong></td>'
    '<td>لا عربون قبل رؤية العقار وعقدٍ مكتوب — أبداً</td></tr>'
    '<tr><td><strong>رابط دفع أو «تحديث بيانات» برسالة</strong></td>'
    '<td>لا تدخل بياناتك من روابط الرسائل؛ ادخل التطبيق الرسمي بنفسك '
    '(<a href="/article/bank-account-opening">حسابك البنكي</a> و'
    '<a href="/article/gecici-koruma-hat-guncelleme-2026">خطّك</a> لهما قنواتهما)</td></tr>'
    '<tr><td><strong>وسيط «يضمن» فيزا أو جنسية أو موعداً</strong></td>'
    '<td>لا أحد يضمن قراراً حكومياً — والقنوات الرسمية لا تحتاج وسيطاً</td></tr>'
    '</tbody></table>'

    '<h2>وقع الاحتيال فعلاً؟ الترتيب يصنع الفرق</h2>'
    '<ol>'
    '<li><strong>إن تحرّك مال: بنكك أولاً وفوراً</strong> — طلب تجميد/اعتراض على الحركة '
    'قبل أي شيء آخر؛ الدقائق تحسم.</li>'
    '<li><strong>احفظ الأدلّة كما هي</strong>: روابط، محادثات كاملة، أرقام، تواريخ، لقطات '
    'شاشة، إيصالات — لا تحذف المحادثة «غيظاً».</li>'
    '<li><strong>بلّغ</strong>: الشرطة (155) أو أقرب مركز — فالاحتيال جريمة تُلاحَق '
    'جنائياً، وقنوات البلاغ الإلكتروني قائمة عبر e-Devlet.</li>'
    '<li><strong>ميّز البابين</strong>: نزاعك مع متجر أو شركة ← لجنة التحكيم؛ جريمة '
    'احتيال أو اختراق ← الشرطة والنيابة. معرفة الباب الصحيح نصف المعركة.</li>'
    '</ol>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>هل تنفع اللجنة الأجنبيَّ وحاملَ الكملك؟</h3>'
    '<p>نعم — حماية المستهلك بحكم إقامتك لا جنسيتك، والتقديم عبر e-Devlet بحسابك. '
    'المستند هو ما يهم: فاتورة وإيصال ومراسلة.</p>'
    '<h3>اشتريت من السوق نقداً بلا فاتورة — ماذا أفعل؟</h3>'
    '<p>حقّك قائم نظرياً وإثباته صعب عملياً. اطلب الفاتورة/الفيش دائماً وقت الشراء — '
    'هي نصف قضيتك سلفاً.</p>'
    '<h3>المتجر يقول «البضاعة المباعة لا تُرَدّ» — لافتة على الجدار؟</h3>'
    '<p>اللافتة لا تُلغي القانون. في البيع عن بُعد حقّ الـ14 يوماً قائم بنصّه؛ وفي '
    'المتجر الحضوري السلعة <strong>المعيبة</strong> تُستبدل أو تُستردّ بأحكام العيب مهما '
    'كُتب على الجدران.</p>'
)
STEPS = [
    'وثّق من اليوم الأول: فاتورة أو إيصال لكل شراء، ولقطات للمراسلات والإعلانات.',
    'عند نزاع مع بائع: راسله كتابةً أولاً واطلب الحلّ — فالمراسلة نفسها دليل.',
    'رفض؟ تحقّق من حدّ القيمة السنوي المعلن، ثم قدّم إلى لجنة التحكيم عبر e-Devlet (TÜBİS) مجاناً.',
    'أرفق كل شيء: الفاتورة، والمراسلات، والصور — الملفّ الكامل يُغني عن الجلسات.',
    'صدر القرار؟ هو مُلزم؛ وللطعن (لك أو للشركة) محكمة المستهلك خلال 15 يوماً.',
    'وفي الاحتيال: بنكك فوراً إن تحرّك مال، ثم الأدلّة، ثم بلاغ الشرطة (155).',
]
TIPS = [
    'اللجنة مجانية وبلا محامٍ — من عرض «متابعة قضيتك باللجنة» بأجر كبير فاعرف أنّ الطريق نفسه مجاني.',
    'حدّ القيمة يتغيّر كل سنة في الجريدة الرسمية — تحقّق من رقم السنة الجارية ولا تعتمد المتداول.',
    'متجرٌ لم يُعلمك بحقّ الرجوع لم يعد يحدّك بـ14 يوماً — والسقف سنة.',
    'نزاعات الإيجار خارج اختصاص اللجنة — لها مسارها الخاص.',
    'الجهات الرسمية لا تطلب مالاً هاتفياً أبداً — «الشرطي» الذي يطلب تحويلاً محتال بلا استثناء.',
    'الفاتورة نصف القضية — اطلبها دائماً حتى في السوق.',
]
DOCS = [
    'الفاتورة أو الإيصال (الفيش) — أساس أي ملفّ',
    'المراسلات مع البائع كاملةً ولقطات الإعلان/الصفحة',
    'لملفّ اللجنة: حساب e-Devlet للتقديم عبر TÜBİS',
    'لبلاغ الاحتيال: الروابط والأرقام والتواريخ ولقطات المحادثات وإيصالات التحويل',
]
FEES = ('التقديم إلى لجنة تحكيم المستهلك مجاني بالكامل وبلا محامٍ. وبلاغ الشرطة مجاني. '
        'وحدّ القيمة الفاصل بين اللجنة ومحكمة المستهلك يُعلن سنوياً في الجريدة الرسمية — '
        'تحقّق من الرقم الجاري قبل التقديم.')
WARN = ('مهلة الطعن على قرار اللجنة 15 يوماً أمام محكمة المستهلك. ونزاعات الإيجار خارج '
        'اختصاصها. وفي الاحتيال: البنك قبل كل شيء إن تحرّك مال، ولا تحذف الأدلّة. ولا '
        'تدخل بياناتك من روابط الرسائل مهما بدت رسمية.')
SOURCE = ('قانون حماية المستهلك رقم 6502 — المادة 70 (إلزامية قرار اللجنة والطعن أمام محكمة '
          'المستهلك خلال 15 يوماً) وأحكام حقّ الرجوع؛ ولائحة العقود عن بُعد (Mesafeli '
          'Sözleşmeler Yönetmeliği): مدة الـ14 يوماً واستثناءاتها وتمديدها عند عدم الإعلام '
          'بسقف سنة؛ وبوابة وزارة التجارة tuketici.ticaret.gov.tr ونظام TÜBİS عبر e-Devlet؛ '
          'والحدّ المالي السنوي المعلن في الجريدة الرسمية')
TAGS = ['حقوق المستهلك', 'لجنة التحكيم', 'الاحتيال', 'التسوق أونلاين', 'دليل', '2026']
SEO_T = 'حقوق المستهلك في تركيا: لجنة التحكيم المجانية وحق الـ14 يوماً'
SEO_D = ('استرد حقك من أي شركة مجاناً وبلا محامٍ عبر لجنة تحكيم المستهلك من e-Devlet، '
         'وحق الرجوع 14 يوماً بلا سبب في الشراء أونلاين — ومن لم يُعلمك به فلست مقيّداً '
         'بمدته. مع جدول الاحتيال الشائع وترتيب التصرف الصحيح.')

for n in ['TÜBİS', '15 يوماً', 'المادة 70', 'بعد سنة', 'rent-increase-calculator',
          'bank-account-opening', 'gecici-koruma-hat-guncelleme-2026', '155']:
    assert n in DETAILS, 'PREDICATE WOULD LIE: %r' % n
assert not re.search(r'\d{2,3}[.,]\d{3}\s*(ليرة|TL)', DETAILS), 'a threshold figure leaked in'
for dead in DEAD:
    assert ('href="/article/%s"' % dead) not in DETAILS

sql = _no_bare_percent("""-- ============================================================================
-- عنقود حقوق المستهلك: أربع قصاصات ← دليل واحد عموده سبيل الاسترداد
-- ============================================================================
-- consumer-arbitration-hakem-heyeti (766 حرفاً) كان أصدقها — يعلّم الآلية
-- ويحيل الرقم السنوي إلى الجريدة الرسمية بدل نشر رقم يتعفّن. أُعيد بناؤه
-- دليلاً كاملاً بالعمود نفسه: اللجنة المجانية عبر TÜBİS، والقرار الملزم،
-- والطعن خلال 15 يوماً (المادة 70 من القانون 6502)، وحدود الاختصاص بصراحة
-- (الإيجار خارجه — يُحال إلى حاسبة الإيجار).
--
-- وطُويت فيه الثلاث الباقية: حقّ الـ14 يوماً بنصّه واستثناءاته وقاعدةِ
-- «من لم يُعلمك لم يَحدّك» من لائحة العقود عن بُعد (السقف سنة)؛ وجدول
-- الاحتيال الشائع بعلاماته الفاضحة («الشرطة لا تطلب مالاً هاتفياً أبداً»)؛
-- وترتيب التصرّف عند الوقوع: البنك أولاً إن تحرّك مال، ثم الأدلّة، ثم
-- البلاغ — وتمييز بابَي اللجنة والشرطة.
--
-- لا إحصاءات ولا حدود مالية منشورة ولا تهويل. الصفوف الأربعة id == slug
-- (فُحص)، ولا روابط واردة لأيٍّ منها.
--
-- آمن لإعادة التشغيل.
-- ============================================================================

UPDATE articles SET
    title = 'حقوق المستهلك في تركيا 2026: لجنة التحكيم المجانية، وحقّ الـ14 يوماً، وجدول الاحتيال الشائع',
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
       AND details LIKE '%%TÜBİS%%' AND details LIKE '%%بعد سنة%%';
    IF n <> 1 THEN RAISE EXCEPTION 'the consumer rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug IN (%s) AND status = 'approved';
    IF n > 0 THEN RAISE EXCEPTION '%% stub(s) still approved', n; END IF;
END
$check$;

SELECT 'consumer guide rebuilt (TÜBİS + 14-day + fraud table)' AS البند,
       (details LIKE '%%TÜBİS%%' AND details LIKE '%%الاستعجال%%')::text AS النتيجة
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'no stale threshold figure published',
       (details NOT LIKE '%%149%%' AND details NOT LIKE '%%104.000%%')::text
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'three stubs retired (want 0 approved)', count(*)::text
FROM articles WHERE slug IN (%s) AND status = 'approved';
""") % (q('سلعة معيبة، رسوم غير مستحقّة، إرجاع مرفوض، أو احتيال صريح؟ لك في تركيا طريق '
          'استرداد مجاني بلا محامٍ: لجنة تحكيم المستهلك عبر e-Devlet وقرارها ملزم. وهذا '
          'الدليل يجمع سلاحك كاملاً: اللجنة وكيف تقدّم إليها، وحقّ الرجوع 14 يوماً '
          'واستثناءاته والقاعدة التي تطيله سنةً، وجدول الاحتيال الشائع على الأجانب، '
          'وترتيب التصرّف الصحيح إن وقعت.'),
        q(DETAILS), arr(STEPS), arr(TIPS), arr(DOCS), q(FEES), q(WARN), q(SOURCE), arr(TAGS),
        q(SEO_T), q(SEO_D), CANON,
        ', '.join("'%s'" % d for d in DEAD),
        CANON, ', '.join("'%s'" % d for d in DEAD),
        CANON, CANON, ', '.join("'%s'" % d for d in DEAD))

path = os.path.join(REPO, 'sql', '2026-08-07_consumer_cluster.sql')
open(path, 'w', encoding='utf-8', newline='').write(sql)

_code = '\n'.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('المرجعي      : %s — %d ← %d حرفاً' % (CANON, len(c['details'] or ''), len(DETAILS)))
print('يتقاعد       : %s' % ', '.join(DEAD))
print('العمود       : اللجنة (TÜBİS، م70، 15 يوماً) + حق 14 يوماً وقاعدة السنة + جدول الاحتيال')
print('بلا أرقام    : حدّ القيمة يُحال للجريدة الرسمية — لا رقم يتعفّن')
print('quote parity :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written      :', path, len(sql), 'chars')
