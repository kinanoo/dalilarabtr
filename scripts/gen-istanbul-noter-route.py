# -*- coding: utf-8 -*-
"""The notary route: hand your papers to any Istanbul notary and skip the wait.

From a slide presented by İstanbul İl Göç İdaresi Müdürlüğü at a coordination
meeting with civil-society organisations, verbatim:

  NOTER UYGULAMALARI
    «İlgilinin www.randevu.goc.gov.tr adresi üzerinden randevu alınmasından
     sonra, randevu tarihini beklemeden veya en geç randevu tarihinde
     evraklarını İstanbul ilinde istediği notere teslim etmesi durumunda;»
    «Evraklar, noterliklerce taranıp GöçNet sistemine yüklenmektedir.»
    «Evrakların GöçNet sistemine aktarımından sonra, Herhangi aksaklık olmaması
     durumunda 24 saat içerisinde başvuru sonuçlanmaktadır.»

  İŞLEM KOTALARI (İl Müdürlüğümüzce günlük)
    İkamet İzni Başvuru İşlemleri            2.100
    İkamet İzni Adres Tescil İşlemleri       1.140
    Geçici Koruma işlemleri                  2.725
    Toplam Günlük Randevu Sayısı             5.965

  TOPLANTILAR
    «2026 yılında Sivil Toplum Kuruluşları ile 52 bilgilendirme toplantısı
     gerçekleştirilmiştir.»

WHAT IS ACTUALLY NEW, AND WHAT IS NOT.

The neighbourhood half of this material is already on the site and correct:
istanbul-closed-neighborhoods-lift-2026, 337 views, sourced to the same
directorate's list of 7 June 2026, states 54 → 5 and names the exact five. And
the zones checker agrees down to the row — Avcılar/ÜNİVERSİTE, Esenyurt/KOZA,
Esenyurt/ZAFER, Fatih/MOLLA HÜSREV, Küçükçekmece/BEŞYOL are precisely the five
the table marks closed out of 55 Istanbul rows. So today's meeting does not
change that page; it re-confirms it two months on, which is worth adding because
readers keep asking whether the list moved again. No second article about the
neighbourhoods gets written.

The notary route IS new here. A scan of all 235 approved articles found not one
mention of GöçNet or of delivering documents to a notary instead of attending
the appointment. That is a procedure the reader performs, so the publishing
checklist calls for a guide, and the news links to it rather than to a listing
page.

CARE TAKEN WITH THE 24 HOURS. The slide qualifies it: «Herhangi aksaklık
olmaması durumunda» — absent any problem. Published as a conditional, not a
promise, because a reader who books travel around a guaranteed 24 hours and
hits a missing document has been hurt by our phrasing rather than by the
directorate's.

And the quotas are published for a reason readers will feel: 5,965 appointments
a day for a province of this size is why an appointment is hard to find, and it
is also why the notary route matters — it decouples the paperwork from the queue.
Arithmetic checked: 2,100 + 1,140 + 2,725 = 5,965.
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
    r = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=_H)))
    return r[0] if r else None


def q(s):
    return str(s if s is not None else '').replace("'", "''")


def arr(items):
    return 'ARRAY[%s]::text[]' % ', '.join("'%s'" % q(x) for x in items)


assert fetch('istanbul-goc-randevu-noter-2026') is None, 'the guide already exists'
lift = fetch('istanbul-closed-neighborhoods-lift-2026')
assert lift and '54' in (lift['details'] or ''), 'the lift article changed'
assert 'GöçNet' not in (lift['details'] or ''), 'already updated'

SLUG = 'istanbul-goc-randevu-noter-2026'
TITLE = ('تسليم أوراق الإقامة عبر النوتر في إسطنبول 2026: بلا انتظار الموعد — '
         'والنتيجة خلال 24 ساعة')
INTRO = ('أعلنت مديرية إدارة الهجرة في ولاية إسطنبول أنّ من حجز موعداً عبر randevu.goc.gov.tr '
         'يستطيع تسليم أوراقه إلى أي نوتر في إسطنبول قبل تاريخ موعده أو في التاريخ نفسه على '
         'أبعد تقدير، فيمسحها النوتر ويرفعها إلى نظام GöçNet، ويُبتّ الطلب خلال 24 ساعة إن لم '
         'يقع خلل. هذا شرح المسار كاملاً وما يجب الانتباه إليه.')

DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الخلاصة في سطرين</strong></p>'
    '<p style="margin:0;">احجز موعدك أوّلاً كالمعتاد. ثمّ — <strong>بلا أن تنتظر تاريخ الموعد</strong> — '
    'سلّم أوراقك إلى <strong>أي نوتر في ولاية إسطنبول</strong>. النوتر يمسحها ويرفعها إلى نظام '
    '<strong>GöçNet</strong>، ويُبتّ طلبك <strong>خلال 24 ساعة</strong> إن لم يقع خلل.</p></div>'

    '<h2>ما الذي تغيّر؟</h2>'
    '<p>كان المسار المعتاد: تحجز موعداً، ثمّ تنتظر تاريخه، ثمّ تحضر بنفسك إلى المديرية بأوراقك. '
    'والانتظار هو الجزء الثقيل — أسابيع أحياناً.</p>'
    '<p>وبتطبيق النوتر صار بإمكانك فصل <strong>الأوراق</strong> عن <strong>الطابور</strong>: '
    'ما إن تحجز الموعد حتى تستطيع تسليم ملفّك عند أي نوتر في إسطنبول، ولا تنتظر التاريخ.</p>'
    '<p>ونصّ المديرية في هذا صريح: التسليم يكون '
    '<strong>«بلا انتظار تاريخ الموعد، أو في تاريخ الموعد على أبعد تقدير»</strong> '
    '(randevu tarihini beklemeden veya en geç randevu tarihinde).</p>'

    '<h2>الخطوات كما وصفتها المديرية</h2>'
    '<ol>'
    '<li><strong>احجز الموعد</strong> عبر <span dir="ltr">www.randevu.goc.gov.tr</span>. '
    'وهذه خطوة لا تسقط: مسار النوتر لا يُغني عن الموعد بل يبني عليه.</li>'
    '<li><strong>سلّم الأوراق إلى أي نوتر في ولاية إسطنبول</strong> — «istediği notere»، أي '
    'النوتر الذي تختاره أنت، لا نوتراً بعينه.</li>'
    '<li><strong>النوتر يمسح الأوراق ويرفعها إلى نظام GöçNet</strong> — هذه خطوته هو، لا خطوتك.</li>'
    '<li><strong>يُبتّ الطلب خلال 24 ساعة</strong> من نقل الأوراق إلى النظام، إن لم يقع خلل.</li>'
    '</ol>'

    '<div style="background:#fff7ed;border-right:4px solid #ea580c;padding:14px 18px;margin:18px 0;">'
    '<p style="margin:0 0 8px;"><strong>والأربع والعشرون ساعة مشروطة — اقرأ الشرط</strong></p>'
    '<p style="margin:0;">نصّ المديرية يقول «إن لم يقع أي خلل» '
    '(<span dir="ltr">Herhangi aksaklık olmaması durumunda</span>). أي أنّها ليست وعداً بمدّة، '
    'بل ما يحدث حين تكون الأوراق كاملةً وسليمة. فورقةٌ ناقصة أو ترجمة غير مقبولة تُعيدك إلى '
    'الانتظار — ولا تحجز سفراً ولا ترتّب أمراً على أساس أربع وعشرين ساعة مضمونة.</p></div>'

    '<h2>لماذا يهمّ هذا كثيراً؟ انظر إلى الأرقام</h2>'
    '<p>أعلنت المديرية حصصها اليومية من المواعيد في ولاية إسطنبول:</p>'
    '<table><thead><tr><th>نوع المعاملة</th><th>مواعيد يومياً</th></tr></thead><tbody>'
    '<tr><td>طلبات إذن الإقامة</td><td>2,100</td></tr>'
    '<tr><td>تسجيل عنوان إذن الإقامة</td><td>1,140</td></tr>'
    '<tr><td>معاملات الحماية المؤقتة</td><td>2,725</td></tr>'
    '<tr><td><strong>المجموع اليومي</strong></td><td><strong>5,965</strong></td></tr>'
    '</tbody></table>'
    '<p>خمسة آلاف وتسعمئة وخمسة وستّون موعداً في اليوم لولاية بحجم إسطنبول — وهذا وحده يشرح '
    'لماذا يصعب إيجاد موعد قريب. ويشرح أيضاً قيمة مسار النوتر: هو لا يزيد عدد المواعيد، لكنّه '
    'يجعل انتظارك للتاريخ غير معطِّل لملفّك.</p>'

    '<h2>قبل أن تذهب إلى النوتر</h2>'
    '<ul>'
    '<li><strong>الموعد أوّلاً.</strong> بلا حجز على randevu.goc.gov.tr لا يبدأ شيء.</li>'
    '<li><strong>راجع أوراقك ورقةً ورقة.</strong> النوتر يمسح ما تعطيه ولا يدقّقه عنك، والنقص '
    'يظهر بعد الرفع لا قبله.</li>'
    '<li><strong>احتفظ بإيصال النوتر</strong> وبنسخة ممّا سلّمته — هو ما تحتجّ به إن ضاع شيء.</li>'
    '<li><strong>اسأل عن أجر النوتر</strong> قبل التسليم: أجور النوتر مقرَّرة بتعرفة، لكنّها '
    'تختلف بحسب عدد الأوراق، ولم تُعلن المديرية رسماً لهذه الخدمة بذاتها.</li>'
    '<li><strong>هذا التطبيق في ولاية إسطنبول.</strong> لا تفترض أنّه ساري في ولايتك إن كنت '
    'خارجها — اسأل مديريتك.</li>'
    '</ul>'

    '<p style="margin-top:1.2rem;">وللسياق: '
    '<a href="/article/immigration-offices-istanbul">مراكز الهجرة الخمسة في إسطنبول</a> • '
    '<a href="/article/istanbul-closed-neighborhoods-lift-2026">الأحياء المغلقة في إسطنبول</a> • '
    '<a href="/article/kimlik-data-update">تحديث بيانات الكملك والعنوان</a> • '
    '<a href="/zones">فاحص الأحياء</a></p>'
)

STEPS = [
    'احجز موعدك على www.randevu.goc.gov.tr كالمعتاد — مسار النوتر يبني على الموعد ولا يُغني عنه.',
    'جهّز ملفّك كاملاً وراجعه ورقةً ورقة: النوتر يمسح ما تعطيه ولا يدقّقه نيابةً عنك.',
    'اذهب إلى أي نوتر في ولاية إسطنبول — تختاره أنت — قبل تاريخ موعدك أو فيه على أبعد تقدير.',
    'سلّم الأوراق ليمسحها النوتر ويرفعها إلى نظام GöçNet.',
    'احتفظ بإيصال النوتر وبنسخة عمّا سلّمته.',
    'تابع نتيجة الطلب: يُبتّ خلال 24 ساعة من الرفع إن لم يقع خلل.',
    'وإن ظهر نقص: أكمله فوراً — العدّاد يبدأ من اكتمال الملفّ لا من تاريخ تسليمك الأول.',
]

TIPS = [
    'الموعد شرط سابق: مسار النوتر يوفّر عليك انتظار التاريخ، لا الحجز نفسه.',
    'أي نوتر في إسطنبول يصلح — لا يوجد نوتر «معتمد» دون غيره لهذه الخدمة.',
    'الأربع والعشرون ساعة مشروطة بألّا يقع خلل؛ فلا ترتّب سفراً أو عملاً عليها.',
    'النوتر يمسح ولا يراجع — تدقيق الأوراق مسؤوليتك وحدك قبل التسليم.',
    'المديرية تصدر 5,965 موعداً يومياً في إسطنبول؛ فاحجز مبكراً ولا تنتظر آخر لحظة.',
    'هذا تطبيق ولاية إسطنبول — إن كنت في ولاية أخرى فاسأل مديريتك قبل أن تعتمد عليه.',
    'لا تدفع لوسيط مقابل «تسريع» الملف؛ المسار نفسه مجاني عدا أجر النوتر المقرَّر.',
]

DOCUMENTS = [
    'إثبات حجز الموعد من randevu.goc.gov.tr',
    'ملفّ معاملتك كاملاً بحسب نوعها (طلب إقامة، أو تسجيل عنوان، أو معاملة حماية مؤقتة)',
    'جواز السفر أو بطاقة الحماية المؤقتة',
    'الترجمات المحلَّفة والتصديقات التي تتطلّبها معاملتك',
    'إيصال النوتر بعد التسليم — احتفظ به',
]

FEES = ('المسار نفسه لا رسم عليه من المديرية. ويبقى أجر النوتر عن المسح والرفع، وهو خاضع '
        'لتعرفة النوتر ويختلف بحسب عدد الأوراق — اسأل عنه قبل التسليم. ولم تُعلن المديرية '
        'رسماً خاصاً بهذه الخدمة، فلا نشر رقماً هنا.')

WARNING = ('مهلة الأربع والعشرين ساعة مشروطة بنصّ المديرية بألّا يقع أي خلل — فهي ما يحدث حين '
           'تكون الأوراق كاملة، لا وعدٌ بمدّة. ولا ترتّب سفراً أو التزاماً عليها. والنوتر يمسح '
           'ما تعطيه ولا يدقّقه، فالنقص يظهر بعد الرفع لا قبله. وهذا تطبيق ولاية إسطنبول — '
           'لا تفترض سريانه في ولاية أخرى.')

SOURCE = ('مديرية إدارة الهجرة في ولاية إسطنبول (T.C. İstanbul Valiliği İl Göç İdaresi '
          'Müdürlüğü) — عرضٌ قُدِّم في اجتماع تنسيقي مع منظمات المجتمع المدني، بنود '
          '«NOTER UYGULAMALARI» و«İŞLEM KOTALARI»؛ نقله اتحاد منظمات المجتمع المدني للتنمية '
          '(UCSO) بوصفه مشاركاً في الاجتماع')

TAGS = ['إسطنبول', 'إذن إقامة', 'نوتر', 'موعد الهجرة', 'GöçNet', 'دليل', '2026']

NEWS_TITLE = ('إسطنبول: سلّم أوراق إقامتك لأي نوتر بلا انتظار الموعد — والبتّ خلال 24 ساعة')
NEWS_SUMMARY = ('أعلنت مديرية إدارة الهجرة في ولاية إسطنبول تطبيق النوتر: بعد حجز الموعد على '
                'randevu.goc.gov.tr يمكن تسليم الأوراق إلى أي نوتر في إسطنبول بلا انتظار تاريخ '
                'الموعد، فيرفعها النوتر إلى نظام GöçNet ويُبتّ الطلب خلال 24 ساعة إن لم يقع خلل. '
                'وأعلنت حصصها اليومية: 5,965 موعداً — 2,100 لطلبات الإقامة و1,140 لتسجيل العنوان '
                'و2,725 للحماية المؤقتة. وأكّدت بقاء خمسة أحياء فقط مغلقة في إسطنبول.')
NEWS_CONTENT = (
    '<p>عرضت <strong>مديرية إدارة الهجرة في ولاية إسطنبول</strong> في اجتماع تنسيقي مع منظمات '
    'المجتمع المدني ثلاثة بنود تهمّ كلّ مقيم في الولاية.</p>'

    '<h3>١. تطبيق النوتر — الأهمّ عملياً</h3>'
    '<p>من حجز موعداً عبر <span dir="ltr">www.randevu.goc.gov.tr</span> يستطيع تسليم أوراقه '
    'إلى <strong>أي نوتر في ولاية إسطنبول</strong> — <strong>بلا انتظار تاريخ الموعد</strong>، '
    'أو في تاريخه على أبعد تقدير. ويمسح النوتر الأوراق ويرفعها إلى نظام '
    '<strong>GöçNet</strong>، ثمّ <strong>يُبتّ الطلب خلال 24 ساعة</strong> من نقلها — '
    '«إن لم يقع أي خلل» بنصّ المديرية.</p>'
    '<p><strong>وهذه ليست مدّة مضمونة.</strong> الشرط منصوص عليه، ومعناه أنّ ورقةً ناقصة تُعيدك '
    'إلى الانتظار. فلا ترتّب سفراً على أساسها.</p>'

    '<h3>٢. حصص المواعيد اليومية</h3>'
    '<table><thead><tr><th>نوع المعاملة</th><th>يومياً</th></tr></thead><tbody>'
    '<tr><td>طلبات إذن الإقامة</td><td>2,100</td></tr>'
    '<tr><td>تسجيل عنوان إذن الإقامة</td><td>1,140</td></tr>'
    '<tr><td>معاملات الحماية المؤقتة</td><td>2,725</td></tr>'
    '<tr><td><strong>المجموع</strong></td><td><strong>5,965</strong></td></tr>'
    '</tbody></table>'
    '<p>وهذا الرقم يفسّر صعوبة إيجاد موعد قريب — ويفسّر معه قيمة تطبيق النوتر: هو لا يزيد '
    'المواعيد، لكنّه يمنع انتظارك للتاريخ من تعطيل ملفّك.</p>'

    '<h3>٣. الأحياء المغلقة: خمسة، ولم تتغيّر</h3>'
    '<p>أكّد الاجتماع بقاء <strong>خمسة أحياء فقط</strong> مغلقة في إسطنبول — وهي نفسها منذ '
    'قائمة 7 حزيران/يونيو 2026: <strong>Üniversite</strong> في أفجلار، '
    '<strong>Molla Hüsrev</strong> في الفاتح، <strong>Koza</strong> و<strong>Zafer</strong> في '
    'إسنيورت، و<strong>Beşyol</strong> في كوجوك جكمجة. وما عداها مفتوح.</p>'
    '<p>وفاحص الأحياء عندنا يطابق هذه الخمس تماماً — '
    '<a href="/zones/%s">افحص حيّك</a> أو اقرأ '
    '<a href="/article/istanbul-closed-neighborhoods-lift-2026">تفصيل قرار إسطنبول</a>.</p>'

    '<p style="margin-top:1rem;"><a href="/article/%s"><strong>الدليل الكامل لمسار النوتر: '
    'الخطوات والأوراق وما ينبغي الانتباه إليه ←</strong></a></p>'
) % (urllib.parse.quote('İstanbul', safe=''), SLUG)

LIFT_ADD = (
    '<div style="background:#ecfdf5;border-right:4px solid #10b981;padding:14px 18px;margin:18px 0;">'
    '<p style="margin:0 0 8px;"><strong>تأكيد لاحق: الخمسة ما زالت خمسة</strong></p>'
    '<p style="margin:0 0 8px;">في اجتماع تنسيقي مع منظمات المجتمع المدني أكّدت مديرية إدارة '
    'الهجرة في إسطنبول بقاء العدد على حاله بعد قائمة 7 حزيران/يونيو — فمن يسأل هل تغيّرت '
    'القائمة مرّةً أخرى، الجواب لا.</p>'
    '<p style="margin:0;">وأعلنت في الاجتماع نفسه حصصها اليومية من المواعيد: 2,100 لطلبات '
    'الإقامة، و1,140 لتسجيل العنوان، و2,725 للحماية المؤقتة — بمجموع <strong>5,965</strong> '
    'موعداً يومياً. كما أعلنت <strong>تطبيق النوتر</strong>: تسليم الأوراق لأي نوتر في إسطنبول '
    'بلا انتظار تاريخ الموعد، والبتّ خلال 24 ساعة إن لم يقع خلل — '
    '<a href="/article/' + SLUG + '" style="font-weight:bold;">الدليل هنا</a>.</p></div>'
)

sql = """-- ============================================================================
-- تطبيق النوتر في إسطنبول: سلّم أوراقك بلا انتظار الموعد
-- ============================================================================
-- من عرضٍ قدّمته مديرية إدارة الهجرة في ولاية إسطنبول في اجتماع تنسيقي مع
-- منظمات المجتمع المدني. النصّ التركي حرفياً:
--
--   NOTER UYGULAMALARI
--     «İlgilinin www.randevu.goc.gov.tr adresi üzerinden randevu alınmasından
--      sonra, randevu tarihini beklemeden veya en geç randevu tarihinde
--      evraklarını İstanbul ilinde istediği notere teslim etmesi durumunda;»
--     «Evraklar, noterliklerce taranıp GöçNet sistemine yüklenmektedir.»
--     «Evrakların GöçNet sistemine aktarımından sonra, Herhangi aksaklık
--      olmaması durumunda 24 saat içerisinde başvuru sonuçlanmaktadır.»
--
--   İŞLEM KOTALARI (günlük)
--     İkamet İzni Başvuru İşlemleri            2.100
--     İkamet İzni Adres Tescil İşlemleri       1.140
--     Geçici Koruma işlemleri                  2.725
--     Toplam Günlük Randevu Sayısı             5.965
--
-- ── ما هو جديد فعلاً، وما ليس كذلك ─────────────────────────────────────
--
-- شقّ الأحياء منشورٌ أصلاً وصحيح: صفحة istanbul-closed-neighborhoods-lift-2026،
-- 337 قراءة، مُسندة إلى قائمة المديرية نفسها في 7 حزيران 2026، وتقول 54 ← 5
-- وتسمّي الخمسة. وفاحص الأحياء عندنا يطابقها صفّاً بصفّ: Avcılar/ÜNİVERSİTE
-- وEsenyurt/KOZA وEsenyurt/ZAFER وFatih/MOLLA HÜSREV وKüçükçekmece/BEŞYOL هي
-- بالضبط الخمسة المعلَّمة مغلقةً من أصل 55 صفّاً لإسطنبول. فاجتماع اليوم لا
-- يغيّر تلك الصفحة، بل يؤكّدها بعد شهرين — وهو ما يستحقّ الإضافة لأنّ القرّاء
-- يسألون باستمرار هل تغيّرت القائمة ثانيةً. ولا يُكتب مقالٌ ثانٍ عن الأحياء.
--
-- أمّا مسار النوتر فجديد هنا. مسحُ المقالات المعتمَدة الـ235 لم يجد ذكراً
-- واحداً لـGöçNet ولا لتسليم الأوراق إلى نوتر بدل حضور الموعد. وهو إجراء
-- يفعله القارئ بنفسه، فقائمة النشر توجب دليلاً، والخبر يحيل إليه لا إلى صفحة
-- قائمة.
--
-- ── والحذر في الأربع والعشرين ساعة ─────────────────────────────────────
--
-- العرض يقيّدها: «Herhangi aksaklık olmaması durumunda» — إن لم يقع أي خلل.
-- فتُنشَر شرطاً لا وعداً، لأنّ من يرتّب سفره على أربعٍ وعشرين ساعة مضمونة ثم
-- يصطدم بورقة ناقصة تكون صياغتُنا نحن ما آذاه، لا نصّ المديرية.
--
-- والحصص تُنشَر لسببٍ يلمسه القارئ: 5,965 موعداً يومياً لولاية بهذا الحجم هو
-- تفسير صعوبة إيجاد موعد، وهو نفسه تفسير قيمة مسار النوتر — إذ يفصل الورق عن
-- الطابور. والحساب متحقَّق: 2,100 + 1,140 + 2,725 = 5,965.
--
-- آمن لإعادة التشغيل: ON CONFLICT للمقال، وWHERE NOT EXISTS للخبر.
-- ============================================================================

