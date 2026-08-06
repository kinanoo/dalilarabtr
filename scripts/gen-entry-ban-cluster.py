# -*- coding: utf-8 -*-
"""Entry-ban cluster: the official two tables, and two of our own pages corrected.

── why this exists ────────────────────────────────────────────────────────

The owner sent five law-firm pages that outrank us on «حظر الدخول إلى تركيا» /
overstay queries. Mapping them showed they contradict each other (one says the
ban is "1 month to 15 years", another "5 months to 5 years") and all of them
publish a graduated overstay→ban table with no citation.

Hunting the primary source found it: Göç İdaresi's own statement of
09.06.2020 («Yasal Kalış Hakkı İhlalinde Bulunan Yabancılara Uygulanacak
Giriş Yasaklarına İlişkin Açıklama», goc.gov.tr). The table is REAL and
official — and there are TWO tables, not one:

  A. voluntary exit + fines paid (Harçlar Kanunu 492):
     3–6mo → 1mo · 6mo–1yr → 3mo · 1–2yr → 1yr · 2–3yr → 2yr · >3yr → 5yr
  B. deported / fines unpaid / did not leave in time:
     ≤3mo → 3mo · 3–6mo → 6mo · 6mo–1yr → 1yr · 1–2yr → 2yr · >2yr → 5yr

  Plus the rule everyone omits: even after the ban expires, entry stays
  blocked until unpaid fines and public debts are settled (arts 7 & 15).

── which corrects US twice ───────────────────────────────────────────────

1. overstay-solutions says «ولا سند لهذه الجداول» — wrong. There is a source,
   and it is the directorate itself. The refutation block is replaced with
   the two-table truth. What WAS right in our page stays: the art. 9 ceiling
   (5 years, extendable up to 10 more only for a serious public-order/security
   threat) and the three-decisions/three-deadlines core.
2. turkey-visa-types-2026 (1,101 views) publishes a third table — «شهر يقابله
   شهر، 3 أشهر يقابلها 3 أشهر» — matching NEITHER official table. Replaced.
   Its «الدفع خلال 10 أيام في قنصلية» claim has no source found; dropped.

── and what is refused from the competitor pages ─────────────────────────

* istaproperty's dollar fine table ($50 first month + $10/month) — a
  real-estate blog with no citation; fines follow the Harçlar 492 tariff and
  are computed per case. The mechanism is described, no dollar figures.
* "5 months to 5 years" (selcuklawfirm) — matches nothing official.
* The competitor framing that the graduated table is THE rule — it is
  administrative practice under the art. 9 ceiling, and it applies to
  legal-stay violations; the harsher deported/unpaid table is the one their
  pages omit entirely.

── audience note (سوريون تحت الحماية المؤقتة) ─────────────────────────────

This cluster concerns visa/residence holders. Temporary-protection departures
run under different rules (voluntary-return procedure, V-87 etc.) — the
pillar says so explicitly up top and routes TP readers to their pages, per
the CLAUDE.md rule that generalising a non-kimlik rule to kimlik holders is
direct harm.
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


PILLAR = 'turkey-entry-ban-2026'

# ── preconditions against the live rows ───────────────────────────────────
assert not get('articles?select=slug&slug=eq.' + PILLAR), 'pillar already exists'

ov = get('articles?select=details,source&slug=eq.overstay-solutions')[0]
OV_NEEDLE = ('<h4>لا تصدّق أي «جدول» يربط مدة التجاوز بمدة المنع</h4>')
assert ov['details'].count(OV_NEEDLE) == 1, 'overstay needle moved'
# the whole wrong block: h4 + the paragraph that follows it
m = re.search(re.escape(OV_NEEDLE) + r'\s*<p>.*?</p>', ov['details'], re.S)
assert m, 'overstay block shape changed'
OV_OLD = m.group(0)

vt = get('articles?select=details&slug=eq.turkey-visa-types-2026')[0]
m2 = re.search(r'<h2>تجاوز مدة الفيزا وعقوباته</h2>\s*<p>.*?</p>', vt['details'], re.S)
assert m2 and 'شهر تجاوز تقريباً يقابله حظر شهر' in m2.group(0), 'visa-types needle moved'
VT_OLD = m2.group(0)

for s in ('tahdit-entry-restriction-codes-how-to-object', 'deportation-rights',
          'voluntary-return-syria-procedure-2026', 'residence-rejection-appeal-turkey-2026',
          'kimlik-temporary-protection-syria-2026', 'undocumented-status'):
    r = get('articles?select=status&slug=eq.' + s)
    assert r and r[0]['status'] == 'approved', s + ' not live'

# ── the pillar ────────────────────────────────────────────────────────────
TABLE_A = [('من 3 إلى 6 أشهر', 'شهر واحد'), ('من 6 أشهر إلى سنة', '3 أشهر'),
           ('من سنة إلى سنتين', 'سنة واحدة'), ('من سنتين إلى 3 سنوات', 'سنتان'),
           ('أكثر من 3 سنوات', '5 سنوات')]
TABLE_B = [('حتى 3 أشهر', '3 أشهر'), ('من 3 إلى 6 أشهر', '6 أشهر'),
           ('من 6 أشهر إلى سنة', 'سنة واحدة'), ('من سنة إلى سنتين', 'سنتان'),
           ('أكثر من سنتين', '5 سنوات')]
rows_a = ''.join('<tr><td>%s</td><td><strong>%s</strong></td></tr>' % r for r in TABLE_A)
rows_b = ''.join('<tr><td>%s</td><td><strong>%s</strong></td></tr>' % r for r in TABLE_B)

P_TITLE = ('حظر الدخول إلى تركيا 2026: الجدولان الرسميان للمدد، ودعوى الرفع، '
           'والفيزا المشروحة (Meşruhatlı)')
P_INTRO = ('كم مدة حظر الدخول إلى تركيا؟ تنتشر جداول متناقضة، والحقيقة أنّ إدارة الهجرة نشرت '
           'بنفسها جدولين رسميين لا واحداً: جدولاً أخفّ لمن خرج طوعاً ودفع غرامته، وجدولاً أقسى '
           'لمن رُحّل أو لم يدفع. طريقة خروجك تُغيّر مدّة حظرك أكثر ممّا تغيّرها مدة تجاوزك. '
           'وهذا الدليل يجمع الجدولين، وسقف القانون، وطرق الرفع الثلاث — الانتظار، ودعوى '
           'الإلغاء خلال 60 يوماً، والفيزا المشروحة.')
P_DETAILS = (
    '<div style="background:#eff6ff;border-right:4px solid #3b82f6;padding:14px 18px;margin:0 0 20px;">'
    '<p style="margin:0;"><strong>لمن هذا الدليل؟</strong> لحاملي التأشيرات والإقامات. أمّا '
    'حاملو <strong>الكملك (الحماية المؤقتة)</strong> فخروجهم وعودتهم يجريان بقواعد أخرى — '
    'موضعها <a href="/article/voluntary-return-syria-procedure-2026">صفحة العودة الطوعية</a> '
    'و<a href="/article/kimlik-temporary-protection-syria-2026">صفحة الكملك</a>، لا هذه الصفحة.</p></div>'

    '<h2>ما سقف الحظر في القانون؟</h2>'
    '<p>المادة 9 من قانون الأجانب والحماية الدولية رقم 6458: حظر الدخول '
    '<strong>خمس سنوات كحدّ أقصى</strong>، ويجوز تمديده <strong>حتى عشر سنوات إضافية</strong> '
    'فقط عند وجود تهديد جدّي للنظام العام أو الأمن العام. فحين تقرأ «15 سنة» فهذا سقف حالات '
    'التهديد الجدّي، لا القاعدة؛ وحين تقرأ أنّ الحظر «مدى الحياة» فلا أساس له في المادة.</p>'

    '<h2>الجدولان الرسميان — وليس جدولاً واحداً</h2>'
    '<p>نشرت إدارة الهجرة (goc.gov.tr) بياناً رسمياً بتاريخ <strong>9 حزيران/يونيو 2020</strong> '
    'يحدّد مدد الحظر لمخالفي مدة الإقامة القانونية. وأهمّ ما فيه أنّ المدّة لا تتوقّف على طول '
    'تجاوزك فحسب، بل على <strong>طريقة خروجك</strong>:</p>'

    '<h3>الجدول الأول: خرجتَ طوعاً إلى المعبر ودفعتَ الغرامة</h3>'
    '<table><thead><tr><th>مدة التجاوز</th><th>مدة الحظر</th></tr></thead>'
    '<tbody>' + rows_a + '</tbody></table>'
    '<p>ولاحظ أنّ الجدول يبدأ من ثلاثة أشهر: التجاوز الأقصر مع الخروج الطوعي ودفع الغرامة '
    'ليس ضمن جدول الحظر أصلاً.</p>'

    '<h3>الجدول الثاني: رُحّلتَ، أو لم تدفع الغرامة، أو لم تغادر في المهلة</h3>'
    '<table><thead><tr><th>مدة التجاوز</th><th>مدة الحظر</th></tr></thead>'
    '<tbody>' + rows_b + '</tbody></table>'
    '<p>هذا الجدول هو الذي تُغفله أكثر الصفحات التي تتناول الموضوع: فالمخالفة نفسها '
    'بمدّتها نفسها تُنتج حظراً أطول إن انتهت بترحيل أو بغرامة غير مدفوعة. '
    '<strong>الخروج الطوعي مع الدفع يشتري لك جدول المدد الأخفّ</strong> — وهذه أهمّ معلومة '
    'عملية في الصفحة كلّها.</p>'

    '<div style="background:#fff7ed;border-right:4px solid #ea580c;padding:14px 18px;margin:18px 0;">'
    '<p style="margin:0 0 8px;"><strong>والقاعدة التي لا يذكرها أحد</strong></p>'
    '<p style="margin:0;">انتهاء مدة الحظر لا يفتح الباب وحده: البيان نفسه ينصّ على أنّ '
    'الغرامات غير المدفوعة والديون العامة <strong>تمنع الدخول حتى بعد انقضاء الحظر</strong> '
    '(المادتان 7 و15 من القانون 6458). فمن انتظر سنته ولم يسدّد، انتظر بلا طائل.</p></div>'

    '<h2>كيف تعرف أنّ عليك حظراً — وأيّ رمز؟</h2>'
    '<p>لا يصلك دائماً إشعار. تكتشفه عند طلب تأشيرة، أو على المعبر، أو عبر محامٍ يستعلم عن '
    'ملفّك. الخطوة الأولى دائماً: اعرف <strong>الرمز</strong> المسجَّل عليك بالضبط، فكلّ رمز '
    'له معنى ومسار مختلف — <a href="/codes">جدول رموز التقييد الـ125 مدقَّقاً</a>، '
    'و<a href="/article/tahdit-entry-restriction-codes-how-to-object">كيف تستعلم وكيف '
    'تعترض</a>. فرمز غرامة غير مدفوعة لا يُعالَج كرمز أمني، ومن باع لك «رفع كود» قبل أن '
    'يعرف كودك فقد باعك وهماً.</p>'

    '<h2>طرق الرفع الثلاث</h2>'
    '<h3>1. الانتظار حتى الانقضاء — مع تسوية الديون</h3>'
    '<p>الحظر المحدَّد المدة ينقضي بانقضائها، بشرط ألّا تبقى غرامة معلّقة (انظر القاعدة '
    'أعلاه). اطلب عند الخروج إيصال كل ما دفعت واحتفظ به.</p>'
    '<h3>2. دعوى الإلغاء أمام المحكمة الإدارية — 60 يوماً</h3>'
    '<p>قرار الحظر قرار إداري يقبل <strong>دعوى إلغاء</strong> أمام المحكمة الإدارية خلال '
    '<strong>ستّين يوماً من التبليغ</strong> (المادة 7 من قانون المحاكمات الإدارية رقم 2577). '
    'وتقوم الدعوى على مخالفة القرار للقانون: حظرٌ بلا سبب مشروع، أو مدّة تتجاوز جدول حالتك، '
    'أو تبليغ معيب. وعلى الإدارة أن تُبرز سند قرارها. وإن ربحت: أعلنت هجرة إسطنبول أنّ أحكام '
    'الإلغاء تُنفَّذ خلال <strong>ثمانية أيام</strong>. وانتبه: إن كان بيدك أيضاً '
    '<strong>قرار ترحيل</strong> فميعاد الطعن عليه <strong>سبعة أيام فقط</strong> — '
    'لا تخلط بين الميعادين، والتفصيل في '
    '<a href="/article/deportation-rights">صفحة قرار الترحيل</a>.</p>'
    '<h3>3. الفيزا المشروحة (Meşruhatlı Vize) — دخول استثنائي والحظر قائم</h3>'
    '<p>القانون 6458 يتيح استثناءً: تأشيرة <strong>مشروحة</strong> تُطلب من القنصلية لغرض '
    'محدَّد — عمل، أو زواج/عائلة، أو علاج — فتدخل بها <strong>مع بقاء الحظر قائماً</strong>. '
    'هي إذن مؤقّت بالغرض المذكور لا إلغاءً للحظر، ومنحها تقديري للجهات المختصّة. تصلح لمن '
    'لا يحتمل انتظار الدعوى أو انقضاء المدة.</p>'

    '<h2>الغرامة: كيف تُحسب فعلاً</h2>'
    '<p>غرامة التجاوز تُفرض بموجب قانون الرسوم رقم 492 وتُحسب لكل حالة بحسب مدّتها ونوع '
    'التأشيرة، وتتغيّر تعرفتها سنوياً. <strong>لا تعتمد على أي جدول بالدولار يتداوله '
    'الإنترنت</strong> — المبلغ الملزم هو ما يُحسب لك عند المعبر أو الإدارة. والمهم ليس رقمه '
    'بل أثره: دفعُه مع الخروج الطوعي يضعك في الجدول الأخفّ، وتركُه يضعك في الأقسى ويمنع '
    'عودتك حتى بعد انقضاء الحظر.</p>'

    '<h2>قبل أن تدفع لمحامٍ أو وسيط</h2>'
    '<ul>'
    '<li>اعرف رمزك أوّلاً من <a href="/codes">جدول الرموز</a> — فالمسار يختلف باختلافه.</li>'
    '<li>لا وجود لـ«رفع مضمون». الدعوى تقديرها للمحكمة، والفيزا المشروحة تقديرها للإدارة.</li>'
    '<li>المحامي الجادّ يبدأ بالاستعلام عن ملفّك لا بوعدك بالنتيجة.</li>'
    '<li>وإن كان أصل مشكلتك رفض إقامة لا حظراً، فموضعك '
    '<a href="/article/residence-rejection-appeal-turkey-2026">صفحة الاعتراض على رفض الإقامة</a>.</li>'
    '</ul>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>تجاوزتُ المدة وأنا ما زلت داخل تركيا — ماذا أفعل؟</h3>'
    '<p>وضعك قبل الخروج يقرّر جدولك بعده. راجع '
    '<a href="/article/overstay-solutions">صفحة تجاوز مدة الإقامة: القرارات الثلاثة '
    'ومواعيدها</a> — وفيها القاعدة العملية لمن لا يعرف أي قرار بيده. واحسب أيامك بدقّة عبر '
    '<a href="/tools/residence-calculator">حاسبة مدة الإقامة</a>.</p>'
    '<h3>هل يظهر حظر الدخول على e-Devlet؟</h3>'
    '<p>ليس دائماً؛ غياب الإشارة لا يعني خلوّ الملف. طرق الاستعلام الموثوقة في '
    '<a href="/article/tahdit-entry-restriction-codes-how-to-object">صفحة الاستعلام '
    'والاعتراض</a>.</p>'
    '<h3>هل ينتقل الحظر إلى عائلتي؟</h3>'
    '<p>الحظر قرار فردي على شخص بعينه. شأن العائلة الوحيد به عملي: من يرافقك في الإقامة قد '
    'تتأثّر إقامته بوضعك، لا بحظرك ذاته.</p>'
    '<h3>انتهت مدة حظري — لماذا رُفض دخولي؟</h3>'
    '<p>الأرجح غرامة أو دين عام غير مسدَّد (المادتان 7 و15)، أو رمز آخر على الملف غير رمز '
    'الحظر المنقضي. استعلم قبل أن تشتري تذكرة.</p>'
)
P_STEPS = [
    'حدّد وضعك أولاً: أما زلت داخل تركيا (فصفحة تجاوز المدة أولى بك)، أم خرجت وعليك حظر؟',
    'اعرف الرمز المسجَّل عليك بالضبط — من جدول الرموز أو باستعلام محامٍ — فالمسار يتبع الرمز.',
    'تحقّق من ديونك: غرامة غير مدفوعة تمنع الدخول حتى بعد انقضاء الحظر.',
    'قدّر جدولك: خروج طوعي مع دفع = الجدول الأخفّ؛ ترحيل أو عدم دفع = الأقسى.',
    'إن أردت الطعن: دعوى إلغاء أمام المحكمة الإدارية خلال 60 يوماً من التبليغ — والترحيل 7 أيام فقط.',
    'إن كان لك غرض عاجل (عمل، عائلة، علاج): اسأل القنصلية عن الفيزا المشروحة.',
    'وثّق كل شيء: إيصالات الدفع، وتاريخ التبليغ، وصورة كل قرار — فهي أساس أي دعوى.',
]
P_TIPS = [
    'طريقة خروجك تغيّر مدة حظرك أكثر من مدة تجاوزك — الخروج الطوعي مع الدفع يشتري الجدول الأخفّ.',
    'انقضاء الحظر لا يكفي: الغرامة غير المدفوعة تمنع الدخول بعده (المادتان 7 و15).',
    'ميعادان لا يُخلطان: حظر الدخول 60 يوماً، والترحيل 7 أيام — والورقة الواحدة قد تحمل القرارين.',
    '«15 سنة» سقف حالات التهديد الجدّي بعد التمديد، لا القاعدة؛ و«مدى الحياة» لا أساس لها.',
    'الفيزا المشروحة تُدخلك لغرضك المحدَّد والحظرُ قائم — هي إذن مؤقّت لا إلغاء.',
    'لا تدفع لوعد «رفع مضمون»؛ ولا تعتمد جداول الغرامات بالدولار المتداولة — الحساب لكل حالة.',
    'حاملو الكملك خارج هذا الدليل — قواعدهم في صفحتي العودة الطوعية والكملك.',
]
P_DOCS = [
    'جواز السفر، وصورة كل قرار بُلّغت به مع تاريخ التبليغ',
    'إيصالات دفع الغرامات والرسوم — احتفظ بها كلّها',
    'لدعوى الإلغاء: توكيل محامٍ في تركيا (يُنظَّم من القنصلية إن كنت خارجها)',
    'للفيزا المشروحة: ما يثبت الغرض (عقد عمل، قيد عائلي، تقرير علاج)',
]
P_FEES = ('غرامة التجاوز تُحسب لكل حالة بموجب قانون الرسوم 492 وتتغيّر تعرفتها سنوياً — لا رقم '
          'موحّداً ننشره. وأتعاب الدعوى شأن تعاقدي مع المحامي. ولا تصدّق جداول الدولارات '
          'المتداولة ولا «رسم رفع الكود» — اطلب سند أي مبلغ مكتوباً.')
P_WARN = ('المواعيد مُسقِطة للحق: 60 يوماً لدعوى إلغاء الحظر، وسبعة أيام فقط للطعن على الترحيل '
          'إن وُجد. والجدولان أعلاه من بيان إدارة الهجرة لمخالفة مدة الإقامة القانونية؛ الحظر '
          'لأسباب أخرى (أمنية، صحية عامة) يجري على المادة 9 بتقدير الإدارة لا على الجدولين. '
          'وهذا الدليل معلومات عامة لا استشارة قانونية في ملفّك بعينه.')
P_SOURCE = ('البيان الرسمي لإدارة الهجرة «Yasal Kalış Hakkı İhlalinde Bulunan Yabancılara '
            'Uygulanacak Giriş Yasaklarına İlişkin Açıklama» بتاريخ 09.06.2020 على goc.gov.tr '
            '(الجدولان ومنع الدخول لغير مسدّدي الغرامات)؛ وقانون الأجانب والحماية الدولية رقم '
            '6458 — المواد 7 و9 (سقف الحظر وتمديده والفيزا المشروحة) و15؛ وقانون المحاكمات '
            'الإدارية رقم 2577 المادة 7 (ميعاد الستين يوماً)؛ وقانون الرسوم رقم 492 (غرامات '
            'التجاوز)')
P_TAGS = ['حظر الدخول', 'رموز التقييد', 'تأشيرة تركيا', 'ترحيل', 'دليل', '2026']
P_SEO_T = 'حظر الدخول إلى تركيا: كم مدته وكيف يُرفع؟ الجدولان الرسميان'
P_SEO_D = ('جدولا إدارة الهجرة الرسميان لمدد حظر الدخول (الخروج الطوعي مقابل الترحيل)، وسقف '
           'المادة 9، ودعوى الإلغاء خلال 60 يوماً، والفيزا المشروحة Meşruhatlı — مع تحذير من '
           'الجداول المتناقضة المتداولة.')

# ── correction 1: overstay-solutions ─────────────────────────────────────
OV_NEW = (
    '<h4>جداول «مدة التجاوز = مدة الحظر»: الرسمي منها موجود — والمتداوَل نصفُه</h4>\n\n'
    '<p>كنّا كتبنا هنا أنّ هذه الجداول بلا سند، والصواب أدقّ: إدارة الهجرة نشرت بياناً رسمياً '
    '(09.06.2020) يحدّد <strong>جدولين</strong> — جدولاً أخفّ لمن خرج طوعاً ودفع غرامته، '
    'وجدولاً أقسى لمن رُحّل أو لم يدفع أو لم يغادر في المهلة. فالمتداوَل على المواقع ينقل '
    'الجدول الأخفّ وحده ويعمّمه، والحقيقة أنّ <strong>طريقة خروجك تُغيّر مدّتك أكثر من طول '
    'تجاوزك</strong>. ويبقى سقف القانون كما هو: خمس سنوات بالمادة 9، لا تُمدَّد (حتى عشر '
    'سنوات إضافية) إلا لتهديد جدّي للنظام العام أو الأمن العام. الجدولان كاملين مع طرق الرفع '
    'الثلاث في <a href="/article/turkey-entry-ban-2026">دليل حظر الدخول إلى تركيا</a>.</p>'
)

# ── correction 2: turkey-visa-types-2026 ─────────────────────────────────
VT_NEW = (
    '<h2>تجاوز مدة الفيزا وعقوباته</h2>\n'
    '<p>تجاوز المدة (vize ihlali) يستوجب غرامة إدارية تُحسب بموجب قانون الرسوم 492، '
    '<strong>إضافة إلى</strong> حظر دخول بحسب جدولي إدارة الهجرة الرسميين (بيان 09.06.2020): '
    'من خرج <strong>طوعاً ودفع الغرامة</strong> فجدوله أخفّ — يبدأ من شهر حظر لتجاوز 3–6 '
    'أشهر وينتهي بخمس سنوات لتجاوزٍ فوق ثلاث سنوات؛ ومن <strong>رُحّل أو لم يدفع</strong> '
    'فجدوله أقسى — يبدأ من 3 أشهر حظر لأي تجاوز حتى 3 أشهر. والغرامة غير المدفوعة تمنع '
    'الدخول حتى بعد انقضاء الحظر. الجدولان كاملين وطرق الرفع في '
    '<a href="/article/turkey-entry-ban-2026">دليل حظر الدخول</a>، ومعنى كلّ رمز (مثل Ç-113 '
    'للدخول/الخروج غير النظامي) في <a href="/codes">جدول رموز التقييد</a>. القانون الحاكم هو '
    'رقم 6458 (YUKK).</p>'
)

# ── cross-links (guarded appends) ────────────────────────────────────────
TAHDIT_ADD = ('<p style="margin-top:1rem;">وإن كان رمزك رمز <strong>حظر دخول</strong> بسبب '
              'تجاوز مدة الإقامة: مدده الرسمية بجدوليها وطرق رفعه الثلاث في '
              '<a href="/article/turkey-entry-ban-2026">دليل حظر الدخول إلى تركيا</a>.</p>')
UNDOC_ADD = ('<p style="margin-top:1rem;">وقبل أي قرار بالمغادرة اقرأ '
             '<a href="/article/turkey-entry-ban-2026">دليل حظر الدخول</a>: الخروج الطوعي مع '
             'دفع الغرامة يضعك في جدول الحظر الأخفّ، والترحيل يضعك في الأقسى.</p>')

# ── predicates checked against the content itself ────────────────────────
for label, body, needles in [
    ('pillar', P_DETAILS, ['حزيران/يونيو 2020', 'ستّين يوماً', 'Meşruhatlı',
                           'الجدول الثاني', '/codes', 'residence-calculator',
                           'voluntary-return-syria-procedure-2026']),
    ('overstay fix', OV_NEW, ['جدولين', 'turkey-entry-ban-2026']),
    ('visa-types fix', VT_NEW, ['جدولي إدارة الهجرة', 'turkey-entry-ban-2026', 'Ç-113']),
]:
    for n in needles:
        assert n in body, 'PREDICATE WOULD LIE: %r not in %s' % (n, label)
assert 'شهر تجاوز تقريباً يقابله حظر شهر' not in VT_NEW
assert '10 أيام' not in VT_NEW, 'the unsourced consulate claim leaked back in'
assert 'لا سند لهذه الجداول' not in OV_NEW
for bad in ('50 دولار', '$50', 'مدى الحياة</strong>'):
    assert bad not in P_DETAILS

sql = _no_bare_percent("""-- ============================================================================
-- عنقود حظر الدخول: الجدولان الرسميان، وتصحيح صفحتين من صفحاتنا
-- ============================================================================
-- خمس صفحات لمكاتب محاماة تتصدّر «حظر الدخول إلى تركيا» قبلنا — وهي تتناقض
-- فيما بينها («شهر حتى 15 سنة» عند أحدها، «5 أشهر حتى 5 سنوات» عند آخر)
-- وتنشر جميعاً جدول مدد بلا إسناد. تتبُّع المصدر الأولي وجده: بيان إدارة
-- الهجرة الرسمي بتاريخ 09.06.2020 على goc.gov.tr. والجدول حقيقي — وهما
-- جدولان لا واحد:
--
--   أ. خروج طوعي + دفع الغرامة (قانون الرسوم 492):
--      3–6 أشهر ← شهر · 6ش–سنة ← 3 أشهر · 1–2 سنة ← سنة · 2–3 ← سنتان · >3 ← 5 سنوات
--   ب. ترحيل / غرامة غير مدفوعة / عدم مغادرة في المهلة:
--      حتى 3 أشهر ← 3 أشهر · 3–6 ← 6 أشهر · 6ش–سنة ← سنة · 1–2 ← سنتان · >2 ← 5 سنوات
--
--   والقاعدة التي يُغفلها الجميع: الغرامة غير المدفوعة تمنع الدخول حتى بعد
--   انقضاء الحظر (المادتان 7 و15).
--
-- ── وهذا يصحّحنا نحن مرّتين ─────────────────────────────────────────────
--
-- 1. overstay-solutions تقول «ولا سند لهذه الجداول» — خطأ: السند موجود وهو
--    الإدارة نفسها. استُبدل البلوك بحقيقة الجدولين، وبقي ما كان صحيحاً:
--    سقف المادة 9 وثلاثية القرارات والمواعيد.
-- 2. turkey-visa-types-2026 (1,101 قراءة) تنشر جدولاً ثالثاً («شهر يقابله
--    شهر») لا يطابق أياً من الرسميين. استُبدل. وادّعاء «الدفع خلال 10 أيام
--    في قنصلية» لم يوجد له سند — حُذف.
--
-- ── وما رُفض من صفحات المنافسين ─────────────────────────────────────────
--
-- جدول الغرامات بالدولار (50$ + 10$/شهر) — مدوّنة عقارية بلا إسناد؛ الغرامة
-- بتعرفة قانون 492 وتُحسب لكل حالة. وُصفت الآلية ولم يُنشر رقم. و«5 أشهر
-- حتى 5 سنوات» لا يطابق شيئاً رسمياً. والجدول المتدرّج ليس «القاعدة» بل
-- ممارسة إدارية تحت سقف المادة 9 وتخصّ مخالفة مدة الإقامة.
--
-- ── ملاحظة الجمهور ──────────────────────────────────────────────────────
--
-- العنقود لحاملي التأشيرات والإقامات. وحاملو الكملك قواعدهم أخرى — المقال
-- يقولها في صدره ويحوّلهم إلى صفحتَي العودة الطوعية والكملك، عملاً بقاعدة
-- CLAUDE.md: تعميم قاعدة لا تنطبق على الكملك ضرر مباشر.
--
-- آمن لإعادة التشغيل.
-- ============================================================================

