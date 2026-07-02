export const SITE_CONFIG = {
    name: "دليل العرب والسوريين في تركيا",
    slogan: "دليلك الشامل والموثوق",
    lang: "ar",
    country: "تركيا",
    // THE site-wide contact channel (articles, updates, contact, request,
    // consultant, floating assistant). Override via NEXT_PUBLIC_WHATSAPP_PHONE.
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "966580757487",
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
 * Priority:
 *   1. A real page image (article hero photo, service profile image) — a
 *      better preview than any generated card. Must be absolute http(s);
 *      relative paths 404 for social crawlers.
 *   2. A generated branded title card from og.dalilarabtr.com (the
 *      workers/og Satori worker — the pre-migration /api/og cards, back).
 *   3. The site-wide static /og-image.jpg.
 */
export function getOgImage(
    preferredImage?: string | null,
    card?: { title?: string; category?: string },
): string {
    if (preferredImage && /^https?:\/\//i.test(preferredImage)) {
        return preferredImage;
    }
    const title = card?.title?.trim();
    if (title) {
        const params = new URLSearchParams({ title });
        if (card?.category?.trim()) params.set('category', card.category.trim());
        return `https://og.dalilarabtr.com/?${params.toString()}`;
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
