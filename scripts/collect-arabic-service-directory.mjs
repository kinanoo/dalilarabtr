import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import { JSDOM } from 'jsdom';
import { createClient } from '@supabase/supabase-js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env.local') });

const outputPath = path.resolve(
  root,
  process.argv[2] ??
    'data/service-directory/batches/2026-07-expansion-04.json',
);

const SOURCE_ORIGIN = 'https://rakwaturkey.com';
const CHECKED_AT = new Date().toISOString();
const PAGE_LIMIT = 12;
const REQUEST_DELAY_MS = 180;

const states = [
  { slug: 'stanbul', city: 'إسطنبول', target: 18 },
  { slug: 'gaziantep', city: 'غازي عنتاب', target: 16 },
  { slug: 'mersin', city: 'مرسين', target: 16 },
  { slug: 'adana', city: 'أضنة', target: 16 },
  { slug: 'hatay', city: 'هاتاي', target: 16 },
  { slug: 'anl-urfa', city: 'شانلي أورفا', target: 16 },
  { slug: 'zmir', city: 'إزمير', target: 16 },
  { slug: 'malatya', city: 'ملاطية', target: 14 },
  { slug: 'antalya', city: 'أنطاليا', target: 16 },
  { slug: 'bursa', city: 'بورصة', target: 16 },
  { slug: 'konya', city: 'قونية', target: 14 },
  { slug: 'ankara', city: 'أنقرة', target: 14 },
  { slug: 'kocaeli', city: 'كوجالي', target: 12 },
  { slug: 'kayseri', city: 'قيصري', target: 12 },
  { slug: 'sakarya', city: 'سكاريا', target: 10 },
];

const blockedSourceCategories = new Set([
  'ngo',
  'mosques',
  'churches',
  'tourist-attractions',
  'government',
  'embassy',
  'news',
]);

