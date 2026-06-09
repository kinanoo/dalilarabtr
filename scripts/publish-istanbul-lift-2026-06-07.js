/**
 * Publish: Istanbul ban lift — only 5 neighborhoods remain closed.
 *
 * Style: news / wire-style dispatch, no CTAs, no marketing. The story
 * itself is the magnet — millions of Syrians in Istanbul have waited
 * years for this. Hook the reader in the first line, give them the list,
 * give them the context, get out.
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.pulled', override: true });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TODAY = '2026-06-07';

const article = {
    id: 'istanbul-closed-neighborhoods-lift-2026',
    slug: 'istanbul-closed-neighborhoods-lift-2026',
    title: 'عاجل ٧ يونيو ٢٠٢٦: إسطنبول ترفع الحظر عن جميع الأحياء المغلقة باستثناء خمسة — القائمة الرسمية',
    category: 'الإقامة والكيمليك',
    intro: 'في تحوّل تاريخي ينتظره أكثر من نصف مليون سوري وعربي في إسطنبول، أعلنت مديرية الهجرة الرسمية في الولاية رفع الحظر عن جميع الأحياء التي كانت مغلقة أمام تسجيل عناوين الأجانب، باستثناء <strong>خمسة أحياء فقط</strong> من أصل ٥٤ حياً كانت ضمن قائمة ٢٠٢٢. بهذا التحديث، تنضمّ إسطنبول إلى موجة فتح الأحياء التي بدأت في شانلي أورفا وقونيا وكلس، وتُسجّل أكبر نسبة فتح إقليمي على مستوى تركيا — تقارب <strong>٩١٪</strong> من قائمتها السابقة.',
    details: `
<div style="background:linear-gradient(135deg,#dcfce7,#bbf7d0);border:2px solid #16a34a;padding:20px;margin:16px 0;border-radius:12px;">
  <p style="margin:0;font-weight:bold;color:#14532d;font-size:18px;">🎉 الخبر باختصار:</p>
  <p style="margin:8px 0 0;color:#166534;font-size:16px;line-height:1.7;">
    من أصل <strong>٥٤ حياً</strong> كانت مغلقة في إسطنبول ضمن قائمة ٢٠٢٢،
    <strong>بقي ٥ فقط</strong> ضمن قائمة المغلقة بعد ٧ يونيو ٢٠٢٦.
    <strong>٤٩ حياً</strong> أُعيد فتحها — يُسمح فيها الآن بتسجيل عناوين الأجانب.
  </p>
</div>

<h2>الأحياء الخمسة الوحيدة التي بقيت مغلقة</h2>

<table style="width:100%;border-collapse:collapse;font-size:14px;background:white;margin:12px 0;">
  <thead><tr style="background:#7f1d1d;color:white;">
    <th style="padding:10px;border:1px solid #450a0a;">القضاء (İlçe)</th>
    <th style="padding:10px;border:1px solid #450a0a;">الحي (Mahalle)</th>
  </tr></thead>
  <tbody>
    <tr style="background:#fef2f2;"><td rowspan="2" style="padding:10px;border:1px solid #fecaca;font-weight:bold;">Esenyurt</td><td style="padding:10px;border:1px solid #fecaca;">KOZA MAHALLESİ</td></tr>
    <tr style="background:#fef2f2;"><td style="padding:10px;border:1px solid #fecaca;">ZAFER MAHALLESİ</td></tr>
    <tr><td style="padding:10px;border:1px solid #fecaca;font-weight:bold;">Avcılar</td><td style="padding:10px;border:1px solid #fecaca;">ÜNİVERSİTE MAHALLESİ</td></tr>
    <tr style="background:#fef2f2;"><td style="padding:10px;border:1px solid #fecaca;font-weight:bold;">Küçükçekmece</td><td style="padding:10px;border:1px solid #fecaca;">BEŞYOL MAHALLESİ</td></tr>
    <tr><td style="padding:10px;border:1px solid #fecaca;font-weight:bold;">Fatih</td><td style="padding:10px;border:1px solid #fecaca;">MOLLA HÜSREV MAHALLESİ</td></tr>
  </tbody>
</table>

<p style="background:#dcfce7;border-right:4px solid #16a34a;padding:14px 18px;margin:14px 0;border-radius:8px;color:#14532d;line-height:1.7;">
  وفق النصّ الرسمي الصادر عن مديرية الهجرة في إسطنبول، <strong>كلّ الأحياء الأخرى في الولاية مفتوحة لتسجيل الأجانب</strong>، ما عدا الأحياء الخمسة المُدرَجة أعلاه.
</p>

<h2>ماذا يعني هذا عملياً للسوريين في إسطنبول</h2>

<p>إن كنت تعيش في إسطنبول وحيّك ليس ضمن الأحياء الخمسة أعلاه، فإنّ مديرية الهجرة باتت تقبل تسجيل عنوانك للنفوس بشكل طبيعي. هذا يفتح الباب أمام:</p>

<ul style="line-height:2;color:#334155;">
  <li>تسجيل عنوان جديد في النفوس بعد الانتقال (Yerleşim Yeri Belgesi)</li>
  <li>تجديد الإقامة أو الكيمليك على العنوان الحالي بدون الحاجة لانتقال</li>
  <li>توثيق العقد الإيجاري لأغراض رسمية وضريبية</li>
  <li>إصدار وثائق رسمية تتطلّب عنواناً مسجّلاً (e-Devlet، فواتير، اشتراكات)</li>
  <li>طلب لمّ شمل عائلي على العنوان المسجّل</li>
</ul>

<h2>كيف نصل إلى هذا الرقم: ٥٤ → ٥</h2>

<p>في قائمة ٢٠٢٢ التي صدرت عن المديرية العامة لإدارة الهجرة، تضمّنت إسطنبول <strong>٥٤ حياً مغلقاً</strong> موزّعة على ١٥ قضاءً من بينها Avcılar وBahçelievler وBaşakşehir وBeşiktaş وBeylikdüzü وBeyoğlu وEsenyurt وFatih وKüçükçekmece وSarıyer وŞile وŞişli وTuzla وÜmraniye وZeytinburnu. كانت تلك القائمة الأكثر تأثيراً على الجالية السورية في إسطنبول التي تتجاوز ٥٠٠ ألف نسمة.</p>

<p>التحديث الصادر اليوم يُسقط ٤٩ حياً من تلك القائمة دفعةً واحدة، ويُبقي خمسة فقط ضمن الحظر — وهي الأحياء التي ما زالت كثافة الأجانب فيها فوق عتبة ٢٠٪ التي حدّدتها وزارة الداخلية التركية.</p>

<h2>السياق: موجة فتح وطنية</h2>

<p>القرار في إسطنبول يأتي ضمن موجة وطنية بدأت في ٦ يونيو ٢٠٢٦ حين أعلن اتحاد منظمات المجتمع المدني للتنمية (UCSO) أنّ السلطات التركية خفّضت قائمة الأحياء المغلقة في عموم تركيا بنسبة تقارب ٨٠٪. سبقت إسطنبول كلّ من شانلي أورفا (٢٦ حياً متبقّياً) وقونيا (٤ أحياء) وكلس (قائمتها لم تصدر بعد). ولكنّ إسطنبول تُسجّل اليوم <strong>أعلى نسبة فتح إقليمي</strong> على مستوى الجمهورية: <strong>٩١٪</strong>.</p>

<p>سبب الفتح الواسع في إسطنبول، وفق ما يُشير إليه التحليل الميداني، هو موجات العودة الطوعية الكبيرة من المدينة إلى سوريا خلال السنتين الماضيتين، التي خفّضت نسبة الأجانب المسجّلين في معظم الأحياء دون عتبة الـ٢٠٪.</p>

<h2>المرجعية الإدارية</h2>

<p>القائمة الرسمية صدرت عن مديرية الهجرة في ولاية إسطنبول (İstanbul İl Göç İdaresi Müdürlüğü). مدرّجات النفوس (Nüfus Müdürlüğü) والمختار (Muhtar) في كلّ حي هم المراجع الإدارية المحلّية للتحقّق من حالة العنوان والحصول على وثيقة Yerleşim Yeri Belgesi قبل التسجيل في النفوس.</p>

<p>يُنصح الزوار بمراجعة موقع <a href="https://istanbul.goc.gov.tr" target="_blank" rel="noopener noreferrer" style="color:#0369a1;font-weight:bold;">istanbul.goc.gov.tr</a> للاطّلاع على الإعلان الكامل، أو الاتّصال بالخطّ الموحّد للأجانب <strong>١٥٧</strong> (مجاني، يعمل بالعربية).</p>

<h2>كيف تستفيد فوراً</h2>

<ol style="line-height:2;color:#334155;">
  <li>تأكّد أنّ اسم حيّك بالتركية ليس ضمن الأحياء الخمسة المُدرَجة أعلاه.</li>
  <li>اذهب لمختار الحيّ (Muhtar) واطلب وثيقة Yerleşim Yeri Belgesi.</li>
  <li>توجّه إلى مديرية النفوس (Nüfus Müdürlüğü) لتسجيل العنوان رسمياً.</li>
  <li>حدّث ملفّك في e-İkamet (للأجانب) أو e-Devlet (للحاصلين على جنسية).</li>
  <li>تذكّر أنّ القانون ٥٤٩٠ يُلزم بتسجيل العنوان خلال ٢٠ يوماً من الانتقال.</li>
</ol>

<p style="background:#fef3c7;border-right:4px solid #f59e0b;padding:14px 18px;margin:14px 0;border-radius:8px;color:#78350f;">
  <strong>⚠️ تذكير مهمّ:</strong> الأحياء الخمسة المُدرَجة لا تزال مغلقة لتسجيل عناوين الأجانب الجديدة. ولكنّ السوريين المسجّلين فعلاً في تلك الأحياء قبل قرار الإغلاق يبقون مسجّلين — القاعدة تخصّ التسجيل الجديد فقط.
</p>
`,
    documents: ['اسم الحيّ بالتركية', 'كيمليك أو إقامة سارية', 'عقد إيجار مصدّق'],
    steps: [
        'مديرية الهجرة إسطنبول — istanbul.goc.gov.tr',
        'مختار الحيّ — المرجع الإداري المحلّي',
        'مديرية النفوس (Nüfus Müdürlüğü) — تسجيل العنوان',
        'بوّابة e-İkamet — تحديث الملف الإلكتروني',
    ],
    tips: [
        'تأكّد من اسم الحيّ بالتركية قبل الانتقال',
        'المختار قادر يعطيك الإجابة النهائية حول حالة الحيّ',
        'الأحياء الخمسة المتبقّية تستثني تسجيل الأجانب الجدد فقط',
    ],
    fees: 'تسجيل العنوان مجاني في النفوس. رسم بطاقة الإقامة المعمول به في ٢٠٢٦ هو ٩٦٤ ليرة تركية للجميع.',
    warning: 'القائمة الصادرة في ٧ يونيو ٢٠٢٦ تنسخ القوائم السابقة لإسطنبول. لا تعتمد على قائمة ٢٠٢٢. المختار في الحيّ هو المرجع الإداري الأخير لأيّ شكّ.',
    source: 'مديرية الهجرة في ولاية إسطنبول (İstanbul İl Göç İdaresi Müdürlüğü) — قائمة رسمية صادرة في ٧ يونيو ٢٠٢٦.',
    last_update: TODAY,
    published_at: TODAY,
    image: null,
    active: true,
    status: 'approved',
    seo_title: 'عاجل: إسطنبول ترفع الحظر عن 49 حياً — 5 فقط بقيت مغلقة (7 يونيو 2026)',
    seo_description: 'مديرية الهجرة في إسطنبول تصدر قائمتها الرسمية: 5 أحياء فقط بقيت مغلقة لتسجيل الأجانب من أصل 54 سابقاً (تخفيض 91٪). KOZA وZAFER في Esenyurt، ÜNİVERSİTE في Avcılar، BEŞYOL في Küçükçekmece، MOLLA HÜSREV في Fatih.',
    seo_keywords: [
        'إسطنبول أحياء مغلقة 2026',
        'İstanbul kapalı mahalleler 2026',
        'إسطنبول قائمة الأحياء المفتوحة',
        'تسجيل نفوس إسطنبول سوريين',
        'Esenyurt KOZA ZAFER kapalı',
        'Avcılar Üniversite kapalı',
        'Küçükçekmece Beşyol',
        'Fatih Molla Hüsrev',
        'فتح أحياء إسطنبول للأجانب',
        'مديرية الهجرة إسطنبول',
        'tsجيل عنوان إسطنبول',
        'kimlik kayıt istanbul',
        '91% lift Istanbul foreigners',
    ],
    tags: ['إسطنبول', 'أحياء مغلقة', 'إقامة', 'كيمليك', 'سوريين إسطنبول', '2026', 'مديرية الهجرة'],
};

(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📰 Publishing Istanbul ban lift article');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const { data, error } = await supabase
        .from('articles')
        .upsert(article, { onConflict: 'id' })
        .select('id, slug, title, status, active, published_at');

    if (error) {
        console.error(`❌ FAILED:`, error.message);
        process.exit(1);
    }

    console.log(`✅ Published`);
    console.log(`   slug: ${data?.[0]?.slug}`);
    console.log(`   length: ${article.details.length} chars`);
    console.log(`\n🔗 https://dalilarabtr.com/article/${article.slug}`);
    process.exit(0);
})();