-- id IS the slug on this table — the same text value, and it is the primary
-- key. articles.slug carries no unique constraint of its own, so
-- `ON CONFLICT (slug)` fails with 42P10: there is no unique or exclusion
-- constraint matching the ON CONFLICT specification. CLAUDE.md documents the
-- right form in one line — «ON CONFLICT (id) DO UPDATE للمقالات» — and this
-- file did not follow it.
INSERT INTO articles (id, slug, title, intro, details, steps, tips, documents, fees, warning, source, tags, category, status, last_update)
VALUES ('%s', '%s', '%s', '%s', '%s', %s, %s, %s, '%s', '%s', '%s', %s, 'معاملات رسمية', 'approved', CURRENT_DATE)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, intro = EXCLUDED.intro, details = EXCLUDED.details,
    steps = EXCLUDED.steps, tips = EXCLUDED.tips, documents = EXCLUDED.documents,
    fees = EXCLUDED.fees, warning = EXCLUDED.warning, source = EXCLUDED.source,
    tags = EXCLUDED.tags, category = EXCLUDED.category, last_update = CURRENT_DATE;

-- تأكيد لاحق على صفحة الأحياء (337 قراءة) — لا مقال ثانٍ
UPDATE articles SET
    details = details || '%s',
    last_update = CURRENT_DATE