const classificationRules = [
  {
    category: 'طب أسنان',
    profession: 'خدمات طب أسنان',
    patterns: ['dentist', 'dental', 'أسنان', 'اسنان', 'سني'],
  },
  {
    category: 'طبيب',
    profession: 'خدمات طبية',
    patterns: [
      'health-medical',
      'doctor',
      'clinic',
      'hospital',
      'طبيب',
      'دكتور',
      'عيادة',
      'مشفى',
      'مستشفى',
      'طبية',
    ],
  },
  {
    category: 'محامي',
    profession: 'خدمات قانونية',
    patterns: ['lawyer', 'legal', 'attorney', 'محامي', 'قانون', 'حقوق'],
  },
  {
    category: 'مترجم',
    profession: 'خدمات ترجمة',
    patterns: ['translator', 'translation', 'ترجم', 'ترجمة', 'tercüme'],
  },
  {
    category: 'عقارات',
    profession: 'خدمات عقارية',
    patterns: [
      'real-estate',
      'property',
      'estate',
      'عقار',
      'عقاري',
      'شقق',
      'إسكان',
      'gayrimenkul',
    ],
  },
  {
    category: 'مطاعم',
    profession: 'مطعم أو خدمات طعام عربية',
    patterns: [
      'restaurant',
      'food',
      'cafe',
      'مطعم',
      'مطبخ',
      'حلويات',
      'مأكولات',
      'كافيه',
      'قهوة',
    ],
  },
  {
    category: 'متاجر ومستلزمات',
    profession: 'متجر يعرض خدماته',
    patterns: [
      'supermarket',
      'market',
      'store',
      'shop',
      'بقال',
      'سوبر',
      'متجر',
      'ملابس',
      'ألبسة',
      'مفروشات',
      'أثاث',
      'مستلزمات',
      'مواد غذائية',
    ],
  },
  {
    category: 'تعليم',
    profession: 'خدمات تعليمية',
    patterns: [
      'education',
      'school',
      'course',
      'training',
      'تعليم',
      'مدرس',
      'مدرسة',
      'معهد',
      'دورات',
      'تدريب',
      'قرآن',
    ],
  },
  {
    category: 'تجميل',
    profession: 'خدمات تجميل وعناية',
    patterns: [
      'beauty',
      'hair',
      'salon',
      'cosmetic',
      'تجميل',
      'صالون',
      'حلاقة',
      'عناية',
      'ليزر',
    ],
  },
  {
    category: 'حلاقة',
    profession: 'خدمات حلاقة',
    patterns: ['barber', 'hairdresser', 'حلاق', 'حلاقة', 'كوافير'],
  },
  {
    category: 'شحن',
    profession: 'خدمات شحن ولوجستيات',
    patterns: [
      'cargo',
      'shipping',
      'logistic',
      'شحن',
      'لوجست',
      'استيراد',
      'تصدير',
      'كارجو',
    ],
  },
  {
    category: 'نقل عفش',
    profession: 'خدمات نقل أثاث',
    patterns: ['moving', 'evden', 'نقل عفش', 'نقل أثاث'],
  },
  {
    category: 'نقل وتكسي',
    profession: 'خدمات نقل وتوصيل',
    patterns: ['taxi', 'transfer', 'تكسي', 'تاكسي', 'سائق', 'توصيل', 'ترانسفير'],
  },
  {
    category: 'سياحة',
    profession: 'خدمات سياحية',
    patterns: [
      'tour',
      'travel',
      'hotel',
      'tourism',
      'سياح',
      'سفر',
      'رحلات',
      'فندق',
    ],
  },
  {
    category: 'سيارات',
    profession: 'خدمات سيارات',
    patterns: [
      'automotive',
      'car-rental',
      'cars',
      'auto',
      'سيارات',
      'سيارة',
      'تأجير سيارات',
      'ميكانيك',
    ],
  },
  {
    category: 'تأمين',
    profession: 'خدمات تأمين',
    patterns: ['insurance', 'sigorta', 'تأمين', 'سيكورتا'],
  },
  {
    category: 'محاسبة',
    profession: 'خدمات محاسبة',
    patterns: ['accounting', 'accountant', 'muhasebe', 'محاسب', 'محاسبة'],
  },
  {
    category: 'مقاولات',
    profession: 'خدمات مقاولات وتشطيبات',
    patterns: [
      'construction',
      'contractor',
      'building',
      'مقاول',
      'إنشاء',
      'بناء',
      'ديكور',
      'تشطيب',
      'ترميم',
    ],
  },
  {
    category: 'تشطيبات وديكور',
    profession: 'خدمات تشطيبات وديكور',
    patterns: ['finishing', 'decoration', 'ديكور', 'تشطيب', 'ترميم'],
  },
  {
    category: 'سباكة',
    profession: 'خدمات سباكة',
    patterns: ['plumbing', 'plumber', 'tesisat', 'سباك', 'سباكة', 'تمديدات'],
  },
  {
    category: 'كهرباء',
    profession: 'خدمات كهرباء',
    patterns: ['electric', 'elektrik', 'كهرباء', 'كهربائي'],
  },
  {
    category: 'نجارة',
    profession: 'خدمات نجارة',
    patterns: ['carpenter', 'wood', 'mobilya', 'نجار', 'نجارة', 'خشب'],
  },
  {
    category: 'حدادة وأقفال',
    profession: 'خدمات حدادة وأقفال',
    patterns: [
      'locksmith',
      'metal',
      'aluminium',
      'aluminum',
      'حداد',
      'حدادة',
      'ألمنيوم',
      'المنيوم',
      'أقفال',
    ],
  },
  {
    category: 'تنظيف',
    profession: 'خدمات تنظيف',
    patterns: ['cleaning', 'temizlik', 'تنظيف', 'نظافة'],
  },
  {
    category: 'صيانة أجهزة',
    profession: 'خدمات صيانة أجهزة',
    patterns: ['appliance-repair', 'صيانة أجهزة', 'تصليح غسالات', 'تصليح أفران'],
  },
  {
    category: 'صيانة منزلية',
    profession: 'خدمات صيانة منزلية',
    patterns: ['home-maintenance', 'professional-services', 'صيانة منزلية', 'خدمات الصيانة'],
  },
  {
    category: 'تقنية وصيانة هواتف',
    profession: 'خدمات تقنية وصيانة',
    patterns: [
      'technology',
      'computer',
      'mobile',
      'phone',
      'software',
      'تقنية',
      'برمج',
      'كمبيوتر',
      'موبايل',
      'هاتف',
      'صيانة جوال',
    ],
  },
  {
    category: 'طباعة وتصميم',
    profession: 'خدمات تصميم وطباعة',
    patterns: [
      'printing',
      'design',
      'marketing',
      'advertising',
      'طباعة',
      'تصميم',
      'دعاية',
      'إعلان',
      'تسويق',
    ],
  },
  {
    category: 'خدمات عامة',
    profession: 'خدمات عامة',
    patterns: [
      'general-services',
      'consulting',
      'service',
      'خدمات',
      'استشارات',
      'إقامة',
      'تأسيس شركات',
      'مكتب',
      'شركة',
      'مصارف',
      'خدمات مالية',
      'تحويل أموال',
    ],
  },
];

