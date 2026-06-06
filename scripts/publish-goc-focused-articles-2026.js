/**
 * Decompose the goc-idaresi-updates-2026 mega-article into 7 focused,
 * audience-specific micro-articles. Each one targets a single reader profile
 * and a single takeaway — Urfa residents get the Urfa list, Konya residents
 * get Konya, business owners in Kilis get the trade permit story, etc.
 *
 * The original aggregator stays alive but gets rewritten as a lightweight
 * hub that points to the focused articles. This way:
 *   - Sharing on WhatsApp/Telegram → recipients get exactly what they need
 *   - SEO → each focused article ranks for its own long-tail query
 *   - Returning readers → they can find the specific update without scrolling
 *
 * Why this matters: a Syrian in Urfa searching for "أحياء مغلقة أورفا"
 * doesn't want to read about Kilis trade permits and Konya neighborhoods
 * and family invitations via Jordan. They want THEIR answer, fast, on
 * mobile.
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.pulled', override: true });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TODAY = '2026-06-06';
const HUB_URL = '/article/goc-idaresi-updates-2026';

// ─────────────────────────────────────────────────────────────────────────
// 1) URFA-SPECIFIC — closed neighborhoods list
// ─────────────────────────────────────────────────────────────────────────
const URFA = {
    id: 'urfa-closed-neighborhoods-list-2026',
    slug: 'urfa-closed-neighborhoods-list-2026',
    title: 'أورفا ٦ يونيو ٢٠٢٦: ٢٦ حياً فقط بقي مغلقاً للأجانب — القائمة الرسمية الكاملة',
    category: 'الإقامة والكيمليك',
    intro: 'صدرت اليوم القائمة الرسمية من مديرية الهجرة في شانلي أورفا بأسماء الأحياء التي ما تزال مغلقة لتسجيل إقامة الأجانب. الأرقام مذهلة: من ١٧٠ حياً مغلقاً في قائمة ٢٠٢٢ إلى <strong>٢٦ حياً فقط</strong> اليوم — تخفيض ٨٥٪. سبعة أقضية كاملة صارت مفتوحة بنسبة ١٠٠٪. هذا الدليل يحتوي القائمة كاملة بأسماء الأحياء وقضاءاتها، ويوضّح ما الذي تغيّر، وأين تستطيع تسجيل عنوانك اليوم في أورفا.',
    details: `
<div style="background:linear-gradient(135deg,#dcfce7,#bbf7d0);border:2px solid #16a34a;padding:18px;margin:16px 0;border-radius:12px;">
  <p style="margin:0;font-weight:bold;color:#14532d;font-size:17px;">🎉 الأرقام التي تهمّك:</p>
  <ul style="margin:10px 0 0;padding-right:24px;color:#166534;line-height:1.9;">
    <li>قائمة ٢٠٢٢ القديمة: <strong>١٧٠ حياً مغلقاً</strong> في ١٣ قضاءً</li>
    <li>القائمة اليوم: <strong>٢٦ حياً فقط</strong> في ٦ أقضية</li>
    <li>التخفيض: <strong>٨٥٪</strong> ✅</li>
    <li>الأقضية المفتوحة كلّياً الآن: <strong>٧ أقضية</strong></li>
  </ul>
</div>

<h2>📋 القائمة الكاملة — ٢٦ حياً مغلقاً</h2>

<table style="width:100%;border-collapse:collapse;font-size:14px;background:white;margin:16px 0;">
  <thead><tr style="background:#7f1d1d;color:white;">
    <th style="padding:10px;border:1px solid #450a0a;">القضاء</th>
    <th style="padding:10px;border:1px solid #450a0a;">الحي المغلق</th>
  </tr></thead>
  <tbody>
    <tr style="background:#fef2f2;"><td rowspan="7" style="padding:8px;border:1px solid #fecaca;font-weight:bold;">Akçakale (٧)</td><td style="padding:8px;border:1px solid #fecaca;">YENİ</td></tr>
    <tr style="background:#fef2f2;"><td style="padding:8px;border:1px solid #fecaca;">FEVZİ ÇAKMAK</td></tr>
    <tr style="background:#fef2f2;"><td style="padding:8px;border:1px solid #fecaca;">ADNAN MENDERES</td></tr>
    <tr style="background:#fef2f2;"><td style="padding:8px;border:1px solid #fecaca;">SÜLEYMANŞAH</td></tr>
    <tr style="background:#fef2f2;"><td style="padding:8px;border:1px solid #fecaca;">ATATÜRK</td></tr>
    <tr style="background:#fef2f2;"><td style="padding:8px;border:1px solid #fecaca;">GÜLVEREN</td></tr>
    <tr style="background:#fef2f2;"><td style="padding:8px;border:1px solid #fecaca;">GÜNDAŞ</td></tr>
    <tr><td style="padding:8px;border:1px solid #fecaca;font-weight:bold;">Birecik (١)</td><td style="padding:8px;border:1px solid #fecaca;">MERKEZ</td></tr>
    <tr style="background:#fef2f2;"><td rowspan="4" style="padding:8px;border:1px solid #fecaca;font-weight:bold;">Eyyübiye (٤)</td><td style="padding:8px;border:1px solid #fecaca;">EYÜPKENT</td></tr>
    <tr style="background:#fef2f2;"><td style="padding:8px;border:1px solid #fecaca;">KARAKOYUNLU</td></tr>
    <tr style="background:#fef2f2;"><td style="padding:8px;border:1px solid #fecaca;">KADIOĞLU</td></tr>
    <tr style="background:#fef2f2;"><td style="padding:8px;border:1px solid #fecaca;">TÜRKMEYDANI</td></tr>
    <tr><td rowspan="9" style="padding:8px;border:1px solid #fecaca;font-weight:bold;">Haliliye (٩)</td><td style="padding:8px;border:1px solid #fecaca;">BAĞLARBAŞI</td></tr>
    <tr><td style="padding:8px;border:1px solid #fecaca;">HIZMALI</td></tr>
    <tr><td style="padding:8px;border:1px solid #fecaca;">MİMAR SİNAN</td></tr>
    <tr><td style="padding:8px;border:1px solid #fecaca;">SULTAN FATİH</td></tr>
    <tr><td style="padding:8px;border:1px solid #fecaca;">ATATÜRK</td></tr>
    <tr><td style="padding:8px;border:1px solid #fecaca;">KAMBERİYE</td></tr>
    <tr><td style="padding:8px;border:1px solid #fecaca;">BAHÇELİEVLER</td></tr>
    <tr><td style="padding:8px;border:1px solid #fecaca;">ŞEHİTLİK</td></tr>
    <tr><td style="padding:8px;border:1px solid #fecaca;">CENGİZ TOPEL</td></tr>
    <tr style="background:#fef2f2;"><td style="padding:8px;border:1px solid #fecaca;font-weight:bold;">Harran (١)</td><td style="padding:8px;border:1px solid #fecaca;">SELAHADDİN EYYUBİ</td></tr>
    <tr><td rowspan="4" style="padding:8px;border:1px solid #fecaca;font-weight:bold;">Suruç (٤)</td><td style="padding:8px;border:1px solid #fecaca;">HÜRRİYET</td></tr>
    <tr><td style="padding:8px;border:1px solid #fecaca;">YILDIRIM</td></tr>
    <tr><td style="padding:8px;border:1px solid #fecaca;">DİKİLİ</td></tr>
    <tr><td style="padding:8px;border:1px solid #fecaca;">AYDIN</td></tr>
  </tbody>
</table>

<div style="background:#dcfce7;border-right:4px solid #16a34a;padding:14px 18px;margin:14px 0;border-radius:8px;color:#14532d;line-height:1.8;">
  <strong>النصّ الرسمي على القائمة:</strong>
  <em style="display:block;margin-top:4px;">«ما عدا الأحياء المذكورة أعلاه، كلّ الأحياء الأخرى في الولاية مفتوحة للإقامة.»</em>
</div>

<h2>🟢 الأقضية المفتوحة كلّياً (٧ أقضية)</h2>
<p>هذه الأقضية لم يبقَ فيها أيّ حي مغلق — تستطيع تسجيل عنوانك في أيّ حيّ منها:</p>
<ul style="line-height:2;color:#334155;">
  <li><strong>Viranşehir</strong> — كان فيها ٢٠ حياً مغلقاً، الآن ٠ ✨ تحوّل كامل</li>
  <li><strong>Karaköprü</strong> — الخيار الأمثل للسوريين، حديث ومرافق ممتازة</li>
  <li><strong>Ceylanpınar</strong></li>
  <li><strong>Bozova</strong></li>
  <li><strong>Siverek</strong></li>
  <li><strong>Halfeti</strong></li>
  <li><strong>Hilvan</strong></li>
</ul>

<h2>🧭 ماذا تفعل الآن؟</h2>
<ol style="line-height:2;color:#334155;">
  <li>تحقّق من اسم حيّك بالتركية كاملاً.</li>
  <li>قارنه بالقائمة أعلاه. لو ظهر — انتظر لائحة الاستثناءات. لو لم يظهر — اذهب للنفوس وسجّل!</li>
  <li>اذهب لمختار الحيّ للتأكيد المزدوج قبل توقيع أيّ عقد إيجار.</li>
  <li>سجّل العنوان في النفوس خلال ٢٠ يوماً من الانتقال (القانون ٥٤٩٠).</li>
</ol>

<div style="background:#fef3c7;border-right:4px solid #f59e0b;padding:14px 18px;margin:14px 0;border-radius:8px;color:#78350f;line-height:1.8;">
  <strong>⚠️ مهمّ:</strong> قائمة ٢٠٢٢ القديمة تجاوزها الواقع. لا تعتمد عليها بعد اليوم. ولا على شائعات السماسرة — المختار وحده هو المرجع الإداري.
</div>

<p style="background:#eff6ff;padding:14px;border-radius:10px;margin-top:20px;color:#1e3a8a;">
  📰 <strong>هذه القائمة جزء من قرار وطني</strong> بإعادة فتح ٨٠٪ من الأحياء المغلقة في عموم تركيا.
  للقصّة الكاملة + قوائم الولايات الأخرى، راجع
  <a href="${HUB_URL}" style="color:#1d4ed8;font-weight:bold;">الدليل الشامل لتحديثات إدارة الهجرة ٢٠٢٦</a>.
</p>
`,
    documents: ['اسم الحيّ بالتركية', 'كيمليك أو إقامة سارية', 'الذهاب للمختار قبل التوقيع'],
    steps: [
        { title: '1️⃣ تحقّق من اسم حيّك', description: 'قارنه بالقائمة الرسمية أعلاه' },
        { title: '2️⃣ اسأل المختار', description: 'الجواب الإداري النهائي عنده — لا تعتمد على شائعات' },
        { title: '3️⃣ سجّل العنوان في النفوس', description: 'خلال ٢٠ يوماً من الانتقال (القانون ٥٤٩٠)' },
        { title: '4️⃣ حدّث e-İkamet', description: 'بعد التسجيل في النفوس' },
    ],
    tips: [
        'Karaköprü الأفضل للسوريين — حديث، صفر إغلاق',
        'لا تعتمد على قائمة ٢٠٢٢ القديمة',
        'الأسعار سترتفع في الأحياء المُعاد فتحها — تحرّك بسرعة لكن قارن',
    ],
    fees: 'تسجيل العنوان مجاني. وثيقة Yerleşim Yeri Belgesi من المختار مجانية.',
    warning: 'القائمة الرسمية صدرت اليوم ٦/٦/٢٠٢٦. لائحة الاستثناءات للأحياء المتبقّية لم تصدر بعد. المختار هو المرجع.',
    source: 'مديرية الهجرة شانلي أورفا — صورة قائمة رسمية ٦ يونيو ٢٠٢٦.',
    last_update: TODAY,
    published_at: TODAY,
    image: null,
    active: true,
    status: 'approved',
    seo_title: 'القائمة الرسمية لأورفا 6 يونيو 2026: 26 حياً مغلقاً (تخفيض 85%)',
    seo_description: 'القائمة الرسمية من مديرية الهجرة في شانلي أورفا: 26 حياً بقي مغلقاً من أصل 170 = تخفيض 85%. 7 أقضية مفتوحة كلياً (Viranşehir، Karaköprü، Ceylanpınar، Bozova، Siverek، Halfeti، Hilvan). القائمة الكاملة بأسماء الأحياء.',
    seo_keywords: ['أحياء أورفا المغلقة 2026','Şanlıurfa kapalı mahalle','Akçakale Eyyübiye Haliliye','Viranşehir Karaköprü مفتوح','قائمة الهجرة أورفا'],
    tags: ['أورفا', 'أحياء مغلقة', 'إقامة', '2026'],
};

// ─────────────────────────────────────────────────────────────────────────
// 2) KONYA-SPECIFIC
// ─────────────────────────────────────────────────────────────────────────
const KONYA = {
    id: 'konya-closed-neighborhoods-list-2026',
    slug: 'konya-closed-neighborhoods-list-2026',
    title: 'قونيا ٢٠٢٦: ٤ أحياء فقط بقيت مغلقة للأجانب — القائمة الكاملة',
    category: 'الإقامة والكيمليك',
    intro: 'وفق آخر تحديث رسمي، تخفّضت الأحياء المغلقة لتسجيل إقامة الأجانب في ولاية قونيا (Konya) إلى <strong>٤ أحياء فقط</strong> من أصل ١٨ في قائمة ٢٠٢٢ — تخفيض ٧٨٪. كلّ الأحياء الأخرى مفتوحة. هذا الدليل يوضّح بدقّة أيّ ٤ أحياء بقيت مغلقة وفي أيّ قضاء.',
    details: `
<div style="background:linear-gradient(135deg,#fee2e2,#fecaca);border:2px solid #dc2626;padding:18px;margin:16px 0;border-radius:12px;">
  <p style="margin:0;font-weight:bold;color:#7f1d1d;font-size:17px;">🔴 الأحياء الـ٤ المتبقّية مغلقة:</p>
  <ul style="margin:12px 0 0;padding-right:24px;color:#991b1b;line-height:2;font-size:16px;">
    <li><strong>قضاء Meram:</strong> Sahibata Mahallesi</li>
    <li><strong>قضاء Karatay:</strong> Şemsitebrizi Mahallesi</li>
    <li><strong>قضاء Selçuklu:</strong> İhsaniye Mahallesi</li>
    <li><strong>قضاء Selçuklu:</strong> Ferhuniye Mahallesi</li>
  </ul>
</div>

<h2>✅ ماذا يعني هذا عملياً؟</h2>
<ul style="line-height:2;color:#334155;">
  <li>إن كان منزلك في <strong>أيّ حي غير الأربعة أعلاه</strong> — تستطيع تسجيل عنوانك اليوم.</li>
  <li>كلّ أقضية قونيا الأخرى (Akşehir، Ereğli، Beyşehir...) مفتوحة بالكامل.</li>
  <li>الأحياء الأربعة المغلقة قد تُفتح ضمن لائحة الاستثناءات القادمة من Göç İdaresi.</li>
</ul>

<h2>🧭 خطوات التسجيل بعد قرار اليوم</h2>
<ol style="line-height:2;color:#334155;">
  <li>اعرف اسم حيّك بالتركية (اسأل صاحب البيت أو الوسيط).</li>
  <li>قارنه بالقائمة أعلاه — لو ظهر، انتظر لائحة الاستثناءات.</li>
  <li>لو لم يظهر، اذهب لمختار الحيّ واطلب وثيقة Yerleşim Yeri Belgesi.</li>
  <li>سجّل العنوان في Nüfus Müdürlüğü خلال ٢٠ يوماً.</li>
  <li>حدّث ملفّك في e-İkamet.</li>
</ol>

<p style="background:#eff6ff;padding:14px;border-radius:10px;margin-top:20px;color:#1e3a8a;">
  📰 قرار اليوم جزء من تخفيض وطني بنسبة ٨٠٪ في الأحياء المغلقة.
  للسياق الكامل والقوائم الأخرى:
  <a href="${HUB_URL}" style="color:#1d4ed8;font-weight:bold;">الدليل الشامل لتحديثات إدارة الهجرة</a>.
</p>
`,
    documents: ['اسم الحي بالتركية', 'كيمليك ساري', 'وثيقة Yerleşim Yeri Belgesi من المختار'],
    steps: [
        { title: '1️⃣ تحقّق من حيّك', description: 'قارن بالقائمة أعلاه' },
        { title: '2️⃣ اسأل المختار', description: 'الجواب الإداري النهائي' },
        { title: '3️⃣ سجّل في النفوس', description: 'خلال ٢٠ يوماً' },
    ],
    tips: ['أقضية قونيا خارج Meram/Karatay/Selçuklu كلّها مفتوحة', 'احتفظ بصورة القرار الرسمي للمراجعة'],
    fees: 'مجاني — رسم البطاقة فقط ٩٦٤ ليرة عند التجديد.',
    warning: 'القائمة الرسمية اليوم. لائحة الاستثناءات قادمة. المختار هو المرجع.',
    source: 'إعلان UCSO + مديرية الهجرة قونيا — ٦ يونيو ٢٠٢٦.',
    last_update: TODAY,
    published_at: TODAY,
    image: null,
    active: true,
    status: 'approved',
    seo_title: 'قونيا 2026: 4 أحياء فقط مغلقة — القائمة الكاملة (Sahibata، Şemsitebrizi، İhsaniye، Ferhuniye)',
    seo_description: 'الأحياء الـ4 المتبقّية مغلقة لتسجيل الأجانب في ولاية قونيا 2026: Sahibata (Meram) + Şemsitebrizi (Karatay) + İhsaniye + Ferhuniye (Selçuklu). كلّ الأحياء الأخرى مفتوحة. تخفيض 78% عن قائمة 2022.',
    seo_keywords: ['قونيا أحياء مغلقة 2026','Konya kapalı mahalleler','Sahibata Meram','Şemsitebrizi Karatay','İhsaniye Ferhuniye Selçuklu'],
    tags: ['قونيا', 'أحياء مغلقة', 'إقامة', '2026'],
};

// ─────────────────────────────────────────────────────────────────────────
// 3) KILIS TRADE PERMIT
// ─────────────────────────────────────────────────────────────────────────
const KILIS_TRADE = {
    id: 'kilis-trade-permit-6-months-2026',
    slug: 'kilis-trade-permit-6-months-2026',
    title: 'كلس: تمديد الإذن التجاري إلى سوريا من ٣ إلى ٦ أشهر — يونيو ٢٠٢٦',
    category: 'العمل والإذن',
    intro: 'في خبر مهمّ لرجال الأعمال السوريين الذين يديرون نشاطاً تجارياً بين تركيا وسوريا، مدّدت ولاية كلس مدّة <strong>الإذن التجاري إلى سوريا</strong> من ٣ أشهر إلى <strong>٦ أشهر</strong>. أيّ تقديم جديد على الإذن التجاري الآن في كلس يحصل على ٦ أشهر بدلاً من ٣ — توفير كبير في الوقت والإجراءات.',
    details: `
<div style="background:#dcfce7;border-right:4px solid #16a34a;padding:16px 20px;margin:16px 0;border-radius:8px;color:#14532d;line-height:1.8;">
  <p style="margin:0;font-weight:bold;font-size:16px;">📢 الخبر باختصار:</p>
  <p style="margin:8px 0 0;">مدّة الإذن التجاري الجديد: <strong>٦ أشهر</strong> (بدلاً من ٣ أشهر سابقاً).<br>
  المكان: ولاية كلس (Kilis).<br>
  المستفيدون: السوريون أصحاب نشاط تجاري بين تركيا وسوريا.</p>
</div>

<h2>ما هو الإذن التجاري؟</h2>
<p>وثيقة رسمية تمنحها السلطات التركية لرجال الأعمال السوريين بإقامة أو كيمليك يسمح لهم بالعبور لسوريا والعودة لمتابعة أعمالهم التجارية (تجارة، عقارات، استيراد/تصدير). تختلف عن السفر الترفيهي.</p>

<h2>🧭 خطوات الحصول على الإذن (التقدير الحالي)</h2>
<ol style="line-height:2;color:#334155;">
  <li>التوجّه إلى إدارة الهجرة في كلس (Kilis İl Göç İdaresi).</li>
  <li>تقديم: كيمليك/إقامة سارية + جواز سفر + سجل تجاري ساري.</li>
  <li>تقديم نموذج طلب الإذن التجاري.</li>
  <li>تأكيد طبيعة النشاط التجاري وتوثيق ضرورة العبور.</li>
  <li>استلام الإذن صالح <strong>٦ أشهر</strong>.</li>
</ol>

<div style="background:#fef3c7;border-right:4px solid #f59e0b;padding:14px 18px;margin:14px 0;border-radius:8px;color:#78350f;line-height:1.8;">
  <strong>⚠️ تنبيه:</strong> الإذن التجاري <strong>غير</strong> الإقامة العادية أو السفر السياحي. لا يُعفى من شرط العودة. تأكّد أنّ نشاطك التجاري موثّق رسمياً قبل التقديم.
</div>

<h2>📞 جهات للتأكّد</h2>
<ul style="line-height:2;color:#334155;">
  <li>إدارة الهجرة كلس: <strong>kilis.goc.gov.tr</strong></li>
  <li>الخط الموحّد للأجانب: <strong>١٥٧</strong> (بالعربية)</li>
</ul>

<p style="background:#eff6ff;padding:14px;border-radius:10px;margin-top:20px;color:#1e3a8a;">
  📰 لكلّ تحديثات إدارة الهجرة هذا الأسبوع (أحياء مفتوحة + رسوم + معابر):
  <a href="${HUB_URL}" style="color:#1d4ed8;font-weight:bold;">الدليل الشامل</a>.
</p>
`,
    documents: ['كيمليك أو إقامة سارية', 'جواز سفر ساري', 'سجل تجاري ساري', 'نموذج طلب الإذن'],
    steps: [
        { title: '1️⃣ راجع إدارة الهجرة كلس', description: 'Kilis İl Göç İdaresi' },
        { title: '2️⃣ قدّم وثائق نشاطك التجاري', description: 'سجل تجاري + إثبات النشاط' },
        { title: '3️⃣ استلم الإذن صالحاً ٦ أشهر', description: 'بدلاً من ٣' },
    ],
    tips: ['وثّق نشاطك التجاري بدقّة قبل التقديم', 'احتفظ بنسخة من الإذن دائماً معك عند العبور'],
    fees: 'يحدّدها مكتب الهجرة في كلس وقت التقديم.',
    warning: 'الإذن التجاري مرتبط بنشاط موثّق. لا تستخدمه لأغراض غير تجارية.',
    source: 'اتحاد منظمات المجتمع المدني للتنمية (UCSO) — ولاية كلس، يونيو ٢٠٢٦.',
    last_update: TODAY,
    published_at: TODAY,
    image: null,
    active: true,
    status: 'approved',
    seo_title: 'كلس: الإذن التجاري إلى سوريا 6 أشهر بدلاً من 3 — يونيو 2026',
    seo_description: 'ولاية كلس مدّدت مدّة الإذن التجاري للسوريين إلى 6 أشهر بدلاً من 3 أشهر. تسهيل كبير لرجال الأعمال السوريين بين تركيا وسوريا. الخطوات + الوثائق المطلوبة.',
    seo_keywords: ['كلس إذن تجاري','Kilis ticaret izni','تمديد 6 أشهر','إذن سوريين أعمال','رجال أعمال سوريين كلس'],
    tags: ['كلس', 'إذن تجاري', 'تجارة', '2026'],
};

// ─────────────────────────────────────────────────────────────────────────
// 4) FAMILY INVITATION ROUTE CHANGE
// ─────────────────────────────────────────────────────────────────────────
const FAMILY_INVITE = {
    id: 'family-invitation-jordan-only-2026',
    slug: 'family-invitation-jordan-only-2026',
    title: 'دعوة الأقارب إلى تركيا: لبنان متوقّفة، الأردن فقط — مع شرط البقاء',
    category: 'الإقامة والكيمليك',
    intro: 'تغيّر مسار دعوة الأقارب إلى تركيا. الحكومة التركية <strong>أوقفت</strong> الدعوات عبر <strong>لبنان</strong> حتّى إشعار آخر، وأصبحت متاحة <strong>فقط عبر الأردن</strong>، مع شرط جديد: بقاء الشخص المدعوّ على الأراضي الأردنية حتّى صدور النتيجة (٢٠-٣٠ يوماً). هذا الدليل يوضّح من يخصّه التغيير وكيف يتعامل معه.',
    details: `
<h2>📌 ملخّص التغيير</h2>
<div style="background:#fef3c7;border-right:4px solid #f59e0b;padding:16px 20px;margin:16px 0;border-radius:8px;color:#78350f;line-height:1.9;">
  <ul style="margin:0;padding-right:24px;">
    <li><strong>عبر لبنان:</strong> ❌ متوقّفة حتى إشعار آخر</li>
    <li><strong>عبر الأردن:</strong> ✅ المسار الوحيد المتاح حالياً</li>
    <li><strong>شرط جديد:</strong> الشخص المدعوّ يبقى في الأردن حتّى تصدر النتيجة</li>
    <li><strong>مدّة الانتظار:</strong> من ٢٠ يوماً إلى شهر</li>
  </ul>
</div>

<h2>👤 من يخصّه هذا التغيير؟</h2>
<ul style="line-height:2;color:#334155;">
  <li><strong>مزدوجو الجنسية</strong> (سوريون + جنسية ثانية تركية/أوروبية) يدعون أقاربهم.</li>
  <li><strong>أصحاب الإقامات السارية</strong> في تركيا يستقدمون أفراد عائلتهم.</li>
  <li>كلّ من كان يخطّط لاستخدام مسار لبنان — يجب التحوّل لمسار الأردن.</li>
</ul>

<h2>🧭 خطوات الدعوة عبر الأردن</h2>
<ol style="line-height:2;color:#334155;">
  <li>تأكّد أنّك صاحب الجنسية المزدوجة أو إقامة تركية سارية.</li>
  <li>اطلب من القريب الذي تريد دعوته التوجّه إلى <strong>الأردن</strong> (وليس لبنان).</li>
  <li>قدّم طلب الدعوة الرسمي عبر القنوات المخصّصة.</li>
  <li>القريب <strong>يبقى في الأردن</strong> طوال فترة معالجة الطلب (٢٠-٣٠ يوماً).</li>
  <li>عند صدور الموافقة، يدخل تركيا من الأردن مباشرةً.</li>
</ol>

<div style="background:#fee2e2;border-right:4px solid #dc2626;padding:14px 18px;margin:14px 0;border-radius:8px;color:#7f1d1d;line-height:1.8;">
  <strong>⚠️ تنبيه عملي:</strong> القريب يحتاج تكاليف الإقامة في الأردن خلال فترة الانتظار (٢٠-٣٠ يوماً). خطّط ميزانياً قبل التحرّك. كذلك تأكّد من <strong>سريان جواز سفره</strong> وأهلية الدخول للأردن من بلده الأصلي.
</div>

<h2>📞 للتأكّد قبل البدء</h2>
<ul style="line-height:2;color:#334155;">
  <li>اتحاد منظمات المجتمع المدني للتنمية (UCSO): <strong>facebook.com/ucso.sy</strong></li>
  <li>السفارة التركية في عمّان لمعرفة آخر إجراءات الدعوة.</li>
  <li>الخط الموحّد للأجانب في تركيا: <strong>١٥٧</strong>.</li>
</ul>

<p style="background:#eff6ff;padding:14px;border-radius:10px;margin-top:20px;color:#1e3a8a;">
  📰 الخبر جزء من حزمة تحديثات وزارة الداخلية التركية في يونيو ٢٠٢٦.
  <a href="${HUB_URL}" style="color:#1d4ed8;font-weight:bold;">راجع الدليل الشامل</a> لباقي التحديثات.
</p>
`,
    documents: ['كيمليك أو إقامة سارية للداعي', 'جواز سفر ساري للمدعوّ', 'صلاحية دخول الأردن للمدعوّ'],
    steps: [
        { title: '1️⃣ تأكّد من أهليّتك كداعٍ', description: 'مزدوج جنسية أو صاحب إقامة سارية' },
        { title: '2️⃣ المدعوّ يتوجّه للأردن', description: 'لبنان لم تعد خياراً' },
        { title: '3️⃣ تقديم طلب الدعوة', description: 'عبر القنوات المخصّصة' },
        { title: '4️⃣ البقاء في الأردن طوال المعالجة', description: '٢٠-٣٠ يوماً' },
    ],
    tips: ['خطّط ميزانياً لتكاليف الإقامة في الأردن', 'لا تجرّب مسار لبنان حالياً', 'تأكّد من أهلية المدعوّ لدخول الأردن'],
    fees: 'تختلف حسب نوع الدعوة. تكاليف إقامة الأردن (٢٠-٣٠ يوماً) على عاتق المدعوّ.',
    warning: 'مسار لبنان متوقّف حتى إشعار آخر. لا تعتمد على معلومات قديمة. تواصل مع UCSO أو ١٥٧ للتأكيد قبل التحرّك.',
    source: 'اتحاد منظمات المجتمع المدني للتنمية (UCSO) — تعليمات وزارة الداخلية التركية، يونيو ٢٠٢٦.',
    last_update: TODAY,
    published_at: TODAY,
    image: null,
    active: true,
    status: 'approved',
    seo_title: 'دعوة الأقارب إلى تركيا 2026: الأردن فقط، لبنان متوقّفة',
    seo_description: 'تغيّر مسار دعوة الأقارب إلى تركيا: لبنان متوقّفة، الأردن المسار الوحيد. شرط: بقاء المدعوّ في الأردن 20-30 يوماً حتى صدور النتيجة. للمزدوجي الجنسية وأصحاب الإقامات السارية.',
    seo_keywords: ['دعوة الأقارب تركيا 2026','الأردن دعوة','لبنان متوقّفة','aile davet vize','جنسية مزدوجة دعوة'],
    tags: ['دعوة أقارب', 'الأردن', 'لبنان', 'جنسية مزدوجة', '2026'],
};

// ─────────────────────────────────────────────────────────────────────────
// 5) 185-DAYS RULE for FOREIGN-PLATED CARS
// ─────────────────────────────────────────────────────────────────────────
const PLATE_185 = {
    id: '185-days-foreign-plated-car-turkey-2026',
    slug: '185-days-foreign-plated-car-turkey-2026',
    title: 'قاعدة الـ١٨٥ يوماً للسيارات بلوحات أجنبية في تركيا — كيف تتحقّق عبر e-Devlet',
    category: 'السفر والمعابر',
    intro: 'للأجانب الذين يدخلون تركيا بسيارة ذات لوحات أجنبية (سورية، لبنانية، إلخ) بشكل مؤقّت لمدّة ٣ أشهر، الشرط القانوني هو أن يكون الشخص قد أقام <strong>خارج تركيا ١٨٥ يوماً على الأقلّ</strong> في السنة. تتيح بوّابة e-Devlet التركية أداة رسمية للتحقّق قبل الوصول للحدود.',
    details: `
<h2>📌 القاعدة باختصار</h2>
<div style="background:#eff6ff;border-right:4px solid #2563eb;padding:16px 20px;margin:16px 0;border-radius:8px;color:#1e3a8a;line-height:1.8;">
  <ul style="margin:0;padding-right:24px;">
    <li>السيارات بلوحات أجنبية تدخل تركيا <strong>بشكل مؤقّت لـ٣ أشهر</strong>.</li>
    <li>الشرط: السائق قضى <strong>١٨٥ يوماً على الأقلّ خارج تركيا</strong> خلال السنة.</li>
    <li>التحقّق: عبر بوّابة e-Devlet الرسمية قبل التحرّك للحدود.</li>
  </ul>
</div>

<h2>🔍 أداة التحقّق الرسمية</h2>
<div style="background:#dbeafe;border-right:4px solid #2563eb;padding:14px 18px;margin:14px 0;border-radius:8px;color:#1e40af;line-height:1.7;">
  <p style="margin:0;font-weight:bold;">الرابط الرسمي:</p>
  <p style="margin:8px 0 0;word-break:break-all;">
    <a href="https://www.turkiye.gov.tr/ticaret-yurt-disinda-yerlesiklik-sorgulama" target="_blank" rel="noopener noreferrer" style="color:#1d4ed8;font-weight:bold;">
      turkiye.gov.tr/ticaret-yurt-disinda-yerlesiklik-sorgulama
    </a>
  </p>
</div>

<h2>🧭 خطوات الاستعلام</h2>
<ol style="line-height:2;color:#334155;">
  <li>ادخل الرابط أعلاه من حساب e-Devlet خاصّتك.</li>
  <li>سجّل دخول بـTC Kimlik / كيمليك أجنبي.</li>
  <li>راجع الاستعلام (Sorgulama) — يظهر عدد أيام إقامتك خارج تركيا.</li>
  <li>لو الرقم <strong>١٨٥+ يوماً</strong> ⇒ مسموح بإدخال السيارة لـ٣ أشهر.</li>
  <li>لو أقلّ ⇒ احتمال رفض الإدخال أو رسوم/إجراءات إضافية.</li>
</ol>

<div style="background:#fee2e2;border-right:4px solid #dc2626;padding:14px 18px;margin:14px 0;border-radius:8px;color:#7f1d1d;line-height:1.8;">
  <strong>⚠️ ماذا لو لم تستوفِ الشرط؟</strong><br>
  لا تذهب للحدود قبل التحقّق. الموظّفون قد يمنعونك من إدخال السيارة، أو يحجزونها، أو يطلبون رسوماً. تجنّب الإحراج والخسارة المالية بـ٥ دقائق على e-Devlet.
</div>

<h2>💡 نصائح ذهبية</h2>
<ul style="line-height:2;color:#334155;">
  <li>افتح e-Devlet <strong>قبل الذهاب للحدود</strong>، لا عندها.</li>
  <li>احفظ صورة من نتيجة الاستعلام في هاتفك.</li>
  <li>القاعدة <strong>سنوية متجدّدة</strong> — الـ١٨٥ يوم تعدّ ضمن الـ١٢ شهراً الماضية.</li>
  <li>إن كنت قريباً من الحدّ، انتظر قليلاً قبل الدخول.</li>
</ul>

<p style="background:#eff6ff;padding:14px;border-radius:10px;margin-top:20px;color:#1e3a8a;">
  📰 جزء من حزمة تحديثات وزارة الداخلية التركية في يونيو ٢٠٢٦.
  <a href="${HUB_URL}" style="color:#1d4ed8;font-weight:bold;">راجع الدليل الشامل</a>.
</p>
`,
    documents: ['حساب e-Devlet نشط', 'TC Kimlik أو كيمليك أجنبي', 'بيانات السيارة بلوحات أجنبية'],
    steps: [
        { title: '1️⃣ ادخل e-Devlet', description: 'turkiye.gov.tr' },
        { title: '2️⃣ افتح أداة الاستعلام', description: 'yurt-disinda-yerlesiklik-sorgulama' },
        { title: '3️⃣ راجع عدد الأيام', description: 'يجب أن يكون ١٨٥+' },
        { title: '4️⃣ احفظ النتيجة', description: 'صورة في الهاتف للمراجعة عند الحدود' },
    ],
    tips: ['تحقّق قبل الحدود لا عندها', 'القاعدة سنوية متجدّدة', 'احفظ صورة من نتيجة e-Devlet'],
    fees: 'الأداة مجانية. غرامات/رسوم محتملة لو لم تستوفِ الشرط ودخلت.',
    warning: 'هذه القاعدة قانونية. تجاهلها قد يكلّفك حجز السيارة على الحدّ.',
    source: 'بوّابة e-Devlet الرسمية (turkiye.gov.tr) + إعلان UCSO، يونيو ٢٠٢٦.',
    last_update: TODAY,
    published_at: TODAY,
    image: null,
    active: true,
    status: 'approved',
    seo_title: '185 يوم خارج تركيا: التحقّق عبر e-Devlet لإدخال سيارة بلوحات أجنبية',
    seo_description: 'دليل التحقّق من شرط 185 يوماً خارج تركيا عبر e-Devlet قبل إدخال سيارة بلوحات أجنبية لـ3 أشهر مؤقّتة. الرابط الرسمي، الخطوات، التنبيهات.',
    seo_keywords: ['185 يوم تركيا','لوحات أجنبية تركيا','e-Devlet yerleşiklik','إدخال سيارة سورية','سيارة لبنانية تركيا'],
    tags: ['سيارات', 'حدود', 'e-Devlet', '185 يوم', '2026'],
};

// ─────────────────────────────────────────────────────────────────────────
// 6) NATIONAL 80% REDUCTION ANNOUNCEMENT
// ─────────────────────────────────────────────────────────────────────────
const NATIONAL_80 = {
    id: 'closed-neighborhoods-80-percent-reduction-2026',
    slug: 'closed-neighborhoods-80-percent-reduction-2026',
    title: 'تركيا ٦ يونيو ٢٠٢٦: تخفيض ٨٠٪ من الأحياء المغلقة في عموم البلاد — الإعلان الرسمي',
    category: 'الإقامة والكيمليك',
    intro: 'في إعلان رسمي من اتحاد منظمات المجتمع المدني للتنمية (UCSO)، خفّضت تركيا اليوم عدد الأحياء المغلقة لتسجيل إقامة الأجانب بنسبة <strong>تقارب ٨٠٪</strong> في عموم البلاد. التطبيق بدأ فعلياً في <strong>شانلي أورفا وكلس</strong>، ويتوسّع تباعاً. هذا التحوّل ينتظره السوريون والعرب منذ سنوات.',
    details: `
<div style="background:linear-gradient(135deg,#dcfce7,#bbf7d0);border:2px solid #16a34a;padding:20px;margin:16px 0;border-radius:12px;color:#14532d;">
  <p style="margin:0;font-weight:bold;font-size:18px;">🎉 الخبر في سطر واحد:</p>
  <p style="margin:8px 0 0;font-size:16px;line-height:1.7;">
    تخفيض ~٨٠٪ من الأحياء المغلقة في عموم تركيا — التطبيق بدأ في
    <strong>أورفا وكلس</strong>، ويتوسّع. القائمة الجديدة + لائحة استثناءات قادمة.
  </p>
</div>

<h2>📢 النصّ الرسمي من UCSO</h2>
<blockquote style="background:#f8fafc;border-right:4px solid #475569;padding:18px 22px;margin:16px 0;border-radius:8px;color:#1e293b;font-style:italic;line-height:1.9;">
  «كما ذكرنا سابقاً في منشورنا بتاريخ ٢١/٥/٢٠٢٦، فقد أُبلغنا بأنه سيتمّ إعادة النظر في تطبيق الأحياء المغلقة، وإعادة فتح الأحياء التي انخفضت فيها نسبة السوريين إلى أقلّ من ٢٠٪. وبفضل الله، تمّ اليوم تخفيض عدد الأحياء المغلقة في عموم تركيا بنسبة تقارب <strong>٨٠٪</strong>. <br><br>تطبيق الأحياء المغلقة <strong>لم يُلغَ كلّياً</strong>، وإنّما تمّ تقليصه بشكل كبير. كما سيتمّ خلال الأيام القادمة الإعلان عن القائمة الجديدة + لائحة استثناءات.»
</blockquote>

<h2>📍 الولايات التي بدأ فيها التطبيق</h2>
<div style="background:#dcfce7;border-right:4px solid #16a34a;padding:14px 18px;margin:14px 0;border-radius:8px;color:#166534;line-height:2;">
  <p style="margin:0;font-weight:bold;">✅ مؤكّد:</p>
  <ul style="margin:6px 0 0;padding-right:24px;">
    <li>شانلي أورفا (Şanlıurfa) — <a href="/article/urfa-closed-neighborhoods-list-2026" style="color:#0369a1;font-weight:bold;">القائمة الكاملة هنا</a> (٢٦ حياً فقط بقيت)</li>
    <li>كلس (Kilis)</li>
  </ul>
</div>
<div style="background:#fef3c7;border-right:4px solid #f59e0b;padding:14px 18px;margin:14px 0;border-radius:8px;color:#78350f;">
  <p style="margin:0;font-weight:bold;">🟡 بانتظار التأكيد:</p>
  <p style="margin:6px 0 0;">قونيا (نُشرت قائمتها فعلياً — <a href="/article/konya-closed-neighborhoods-list-2026" style="color:#0369a1;font-weight:bold;">٤ أحياء فقط</a>) + غازي عنتاب + هاتاي + إسطنبول + أنطاليا + مرسين + باقي الولايات.</p>
</div>

<h2>🧭 ماذا تفعل خلال الـ٤٨ ساعة القادمة؟</h2>
<ol style="line-height:2;color:#334155;">
  <li>راجع موقع إدارة الهجرة في ولايتك يومياً.</li>
  <li>اذهب لمختار الحيّ الذي تريد السكن فيه واسأله شخصياً.</li>
  <li>لو حيّك مفتوح، سجّل عنوانك عبر e-İkamet فوراً قبل ارتفاع الأسعار.</li>
  <li>لا تعتمد على قائمة ٢٠٢٢ القديمة — تجاوزها الواقع.</li>
</ol>

<p style="background:#eff6ff;padding:14px;border-radius:10px;margin-top:20px;color:#1e3a8a;">
  📚 للقائمة الرسمية والتفصيلية لولايتك:
  <a href="${HUB_URL}" style="color:#1d4ed8;font-weight:bold;">الدليل الشامل لتحديثات إدارة الهجرة ٢٠٢٦</a>.
</p>
`,
    documents: ['متابعة موقع goc.gov.tr', 'كيمليك أو إقامة سارية', 'موعد مع المختار قبل التوقيع'],
    steps: [
        { title: '1️⃣ تابع موقع إدارة الهجرة', description: 'في ولايتك يومياً' },
        { title: '2️⃣ المختار هو المرجع', description: 'الجواب الإداري النهائي' },
        { title: '3️⃣ سجّل العنوان فوراً', description: 'قبل ارتفاع الأسعار' },
    ],
    tips: ['الأسعار سترتفع — تحرّك بسرعة لكن قارن', 'لا تثق بشائعات السماسرة', 'انتظر القائمة الرسمية قبل أيّ توقيع'],
    fees: 'مجاني — رسم البطاقة فقط ٩٦٤ ليرة عند التجديد.',
    warning: 'الإغلاق لم يُلغَ كلّياً (تخفيض ٨٠٪ فقط). لائحة الاستثناءات قادمة. تابعنا.',
    source: 'اتحاد منظمات المجتمع المدني للتنمية (UCSO) — facebook.com/ucso.sy — منشور ٦ يونيو ٢٠٢٦.',
    last_update: TODAY,
    published_at: TODAY,
    image: null,
    active: true,
    status: 'approved',
    seo_title: 'عاجل 6 يونيو 2026: تخفيض 80% من الأحياء المغلقة في تركيا',
    seo_description: 'إعلان UCSO الرسمي: تركيا خفّضت ~80% من الأحياء المغلقة لتسجيل الأجانب. أورفا وكلس بدأتا التطبيق. القائمة الجديدة + لائحة استثناءات قادمة قريباً.',
    seo_keywords: ['تخفيض 80% أحياء مغلقة','UCSO إعلان','kapalı mahalleler 80%','أورفا كلس مفتوحة','إقامة سوريين 2026'],
    tags: ['أحياء مغلقة', 'تخفيض 80%', 'UCSO', 'إقامة', '2026'],
};

// ─────────────────────────────────────────────────────────────────────────
// 7) AKÇAKALE BORDER GATE for SYRIANS
// ─────────────────────────────────────────────────────────────────────────
const AKCAKALE = {
    id: 'akcakale-border-passport-syrians-2026',
    slug: 'akcakale-border-passport-syrians-2026',
    title: 'معبر Akçakale يفتح لجواز السفر للسوريين بإقامة أو إذن عمل — ١٢ مايو ٢٠٢٦',
    category: 'السفر والمعابر',
    intro: 'اعتباراً من <strong>١٢ مايو ٢٠٢٦</strong>، وبتوجيه من وزارة الداخلية التركية، بدأ معبر <strong>Akçakale الحدودي</strong> (شانلي أورفا، مقابل تل أبيض) باستقبال عمليات الدخول والخروج بجوازات السفر إلى سوريا — قناة جديدة للسوريين بإقامة أو إذن عمل ساري في تركيا.',
    details: `
<h2>✅ من يحقّ له العبور من Akçakale؟</h2>
<div style="background:#f0fdf4;border-right:4px solid #16a34a;padding:16px 20px;margin:16px 0;border-radius:8px;color:#166534;line-height:2;">
  <ul style="margin:0;padding-right:24px;">
    <li>المواطنون الأتراك</li>
    <li>السوريون حاملو الجنسية المزدوجة (سورية + تركية)</li>
    <li>السوريون الحاصلون على <strong>إقامة سارية</strong> في تركيا</li>
    <li>السوريون الحاصلون على <strong>إذن عمل ساري</strong> في تركيا</li>
  </ul>
</div>

<div style="background:#fee2e2;border-right:4px solid #dc2626;padding:14px 18px;margin:14px 0;border-radius:8px;color:#7f1d1d;line-height:1.8;">
  <strong>⚠️ مهمّ:</strong> السوريون تحت <strong>الحماية المؤقتة</strong> (كيمليك يبدأ بـ٩٩) <strong>لا يدخلون</strong> ضمن هذه الفئة. عليهم اتّباع إجراءات وزارة الداخلية المنفصلة.
</div>

<h2>🛂 الوثائق المطلوبة للعبور</h2>
<ul style="line-height:2;color:#334155;">
  <li>جواز سفر ساري</li>
  <li>إقامة تركية سارية أو إذن عمل ساري</li>
  <li>إذن دخول (تحدّده وزارة الداخلية)</li>
</ul>

<h2>🧭 خطوات العبور</h2>
<ol style="line-height:2;color:#334155;">
  <li>تأكّد من <strong>سريان</strong> كيمليكك أو إذن عملك قبل التحرّك.</li>
  <li>تأكّد من سريان جواز سفرك (٦ أشهر على الأقلّ).</li>
  <li>توجّه لمعبر Akçakale عبر طريق Şanlıurfa-Akçakale.</li>
  <li>قدّم وثائقك للموظّفين.</li>
  <li>بعد الإجراءات، تعبر إلى سوريا (تل أبيض).</li>
  <li>عند العودة، نفس الإجراءات بالعكس.</li>
</ol>

<div style="background:#fef3c7;border-right:4px solid #f59e0b;padding:14px 18px;margin:14px 0;border-radius:8px;color:#78350f;line-height:1.8;">
  <strong>تنبيه:</strong> الإجراءات قد تتغيّر بسبب الظروف الأمنية. <strong>اتّصل بـ١٥٧</strong> قبل التحرّك للتأكيد.
</div>

<p style="background:#eff6ff;padding:14px;border-radius:10px;margin-top:20px;color:#1e3a8a;">
  📰 جزء من تحديثات وزارة الداخلية التركية في الأشهر الأخيرة.
  <a href="${HUB_URL}" style="color:#1d4ed8;font-weight:bold;">راجع الدليل الشامل</a>.
</p>
`,
    documents: ['جواز سفر ساري', 'إقامة تركية سارية أو إذن عمل', 'إذن دخول (وزارة الداخلية)'],
    steps: [
        { title: '1️⃣ تأكّد من الوثائق', description: 'كلّها سارية' },
        { title: '2️⃣ اتّصل بـ١٥٧', description: 'للتأكيد قبل التحرّك' },
        { title: '3️⃣ توجّه للمعبر', description: 'عبر طريق Şanlıurfa-Akçakale' },
        { title: '4️⃣ قدّم الوثائق', description: 'وعبر للجانب السوري' },
    ],
    tips: ['تأكّد من سريان الكيمليك/الإذن قبل التحرّك', 'احمل نسخ من كل الوثائق', 'الحماية المؤقتة لا تدخل ضمن هذه الفئة'],
    fees: 'لا رسوم إضافية للعبور — فقط الرسوم الرسمية الاعتيادية لجواز السفر.',
    warning: 'الإجراءات قد تتغيّر بسبب الظروف الأمنية. اتّصل بـ١٥٧ للتأكيد.',
    source: 'ولاية شانلي أورفا (sanliurfa.goc.gov.tr) + وزارة الداخلية التركية، مايو ٢٠٢٦.',
    last_update: TODAY,
    published_at: TODAY,
    image: null,
    active: true,
    status: 'approved',
    seo_title: 'معبر Akçakale يفتح للسوريين بإقامة وإذن عمل — 12 مايو 2026',
    seo_description: 'معبر Akçakale الحدودي بدأ استقبال جوازات السفر إلى سوريا من 12 مايو 2026. للسوريين بإقامة أو إذن عمل ساري (الحماية المؤقتة غير مشمولة).',
    seo_keywords: ['معبر Akçakale','عبور سوريا تركيا','Akçakale sınır kapısı','سوريين إقامة عبور','جواز سفر سوريا'],
    tags: ['معابر', 'Akçakale', 'سوريا', '2026'],
};

const ARTICLES = [URFA, KONYA, KILIS_TRADE, FAMILY_INVITE, PLATE_185, NATIONAL_80, AKCAKALE];

(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📥 Publishing ${ARTICLES.length} focused micro-articles`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const ok = [], failed = [];
    for (const a of ARTICLES) {
        const { error } = await supabase
            .from('articles')
            .upsert(a, { onConflict: 'id' })
            .select('id');
        if (error) {
            console.error(`❌ ${a.id}: ${error.message}`);
            failed.push(a.id);
        } else {
            console.log(`✅ ${a.id} (${a.details.length} chars)`);
            ok.push(a.id);
        }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Success: ${ok.length}/${ARTICLES.length}`);
    if (failed.length) console.log(`❌ Failed: ${failed.join(', ')}`);
    console.log('\nLive URLs:');
    ARTICLES.forEach(a => console.log(`  https://dalilarabtr.com/article/${a.slug}`));
    process.exit(failed.length ? 1 : 0);
})();
