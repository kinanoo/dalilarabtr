# -*- coding: utf-8 -*-
"""A field report from Beyazıt — published as a field report, not as a rule.

The owner's own account: at the Istanbul migration directorate in Beyazıt /
Kumkapı, a kimlik data refresh needed nothing but the appointment and the card,
and it was quick. He wants it published, and asks readers to report what other
centres require.

WHY THIS IS PUBLISHABLE, AND WHY THE FRAMING MATTERS.

This site's standing rule is to tie every news item to a primary source and to
refuse to generalise a local practice into a rule — most readers are under
temporary protection, and a rule that does not hold at their office costs them
an appointment that takes weeks to get. One visit to one office on one day is
exactly the shape of claim that rule exists to stop.

But the report does not actually contradict the site. kimlik-data-update already
lists address proof conditionally — «عقد إيجار + نمارتاي + فاتورة باسمك (إذا كان
السبب عنوان)» — and kimlik-renewal-documents says «ما يثبت العنوان إن كان سبب
المراجعة تغيّره». A plain data REFRESH is not an address CHANGE, and the light
document list follows from the site's own guides. So the honest publication is
not «Beyazıt asks for nothing»; it is «a refresh and a move are two different
visits, and here is what a refresh looked like in practice».

That is also what makes it useful right now rather than a nice anecdote. BTK
decision 2026/İK-THD/125 gives foreigners until 25 December 2026 to update their
mobile subscription records, with graduated restriction starting 5 September —
and a line can only be updated against a current kimlik record. So the reason
the owner went is the reason 240 readers are already on that page: the refresh
is the prerequisite, and the clock is running.

Published as `type = 'alert'`? No — 'news', but labelled in the title and the
first line as a field report (تجربة ميدانية), with the official document list
restated underneath so nobody travels on one person's experience. The invitation
to report other centres is the owner's, and it is the honest way to turn one
data point into many.
"""
import os, re

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def q(s):
    return str(s if s is not None else '').replace("'", "''")


TITLE = ('تجربة ميدانية من بيازيد: تحديث بيانات الكملك بالموعد والبطاقة فقط — '
         'وما الفرق بينه وبين تغيير العنوان؟')

SUMMARY = ('تجربة من مديرية الهجرة في بيازيد/كوم كابي بإسطنبول: مراجعة لتحديث بيانات الكملك لم '
           'يُطلب فيها سوى الموعد والبطاقة، وكانت سريعة. ننشرها بوصفها تجربة ميدانية لا قاعدة '
           'عامة، ونضع بجانبها قائمة الأوراق الرسمية — فالفارق بين «تحديث بيانات» و«تغيير عنوان» '
           'هو ما يحدّد ما سيُطلب منك. ويهمّ هذا الآن تحديداً لأنّ تحديث خط هاتفك باسمك يحتاج '
           'قيداً فعّالاً، والمهلة تنتهي في 25 كانون الأول 2026.')

