/**
 * One-time publisher for the MOFA SY illustrated guide.
 *
 * Runs during the Cloudflare build where SUPABASE_SERVICE_ROLE_KEY exists.
 * It is intentionally non-destructive: if the article already exists, it exits
 * without overwriting admin edits made later from the dashboard.
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.pulled', override: true });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dalilarabtr.com').replace(/\/$/, '');

const ARTICLE_ID = 'mofa-sy-appointment-booking-guide';
const TODAY = '2026-08-03';
const ASSET_BASE = `${SITE_URL}/article-assets/mofa-sy-appointment`;

const images = [
  {
    file: '01-mofa-sy-appointment-cover.jpg',
    caption: 'الخطوة 1: فتح تطبيق MOFA SY والبدء بخطوات حجز الموعد الإلكتروني.',
  },
  {
    file: '02-login-and-appointments.jpg',
    caption: 'الخطوة 2: تسجيل الدخول إلى التطبيق ثم اختيار زر نظام المواعيد.',
  },
  {
    file: '03-new-appointment-consulate.jpg',
    caption: 'الخطوة 3: الضغط على موعد جديد واختيار السفارة أو القنصلية المطلوبة.',
  },
  {
    file: '04-service-date-time.jpg',
    caption: 'الخطوة 4: تحديد الخدمة المطلوبة ثم اختيار التاريخ والوقت المتاحين.',
  },
  {
    file: '05-data-note.jpg',
    caption: 'الخطوة 5: إدخال البيانات بدقة، مع إمكانية تعديل بعض البيانات قبل الطباعة.',
  },
  {
    file: '06-qr-code-confirmation.jpg',
    caption: 'الخطوة 6: بعد إتمام الحجز يظهر رمز QR Code وتفاصيل الموعد.',
  },
  {
    file: '07-app-download-qr.jpg',
    caption: 'رابط تحميل تطبيق الحجز الإلكتروني MOFA SY من الموقع الرسمي.',
  },
].map((item) => ({ ...item, url: `${ASSET_BASE}/${item.file}` }));

const intro =
  'تعرّفوا إلى آلية حجز الموعد في السفارات والقنصليات السورية إلكترونياً، من تسجيل الدخول واختيار الخدمة والموعد المناسب، وصولاً إلى الحصول على رمز الـ QR Code الخاص بالحجز.';

const figures = images
  .map(
    (image, index) => `
<figure style="margin:18px 0;text-align:center;">
  <img src="${image.url}" alt="${image.caption}" width="1024" height="1280" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async" />
  <figcaption>${image.caption}</figcaption>
</figure>`,
  )
  .join('\n');

const details = `
<p>${intro}</p>

<h2>خطوات الحجز عبر تطبيق MOFA SY</h2>
<p>يعرض هذا الشرح المصور طريقة حجز موعد إلكتروني للخدمات القنصلية السورية عبر التطبيق، بدءاً من الدخول إلى التطبيق وحتى ظهور رمز الحجز النهائي.</p>

<ol>
  <li>حمّل تطبيق الحجز الإلكتروني MOFA SY من الرابط الرسمي أو من متجر التطبيقات.</li>
  <li>سجّل الدخول إلى التطبيق، ثم اضغط زر <strong>نظام المواعيد</strong>.</li>
  <li>اضغط <strong>موعد جديد</strong>، واختر السفارة أو القنصلية التي تريد مراجعتها.</li>
  <li>حدّد نوع الخدمة المطلوبة مثل إصدار جواز سفر أو معاملات الأحوال المدنية أو غيرها من الخدمات المتاحة.</li>
  <li>اختر التاريخ والوقت المناسبين من المواعيد المتاحة داخل التطبيق.</li>
  <li>بعد إتمام العملية، احتفظ بتفاصيل الحجز ورمز <strong>QR Code</strong> لإبرازه عند الحضور.</li>
</ol>

<h2>الشرح المصور</h2>
${figures}

<h2>قبل الذهاب إلى السفارة أو القنصلية</h2>
<p>تأكد من اصطحاب رمز الحجز والأوراق الثبوتية المطلوبة بحسب نوع الخدمة المختارة، وراجع التعليمات الظاهرة داخل التطبيق قبل تثبيت الموعد.</p>
`;

const article = {
  id: ARTICLE_ID,
  slug: ARTICLE_ID,
  title: 'خطوات حجز موعد إلكتروني عبر تطبيق "MOFA SY"',
  category: 'خدمات السوريين',
  intro,
  excerpt: intro,
  content: details,
  details,
  image: images[0].url,
  image_url: images[0].url,
  seo_image: images[0].url,
  steps: [
    'حمّل تطبيق MOFA SY أو افتح رابط الخدمة الرسمي.',
    'سجّل الدخول إلى التطبيق واضغط زر نظام المواعيد.',
    'اختر موعداً جديداً وحدد السفارة أو القنصلية المناسبة.',
    'حدد الخدمة المطلوبة ثم اختر التاريخ والوقت المتاحين.',
    'أدخل البيانات المطلوبة بدقة قبل تأكيد الحجز.',
    'احتفظ برمز QR Code وتفاصيل الموعد لإبرازها عند الحضور.',
  ],
  documents: [
    'رمز QR Code الخاص بالحجز',
    'جواز السفر أو الوثيقة الشخصية',
    'الأوراق الثبوتية المطلوبة حسب الخدمة المختارة',
  ],
  tips: [
    'تأكد من صحة البيانات قبل تثبيت الموعد، فبعض الخدمات تطلب تعبئة استمارة قبل التأكيد.',
    'احتفظ بصورة من رمز QR Code على الهاتف، ويفضل طباعة تفاصيل الحجز عند الحاجة.',
    'راجع التعليمات الظاهرة في التطبيق لأن المتطلبات قد تختلف حسب الخدمة والسفارة أو القنصلية.',
  ],
  fees: 'حسب الخدمة المختارة والتعليمات الظاهرة داخل التطبيق.',
  warning:
    'المواعيد والإجراءات قد تختلف حسب السفارة أو القنصلية والخدمة المختارة. اعتمد دائماً على التطبيق أو الموقع الرسمي لوزارة الخارجية والمغتربين السورية قبل المراجعة.',
  source: 'https://www.mofaex.gov.sy',
  tags: ['دليل', 'الشرح_المصور', 'MOFA_SY', 'السفارة_السورية', 'القنصلية_السورية', 'جواز_السفر_السوري', 'خبر_رئيسي'],
  seo_title: 'خطوات حجز موعد عبر تطبيق MOFA SY للسفارات والقنصليات السورية',
  seo_description: intro,
  seo_keywords: [
    'MOFA SY',
    'حجز موعد السفارة السورية',
    'حجز موعد القنصلية السورية',
    'وزارة الخارجية السورية',
    'تطبيق الحجز الإلكتروني',
    'QR Code',
    'جواز السفر السوري',
    'الشرح المصور',
  ],
  status: 'approved',
  active: true,
  last_update: TODAY,
  published_at: `${TODAY}T12:00:00+03:00`,
};

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.log('[mofa-publish] Missing Supabase service env; skipping one-time article publish.');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing, error: readError } = await supabase
    .from('articles')
    .select('id,slug,title,category,image,details')
    .eq('id', ARTICLE_ID)
    .maybeSingle();

  if (readError) {
    console.warn('[mofa-publish] Could not check existing article:', readError.message);
    return;
  }

  const hasMofaAssets =
    existing &&
    typeof existing.details === 'string' &&
    existing.details.includes('/article-assets/mofa-sy-appointment/');

  if (existing && hasMofaAssets && existing.image === images[0].url && existing.category === article.category) {
    console.log(`[mofa-publish] Article already contains MOFA assets; leaving it untouched: /article/${existing.slug || existing.id}`);
    return;
  }

  const write = existing
    ? await supabase.from('articles').update(article).eq('id', ARTICLE_ID)
    : await supabase.from('articles').insert(article);

  const { error } = write;
  if (error) {
    console.warn(`[mofa-publish] ${existing ? 'Update' : 'Insert'} failed:`, error.message);
    return;
  }

  console.log(`[mofa-publish] ${existing ? 'Updated' : 'Published'}: ${SITE_URL}/article/${ARTICLE_ID}`);
}

main().catch((error) => {
  console.warn('[mofa-publish] Unexpected failure:', error?.message || error);
});
