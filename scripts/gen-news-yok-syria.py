# -*- coding: utf-8 -*-
"""YÖK–Syria higher-education agreement, and the sentence the coverage drops.

The story as it circulates: Turkey and Syria signed a cooperation agreement and
a memorandum on establishing a "Syrian-Turkish University" in Damascus.

That is true, and yok.gov.tr published it on 6 August 2026 — signed by YÖK
president Erol Özvar and Syria's Minister of Higher Education and Scientific
Research Mervan El Halebi. But the official text carries one sentence that the
agency copy leaves out, and it is the sentence that decides what a reader should
do about it:

    «Üniversitenin kurulması ise taraflar arasında yapılacak müteakip
     anlaşmalara ve her iki ülkedeki hukuki süreçlerin tamamlanmasına
     bağlı olacak.»

The university's establishment depends on later agreements between the parties
and on completing the legal processes in both countries. Nothing in the document
opens a university, an admission, or a scholarship.

And the archive of the same primary source supplies the context that turns this
from an announcement into a pattern. On 16 May 2025, yok.gov.tr published
«Türkiye ile Suriye arasında ortak üniversite kuruluyor» — the SAME two
officials, signing a protocol for the same university, with the matters in it
«üç ay içinde tamamlanacak», to be completed within three months. Fifteen months
later the establishment is still conditional on legal procedures in both
countries.

So the honest version of this news is not «a university is being established».
It is: two governments restated an intention, and the document itself says the
university does not exist until further agreements pass through both legal
systems. For a Syrian student deciding where to enrol this year, that difference
is the whole story.

NO COMPANION ARTICLE. The publishing checklist asks whether the news explains a
service the reader performs themselves. This one does not: there is nothing to
apply for. The single clause that touches a reader today — «akademik derece ve
diplomaların tanınması» — is degree recognition, which is decided by YÖK under
its existing denklik rules and is unchanged by this agreement. The site already
has that guide, so the news links there instead of spawning a thin page about a
university that has not been founded.
"""
import os, re

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def q(s):
    return str(s if s is not None else '').replace("'", "''")


TITLE = ('تركيا وسوريا توقّعان اتفاقية تعليم عالٍ ومذكّرة لجامعة في دمشق — '
         'والإنشاء ما زال معلّقاً على إجراءات قانونية في البلدين')

SUMMARY = ('وقّع مجلس التعليم العالي التركي (YÖK) ووزارة التعليم العالي والبحث العلمي السورية في '
           '6 آب/أغسطس 2026 اتفاقية تعاون ومذكّرة تفاهم بشأن «الجامعة السورية التركية» المزمع '
           'إنشاؤها في دمشق. وتشمل الاتفاقية منحاً ومقاعد متبادلة، والاعتراف بالدرجات والشهادات، '
           'وتسهيل الانتقال بين الجامعات، ومنتدىً سنوياً. لكنّ نصّ YÖK نفسه يقول إنّ إنشاء الجامعة '
           'يبقى معلّقاً على اتفاقيات لاحقة وعلى استكمال الإجراءات القانونية في البلدين — ولا '
           'يفتح اليوم قبولاً ولا منحة.')

