/**
 * Convert the original goc-idaresi-updates-2026 mega-article into a
 * lightweight hub page that links to the 7 focused micro-articles we
 * just published. Replaces the 35KB body with a clean cards-style index
 * so the page still ranks for "تحديثات إدارة الهجرة" but each individual
 * topic now has its own focused, shareable, mobile-first article.
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.pulled', override: true });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TODAY = '2026-06-06';

const FOCUSED = [
    {
        slug: 'closed-neighborhoods-80-percent-reduction-2026',
        emoji: '📢',
        title: 'الإعلان الرسمي: تخفيض ٨٠٪ من الأحياء المغلقة في عموم تركيا',
        desc: 'إعلان UCSO الكامل + الولايات التي بدأ فيها التطبيق + خطّة العمل.',
        tag: 'الخبر العاجل',
        color: '#16a34a',
    },
    {
        slug: 'urfa-closed-neighborhoods-list-2026',
        emoji: '🟢',
        title: 'أورفا: ٢٦ حياً فقط بقي مغلقاً — القائمة الرسمية',
        desc: 'القائمة الكاملة بأسماء الأحياء + ٧ أقضية مفتوحة كلّياً.',
        tag: 'لسكّان أورفا',
        color: '#0ea5e9',
    },
    {
        slug: 'konya-closed-neighborhoods-list-2026',
        emoji: '🔴',
        title: 'قونيا: ٤ أحياء فقط بقيت مغلقة',
        desc: 'Sahibata (Meram) + Şemsitebrizi (Karatay) + İhsaniye + Ferhuniye (Selçuklu).',
        tag: 'لسكّان قونيا',
        color: '#dc2626',
    },
    {
        slug: 'kilis-trade-permit-6-months-2026',
        emoji: '💼',
        title: 'كلس: الإذن التجاري إلى سوريا الآن ٦ أشهر بدلاً من ٣',
        desc: 'تسهيل لرجال الأعمال السوريين بين تركيا وسوريا.',
        tag: 'لرجال الأعمال في كلس',
        color: '#ca8a04',
    },
    {
        slug: 'family-invitation-jordan-only-2026',
        emoji: '🛂',
        title: 'دعوة الأقارب: لبنان متوقّفة، الأردن فقط — مع شرط البقاء',
        desc: 'تغيير المسار + شرط بقاء المدعوّ في الأردن ٢٠-٣٠ يوماً.',
        tag: 'لمزدوجي الجنسية',
        color: '#f59e0b',
    },
    {
        slug: '185-days-foreign-plated-car-turkey-2026',
        emoji: '🚗',
        title: 'قاعدة الـ١٨٥ يوماً لإدخال السيارات بلوحات أجنبية',
        desc: 'كيف تتحقّق عبر e-Devlet قبل الذهاب للحدود.',
        tag: 'لأصحاب السيارات الأجنبية',
        color: '#2563eb',
    },
    {
        slug: 'akcakale-border-passport-syrians-2026',
        emoji: '🌐',
        title: 'معبر Akçakale يفتح لجواز السفر للسوريين بإقامة/إذن عمل',
        desc: 'القناة الجديدة لسوريا — متى ولمن.',
        tag: 'للسوريين بإقامة',
        color: '#8b5cf6',
    },
];

const cardsHtml = FOCUSED.map((f) => `
<a href="/article/${f.slug}" style="display:block;background:white;border:2px solid #e2e8f0;border-right:6px solid ${f.color};border-radius:14px;padding:18px;margin:10px 0;text-decoration:none;color:#0f172a;transition:transform 0.15s;box-shadow:0 2px 6px rgba(0,0,0,0.04);">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
    <span style="font-size:22px;">${f.emoji}</span>
    <span style="display:inline-block;background:${f.color}15;color:${f.color};font-size:11px;font-weight:bold;padding:3px 10px;border-radius:20px;">${f.tag}</span>
  </div>
  <h3 style="margin:6px 0 4px;font-size:16px;font-weight:bold;color:#0f172a;line-height:1.5;">${f.title}</h3>
  <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">${f.desc}</p>
  <span style="display:inline-block;margin-top:8px;color:${f.color};font-size:12px;font-weight:bold;">اقرأ المقال كاملاً ←</span>
</a>
`).join('\n');

const hubArticle = {
    id: 'goc-idaresi-updates-2026',
    slug: 'goc-idaresi-updates-2026',
    title: 'مركز تحديثات إدارة الهجرة التركية ٢٠٢٦ — ٧ تحديثات منفصلة',
    category: 'الإقامة والكيمليك',
    intro: 'نُحدّث هذه الصفحة فور صدور أيّ خبر يخصّ إدارة الهجرة التركية. لتجربة قراءة أسرع، فصلنا كلّ تحديث في مقال مستقلّ موجّه لمستفيد محدّد. اختر التحديث الذي يخصّك فقط، اقرأه بدقيقتين، وشاركه مع من يهمّه.',
    details: `
<div style="background:linear-gradient(135deg,#ecfdf5,#dcfce7);border:2px solid #16a34a;padding:18px;margin:0 0 24px;border-radius:14px;">
  <p style="margin:0;font-weight:bold;color:#14532d;font-size:16px;">💡 لماذا قسّمنا هذه التحديثات؟</p>
  <p style="margin:8px 0 0;color:#166534;line-height:1.7;font-size:14px;">
    لأنّ مقالاً طويلاً يجمع كلّ شيء يصعب قراءته على الموبايل، ولا يستطيع القارئ
    إيجاد المعلومة التي تخصّه بسرعة. كلّ بطاقة أسفل تفتح مقالاً موجّهاً
    <strong>لجمهور محدّد</strong> — للاطّلاع، أو لمشاركتها مع من يحتاجها فقط.
  </p>
</div>

<h2>🗂️ التحديثات السبعة المنفصلة</h2>

${cardsHtml}

<h2 style="margin-top:32px;">📌 ما الذي يحدث الآن؟</h2>
<p>تتسارع وزارة الداخلية وإدارة الهجرة التركية في إصدار قرارات تسهيلية للسوريين والعرب في ٢٠٢٦: من فتح أحياء كانت مغلقة منذ ٢٠٢٢، إلى تسهيل الفيزا للسوريين العائدين، إلى تمديد الأذونات التجارية، إلى إعادة تفعيل معابر حدودية. هذه الصفحة هي المرجع الموحّد لكلّ تلك التحديثات.</p>

<h2>📞 جهات للتأكّد الرسمي</h2>
<ul style="line-height:2;color:#334155;">
  <li>إدارة الهجرة المركزية: <a href="https://www.goc.gov.tr" target="_blank" rel="noopener noreferrer" style="color:#0369a1;font-weight:bold;">goc.gov.tr</a></li>
  <li>e-İkamet: <a href="https://e-ikamet.goc.gov.tr" target="_blank" rel="noopener noreferrer" style="color:#0369a1;font-weight:bold;">e-ikamet.goc.gov.tr</a></li>
  <li>الخطّ الموحّد للأجانب: <strong>١٥٧</strong> (مجاني، بالعربية)</li>
  <li>اتحاد منظمات المجتمع المدني (UCSO): facebook.com/ucso.sy</li>
</ul>

<p style="background:#eff6ff;padding:14px;border-radius:10px;margin-top:20px;color:#1e3a8a;font-size:14px;">
  ✉️ <a href="/" style="color:#1d4ed8;font-weight:bold;">اشترك في النشرة البريدية</a> أو
  <a href="/qa" style="color:#1d4ed8;font-weight:bold;">اطرح سؤالك في صفحة الأسئلة</a>
  وسنُجيبك مع المصدر الرسمي.
</p>
`,
    documents: [],
    steps: [
        { title: '1️⃣ اختر التحديث الذي يخصّك', description: 'من البطاقات أعلاه — مقال لكلّ مستفيد' },
        { title: '2️⃣ اقرأ بدقيقتين', description: 'كلّ مقال مُختصر وموجّه' },
        { title: '3️⃣ شاركه فوراً', description: 'مع من يهمّه الأمر فقط' },
    ],
    tips: [
        'البطاقة الخضراء = خبر عاجل عامّ',
        'البطاقات الزرقاء/الحمراء = أخبار محلّية لولاية محدّدة',
        'البطاقات البنفسجية = حالات خاصّة (دعوة، سيارة، معبر)',
    ],
    fees: 'كلّ التحديثات في هذا المركز مجانية للقراءة والمشاركة.',
    warning: 'القرارات الرسمية قد تتغيّر يومياً. لا تعتمد على معلومات قديمة. تابع المصادر الرسمية أعلاه قبل اتّخاذ أيّ قرار.',
    source: 'تجميع من مصادر رسمية: Göç İdaresi + UCSO + ولاية شانلي أورفا + e-Devlet + الجريدة الرسمية التركية.',
    last_update: TODAY,
    published_at: TODAY,
    image: null,
    active: true,
    status: 'approved',
    seo_title: 'مركز تحديثات إدارة الهجرة التركية 2026 — 7 تحديثات منفصلة',
    seo_description: '٧ تحديثات مهمّة لإدارة الهجرة التركية ٢٠٢٦ في مقالات منفصلة موجّهة لكلّ مستفيد: أحياء أورفا، أحياء قونيا، إذن كلس التجاري، دعوة الأقارب عبر الأردن، قاعدة ١٨٥ يوماً، معبر Akçakale، وأكثر.',
    seo_keywords: ['تحديثات إدارة الهجرة 2026','مركز تحديثات تركيا','goc idaresi haberler','UCSO إعلانات','سوريين تركيا أخبار'],
    tags: ['إدارة الهجرة', 'تحديثات', 'مركز', '2026'],
};

(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 Converting aggregator → hub');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const { error } = await supabase
        .from('articles')
        .upsert(hubArticle, { onConflict: 'id' })
        .select('id, slug, title');

    if (error) {
        console.error('❌ FAILED:', error.message);
        process.exit(1);
    }
    console.log(`✅ Hub updated (${hubArticle.details.length} chars — was 35,737)`);
    console.log(`🔗 https://dalilarabtr.com/article/${hubArticle.slug}`);
    process.exit(0);
})();