-- المقال المحوري (id هو الـslug نفسه؛ ON CONFLICT (id))
INSERT INTO articles (id, slug, title, intro, details, steps, tips, documents,
                      fees, warning, source, tags, category, status,
                      seo_title, seo_description, last_update)
VALUES ('%s', '%s', '%s', '%s', '%s', %s, %s, %s, '%s', '%s', '%s', %s,
        'الفيزا والتأشيرات', 'approved', '%s', '%s', CURRENT_DATE)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, intro = EXCLUDED.intro, details = EXCLUDED.details,
    steps = EXCLUDED.steps, tips = EXCLUDED.tips, documents = EXCLUDED.documents,
    fees = EXCLUDED.fees, warning = EXCLUDED.warning, source = EXCLUDED.source,
    tags = EXCLUDED.tags, category = EXCLUDED.category, status = EXCLUDED.status,
    seo_title = EXCLUDED.seo_title, seo_description = EXCLUDED.seo_description,
    last_update = EXCLUDED.last_update;

-- تصحيح 1: overstay-solutions — النفي الخاطئ يصير حقيقة الجدولين
UPDATE articles SET
    details = replace(details, '%s', '%s'),
    source = '%s',
    last_update = CURRENT_DATE
WHERE slug = 'overstay-solutions' AND details LIKE '%%لا سند لهذه الجداول%%';

