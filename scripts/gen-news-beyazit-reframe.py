# -*- coding: utf-8 -*-
"""Reframe: the audience is people sent to update their kimlik BECAUSE of the line.

The first version led with «تجربة ميدانية من بيازيد». The owner's correction is
that he published it for the people being told to update their kimlik data so
they can update their phone-line record — the line deadline is the reason
anyone is at the migration directorate at all, and the Beyazıt experience is the
reassurance that the step is light. The field report is the answer, not the
subject.

And the site's own phone-line guide explains WHY that instruction is being given,
which the first version never connected:

  - the operator verifies against «وثيقة الهوية الأجنبية السارية» — a CURRENT
    document, which is what sends someone with a stale record to Göç İdaresi
    first;
  - the app route asks the foreigner to pick a work permit, a valid residence
    permit or a valid passport (step 7) — the kimlik is not among them, which is
    why temporary-protection holders on Turkcell are told to complete it IN A
    STORE (step 2);
  - restriction rolls from 5 September by the last two digits of the number,
    starting with 00 and 50, and the deadline to apply is 25 December 2026.

So the real chain is: the line must be updated → the store checks a current
document → a stale kimlik record blocks it → update the kimlik → and that update,
at Beyazıt, needed only the appointment and the card.

Everything that made the first version publishable stays: the field-report label,
the one-office-one-day caveat, the official document list split by reason, and
the call for reports from other centres. Only the order changes — and the order
was the whole problem, because a reader who needs their line fixed does not
search for a report about Beyazıt.

Updates the existing row by id rather than inserting a second one, so the URL the
owner already shared keeps working and no second notification fires.
"""
import json, os, re, urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROW_ID = '9fb94cac-f2b0-45c0-8b3c-977910076d23'

_env = {}
for _l in open(os.path.join(REPO, '.env.local'), encoding='utf-8-sig').read().splitlines():
    if '=' in _l and not _l.lstrip().startswith('#'):
        _k, _v = _l.split('=', 1)
        _env[_k.strip()] = _v.strip()
_URL, _KEY = _env['NEXT_PUBLIC_SUPABASE_URL'], _env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
_H = {'apikey': _KEY, 'Authorization': 'Bearer ' + _KEY}

row = json.load(urllib.request.urlopen(urllib.request.Request(
    '%s/rest/v1/updates?select=*&id=eq.%s' % (_URL, ROW_ID), headers=_H)))
assert len(row) == 1, 'the row the owner shared is not there'
assert 'بيازيد' in row[0]['title'], 'wrong row'


def q(s):
    return str(s if s is not None else '').replace("'", "''")


TITLE = ('طُلب منك تحديث بيانات الكملك لتستطيع تحديث خط هاتفك؟ '
         'هذا ما يستغرقه فعلاً — والمهلة تنتهي في 25 كانون الأول')

SUMMARY = ('من يريد تحديث سجلّ خط هاتفه قبل انتهاء المهلة يُطلب منه أحياناً تحديث بيانات كملكه '
           'أولاً، لأنّ المشغّل يتحقّق من وثيقة هوية سارية. والخبر الطيّب أنّ خطوة الكملك أخفّ '
           'ممّا يُظنّ: في مديرية الهجرة ببيازيد لم يُطلب سوى الموعد والبطاقة، وأُنجزت سريعاً. '
           'ننشرها تجربةً ميدانية لا قاعدة عامة، ومعها قائمة الأوراق الرسمية — فالفارق بين '
           '«تحديث بيانات» و«تغيير عنوان» هو ما يحدّد ما سيُطلب منك.')

