export const SITE_CONFIG = {
    name: "دليل العرب في تركيا",
    slogan: "مستشارك القانوني الذكي - متاح 24/7 بالعربية",
    lang: "ar",
    country: "تركيا",
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "966580757487",
    siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || 'https://dalilarab1.netlify.app').replace(/\/$/, '')
};

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
    'edevlet': 'خدمات e-Devlet'
};