-- تصحيح 2: turkey-visa-types-2026 — الجدول الثالث الخاطئ يُستبدل
UPDATE articles SET
    details = replace(details, '%s', '%s'),
    last_update = CURRENT_DATE
WHERE slug = 'turkey-visa-types-2026' AND details LIKE '%%شهر تجاوز تقريباً يقابله حظر شهر%%';

-- ربط داخلي محروس
UPDATE articles SET details = details || '%s', last_update = CURRENT_DATE
WHERE slug = 'tahdit-entry-restriction-codes-how-to-object'
  AND details NOT LIKE '%%turkey-entry-ban-2026%%';

UPDATE articles SET details = details || '%s', last_update = CURRENT_DATE
WHERE slug = 'undocumented-status'
  AND details NOT LIKE '%%turkey-entry-ban-2026%%';

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved'
       AND details LIKE '%%الجدول الثاني%%' AND details LIKE '%%Meşruhatlı%%';
    IF n <> 1 THEN RAISE EXCEPTION 'the pillar did not land'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = 'overstay-solutions' AND details LIKE '%%لا سند لهذه الجداول%%';
    IF n > 0 THEN RAISE EXCEPTION 'the wrong refutation is still live'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = 'turkey-visa-types-2026'
       AND details LIKE '%%شهر تجاوز تقريباً يقابله حظر شهر%%';
    IF n > 0 THEN RAISE EXCEPTION 'the third table is still live'; END IF;
