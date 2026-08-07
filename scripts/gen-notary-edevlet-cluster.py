# -*- coding: utf-8 -*-
"""Notary/e-Devlet batch: four rebuilds, two folds, one deadline that saves homes.

── the map ────────────────────────────────────────────────────────────────

REBUILT:
  edevlet-sabika-kaydi (229, 14v)      → the Adli Sicil guide: free and
                                         instant on e-Devlet, the barcode
                                         makes it verifiable, the archive-
                                         record distinction, and the
                                         abroad-use chain.
  uyap-case-inquiry (225, 25v)         → the combined UYAP page: your court
                                         cases AND enforcement (icra) files
                                         in one portal — with the statutory
                                         deadline no stub mentioned: 7 days
                                         to object to a payment order in
                                         no-judgment enforcement (İİK). An
                                         icra file discovered late is how
                                         salaries and accounts get seized.
  identity-apostille-kaymakam-valilik  → the apostille guide: administrative
  (314, 6v)                              documents at valilik/kaymakamlık,
                                         judicial ones at the courthouse
                                         justice commissions — and the rule
                                         our audience needs most: Syria is
                                         not a party, so apostille does
                                         NOTHING for Syria-bound papers;
                                         that route is the attestation chain.
  notary-fees (265, 3v)                → the notary guide on the high-intent
                                         slug: what noters actually do, the
                                         official annual tariff (no numbers —
                                         tariff means no haggling either
                                         way), the sworn-translator rule for
                                         non-Turkish speakers, and the
                                         standing warning bridged from the
                                         renting guide: read every paper —
                                         the tahliye taahhütnamesi is signed
                                         at noters.

RETIRED: uyap-execution-files → uyap-case-inquiry;
         nearest-notary-map → notary-fees (finding one becomes a section).
DEFERRED: transcript-edevlet stays live for an education-services batch
          (with tomer-registration and btk-akademi-courses); asserted.

All seven rows id == slug (checked live); no inbound links.
No lira figures anywhere (asserted): adli sicil is free, notary fees are a
tariff by document, apostille fees vary by office.
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


SICIL = 'edevlet-sabika-kaydi'
UYAP = 'uyap-case-inquiry'
APOS = 'identity-apostille-kaymakam-valilik'
NOTER = 'notary-fees'
DEAD = ['uyap-execution-files', 'nearest-notary-map']

for s in (SICIL, UYAP, APOS, NOTER):
    r = get('articles?select=id,slug,status,details&slug=eq.' + s)[0]
    assert r['status'] == 'approved' and r['id'] == r['slug'] and len(r['details'] or '') < 1000, s
for d in DEAD:
    r = get('articles?select=id,slug,status&slug=eq.' + d)
    assert r and r[0]['status'] == 'approved' and r[0]['id'] == r[0]['slug'], d
tr = get('articles?select=status&slug=eq.transcript-edevlet')[0]
assert tr['status'] == 'approved'
for s in ('civil-marriage-registration-turkey', 'family-register-foreign-marriage',
          'document-attestation-turkey-to-syria-students-2026', 'renting-house',
          'istanbul-goc-randevu-noter-2026', 'family-reunion-visa-syria-2026',
          'consumer-arbitration-hakem-heyeti', 'work-permit-turkey-2026'):
    r = get('articles?select=status&slug=eq.' + s)
    assert r and r[0]['status'] == 'approved', s + ' not live'

ART = """INSERT INTO articles (id, slug, title, intro, details, steps, tips, documents,
                      fees, warning, source, tags, category, status,
                      seo_title, seo_description, last_update)
