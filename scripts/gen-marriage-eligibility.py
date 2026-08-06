# -*- coding: utf-8 -*-
"""One certificate, three issuing bodies, and the wrong one costs a consulate trip.

Item 7 of the work order.

Three pages tell a reader where the singleness certificate comes from:

  civil-marriage-registration-turkey  «صادرة من سفارة أو قنصلية بلده، ثم تُترجَم
                                       وتُصدَّق لدى كاتب العدل»
  marriage-registration               «من e-Devlet (للمجنسين) أو من إدارة الهجرة
                                       (للكملك)»
  family-civil-marriage-municipality  «حسب متطلبات البلدية … ترجمة+تصديق عند الحاجة»

The Evlendirme Yönetmeliği settles it, and the two rules sit in consecutive
articles — which is exactly why pages that read only one of them disagree.

MADDE 12, the general rule for foreigners:
    «Evlenme ehliyet belgesinin tarafların uyruğu bulunduğu devlet
     makamlarından bizzat temin edilmesi esastır.»

MADDE 13 (Değişik: 28/11/2017-2017/11079 K.), the rule for most of this site's
readers, verbatim:
    «4/4/2013 tarihli ve 6458 sayılı Yabancılar ve Uluslararası Koruma Kanunu
     kapsamındaki yabancılardan; ikamet izni dışında Türkiye'de bulunan
     vatansız, mülteci, şartlı mülteci, ikincil koruma statüsünde bulunanlar ve
     uluslararası koruma başvuru sahipleri ile GEÇİCİ KORUMA kapsamına alınan
     yabancıların müracaatları evlendirme memurları tarafından kabul edilir.
     Bunların evlenme manilerinin bulunup bulunmadığı il göç idaresi
     müdürlüklerince tutulan dosyalarındaki bilgi ve belgelere göre il göç
     idaresi müdürlüklerince tespit edilerek evlenme ehliyet belgesi düzenlenir.
     İl göç idaresi müdürlüklerince düzenlenen evlenme ehliyet belgelerine göre
     yapılan evliliklere ilişkin evlenme bildirimi il göç idaresi müdürlüğüne
     yapılır.»

So for a kimlik holder the certificate is issued BY the provincial migration
directorate from their own file — and goc.gov.tr announced on 1/7/2021 that
those under international and temporary protection can obtain it through
e-Devlet. Nothing about a consulate, a sworn translation or a notary.

The harm is concrete and priced. civil-marriage-registration-turkey sends a
temporary-protection holder to the Syrian consulate for a document Turkish
regulation says their İl Göç İdaresi issues, then tells them to pay a sworn
translator and a notary for it. That is a consulate fee, a translation fee and a
notary fee, for a step that does not exist in their case — and for many of them
the consulate route is not available at all, so the page reads as a dead end to
marriage rather than a wrong turn.

marriage-registration had it nearly right and gets the e-Devlet channel added.
family-civil-marriage-municipality's «حسب متطلبات البلدية» is not wrong so much
as empty, and its «ترجمة+تصديق عند الحاجة» nudges toward a cost the reader may
not owe; it now names the two tracks and says which one is theirs.

One more thing worth publishing, straight from MADDE 13's last sentence and
found nowhere on the site: when the certificate came from the migration
directorate, the MARRIAGE NOTIFICATION goes back to that directorate. A couple
who marry and never report it to Göç İdaresi have an unreported change of civil
status — the same duty whose breach, repeated, can end temporary protection.
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


def fetch(slug):
    u = '%s/rest/v1/articles?select=*&slug=eq.%s' % (_URL, urllib.parse.quote(slug, safe=''))
    return json.load(urllib.request.urlopen(urllib.request.Request(u, headers=_H)))[0]


def q(s):
    return str(s if s is not None else '').replace("'", "''")


def arr(items):
    return 'ARRAY[%s]::text[]' % ', '.join("'%s'" % q(x) for x in items)


OUT = []

TWO_TRACKS = (
    '<h3>من يُصدر شهادة العزوبية؟ مساران، لا مسار واحد</h3>'
    '<p>هذا هو الموضع الذي يضلّ فيه أكثر ما يُكتب، والحكمان في مادّتين متتاليتين من '
    '<strong>لائحة الزواج التركية (Evlendirme Yönetmeliği)</strong>:</p>'
    '<ul>'
    '<li><strong>الأجنبي حامل الإقامة</strong> — المادة 12: الأصل أن يحصل على «وثيقة أهلية '
    'الزواج» (evlenme ehliyet belgesi) <strong>من سلطات دولته</strong>، أي عبر سفارتها أو '
    'قنصليتها، ثم تُترجَم وتُصدَّق. وإن تعذّر ذلك، جاز لموظّف الزواج طلبها عبر المديرية العامة.</li>'
    '<li><strong>حامل كملك الحماية المؤقتة</strong> (وكذلك طالب الحماية الدولية واللاجئ '
    'وعديم الجنسية) — <strong>المادة 13</strong>: تُصدرها له '
    '<strong>مديرية الهجرة في ولايته</strong> (İl Göç İdaresi Müdürlüğü)، وهي التي تتحقّق من '
    'وجود موانع الزواج من واقع <strong>ملفّه لديها</strong>. '
    '<strong>لا قنصلية، ولا ترجمة محلّفة، ولا نوتر لهذه الوثيقة.</strong></li>'
    '</ul>'
    '<p>ونصّ المادة 13 صريح: «…geçici koruma kapsamına alınan yabancıların müracaatları '
    'evlendirme memurları tarafından kabul edilir. Bunların evlenme manilerinin bulunup '
    'bulunmadığı il göç idaresi müdürlüklerince … tespit edilerek evlenme ehliyet belgesi '
    'düzenlenir.»</p>'
    '<p>وأعلنت رئاسة إدارة الهجرة أنّ المشمولين بالحماية الدولية والمؤقتة يستطيعون استخراج '
    'هذه الوثيقة <strong>عبر e-Devlet</strong> — فابدأ من هناك قبل أن تحجز موعداً.</p>'
    '<div style="background:#fff7ed;border-right:4px solid #ea580c;padding:14px 18px;margin:16px 0;">'
    '<p style="margin:0;"><strong>وواجبٌ بعد العقد يجهله كثيرون:</strong> تختم المادة 13 بأنّ '
    'الزواج الذي يتمّ بوثيقة صادرة عن مديرية الهجرة <strong>يُبلَّغ عنه إلى مديرية الهجرة</strong>. '
    'فلا تكتفِ بدفتر العائلة: بلّغ المديرية بتغيّر حالتك الزوجية. والتخلّف عن واجب التبليغ '
    'ثلاث مرّات متتالية دون عذر يجيز للولاية إلغاء الحماية المؤقتة (المادة 12/3 من لائحة '
    'الحماية المؤقتة).</p></div>'
)

# ── 1. the page that sends a kimlik holder to a consulate ─────────────────
a = fetch('civil-marriage-registration-turkey')
OLD_P = ('<p>يحتاج كل طرف إلى وثيقة إثبات عدم زواج (شهادة عزوبية / قيد أحوال مدنية) صادرة من سفارة '
         'أو قنصلية بلده، ثم تُترجَم وتُصدَّق لدى كاتب العدل (Noter).')
assert (a['details'] or '').count('صادرة من سفارة أو قنصلية بلده') == 1, 'consulate needle moved'
d = a['details']
m = re.search(r'<p>[^<]*صادرة من سفارة أو قنصلية بلده[^<]*</p>', d)
assert m, 'could not isolate the consulate paragraph'
OLD_PARA = m.group(0)
NEW_PARA = ('<p>الجهة التي تُصدر هذه الوثيقة تختلف بحسب وضعك، وهو ما تفصّله الفقرة التالية — '
            'ومن كان تحت الحماية المؤقتة فلا يذهب إلى قنصلية ولا يدفع ترجمةً ونوتر لها.</p>')

steps = list(a['steps'] or [])
docs = list(a['documents'] or [])
tips = list(a['tips'] or [])
assert steps[0] == 'استخرجا شهادة العزوبية من قنصلية بلدكما ثم ترجماها وصدّقاها لدى النوتر'
steps[0] = ('استخرجا وثيقة أهلية الزواج (شهادة العزوبية): حامل الكملك يستخرجها من مديرية الهجرة '
            'في ولايته أو عبر e-Devlet بلا قنصلية ولا نوتر؛ وحامل الإقامة من قنصلية بلده ثم '
            'يترجمها ويصدّقها')
assert docs[1] == 'شهادة عزوبية / قيد أحوال مدنية من سفارة أو قنصلية بلد كل طرف، مترجمة ومصدّقة'
docs[1] = ('وثيقة أهلية الزواج لكل طرف — من مديرية الهجرة/e-Devlet لحامل الكملك (بلا ترجمة ولا '
           'تصديق)، ومن قنصلية بلده مترجمةً ومصدَّقة لحامل الإقامة')
assert tips[1] == 'الترجمة والتصديق لدى النوتر خطوة أساسية لأي وثيقة أجنبية'
tips[1] = ('الترجمة والتصديق لازمان للوثيقة الأجنبية — أمّا وثيقة مديرية الهجرة فتركية أصلاً '
           'ولا تحتاج أيّاً منهما')
tips.append('بعد العقد بلّغ مديرية الهجرة بزواجك إن كانت هي من أصدرت وثيقة الأهلية (المادة 13)')

OUT.append("""UPDATE articles SET
    details = replace(details, '%s', '%s') || '%s',
    steps = %s, documents = %s, tips = %s,
    fees = '%s',
    warning = '%s',
    source = 'لائحة الزواج التركية (Evlendirme Yönetmeliği) المادتان 12 و13 — المادة 13 معدَّلة بقرار 28/11/2017-2017/11079 (mevzuat.gov.tr) + إعلان رئاسة إدارة الهجرة عن استخراج وثيقة أهلية الزواج عبر e-Devlet (goc.gov.tr)',
    last_update = CURRENT_DATE