END
$check$;

SELECT 'pillar live with both tables' AS البند,
       (details LIKE '%%الجدول الثاني%%' AND details LIKE '%%ستّين يوماً%%') AS سليم
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'overstay corrected to the two-table truth', (details LIKE '%%جدولين%%')
FROM articles WHERE slug = 'overstay-solutions'
UNION ALL
SELECT 'visa-types now cites the official tables', (details LIKE '%%جدولي إدارة الهجرة%%')
FROM articles WHERE slug = 'turkey-visa-types-2026'
UNION ALL
SELECT 'tahdit + undocumented link the pillar', (count(*) = 2)::boolean
FROM articles WHERE slug IN ('tahdit-entry-restriction-codes-how-to-object', 'undocumented-status')
  AND details LIKE '%%turkey-entry-ban-2026%%';
""") % (PILLAR, PILLAR, q(P_TITLE), q(P_INTRO), q(P_DETAILS),
        arr(P_STEPS), arr(P_TIPS), arr(P_DOCS),
        q(P_FEES), q(P_WARN), q(P_SOURCE), arr(P_TAGS), q(P_SEO_T), q(P_SEO_D),
        q(OV_OLD), q(OV_NEW), q((ov['source'] or '') + ' — والبيان الرسمي لإدارة الهجرة بتاريخ 09.06.2020 (جدولا مدد الحظر)'),
        q(VT_OLD), q(VT_NEW),
        q(TAHDIT_ADD), q(UNDOC_ADD),
        PILLAR, PILLAR)

path = os.path.join(REPO, 'sql', '2026-08-07_entry_ban_cluster.sql')
# newline='' — the live rows use CRLF line endings; default newline translation
# would corrupt each captured CRLF on disk and the replace() needles would
# match nothing in the database.
open(path, 'w', encoding='utf-8', newline='').write(sql)

_code = '\n'.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('المحوري       : %s (%d حرفاً) — الجدولان + المادة 9 + الدعوى + المشروحة' % (PILLAR, len(P_DETAILS)))
print('تصحيح 1       : overstay-solutions — «لا سند» كانت خطأنا نحن؛ صارت حقيقة الجدولين')
print('تصحيح 2       : turkey-visa-types-2026 (1,101 قراءة) — جدولها الثالث الخاطئ استُبدل')
print('ربط           : tahdit + undocumented-status ← المحوري (محروس)')
print('رُفض          : جدول الدولارات، و«5ش–5س»، وادّعاء 10 أيام القنصلية — بلا سند')
print('quote parity  :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written       :', path, len(sql), 'chars')