CONTENT = (
    '<div style="background:#eff6ff;border-right:4px solid #3b82f6;padding:14px 18px;margin:0 0 18px;">'
    '<p style="margin:0;"><strong>هذه تجربة ميدانية، لا إعلان رسمي.</strong> نقلها فريق تحرير '
    'دليل العرب عن مراجعة واحدة، في مركز واحد، في يوم واحد. ننشرها لأنّها مفيدة، ونضع تحتها '
    'ما هو مقرَّر رسمياً — ولا تبنِ سفرك إلى المديرية على تجربة شخص واحد.</p></div>'

    '<h3>ما حدث</h3>'
    '<p>في مديرية الهجرة بمنطقة <strong>بيازيد / كوم كابي</strong> في إسطنبول، جرت مراجعة لتحديث '
    'بيانات بطاقة الحماية المؤقتة (الكملك). ولم يُطلب من المراجع سوى <strong>الموعد المحجوز '
    'والبطاقة نفسها</strong> — ولا أوراق أخرى — وأُنجز التحديث بسرعة.</p>'

    '<h3>ولماذا يهمّك هذا الآن؟</h3>'
    '<p>لأنّ كثيرين يحتاجون تحديث القيد ليستطيعوا <strong>تحديث بيانات خط هاتفهم باسمهم</strong>. '
    'وقرار هيئة الاتصالات BTK رقم 2026/İK-THD/125 يمنح الأجانب مهلةً لتحديث سجلّ الاشتراك تنتهي '
    'في <strong>25 كانون الأول/ديسمبر 2026</strong>، مع بدء تقييد تدريجي لبعض الخطوط غير '
    'المحدَّثة من <strong>5 أيلول/سبتمبر 2026</strong>. أي أنّ القيد الفعّال شرطٌ سابق، والوقت '
    'يمضي — <a href="/article/gecici-koruma-hat-guncelleme-2026">تفاصيل مهلة الخطوط هنا</a>.</p>'

    '<h3>الفارق الذي يفسّر «لماذا لم يطلبوا شيئاً»</h3>'
    '<p>هذا ليس تساهلاً من المركز، بل هو ما توثّقه أدلّتنا أصلاً: <strong>قائمة الأوراق تتبع '
    'سبب المراجعة</strong>.</p>'
    '<ul>'
    '<li><strong>تحديث بيانات / مراجعة دورية</strong> بلا تغيير في العنوان — البطاقة والموعد '
    'هما الأساس.</li>'
    '<li><strong>تغيير العنوان</strong> — هنا يُطلب إثبات السكن: عقد إيجار مسجَّل، أو فاتورة '
    'خدمات باسمك، أو وثيقة العنوان، وربّما كود UAVT (نمارتاي). '
    '<a href="/article/kimlik-data-update">تفصيل مهلة العشرين يوم عمل والخطوات</a>.</li>'
    '<li><strong>واقعة أخرى</strong> (زواج، ولادة، وفاة، تصحيح اسم) — يُطلب ما يثبتها. '
    '<a href="/article/kimlik-renewal-documents">قائمة الأوراق كاملةً</a>.</li>'
    '</ul>'
    '<p>فإن كانت مراجعتك تحديثَ بيانات فقط، فتجربة بيازيد متوافقة تماماً مع المقرَّر. وإن كنت '
    'تنقل عنوانك، فلا تذهب بالبطاقة وحدها.</p>'

    '<h3>وقبل أن تذهب</h3>'
    '<ul>'
    '<li>احجز الموعد أولاً — لا مراجعة بلا موعد، وضياعه يكلّفك أسابيع.</li>'
    '<li>خذ معك البطاقة، وأضف إثبات السكن <em>إن كان</em> سبب مراجعتك العنوان.</li>'
    '<li>وإن كنت في إسطنبول فراجع المركز التابع لك — '
    '<a href="/article/immigration-offices-istanbul">عناوين مراكز الهجرة الخمسة وأرقامها</a>.</li>'
    '<li>ولا تدفع لأحد مقابل «تدبير موعد»: المواعيد والخدمة مجانية بنصّ إعلان إدارة الهجرة.</li>'
    '</ul>'

    '<div style="background:#ecfdf5;border-right:4px solid #10b981;padding:14px 18px;margin:18px 0;">'
    '<p style="margin:0 0 8px;"><strong>وشاركنا تجربتك</strong></p>'
    '<p style="margin:0;">ما زلنا نجمع ما يُطلب فعلاً في بقية المراكز — سلطان بيلي، إسنيورت، '
    'توزلا، وخارج إسطنبول. إن راجعتَ مؤخّراً، أخبرنا: أي مركز، وما سبب المراجعة، وما الذي '
    'طُلب منك بالضبط. تجربةٌ واحدة خبر، وعشرون تجربة تصير خريطة يعتمد عليها الناس.</p></div>'
)

LINK = '/article/gecici-koruma-hat-guncelleme-2026'
SRC_NAME = ('تجربة ميدانية نقلها فريق تحرير دليل العرب — مديرية الهجرة بيازيد/كوم كابي، إسطنبول '
            '(6 آب/أغسطس 2026)، مع قائمة الأوراق الرسمية من أدلّة الموقع')

