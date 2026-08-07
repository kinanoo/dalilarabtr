# -*- coding: utf-8 -*-
"""Family-reunion update: the sponsor-side document lists, split by status.

── what is new (from the owner-editor's field verification) ───────────────

The article published 2026-08-06 carries the APPLICANT-side list from the
visa centre. What it lacked — and what no page in this niche spells out — is
the SPONSOR side, split by the sponsor's status:

  A. Turkish-citizen sponsor: noter invitation (Taahhütname), 6-month bank
     statement signed by the bank, family booklet pages, ID copy, Nüfus
     Kayıt Örneği, Evlenme Belgesi, Adli Sicil, the address document, tapu
     copy if property is owned, and the employment file (Maaş Bordrosu +
     SGK Tescil ve Hizmet Dökümü / İşyeri Unvan Listesi).
  B. THE HEADLINE — kimlik holder WITH A WORK PERMIT can now sponsor a
     spouse from Syria, applying directly in Damascus. Prerequisites first:
     the marriage must be registered in Syria, translated and attested via
     the Turkish-embassy chain, AND the kimlik marital status must read
     married. Then: noter invitation, bank statement, the work permit, and
     the SGK document.

Cleanups applied to the raw notes: «تعهّد نعمة» is the Taahhütname (a typo),
«Evlenmek belgesi» → Evlenme Belgesi, «ورقة السكورتا» → SGK document, and
the third SGK line in the notes is the same Tescil ve Hizmet Dökümü header —
merged as one item rather than listed twice.

Attribution: the applicant list stays on the visa centre; the sponsor lists
are attributed to the editorial team's field verification alongside the
centre's requirements — with the standing caution kept that the mission may
request more (the existing article already says the list is a floor, not a
ceiling).

── and the news goes back to the top ─────────────────────────────────────

The existing news row (link = /article/family-reunion-visa-syria-2026) gets
the manşet the owner asked for — work-permit holders can bring their spouses,
applying from Damascus directly — with date = CURRENT_DATE so it tops the
homepage rail today, pinned, and a content refresh that carries the two
sponsor paths. Updating the same row (not inserting) keeps one story = one
card in the dedup model.
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


def _no_bare_percent(t):
    for i, line in enumerate(t.splitlines(), 1):
        if '%' in re.sub(r'%[s%]', '', line):
            raise AssertionError('bare %% in SQL template, line %d: %s' % (i, line.strip()))
    return t


ART = 'family-reunion-visa-syria-2026'
a = get('articles?select=id,slug,status,details,source&slug=eq.' + ART)[0]
assert a['status'] == 'approved' and a['id'] == a['slug']
assert 'بحسب صفة المستضيف' not in a['details'], 'already updated'
n = get('updates?select=id,title&link=eq.' + urllib.parse.quote('/article/' + ART, safe=''))
assert len(n) == 1, 'expected exactly one news row'
for s in ('family-register-foreign-marriage', 'kimlik-data-update', 'bank-account-opening',
          'work-permit-turkey-2026', 'civil-marriage-registration-turkey'):
    r = get('articles?select=status&slug=eq.' + s)
    assert r and r[0]['status'] == 'approved', s + ' not live'

ADD = (
    '<h2>قوائم المستضيف التفصيلية — بحسب صفة المستضيف في تركيا</h2>'
    '<p>القائمة العامة أعلاه هي قائمة مركز التقديم. وعملياً، ما يُطلب من '
    '<strong>المستضيف داخل تركيا</strong> يتفصّل بحسب صفته — وهذا التفصيل من التحقّق '
    'الميداني لفريق التحرير مع قوائم المركز، ويبقى للبعثة طلب المزيد:</p>'

    '<h3>المستضيف مواطن تركي (الزوج/الزوجة تركية الجنسية)</h3>'
    '<ul>'
    '<li><strong>دعوة موثَّقة لدى النوتر</strong> — تعهّد (<span dir="ltr">Taahhütname</span>).</li>'
    '<li><strong>كشف حساب بنكي لآخر ستة أشهر</strong> موقَّعاً من البنك.</li>'
    '<li><strong>دفتر العائلة التركي</strong> — نسخة الصفحات التي فيها بيانات الزوجين.</li>'
    '<li>صورة عن <strong>الهوية التركية</strong>.</li>'
    '<li><strong>قيد النفوس</strong> (<span dir="ltr">Nüfus Kayıt Örneği</span>).</li>'
    '<li><strong>وثيقة الزواج</strong> من النفوس (<span dir="ltr">Evlenme Belgesi</span>).</li>'
    '<li><strong>لا حكم عليه</strong> (<span dir="ltr">Adli Sicil</span>).</li>'
    '<li><strong>وثيقة العنوان</strong> (<span dir="ltr">Yerleşim Yeri ve Diğer Adres '
    'Belgesi</span>).</li>'
    '<li>وإن وُجد عقار مملوك في تركيا: صورة عن <strong>الطابو</strong> — تقوّي الملف.</li>'
    '</ul>'
    '<p><strong>وإثبات العمل للمستضيف الموظّف:</strong></p>'
    '<ul>'
    '<li>قسيمة الراتب (<span dir="ltr">Maaş Bordrosu</span>).</li>'
    '<li>وثيقة التسجيل والخدمات من الضمان الاجتماعي '
    '(<span dir="ltr">SGK Tescil ve Hizmet Dökümü</span>) مع قائمة جهة العمل '
    '(<span dir="ltr">İşyeri Unvan Listesi</span>) — تُستخرج من e-Devlet.</li>'
    '</ul>'

    '<h3>المستضيف سوري حامل كملك ومعه إذن عمل — وهذا هو الجديد المهم</h3>'
    '<p>صار بإمكان السوري المقيم بالحماية المؤقتة <strong>الحاصل على إذن عمل</strong> أن '
    'يستقدم زوجه من سوريا بتأشيرة لمّ الشمل، بالتقديم <strong>مباشرةً من دمشق</strong>. '
    'وقبل تجهيز أي ورقة، شرطان تأسيسيان يقف عليهما الملف كلّه:</p>'
    '<ol>'
    '<li><strong>الزواج مثبَّت في سوريا</strong>، ومترجَم ومصدَّق بسلسلة التصديق حتى '
    'الجهات التركية — <a href="/article/family-register-foreign-marriage">مسار تثبيت '
    'الزواج الخارجي وسلسلة التصديق الصحيحة</a> (ولا «أبوستيل» للوثائق السورية).</li>'
    '<li><strong>حالتك الاجتماعية على الكملك: متزوّج</strong> — إن لم تكن محدَّثة فابدأ '
    'من <a href="/article/kimlik-data-update">تحديث بيانات الكملك</a> قبل أي شيء.</li>'
    '</ol>'
    '<p><strong>ثم الأوراق الأساسية:</strong></p>'
    '<ul>'
    '<li><strong>دعوة موثَّقة لدى النوتر</strong> (تعهّد استضافة).</li>'
    '<li><strong>كشف حساب بنكي</strong> — والحساب باسمك أنت '
    '(<a href="/article/bank-account-opening">فتح الحساب البنكي</a> إن لم يكن لك حساب).</li>'
    '<li><strong>إذن العمل</strong> ساري المفعول '
    '(<a href="/article/work-permit-turkey-2026">دليل إذن العمل</a>).</li>'
    '<li><strong>وثيقة الضمان الاجتماعي</strong> (SGK) التي تثبت عملك المسجَّل.</li>'
    '</ul>'
    '<p>وهذه هي الأساسيات — وتُضاف أوراق بحسب كل حالة بتقدير البعثة، فلا تعتبر القائمة '
    'سقفاً.</p>'

    '<div style="background:#ecfdf5;border-right:4px solid #10b981;padding:14px 18px;margin:18px 0;">'
    '<p style="margin:0;"><strong>الترتيب الذي يوفّر عليك شهوراً:</strong> ثبّت الزواج '
    'وصدّقه ← حدّث حالة الكملك ← جهّز ملف المستضيف (دعوة النوتر والحساب وإذن العمل '
    'وSGK) ← ثم يقدّم الطرف الآخر طلبه في دمشق بقائمة المتقدّم أعلاه. من عكس الترتيب '
    'عاد من نقطة الصفر.</p></div>'
)

NEW_SOURCE = ((a['source'] or '') +
              ' — وقوائم المستضيف التفصيلية (المواطن التركي، وحامل الكملك بإذن عمل) '
              'بالتحقّق الميداني لفريق تحرير دليل العرب مع متطلّبات المركز، آب/أغسطس 2026')

N_TITLE = ('رسمياً: السوري حامل إذن العمل يستطيع جلب زوجته من سوريا — فيزا لمّ الشمل '
           'تُطلب من دمشق مباشرة')
N_SUMMARY = ('تسهيلات جديدة للسوريين المقيمين في تركيا: حامل الكملك الحاصل على إذن عمل صار '
             'يستطيع استقدام زوجه من سوريا بتأشيرة لمّ شمل تُقدَّم مباشرةً في السفارة '
             'التركية بدمشق — بعد أن كان الطريق بيروت. الشرطان التأسيسيان: زواج مثبَّت '
             'ومصدَّق، وحالة «متزوّج» على الكملك. والقوائم الكاملة للأوراق — للمستضيف '
             'المواطن التركي ولحامل الكملك وللمتقدّم في سوريا — في الدليل المرافق.')
N_CONTENT = (
    '<p>في إطار التسهيلات المتوالية على السوريين المقيمين في تركيا، تأكّد ميدانياً أنّ '
    '<strong>حامل الكملك الحاصل على إذن عمل</strong> يستطيع استقدام زوجه من سوريا '
    'بتأشيرة لمّ شمل العائلة، بالتقديم <strong>مباشرةً من دمشق</strong> عبر مركز طلبات '
    'التأشيرات — بعد أن كان هذا الباب يمرّ ببيروت.</p>'
    '<h3>الشرطان قبل أي ورقة</h3>'
    '<ol>'
    '<li>زواج <strong>مثبَّت في سوريا ومترجَم ومصدَّق</strong> بسلسلة التصديق.</li>'
    '<li>حالة <strong>«متزوّج» على الكملك</strong> — حدّثها أولاً إن لم تكن كذلك.</li>'
    '</ol>'
    '<h3>أساسيات ملف المستضيف حامل الكملك</h3>'
    '<p>دعوة موثَّقة لدى النوتر (تعهّد)، وكشف حساب بنكي باسمه، وإذن العمل ساري المفعول، '
    'ووثيقة SGK — وتُضاف أوراق بحسب الحالة بتقدير البعثة.</p>'
    '<h3>وللمستضيف المواطن التركي</h3>'
    '<p>قائمة أوسع: دعوة النوتر، وكشف حساب ستة أشهر موقَّعاً من البنك، ودفتر العائلة، '
    'وقيد النفوس ووثيقة الزواج والسجل العدلي ووثيقة العنوان، وملف إثبات العمل '
    '(قسيمة الراتب ووثيقة SGK).</p>'
    '<p style="margin-top:1rem;"><a href="/article/family-reunion-visa-syria-2026">'
    '<strong>القوائم الكاملة الثلاث + ترتيب الخطوات الذي يوفّر شهوراً ← الدليل '
    'الشامل</strong></a></p>'
)

for label, body, needles in [
    ('article add', ADD, ['Taahhütname', 'Nüfus Kayıt Örneği', 'Evlenme Belgesi',
                          'SGK Tescil ve Hizmet Dökümü', 'family-register-foreign-marriage',
                          'kimlik-data-update', 'إذن عمل', 'مباشرةً من دمشق']),
    ('news', N_CONTENT, ['إذن عمل', 'دمشق', 'family-reunion-visa-syria-2026', 'متزوّج']),
]:
    for nd in needles:
        assert nd in body, 'PREDICATE WOULD LIE: %r not in %s' % (nd, label)
assert 'تعهّد نعمة' not in ADD and 'سكورتا' not in ADD and 'Evlenmek' not in ADD

sql = _no_bare_percent("""-- ============================================================================
-- لمّ الشمل: قوائم المستضيف بحسب صفته — والمانشيت: حامل إذن العمل يجلب زوجته من دمشق
-- ============================================================================
-- المقال المنشور في 2026-08-06 يحمل قائمة المتقدّم من مركز التقديم. الجديد
-- من التحقّق الميداني لفريق التحرير هو شقّ المستضيف، مفصّلاً بصفته:
--   أ. المستضيف المواطن التركي: دعوة النوتر (Taahhütname)، وكشف حساب ستة
--      أشهر موقَّعاً من البنك، ودفتر العائلة، وقيد النفوس، ووثيقة الزواج،
--      والسجل العدلي، ووثيقة العنوان، والطابو إن وُجد، وملف العمل
--      (قسيمة الراتب + وثيقة SGK).
--   ب. المانشيت: حامل الكملك «بإذن عمل» صار يستقدم زوجه من سوريا بالتقديم
--      مباشرة من دمشق — بشرطين تأسيسيين قبل الأوراق: زواج مثبَّت ومصدَّق
--      (مربوط بدليل تثبيت الزواج الخارجي — ولا أبوستيل للوثائق السورية)،
--      وحالة «متزوّج» على الكملك (مربوط بدليل تحديث البيانات).
--
-- تنظيفات على المسودة الخام: «تعهّد نعمة» هي Taahhütname (خطأ إملائي)،
-- وEvlenmek → Evlenme Belgesi، و«السكورتا» → وثيقة SGK، وسطرا SGK في
-- المسودة وثيقة واحدة (Tescil ve Hizmet Dökümü) فدُمجا.
--
-- والخبر القائم (صف updates نفسه — قصة واحدة = بطاقة واحدة) يُرفع بمانشيت
-- جديد وتاريخ اليوم ليتصدّر الشريط، مثبَّتاً.
--
-- آمن لإعادة التشغيل.
-- ============================================================================