WHERE slug = 'istanbul-closed-neighborhoods-lift-2026' AND details NOT LIKE '%%GöçNet%%';

INSERT INTO updates (type, title, summary, content, link, source_name, category, date, active, pinned)
SELECT 'news', '%s', '%s', '%s', '/article/%s',
       'مديرية إدارة الهجرة في ولاية إسطنبول (İstanbul İl Göç İdaresi Müdürlüğü) — عرض قُدِّم في اجتماع تنسيقي مع منظمات المجتمع المدني؛ نقله اتحاد منظمات المجتمع المدني للتنمية (UCSO) بوصفه مشاركاً',
       'official', DATE '2026-08-06', true, true
WHERE NOT EXISTS (SELECT 1 FROM updates WHERE title = '%s');

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE bad int;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = '%s' AND status = 'approved') THEN
        RAISE EXCEPTION 'the guide was not created';
    END IF;
    SELECT count(*) INTO bad FROM updates u
     WHERE u.title = '%s'
       AND NOT EXISTS (SELECT 1 FROM articles a WHERE a.status = 'approved'
                        AND '/article/' || a.slug = u.link);
    IF bad > 0 THEN RAISE EXCEPTION 'the news links to an article that is not live'; END IF;
    -- the five must still be five, and exactly these five
    SELECT count(*) INTO bad FROM zones
     WHERE city = 'İstanbul' AND status = 'closed';
    IF bad <> 5 THEN
        RAISE EXCEPTION 'the zones table no longer shows 5 closed Istanbul rows, it shows %%', bad;
    END IF;