VALUES ('{slug}', '{slug}', '{title}', '{intro}', '{details}', {steps}, {tips}, {docs},
        '{fees}', '{warn}', '{source}', {tags}, '{cat}', 'approved',
        '{seo_t}', '{seo_d}', CURRENT_DATE)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, intro = EXCLUDED.intro, details = EXCLUDED.details,
    steps = EXCLUDED.steps, tips = EXCLUDED.tips, documents = EXCLUDED.documents,
    fees = EXCLUDED.fees, warning = EXCLUDED.warning, source = EXCLUDED.source,
    tags = EXCLUDED.tags, category = EXCLUDED.category, status = EXCLUDED.status,
    seo_title = EXCLUDED.seo_title, seo_description = EXCLUDED.seo_description,
    last_update = EXCLUDED.last_update;"""


def art_sql(**kw):
    return ART.format(**{k: (q(v) if isinstance(v, str) and k not in ('slug', 'steps', 'tips', 'docs', 'tags') else v)
                         for k, v in kw.items()})


# ═══ A. Adli Sicil ═══
A_DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الخلاصة</strong></p>'
    '<p style="margin:0;">وثيقة «لا حكم عليه» (<span dir="ltr">Adli Sicil Kaydı</span>) '
    'تستخرجها <strong>مجاناً وفوراً</strong> من e-Devlet بصيغة PDF برمز تحقّق — والجهات '
    'تقبلها لأنها تتحقّق منها بالرمز لا بالورقة. لا تدفع لأحد مقابل «استخراجها».</p></div>'

    '<h2>ما هي — ومتى تُطلب منك؟</h2>'
    '<p>هي سجلّك الجزائي الرسمي في تركيا: هل عليك أحكام قضائية مسجَّلة أم لا. تُطلب في '
    'التوظيف، وملفات <a href="/article/civil-marriage-registration-turkey">الزواج '
    'المدني</a>، وبعض معاملات الإقامة والجنسية، وملفات '
    '<a href="/article/family-reunion-visa-syria-2026">لمّ الشمل</a> (للمستضيف)، '
    'والمناقصات والتراخيص.</p>'

    '<h2>الاستخراج من e-Devlet — دقيقة واحدة</h2>'
    '<ol>'
    '<li>ادخل e-Devlet وابحث عن <span dir="ltr">Adli Sicil Kaydı Sorgulama</span>.</li>'
    '<li>اختر الجهة التي ستقدَّم لها الوثيقة (رسمية/خاصة) واللغة إن أتيحت.</li>'
    '<li>أنشئ الوثيقة وحمّلها PDF — عليها <strong>رمز تحقّق (باركود)</strong> تتثبّت به '
    'الجهة من صحتها إلكترونياً.</li>'
    '</ol>'
    '<p>ولا يشترط طابعة أصلاً عند كثير من الجهات — الرمز هو الأصل. ومن لا حساب e-Devlet له '
    'يستخرجها من قلم السجل العدلي في قصر العدل (Adliye) بهويته.</p>'

    '<h2>سجلّ الأرشيف — التمييز الذي يحيّر الناس</h2>'
    '<p>يوجد سجلّان: <strong>السجل العدلي</strong> الجاري، و<strong>سجلّ الأرشيف</strong> '
    '(<span dir="ltr">Arşiv Kaydı</span>) الذي تنتقل إليه بعض القيود القديمة وفق أحكام '
    'قانون السجل العدلي. بعض الجهات تطلب الوثيقة <strong>«مع الأرشيف»</strong> — فاقرأ '
    'المطلوب منك حرفياً واختر الخيار المطابق عند الاستخراج؛ وثيقةٌ بلا أرشيف حيث يُطلب '
    'الأرشيف تعني مراجعةً ثانية.</p>'

    '<h2>لاستعمالها خارج تركيا</h2>'
    '<p>الوثيقة للاستعمال في الخارج تحتاج تصديقاً بحسب البلد المقصود: أبوستيل لدول '
    'الاتفاقية — <a href="/article/identity-apostille-kaymakam-valilik">دليل الأبوستيل '
    'وأين يُختم</a> — وسلسلة التصديق لغيرها، وسوريا منها: '
    '<a href="/article/document-attestation-turkey-to-syria-students-2026">مسار التصديق '
    'من تركيا إلى سوريا</a>. والترجمة المحلَّفة بعد التصديق بحسب متطلّب الجهة.</p>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>ظهر قيد لا أعرفه — ماذا أفعل؟</h3>'
    '<p>لا تتجاهله: قد يكون حكماً غيابياً أو ملفاً لا تعلمه. استعلم عن تفاصيله عبر '
    '<a href="/article/uyap-case-inquiry">بوابة UYAP: قضاياك وملفات التنفيذ</a> واستشر '
    'محامياً — فالمُهل في هذه الملفات قاتلة.</p>'
    '<h3>هل تظهر الغرامات المرورية والديون فيها؟</h3>'
    '<p>لا — هذه ليست أحكاماً جزائية مسجَّلة. ملفات الديون والتنفيذ مكانها UYAP لا '
    'السجل العدلي.</p>'
    '<h3>كم تبقى صالحة؟</h3>'
    '<p>لا «صلاحية» مطبوعة عليها — لكن الجهات تطلبها حديثة العهد عادةً (أيام إلى أسابيع '
    'بحسب الجهة). استخرجها قريباً من موعد تقديم ملفك، فهي مجانية وفورية.</p>'
)

# ═══ B. UYAP combined ═══
U_DETAILS = (
    '<div style="background:#fee2e2;border-right:4px solid #dc2626;padding:14px 18px;margin:0 0 20px;">'
    '<p style="margin:0 0 8px;font-size:17px;"><strong>السطر الذي قد يوفّر عليك حجز راتبك</strong></p>'
    '<p style="margin:0;">إن وجدت في UYAP <strong>ملف تنفيذ (İcra)</strong> ضدّك بأمر أداء '
    'مبلَّغ إليك: مهلة الاعتراض في التتبّع بلا سند هي <strong>سبعة أيام من التبليغ</strong> '
    '— بعدها يصير الأمر قطعياً ويبدأ الحجز. افحص البوابة اليوم لا يوم يصلك الحجز.</p></div>'

    '<h2>ما هي UYAP — ولماذا تفحصها دورياً؟</h2>'
    '<p>UYAP هي منظومة القضاء التركي، وبوابة المواطن فيها '
    '(<span dir="ltr">UYAP Vatandaş</span>) تدخلها بحساب e-Devlet فترى الملفات المرتبطة '
    'بك: دعاوى أنت طرف فيها، وجلساتها، وملفات <strong>التنفيذ</strong>. وكثيرون لا '
    'يكتشفون ملفاً ضدّهم إلا متأخرين — تبليغٌ ذهب لعنوان قديم يكفي لتمضي المُهل وأنت لا '
    'تدري. الفحص الدوري مجاني ويسبق المفاجآت.</p>'

    '<h2>الشقّ الأول: دعاواك القضائية</h2>'
    '<ul>'
    '<li>ترى نوع الدعوى والمحكمة وتواريخ الجلسات وبعض المستندات (بحسب صلاحيتك في '
    'الملف).</li>'
    '<li>تحقّق من أنّ <strong>عنوانك محدَّث</strong> — فالتبليغات تذهب إلى العنوان '
    'المسجَّل، وضياعها لا يوقف المُهل.</li>'
    '<li>لا تعتمد على «سمعت أنّ قضيتي انتهت» — البوابة هي المرجع لا الإشاعة.</li>'
    '</ul>'

    '<h2>الشقّ الثاني: ملفات التنفيذ (İcra Dosyası)</h2>'
    '<p>ملف التنفيذ يعني أنّ دائناً بدأ تحصيلاً جبرياً — فواتير اتصالات أو كهرباء غير '
    'مسدَّدة، أو ديون بطاقات وقروض، أو نزاع إيجار. ونتيجته إن تُرك: حجز على الحساب '
    'البنكي أو الراتب أو الممتلكات.</p>'
    '<ol>'
    '<li><strong>افحص</strong>: هل الملف حقيقي وما سنده وما المبلغ — من البوابة نفسها.</li>'
    '<li><strong>احسب مهلتك</strong>: أمر الأداء في التتبّع بلا سند يُعترض عليه خلال '
    '<strong>سبعة أيام من التبليغ</strong> أمام دائرة التنفيذ — والاعتراض في مهلته يوقف '
    'التتبّع حتى يُفصل.</li>'
    '<li><strong>دين صحيح؟</strong> التسوية والدفع عبر الدائرة يوقفان تضخّم الملف — '
    'وكل تأخير فوائد ومصاريف.</li>'
    '<li><strong>دين متنازَع أو مجهول؟</strong> محامٍ فوراً — المُهل هنا لا تنتظر '
    'قناعتك.</li>'
    '</ol>'
    '<p>وأصل كثير من هذه الملفات نزاعات مستهلك صغيرة تُركت — عالجها في بابها قبل أن تصير '
    'تنفيذاً: <a href="/article/consumer-arbitration-hakem-heyeti">لجنة تحكيم '
    'المستهلك</a>.</p>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>هل يرى الأجنبي ملفاته مثل المواطن؟</h3>'
    '<p>الدخول بحساب e-Devlet برقمك (التركي أو الأجنبي 99…) — والملفات المرتبطة برقمك '
    'تظهر لك بصفتك طرفاً.</p>'
    '<h3>وجدت ملفاً بعنوان قديم وتبليغاً لم يصلني — هل ضاعت المهلة؟</h3>'
    '<p>لا تفترض شيئاً في الاتجاهين: أحكام التبليغ ومدده مسألة قانونية دقيقة — خذ الملف '
    'كاملاً إلى محامٍ فوراً، فبعض الحالات تُفتح مهلها بشروط.</p>'
    '<h3>هل يظهر السجل العدلي هنا؟</h3>'
    '<p>هما شيئان: الأحكام الجزائية المسجَّلة في '
    '<a href="/article/edevlet-sabika-kaydi">وثيقة السجل العدلي</a>، والدعاوى والتنفيذ '
    'في UYAP.</p>'
)

# ═══ C. Apostille ═══
P_DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الخلاصة</strong></p>'
    '<p style="margin:0;">الأبوستيل ختمٌ يجعل وثيقتك التركية معتمدةً في دول اتفاقية لاهاي '
    'بلا سلاسل قنصلية. <strong>الوثائق الإدارية</strong> تُختم لدى الوالي أو القائمقام، '
    'و<strong>القضائية</strong> لدى لجان العدل في قصور العدل. '
    'و<strong>سوريا ليست طرفاً</strong> — فلا أبوستيل ينفع ورقةً متجهة إليها.</p></div>'

    '<h2>ما الأبوستيل — ومتى يلزمك؟</h2>'
    '<p>حين تطلب جهةٌ في بلد آخر وثيقتك التركية (شهادة، سجل عدلي، وثيقة زواج…) '
    '«مصدَّقةً»، فإن كان البلد طرفاً في اتفاقية لاهاي فالمطلوب <strong>ختم أبوستيل</strong> '
    'واحد من تركيا — يعتمد توقيعَ الوثيقة وصفةَ موقّعها، فتقبلها دول الاتفاقية بلا '
    'تصديقات إضافية.</p>'

    '<h2>أين تختم؟ القاعدة التي يخلطها الجميع</h2>'
    '<table><thead><tr><th>نوع الوثيقة</th><th>جهة الختم</th></tr></thead><tbody>'
    '<tr><td><strong>إدارية</strong>: شهادات النفوس، السجل العدلي، شهادات الدراسة '
    'المصدَّقة، وثائق البلديات…</td>'
    '<td><strong>الولاية (Valilik) أو القائمقامية (Kaymakamlık)</strong> — كلاهما مخوَّل '
    'للإداري؛ اذهب للأقرب</td></tr>'
    '<tr><td><strong>قضائية</strong>: أحكام المحاكم وقرارات القضاء</td>'
    '<td><strong>رئاسات لجان العدل</strong> (Adalet Komisyonu Başkanlığı) في قصور '
    'العدل</td></tr>'
    '</tbody></table>'
    '<p>الخطأ النمطي: حمل حكم محكمة إلى القائمقامية أو شهادة نفوس إلى قصر العدل — '
    'فتُردّ من الباب. صنّف وثيقتك أولاً.</p>'

    '<h2>وقبل الختم أو بعده: الترجمة</h2>'
    '<p>الجهة الأجنبية تحدّد هل تريد الوثيقة مترجمةً وهل تريد الأبوستيل على الأصل أم على '
    'الترجمة الموثَّقة — <strong>اسألها هي قبل أن تدفع لترجمة</strong>. الترجمة المحلَّفة '
    'تُنظَّم عبر <a href="/article/notary-fees">النوتر ومترجميه المحلَّفين</a>.</p>'

    '<h2>سوريا خارج الاتفاقية — الطريق الآخر</h2>'
    '<p>لا «أبوستيل» ينفع وثيقةً متّجهة إلى سوريا، ولا وثيقةً سوريةً قادمة: الطريق هو '
    '<strong>سلسلة التصديق</strong> بمراحلها. من تركيا إلى سوريا: '
    '<a href="/article/document-attestation-turkey-to-syria-students-2026">مسار التصديق '
    'الكامل للطلاب والخريجين</a>. ومن سوريا إلى تركيا (زواج ووثائق مدنية): '
    '<a href="/article/family-register-foreign-marriage">تثبيت الوثائق السورية '
    'وسلسلتها</a>.</p>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>كم رسمه؟</h3>'
    '<p>الختم الإداري لدى الولايات/القائمقاميات معتاد أن يكون بلا رسم أو برسم رمزي '
    'بحسب المكتب — اسأل مكتبك، ولا تدفع لوسيط «يختم عنك» معاملةً حضورية بسيطة.</p>'
    '<h3>وثيقتي بختم إلكتروني من e-Devlet — هل تُختم أبوستيل؟</h3>'
    '<p>بعض الجهات تطلب نسخة ورقية موقَّعة/مصدَّقة قبل الأبوستيل — اسأل جهة الختم عن '
    'المقبول لديها قبل الذهاب.</p>'
    '<h3>البلد المقصود ليس في الاتفاقية وليس سوريا؟</h3>'
    '<p>فالطريق سلسلة التصديق القنصلية لذلك البلد: خارجية تركيا ثم ممثّلية البلد — '
    'اسأل قنصليته عن ترتيبه.</p>'
)

# ═══ D. Notary ═══
N_DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الخلاصة</strong></p>'
    '<p style="margin:0;">رسوم النوتر <strong>تعرفة رسمية</strong> تُحدَّث سنوياً وتتوقّف '
    'على نوع الوثيقة وصفحاتها ولغتها — فلا مفاجآت مشروعة ولا «تخفيضات»: اسأل بالوثيقة '
    'بيدك قبل البدء. ومن لا يتقن التركية يوقّع <strong>بمترجم محلَّف</strong> وجوباً — '
    'وهذا حماية لك لا عبئاً.</p></div>'

    '<h2>ما الذي يفعله النوتر لك فعلاً؟</h2>'
    '<ul>'
    '<li><strong>الوكالات</strong> (Vekaletname): توكيل محامٍ أو قريب — أكثر ما يحتاجه '
    'المغترب، ومنه توكيلات دعاوى الإقامة والحظر.</li>'
    '<li><strong>التعهّدات</strong> (Taahhütname): ومنها دعوة الاستضافة في ملفات '
    '<a href="/article/family-reunion-visa-syria-2026">لمّ الشمل</a>.</li>'
    '<li><strong>تصديق الترجمات</strong> بمترجمين محلَّفين معتمدين لديه.</li>'
    '<li><strong>تصديق الصور</strong> طبق الأصل، وتوثيق العقود والتواقيع.</li>'
    '<li>وفي إسطنبول صار النوتر باباً لتسليم <a href="/article/istanbul-goc-randevu-noter-2026">'
    'أوراق الإقامة</a> أيضاً.</li>'
    '</ul>'

    '<h2>الرسوم: تعرفة لا مساومة</h2>'
    '<ul>'
    '<li>التعرفة <strong>رسمية موحَّدة</strong> تصدر سنوياً — النوتر لا «يغالي» ولا '
    '«يخفّض»؛ ما يغيّر المبلغ هو وثيقتك: نوعها وعدد صفحاتها ونسخها ولغتها وقيمة '
    'موضوعها أحياناً.</li>'
    '<li><strong>اسأل قبل البدء</strong> بالمستند نفسه بيدك — التقدير المسبق حقّك '
    'ويمنع المفاجأة.</li>'
    '<li>الترجمة المحلَّفة بندٌ مستقل يُضاف لرسم التوثيق — لكل مترجم تعرفته المعلنة.</li>'
    '<li>لا ننشر أرقاماً — التعرفة تتحدّث سنوياً وتختلف بالوثيقة؛ القاعدة أهم من الرقم: '
    'تعرفة رسمية = إيصال رسمي بكل ما دفعت.</li>'
    '</ul>'

    '<h2>لا تتقن التركية؟ المترجم المحلَّف وجوبي — ولمصلحتك</h2>'
    '<p>النوتر لا يوثّق توقيعك على ما لا تفهمه: يستدعي <strong>مترجماً محلَّفاً</strong> '
    'يقرأ عليك الوثيقة بلغتك قبل التوقيع. لا تحاول «تجاوز» ذلك بمرافق يترجم لك — '
    'فالمحلَّف هو الضمانة القانونية أنّ ما وقّعت هو ما فهمت. وذيل هذا الباب تحذيرٌ '
    'دائم: <strong>اقرأ كل ورقة قبل توقيعها لدى النوتر</strong> — '
    'فتعهّد الإخلاء الذي يُدسّ مع عقود الإيجار '
    '(<a href="/article/renting-house">تفصيله في دليل الاستئجار</a>) يُوقَّع هنا.</p>'

    '<h2>كيف تجد أقرب نوتر؟</h2>'
    '<ul>'
    '<li>مكاتب النوتر منتشرة في كل قضاء، ولوحاتها الصفراء «NOTER» أشهر اللوحات — '
    'وخرائط الهاتف تجدها بكلمة noter.</li>'
    '<li>اتحاد النوتر التركي (<span dir="ltr">TNB</span>) ينشر دليل المكاتب الرسمي.</li>'
    '<li>في المدن الكبرى يوجد <strong>نوتر مناوب</strong> أيام العطل بالتناوب — اسأل '
    'أو ابحث عن «nöbetçi noter» مع اسم مدينتك قبل أن تؤجّل معاملةً عاجلة.</li>'
    '</ul>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>أي نوتر أذهب إليه — هل يجب «نوتر منطقتي»؟</h3>'
    '<p>للمعاملات الاعتيادية: أي نوتر تختاره. بعض المعاملات النوعية لها ترتيبها — '
    'اسأل عند الشك.</p>'
    '<h3>أستطيع توكيل شخص في تركيا وأنا خارجها؟</h3>'
    '<p>نعم — عبر القنصلية التركية في بلدك (تقوم مقام النوتر للأتراك والمقيمين بحسب '
    'المعاملة)، أو بتوثيق محلي ثم سلسلة تصديق/أبوستيل بحسب البلد: '
    '<a href="/article/identity-apostille-kaymakam-valilik">دليل الأبوستيل '
    'والتصديق</a>.</p>'
    '<h3>هل يحتاج توثيق عقد الإيجار نوتراً؟</h3>'
    '<p>لم يعد لازماً لتثبيت العنوان: عقد e-Devlet الرقمي معتمد بلا نوتر — '
    '<a href="/article/renting-house">تفصيله في دليل الاستئجار</a>. والنوتر يبقى خياراً '
    'لمن أراد توثيقاً إضافياً.</p>'
)

for label, body, needles in [
    ('sicil', A_DETAILS, ['Adli Sicil', 'باركود', 'Arşiv', 'uyap-case-inquiry',
                          'identity-apostille-kaymakam-valilik', 'document-attestation-turkey-to-syria-students-2026']),
    ('uyap', U_DETAILS, ['سبعة أيام من التبليغ', 'İcra', 'edevlet-sabika-kaydi',
                         'consumer-arbitration-hakem-heyeti', 'UYAP Vatandaş']),
    ('apostille', P_DETAILS, ['سوريا ليست طرفاً', 'Valilik', 'Adalet Komisyonu',
                              'notary-fees', 'family-register-foreign-marriage']),
    ('noter', N_DETAILS, ['تعرفة', 'مترجماً محلَّفاً', 'nöbetçi noter', 'renting-house',
                          'istanbul-goc-randevu-noter-2026', 'family-reunion-visa-syria-2026']),
]:
    for nd in needles:
        assert nd in body, 'PREDICATE WOULD LIE: %r not in %s' % (nd, label)
ALL = A_DETAILS + U_DETAILS + P_DETAILS + N_DETAILS
for dead in DEAD:
    assert ('href="/article/%s"' % dead) not in ALL
assert not re.search(r'\d[\d.,]*\s*(?:ليرة|TL)', ALL), 'a lira figure leaked'
assert '%' not in ALL, 'a bare percent in page content would break the outer format'

arts = '\n\n'.join([
    art_sql(slug=SICIL,
            title='وثيقة «لا حكم عليه» (Adli Sicil) في تركيا 2026: مجانية من e-Devlet — وسجل الأرشيف الذي يحيّر الناس',
            intro='تُطلب منك في التوظيف والزواج وملفات الإقامة ولمّ الشمل — ووثيقة السجل العدلي تستخرجها مجاناً خلال دقيقة من e-Devlet برمز تحقّق تقبله الجهات. المهم ليس الاستخراج بل التفاصيل التي تعيد الناس: خيار «مع سجل الأرشيف» حين يُطلب، واختيار الجهة الصحيحة، وتصديقها حين تسافر بها.',
            details=A_DETAILS,
            steps=arr(['ادخل e-Devlet وابحث عن Adli Sicil Kaydı Sorgulama.',
                       'اقرأ المطلوب منك حرفياً: هل تُطلب «مع سجل الأرشيف»؟ اختر المطابق.',
                       'اختر الجهة المقدَّم إليها وأنشئ الوثيقة وحمّلها PDF برمز التحقّق.',
                       'للاستعمال خارج تركيا: صدّقها (أبوستيل أو سلسلة تصديق بحسب البلد) ثم ترجمها إن طُلب.',
                       'وإن ظهر قيد لا تعرفه: افحص تفاصيله في UYAP واستشر محامياً فوراً.']),
            tips=arr(['مجانية وفورية — من يعرض «استخراجها» بمقابل يبيعك خدمة مجانية.',
                      'رمز التحقّق هو الأصل — كثير من الجهات لا تحتاج ورقة أصلاً.',
                      '«مع الأرشيف» حين تُطلب — وثيقة ناقصة الخيار تعني مراجعة ثانية.',
                      'الغرامات والديون ليست هنا — مكانها UYAP.',
                      'استخرجها قريباً من موعد ملفك؛ الجهات تريدها حديثة.']),
            docs=arr(['حساب e-Devlet (أو هويتك لقلم السجل العدلي في قصر العدل)',
                      'معرفة الجهة المقدَّم إليها ونوع الوثيقة المطلوب (بأرشيف أو بدونه)']),
            fees='مجانية بالكامل عبر e-Devlet. والتصديق للخارج والترجمة لهما رسومهما في مساريهما.',
            warn='اقرأ طلب الجهة حرفياً: «مع سجل الأرشيف» خيار مستقل عند الاستخراج. وقيدٌ لا تعرفه لا يُتجاهل — افحصه في UYAP واستشر محামياً، فالمُهل قاتلة.'.replace('محামياً', 'محامياً'),
            source='خدمة استعلام السجل العدلي (Adli Sicil Kaydı Sorgulama) عبر بوابة e-Devlet (turkiye.gov.tr) بوثيقة مرمَّزة للتحقّق — وقانون السجل العدلي رقم 5352 لأحكام السجل الجاري وسجل الأرشيف',
            tags=arr(['السجل العدلي', 'لا حكم عليه', 'e-Devlet', 'معاملات رسمية', 'دليل', '2026']),
            cat='معاملات رسمية',
            seo_t='وثيقة لا حكم عليه في تركيا: مجاناً من e-Devlet خلال دقيقة',
            seo_d='Adli Sicil تستخرجها مجاناً برمز تحقّق تقبله الجهات — وخيار «سجل الأرشيف» الذي يعيد الناس، والجهة الصحيحة، وتصديقها للخارج. والغرامات ليست فيها.'),
    art_sql(slug=UYAP,
            title='بوابة UYAP للأجانب 2026: قضاياك وملفات التنفيذ (İcra) — ومهلة الأيام السبعة التي تحفظ راتبك',
            intro='هل عليك دعوى لا تعلمها؟ هل فُتح ملف تنفيذ بسبب فاتورة قديمة؟ بوابة UYAP Vatandaş — بدخول e-Devlet — تريك دعاواك وملفات التنفيذ المرتبطة برقمك. وأهم سطر فيها: أمر الأداء في التتبّع بلا سند يُعترض عليه خلال سبعة أيام من التبليغ، وبعدها يبدأ طريق الحجز. افحص قبل أن تُفاجأ.',
            details=U_DETAILS,
            steps=arr(['ادخل UYAP Vatandaş بحساب e-Devlet وافحص: دعاوى؟ ملفات تنفيذ؟',
                       'وجدت ملف تنفيذ؟ اقرأ سنده ومبلغه وتاريخ التبليغ فوراً.',
                       'احسب المهلة: الاعتراض على أمر الأداء بلا سند خلال 7 أيام من التبليغ أمام دائرة التنفيذ.',
                       'دين صحيح؟ سوِّ وادفع عبر الدائرة قبل أن يتضخّم بالفوائد والمصاريف.',
                       'دين متنازَع أو تبليغ لم يصلك؟ محامٍ فوراً بالملف كاملاً.',
                       'وحدّث عنوانك دائماً — التبليغ للعنوان المسجَّل والمُهل لا تنتظر علمك.']),
            tips=arr(['افحص البوابة دورياً — اكتشاف الملف متأخراً هو كيف تُحجز الرواتب.',
                      'مهلة السبعة أيام على أمر الأداء لا ترحم — والاعتراض في وقته يوقف التتبّع.',
                      'الدخول برقمك (تركياً أو 99…) عبر e-Devlet.',
                      'نزاع المستهلك الصغير يُعالج في بابه قبل أن يصير تنفيذاً.',
                      'السجل العدلي شيء وUYAP شيء — الأحكام الجزائية هناك والدعاوى والتنفيذ هنا.']),
            docs=arr(['حساب e-Devlet للدخول',
                      'عند وجود ملف: لقطات كاملة له ولتاريخ التبليغ لعرضها على المحامي',
                      'إثباتات الدفع أو النزاع إن كان الدين متنازَعاً']),
            fees='الاستعلام مجاني. والاعتراض والتسوية لهما إجراءاتهما لدى دائرة التنفيذ، وأتعاب المحاماة تعاقدية — وكلفة التأخير أعلى من الجميع.',
            warn='مهلة الاعتراض على أمر الأداء في التتبّع بلا سند سبعة أيام من التبليغ — والتبليغ لعنوانك المسجَّل ولو لم تقرأه. لا تتجاهل ملفاً صغيراً: بالفوائد والمصاريف يكبر، وبالقطعية يصير حجزاً.',
            source='بوابة UYAP Vatandaş الرسمية لوزارة العدل (الدخول عبر e-Devlet) — الدعاوى وملفات التنفيذ؛ وقانون التنفيذ والإفلاس (İİK) لمهلة الاعتراض على أمر الأداء في التتبّع بلا سند (سبعة أيام من التبليغ)',
            tags=arr(['UYAP', 'ملف تنفيذ', 'İcra', 'المحاكم', 'دليل', '2026']),
            cat='معاملات رسمية',
            seo_t='UYAP: افحص دعاواك وملفات İcra — ومهلة 7 أيام للاعتراض',
            seo_d='بوابة UYAP Vatandaş تريك الدعاوى وملفات التنفيذ برقمك — والسطر الحاسم: الاعتراض على أمر الأداء خلال 7 أيام من التبليغ قبل أن يبدأ الحجز. افحص قبل أن تُفاجأ.'),
    art_sql(slug=APOS,
            title='الأبوستيل في تركيا 2026: الإداري عند الوالي والقائمقام، والقضائي في قصر العدل — ولا أبوستيل لسوريا',
            intro='وثيقة تركية ستستعملها في بلد آخر؟ إن كان البلد في اتفاقية لاهاي فالمطلوب ختم أبوستيل واحد — والقاعدة التي يخلطها الجميع: الوثائق الإدارية تُختم لدى الولاية أو القائمقامية، والقضائية لدى لجان العدل في قصور العدل. أمّا سوريا فليست طرفاً في الاتفاقية أصلاً — وطريق وثائقها سلسلة التصديق لا الأبوستيل.',
            details=P_DETAILS,
            steps=arr(['تأكد أولاً أنّ البلد المقصود طرف في اتفاقية لاهاي — وسوريا ليست كذلك.',
                       'صنّف وثيقتك: إدارية (نفوس، سجل عدلي، شهادات) أم قضائية (أحكام محاكم)؟',
                       'الإدارية ← الولاية أو القائمقامية الأقرب؛ القضائية ← لجنة العدل في قصر العدل.',
                       'اسأل الجهة الأجنبية: أبوستيل على الأصل أم على الترجمة الموثقة؟ ثم رتّب الترجمة المحلفة.',
                       'لبلد خارج الاتفاقية: سلسلة التصديق القنصلية لذلك البلد بدل الأبوستيل.']),
            tips=arr(['أبوستيل واحد يغني عن السلاسل — لدول الاتفاقية فقط.',
                      'الخطأ النمطي: حكم محكمة إلى القائمقامية — يُرَدّ؛ القضائي لقصر العدل.',
                      'اسأل الجهة المستقبِلة عن ترتيب الترجمة قبل أن تدفع لها.',
                      'لا أبوستيل لسوريا في الاتجاهين — سلسلة التصديق هي الطريق.',
                      'لا وسيط لمعاملة حضورية بسيطة — اذهب بنفسك بالوثيقة والهوية.']),
            docs=arr(['الوثيقة الأصلية (أو النسخة المقبولة لدى جهة الختم)',
                      'هويتك',
                      'ومعرفة متطلّب الجهة الأجنبية: الترجمة قبل الختم أم بعده']),
            fees='الختم لدى الجهات الإدارية معتادٌ بلا رسم أو برسم رمزي بحسب المكتب — اسأل مكتبك. والترجمة المحلَّفة بتعرفة مترجمها.',
            warn='صنّف الوثيقة قبل الذهاب: إداري للولاية/القائمقامية وقضائي لقصر العدل. وسوريا خارج الاتفاقية — لا تدفع لمن يعدك «أبوستيل سورياً». وترتيب الترجمة تحدّده الجهة المستقبِلة لا المترجم.',
            source='اتفاقية لاهاي لإلغاء التصديق (5 تشرين الأول 1961) وتركيا طرف فيها — قائمة الأطراف الرسمية على hcch.net (وسوريا ليست طرفاً)؛ وتوزيع الاختصاص في تركيا: الوثائق الإدارية لدى الولايات والقائمقاميات، والقضائية لدى رئاسات لجان العدل',
            tags=arr(['أبوستيل', 'تصديق الوثائق', 'معاملات رسمية', 'Apostille', 'دليل', '2026']),
            cat='معاملات رسمية',
            seo_t='الأبوستيل في تركيا: أين يُختم الإداري والقضائي — ولا أبوستيل لسوريا',
            seo_d='الوثائق الإدارية عند الوالي والقائمقام والقضائية في قصر العدل — والقاعدة الأهم لجمهورنا: سوريا ليست في اتفاقية لاهاي، فطريق وثائقها سلسلة التصديق لا الأبوستيل.'),
    art_sql(slug=NOTER,
            title='النوتر في تركيا 2026: رسومه تعرفة رسمية، والمترجم المحلَّف لغير المتقنين — وكيف تجد أقربه ومناوبه',
            intro='الوكالة، والتعهّد، وتصديق الترجمة والصور — النوتر بوابة نصف المعاملات. ورسومه ليست مزاجاً: تعرفة رسمية سنوية بحسب الوثيقة وصفحاتها ولغتها، فاسأل بالمستند بيدك قبل البدء. ومن لا يتقن التركية يوقّع بمترجم محلَّف وجوباً — حمايةً له. وفي العطل، بعض المدن الكبرى فيها نوتر مناوب.',
            details=N_DETAILS,
            steps=arr(['حدّد معاملتك: وكالة، تعهّد، تصديق ترجمة/صورة، توثيق عقد…',
                       'جهّز هويتك وأصل الوثيقة — واطلب تقدير الرسم بالمستند بيدك قبل البدء.',
                       'لا تتقن التركية؟ سيُستدعى مترجم محلَّف يقرأ عليك قبل التوقيع — لا تتجاوز ذلك.',
                       'اقرأ كل ورقة قبل التوقيع — ولا توقّع تعهّد إخلاء مع عقد إيجار.',
                       'استلم نسختك وإيصالك الرسمي بكل ما دفعت واحتفظ بهما.',
                       'معاملة عاجلة في عطلة؟ ابحث عن النوتر المناوب في مدينتك قبل التأجيل.']),
            tips=arr(['التعرفة رسمية سنوية — لا مغالاة ولا «تخفيض»؛ ما يغيّر الرقم هو وثيقتك نفسها.',
                      'التقدير المسبق حقّك — اسأل قبل البدء لا بعد الختم.',
                      'المترجم المحلَّف ضمانتك أنّ ما وقّعت هو ما فهمت — لا تستبدله بمرافق.',
                      'أي نوتر للمعاملات الاعتيادية — لا يلزمك «نوتر منطقتك».',
                      'من خارج تركيا: القنصلية التركية أو توثيق محلي بسلسلة تصديق/أبوستيل.',
                      'تثبيت عنوان الإيجار لم يعد يحتاج نوتراً — عقد e-Devlet يكفي.']),
            docs=arr(['هويتك (كملك/جواز/إقامة) سارية',
                      'أصل الوثيقة موضوع المعاملة وما يلزمها من مرفقات',
                      'لوكالة الخارج: بيانات الوكيل الدقيقة (اسم، رقم هوية) ونطاق التوكيل مكتوباً']),
            fees='تعرفة رسمية موحَّدة تصدر سنوياً وتتوقّف على نوع الوثيقة وصفحاتها ونسخها ولغتها — لا ننشر أرقاماً تتقادم؛ اطلب التقدير بالمستند بيدك، وخذ إيصالاً رسمياً بكل ما دفعت. والترجمة المحلَّفة بند مستقل بتعرفة مترجمها.',
            warn='اقرأ قبل أن توقّع — تعهّد الإخلاء يُوقَّع لدى النوتر ويُخرج الناس من بيوتهم. والمترجم المحلَّف وجوبي لغير المتقنين ولمصلحتهم. والتعرفة رسمية: استغرابك من الرقم لا يغيّره، وإيصالك الرسمي حقّك دائماً.',
            source='نظام النوتر التركي وتعرفته الرسمية السنوية (اتحاد النوتر التركي TNB — tnb.org.tr، ودليل مكاتبه)؛ ووجوب المترجم المحلَّف لغير متقني التركية في التوثيق؛ والنوتر المناوب أيام العطل في المدن الكبرى',
            tags=arr(['النوتر', 'رسوم النوتر', 'وكالة', 'ترجمة محلفة', 'دليل', '2026']),
            cat='معاملات رسمية',
            seo_t='رسوم النوتر في تركيا: تعرفة رسمية لا مساومة — والمترجم المحلف',
            seo_d='رسوم النوتر تعرفة سنوية رسمية بحسب الوثيقة — اسأل بالمستند بيدك قبل البدء. الوكالات والتعهدات وتصديق الترجمة، ووجوب المترجم المحلف لغير المتقنين، والنوتر المناوب في العطل.'),
])
arts = arts.replace('%', '%%')

sql = _no_bare_percent("""-- ============================================================================
-- دفعة النوتر وe-Devlet: أربع إعادات بناء، وطيّتان، ومهلة أيام سبعة تحفظ الرواتب
-- ============================================================================
-- * السجل العدلي (لا حكم عليه): مجاني وفوري من e-Devlet برمز تحقّق — مع
--   تمييز «سجل الأرشيف» الذي يعيد الناس، ومسار التصديق للخارج.
-- * UYAP موحَّداً: الدعاوى وملفات التنفيذ في صفحة واحدة (نقض İcra يتقاعد
--   إليها) — وفيها السطر الذي لم يذكره أي نقض: الاعتراض على أمر الأداء في
--   التتبّع بلا سند خلال سبعة أيام من التبليغ، واكتشاف الملف متأخراً هو
--   كيف تُحجز الرواتب.
-- * الأبوستيل: الإداري للوالي/القائمقام والقضائي للجان العدل — والقاعدة
--   الأهم لجمهورنا: سوريا خارج الاتفاقية، فلا أبوستيل ينفعها في الاتجاهين.
-- * النوتر على slug الرسوم عالي النيّة: التعرفة الرسمية (بلا أرقام —
--   تعرفة = لا مساومة ولا مفاجأة)، ووجوب المترجم المحلَّف حمايةً، والمناوب
--   في العطل، وجسر تحذير تعهّد الإخلاء من دليل الاستئجار (نقض الخريطة
--   يتقاعد إليه قسماً).
-- * transcript-edevlet مؤجَّلة لدفعة خدمات التعليم (مع tomer وbtk) — تبقى
--   حيّة، مؤكَّدة.
--
-- الصفوف السبعة id == slug (فُحص)، ولا روابط واردة، ولا أرقام ليرات
-- (مؤكَّد آلياً). آمن لإعادة التشغيل.
-- ============================================================================