CONTENT = (
    '<p>وقّع <strong>مجلس التعليم العالي التركي (YÖK)</strong> و<strong>وزارة التعليم العالي '
    'والبحث العلمي</strong> في الجمهورية العربية السورية، يوم <strong>6 آب/أغسطس 2026</strong>، '
    'وثيقتين: اتفاقية تعاون في التعليم العالي والبحث العلمي والتكنولوجيا، ومذكّرة تفاهم بشأن '
    '<strong>«الجامعة السورية التركية» (Suriye-Türkiye Üniversitesi)</strong> المزمع إنشاؤها في '
    'دمشق. ووقّعها عن الجانب التركي رئيس المجلس <strong>البروفيسور إيرول أوزفار</strong>، وعن '
    'الجانب السوري الوزير <strong>مروان الحلبي</strong>.</p>'

    '<h3>ما تنصّ عليه الاتفاقية</h3>'
    '<ul>'
    '<li>تخصيص <strong>منح ومقاعد دراسية متبادلة</strong> بين البلدين.</li>'
    '<li><strong>الاعتراف بالدرجات الأكاديمية والشهادات</strong>.</li>'
    '<li><strong>تسهيل الانتقال الأفقي</strong> (yatay geçiş) للطلاب السوريين بين الجامعات.</li>'
    '<li>برامج تعليمية في التكنولوجيا المتقدّمة، ودعم البنية التحتية الرقمية للجامعات السورية.</li>'
    '<li>تبادل الأكاديميين والطلاب، ومشاريع بحث مشتركة، وبرامج مشتركة للبكالوريوس والماجستير '
    'والدكتوراه، والتعاون في ضمان الجودة والاعتماد الأكاديمي.</li>'
    '<li><strong>منتدى الجامعات التركية السورية</strong> سنوياً بالتناوب بين البلدين، ودراسة '
    'تطبيق برنامج <strong>«الجامعات الشقيقة (التوأمة)»</strong>.</li>'
    '</ul>'

    '<h3>والجملة التي تسقط من أكثر ما نُشر</h3>'
    '<div style="background:#fff7ed;border-right:4px solid #ea580c;padding:14px 18px;margin:16px 0;">'
    '<p style="margin:0 0 8px;">نصّ بيان YÖK يقول حرفياً:</p>'
    '<p style="margin:0 0 8px;" dir="ltr"><em>«Üniversitenin kurulması ise taraflar arasında '
    'yapılacak müteakip anlaşmalara ve her iki ülkedeki hukuki süreçlerin tamamlanmasına bağlı '
    'olacak.»</em></p>'
    '<p style="margin:0;">أي أنّ <strong>إنشاء الجامعة معلَّق على اتفاقيات لاحقة بين الطرفين، '
    'وعلى استكمال الإجراءات القانونية في كلا البلدين</strong>. والمذكّرة نفسها تقول إنّ الطرفين '
    '<em>سيواصلان</em> العمل على تحديد الإطار القانوني وهيكل الحوكمة والتنظيم الأكاديمي وآليات '
    'قبول الطلاب وضمان الجودة والترتيبات الإدارية — أي أنّ هذه كلّها لم تُحدَّد بعد.</p></div>'

    '<h3>وهذه ليست المرّة الأولى</h3>'
    '<p>في <strong>16 أيار/مايو 2025</strong> نشر المجلس نفسه خبراً بعنوان «تُنشَأ جامعة مشتركة '
    'بين تركيا وسوريا»، عن بروتوكول وقّعه <strong>الشخصان نفساهما</strong> — أوزفار والحلبي — '
    'عن الجامعة نفسها، وجاء فيه أنّ ما ورد في البروتوكول <em>«سيُنجَز خلال ثلاثة أشهر»</em>. '
    'وبعد خمسة عشر شهراً، ما زال الإنشاء معلّقاً على إجراءات قانونية في البلدين. '
    'نذكر هذا لا تشكيكاً في الاتفاقية، بل لأنّ من يخطّط لدراسته يحتاج أن يعرف الفرق بين '
    '<strong>إعلان نيّة</strong> و<strong>جامعة تفتح أبوابها</strong>.</p>'

    '<h3>ماذا يعني هذا لك اليوم؟</h3>'
    '<p><strong>لا شيء يتغيّر الآن عملياً.</strong> لا يوجد قبول مفتوح في «الجامعة السورية '
    'التركية»، ولا إعلان منح صادر بموجب هذه الاتفاقية، ولا تعديل على قواعد معادلة الشهادات.</p>'
    '<ul>'
    '<li><strong>معادلة شهادتك (Denklik)</strong> تبقى اليوم خاضعة لقواعد YÖK النافذة كما هي — '
    'والاتفاقية تعبّر عن نيّة، لا تغيّر الإجراء. '
    '<a href="/article/diploma-denklik-syrians-arabs-2026">اقرأ إجراء المعادلة الحالي</a>.</li>'
    '<li><strong>المنح</strong>: ما هو قائم فعلاً اليوم هو منحة الحكومة التركية وبرامج الجامعات — '
    '<a href="/article/scholarship-turkiye-burslari">دليل منحة تركيا بورسلاري</a>.</li>'
    '<li><strong>الدراسة في تركيا</strong> عموماً: '
    '<a href="/article/study-in-turkey-universities-2026">الدليل الشامل</a>.</li>'
    '</ul>'
    '<p>وحين يصدر عن الجامعة إعلان قبول أو منحة فعلية، سنغطّيه بمصدره الرسمي. '
    'وحتى ذلك الحين، احذر من يعرض عليك «تسجيلاً مبكراً» أو «حجز مقعد» في جامعة لم تُنشَأ بعد.</p>'
)

LINK = '/article/diploma-denklik-syrians-arabs-2026'
SRC_URL = 'https://www.yok.gov.tr/tr/news/turkiye-ile-suriye-arasinda-yuksekogretimde-kapsamli-is-birligi-Bv1pa'
SRC_NAME = 'مجلس التعليم العالي التركي (YÖK) — بيان رسمي بتاريخ 6 آب/أغسطس 2026'