const titleOverrides = [
  {
    category: 'تقنية وصيانة هواتف',
    patterns: ['شحن رصيد', 'اتصالات', 'إنترنت', 'انترنت', 'ديجتال', 'رقميون', 'برمج', 'جوال', 'كمبيوتر'],
  },
  {
    category: 'نقل عفش',
    patterns: ['نقليات', 'نقل عفش', 'نقل اثاث', 'نقل أثاث'],
  },
  {
    category: 'نقل وتكسي',
    patterns: ['تكسي', 'تاكسي', 'ترنس فير', 'ترانسفير'],
  },
  {
    category: 'سياحة',
    patterns: ['سياح', 'سفر', 'سفريات', 'رحلات'],
  },
  {
    category: 'تنظيف',
    patterns: ['تنظيف', 'مغسل', 'مغسلة', 'غسيل السجاد'],
  },
  {
    category: 'سباكة',
    patterns: ['سباك', 'سباكة', 'تمديدات صح'],
  },
  {
    category: 'صيانة أجهزة',
    patterns: ['صيانة الأجهزة', 'صيانة الاجهزة', 'تصليح غسالات', 'تصليح افران', 'تصليح أفران'],
  },
  {
    category: 'صيانة منزلية',
    patterns: ['للصيانة', 'الصيانة', 'صيانة شاملة'],
  },
  {
    category: 'كهرباء',
    patterns: ['كهرباء', 'كهربائي'],
  },
  {
    category: 'تشطيبات وديكور',
    patterns: ['ديكور', 'تشطيب', 'ترميم'],
  },
  {
    category: 'مقاولات',
    patterns: ['مقاول', 'انشاءات', 'إنشاءات', 'للإنشاء', 'للانشاء'],
  },
  {
    category: 'حلاقة',
    patterns: ['حلاق', 'حلاقة', 'كوافير'],
  },
  {
    category: 'تجميل',
    patterns: ['تجميل', 'بيوتي', 'ليزر', 'اكستنشن'],
  },
  {
    category: 'متاجر ومستلزمات',
    patterns: [
      'تجهيز المطاعم',
      'معدات المطاعم',
      'فلاتر المياه',
      'مفروشات',
      'ماركت',
      'ملبوسات',
      'ألبسة',
      'البسة',
      'أزياء',
      'اثاث',
      'أثاث',
      'ستائر',
      'برادي',
      'عطر',
      'مستحضرات',
      'مواد غذائية',
      'أفران',
      'مصاعد',
      'قطع غيار',
      'رخام',
    ],
  },
  {
    category: 'مطاعم',
    patterns: ['مطعم', 'كافتيريا', 'حلويات', 'كنافة', 'كيك'],
  },
  {
    category: 'محامي',
    patterns: ['محامي', 'قانون', 'حقوق'],
  },
  {
    category: 'عقارات',
    patterns: ['عقار', 'العقارية', 'العقارات'],
  },
  {
    category: 'مترجم',
    patterns: ['مترجم', 'ترجمان', 'ترجمة'],
  },
  {
    category: 'تعليم',
    patterns: ['مدرسة', 'مدارس', 'معلمة', 'تعليم', 'تدريب'],
  },
  {
    category: 'شحن',
    patterns: ['شحن', 'استيراد', 'تصدير', 'لوجست'],
  },
  {
    category: 'سيارات',
    patterns: ['سيارات', 'سيارة', 'ميكانيك', 'ديزل'],
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const comparable = (value) =>
  String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase('tr-TR')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

const normalizePhone = (value) => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('0090')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) {
    digits = `90${digits.slice(1)}`;
  }
  if (digits.length === 10) digits = `90${digits}`;
  return /^90\d{10}$/.test(digits) ? digits : '';
};

const cleanGeneratedServiceText = (value) =>
  String(value || '')
    .replace(/\s*باللغة العربية\s*/g, ' ')
    .replace(/\s*ويتيح التواصل\.?/g, '.')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+\./g, '.')
    .trim();

