# -*- coding: utf-8 -*-
"""V-87: the page never says what the code blocks, then sells a lawsuit for it.

Item 9 of the work order. return-code-v87, 98 views.

Almost everyone who opens this page has one question: I went back to Syria — can
I return to Turkey? The page does not answer it. In 455 characters it never once
says what V-87 actually does.

The site's own audited code table says it plainly:

  security_codes.V87 — «عودة طوعية», category إداري
    description   «يُوضع على السوريين المشمولين بالحماية المؤقتة الذين غادروا
                   تركيا طوعياً … يمنع العودة لتركيا إلا بمراجعة المديرية
                   المحلية وموافقتها»
    how_to_remove «تُقدّم مراجعة للمديرية المحلية … يُرفع بقرار المديرية المحلية»

So: it blocks re-entry, and it is lifted by an administrative decision of the
provincial directorate. Neither fact is on the page.

WHAT THE PAGE SAYS INSTEAD, AND WHAT IT COSTS.

  «يتطلب عادةً تكليف محامٍ لإزالته»
  steps  → راجع … التماس … «استعن بمحامٍ تركي لرفع دعوى في المحكمة الإدارية»
         → «انتظر قرار المحكمة (عدة أشهر أو أكثر)»
  warning «يجب التحرك خلال 60 يوماً من التبليغ. التأخير يُفقدك حق الطعن.»

It routes a reader into a paid lawyer and an administrative lawsuit for
something the site's own audited data says is an application to a directorate.
And the sixty days is worse than merely expensive. The sixty-day limit in Law
2577 is the window to file an ANNULMENT ACTION against an administrative act —
real, and worth stating for anyone who wants to contest the code itself. But the
page presents it as the deadline for V-87 generally, so a reader eight months
past their return concludes the door is shut. It is not: the code is lifted when
you apply to return and the directorate evaluates. Telling someone their right
to come back expired is the most damaging thing this page could do, and it says
it in the warning field.

The description is also loose in a way that matters: «عند الشك بمخالفة استوجبت
العودة أو عند العودة الطوعية» folds a suspected violation into the same code.
V-87 is the voluntary-return code, category إداري — not a security finding.
Someone who reads "suspected violation" about themselves behaves differently at
a counter than someone who knows their file says "left voluntarily".

Kept: the sixty-day annulment window, correctly scoped to whoever wants to
challenge the code rather than apply under it, and the warning against
non-lawyers selling legal services.
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


def fetch(t, c, s):
    u = '%s/rest/v1/%s?select=*&%s=eq.%s' % (_URL, t, c, urllib.parse.quote(s, safe=''))
    return json.load(urllib.request.urlopen(urllib.request.Request(u, headers=_H)))[0]


def q(s):
    return str(s if s is not None else '').replace("'", "''")


def arr(items):
    return 'ARRAY[%s]::text[]' % ', '.join("'%s'" % q(x) for x in items)


a = fetch('articles', 'slug', 'return-code-v87')
code = fetch('security_codes', 'code', 'V87')
assert 'يمنع العودة لتركيا' in (code['description'] or ''), 'the audited entry changed'
assert 'يتطلب عادةً تكليف محامٍ لإزالته' in (a['details'] or ''), 'the lawyer claim moved'

D = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الجواب المختصر: نعم، يمكن أن تعود — '
    'لكن بموافقة.</strong></p>'
    '<p style="margin:0;">كود <strong>V-87</strong> هو كود «العودة الطوعية». يُوضع على المشمول '
    'بالحماية المؤقتة الذي غادر تركيا بإرادته، و<strong>يمنع دخوله إلى تركيا مجدَّداً إلا '
    'بمراجعة المديرية المحلية وموافقتها</strong>. أي أنّه ليس منعاً أبدياً، وليس قراراً جزائياً — '
    'بل قيدٌ إداري يُرفع بقرار من المديرية بعد تقييم حالتك.</p></div>'

    '<h2>ما هو V-87 بالضبط</h2>'
    '<p>تصنيفه في جدول الأكواد المدقَّق عندنا <strong>«إداري»</strong>، لا أمني. واسمه بالتركية '
    '<strong>Gönüllü Geri Dönüş</strong> — العودة الطوعية. ومعناه في السجلّ أنّك غادرت تركيا '
    'باختيارك وأنت مسجَّل تحت الحماية المؤقتة.</p>'
    '<p><strong>وهذا يصحّح خلطاً شائعاً:</strong> V-87 ليس كود «مخالفة» ولا «اشتباه أمني». '
    'ومن يقرأ عن نفسه أنّه متّهم بمخالفة يتصرّف عند الشبّاك غير من يعرف أنّ ملفّه يقول '
    '«غادر طوعاً». فاعرف ما يقوله ملفّك قبل أن تراجع.</p>'

    '<h2>كيف يُرفع؟ بمراجعة، لا بدعوى</h2>'
    '<p>المسار الأصلي بسيط وإداري: <strong>تُقدَّم مراجعة إلى المديرية المحلية</strong> في المكان '
    'الذي أنت فيه، فتُقيَّم حالتك، و<strong>يُرفع الكود بقرار المديرية</strong>. لا محكمة، ولا '
    'دعوى، ولا شرط توكيل محامٍ.</p>'
    '<p>وكانت هذه الصفحة تقول إنّ رفعه «يتطلب عادةً تكليف محامٍ»، وتوجّهك إلى دعوى أمام المحكمة '
    'الإدارية وانتظار أشهر. ذلك مسارٌ آخر لغرضٍ آخر، ونشرحه أدناه — لكنّه ليس الطريق المعتاد، '
    'ولا ينبغي أن يكون أوّل ما تدفع من أجله.</p>'

    '<h2>ومتى تلزم الدعوى فعلاً؟</h2>'
    '<p>الدعوى وسيلةُ من يريد <strong>الطعن في القرار نفسه</strong> — أي أن يقول إنّ الكود '
    'وُضع خطأً أو بغير سند. ومهلة دعوى الإلغاء أمام المحكمة الإدارية '
    '<strong>ستّون يوماً من تاريخ التبليغ</strong> بموجب قانون المحاكمات الإدارية رقم 2577.</p>'
    '<div style="background:#fff7ed;border-right:4px solid #ea580c;padding:14px 18px;margin:16px 0;">'
    '<p style="margin:0 0 8px;"><strong>وانتبه إلى ما لا تعنيه هذه الستّون يوماً.</strong></p>'
    '<p style="margin:0;">كانت هذه الصفحة تقول «التأخير يُفقدك حق الطعن» بإطلاق، فيقرؤها من '
    'مضى على عودته ثمانية أشهر على أنّ الباب أُغلق في وجهه. <strong>ليس كذلك.</strong> '
    'انقضاء الستّين يوماً يُسقط مهلة <em>دعوى الإلغاء</em> وحدها. أمّا مراجعة المديرية لطلب '
    'رفع الكود عند رغبتك بالعودة فليست مقيَّدة بها — ومدّة الكود نفسه «غير محدَّدة»، أي أنّه '
    'يبقى حتى يُرفع، لا أنّه يصير نهائياً بعد مدّة.</p></div>'

    '<h2>وقبل أن تدفع لأحد</h2>'
    '<p>ابدأ بالمراجعة الإدارية ولا تفترض أنّك تحتاج محامياً. وإن قرّرت التوكيل — لطعنٍ أو '
    'لحالة معقّدة — فأجور المحاماة غير منشورة في أي تعرفة رسمية وتختلف بحسب المحامي والقضية؛ '
    'اطلب عرضاً مكتوباً ولا تعتمد رقماً متداولاً. ولا تُوكّل غير محامٍ مقيَّد في النقابة.</p>'

    '<p style="margin-top:1.2rem;">وللسياق: '
    '<a href="/article/voluntary-return-syria-procedure-2026">إجراءات العودة الطوعية</a> • '
    '<a href="/article/syria-turkey-border-crossings-2026">العبور بين سوريا وتركيا</a> • '
    '<a href="/article/tahdit-entry-restriction-codes-how-to-object">أكواد التقييد والاعتراض عليها</a> • '
    '<a href="/codes/V87">صفحة الكود في جدول الأكواد</a></p>'
)

STEPS = [
    'اعرف أولاً ما يقوله ملفّك: راجع إدارة الهجرة أو المديرية المحلية واسأل عن سبب الكود '
    'واطلبه مكتوباً — لا تبنِ على تخمين.',
    'إن كان سببه العودة الطوعية (وهو الأصل في V-87): قدّم مراجعة إلى المديرية المحلية في مكان '
    'وجودك تطلب فيها تقييم حالتك ورفع الكود. هذا مسارٌ إداري ولا يشترط محامياً.',
    'جهّز ما يدعم طلبك: ما يثبت هويتك وتسجيلك السابق، وسبب مغادرتك، وسبب رغبتك بالعودة.',
    'انتظر قرار المديرية — فهي الجهة التي تُقيّم وترفع الكود.',
    'وإن كان الكود موضوعاً خطأً وأردت الطعن فيه لا الطلب بموجبه: وكّل محامياً مقيَّداً في '
    'النقابة وارفع دعوى إلغاء أمام المحكمة الإدارية خلال ستّين يوماً من التبليغ.',
    'احتفظ بكل ورقة: التبليغ، وإيصال المراجعة، وأي قرار — فهي ما تُبنى عليه أي خطوة تالية.',
]

TIPS = [
    'V-87 يمنع الدخول مجدَّداً حتى تُوافق المديرية — لا يُلغي تسجيلك ولا يُعدّ قراراً جزائياً.',
    'تصنيفه «إداري» لا «أمني»؛ فلا تعامله معاملة أكواد الأمن العام ولا تشترِ له «حلّاً أمنياً».',
    'الطريق المعتاد لرفعه مراجعةٌ إدارية — ابدأ بها قبل أن تدفع أتعاب محاماة.',
    'الستّون يوماً مهلةُ دعوى الإلغاء وحدها؛ انقضاؤها لا يمنعك من طلب رفع الكود عند رغبتك بالعودة.',
    'مدّة الكود «غير محدَّدة»: يبقى حتى يُرفع بقرار، ولا يتحوّل إلى منع نهائي بمرور الوقت.',
    'لا تُوكّل غير محامٍ مقيَّد في النقابة، ولا تدفع لمن يعدك بـ«رفع الكود من الداخل».',
]

DOCS = [
    'وثيقة تبليغ الكود من إدارة الهجرة (إن وُجدت)',
    'ما يثبت هويتك وتسجيلك السابق تحت الحماية المؤقتة',
    'ما يوضّح ظروف مغادرتك وسبب رغبتك بالعودة',
    'توكيل محامٍ مقيَّد في النقابة — عند اختيار مسار الطعن القضائي فقط',
]

FEES = ('المراجعة الإدارية لدى المديرية لا تُعرف لها رسوم منشورة. أمّا أتعاب المحاماة — إن '
        'اخترت مسار الطعن — فغير منشورة في أي تعرفة رسمية وتختلف بحسب المحامي وتعقيد القضية؛ '
        'اطلب عرضاً مكتوباً قبل التوكيل.')

WARNING = ('V-87 يمنع دخولك تركيا مجدَّداً حتى تُوافق المديرية المحلية — وهذه هي المعلومة التي '
           'تعنيك. ولا تقرأ مهلة الستّين يوماً على أنّها نهاية الطريق: هي مهلة دعوى الإلغاء '
           'أمام المحكمة الإدارية فقط، ولا تمنعك بعد انقضائها من مراجعة المديرية لطلب رفع '
           'الكود عند رغبتك بالعودة. وابدأ بالمراجعة الإدارية قبل أن تدفع أتعاب محاماة.')

SOURCE = ('جدول الأكواد المدقَّق على /codes — الكود V87 «العودة الطوعية / Gönüllü Geri Dönüş» '
          '(تصنيف إداري، يُرفع بقرار المديرية المحلية) + قانون المحاكمات الإدارية رقم 2577 '
          'لمهلة دعوى الإلغاء + رئاسة إدارة الهجرة (goc.gov.tr)')

TAGS = ['travel-permit', 'V-87', 'أكواد المنع', 'العودة الطوعية', 'الحماية المؤقتة', 'العودة إلى تركيا']

sql = """-- ============================================================================
-- V-87: الصفحة لا تقول ما الذي يمنعه الكود، ثم تبيع دعوى قضائية من أجله
-- ============================================================================
-- البند التاسع من أمر العمل. صفحة return-code-v87، 98 قراءة.
--
-- من يفتح هذه الصفحة يسأل سؤالاً واحداً غالباً: عدتُ إلى سوريا — هل أستطيع
-- الرجوع إلى تركيا؟ والصفحة لا تجيبه. في 455 حرفاً لا تقول مرّةً واحدة ما الذي
-- يفعله V-87.
--
-- وجدول الأكواد المدقَّق عندنا يقولها صريحةً:
--
--   security_codes.V87 — «عودة طوعية»، تصنيف إداري
--     description   «يُوضع على السوريين المشمولين بالحماية المؤقتة الذين غادروا
--                    تركيا طوعياً … يمنع العودة لتركيا إلا بمراجعة المديرية
--                    المحلية وموافقتها»
--     how_to_remove «تُقدّم مراجعة للمديرية المحلية … يُرفع بقرار المديرية»
--
-- أي أنّه يمنع الدخول مجدَّداً، ويُرفع بقرارٍ إداري من المديرية. ولا واحدة من
-- الحقيقتين على الصفحة.
--
-- ── وما تقوله الصفحة بدلاً منهما، وكم يكلّف ─────────────────────────────
--
--   «يتطلب عادةً تكليف محامٍ لإزالته»
--   steps  ← «استعن بمحامٍ تركي لرفع دعوى في المحكمة الإدارية»
--          ← «انتظر قرار المحكمة (عدة أشهر أو أكثر)»
--   warning «يجب التحرك خلال 60 يوماً من التبليغ. التأخير يُفقدك حق الطعن.»
--
-- فهي تسوق القارئ إلى محامٍ بأجر ودعوى إدارية عن أمرٍ تقول بيانات الموقع
-- المدقَّقة إنّه مراجعةٌ لدى مديرية. والستّون يوماً أسوأ من كونها مكلفة: مهلة
-- الستّين يوماً في القانون 2577 هي نافذة دعوى الإلغاء ضدّ قرار إداري — حقيقية،
-- وتستحقّ الذكر لمن يريد الطعن في الكود نفسه. لكنّ الصفحة تقدّمها مهلةً لـV-87
-- عموماً، فيقرؤها من مضى على عودته ثمانية أشهر على أنّ الباب أُغلق. وليس كذلك:
-- الكود يُرفع حين تطلب العودة وتُقيّم المديرية حالتك. وإخبار إنسان بأنّ حقّه في
-- العودة سقط هو أشدّ ما تستطيع هذه الصفحة أن تفعله به — وتقوله في حقل التحذير.
--
-- والوصف فضفاض بما يضرّ: «عند الشك بمخالفة استوجبت العودة أو عند العودة
-- الطوعية» يطوي «اشتباه مخالفة» في الكود نفسه. وV-87 كود العودة الطوعية،
-- تصنيفه إداري لا أمني. ومن يقرأ عن نفسه أنّه متّهم بمخالفة يتصرّف عند الشبّاك
-- غير من يعرف أنّ ملفّه يقول «غادر طوعاً».
--
-- ويبقى ما يستحقّ البقاء: نافذة الستّين يوماً منسوبةً إلى من يريد الطعن لا إلى
-- من يطلب بموجب الكود، والتحذير من غير المحامين ممّن يبيعون خدمات قانونية.
--
-- آمن لإعادة التشغيل. لا يحتاج نشر شيفرة.
-- ============================================================================

