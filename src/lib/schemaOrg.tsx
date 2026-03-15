/**
 * 🔍 Schema.org Structured Data Components
 * =========================================
 * 
 * مكونات لإضافة البيانات المهيكلة (Structured Data) لتحسين SEO
 * تساعد محركات البحث على فهم محتوى الموقع بشكل أفضل
 * 
 * الفوائد:
 * - ظهور أفضل في نتائج البحث (Rich Snippets)
 * - فهم أفضل لمحتوى الموقع من قبل Google
 * - زيادة معدل النقر (CTR) بنسبة تصل لـ 30%
 * 
 * @author Claude AI
 * @lastUpdate 2025-12-20
 */

import { SITE_CONFIG } from '@/lib/config';

// ============================================
// 📦 أنواع البيانات (Types)
// ============================================

export type FAQItem = {
  question: string;
  answer: string;
};

export type ArticleSchemaData = {
  title: string;
  description: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
  url?: string;
  image?: string;
};

export type BreadcrumbItem = {
  name: string;
  url: string;
};

export type ServiceSchemaData = {
  name: string;
  description: string;
  provider?: string;
  areaServed?: string;
  url?: string;
};

// ============================================
// 🏢 Organization Schema
// ============================================

/**
 * Schema للمنظمة/الموقع
 * يظهر في Knowledge Panel في Google
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.slogan,
    url: SITE_CONFIG.siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_CONFIG.siteUrl}/logo.png`,
      width: 256,
      height: 256,
    },
    image: `${SITE_CONFIG.siteUrl}/og-image.jpg`,
    ...(SITE_CONFIG.whatsapp ? {
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: `+${SITE_CONFIG.whatsapp}`,
        contactType: 'customer service',
        availableLanguage: ['Arabic', 'Turkish'],
      },
    } : {}),
    ...(SITE_CONFIG.socialLinks.length > 0 ? { sameAs: SITE_CONFIG.socialLinks } : {}),
  };
}

// ============================================
// ❓ FAQ Schema
// ============================================

/**
 * Schema للأسئلة الشائعة
 * يظهر كـ Rich Snippet في نتائج البحث
 * 
 * @example
 * const faqSchema = generateFAQSchema([
 *   { question: 'ما هي الإقامة السياحية؟', answer: '...' },
 *   { question: 'كم تكلفة تجديد الإقامة؟', answer: '...' },
 * ]);
 */
export function generateFAQSchema(questions: FAQItem[]) {
  if (!questions || questions.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

// ============================================
// 📄 Article Schema
// ============================================

/**
 * Schema للمقالات
 * يظهر مع تاريخ النشر والمؤلف في نتائج البحث
 */
export function generateArticleSchema(data: ArticleSchemaData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.title,
    description: data.description,
    author: {
      '@type': 'Organization',
      name: data.author || SITE_CONFIG.name,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.siteUrl}/logo.png`,
      },
    },
    datePublished: data.datePublished || new Date().toISOString(),
    dateModified: data.dateModified || data.datePublished || new Date().toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': data.url || SITE_CONFIG.siteUrl,
    },
    image: data.image || `${SITE_CONFIG.siteUrl}/og-image.jpg`,
    inLanguage: 'ar',
  };
}

// ============================================
// 🧭 Breadcrumb Schema
// ============================================

/**
 * Schema للمسار التنقلي (Breadcrumbs)
 * يظهر كمسار في نتائج البحث
 * 
 * @example
 * const breadcrumbSchema = generateBreadcrumbSchema([
 *   { name: 'الرئيسية', url: '/' },
 *   { name: 'الإقامات', url: '/category/residence' },
 *   { name: 'تجديد الإقامة', url: '/article/renew-residence' },
 * ]);
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  if (!items || items.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_CONFIG.siteUrl}${item.url}`,
    })),
  };
}

// ============================================
// 🛠️ Service Schema
// ============================================

/**
 * Schema للخدمات
 * يساعد في ظهور الخدمات في نتائج البحث المحلية
 */
export function generateServiceSchema(data: ServiceSchemaData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: data.name,
    description: data.description,
    provider: {
      '@type': 'Organization',
      name: data.provider || SITE_CONFIG.name,
    },
    areaServed: {
      '@type': 'Country',
      name: data.areaServed || SITE_CONFIG.country,
    },
    url: data.url || SITE_CONFIG.siteUrl,
  };
}

// ============================================
// 🌐 WebSite Schema
// ============================================

/**
 * Schema للموقع مع خاصية البحث
 * يُفعّل صندوق البحث في نتائج Google (Sitelinks Search Box)
 */
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.slogan,
    url: SITE_CONFIG.siteUrl,
    inLanguage: 'ar',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.siteUrl}/faq?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// ============================================
// 📍 LocalBusiness Schema (اختياري)
// ============================================

/**
 * Schema للنشاط التجاري المحلي
 * مفيد إذا كان لديك مكتب فعلي
 */
export function generateLocalBusinessSchema(options?: {
  address?: string;
  city?: string;
  phone?: string;
  openingHours?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.slogan,
    url: SITE_CONFIG.siteUrl,
    telephone: options?.phone || `+${SITE_CONFIG.whatsapp}`,
    address: options?.address ? {
      '@type': 'PostalAddress',
      addressLocality: options.city || 'Istanbul',
      addressCountry: 'TR',
      streetAddress: options.address,
    } : undefined,
    openingHoursSpecification: options?.openingHours?.map(hours => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '09:00',
      closes: '18:00',
    })),
    priceRange: '$$',
    areaServed: {
      '@type': 'Country',
      name: 'Turkey',
    },
  };
}

// ============================================
// 🎯 مكون React للـ Schema
// ============================================

type SchemaScriptProps = {
  schema: object | object[] | null;
};

/**
 * مكون React لإضافة Schema JSON-LD للصفحة
 * 
 * @example
 * <SchemaScript schema={generateFAQSchema(questions)} />
 * 
 * // أو عدة schemas:
 * <SchemaScript schema={[
 *   generateOrganizationSchema(),
 *   generateWebSiteSchema(),
 *   generateFAQSchema(questions),
 * ]} />
 */
export function SchemaScript({ schema }: SchemaScriptProps) {
  if (!schema) return null;

  // دمج عدة schemas في array واحد
  const schemas = Array.isArray(schema) ? schema.filter(Boolean) : [schema];

  if (schemas.length === 0) return null;

  return (
    <>
      {schemas.map((s, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
    </>
  );
}

// ============================================
// 🔧 دوال مساعدة
// ============================================

/**
 * تحويل تاريخ بصيغة YYYY-MM-DD إلى ISO
 */
export function toISODate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();

  // إذا كان بالفعل ISO
  if (dateStr.includes('T')) return dateStr;

  // تحويل YYYY-MM-DD إلى ISO
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * إنشاء URL كامل من مسار نسبي
 */
export function toFullUrl(path: string): string {
  if (path.startsWith('http')) return path;
  const base = SITE_CONFIG.siteUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
