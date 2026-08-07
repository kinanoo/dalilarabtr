# -*- coding: utf-8 -*-
"""Medical tourism: four pages, three of them selling unsourced dollar prices.

── the cluster ────────────────────────────────────────────────────────────

medical-tourism-guide    554 chars  6 views  id≠slug  ← canonical (UPDATE)
medical-tourism-dental   469 chars  8 views  id≠slug  ← retire
medical-tourism-eyes     640 chars  8 views  id≠slug  ← retire
hair-transplant-guide    294 chars  5 views  id==slug ← retire

Three of the four rows have id != slug — the upsert trap again, so the
canonical rebuild is an UPDATE by slug, and the retirements are UPDATEs
anyway. The dental and eyes stubs carry dollar price tables with NO source
field at all («تلبيسات الزيركون: 150-300$ للسن»…) — exactly the content
class this site refuses. The hair stub is the only honest one (licensed
centre warning, FUE/DHI, what the price includes) and its substance folds
into the canonical.

── what the rebuild stands on (verified) ─────────────────────────────────

The Health Ministry's international health tourism regulation: facilities
need the Uluslararası Sağlık Turizmi Yetki Belgesi issued by the Ministry;
INTERMEDIARIES — the "medical travel agencies" people actually book with —
need authorization from USHAŞ (the state international health services
company), which also runs the official HealthTürkiye portal. The updated
regulation phases in complication insurance and TÜSKA accreditation with
transition periods through 2025-2026. That authorization check, not a price
table, is the page's spine.

── and what is refused ───────────────────────────────────────────────────

Every dollar figure. Prices vary by case, clinic and season; every "price
list" online is marketing; the honest comparator is a written, itemised
quote from an AUTHORIZED provider set against the authorization check. The
page says that explicitly, and teaches the questions instead: what the
quote includes (medication, aftercare, revision policy), the complication
plan, and who pays if you must return.

TP holders' treatment inside Turkey is NOT medical tourism — routed to the
health-system page up top (the CLAUDE.md audience rule).
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


CANON = 'medical-tourism-guide'
DEAD = ['medical-tourism-dental', 'medical-tourism-eyes', 'hair-transplant-guide']

c = get('articles?select=id,slug,status,details&slug=eq.' + CANON)[0]
assert c['status'] == 'approved' and len(c['details'] or '') < 1500, 'already rebuilt'
for d in DEAD:
    r = get('articles?select=status&slug=eq.' + d)
    assert r and r[0]['status'] == 'approved', d
for s in ('turkey-medical-visa', 'syria-temporary-protection-health-2026', 'sgk-gss-health-insurance-turkey-2026'):
    r = get('articles?select=status&slug=eq.' + s)
    assert r and r[0]['status'] == 'approved', s + ' not live'

DETAILS = (
    '<div style="background:#eff6ff;border-right:4px solid #3b82f6;padding:14px 18px;margin:0 0 20px;">'
    '<p style="margin:0;"><strong>لمن هذه الصفحة؟</strong> لمن يأتي تركيا قاصداً علاجاً '
    'مدفوعاً (أسنان، عيون، شعر، تجميل…). أمّا المقيم تحت الحماية المؤقتة وعلاجه داخل '
    'النظام الصحي فشأنه آخر تماماً — موضعه '
    '<a href="/article/syria-temporary-protection-health-2026">الصحة للحماية المؤقتة</a> '
    'و<a href="/article/sgk-gss-health-insurance-turkey-2026">التأمين الصحي SGK/GSS</a>.</p></div>'

    '<h2>القاعدة التي تسبق كل شيء: العلاج الدولي في تركيا نشاط مرخَّص</h2>'
    '<p>السياحة العلاجية في تركيا تحكمها لائحة رسمية لوزارة الصحة، وعليها جهتا ترخيص:</p>'
    '<ul>'
    '<li><strong>المنشأة الصحية</strong> (مستشفى/عيادة) تحتاج <strong>وثيقة تخويل السياحة '
    'العلاجية الدولية</strong> (<span dir="ltr">Uluslararası Sağlık Turizmi Yetki '
    'Belgesi</span>) من وزارة الصحة.</li>'
    '<li><strong>الوسيط</strong> — الشركات التي يحجز الناس عبرها فعلاً — يحتاج تخويلاً من '
    '<strong>USHAŞ</strong>، الشركة الحكومية للخدمات الصحية الدولية، وهي التي تدير البوّابة '
    'الرسمية <span dir="ltr">HealthTürkiye</span>.</li>'
    '</ul>'
    '<p>فسؤالك الأول لأي عيادة أو وسيط ليس «كم السعر؟» بل: <strong>«أروني وثيقة '
    'التخويل»</strong>. مقدّم بلا تخويل = خارج المظلّة الرسمية كلّها: لا رقابة، ولا مسار '
    'شكوى، ولا تأمين مضاعفات.</p>'
    '<p>واللائحة المحدَّثة تُدخل تدريجياً (بمُهل تمتدّ في 2025–2026) إلزام المنشآت المخوَّلة '
    'بـ<strong>تأمين المضاعفات</strong> وباعتماد هيئة الجودة التركية <strong>TÜSKA</strong> — '
    'فاسأل عنهما صراحةً؛ وجودهما علامة جدّية، والاعتماد الدولي (مثل JCI) مكمّل لا بديل عن '
    'التخويل الرسمي.</p>'

    '<h2>لماذا لا تجد هنا جدول أسعار — وهذه حمايتك لا نقصنا</h2>'
    '<p>كل «قائمة أسعار» تراها على الإنترنت لعلاج الأسنان أو الليزك أو زراعة الشعر هي '
    '<strong>تسويق</strong>: السعر الحقيقي يتوقّف على حالتك أنت، والعيادة، والموسم. المقارنة '
    'الصادقة الوحيدة هي <strong>عرض سعر مكتوب ومفصَّل باسمك</strong> من مقدّم مخوَّل، '
    'يذكر بنداً بنداً ما يشمله وما لا يشمله. ومن أغراك برقم قبل أن يرى حالتك فقد أخبرك '
    'شيئاً عن أسلوبه لا عن كلفتك.</p>'

    '<h2>الأسئلة التي تكشف الجادّ من البائع — لكل علاج</h2>'
    '<h3>الأسنان (تلبيسات، زراعة، فينير)</h3>'
    '<ul>'
    '<li>اطلب <strong>خطة علاج مكتوبة</strong> بعد الفحص/الأشعة — لا «باقة» قبل رؤية فمك.</li>'
    '<li>الزراعة تحتاج غالباً <strong>زيارتين</strong> بينهما أشهر التئام — من وعدك بأسنان '
    'كاملة في أسبوع واحد فاسأله كيف.</li>'
    '<li>اسأل: ما مادة التلبيسة تحديداً؟ وما ضمانها؟ ومن يعالج مضاعفةً بعد رجوعك؟</li>'
    '</ul>'
    '<h3>العيون (ليزك وأخواتها)</h3>'
    '<ul>'
    '<li>ليست لكل عين: دون <strong>18 سنة</strong> أو بوصفة نظر غير مستقرّة لا يُجرى '
    'التصحيح — والفحص الأول هو ما يقرّر أهليّتك وأي تقنية تناسبك، لا إعلان العيادة.</li>'
    '<li>اسأل عن فحص سماكة القرنية وجفاف العين قبل أي التزام.</li>'
    '<li>عيادة تعدك بالتقنية الأغلى قبل فحصك تبيع اسم التقنية لا علاجاً.</li>'
    '</ul>'
    '<h3>زراعة الشعر</h3>'
    '<ul>'
    '<li>النجاح في <strong>الفريق والخطة والتعقيم والمتابعة</strong> — لا في السعر ولا في '
    'وعود «عدد بصيلات» ضخمة؛ الوعود غير الواقعية بعدد البصيلات أشهر أسباب النتائج السيئة.</li>'
    '<li>افهم التقنية المعروضة (FUE/DHI) وما الفرق في حالتك أنت.</li>'
    '<li>اسأل ماذا يشمل السعر بالضبط: الفحص، والأدوية، والغسيل، وجلسات المتابعة — '
    'وكم تستغرق النتيجة الكاملة (شهوراً، لا أياماً).</li>'
    '</ul>'

    '<h2>قبل أن تدفع: عقدك وخطة الطوارئ</h2>'
    '<ol>'
    '<li><strong>عرض مكتوب مفصَّل</strong>: الإجراء، والمواد، وعدد الجلسات، وما يشمله '
    'وما لا يشمله، وسياسة التصحيح إن لم تنجح النتيجة.</li>'
    '<li><strong>خطة المضاعفات</strong>: من يعالجك إن حدثت؟ وعلى حساب من؟ وماذا لو ظهرت '
    'بعد رجوعك إلى بلدك؟</li>'
    '<li><strong>لا تدفع كامل المبلغ مقدّماً</strong>، واحتفظ بكل إيصال وتقرير طبي '
    'وصور قبل/بعد.</li>'
    '<li><strong>مترجم</strong> إن لم تُتقن التركية — موافقتك على إجراء لم تفهمه '
    'ليست موافقة.</li>'
    '</ol>'

    '<h2>التأشيرة والمجيء</h2>'
    '<p>القادم للعلاج له مسار تأشيرة خاص بوثائقه — تقرير الحالة، ومراسلة المستشفى، وما '
    'يقوّي الملف: <a href="/article/turkey-medical-visa">الفيزا العلاجية لتركيا: الوثائق '
    'والخطوات</a>.</p>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>هل يغطّي التأمين هذه العلاجات؟</h3>'
    '<p>العلاجات التجميلية والاختيارية خارج التغطية عادةً — لا SGK ولا أكثر التأمينات '
    'الخاصة. احسبها نفقةً كاملة من جيبك، ومعها تذاكر السفر والإقامة وزيارة المتابعة.</p>'
    '<h3>كيف أتحقّق من أنّ العيادة مخوَّلة؟</h3>'
    '<p>اطلب وثيقة التخويل نفسها، وتحقّق عبر القنوات الرسمية (وزارة الصحة / USHAŞ / بوّابة '
    'HealthTürkiye). ولا تكتفِ بشهادات على الجدران ولا بتقييمات المنصّات.</p>'
    '<h3>عرضوا عليّ «باقة شاملة بالفندق والمواصلات» — جيّدة؟</h3>'
    '<p>الباقة ليست عيباً — العيب أن يكون مقدّمها وسيطاً بلا تخويل USHAŞ، أو أن تُغني '
    'فخامةُ الفندق عن سؤال العقد والمضاعفات. الفندق يُقارَن آخراً لا أولاً.</p>'
)
STEPS = [
    'حدّد علاجك واطلب من كل مقدّم مرشَّح وثيقة التخويل الرسمية (المنشأة من الوزارة، والوسيط من USHAŞ).',
    'أرسل حالتك (تقارير، أشعة، صور) واطلب خطة علاج وعرض سعر مكتوبين مفصَّلين باسمك.',
    'قارن العروض المكتوبة بنودها لا أرقامها الإجمالية: ما المشمول؟ وما سياسة التصحيح والمضاعفات؟',
    'رتّب التأشيرة العلاجية بوثائقها إن كنت قادماً من الخارج.',
    'قبل الدفع: عقد مكتوب، ودفعة جزئية لا كاملة، ومترجم إن لزم.',
    'احتفظ بكل تقرير وإيصال وصور قبل/بعد — وخطّط لزيارة المتابعة قبل حجز العودة.',
]
TIPS = [
    'سؤالك الأول «أروني وثيقة التخويل» — لا «كم السعر».',
    'لا جدول أسعار صادقاً على الإنترنت: المقارنة الوحيدة عروضٌ مكتوبة باسمك من مقدّمين مخوَّلين.',
    'الوسيط الذي تحجز عبره يحتاج تخويل USHAŞ — لا يكفي أن تكون العيادة النهائية جيدة.',
    'اسأل عن تأمين المضاعفات واعتماد TÜSKA — اللائحة المحدَّثة تُدخلهما تدريجياً.',
    'الزراعة (أسنان) غالباً زيارتان، ونتيجة الشعر شهور — الوعود الأسرع علامة إنذار.',
    'العلاج الاختياري خارج تغطية التأمين عادةً — احسبه نفقة كاملة مع السفر والمتابعة.',
]
DOCS = [
    'تقاريرك وأشعّتك الحالية لإرسالها قبل أي عرض سعر',
    'عرض السعر وخطة العلاج مكتوبين من المقدّم المخوَّل',
    'للقادم من الخارج: ملف الفيزا العلاجية (تقرير الحالة ومراسلة المستشفى)',
    'جواز السفر، وإثبات الدفع الجزئي، ونسخ كل ما توقّعه',
]
FEES = ('لا ننشر أسعار علاجات — كل رقم متداول تسويق لا معلومة، والسعر الحقيقي يتوقّف على '
        'حالتك والعيادة. المقارنة الصادقة عروض مكتوبة مفصَّلة باسمك من مقدّمين مخوَّلين. '
        'وأضف دائماً كلفة السفر والإقامة وزيارة المتابعة.')
WARN = ('مقدّم بلا وثيقة تخويل (الوزارة للمنشآت، وUSHAŞ للوسطاء) خارج المظلّة الرسمية: لا '
        'رقابة ولا مسار شكوى. ولا تدفع كامل المبلغ مقدّماً، ولا توقّع ما لم تفهمه. وهذه '
        'الصفحة ليست نصيحة طبية — قرار أهليّتك لأي إجراء يصدر عن الفحص الطبي لا عن '
        'الإعلانات.')
SOURCE = ('لائحة السياحة العلاجية الدولية وصحّة السائح لوزارة الصحة التركية (Uluslararası '
          'Sağlık Turizmi ve Turistin Sağlığı Hakkında Yönetmelik) — وثيقة التخويل للمنشآت '
          'من الوزارة وللوسطاء من USHAŞ (ushas.gov.tr) والبوّابة الرسمية HealthTürkiye؛ '
          'ومتطلّبا تأمين المضاعفات واعتماد TÜSKA بمُهل انتقالية في اللائحة المحدَّثة')
TAGS = ['السياحة العلاجية', 'الصحة والتأمين', 'زراعة الشعر', 'علاج الأسنان', 'دليل', '2026']
SEO_T = 'السياحة العلاجية في تركيا: تحقّق من التخويل قبل السعر'
SEO_D = ('المنشأة تحتاج تخويل وزارة الصحة والوسيط تخويل USHAŞ — هذا سؤالك الأول لا السعر. '
         'أسئلة تكشف الجادّ في الأسنان والعيون وزراعة الشعر، وعقدك وخطة المضاعفات، '
         'والفيزا العلاجية — بلا جداول أسعار تسويقية.')

for n in ['Yetki', 'USHAŞ', 'HealthTürkiye', 'TÜSKA', 'turkey-medical-visa',
          'syria-temporary-protection-health-2026', 'FUE', '18 سنة']:
    assert n in DETAILS, 'PREDICATE WOULD LIE: %r' % n
assert '$' not in DETAILS and 'دولار' not in DETAILS, 'a price leaked in'
for dead in DEAD:
    assert ('href="/article/%s"' % dead) not in DETAILS

sql = _no_bare_percent("""-- ============================================================================
-- عنقود السياحة العلاجية: أربع صفحات، ثلاث منها تبيع أسعاراً بلا مصدر
-- ============================================================================
-- medical-tourism-guide (554 حرفاً) يُعاد بناؤه مرجعياً حول ما يحمي القارئ
-- فعلاً: إطار الترخيص الرسمي — وثيقة التخويل للمنشآت من وزارة الصحة،
-- وللوسطاء (الشركات التي يحجز الناس عبرها فعلاً) من USHAŞ، والبوّابة
-- الرسمية HealthTürkiye، ومتطلّبا تأمين المضاعفات واعتماد TÜSKA اللذان
-- تُدخلهما اللائحة المحدَّثة بمُهل حتى 2026.
--
-- وتتقاعد ثلاث: صفحتا الأسنان والعيون تحملان جداول أسعار بالدولار بلا حقل
-- مصدر إطلاقاً («تلبيسات الزيركون: 150-300$ للسن»…) — وهذا صنف المحتوى
-- الذي يرفضه الموقع لا يرقّعه؛ وصفحة الشعر الوحيدة الصادقة (تحذير الترخيص،
-- FUE/DHI، ما يشمله السعر) طُوي جوهرها في المرجعي.
--
-- ثلاثة من الصفوف الأربعة id فيها لا يساوي slug — ففخّ الـupsert قائم،
-- والإدماج كلّه UPDATE بالـslug.
--
-- ولا سعر واحد في الصفحة عمداً — والصفحة تشرح للقارئ لماذا غيابه حمايته:
-- المقارنة الصادقة الوحيدة عرض مكتوب مفصَّل باسمه من مقدّم مخوَّل.
--
-- آمن لإعادة التشغيل.
-- ============================================================================

