# -*- coding: utf-8 -*-
"""«بعد 5 سنوات … الإقامة الدائمة» — wrong number, wrong permit, wrong promise.

Item 6 of the work order.

turkey-work-visa-guide, 35 views, `source` empty, ends its tips with:

    «بعد 5 سنوات من العمل والإقامة، يمكن للمتقدم التقديم على الإقامة الدائمة»

Seven other pages on this site say eight, and one of them —
uzun-donem-ikamet-turkey-8-yil-2026, sourced to goc.gov.tr — explains the rule
properly. So the site already holds the answer; this page was never checked
against it. A reader planning on five years discovers at year five that three
more are required, and by then the plan is the thing that failed.

Reading Law 6735 verbatim from mevzuat.gov.tr turned up more than the number.
The whole tips block is a garbled version of a real rule, and the parts it
omits are the ones that actually end applications:

  tips[0]  «مدة صلاحية تأشيرة العمل في تركيا:» — a dangling heading rendered
           as a bullet that says nothing.
  tips[1]  «تصدر تأشيرة العمل لمدة عام واحد» — no. The «Çalışma Meşruhatlı
           Vize» is an ENTRY visa issued for at most 90 days (mfa.gov.tr). One
           year is the first WORK PERMIT. The page merges two documents.
  tips[2]  the extension ladder is roughly right but omits the condition that
           decides it — art. 10(2) grants up to two years «aynı işverene bağlı
           olarak», and art. 10 closes with «farklı bir işveren yanında
           çalışmak üzere yapılan başvurular bu maddenin birinci fıkrası
           kapsamında değerlendirilir»: change employer and the clock resets to
           one year. Nobody who reads only this page would know that.
  tips[3]  five years → eight, and there are TWO eight-year rules, neither of
           them called «الإقامة الدائمة»: art. 42 of Law 6458 gives long-term
           RESIDENCE after eight years of continuous legal residence, and art.
           10(3) of Law 6735 gives an indefinite WORK PERMIT to someone holding
           long-term residence or at least eight years of legal work permit —
           and adds that meeting the conditions «yabancıya mutlak hak
           sağlamaz».

And two hard deadlines the page never mentions:

  art. 12(2)  a permit granted on an application from abroad requires you to
              enter Turkey within SIX MONTHS of its validity starting, «Bu süre
              içinde Türkiye'ye gelmeyen yabancının çalışma izni iptal edilir».
  art. 7(8)   a complete application is decided within thirty days; missing
              documents defer it for at most thirty more, then it is rejected.

Plus the fact that removes a whole imagined step: art. 12(1), the work permit —
and the work-permit exemption — «ikamet izni yerine geçer». There is no separate
residence permit to apply for.

The document list had its own problem: «حجز فندقي وتذكرة طيران مؤكدة», copied
from a tourist-visa checklist. The consular list for a work visa is the
employment contract, the company's invitation letter, its activity certificate
and signature circular, address registration, criminal record and diploma —
no hotel, no ticket.

Also fixed here: `tags` was `['', '']`, two empty strings, which the tag-chip
renderer turns into two blank chips. A sweep of all 235 approved articles found
this is the only row with that shape.
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


a = fetch('turkey-work-visa-guide')
assert 'بعد 5 سنوات من العمل والإقامة' in ' '.join(a['tips'] or []), 'the 5-year claim moved'
assert (a['tags'] or []) == ['', ''], 'tags changed: %r' % a['tags']

# ── the block that replaces the guesswork ─────────────────────────────────
BLOCK = (
    '<h2>الفيزا ليست الإذن — وهذا أصل كل الالتباس</h2>'
    '<p>يخلط كثيرون بين وثيقتين مختلفتين تماماً:</p>'
    '<ul>'
    '<li><strong>تأشيرة العمل (Çalışma Meşruhatlı Vize)</strong> — تأشيرة '
    '<strong>دخول</strong> تمنحها القنصلية، وتُعطى لمدة <strong>تسعين يوماً على الأكثر</strong> '
    'بنصّ وزارة الخارجية التركية. مهمّتها إيصالك إلى تركيا، لا أكثر.</li>'
    '<li><strong>إذن العمل (Çalışma İzni)</strong> — هو ما يبيح لك العمل والإقامة، وتمنحه وزارة '
    'العمل والضمان الاجتماعي.</li>'
    '</ul>'
    '<p><strong>ولا تحتاج إذن إقامة منفصلاً:</strong> تنصّ المادة 12 من قانون القوى العاملة '
    'الدولية رقم 6735 على أنّ إذن العمل — <em>وكذلك وثيقة الإعفاء من إذن العمل</em> — '
    '«يقوم مقام إذن الإقامة» بموجب المادة 27 من القانون 6458. وتضيف المادة نفسها عكس ذلك: '
    'امتلاكك إقامةً لأي سبب آخر <strong>لا يمنحك حقّ العمل</strong>.</p>'

    '<h2>مدد إذن العمل، وما يُعيدك إلى نقطة الصفر</h2>'
    '<p>المادة 10 من القانون 6735 تضبط المدد:</p>'
    '<ul>'
    '<li>الطلب الأول: <strong>سنة واحدة كحدّ أقصى</strong>، وبما لا يتجاوز مدّة عقد العمل، '
    'ومقيَّد بمكان عمل وعمل محدَّدين.</li>'
    '<li>التمديد الأول: <strong>سنتان كحدّ أقصى</strong> — بشرط أن يكون <strong>لدى صاحب '
    'العمل نفسه</strong> (aynı işverene bağlı olarak).</li>'
    '<li>التمديدات التالية: <strong>ثلاث سنوات كحدّ أقصى</strong>.</li>'
    '</ul>'
    '<p><strong>وهذه هي الجملة التي تغيّر الحساب كلّه</strong>، وتُختم بها المادة: الطلب المقدَّم '
    'للعمل <strong>لدى صاحب عمل مختلف</strong> يُعامَل معاملة <strong>الطلب الأول</strong>. أي '
    'أنّ تغيير الشركة يُنزلك إلى سقف السنة الواحدة من جديد، ويعيد بناء رصيدك من الصفر. '
    'فمن يخطّط لسنوات العمل يجب أن يحسب هذا قبل أن يغيّر وظيفته.</p>'

    '<h2>موعدان يُسقطان الطلب</h2>'
    '<ul>'
    '<li><strong>ستة أشهر للدخول.</strong> من مُنح إذن العمل بناءً على طلب من الخارج عليه أن '
    'يدخل تركيا خلال ستة أشهر من بدء سريان الإذن. ونصّ المادة 12/2 صريح: من لم يأتِ خلال هذه '
    'المدّة <strong>يُلغى إذن عمله</strong>.</li>'
    '<li><strong>ثلاثون يوماً للبتّ.</strong> الطلب المستوفي يُبتّ خلال ثلاثين يوماً '
    '(المادة 7/8). وإن نقصت وثيقة، يُؤجَّل النظر حتى تُستكمل بحدٍّ أقصى ثلاثين يوماً، ثم '
    '<strong>يُرفض</strong> (المادة 7/7). فالنقص ليس تأخيراً، بل عدّاد.</li>'
    '</ul>'

    '<h2>وبعد ثماني سنوات — لا خمس</h2>'
    '<p>كانت هذه الصفحة تقول إنّ «الإقامة الدائمة» تُطلب بعد خمس سنوات. هذا غير صحيح، '
    'ولا يوجد في القانون التركي وصفٌ اسمه «الإقامة الدائمة» في هذا السياق. هناك مساران، '
    'وكلاهما عند <strong>ثماني سنوات</strong>:</p>'
    '<ul>'
    '<li><strong>الإقامة طويلة الأمد (Uzun Dönem İkamet)</strong> — المادة 42 من القانون 6458: '
    'ثماني سنوات إقامة نظامية متواصلة، مع شروط المادة 43 (ألّا تكون تلقّيت مساعدة اجتماعية في '
    'السنوات الثلاث الأخيرة، ودخل كافٍ ومنتظم، وتأمين صحي ساري، وألّا تشكّل تهديداً للنظام '
    'العام). و<a href="/article/uzun-donem-ikamet-turkey-8-yil-2026">التفصيل الكامل هنا</a>.</li>'
    '<li><strong>إذن العمل غير محدّد المدّة (Süresiz Çalışma İzni)</strong> — المادة 10/3 من '
    'القانون 6735: يستطيع طلبَه من يحمل إقامةً طويلة الأمد <em>أو</em> من له ثماني سنوات إذن '
    'عمل نظامي على الأقلّ.</li>'
    '</ul>'
    '<p>ونصّ المادة 10/3 يضيف تحفّظاً يجب أن يُقرأ: استيفاء الشروط '
    '<strong>«لا يمنح الأجنبي حقّاً مطلقاً»</strong> — أي أنّ الطلب يبقى خاضعاً للتقدير. '
    'ومن حصل على الإذن غير محدّد المدّة يتمتّع بحقوق الإقامة طويلة الأمد وبحقوق المواطنين، '
    'عدا حقّ الانتخاب والترشّح وتولّي الوظائف العامة، ولا تلزمه الخدمة العسكرية (المادة 10/4).</p>'

    '<div style="background:#fff7ed;border-right:4px solid #ea580c;padding:14px 18px;margin:18px 0;">'
    '<p style="margin:0 0 8px;"><strong>وإن كنت سورياً تحت الحماية المؤقتة، فهذه الصفحة ليست مسارك.</strong></p>'
    '<p style="margin:0 0 8px;">مسارك هو <strong>وثيقة الإعفاء من إذن العمل</strong> '
    '(çalışma izni muafiyeti)، وتُقدَّم داخل تركيا إلى الوزارة مباشرةً بموجب المادة 13 من القانون '
    '6735. وهي بدورها تقوم مقام إذن الإقامة.</p>'
    '<p style="margin:0;">والأهمّ: المادة 42 من القانون 6458 تستثني المشمولين بالحماية المؤقتة '
    'صراحةً من الانتقال إلى الإقامة طويلة الأمد، ومدّة الكملك <strong>لا تُحتسب</strong> ضمن '
    'الثماني سنوات. فمن بنى حسابه على سنوات الكملك بنى على فراغ — '
    '<a href="/article/uzun-donem-ikamet-turkey-8-yil-2026">التفصيل هنا</a>.</p></div>'

    '<p style="margin-top:1.2rem;">وللمقارنة بأنواع التأشيرات: '
    '<a href="/article/turkey-visa-types-2026">أنواع التأشيرات التركية</a> • '
    'وللإعفاءات: <a href="/article/work-permit-exemption-2026">الإعفاء من إذن العمل</a> • '
    'وللحدّ الأدنى للراتب المطلوب: '
    '<a href="/article/foreigner-minimum-salary-2026">راتب الأجنبي الأدنى</a></p>'
)
assert '6735' not in (a['details'] or ''), 'correction block already applied'

STEPS = [
    'تأكّد أولاً أنّ لديك عقد عمل موقَّعاً مع شركة تركية — بلا صاحب عمل لا يوجد طلب أصلاً، '
    'فهو من يقدّم الشقّ الأهمّ.',
    'قدّم طلب التأشيرة في السفارة أو القنصلية التركية في بلد جنسيتك أو إقامتك الدائمة، '
    'واحصل على رقم الطلب.',
    'ثمّ يقدّم صاحب العمل في تركيا طلب إذن العمل إلى وزارة العمل والضمان الاجتماعي مرفقاً '
    'برقم طلبك — وهذه الخطوة عليه لا عليك، فتابعه فيها.',
    'أكمل أي نقص فوراً: الطلب المستوفي يُبتّ خلال ثلاثين يوماً، والناقص يُؤجَّل ثلاثين يوماً '
    'كحدٍّ أقصى ثمّ يُرفض.',
    'بعد صدور الإذن: ادخل تركيا خلال ستّة أشهر من بدء سريانه — وإلا أُلغي الإذن بنصّ المادة 12/2.',
    'لا تقدّم طلب إقامة منفصلاً: إذن العمل يقوم مقام إذن الإقامة (المادة 12/1).',
    'وإن أردت تغيير صاحب العمل لاحقاً، اعلم أنّ الطلب الجديد يُعامَل معاملة الطلب الأول '
    'بسقف سنة واحدة.',
]

TIPS = [
    'التأشيرة للدخول فقط ومدّتها تسعون يوماً كحدّ أقصى؛ أمّا ما يبيح العمل والإقامة فهو إذن العمل.',
    'إذن العمل الأول سنة، والتمديد الأول سنتان — بشرط البقاء لدى صاحب العمل نفسه — ثم ثلاث سنوات.',
    'تغيير صاحب العمل يُعيدك إلى سقف السنة الواحدة ويعيد بناء رصيد السنوات من الصفر.',
    'ستة أشهر لدخول تركيا بعد صدور الإذن، وإلا أُلغي — وهذا أكثر ما يُهدر بلا داعٍ.',
    'الإقامة طويلة الأمد بعد ثماني سنوات لا خمس، والإذن غير محدّد المدّة كذلك عند ثماني سنوات.',
    'واستيفاء الشروط لا يمنح حقّاً مطلقاً بنصّ القانون — فلا تعتبر الموافقة مضمونة.',
    'حامل الكملك لا يسلك هذا المسار: مساره وثيقة الإعفاء، ومدّة الكملك لا تُحتسب ضمن الثماني سنوات.',
    'لا تدفع لوسيط مقابل «تسريع» الإذن — المدد منصوص عليها في القانون ولا تُشترى.',
]

DOCS = [
    'جواز سفر ساري المفعول لمدة لا تقل عن 6 أشهر بعد تاريخ السفر، مع صفحات فارغة.',
    'صورة بيومترية حديثة بخلفية بيضاء.',
    'استمارة طلب التأشيرة (تُملأ وتُوقَّع).',
    'وثيقة السجل العدلي (شهادة عدم محكومية).',
    'شهادة المؤهل العلمي (دبلوم أو بكالوريوس أو شهادة مهنية) مع كشف العلامات.',
    'وثيقة تسجيل العنوان في بلدك.',
    'ترجمة معتمدة للوثائق إلى التركية أو الإنجليزية.',
    'عقد العمل الأصلي موقَّعاً من صاحب العمل والعامل، يحدّد الراتب وشروط الوظيفة.',
    'خطاب دعوة رسمي من الشركة موجَّه إلى القنصلية.',
    'وثيقة نشاط الشركة (Faaliyet Belgesi) وسجلّ التواقيع (İmza Sirküleri).',
    'إثبات دفع الضرائب والتأمينات الاجتماعية للشركة.',
]

FEES = ('رسم التأشيرة يختلف بحسب الجنسية والقنصلية — راجع visa.gov.tr أو القنصلية. ورسم إذن '
        'العمل وبدل الوثيقة يُدفعان في تركيا بعد الموافقة، ومقاديرهما تُحدَّث سنوياً، فتحقّق من '
        'الرقم الساري قبل الدفع.')

WARNING = ('لا تخطّط على «خمس سنوات ثم إقامة دائمة» — الرقم ثماني سنوات، والوصف القانوني إقامة '
           'طويلة الأمد أو إذن عمل غير محدّد المدّة، واستيفاء الشروط لا يمنح حقّاً مطلقاً. '
           'وانتبه إلى موعدين يُسقطان كل ما بنيته: ستة أشهر لدخول تركيا بعد صدور الإذن، وثلاثون '
           'يوماً كحدّ أقصى لاستكمال أي نقص في الطلب. وحامل كملك الحماية المؤقتة خارج هذا المسار '
           'أصلاً: مدّة الكملك لا تُحتسب ضمن الثماني سنوات.')

SOURCE = ('قانون القوى العاملة الدولية رقم 6735 — المواد 7 و10 و12 و13 (mevzuat.gov.tr) + '
          'قانون الأجانب والحماية الدولية رقم 6458 — المادتان 42 و43 + صفحة المعلومات العامة '
          'للتأشيرات لدى وزارة الخارجية التركية (mfa.gov.tr) وقوائم الوثائق القنصلية')

TAGS = ['إذن عمل', 'تأشيرة عمل', 'إقامة طويلة الأمد', 'قانون 6735', 'العمل في تركيا', '2026']

sql = """-- ============================================================================
-- «بعد 5 سنوات … الإقامة الدائمة» — رقمٌ خطأ، ووثيقةٌ خطأ، ووعدٌ خطأ
-- ============================================================================
-- البند السادس من أمر العمل.
--
-- صفحة turkey-work-visa-guide، 35 قراءة، وحقل المصدر فيها فارغ، تُنهي نصائحها بـ:
--
--     «بعد 5 سنوات من العمل والإقامة، يمكن للمتقدم التقديم على الإقامة الدائمة»
--
-- وسبع صفحات أخرى على الموقع تقول ثماني سنوات، وإحداها —
-- uzun-donem-ikamet-turkey-8-yil-2026 ومصدرها goc.gov.tr — تشرح القاعدة كما هي.
-- فالموقع يملك الجواب، وهذه الصفحة لم تُقابَل به قطّ. ومن خطّط على خمس سنوات
-- يكتشف في السنة الخامسة أنّ عليه ثلاثاً أخرى، وقد صارت الخطّة نفسها هي ما فشل.
--
-- ── وقراءة القانون 6735 حرفياً من mevzuat.gov.tr ردّت أكثر من الرقم ────────
--
-- بلوك النصائح كلّه صيغةٌ مشوَّشة عن قاعدة حقيقية، وما أسقطه منها هو الذي
-- يُسقط الطلبات فعلاً:
--
--   tips[0]  «مدة صلاحية تأشيرة العمل في تركيا:» — عنوانٌ معلَّق يُصيَّر بنداً
--            لا يقول شيئاً.
--   tips[1]  «تصدر تأشيرة العمل لمدة عام واحد» — لا. تأشيرة العمل تأشيرةُ
--            دخولٍ تُعطى تسعين يوماً على الأكثر بنصّ وزارة الخارجية. والسنة
--            مدّةُ إذن العمل. الصفحة تدمج وثيقتين.
--   tips[2]  سلّم التمديد قريبٌ من الصواب لكنّه يُسقط الشرط الذي يحكمه:
--            المادة 10/2 تمنح السنتين «aynı işverene bağlı olarak»، وتُختم
--            المادة بأنّ الطلب لدى صاحب عمل مختلف يُعامَل معاملة الطلب الأول —
--            أي أنّ تغيير الشركة يعيدك إلى سقف السنة. ومن قرأ هذه الصفحة
--            وحدها لا يعلم ذلك.
--   tips[3]  خمسٌ تصير ثماني، وهناك قاعدتا «ثماني سنوات» لا واحدة، وليس
--            اسم أيٍّ منهما «الإقامة الدائمة»: المادة 42 من القانون 6458
--            للإقامة طويلة الأمد، والمادة 10/3 من القانون 6735 لإذن العمل
--            غير محدّد المدّة — وتضيف أنّ استيفاء الشروط
--            «yabancıya mutlak hak sağlamaz».
--
-- وموعدان لا تذكرهما الصفحة إطلاقاً:
--
--   م.12/2  من مُنح الإذن بطلبٍ من الخارج عليه دخول تركيا خلال ستة أشهر من
--           بدء سريانه، و«Bu süre içinde Türkiye'ye gelmeyen yabancının
--           çalışma izni iptal edilir».
--   م.7/8   الطلب المستوفي يُبتّ خلال ثلاثين يوماً؛ والناقص يُؤجَّل ثلاثين
--           يوماً كحدٍّ أقصى ثمّ يُرفض.
--
-- وواقعةٌ تحذف خطوةً متخيَّلة بأكملها: المادة 12/1 — إذن العمل، ووثيقة
-- الإعفاء منه كذلك، «تقوم مقام إذن الإقامة». فلا إقامة تُطلب على حدة.
--
-- ── وقائمة الوثائق كان فيها عيبها الخاصّ ────────────────────────────────
--
-- «حجز فندقي وتذكرة طيران مؤكدة» منقولةٌ عن قائمة تأشيرة سياحية. والقائمة
-- القنصلية لتأشيرة العمل هي عقد العمل وخطاب الدعوة ووثيقة نشاط الشركة وسجلّ
-- التواقيع وتسجيل العنوان والسجل العدلي والشهادة — لا فندق ولا تذكرة.
--
-- ويُصلَح هنا أيضاً: حقل tags كان ['', '']، سلسلتين فارغتين يحوّلهما مُصيِّر
-- الوسوم إلى شارتين فارغتين. ومسحُ الـ235 مقالاً المعتمَدة كلّها أظهر أنّ هذا
-- الصفّ هو الوحيد بهذا الشكل.
--
-- آمن لإعادة التشغيل. لا يحتاج نشر شيفرة.
-- ============================================================================

