# -*- coding: utf-8 -*-
"""Health + phones batch: three rebuilds, one section, four folds — and 157.

── the map ────────────────────────────────────────────────────────────────

REBUILT:
  emergency-guide (238, 6v)        → the numbers that matter, led by the two
                                     facts stubs never carry: 112 is the ONE
                                     unified emergency number now (ambulance,
                                     fire, police, jandarma), and YİMER 157
                                     is the foreigners' own 24/7 line with
                                     Arabic support — the number our audience
                                     actually needs and rarely knows.
  gss-debt-inquiry (392, 13v)      → kept as a page BECAUSE it has two live
                                     referrers (sgk-gss + gss-premium link
                                     it). Why debts appear, the e-Devlet
                                     inquiry, and the two escapes nobody
                                     tells people: the income test (gelir
                                     testi) at the SYDV that can drop the
                                     premium to state-paid, and the
                                     TP-holders-are-not-GSS mix-up.
  phone-imei-register (184, 9v)    → the IMEI/registration guide: 120 days
                                     from entry, e-Devlet registration on
                                     the passport with a harç that is
                                     updated annually and now routinely
                                     rivals a local mid-range phone (the
                                     honest advice is to price both), the
                                     once-per-three-years right, and the
                                     plain truth the extension stub hedged:
                                     there is no lawful "extension" — the
                                     extension stub folds in.

SECTION: gecici-koruma-hat-guncelleme-2026 (259v, the line canonical) gains
the two topics its cluster lacked — your ID number changed (citizenship, new
document → update the line the same way, with the new document) and the
tourist-line trade-off (simpler papers, higher cost and limits; the normal
line wins for anyone staying). The two line stubs then fold into it.

FOLDS: pharmacy-duty → /tools/pharmacy (the honestly-reframed tool — the
pharmacy-tool-decision memory stands: no live-roster rebuild);
digital-imei-120-days-extension → phone-imei-register;
digital-tourist-line-vs-normal + digital-line-transfer-citizenship →
gecici-koruma-hat-guncelleme-2026.

All seven rows id == slug (checked); the only inbound links point at
gss-debt-inquiry, which stays. No lira figures (asserted).
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


EMERG = 'emergency-guide'
GSSD = 'gss-debt-inquiry'
IMEI = 'phone-imei-register'
HAT = 'gecici-koruma-hat-guncelleme-2026'
DEAD = ['pharmacy-duty', 'digital-imei-120-days-extension',
        'digital-tourist-line-vs-normal', 'digital-line-transfer-citizenship']

for s in (EMERG, GSSD, IMEI):
    r = get('articles?select=id,slug,status,details&slug=eq.' + s)[0]
    assert r['status'] == 'approved' and r['id'] == r['slug'] and len(r['details'] or '') < 1000, s
h = get('articles?select=status,details&slug=eq.' + HAT)[0]
assert h['status'] == 'approved' and 'خط السائح' not in h['details']
for d in DEAD:
    r = get('articles?select=id,slug,status&slug=eq.' + d)
    assert r and r[0]['status'] == 'approved' and r[0]['id'] == r[0]['slug'], d
for s in ('sgk-gss-health-insurance-turkey-2026', 'gss-premium-2026-foreigners-syrians',
          'syria-temporary-protection-health-2026', 'btk-ekayit-foreigners-phone-line-2026',
          'kimlik-ilac-recete-katilim-payi-sgk-teb-2026', 'turkey-medical-visa'):
    r = get('articles?select=status&slug=eq.' + s)
    assert r and r[0]['status'] == 'approved', s + ' not live'
assert os.path.isdir(os.path.join(REPO, 'src/app/tools/pharmacy'))

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
    esc = {}
    for k, v in kw.items():
        esc[k] = q(v) if isinstance(v, str) and k not in ('slug', 'steps', 'tips', 'docs', 'tags') else v
    return ART.format(**esc)


E_DETAILS = (
    '<div style="background:#fee2e2;border:2px solid #dc2626;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الرقمان اللذان يكفيانك حفظاً</strong></p>'
    '<p style="margin:0;"><strong>112</strong> لكل طارئ — إسعاف وإطفاء وشرطة وجندرما، '
    'رقم واحد موحَّد في كل تركيا. و<strong>157</strong> (YİMER) خطّ الأجانب الرسمي على '
    'مدار الساعة <strong>وبالعربية</strong> — لأسئلة الإقامة والحماية والطوارئ الخاصة '
    'بوضعك كأجنبي.</p></div>'

    '<h2>112: رقم واحد لكل الطوارئ</h2>'
    '<p>وحّدت تركيا أرقام الطوارئ كلّها تحت <strong>112</strong>: الإسعاف، والإطفاء، '
    'والشرطة، والجندرما، والكوارث — اتصال واحد والمقسّم يوجّه. لم تعد تحتاج حفظ أرقام '
    'متفرّقة، والأرقام القديمة تُحوَّل إليه.</p>'
    '<p><strong>حين تتصل:</strong></p>'
    '<ul>'
    '<li>قل <strong>مكانك أولاً</strong>: الولاية، والقضاء، والحي، والشارع، ورقم البناء '
    'والطابق — وأقرب معلَم إن لم تعرف العنوان الدقيق.</li>'
    '<li>ثم ماذا يحدث ولمن (وعيٌ؟ نزيف؟ حريق؟ عدد المصابين).</li>'
    '<li><strong>لا تُغلق أولاً</strong> — دع الموظف يُنهي هو، فقد يوجّهك بإسعافات '
    'حتى الوصول.</li>'
    '<li>لا تتقن التركية؟ قلها بما تستطيع وابقَ على الخط — وللمسائل غير الفورية '
    'استعمل 157 بالعربية.</li>'
    '</ul>'

    '<h2>157 — خطّ الأجانب الذي لا يعرفه أكثرهم (YİMER)</h2>'
    '<p>مركز اتصال الأجانب التابع لإدارة الهجرة، يعمل <strong>24/7 وبعدّة لغات منها '
    'العربية</strong>: أسئلة الإقامة والحماية المؤقتة، وبلاغات ضحايا الاتّجار بالبشر، '
    'واستفسارات وضعك القانوني. احفظه — هو «112 الخاص بوضعك كأجنبي».</p>'

    '<h2>بقية الأرقام النافعة</h2>'
    '<table><thead><tr><th>الرقم</th><th>الجهة</th></tr></thead><tbody>'
    '<tr><td><strong>183</strong></td><td>الدعم الاجتماعي والأسري — العنف الأسري '
    'وحماية المرأة والطفل</td></tr>'
    '<tr><td><strong>ALO 170</strong></td><td>شكاوى العمل والضمان الاجتماعي</td></tr>'
    '<tr><td><strong>168</strong></td><td>الهلال الأحمر — ومنه شؤون بطاقة المساعدات</td></tr>'
    '<tr><td><strong>153</strong></td><td>زابطة البلدية — الضجيج والباعة والمخالفات '
    'البلدية</td></tr>'
    '</tbody></table>'

    '<h2>الصيدلية المناوبة والطبابة غير الطارئة</h2>'
    '<p>خارج ساعات الدوام: <a href="/tools/pharmacy">أداة الصيدلية المناوبة عندنا</a> '
    'تدلّك على مصادر القوائم الرسمية بولايتك. وأسعار الأدوية ومشاركات حامل الكملك في '
    '<a href="/article/kimlik-ilac-recete-katilim-payi-sgk-teb-2026">دليل رسوم '
    'الأدوية</a>، وتغطيتك الصحية في '
    '<a href="/article/sgk-gss-health-insurance-turkey-2026">دليل SGK وGSS</a>.</p>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>هل يسألونني عن أوراقي إذا اتصلت بالإسعاف؟</h3>'
    '<p>الطوارئ الطبية تُسعف بلا سؤال عن وضعك — لا تؤخّر اتصالاً منقذاً خوفاً من '
    'الأوراق.</p>'
    '<h3>اتصال بالخطأ بـ112؟</h3>'
    '<p>لا تُغلق هارباً — قل إنه خطأ. الإغلاق الصامت قد يُعامل بلاغاً ويُشغل فرقاً '
    'بلا داعٍ.</p>'
)

G_DETAILS = (
    '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;">'
    '<p style="margin:0 0 10px;font-size:17px;"><strong>الخلاصة</strong></p>'
    '<p style="margin:0;">دينُ GSS يظهر غالباً لأنّ النظام سجّلك تلقائياً في التأمين العام '
    'حين انقطعت تغطيتك الأخرى — لا لأنك «استعملت» شيئاً. تحقّق من e-Devlet، واعرف السبب، '
    'ثم اسلك أحد المخرجين: تصحيح الصفة، أو <strong>فحص الدخل (Gelir Testi)</strong> الذي '
    'قد يُنزل قسطك حتى تتكفّل به الدولة.</p></div>'

    '<h2>لماذا ظهر عليك دين GSS أصلاً؟</h2>'
    '<ul>'
    '<li><strong>انقطاع تغطية</strong>: انتهى عملك المسجَّل (وتغطية SGK معه) فسجّلك '
    'النظام تلقائياً في GSS بقسطه — من تاريخ الانقطاع.</li>'
    '<li><strong>صفة طالب لم تُثبَّت</strong> في وقتها فجرى القيد قيداً عاماً.</li>'
    '<li><strong>فجوات إقامة/تسجيل</strong> حُسبت فترات غير مغطّاة.</li>'
    '</ul>'
    '<p>فالدين غالباً <strong>قيد آليّ لا فاتورة استعمال</strong> — ولهذا يُعالَج '
    'بتصحيح الصفة لا بالدفع الأعمى.</p>'

    '<h2>استعلم أولاً — من e-Devlet</h2>'
    '<p>خدمات SGK على e-Devlet تريك أقساط GSS المتراكمة وفتراتها (استعلام أقساط '
    'التأمين العام). اقرأ <strong>الفترات</strong> قبل المبلغ: متى بدأ القيد؟ وهل يطابق '
    'انقطاعاً حقيقياً أم خطأ صفة؟</p>'

    '<h2>المخرجان اللذان لا يخبرك بهما أحد</h2>'
    '<ol>'
    '<li><strong>تصحيح الصفة بأثره</strong>: كنتَ طالباً، أو مشمولاً بتغطية أخرى، أو '
    'الفترة محسوبة خطأً؟ راجع مديرية SGK في ولايتك بمستنداتك — تصحيح القيد يُسقط ما '
    'بُني عليه.</li>'
    '<li><strong>فحص الدخل (Gelir Testi)</strong> لدى وقف التضامن (SYDV) في منطقتك: '
    'قسط GSS يتدرّج بدخل الأسرة، وذوو الدخل الأدنى <strong>تتكفّل الدولة بقسطهم</strong> '
    '— ومن لم يُجرِ الفحص أصلاً قد يكون مقيّداً على أعلى شريحة بلا وجه. الفحص مجاني '
    'وطلبه حقّك.</li>'
    '</ol>'
    '<p>وللدين الصحيح الباقي بعد التصحيح: اسأل SGK عن <strong>التقسيط</strong> — '
    'وسدّد المتّفق عليه في مواعيده كي لا يعود التراكم.</p>'

    '<h2>حامل الكملك: انتبه — أنت لست في GSS أصلاً</h2>'
    '<p>الحماية المؤقتة نظام تغطية مستقلّ عن GSS العام — فظهور «دين GSS» على حامل كملك '
    'إشارة خلط صفة تستحق المراجعة لا الدفع: راجع '
    '<a href="/article/syria-temporary-protection-health-2026">تغطية الحماية المؤقتة '
    'الصحية</a>، وقارن بأرقام '
    '<a href="/article/gss-premium-2026-foreigners-syrians">دليل قسط GSS المفصَّل</a>، '
    'والصورة الكاملة في '
    '<a href="/article/sgk-gss-health-insurance-turkey-2026">دليل SGK وGSS</a>.</p>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>هل يمنعني دين GSS من تجديد الإقامة؟</h3>'
    '<p>الديون العامة تظهر في معاملات شتّى وقد تعطّل — لا تتركها تتراكم إلى موعد '
    'التجديد: صحّح أو قسّط مبكراً.</p>'
    '<h3>أتجاهل المبلغ الصغير؟</h3>'
    '<p>القيد الآلي لا يتوقّف — الصغيرُ يكبر شهرياً ما دام سبب القيد قائماً. عالج '
    'السبب لا الرقم.</p>'
)

I_DETAILS = (
    '<div style="background:#eff6ff;border-right:4px solid #3b82f6;padding:14px 18px;margin:0 0 20px;">'
    '<p style="margin:0;"><strong>قبل أن تدفع رسم التسجيل، اعمل الحساب:</strong> رسم '
    'تسجيل الهاتف الأجنبي يُحدَّث سنوياً وصار كثيراً ما <strong>يوازي سعر هاتف جديد '
    'محلي</strong> من الفئة المتوسطة. سعّر الاثنين قبل القرار — فكثيرون يدفعون الرسم '
    'لهاتفٍ يسوى أقلّ منه.</p></div>'

    '<h2>القاعدة: 120 يوماً ثم التقييد</h2>'
    '<p>الهاتف القادم معك من الخارج يعمل على الشبكات التركية <strong>120 يوماً من '
    'دخولك</strong> المسجَّل، ثم يُقيَّد (يُحجب IMEI) ما لم تسجّله. والتسجيل يربط الجهاز '
    '<strong>بجواز سفرك ودخولك</strong> — لا التفاف على ذلك.</p>'

    '<h2>التسجيل: e-Devlet ورسمٌ يُدفع</h2>'
    '<ol>'
    '<li><strong>ادفع رسم التسجيل</strong> (Harç) — عبر القنوات الضريبية المعتمدة '
    'وe-Devlet؛ الرسم يُحدَّث سنوياً ولا ننشر رقماً يتقادم.</li>'
    '<li><strong>سجّل IMEI</strong> عبر خدمة تسجيل الأجهزة المجلوبة من الخارج على '
    'e-Devlet ببيانات جوازك ودخولك.</li>'
    '<li>ثم يُفعَّل الجهاز على قيدك خلال المعالجة.</li>'
    '</ol>'
    '<p><strong>وحقّك محدود التكرار:</strong> تسجيل جهاز واحد لكل مسافر '
    '<strong>مرة كل ثلاث سنوات</strong> — لا تحرقه على هاتف لا يستحق.</p>'

    '<h2>«هل يمكن تمديد المهلة؟» — الجواب الصريح</h2>'
    '<p><strong>لا يوجد تمديد نظامي لمهلة الـ120 يوماً.</strong> ما ستقرؤه عن «حلول '
    'تمديد» هو أحد ثلاثة: خروجٌ ودخول جديد (وله أحكامه وقيوده ولا تبنِ عليه)، أو '
    'التفافات غير نظامية تنتهي بحجب الجهاز وضياع المال، أو خلط مع أنظمة قديمة. '
    'خيارتك الحقيقية ثلاثة: سجّل بالرسم، أو استعمل هاتفاً محلياً، أو استعمل جهازك '
    'القديم بلا شريحة تركية (واي فاي فقط لا يُقيَّد).</p>'

    '<div style="background:#fee2e2;border-right:4px solid #dc2626;padding:14px 18px;margin:18px 0;">'
    '<p style="margin:0;"><strong>احذر سوق «فكّ التقييد»:</strong> IMEI «المفتوح» بغير '
    'المسار الرسمي يُعاد حجبه وتُلاحَق القيود المزوَّرة — والمال المدفوع لا يعود. '
    'وهاتفٌ مستعمل يُعرض بسعر مغرٍ قد يكون محجوباً أو مقلَّد IMEI: تحقّق قبل الشراء '
    'من حالة الجهاز عبر استعلام IMEI الرسمي.</p></div>'

    '<h2>وشريحتك وخطّك شأن آخر</h2>'
    '<p>تسجيل الجهاز لا يُغني عن سلامة الخط: بياناتُ خطّك يجب أن تكون باسمك ومحدَّثة — '
    '<a href="/article/gecici-koruma-hat-guncelleme-2026">تحديث بيانات الخط</a> '
    'و<a href="/article/btk-ekayit-foreigners-phone-line-2026">خدمة e-Kayıt لتفعيل '
    'ونقل الخطوط</a>.</p>'

    '<h2>أسئلة متكرّرة</h2>'
    '<h3>هاتفان معي — أسجّلهما؟</h3>'
    '<p>الحق جهاز واحد كل ثلاث سنوات للمسافر — الثاني إمّا بلا شريحة تركية أو '
    'بالحلول المحلية.</p>'
    '<h3>اشتريت هاتفي من تركيا أصلاً — هل يخصّني هذا؟</h3>'
    '<p>لا — المسجَّل محلياً مقيَّد أصلاً باسم النظام. هذا الدليل لمن جلب جهازه من '
    'الخارج.</p>'
    '<h3>غادرت وعدت — هل يتصفّر العدّاد؟</h3>'
    '<p>المهلة مرتبطة بالدخول المسجَّل وقواعد BTK في احتسابها دقيقة — لا تبنِ خطة '
    'على «تصفير» سمعتَه؛ الافتراض الآمن أن مهلتك واحدة.</p>'
)

HAT_ADD = (
    '<h2>حالتان تسألون عنهما كثيراً</h2>'
    '<h3>تغيّر رقم هويتك؟ (جنسية، وثيقة جديدة) — حدّث الخط وإلا فقدت رسائلك</h3>'
    '<p>من حصل على الجنسية أو تبدّلت وثيقته (رقم جديد بدل الأجنبي 99…) يجب أن يحدّث '
    'بيانات خطّه على الوثيقة الجديدة — بالمسار نفسه المشروح أعلاه أو عبر فرع المشغّل '
    'بالوثيقة الجديدة، وخدمة <a href="/article/btk-ekayit-foreigners-phone-line-2026">'
    'e-Kayıt</a> تخدم التفعيل والنقل إلكترونياً. تأخيرُ التحديث يعني خطّاً معلَّقاً على '
    'رقمٍ لم يعد لك — فتتوقّف رسائل التحقّق (OTP) للبنك وe-Devlet في أسوأ وقت.</p>'
    '<h3>«خط السائح» أم الخط العادي؟</h3>'
    '<p>خطوط السيّاح أبسط أوراقاً وأسرع تفعيلاً — لكنها أعلى كلفةً وبقيود مدة وباقات. '
    'القاعدة: <strong>لزيارة قصيرة يصلح خط السائح، ولمن يقيم فالخط العادي باسمك '
    'وهويتك</strong> هو ما تُبنى عليه البنوك وe-Devlet وكل خدماتك — ولا تشترِ خطاً '
    'باسم غيرك مهما سهل: خطٌّ ليس باسمك مشكلةٌ مؤجَّلة.</p>'
)

for label, body, needles in [
    ('emergency', E_DETAILS, ['112', '157', 'YİMER', 'بالعربية', '/tools/pharmacy',
                              'sgk-gss-health-insurance-turkey-2026']),
    ('gss', G_DETAILS, ['Gelir Testi', 'SYDV', 'تتكفّل الدولة بقسطهم',
                        'syria-temporary-protection-health-2026', 'gss-premium-2026-foreigners-syrians']),
    ('imei', I_DETAILS, ['120 يوماً', 'مرة كل ثلاث سنوات', 'لا يوجد تمديد نظامي',
                         'gecici-koruma-hat-guncelleme-2026', 'btk-ekayit-foreigners-phone-line-2026']),
    ('hat add', HAT_ADD, ['خط السائح', 'OTP', 'btk-ekayit-foreigners-phone-line-2026']),
]:
    for nd in needles:
        assert nd in body, 'PREDICATE WOULD LIE: %r not in %s' % (nd, label)
ALL = E_DETAILS + G_DETAILS + I_DETAILS + HAT_ADD
for dead in DEAD:
    assert ('href="/article/%s"' % dead) not in ALL
assert not re.search(r'\d[\d.,]*\s*(?:ليرة|TL)', ALL), 'a lira figure leaked'
assert '%' not in ALL

arts = '\n\n'.join([
    art_sql(slug=EMERG,
            title='أرقام الطوارئ في تركيا 2026: 112 لكل شيء — و157 خطّ الأجانب بالعربية الذي لا يعرفه أكثرهم',
            intro='رقمان يكفيانك حفظاً: 112 الموحَّد لكل طارئ — إسعاف وإطفاء وشرطة وجندرما باتصال واحد — و157 (YİMER) خطّ الأجانب الرسمي على مدار الساعة وبالعربية لكل ما يخصّ وضعك كأجنبي. وهذا الدليل يرتّب البقية: 183 للدعم الأسري، وALO 170 للعمل، و168 للهلال الأحمر — وماذا تقول حين تتصل.',
            details=E_DETAILS,
            steps=arr(['احفظ الرقمين: 112 لكل طارئ، و157 لخط الأجانب بالعربية.',
                       'عند الاتصال بـ112: المكان أولاً (ولاية، قضاء، حي، شارع، بناء، طابق، معلَم).',
                       'ثم ماذا يحدث ولمن — ولا تُغلق حتى يُنهي الموظف.',
                       'المسائل غير الفورية الخاصة بوضعك كأجنبي: 157 بالعربية.',
                       'صيدلية بعد الدوام؟ أداة الصيدلية المناوبة عندنا تدلّك على القوائم الرسمية.']),
            tips=arr(['112 موحَّد — لم تعد تحتاج حفظ أرقام متفرقة.',
                      '157 يعمل 24/7 وبالعربية — «112 الخاص بوضعك كأجنبي».',
                      'الطوارئ الطبية تُسعف بلا سؤال عن أوراقك — لا تؤخّر اتصالاً منقذاً.',
                      'اتصال خطأ؟ قل إنه خطأ ولا تُغلق صامتاً.',
                      '183 للعنف الأسري وحماية المرأة والطفل — سرّي.']),
            docs=arr(['لا أوراق للاتصال — عنوانك الدقيق هو أهم ما تجهّزه في ذهنك',
                      'لمقيم جديد: اكتب عنوانك التركي كاملاً في هاتفك لتقرأه عند الحاجة']),
            fees='الاتصال بأرقام الطوارئ مجاني من أي هاتف — حتى بلا رصيد.',
            warn='لا تستعمل 112 لغير الطوارئ — إشغاله يؤخّر منقذاً عن غيرك. وللاستفسارات استعمل 157 (الأجانب) أو أرقام الجهات المختصة.',
            source='الرقم الموحَّد 112 (توحيد أرقام الطوارئ في عموم تركيا)؛ ومركز اتصال الأجانب YİMER 157 التابع لإدارة الهجرة (24/7، بلغات منها العربية — goc.gov.tr)؛ وخطوط 183 (وزارة الأسرة) وALO 170 (العمل) و168 (الهلال الأحمر) و153 (زابطة البلدية)',
            tags=arr(['الطوارئ', '112', 'YİMER 157', 'الصحة والتأمين', 'دليل', '2026']),
            cat='الصحة والتأمين',
            seo_t='أرقام الطوارئ في تركيا: 112 لكل شيء و157 بالعربية للأجانب',
            seo_d='112 الموحَّد لكل طارئ، و157 (YİMER) خط الأجانب الرسمي 24/7 بالعربية — وماذا تقول حين تتصل، والأرقام المكمّلة: 183 و170 و168 و153. مجاني حتى بلا رصيد.'),
    art_sql(slug=GSSD,
            title='دين التأمين الصحي GSS: لماذا ظهر عليك، وكيف تُسقطه أو تُنزله — فحص الدخل الذي لا يخبرك به أحد',
            intro='فتحت e-Devlet فوجدت ديناً لـGSS لم تفهم مصدره؟ الغالب أنّ النظام سجّلك تلقائياً في التأمين العام حين انقطعت تغطيتك — قيدٌ آلي لا فاتورة استعمال. قبل أن تدفع: اعرف الفترات والسبب، وصحّح الصفة إن كانت خطأ، واطلب فحص الدخل (Gelir Testi) الذي قد يُنزل قسطك حتى تتكفّل به الدولة. وحامل الكملك أصلاً خارج GSS — دينه إشارة خلطٍ تُراجَع لا تُدفَع.',
            details=G_DETAILS,
            steps=arr(['استعلم من e-Devlet عن أقساط GSS وفتراتها — اقرأ الفترات قبل المبلغ.',
                       'حدّد السبب: انقطاع تغطية؟ صفة طالب لم تثبَّت؟ خطأ قيد؟',
                       'صفة خاطئة؟ راجع مديرية SGK بمستنداتك — تصحيح القيد يُسقط ما بُني عليه.',
                       'دخلك محدود؟ اطلب فحص الدخل لدى وقف التضامن (SYDV) — قد تتكفّل الدولة بالقسط.',
                       'دين صحيح باقٍ؟ قسّطه لدى SGK وسدّد بالمواعيد.',
                       'حامل كملك؟ لا تدفع ديناً لنظامٍ لست فيه — راجع صفة قيدك أولاً.']),
            tips=arr(['الدين قيد آلي غالباً لا فاتورة استعمال — عالج السبب لا الرقم.',
                      'فحص الدخل حقّك ومجاني — وذوو الدخل الأدنى قسطهم على الدولة.',
                      'صفة الطالب تُثبَّت في وقتها — تأخيرها يصنع ديناً بلا خدمة.',
                      'لا تترك الدين إلى موعد تجديد الإقامة — الديون العامة تعطّل المعاملات.',
                      'حامل الكملك خارج GSS — دينه علامة خلط صفة.']),
            docs=arr(['حساب e-Devlet للاستعلام',
                      'ما يثبت صفتك للفترة المقيَّدة: وثيقة طالب، أو تغطية عمل، أو كملك',
                      'لفحص الدخل: ما يطلبه وقف التضامن عن دخل الأسرة']),
            fees='الاستعلام وفحص الدخل مجانيان. وقسط GSS يتدرّج بدخل الأسرة وتُحدَّث مقاديره سنوياً — الأرقام الجارية في دليل قسط GSS المفصَّل عندنا، ولا نكرّرها هنا كي لا تتقادم.',
            warn='لا تدفع ديناً لم تفهم قيده — التصحيح يُسقط ما لا يُسترد بعد الدفع بسهولة. والقيد الآلي يستمر ما دام سببه — معالجة السبب قبل الرقم. وحامل الكملك ليس في GSS أصلاً.',
            source='التأمين الصحي العام (GSS) في قانون الضمان الاجتماعي رقم 5510 — القيد التلقائي عند انقطاع التغطية، وفحص الدخل (Gelir Testi) لدى أوقاف التضامن الاجتماعي وتدرّج الأقساط بالدخل وتكفّل الدولة بالشريحة الدنيا؛ واستعلام الأقساط عبر خدمات SGK على e-Devlet',
            tags=arr(['GSS', 'ديون التأمين', 'SGK', 'الصحة والتأمين', 'فحص الدخل', 'دليل', '2026']),
            cat='الصحة والتأمين',
            seo_t='دين GSS: لماذا ظهر وكيف تسقطه — وفحص الدخل الذي يصفّر قسطك',
            seo_d='دين التأمين الصحي غالباً قيد آلي عند انقطاع تغطيتك لا فاتورة استعمال — صحّح الصفة، واطلب فحص الدخل (قد تتكفل الدولة بالقسط)، وقسّط الباقي. وحامل الكملك خارج GSS أصلاً.'),
    art_sql(slug=IMEI,
            title='تسجيل الهاتف الأجنبي في تركيا (IMEI) 2026: مهلة 120 يوماً، ورسمٌ قد يوازي هاتفاً جديداً — ولا «تمديد»',
            intro='جلبت هاتفك من الخارج؟ يعمل 120 يوماً من دخولك ثم يُقيَّد ما لم تسجّله على جوازك عبر e-Devlet بدفع رسم يُحدَّث سنوياً — وصار كثيراً ما يوازي سعر هاتف محلي جديد، فاعمل الحساب قبل الدفع. وحقّ التسجيل مرة كل ثلاث سنوات، ولا يوجد تمديد نظامي للمهلة مهما قرأت — والتفاف «فكّ التقييد» ينتهي بحجب الجهاز وضياع المال.',
            details=I_DETAILS,
            steps=arr(['قبل كل شيء: قارن رسم التسجيل الجاري بسعر هاتف محلي جديد — القرار مالي أولاً.',
                       'قرّرت التسجيل؟ ادفع الرسم (Harç) عبر القنوات المعتمدة.',
                       'سجّل IMEI عبر خدمة الأجهزة المجلوبة من الخارج على e-Devlet ببيانات جوازك ودخولك.',
                       'تذكّر: جهاز واحد كل ثلاث سنوات — لا تحرق الحق على هاتف لا يستحق.',
                       'وحدّث بيانات خطّك باسمك — تسجيل الجهاز لا يُصلح خطاً معلَّقاً.']),
            tips=arr(['الرسم يُحدَّث سنوياً وكثيراً ما يوازي هاتفاً محلياً — سعّر الاثنين.',
                      'لا تمديد نظامياً للـ120 يوماً — و«الحلول» غير النظامية تنتهي بالحجب.',
                      'واي فاي بلا شريحة تركية لا يُقيَّد — خيار مجاني لجهازك القديم.',
                      'هاتف مستعمل بسعر مغرٍ؟ استعلم عن IMEI رسمياً قبل الدفع.',
                      'حقك مرة كل ثلاث سنوات — خطّط له.']),
            docs=arr(['جواز السفر بختم الدخول الأخير',
                      'حساب e-Devlet',
                      'إيصال دفع الرسم',
                      'الجهاز نفسه (رقم IMEI من ‎*#06#‎)']),
            fees='رسم التسجيل يُحدَّث سنوياً ولا ننشر رقماً يتقادم — وهو مرتفع بما يستدعي مقارنته بسعر هاتف محلي جديد قبل القرار. والاستعلام عن حالة IMEI مجاني.',
            warn='لا تمديد نظامياً لمهلة الـ120 يوماً. وسوق «فكّ التقييد» احتيال ينتهي بإعادة الحجب. والحق مرة كل ثلاث سنوات. ولا تشترِ مستعملاً قبل استعلام IMEI الرسمي.',
            source='نظام تسجيل الأجهزة المجلوبة مع المسافرين لدى هيئة BTK — مهلة الـ120 يوماً من الدخول، والتسجيل على جواز السفر عبر e-Devlet بعد دفع الرسم المحدَّث سنوياً، وحق التسجيل مرة كل ثلاث سنوات، واستعلام حالة IMEI الرسمي',
            tags=arr(['IMEI', 'تسجيل الهاتف', 'BTK', 'e-Devlet', 'دليل', '2026']),
            cat='السكن والحياة',
            seo_t='تسجيل الهاتف الأجنبي IMEI: مهلة 120 يوماً ولا تمديد — والحساب أولاً',
            seo_d='هاتفك الأجنبي يعمل 120 يوماً ثم يُقيَّد — والتسجيل على جوازك عبر e-Devlet برسم سنوي صار يوازي هاتفاً محلياً جديداً: اعمل الحساب. مرة كل 3 سنوات، ولا تمديد، و«فك التقييد» احتيال.'),
])
arts = arts.replace('%', '%%')

sql = _no_bare_percent("""-- ============================================================================
-- دفعة الصحة والهواتف: ثلاث إعادات بناء، وقسم للخطوط، وأربع طيّات — و157
-- ============================================================================
-- * الطوارئ: 112 الموحَّد لكل شيء — و157 (YİMER) خط الأجانب الرسمي 24/7
--   بالعربية: الرقم الذي يحتاجه جمهورنا ولا يعرفه أكثرهم. وربط الصيدلية
--   المناوبة بأداتنا (قرار الأداة الصادق قائم — لا بناء لجداول حية).
-- * دين GSS: بقي صفحةً لأنّ له رابطَين واردَين من صفحتي GSS القويتين —
--   وبُني على ما لا يقوله أحد: الدين قيدٌ آلي لا فاتورة، وفحص الدخل لدى
--   SYDV قد يُنزل القسط حتى تتكفّل به الدولة، وحامل الكملك خارج GSS أصلاً
--   فدينه علامة خلط صفة تُراجَع لا تُدفَع.
-- * IMEI: نقضا التسجيل والتمديد يتوحّدان في دليل صادق: 120 يوماً، ورسم سنوي
--   «قارنه بهاتف محلي جديد»، ومرة كل ثلاث سنوات، وجوابٌ صريح: لا تمديد
--   نظامياً — وسوق «فكّ التقييد» احتيال.
-- * مرجعي الخطوط (259 قراءة) يكسب قسم الحالتين المتكرّرتين: تغيّر رقم
--   الهوية (جنسية) وتعليق OTP، وخط السائح مقابل العادي — ونقضاهما يتقاعدان
--   إليه.
-- * pharmacy-duty ← ‎/tools/pharmacy (الأداة القائمة).
--
-- الصفوف السبعة id == slug (فُحص)، والروابط الواردة الوحيدة تشير إلى
-- gss-debt-inquiry الباقي. لا أرقام ليرات (مؤكَّد آلياً).
-- آمن لإعادة التشغيل.
-- ============================================================================