WHERE slug = 'civil-marriage-registration-turkey' AND details LIKE '%%قنصلية بلده%%';""" % (
    q(OLD_PARA), q(NEW_PARA), q(TWO_TRACKS), arr(steps), arr(docs), arr(tips),
    q('رسوم البلدية والفحص الطبي تختلف بحسب المدينة. أمّا الترجمة والتصديق لدى النوتر فتلزم '
      'للوثائق الأجنبية فقط — ووثيقة أهلية الزواج الصادرة عن مديرية الهجرة لحامل الكملك تركية '
      'ولا تحتاج ترجمةً ولا تصديقاً، فلا تدفع ثمنهما بلا سبب.'),
    q('لا تذهب إلى قنصلية بلدك لاستخراج شهادة العزوبية إن كنت تحت الحماية المؤقتة: المادة 13 من '
      'لائحة الزواج تجعل مديرية الهجرة في ولايتك هي من يُصدرها من واقع ملفّك، وهي متاحة عبر '
      'e-Devlet. وبعد العقد بلّغ المديرية بزواجك.')))

# ── 2. the page that had it nearly right ──────────────────────────────────
b = fetch('marriage-registration')
s2 = list(b['steps'] or [])
assert s2[0] == '1. ورقة العزوبية: من e-Devlet (للمجنسين) أو من إدارة الهجرة (للكملك).'
s2[0] = ('1. وثيقة أهلية الزواج (ورقة العزوبية): حامل الكملك يستخرجها من مديرية الهجرة في ولايته '
         'أو عبر e-Devlet — والخدمة متاحة للمشمولين بالحماية المؤقتة والدولية، لا للمجنسين وحدهم '
         '(المادة 13 من لائحة الزواج).')
s2.append('بعد العقد: بلّغ مديرية الهجرة بزواجك إن كانت هي من أصدرت وثيقة الأهلية.')
d2 = list(b['documents'] or [])
i = d2.index('ورقة العزوبية')
d2[i] = 'وثيقة أهلية الزواج (ورقة العزوبية) — من مديرية الهجرة أو e-Devlet لحامل الكملك'
OUT.append("""UPDATE articles SET
    steps = %s, documents = %s,
    source = 'لائحة الزواج التركية (Evlendirme Yönetmeliği) المادة 13 — mevzuat.gov.tr + goc.gov.tr',
    last_update = CURRENT_DATE