UPDATE articles SET
    title = 'تأشيرة العمل وإذن العمل في تركيا 2026: الفرق بينهما، والمدد، والمواعيد التي تُسقط الطلب',
    details = details || '%s',
    steps = %s,
    tips = %s,
    documents = %s,
    fees = '%s',
    warning = '%s',
    source = '%s',
    tags = %s,
    last_update = CURRENT_DATE
WHERE slug = 'turkey-work-visa-guide'
  AND details NOT LIKE '%%6735%%';

-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — كل صفّ true
SELECT 'the 5-year claim is gone' AS البند,
       (array_to_string(tips, ' ') NOT LIKE '%%بعد 5 سنوات%%') AS سليم
FROM articles WHERE slug = 'turkey-work-visa-guide'
UNION ALL
SELECT 'cites law 6735 + the 8 years', (details LIKE '%%6735%%' AND details LIKE '%%ثماني سنوات%%')
FROM articles WHERE slug = 'turkey-work-visa-guide'
UNION ALL
SELECT 'the six-month entry deadline is stated', (details LIKE '%%ستة أشهر%%')
FROM articles WHERE slug = 'turkey-work-visa-guide'
UNION ALL
SELECT 'hotel/ticket out of the documents',
       (array_to_string(documents, ' ') NOT LIKE '%%حجز فندقي%%')