UPDATE articles SET
    title = 'كود V-87 (العودة الطوعية): يمنع دخولك تركيا حتى تُوافق المديرية — وكيف يُرفع فعلاً',
    details = '%s',
    steps = %s, tips = %s, documents = %s,
    fees = '%s', warning = '%s', source = '%s', tags = %s,
    last_update = CURRENT_DATE
WHERE slug = 'return-code-v87' AND details LIKE '%%يتطلب عادةً تكليف محامٍ%%';

-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — كل صفّ true
SELECT 'says what the code blocks' AS البند,
       (details LIKE '%%يمنع دخوله إلى تركيا مجدَّداً%%' AND title LIKE '%%يمنع دخولك تركيا%%') AS سليم
FROM articles WHERE slug = 'return-code-v87'
UNION ALL
SELECT 'the administrative route comes first',
       (details LIKE '%%بمراجعة، لا بدعوى%%'
        AND array_to_string(steps, ' ') LIKE '%%لا يشترط محامياً%%')
FROM articles WHERE slug = 'return-code-v87'
UNION ALL
SELECT 'the 60 days is scoped, not a door closing',
       (details NOT LIKE '%%التأخير يُفقدك حق الطعن%%'
        AND details LIKE '%%يُسقط مهلة%%'
        AND warning LIKE '%%لا تمنعك بعد انقضائها%%')