CONTENT = (
    '<h3>لماذا يُطلب منك تحديث الكملك أصلاً؟</h3>'
    '<p>لأنّ تحديث سجلّ اشتراك الهاتف يقوم على <strong>التحقّق من وثيقة هوية سارية</strong>. '
    'فإن كان قيدك أو بياناتك غير محدَّثة، يتعثّر التحقّق في المتجر ويُقال لك: «حدِّث كملكك '
    'أوّلاً». والسلسلة كلّها هكذا:</p>'
    '<ol>'
    '<li>خطّك يحتاج تحديث سجلّ الاشتراك قبل انتهاء المهلة.</li>'
    '<li>المشغّل يتحقّق من وثيقة سارية — و<strong>تطبيق المشغّل لا يقبل الكملك</strong> ضمن '
    'خياراته (يطلب إذن عمل أو إقامة سارية أو جواز ساري)، ولهذا يُحال حاملو وثيقة الحماية '
    'المؤقتة إلى <strong>المتجر</strong> لإتمام الإجراء.</li>'
    '<li>وفي المتجر يلزم أن يكون قيدك سليماً ومحدَّثاً.</li>'
    '<li>فتذهب إلى مديرية الهجرة لتحديث البيانات — وهذه هي الخطوة التي يخافها كثيرون.</li>'
    '</ol>'

    '<div style="background:#eff6ff;border-right:4px solid #3b82f6;padding:14px 18px;margin:18px 0;">'
    '<p style="margin:0 0 8px;"><strong>وهذه تجربة ميدانية، لا إعلان رسمي.</strong></p>'
    '<p style="margin:0;">في مديرية الهجرة بمنطقة <strong>بيازيد / كوم كابي</strong> بإسطنبول، '
    'جرت مراجعة لتحديث بيانات الكملك ولم يُطلب سوى <strong>الموعد المحجوز والبطاقة</strong> — '
    'ولا أوراق أخرى — وأُنجز التحديث بسرعة. نقلها فريق تحرير دليل العرب عن مراجعة واحدة، في '
    'مركز واحد، في يوم واحد. ننشرها لأنّها تطمئن، ولا تبنِ سفرك إلى المديرية عليها وحدها.</p></div>'

    '<h3>والفارق الذي يفسّر خفّة الإجراء</h3>'
    '<p>هذا ليس تساهلاً من المركز، بل ما توثّقه أدلّتنا أصلاً: <strong>قائمة الأوراق تتبع سبب '
    'المراجعة</strong>.</p>'
    '<ul>'
    '<li><strong>تحديث بيانات بلا تغيير عنوان</strong> — البطاقة والموعد هما الأساس. وهذه حالة '
    'أكثر من يذهب من أجل خطّه.</li>'
    '<li><strong>تغيير العنوان</strong> — هنا يُطلب إثبات السكن: عقد إيجار مسجَّل، أو فاتورة '
    'خدمات باسمك، أو وثيقة العنوان، وربّما كود UAVT (نمارتاي). '
    '<a href="/article/kimlik-data-update">مهلة العشرين يوم عمل والخطوات</a>.</li>'
    '<li><strong>واقعة أخرى</strong> (زواج، ولادة، وفاة، تصحيح اسم) — يُطلب ما يثبتها. '
    '<a href="/article/kimlik-renewal-documents">قائمة الأوراق كاملةً</a>.</li>'
    '</ul>'
    '<p>فإن كانت مراجعتك تحديثَ بيانات فقط، فتجربة بيازيد متوافقة مع المقرَّر. وإن كنت تنقل '
    'عنوانك، فلا تذهب بالبطاقة وحدها.</p>'

    '<div style="background:#fff7ed;border-right:4px solid #ea580c;padding:14px 18px;margin:18px 0;">'
    '<p style="margin:0 0 8px;"><strong>والمهلة تمضي</strong></p>'
    '<p style="margin:0;">آخر موعد لتقديم طلب تحديث سجلّ الاشتراك: '
    '<strong>25 كانون الأول/ديسمبر 2026</strong>. والتقييد التدريجي بدأ من '
    '<strong>5 أيلول/سبتمبر</strong> بحسب آخر رقمين من رقم هاتفك — يبدأ بالمنتهية بـ00 و50 ثم '
    'يتدرّج يومياً. فلا تؤجّل حتى يأتي دورك: '
    '<a href="/article/gecici-koruma-hat-guncelleme-2026">الجدول الزمني الكامل ومساري '
    'التحديث</a>.</p></div>'

    '<h3>قبل أن تذهب</h3>'
    '<ul>'
    '<li>احجز الموعد أولاً — لا مراجعة بلا موعد، وضياعه يكلّفك أسابيع.</li>'
    '<li>خذ البطاقة، وأضف إثبات السكن <em>إن كان</em> سبب مراجعتك العنوان.</li>'
    '<li>وإن كنت في إسطنبول فراجع المركز التابع لك — '
    '<a href="/article/immigration-offices-istanbul">عناوين المراكز الخمسة وأرقامها</a>.</li>'
    '<li>ولا تدفع لأحد مقابل «تدبير موعد»: المواعيد والخدمة مجانية بنصّ إعلان إدارة الهجرة.</li>'
    '<li>وبعد تحديث الكملك، عُد إلى متجر مشغّلك لإتمام تحديث الخط — الخطوتان منفصلتان.</li>'
    '</ul>'

    '<div style="background:#ecfdf5;border-right:4px solid #10b981;padding:14px 18px;margin:18px 0;">'
    '<p style="margin:0 0 8px;"><strong>وشاركنا تجربتك</strong></p>'
    '<p style="margin:0;">ما زلنا نجمع ما يُطلب فعلاً في بقية المراكز — سلطان بيلي، إسنيورت، '
    'توزلا، وخارج إسطنبول. إن راجعتَ مؤخّراً، أخبرنا: أي مركز، وما سبب المراجعة، وما الذي '
    'طُلب منك بالضبط. تجربةٌ واحدة خبر، وعشرون تجربة تصير خريطة يعتمد عليها الناس.</p></div>'
)

SRC_NAME = ('قرار هيئة الاتصالات BTK رقم 2026/İK-THD/125 (المهلة والتقييد) + تجربة ميدانية نقلها '
            'فريق تحرير دليل العرب من مديرية الهجرة بيازيد/كوم كابي بإسطنبول في 6 آب/أغسطس 2026، '
            'مع قائمة الأوراق الرسمية من أدلّة الموقع')

