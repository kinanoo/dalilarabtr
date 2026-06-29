/**
 * Shared taxonomy for the services directory. One source of truth for:
 *  - the public category landing pages (/services/category/[slug])
 *  - the breadcrumb on a provider page (/services/[id])
 *  - the crawlable "browse by profession" links on /services
 *
 * `slug` is an English, URL-clean identifier (better for Google than a
 * percent-encoded Arabic path). `variants` lists every value the DB column
 * `category` might hold for this profession (legacy + English + Arabic), so
 * fetches catch them all — kept in sync with the client filter map.
 */
export interface ServiceCategory {
    slug: string;
    name: string;        // canonical Arabic category value
    labelAr: string;     // plural display label
    variants: string[];  // all DB `category` values that map here
    keywords: string[];  // SEO keywords (Arabic + Turkish where natural)
    blurb: string;       // short description fragment for meta + intro
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
    { slug: 'doctors', name: 'طبيب', labelAr: 'أطباء', variants: ['طبيب', 'Health', 'health', 'doctor', 'Doctor', 'medical'], keywords: ['أطباء عرب في تركيا', 'طبيب عربي اسطنبول', 'عيادة عربية تركيا', 'arap doktor', 'doktor'], blurb: 'أطباء وعيادات يتحدّثون العربية' },
    { slug: 'lawyers', name: 'محامي', labelAr: 'محامون', variants: ['محامي', 'Lawyer', 'lawyer', 'legal', 'Legal'], keywords: ['محامي عربي تركيا', 'محامي سوري اسطنبول', 'استشارة قانونية تركيا', 'arap avukat', 'avukat'], blurb: 'محامون ومستشارون قانونيّون بالعربية' },
    { slug: 'translators', name: 'مترجم', labelAr: 'مترجمون', variants: ['مترجم', 'Translation', 'translation', 'Translator', 'translator'], keywords: ['مترجم عربي تركيا', 'ترجمة محلّفة اسطنبول', 'مترجم محلّف', 'tercüman', 'yeminli tercüman'], blurb: 'مترجمون محلّفون وخدمات ترجمة' },
    { slug: 'real-estate', name: 'عقارات', labelAr: 'العقارات', variants: ['عقارات', 'Real Estate', 'real_estate', 'housing'], keywords: ['عقارات تركيا', 'شقق للبيع اسطنبول', 'مكتب عقاري عربي', 'emlak', 'gayrimenkul'], blurb: 'مكاتب ووسطاء عقاريّون' },
    { slug: 'education', name: 'تعليم', labelAr: 'التعليم والطلاب', variants: ['تعليم', 'Education', 'education', 'student'], keywords: ['تعليم تركيا', 'مكتب طلابي تركيا', 'تسجيل جامعات تركيا', 'eğitim danışmanlık'], blurb: 'خدمات تعليمية ومكاتب طلابية' },
    { slug: 'beauty', name: 'تجميل', labelAr: 'التجميل', variants: ['تجميل', 'Beauty', 'beauty', 'cosmetics'], keywords: ['تجميل تركيا', 'زراعة شعر اسطنبول', 'مركز تجميل عربي', 'estetik', 'saç ekimi'], blurb: 'مراكز وخدمات التجميل والعناية' },
    { slug: 'insurance', name: 'تأمين', labelAr: 'التأمين', variants: ['تأمين', 'Insurance', 'insurance'], keywords: ['تأمين تركيا', 'تأمين صحي اسطنبول', 'سيكورتا', 'sigorta'], blurb: 'وكلاء وخدمات التأمين' },
    { slug: 'cars', name: 'سيارات', labelAr: 'السيارات', variants: ['سيارات', 'Cars', 'cars', 'automotive'], keywords: ['سيارات تركيا', 'معرض سيارات عربي', 'تأجير سيارات اسطنبول', 'oto', 'araç'], blurb: 'معارض وخدمات السيارات' },
    { slug: 'restaurants', name: 'مطاعم', labelAr: 'المطاعم', variants: ['مطاعم', 'Restaurants', 'restaurants', 'food'], keywords: ['مطاعم عربية تركيا', 'مطعم سوري اسطنبول', 'أكل عربي تركيا', 'arap restoran'], blurb: 'مطاعم وخدمات الطعام العربية' },
    { slug: 'cargo', name: 'شحن', labelAr: 'الشحن', variants: ['شحن', 'Cargo', 'cargo', 'shipping'], keywords: ['شحن من تركيا', 'شحن إلى سوريا', 'كارجو تركيا', 'kargo'], blurb: 'شركات الشحن والكارجو' },
    { slug: 'tourism', name: 'سياحة', labelAr: 'السياحة', variants: ['سياحة', 'Tourism', 'tourism', 'travel'], keywords: ['سياحة تركيا', 'مكتب سياحي عربي', 'رحلات اسطنبول', 'turizm', 'tur'], blurb: 'مكاتب ورحلات سياحية' },
    { slug: 'general', name: 'خدمات عامة', labelAr: 'خدمات عامة', variants: ['خدمات عامة', 'General', 'general', 'other'], keywords: ['خدمات عربية تركيا', 'حرفيّون تركيا', 'صيانة اسطنبول'], blurb: 'خدمات عامة وحرف متنوّعة' },
];

/** Popular Turkish cities used in landing-page copy + keywords. */
export const POPULAR_CITIES = ['إسطنبول', 'غازي عنتاب', 'أنقرة', 'بورصة', 'إزمير', 'مرسين'];

export const categoryBySlug = (slug: string): ServiceCategory | undefined =>
    SERVICE_CATEGORIES.find((c) => c.slug === slug);

/** Map a provider's raw DB `category` value to its landing-page slug (if any). */
export const categorySlugForName = (name?: string | null): string | undefined => {
    if (!name) return undefined;
    const low = name.toLowerCase().trim();
    return SERVICE_CATEGORIES.find((c) => c.variants.some((v) => v.toLowerCase() === low))?.slug;
};
