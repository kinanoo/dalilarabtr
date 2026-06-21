export const SITE_CONFIG = {
    name: "دليل العرب والسوريين في تركيا",
    slogan: "مستشارك القانوني الذكي - متاح 24/7 بالعربية",
    lang: "ar",
    country: "تركيا",
    email: "dalilarabtr@gmail.com",
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "966580757487", // kept for services page only
    siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || 'https://dalilarabtr.com').replace(/\/$/, ''),
    // روابط السوشيال ميديا — أضف روابطك هنا لما تجهز الحسابات
    // Google بيستخدمها لبناء Knowledge Panel وعرض اللوغو بنتائج البحث
    socialLinks: [
        'https://www.facebook.com/dalilarabtr',
        'https://www.instagram.com/dalilarabtr',
        'https://www.youtube.com/@dalilarabtr',
        'https://x.com/dalilarabtr',
        process.env.NEXT_PUBLIC_TELEGRAM_URL,
    ].filter((url): url is string => !!url),
};

/** Build article URL — prefers short slug over Arabic id */
export function getArticleHref(article: { slug?: string | null; id: string }): string {
    return `/article/${article.slug || article.id}`;
}

/**
 * OpenGraph image URL for any page that exposes one via generateMetadata().
 *
 * Prefers a real image when the page has its own (article hero photo,
 * service profile image) — that's a better preview than a generated
 * text card anyway. Falls back to the site-wide /og-image.jpg when no
 * page-level image exists.
 *
 * Why the static fallback: this used to dispatch to /api/og for a Satori-
 * rendered Arabic title card per page, but that endpoint relied on
 * @vercel/og which is bound to the Vercel runtime. Cloudflare Pages
 * doesn't ship the underlying ImageResponse / Satori chain in a way the
 * Workers runtime can execute without significant porting. Static OG
 * image covers the social-share use case (WhatsApp/FB/Twitter all show
 * it the same way), and saves the cold-start cost of generating a 1200x630
 * PNG on every uncached share.
 *
 * Accepts an absolute http(s) URL; relative paths get rejected (they
 * 404 in social previews because crawlers can't resolve them).
 */
export function getOgImage(preferredImage?: string | null): string {
    if (preferredImage && /^https?:\/\//i.test(preferredImage)) {
        return preferredImage;
    }
    return `${SITE_CONFIG.siteUrl}/og-image.jpg`;
}

export const CATEGORY_SLUGS: Record<string, string> = {
    'residence': 'أنواع الإقامات',
    'kimlik': 'الكملك والحماية المؤقتة',
    'visa': 'الفيزا والتأشيرات',
    'syrians': 'خدمات السوريين',
    'housing': 'السكن والحياة',
    'work': 'العمل والاستثمار',
    'education': 'الدراسة والتعليم',
    'health': 'الصحة والتأمين',
    'official': 'معاملات رسمية',
    'edevlet': 'خدمات e-Devlet',
    'traffic': 'المرور والسيارات'
};

export const TAG_LABELS: Record<string, string> = {
    'kizilay': 'بطاقة الهلال الأحمر',
    'consulate': 'خدمات القنصلية',
    'children': 'المواليد والأطفال',
    'travel-permit': 'تصاريح السفر',
    'citizenship': 'التجنيس',
    'renewal': 'تجديد',
    'driving-license': 'رخصة القيادة',
    'fines': 'المخالفات',
    'car': 'تسجيل سيارة',
    'family-reunion': 'لمّ الشمل',
    'spouse': 'إقامة عائلية',
    'work-permit': 'إذن العمل',
    'insurance': 'التأمين',
    'schools': 'المدارس',
    'scholarships': 'المنح الدراسية',
    'medical-tourism': 'السياحة العلاجية',
    'legal-trouble': 'مشاكل قانونية',
    'lost-docs': 'فقدان الوثائق',
    'company': 'الشركات',
};