""") + arts + _no_bare_percent("""

-- قسم الحالتين في مرجعي الخطوط (محروس)
UPDATE articles SET details = details || '%s', last_update = CURRENT_DATE
WHERE slug = '%s' AND details NOT LIKE '%%خط السائح%%';

-- التقاعد
UPDATE articles SET status = 'draft', last_update = CURRENT_DATE
WHERE slug IN (%s) AND status = 'approved';

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved' AND details LIKE '%%157%%' AND details LIKE '%%YİMER%%';
    IF n <> 1 THEN RAISE EXCEPTION 'emergency rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved' AND details LIKE '%%Gelir Testi%%';
    IF n <> 1 THEN RAISE EXCEPTION 'gss rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND status = 'approved' AND details LIKE '%%لا يوجد تمديد نظامي%%';
    IF n <> 1 THEN RAISE EXCEPTION 'imei rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = '%s' AND details LIKE '%%خط السائح%%';
    IF n <> 1 THEN RAISE EXCEPTION 'the hat section did not land'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug IN (%s) AND status = 'approved';
    IF n > 0 THEN RAISE EXCEPTION '%% stub(s) still approved', n; END IF;
END
$check$;

SELECT 'emergency rebuilt (112 unified + YIMER 157 Arabic)' AS البند,
       (details LIKE '%%YİMER%%')::text AS النتيجة
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'gss-debt rebuilt (auto-enrolment + income test escape)',
       (details LIKE '%%Gelir Testi%%')::text
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'imei rebuilt (120 days, no extension, 3-year right)',
       (details LIKE '%%مرة كل ثلاث سنوات%%')::text
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'line canonical gained the two-cases section',
       (details LIKE '%%خط السائح%%')::text