FROM articles WHERE slug = 'return-code-v87'
UNION ALL
SELECT 'no longer calls it a suspected violation',
       (details NOT LIKE '%%الشك بمخالفة استوجبت العودة%%' AND details LIKE '%%تصنيفه%%إداري%%')
FROM articles WHERE slug = 'return-code-v87'
UNION ALL
SELECT 'every internal link is a live article', (count(*) = 3)::boolean
FROM articles WHERE status = 'approved' AND slug IN
  ('voluntary-return-syria-procedure-2026', 'syria-turkey-border-crossings-2026',
   'tahdit-entry-restriction-codes-how-to-object');
""" % (q(D), arr(STEPS), arr(TIPS), arr(DOCS), q(FEES), q(WARNING), q(SOURCE), arr(TAGS))

path = os.path.join(REPO, 'sql', '2026-08-06_v87_what_it_blocks.sql')
open(path, 'w', encoding='utf-8').write(sql)

_code = ' '.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('الجواب المفقود : «يمنع دخولك تركيا حتى تُوافق المديرية» — في العنوان وأول سطر')
print('المسار الصحيح  : مراجعة إدارية تُرفع بقرار المديرية، لا دعوى ولا محامٍ')
print('الستّون يوماً   : تُنسَب إلى دعوى الإلغاء وحدها — لا «سقط حقّك في العودة»')
print('التصنيف        : إداري لا أمني، و«اشتباه مخالفة» يخرج من التعريف')
print('خطوات : %d ← %d | نصائح : %d ← %d | وثائق : %d ← %d | وسوم : %d ← %d'
      % (len(a['steps'] or []), len(STEPS), len(a['tips'] or []), len(TIPS),
         len(a['documents'] or []), len(DOCS), len(a['tags'] or []), len(TAGS)))
print('رسوم          : None ← نصّ يميّز المراجعة المجانية عن أتعاب الطعن')
print('quote parity  :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written       :', path, len(sql), 'chars')