-- 1. المقال: قسم قوائم المستضيف (محروس) + تحديث المصدر
UPDATE articles SET
    details = details || '%s',
    source = '%s',
    seo_description = 'تحديث مهم: حامل الكملك بإذن عمل يستقدم زوجه من سوريا بالتقديم من دمشق مباشرة — القوائم الكاملة الثلاث: أوراق المتقدّم، والمستضيف التركي، وحامل الكملك، مع ترتيب الخطوات الصحيح.',
    last_update = CURRENT_DATE
WHERE slug = '%s' AND details NOT LIKE '%%بحسب صفة المستضيف%%';

-- 2. الخبر: المانشيت الجديد + تاريخ اليوم + تثبيت (الصف القائم نفسه)
UPDATE updates SET
    title = '%s',
    summary = '%s',
    content = '%s',
    date = CURRENT_DATE,
    pinned = true,
    active = true
WHERE link = '/article/%s';

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE cnt int;
BEGIN
    SELECT count(*) INTO cnt FROM articles
     WHERE slug = '%s' AND status = 'approved'
       AND details LIKE '%%بحسب صفة المستضيف%%'
       AND details LIKE '%%Taahhütname%%' AND details LIKE '%%Evlenme Belgesi%%';
    IF cnt <> 1 THEN RAISE EXCEPTION 'the sponsor-docs section did not land'; END IF;

    SELECT count(*) INTO cnt FROM articles
     WHERE slug = '%s' AND (details LIKE '%%تعهّد نعمة%%' OR details LIKE '%%سكورتا%%');
    IF cnt > 0 THEN RAISE EXCEPTION 'a raw-draft typo reached the page'; END IF;

    SELECT count(*) INTO cnt FROM updates
     WHERE link = '/article/%s' AND pinned AND date = CURRENT_DATE
       AND title LIKE '%%إذن العمل%%';
    IF cnt <> 1 THEN RAISE EXCEPTION 'the news manşet did not land'; END IF;