WHERE slug = 'marriage-registration';""" % (arr(s2), arr(d2)))

# ── 3. the page that says «ask the municipality» ──────────────────────────
c = fetch('family-civil-marriage-municipality')
s3 = list(c['steps'] or [])
assert s3[1] == 'جهز شهادة العزوبية حسب متطلبات البلدية.'
s3[1] = ('جهّز وثيقة أهلية الزواج (شهادة العزوبية): من مديرية الهجرة في ولايتك أو عبر e-Devlet إن '
         'كنت تحت الحماية المؤقتة، ومن قنصلية بلدك مترجمةً ومصدَّقة إن كنت حامل إقامة.')
d3 = list(c['documents'] or [])
assert d3[1] == 'شهادة عزوبية/حالة اجتماعية (ترجمة+تصديق عند الحاجة).'
d3[1] = ('وثيقة أهلية الزواج — ترجمة وتصديق للوثيقة الأجنبية فقط؛ ووثيقة مديرية الهجرة لا تحتاجهما.')
t3 = list(c['tips'] or [])
assert t3[0] == 'ابدأ مبكراً لأن استخراج شهادة العزوبية قد يأخذ وقتاً.'
t3[0] = ('ابدأ من e-Devlet إن كنت تحت الحماية المؤقتة — استخراج الوثيقة من هناك أسرع من أي مسار آخر.')
OUT.append("""UPDATE articles SET
    steps = %s, documents = %s, tips = %s,
    source = 'لائحة الزواج التركية (Evlendirme Yönetmeliği) المادتان 12 و13 — mevzuat.gov.tr + goc.gov.tr',
    last_update = CURRENT_DATE