const fetchHtml = async (url, attempt = 1) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(url, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'ar,en;q=0.8,tr;q=0.7',
        'user-agent':
          'Mozilla/5.0 (compatible; DalilArabTRDirectoryCheck/1.0; +https://dalilarabtr.com/contact)',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    if (attempt >= 3) throw error;
    await sleep(500 * attempt);
    return fetchHtml(url, attempt + 1);
  } finally {
    clearTimeout(timeout);
  }
};

const getExistingFingerprints = async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase URL/key is required to avoid duplicate providers.');
  }

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const rows = [];

  for (let from = 0; ; from += 1000) {
    const { data, error } = await client
      .from('service_providers')
      .select('name,city,phone')
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }

  return {
    phones: new Set(rows.map((row) => normalizePhone(row.phone)).filter(Boolean)),
    names: new Set(
      rows.map((row) => `${comparable(row.name)}|${comparable(row.city)}`),
    ),
    count: rows.length,
  };
};

const getPreviousBatchFingerprints = () => {
  const batchesDir = path.join(root, 'data', 'service-directory', 'batches');
  const phones = new Set();
  const names = new Set();

  for (const file of fs.readdirSync(batchesDir)) {
    if (!file.endsWith('.json')) continue;
    if (path.resolve(batchesDir, file) === outputPath) continue;
    const batch = JSON.parse(
      fs.readFileSync(path.join(batchesDir, file), 'utf8'),
    );
    for (const candidate of batch.candidates || []) {
      const phone = normalizePhone(candidate.phone);
      if (phone) phones.add(phone);
      names.add(
        `${comparable(candidate.name)}|${comparable(candidate.city)}`,
      );
    }
  }

  return { phones, names };
};

const classify = ({ title, sourceCategories }) => {
  const categorySlugs = sourceCategories.map((category) => category.slug);
  if (categorySlugs.some((slug) => blockedSourceCategories.has(slug))) {
    return null;
  }

  const normalizedTitle = comparable(title);
  const titleOverride = titleOverrides.find((override) =>
    override.patterns.some((pattern) =>
      normalizedTitle.includes(comparable(pattern)),
    ),
  );
  if (titleOverride) {
    const rule = classificationRules.find(
      (candidate) => candidate.category === titleOverride.category,
    );
    if (rule) return rule;
  }

  const haystack = comparable(
    [
      title,
      ...sourceCategories.flatMap((category) => [
        category.slug,
        category.label,
      ]),
    ].join(' '),
  );

  for (const rule of classificationRules) {
    if (rule.patterns.some((pattern) => haystack.includes(comparable(pattern)))) {
      return rule;
    }
  }

  return null;
};

const parseItem = (url, city, html) => {
  const document = new JSDOM(html, { url }).window.document;
  const title =
    document.querySelector('h1')?.textContent?.trim() ||
    document.querySelector('h2')?.textContent?.trim() ||
    document.querySelector('meta[property="og:title"]')?.content
      ?.replace(/\s*-\s*ركوة\s*$/u, '')
      .trim();
  if (!title || title.length < 3) return null;

  const sourceCategories = Array.from(
    document.querySelectorAll(
      'a.primary-btn-listing-categories[href*="/category/"]',
    ),
  ).map((anchor) => ({
    slug: new URL(anchor.href).pathname.split('/').filter(Boolean).at(-1) || '',
    label: anchor.textContent.trim(),
  }));
  const classification = classify({ title, sourceCategories });
  if (!classification) return null;

  const whatsappHref = document.querySelector(
    '.listing__sidebar__contact a.whatsapp[href]',
  )?.href;
  const phone = normalizePhone(whatsappHref);
  if (!phone) return null;

  const contactLinks = Array.from(
    document.querySelectorAll('.listing__sidebar__contact a[href]'),
  );
  const website =
    contactLinks
      .map((anchor) => anchor.href)
      .find((href) => {
        const hostname = new URL(href).hostname.replace(/^www\./, '');
        return (
          !hostname.endsWith('rakwaturkey.com') &&
          !hostname.includes('facebook.com') &&
          !hostname.includes('instagram.com') &&
          !hostname.includes('wa.me') &&
          !hostname.includes('twitter.com') &&
          !hostname.includes('youtube.com')
        );
      }) || null;
  const mapUrl =
    Array.from(document.querySelectorAll('a[href]'))
      .map((anchor) => anchor.href)
      .find(
        (href) =>
          href.includes('google.com/maps') || href.includes('maps.app.goo.gl'),
      ) || null;

  const name = title.replace(/\s+/g, ' ').slice(0, 160);
  const profession = cleanGeneratedServiceText(classification.profession);
  return {
    name,
    profession,
    category: classification.category,
    city,
    phone: `+${phone}`,
    whatsapp: `+${phone}`,
    description: `${name} يعرّف عن ${profession} في ${city} ويتيح التواصل.`,
    website,
    google_maps_url: mapUrl,
    languages: ['العربية'],
    sources: [
      {
        type: 'directory_listing',
        url,
        checked_at: CHECKED_AT,
        note: 'صفحة نشاط عربية عامة تتضمن اسم الخدمة ووسيلة اتصال منشورة.',
      },
    ],
  };
};

