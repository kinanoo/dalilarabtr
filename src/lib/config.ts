export const SITE_CONFIG = {
    name: "دليل العرب والسوريين في تركيا",
    slogan: "مستشارك القانوني الذكي - متاح 24/7 بالعربية",
    lang: "ar",
    country: "تركيا",
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "966580757487",
    siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || 'https://dalilarabtr.com').replace(/\/$/, '')
};

/** Build article URL — prefers short slug over Arabic id */
export function getArticleHref(article: { slug?: string | null; id: string }): string {
    return `/article/${article.slug || article.id}`;
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
};