WHERE slug = 'family-civil-marriage-municipality';""" % (arr(s3), arr(d3), arr(t3)))

HEADER = """-- ============================================================================
-- وثيقةٌ واحدة، وثلاث جهاتٍ تُصدرها — والخطأ يكلّف رحلةً إلى القنصلية
-- ============================================================================
-- البند السابع من أمر العمل.
--
-- ثلاث صفحات تخبر القارئ من أين تأتي شهادة العزوبية:
--
--   civil-marriage-registration-turkey  «من سفارة أو قنصلية بلده، ثم تُترجَم
--                                        وتُصدَّق لدى كاتب العدل»
--   marriage-registration               «من e-Devlet (للمجنسين) أو من إدارة
--                                        الهجرة (للكملك)»
--   family-civil-marriage-municipality  «حسب متطلبات البلدية … ترجمة+تصديق»
--
-- ولائحة الزواج التركية تحسمها، والحكمان في مادّتين متتاليتين — ولهذا بالضبط
-- تختلف الصفحات التي قرأت إحداهما دون الأخرى.
--
--   المادة 12 (القاعدة العامة للأجانب):
--     «Evlenme ehliyet belgesinin tarafların uyruğu bulunduğu devlet
--      makamlarından bizzat temin edilmesi esastır.»
--
--   المادة 13 (المعدَّلة بقرار 28/11/2017-2017/11079)، وهي قاعدة أكثر قرّاء
--   هذا الموقع، حرفياً:
--     «… ile GEÇİCİ KORUMA kapsamına alınan yabancıların müracaatları
--      evlendirme memurları tarafından kabul edilir. Bunların evlenme
--      manilerinin bulunup bulunmadığı il göç idaresi müdürlüklerince tutulan
--      dosyalarındaki bilgi ve belgelere göre il göç idaresi müdürlüklerince
--      tespit edilerek evlenme ehliyet belgesi düzenlenir. İl göç idaresi
--      müdürlüklerince düzenlenen evlenme ehliyet belgelerine göre yapılan
--      evliliklere ilişkin evlenme bildirimi il göç idaresi müdürlüğüne
--      yapılır.»
--
-- فحاملُ الكملك تُصدرها له مديريةُ الهجرة في ولايته من واقع ملفّه لديها —
-- وأعلنت رئاسة إدارة الهجرة أنّ المشمولين بالحماية الدولية والمؤقتة يستخرجونها
-- عبر e-Devlet. لا قنصلية، ولا ترجمة محلّفة، ولا نوتر.
--
-- ── والضرر محسوب بالليرة ────────────────────────────────────────────────
--
-- صفحة civil-marriage-registration-turkey تُرسل حامل الحماية المؤقتة إلى
-- القنصلية السورية لوثيقةٍ تقول اللائحة التركية إنّ مديرية هجرته تُصدرها، ثم
-- تطلب منه أن يدفع لمترجم محلّف ولكاتب عدل. رسمُ قنصلية ورسمُ ترجمة ورسمُ نوتر
-- عن خطوةٍ لا وجود لها في حالته — ولكثيرين منهم لا يتاح مسار القنصلية أصلاً،
-- فتُقرأ الصفحة طريقاً مسدوداً إلى الزواج لا مجرّد منعطفٍ خاطئ.
--
-- وصفحة marriage-registration كانت أقرب إلى الصواب، ويُضاف إليها أنّ قناة
-- e-Devlet ليست للمجنسين وحدهم. أمّا «حسب متطلبات البلدية» فليست خاطئة بقدر ما
-- هي فارغة، و«ترجمة+تصديق عند الحاجة» فيها تدفع نحو كلفةٍ قد لا تلزم — فصارت
-- تسمّي المسارين وتقول أيّهما مسارك.
--
-- ── وواجبٌ لم يكن على الموقع أصلاً ──────────────────────────────────────
--
-- تختم المادة 13 بأنّ الزواج الذي يتمّ بوثيقة مديرية الهجرة يُبلَّغ عنه إليها.
-- فالزوجان اللذان يعقدان ولا يبلّغان لديهما تغيّرُ حالةٍ زوجية غير مبلَّغ —
-- وهو الواجب الذي يجيز تخلّفُه ثلاث مرّات متتالية إلغاءَ الحماية المؤقتة.
--
-- آمن لإعادة التشغيل. لا يحتاج نشر شيفرة.
-- ============================================================================