sql = """-- ============================================================================
-- إعادة صياغة: الجمهور هم من طُلب منهم تحديث الكملك بسبب الخطّ
-- ============================================================================
-- كانت الصيغة الأولى تبدأ بـ«تجربة ميدانية من بيازيد». وتصحيح صاحب الموقع أنّه
-- نشرها لمن يُطلب منهم تحديث بيانات الكملك ليتمكّنوا من تحديث سجلّ خط هاتفهم —
-- فمهلة الخطّ هي سبب وجود أي أحد في مديرية الهجرة أصلاً، وتجربةُ بيازيد هي
-- الطمأنة بأنّ الخطوة خفيفة. التجربة جوابٌ لا موضوع.
--
-- ودليل الخطوط عندنا يشرح لماذا تُعطى تلك التعليمة، وهو ما لم تربطه الصيغة
-- الأولى إطلاقاً:
--
--   • المشغّل يتحقّق من «وثيقة الهوية الأجنبية السارية» — أي وثيقة نافذة،
--     وهذا ما يُرسل صاحب القيد غير المحدَّث إلى إدارة الهجرة أولاً؛
--   • ومسار التطبيق يطلب من الأجنبي أن يختار إذن عمل أو إقامة سارية أو جوازاً
--     سارياً (الخطوة 7) — والكملك ليس بينها، ولهذا يُحال حاملو وثيقة الحماية
--     المؤقتة لدى Turkcell إلى المتجر (الخطوة 2)؛
--   • والتقييد يتدرّج من 5 أيلول بحسب آخر رقمين من رقم الهاتف، يبدأ بـ00 و50،
--     والمهلة تنتهي في 25 كانون الأول 2026.
--
-- فالسلسلة الحقيقية: الخطّ يحتاج تحديثاً ← المتجر يفحص وثيقة سارية ← القيد غير
-- المحدَّث يعرقل ← فتحدّث الكملك ← وذلك التحديث، في بيازيد، لم يحتج سوى الموعد
-- والبطاقة.
--
-- وكلّ ما جعل الصيغة الأولى قابلةً للنشر باقٍ: وسم «تجربة ميدانية»، وتحفّظ
-- «مركز واحد في يوم واحد»، وقائمة الأوراق الرسمية مقسَّمةً بحسب سبب المراجعة،
-- ودعوة القرّاء إلى الإخبار عن مراكزهم. الترتيب وحده هو ما تغيّر — والترتيب كان
-- المشكلة كلّها، لأنّ من يحتاج إصلاح خطّه لا يبحث عن تقريرٍ عن بيازيد.
--
-- يُحدَّث الصفّ القائم بمعرّفه، لا يُدرَج صفّ ثانٍ: فالرابط الذي شاركه صاحب
-- الموقع يبقى عاملاً، ولا ينطلق إشعار ثانٍ.
--
-- آمن لإعادة التشغيل.
-- ============================================================================

UPDATE updates SET
    title = '%s',
    summary = '%s',
    content = '%s',
    source_name = '%s',
    category = 'general'
WHERE id = '%s';

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE t text; l text; ok boolean;
BEGIN
    SELECT title, link INTO t, l FROM updates WHERE id = '%s';
    IF t IS NULL THEN RAISE EXCEPTION 'row not found'; END IF;
    IF t NOT LIKE '%%خط هاتفك%%' THEN RAISE EXCEPTION 'title still leads with the field report'; END IF;
    SELECT EXISTS (SELECT 1 FROM articles a WHERE a.status = 'approved'
                    AND '/article/' || a.slug = l) INTO ok;
    IF NOT ok THEN RAISE EXCEPTION 'link no longer points at a live article'; END IF;
END
$check$;

SELECT title, category, link, left(summary, 90) AS summary_head
FROM updates WHERE id = '%s';
""" % (q(TITLE), q(SUMMARY), q(CONTENT), q(SRC_NAME), ROW_ID, ROW_ID, ROW_ID)

path = os.path.join(REPO, 'sql', '2026-08-06_news_beyazit_reframe.sql')
open(path, 'w', encoding='utf-8').write(sql)

_code = ' '.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('العنوان    : يبدأ بحاجة القارئ (الخطّ والمهلة)، لا بمكان التجربة')
print('السلسلة    : أربع خطوات تشرح لماذا يُطلب تحديث الكملك أصلاً — لم تكن موجودة')
print('السبب      : تطبيق المشغّل لا يقبل الكملك، فيُحال صاحبه إلى المتجر (من دليلنا)')
print('المهلة     : 25 كانون الأول + تدرّج التقييد من 5 أيلول بآخر رقمين')
print('الباقي     : وسم التجربة، والتحفّظ، وقائمة الأوراق، ودعوة المراكز — كما هي')
print('التحديث    : على الصفّ نفسه بمعرّفه — الرابط المنشور يبقى، ولا إشعار ثانٍ')
print('quote parity:', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written    :', path, len(sql), 'chars')