sql = """-- ============================================================================
-- تجربة ميدانية من بيازيد — تُنشَر بوصفها تجربة، لا قاعدة
-- ============================================================================
-- رواية صاحب الموقع: في مديرية الهجرة ببيازيد/كوم كابي، مراجعةُ تحديث بيانات
-- الكملك لم يُطلب فيها سوى الموعد والبطاقة، وكانت سريعة. وطلب نشرها، ودعوة
-- القرّاء إلى الإخبار عمّا يُطلب في بقية المراكز.
--
-- ── لماذا تُنشَر، ولماذا الصياغة هي كل شيء ─────────────────────────────
--
-- قاعدة هذا الموقع الثابتة: اربط كل خبر بمصدره الأوّلي، ولا تعمّم ممارسةً
-- محلّية إلى قاعدة — فغالبية القرّاء تحت الحماية المؤقتة، وقاعدةٌ لا تصحّ في
-- مديريتهم تكلّفهم موعداً يُنتظَر أسابيع. ومراجعةٌ واحدة في مركز واحد في يوم
-- واحد هي بالضبط شكل الادّعاء الذي وُضعت تلك القاعدة لمنعه.
--
-- غير أنّ الرواية لا تناقض الموقع فعلاً. صفحة kimlik-data-update تُدرج إثبات
-- العنوان بشرطه: «عقد إيجار + نمارتاي + فاتورة باسمك (إذا كان السبب عنوان)».
-- وصفحة kimlik-renewal-documents تقول: «ما يثبت العنوان إن كان سبب المراجعة
-- تغيّره». وتحديثُ البيانات ليس تغييرَ عنوان، فالقائمة الخفيفة تلزم عن أدلّة
-- الموقع نفسها. فالنشر الصادق ليس «بيازيد لا تطلب شيئاً»، بل «التحديث والنقل
-- مراجعتان مختلفتان، وهذا ما بدا عليه التحديث عملياً».
--
-- وهذا أيضاً ما يجعلها مفيدة الآن لا طُرفةً لطيفة: قرار BTK رقم
-- 2026/İK-THD/125 يمنح الأجانب مهلةً لتحديث سجلّ اشتراك الهاتف تنتهي في
-- 25 كانون الأول 2026، مع تقييد تدريجي من 5 أيلول — والخطّ لا يُحدَّث إلا
-- بقيدٍ فعّال. فسببُ ذهاب صاحب الموقع هو سببُ وجود 240 قارئاً على تلك الصفحة:
-- التحديث شرطٌ سابق، والوقت يمضي.
--
-- ولذلك: النوع 'news'، لكنّ العنوان وأول سطر يقولان «تجربة ميدانية»، وقائمة
-- الأوراق الرسمية موضوعة تحتها كي لا يسافر أحدٌ على تجربة شخص واحد. ودعوةُ
-- القرّاء إلى الإخبار عن مراكزهم هي دعوة صاحب الموقع، وهي الطريق الصادق
-- لتحويل نقطةٍ واحدة إلى خريطة.
--
-- آمن لإعادة التشغيل: WHERE NOT EXISTS على العنوان.
-- والرابط إلى /article/gecici-koruma-hat-guncelleme-2026 — مقال معتمَد موجود،
-- وهو الصفحة التي تحمل المهلة، لا صفحة قائمة.
-- ============================================================================

-- created_at is set back three hours ON PURPOSE. Two news rows land in the same
-- session, and the notification trigger fires on insert — so with both at NOW()
-- every subscriber's phone buzzes twice in one second. The publishing checklist
-- calls for spacing the secondary item; the YOK agreement is the harder news, so
-- it keeps NOW() and this one steps back.
INSERT INTO updates (type, title, summary, content, link, source_name, category, date, active, pinned, created_at)
SELECT 'news', '%s', '%s', '%s', '%s', '%s', 'general', DATE '2026-08-06', true, false, NOW() - INTERVAL '3 hours'
WHERE NOT EXISTS (SELECT 1 FROM updates WHERE title = '%s');

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int; bad int;
BEGIN
    SELECT count(*) INTO n FROM updates WHERE title = '%s';
    IF n <> 1 THEN
        RAISE EXCEPTION 'expected exactly 1 row, found %%', n;
    END IF;
    SELECT count(*) INTO bad FROM updates u
     WHERE u.title = '%s'
       AND NOT EXISTS (
           SELECT 1 FROM articles a
            WHERE a.status = 'approved'
              AND '/article/' || a.slug = u.link);
    IF bad > 0 THEN
        RAISE EXCEPTION 'the news links to an article that is not live';
    END IF;
END
$check$;

SELECT title, date, category, link, source_name FROM updates WHERE title = '%s';
""" % (q(TITLE), q(SUMMARY), q(CONTENT), q(LINK), q(SRC_NAME),
       q(TITLE), q(TITLE), q(TITLE), q(TITLE))

path = os.path.join(REPO, 'sql', '2026-08-06_news_beyazit_field_report.sql')
open(path, 'w', encoding='utf-8').write(sql)

_code = ' '.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('الإطار      : «تجربة ميدانية» في العنوان وأول سطر — لا قاعدة عامة')
print('التبرير     : أدلّة الموقع تشترط إثبات العنوان «إذا كان السبب عنوان» — فالرواية متّسقة')
print('الربط بالمهلة: BTK 25 كانون الأول 2026 + تقييد من 5 أيلول (الصفحة ذات 240 قراءة)')
print('الأوراق     : قائمة رسمية موضوعة تحت الرواية، مقسَّمة بحسب سبب المراجعة')
print('الدعوة      : طلب تجارب بقية المراكز — كما طلبتَ')
print('الرابط      :', LINK)
print('quote parity:', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written     :', path, len(sql), 'chars')