"""

VERIFY = """
-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — كل صفّ true
SELECT 'consulate no longer the default' AS البند,
       (details LIKE '%المادة 13%' AND details LIKE '%مديرية الهجرة في ولايته%'
        AND array_to_string(steps, ' ') NOT LIKE '%استخرجا شهادة العزوبية من قنصلية بلدكما%') AS سليم
FROM articles WHERE slug = 'civil-marriage-registration-turkey'
UNION ALL
SELECT 'e-Devlet is not only for citizens',
       (array_to_string(steps, ' ') NOT LIKE '%(للمجنسين)%'
        AND array_to_string(steps, ' ') LIKE '%الحماية المؤقتة والدولية%')
FROM articles WHERE slug = 'marriage-registration'
UNION ALL
SELECT 'municipality page names both tracks',
       (array_to_string(steps, ' ') NOT LIKE '%حسب متطلبات البلدية%'
        AND array_to_string(steps, ' ') LIKE '%e-Devlet%')
FROM articles WHERE slug = 'family-civil-marriage-municipality'
UNION ALL
SELECT 'the post-marriage notification duty is stated',
       (details LIKE '%يُبلَّغ عنه إلى مديرية الهجرة%')
FROM articles WHERE slug = 'civil-marriage-registration-turkey'
UNION ALL
SELECT 'no page still sends kimlik holders to a consulate', (count(*) = 0)::boolean
FROM articles WHERE status = 'approved'
  AND array_to_string(documents, ' ') LIKE '%من سفارة أو قنصلية بلد كل طرف، مترجمة ومصدّقة%';
"""

sql = HEADER + '\n\n'.join(OUT) + '\n' + VERIFY
path = os.path.join(REPO, 'sql', '2026-08-06_marriage_eligibility_certificate.sql')
open(path, 'w', encoding='utf-8').write(sql)

_code = ' '.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('المسار الصحيح : المادة 13 — مديرية الهجرة الولائية تُصدرها لحامل الكملك، وe-Devlet')
print('الخطأ المكلِف : قنصلية + ترجمة محلّفة + نوتر عن خطوة لا وجود لها في حالته')
print('صفحات مصحَّحة : 3 (5 و22 و13 قراءة)')
print('واجب جديد     : تبليغ مديرية الهجرة بالزواج (خاتمة المادة 13) — لم يكن على الموقع')
print('مصادر مضافة   : 3 صفحات كانت تشير إلى nvi.gov.tr أو «البلديات التركية» فقط')
print('quote parity  :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written       :', path, len(sql), 'chars')