FROM articles WHERE slug = 'turkey-work-visa-guide'
UNION ALL
SELECT 'source filled, no empty tag chips',
       (coalesce(trim(source), '') <> '' AND array_position(tags, '') IS NULL)
FROM articles WHERE slug = 'turkey-work-visa-guide'
UNION ALL
SELECT 'no approved article still promises 5 years', (count(*) = 0)::boolean FROM articles
  WHERE status = 'approved' AND array_to_string(tips, ' ') LIKE '%%5 سنوات%%الإقامة الدائمة%%';
""" % (q(BLOCK), arr(STEPS), arr(TIPS), arr(DOCS), q(FEES), q(WARNING), q(SOURCE), arr(TAGS))

path = os.path.join(REPO, 'sql', '2026-08-06_work_visa_eight_years.sql')
open(path, 'w', encoding='utf-8').write(sql)

print('«5 سنوات → إقامة دائمة» : يُستبدل بمسارَي الثماني سنوات، كلٌّ بمادّته')
print('التأشيرة مقابل الإذن     : يُفصلان — 90 يوماً دخولاً، والسنة للإذن')
print('تغيير صاحب العمل        : يُضاف — يعيد السقف إلى سنة (م.10 خاتمة)')
print('موعدان يُسقطان الطلب     : يُضافان — ستة أشهر للدخول، وثلاثون يوماً للنقص')
print('«لا إقامة منفصلة»       : يُضاف (م.12/1)')
print('خطوات : %d ← %d  |  نصائح : %d ← %d  |  وثائق : %d ← %d (الفندق والتذكرة خرجا)'
      % (len(a['steps'] or []), len(STEPS), len(a['tips'] or []), len(TIPS),
         len(a['documents'] or []), len(DOCS)))
print('tags   : %r ← %d وسماً حقيقياً' % (a['tags'], len(TAGS)))
print('source : فارغ ← 6735 و6458 وmfa.gov.tr')
# Count quotes in STATEMENT lines only. A `--` comment runs to end of line in
# Postgres, so an apostrophe inside one (Türkiye'ye, in the verbatim article 12
# quote) is harmless — but it made the old check cry wolf, which is worse than
# no check because the next real imbalance would be ignored.
_code = ' '.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('quote parity :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written      :', path, len(sql), 'chars')