END
$check$;

SELECT 'article: sponsor lists live (citizen + kimlik/work-permit)' AS البند,
       (details LIKE '%%بحسب صفة المستضيف%%')::text AS النتيجة
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'news: manşet on top, pinned, dated today',
       (pinned AND date = CURRENT_DATE)::text
FROM updates WHERE link = '/article/%s'
UNION ALL
SELECT 'news title', title FROM updates WHERE link = '/article/%s';
""") % (q(ADD), q(NEW_SOURCE), ART,
        q(N_TITLE), q(N_SUMMARY), q(N_CONTENT), ART,
        ART, ART, ART,
        ART, ART, ART)

path = os.path.join(REPO, 'sql', '2026-08-07_family_reunion_sponsor_docs.sql')
open(path, 'w', encoding='utf-8', newline='').write(sql)

_code = '\n'.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('المقال       : %s += قسم المستضيفين (%d حرفاً) — مواطن تركي + كملك/إذن عمل' % (ART, len(ADD)))
print('الشرطان      : تثبيت الزواج (مربوط بدليل التصديق) + «متزوّج» على الكملك')
print('الخبر        : مانشيت جديد + تاريخ اليوم + مثبَّت — الصف القائم نفسه (لا تكرار)')
print('تنظيفات      : تعهّد نعمة←Taahhütname | Evlenmek←Evlenme | سكورتا←SGK | سطرا SGK دُمجا')
print('quote parity :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written      :', path, len(sql), 'chars')