""") + arts + _no_bare_percent("""

-- التقاعد
UPDATE articles SET status = 'draft', last_update = CURRENT_DATE
WHERE slug IN (%s) AND status = 'approved';

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved' AND details LIKE '%%Arşiv%%';
    IF n <> 1 THEN RAISE EXCEPTION 'sicil rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved' AND details LIKE '%%سبعة أيام من التبليغ%%';
    IF n <> 1 THEN RAISE EXCEPTION 'uyap rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved' AND details LIKE '%%سوريا ليست طرفاً%%';
    IF n <> 1 THEN RAISE EXCEPTION 'apostille rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved' AND details LIKE '%%nöbetçi noter%%';
    IF n <> 1 THEN RAISE EXCEPTION 'noter rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug IN (%s) AND status = 'approved';
    IF n > 0 THEN RAISE EXCEPTION '%% stub(s) still approved', n; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = 'transcript-edevlet' AND status = 'approved';
    IF n <> 1 THEN RAISE EXCEPTION 'transcript must stay live'; END IF;
END
$check$;

SELECT 'sicil rebuilt (free + barcode + archive distinction)' AS البند,
       (details LIKE '%%Arşiv%%')::text AS النتيجة
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'uyap combined (cases + icra + the 7-day objection)',
       (details LIKE '%%سبعة أيام من التبليغ%%')::text
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'apostille rebuilt (admin/judicial split + no-Syria rule)',
       (details LIKE '%%Adalet Komisyonu%%')::text
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'noter rebuilt (tariff + sworn translator + duty noter)',
       (details LIKE '%%nöbetçi noter%%')::text
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'two stubs retired (want 0 approved)', count(*)::text
FROM articles WHERE slug IN (%s) AND status = 'approved'
UNION ALL
SELECT 'transcript left live for the education batch', status
FROM articles WHERE slug = 'transcript-edevlet';
""") % (', '.join("'%s'" % d for d in DEAD),
        SICIL, UYAP, APOS, NOTER, ', '.join("'%s'" % d for d in DEAD),
        SICIL, UYAP, APOS, NOTER, ', '.join("'%s'" % d for d in DEAD))

path = os.path.join(REPO, 'sql', '2026-08-07_notary_edevlet_cluster.sql')
open(path, 'w', encoding='utf-8', newline='').write(sql)

_code = '\n'.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('السجل العدلي : %s — 229 ← %d حرفاً' % (SICIL, len(A_DETAILS)))
print('UYAP موحَّد  : %s — 225 ← %d حرفاً (+ مهلة الأيام السبعة)' % (UYAP, len(U_DETAILS)))
print('الأبوستيل    : %s — 314 ← %d حرفاً' % (APOS, len(P_DETAILS)))
print('النوتر       : %s — 265 ← %d حرفاً' % (NOTER, len(N_DETAILS)))
print('يتقاعد       : %s' % ', '.join(DEAD))
print('مؤجَّلة      : transcript-edevlet — لدفعة خدمات التعليم')
print('%% متبقية    :', sql.count('%%'), '(الصفر مطلوب)')
print('quote parity :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written      :', path, len(sql), 'chars')