sql = """-- ============================================================================
-- اتفاقية YÖK وسوريا للتعليم العالي — والجملة التي يُسقطها التداول
-- ============================================================================
-- الخبر كما يدور: تركيا وسوريا وقّعتا اتفاقية تعاون ومذكّرة لإنشاء «الجامعة
-- السورية التركية» في دمشق. وهذا صحيح، ونشره yok.gov.tr يوم 6 آب/أغسطس 2026،
-- ووقّعه رئيس المجلس إيرول أوزفار ووزير التعليم العالي والبحث العلمي السوري
-- مروان الحلبي.
--
-- لكنّ النصّ الرسمي يحمل جملةً تسقط من نقل الوكالة، وهي الجملة التي تقرّر ما
-- ينبغي للقارئ أن يفعله:
--
--   «Üniversitenin kurulması ise taraflar arasında yapılacak müteakip
--    anlaşmalara ve her iki ülkedeki hukuki süreçlerin tamamlanmasına
--    bağlı olacak.»
--
-- أي أنّ إنشاء الجامعة معلّق على اتفاقيات لاحقة وعلى استكمال الإجراءات
-- القانونية في البلدين. ولا شيء في الوثيقة يفتح جامعةً ولا قبولاً ولا منحة.
--
-- وأرشيف المصدر الأوّلي نفسه يعطي السياق الذي يحوّل هذا من إعلانٍ إلى نمط:
-- في 16 أيار/مايو 2025 نشر yok.gov.tr خبر «Türkiye ile Suriye arasında ortak
-- üniversite kuruluyor» — الشخصان نفساهما، والجامعة نفسها، وبروتوكول جاء فيه
-- أنّ ما ورد فيه «üç ay içinde tamamlanacak». وبعد خمسة عشر شهراً ما زال
-- الإنشاء معلّقاً على إجراءات قانونية في البلدين.
--
-- فالصيغة الصادقة ليست «جامعة تُنشَأ»، بل: حكومتان جدّدتا إعلان نيّة، والوثيقة
-- نفسها تقول إنّ الجامعة لا توجد حتى تمرّ اتفاقيات لاحقة في نظامَين قانونيَّين.
-- وللطالب السوري الذي يقرّر أين يسجّل هذا العام، هذا الفرق هو الخبر كلّه.
--
-- ── ولا مقال مرافق ─────────────────────────────────────────────────────
--
-- تسأل قائمة النشر: هل يشرح الخبر خدمةً يفعلها القارئ بنفسه؟ لا: لا يوجد ما
-- يُقدَّم عليه. والبند الوحيد الذي يمسّ القارئ اليوم — «الاعتراف بالدرجات
-- والشهادات» — هو معادلة الشهادة، وتقرّرها YÖK بقواعدها النافذة ولم تتغيّر
-- بهذه الاتفاقية. والموقع يملك ذلك الدليل، فالخبر يحيل إليه بدل أن يولّد صفحةً
-- رقيقة عن جامعة لم تُنشَأ.
--
-- ورابط الخبر يشير إلى /article/<slug> موجود ومعتمَد، لا إلى صفحة قائمة.
-- وهو الخبر الوحيد المُدرَج، فلا حاجة لتباعد الإشعارات.
--
-- آمن لإعادة التشغيل: WHERE NOT EXISTS على العنوان.
-- ============================================================================

INSERT INTO updates (type, title, summary, content, link, source_url, source_name, category, date, active, pinned)
SELECT 'news', '%s', '%s', '%s', '%s', '%s', '%s', 'education', DATE '2026-08-06', true, false
WHERE NOT EXISTS (SELECT 1 FROM updates WHERE title = '%s');

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int; bad int;
BEGIN
    SELECT count(*) INTO n FROM updates WHERE title = '%s';
    IF n <> 1 THEN
        RAISE EXCEPTION 'expected exactly 1 row, found %%', n;
    END IF;
    -- the link must point at an article that exists and is approved
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

SELECT title, date, category, link, source_name FROM updates
WHERE title = '%s';
""" % (q(TITLE), q(SUMMARY), q(CONTENT), q(LINK), q(SRC_URL), q(SRC_NAME),
       q(TITLE), q(TITLE), q(TITLE), q(TITLE))

path = os.path.join(REPO, 'sql', '2026-08-06_news_yok_syria_university.sql')
open(path, 'w', encoding='utf-8').write(sql)

_code = ' '.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('العنوان يقول «معلّق» لا «تُنشَأ» — وهو ما يقوله النصّ الرسمي')
print('الجملة المُسقَطة  : مقتبَسة بالتركية حرفياً + ترجمتها')
print('سابقة أيار 2025  : مضافة من أرشيف YÖK نفسه (نفس الموقّعَين، «ثلاثة أشهر»)')
print('مقال مرافق       : لا — لا إجراء يفعله القارئ؛ الرابط إلى دليل المعادلة')
print('الرابط           :', LINK)
print('المصدر           :', SRC_URL)
print('حارس في DO block : الرابط يجب أن يشير إلى مقال معتمَد موجود')
print('quote parity     :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written          :', path, len(sql), 'chars')