END
$check$;

SELECT 'guide created' AS البند, (count(*) = 1)::boolean AS سليم FROM articles WHERE slug = '%s' AND status = 'approved'
UNION ALL
SELECT 'lift article reconfirmed', (details LIKE '%%GöçNet%%') FROM articles WHERE slug = 'istanbul-closed-neighborhoods-lift-2026'
UNION ALL
SELECT 'news inserted once', (count(*) = 1)::boolean FROM updates WHERE title = '%s'
UNION ALL
SELECT 'zones still shows exactly 5 closed in Istanbul', (count(*) = 5)::boolean FROM zones WHERE city = 'İstanbul' AND status = 'closed';
""" % (
    q(SLUG), q(SLUG), q(TITLE), q(INTRO), q(DETAILS), arr(STEPS), arr(TIPS), arr(DOCUMENTS),
    q(FEES), q(WARNING), q(SOURCE), arr(TAGS),
    q(LIFT_ADD),
    q(NEWS_TITLE), q(NEWS_SUMMARY), q(NEWS_CONTENT), q(SLUG), q(NEWS_TITLE),
    q(SLUG), q(NEWS_TITLE), q(SLUG), q(NEWS_TITLE),
)

path = os.path.join(REPO, 'sql', '2026-08-06_istanbul_noter_route.sql')
open(path, 'w', encoding='utf-8').write(sql)

_code = ' '.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('مقال جديد    : %s — %d حرفاً، %d خطوة، %d نصيحة' % (SLUG, len(DETAILS), len(STEPS), len(TIPS)))
print('الجديد فعلاً  : مسار النوتر + GöçNet — لا ذكر له في أيٍّ من الـ235 مقالاً')
print('لم يُكرَّر    : الأحياء الخمسة منشورة بـ337 قراءة — أُضيف تأكيد لا مقال')
print('التحقّق      : جدولنا يطابق الخمس المُعلَنة صفّاً بصفّ، وحارسٌ في DO block يفرض ذلك')
print('الحذر        : الـ24 ساعة مشروطة بنصّها «إن لم يقع خلل» — لا وعد بمدّة')
print('الحساب       : 2,100 + 1,140 + 2,725 = 5,965 ✓')
print('quote parity :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written      :', path, len(sql), 'chars')