UPDATE articles SET
    title = 'السياحة العلاجية في تركيا 2026: تحقّق من التخويل قبل السعر — الأسنان والعيون وزراعة الشعر',
    intro = '%s',
    details = '%s',
    steps = %s, tips = %s, documents = %s,
    fees = '%s', warning = '%s', source = '%s', tags = %s,
    category = 'الصحة والتأمين', seo_title = '%s', seo_description = '%s',
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
       AND details LIKE '%%USHAŞ%%' AND details LIKE '%%TÜSKA%%';
    IF n <> 1 THEN RAISE EXCEPTION 'the rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug = '%s' AND details LIKE '%%150-300%%';
    IF n > 0 THEN RAISE EXCEPTION 'a marketing price survived'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug IN (%s) AND status = 'approved';
    IF n > 0 THEN RAISE EXCEPTION '%% stub(s) still approved', n; END IF;
END
$check$;

SELECT 'canonical rebuilt on the authorization framework' AS البند,
       (details LIKE '%%USHAŞ%%' AND details LIKE '%%HealthTürkiye%%')::text AS النتيجة
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'no dollar prices anywhere', (details NOT LIKE '%%$%%')::text
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'three stubs retired (want 0 approved)', count(*)::text
FROM articles WHERE slug IN (%s) AND status = 'approved';
""") % (q('تركيا وجهة علاج دولية كبيرة — والفارق بين تجربة ناجحة وكارثة ليس السعر بل '
          'التخويل: المنشأة تحتاج وثيقة تخويل من وزارة الصحة، والوسيط الذي تحجز عبره '
          'يحتاج تخويل USHAŞ. هذا الدليل يعطيك سؤال التحقّق الأول، والأسئلة التي تكشف '
          'الجادّ من البائع في الأسنان والعيون وزراعة الشعر، وعقدك وخطة المضاعفات — '
          'ولن تجد فيه جدول أسعار، وستعرف لماذا غيابه حمايتك.'),
        q(DETAILS), arr(STEPS), arr(TIPS), arr(DOCS), q(FEES), q(WARN), q(SOURCE), arr(TAGS),
        q(SEO_T), q(SEO_D), CANON,
        ', '.join("'%s'" % d for d in DEAD),
        CANON, CANON, ', '.join("'%s'" % d for d in DEAD),
        CANON, CANON, ', '.join("'%s'" % d for d in DEAD))

path = os.path.join(REPO, 'sql', '2026-08-07_medical_tourism_cluster.sql')
open(path, 'w', encoding='utf-8', newline='').write(sql)

_code = '\n'.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('المرجعي      : %s — %d ← %d حرفاً (UPDATE: id≠slug في 3 من 4)' % (CANON, len(c['details'] or ''), len(DETAILS)))
print('يتقاعد       : %s' % ', '.join(DEAD))
print('حُذف         : كل الأسعار الدولارية غير المُسنَدة — والصفحة تشرح لماذا')
print('بُني على     : تخويل الوزارة + تخويل USHAŞ للوسطاء + HealthTürkiye + TÜSKA')
print('quote parity :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written      :', path, len(sql), 'chars')