const getStateItems = async (stateSlug, page) => {
  const url = new URL(`/state/${stateSlug}`, SOURCE_ORIGIN);
  url.searchParams.set('filter_sort_by', '7');
  url.searchParams.set('page', String(page));
  const html = await fetchHtml(url);
  const document = new JSDOM(html, { url }).window.document;

  return Array.from(document.querySelectorAll('a[href*="/item/"]'))
    .map((anchor) => new URL(anchor.href, SOURCE_ORIGIN).href)
    .filter(
      (href, index, all) =>
        new URL(href).origin === SOURCE_ORIGIN && all.indexOf(href) === index,
    );
};

const existing = await getExistingFingerprints();
const previous = getPreviousBatchFingerprints();
const seenPhones = new Set([...existing.phones, ...previous.phones]);
const seenNames = new Set([...existing.names, ...previous.names]);
const candidates = [];
const report = [];

console.log(`Existing providers checked: ${existing.count}`);

for (const state of states) {
  let accepted = 0;
  let checked = 0;
  const seenUrls = new Set();

  for (let page = 1; page <= PAGE_LIMIT && accepted < state.target; page += 1) {
    let urls;
    try {
      urls = await getStateItems(state.slug, page);
    } catch (error) {
      console.warn(
        `[${state.city}] state page ${page} skipped: ${error.message}`,
      );
      break;
    }

    const freshUrls = urls.filter((url) => !seenUrls.has(url));
    freshUrls.forEach((url) => seenUrls.add(url));
    if (freshUrls.length === 0) break;

    for (const url of freshUrls) {
      if (accepted >= state.target) break;
      checked += 1;

      try {
        const candidate = parseItem(
          url,
          state.city,
          await fetchHtml(url),
        );
        await sleep(REQUEST_DELAY_MS);
        if (!candidate) continue;

        const phone = normalizePhone(candidate.phone);
        const nameKey =
          `${comparable(candidate.name)}|${comparable(candidate.city)}`;
        if (seenPhones.has(phone) || seenNames.has(nameKey)) continue;

        seenPhones.add(phone);
        seenNames.add(nameKey);
        candidates.push(candidate);
        accepted += 1;
      } catch (error) {
        console.warn(`[${state.city}] ${url} skipped: ${error.message}`);
      }
    }
  }

  report.push({ city: state.city, accepted, checked, target: state.target });
  console.log(
    `[${state.city}] accepted ${accepted}/${state.target} after ${checked} checks`,
  );
}

const categoryCounts = Object.fromEntries(
  Array.from(
    candidates.reduce((counts, candidate) => {
      counts.set(candidate.category, (counts.get(candidate.category) || 0) + 1);
      return counts;
    }, new Map()),
  ).sort((a, b) => b[1] - a[1]),
);

const batch = {
  label:
    'دفعة التوسع الرابعة - مزودو خدمات يعرضون أعمالهم في الولايات الحيوية - 2026-07-30',
  generated_at: CHECKED_AT,
  criteria: {
    language:
      'صفحة نشاط عربية عامة مع اسم الخدمة ووسيلة اتصال تركية منشورة.',
    data_policy:
      'حقائق اتصال عامة فقط؛ لا صور ولا تقييمات ولا نسخ لوصف المصدر.',
    duplicate_policy: 'استبعاد الهاتف المكرر والاسم المكرر داخل المدينة.',
  },
  report,
  category_counts: categoryCounts,
  candidates,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(batch, null, 2)}\n`, 'utf8');

console.log(`Saved ${candidates.length} candidates to ${outputPath}`);
console.log(JSON.stringify({ report, categoryCounts }, null, 2));
