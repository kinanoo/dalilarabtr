// ============================================
// 📊 Structured Data (Schema.org) Helpers
// ============================================

// ============================================
// 📄 Article Schema
// ============================================

export interface ArticleSchemaProps {
    title: string;
    description: string;
    image?: string;
    datePublished?: string;
    dateModified?: string;
    author?: string;
    url: string;
}

export function generateArticleSchema(props: ArticleSchemaProps) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: props.title,
        description: props.description,
        image: props.image || 'https://daleel-arab-turkiye.com/og-default.jpg',
        datePublished: props.datePublished || new Date().toISOString(),
        dateModified: props.dateModified || new Date().toISOString(),
        author: {
            '@type': 'Organization',
            name: props.author || 'دليل العرب في تركيا',
        },
        publisher: {
            '@type': 'Organization',
            name: 'دليل العرب في تركيا',
            logo: {
                '@type': 'ImageObject',
                url: 'https://daleel-arab-turkiye.com/logo.png',
            },
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': props.url,
        },
    };
}

// ============================================
// ❓ FAQ Schema
// ============================================

export interface FAQItem {
    question: string;
    answer: string;
}

export function generateFAQSchema(faqs: FAQItem[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    };
}

// ============================================
// 💼 Local Business Schema
// ============================================

export interface ServiceSchemaProps {
    name: string;
    description: string;
    image?: string;
    address?: {
        city: string;
        country: string;
    };
    telephone?: string;
    avgRating?: number;
    reviewCount?: number;
}

export function generateServiceSchema(props: ServiceSchemaProps) {
    const schema: any = {
        '@context': 'https://schema.org',
        '@type': 'ProfessionalService',
        name: props.name,
        description: props.description,
        image: props.image,
    };

    if (props.address) {
        schema.address = {
            '@type': 'PostalAddress',
            addressLocality: props.address.city,
            addressCountry: props.address.country || 'TR',
        };
    }

    if (props.telephone) {
        schema.telephone = props.telephone;
    }

    if (props.avgRating && props.reviewCount) {
        schema.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: props.avgRating,
            reviewCount: props.reviewCount,
        };
    }

    return schema;
}

// ============================================
// 🌐 Website Schema (للصفحة الرئيسية)
// ============================================

export function generateWebsiteSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'دليل العرب في تركيا',
        description: 'الدليل الشامل للعرب في تركيا - خدمات، استشارات، معلومات قانونية',
        url: 'https://daleel-arab-turkiye.com',
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://daleel-arab-turkiye.com/?search={search_term_string}',
            },
            'query-input': 'required name=search_term_string',
        },
    };
}

// ============================================
// 🏢 Organization Schema
// ============================================

export function generateOrganizationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'دليل العرب في تركيا',
        description: 'منصة شاملة تقدم معلومات وخدمات للعرب المقيمين في تركيا',
        url: 'https://daleel-arab-turkiye.com',
        logo: 'https://daleel-arab-turkiye.com/logo.png',
        sameAs: [
            // يمكن إضافة روابط السوشال ميديا هنا
            // 'https://facebook.com/daleel-arab-turkiye',
            // 'https://twitter.com/daleelarabtr',
        ],
    };
}

// ============================================
// 🔧 Helper: Render Schema in Component
// ============================================
// Note: Use this in your React components:
// <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