FROM articles WHERE slug = '%s'
UNION ALL
SELECT 'four stubs retired (want 0 approved)', count(*)::text
FROM articles WHERE slug IN (%s) AND status = 'approved';
""") % (q(HAT_ADD), HAT,
        ', '.join("'%s'" % d for d in DEAD),
        EMERG, GSSD, IMEI, HAT, ', '.join("'%s'" % d for d in DEAD),
        EMERG, GSSD, IMEI, HAT, ', '.join("'%s'" % d for d in DEAD))

path = os.path.join(REPO, 'sql', '2026-08-07_health_phones_cluster.sql')
open(path, 'w', encoding='utf-8', newline='').write(sql)

_code = '\n'.join(l for l in sql.splitlines() if not l.lstrip().startswith('--'))
print('الطوارئ      : %s — 238 ← %d حرفاً (112 + YİMER 157 بالعربية)' % (EMERG, len(E_DETAILS)))
print('دين GSS      : %s — 392 ← %d حرفاً (فحص الدخل + خلط الكملك)' % (GSSD, len(G_DETAILS)))
print('IMEI         : %s — 184 ← %d حرفاً (لا تمديد + مرة كل 3 سنوات)' % (IMEI, len(I_DETAILS)))
print('قسم الخطوط   : %d حرفاً ← %s (محروس)' % (len(HAT_ADD), HAT))
print('يتقاعد       : %s' % ', '.join(DEAD))
print('  الصيدلية   ← /tools/pharmacy (الأداة القائمة — قرار الذاكرة محترم)')
print('%% متبقية    :', sql.count('%%'), '(المطلوب داخل أنماط LIKE فقط بعد التنسيق: 0)')
print('quote parity :', 'OK' if re.sub(r"''", '', _code).count("'") % 2 == 0 else '*** BROKEN ***')
print('written      :', path, len(sql), 'chars')
