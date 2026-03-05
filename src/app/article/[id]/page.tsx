// src/app/article/[id]/page.tsx
// import {
//   generateArticleSchema,
//   generateBreadcrumbSchema,
// } from '@/lib/schemaOrg';

import { CATEGORY_SLUGS, SITE_CONFIG } from '@/lib/config';
import ArticleHydratedView from '@/components/ArticleHydratedView';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import RelatedArticles from '@/components/RelatedArticles';
import UniversalComments from '@/components/community/UniversalComments';
import ContentHelpfulWidget from '@/components/community/ContentHelpfulWidget';
import { stripHtml } from '@/lib/stripHtml';


export const revalidate = 3600; // ISR: Revalidate every hour
export const dynamicParams = true;

// Helper to fetch article (DB -> Static Fallback)
async function fetchArticleData(slug: string) {
  // 1. Try Supabase — check slug first, then id
  if (supabase) {
    const decoded = decodeURIComponent(slug);

    // Try by slug (short English URL) first — filter status at DB level
    const articleFields = 'id, title, slug, category, intro, details, steps, documents, tips, fees, warning, source, image, seo_title, seo_description, seo_keywords, created_at, last_update, status';

    let { data } = await supabase
      .from('articles')
      .select(articleFields)
      .eq('slug', decoded)
      .eq('status', 'approved')
      .maybeSingle();

    // Fallback to id (original Arabic-based ID)
    if (!data) {
      ({ data } = await supabase
        .from('articles')
        .select(articleFields)
        .eq('id', decoded)
        .eq('status', 'approved')
        .maybeSingle());
    }

    if (data) {
      return {
        title: data.title,
        seoTitle: data.seo_title || data.title,
        seoDescription: data.seo_description || data.intro,
        seoKeywords: data.seo_keywords || [],
        category: data.category,
        intro: data.intro || '',
        details: data.details || '',
        steps: data.steps || [],
        tips: data.tips || [],
        documents: data.documents || [],
        warning: data.warning || '',
        fees: data.fees || '',
        source: data.source || '',
        image: data.image || '',
        lastUpdate: (data.last_update || data.created_at) ? new Date(data.last_update || data.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      };
    }
  }

  return null;
}

function inferExtraKeywordsByCategory(categoryName: string): string[] {
  const c = (categoryName || '').toLowerCase();

  if (c.includes('e-devlet') || c.includes('edevlet') || c.includes('إي دولات')) {
    return ['e-Devlet', 'edevlet', 'turkiye.gov.tr', 'بوابة الحكومة الإلكترونية'];
  }
  if (c.includes('الإقامات') || c.includes('ikamet') || c.includes('إقامة')) {
    return ['ikamet', 'ikamet izni', 'e-ikamet', 'إقامة تركيا', 'YKN'];
  }
  if (c.includes('الفيزا') || c.includes('تأشيرات') || c.includes('visa')) {
    return ['vize', 'e-vize', 'تأشيرة تركيا'];
  }
  if (c.includes('العمل') || c.includes('استثمار') || c.includes('شركة')) {
    return ['çalışma izni', 'إذن عمل', 'عمل في تركيا'];
  }
  if (c.includes('الصحة') || c.includes('تأمين') || c.includes('sgk') || c.includes('gss')) {
    return ['SGK', 'GSS', 'تأمين صحي', 'صحة في تركيا'];
  }
  if (c.includes('السكن') || c.includes('الحياة')) {
    return ['سكن في تركيا', 'إيجار', 'نفوس', 'عنوان'];
  }

  return [];
}

function uniqStrings(values: Array<string | undefined | null>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const v = (value || '').trim();
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function buildArticleKeywords(args: { slug: string; title: string; category: string; intro: string; lastUpdate: string; source?: string; explicit?: string[] }): string[] {
  const year = (args.lastUpdate || '').slice(0, 4);
  const base = uniqStrings([
    ...(args.explicit || []),
    args.title,
    args.category,
    'الدليل الشامل',
    'تركيا',
    year && year !== '0000' ? year : undefined,
    (() => {
      try {
        return args.source ? new URL(args.source).hostname : undefined;
      } catch {
        return undefined;
      }
    })(),
  ]);
  const extra = inferExtraKeywordsByCategory(args.category);
  const slugParts = args.slug.split(/[-_]/g).map((p) => p.trim()).filter(Boolean);
  return uniqStrings([...base, ...extra, ...slugParts]);
}

function getCategorySlugFromName(categoryName: string): string | undefined {
  return Object.entries(CATEGORY_SLUGS).find(([_, name]) => name === categoryName)?.[0];
}

function calculateWordCount(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function buildJsonLd(args: {
  slug: string;
  title: string;
  description: string;
  lastUpdate: string;
  categoryName: string;
  categorySlug?: string;
  url: string;
  siteName: string;
  siteUrl: string;
  articleBody?: string;
  keywords?: string[];
  image?: string;
}) {
  const wordCount = args.articleBody ? calculateWordCount(args.articleBody) : 0;
  const dateModified = args.lastUpdate.includes('T') ? args.lastUpdate : `${args.lastUpdate}T00:00:00Z`;

  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: args.title,
    description: args.description,
    inLanguage: 'ar',
    datePublished: dateModified,
    dateModified,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': args.url,
    },
    author: {
      '@type': 'Organization',
      name: args.siteName,
      url: args.siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: args.siteName,
      url: args.siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${args.siteUrl}/logo.png`,
        width: 256,
        height: 256,
      },
    },
    articleSection: args.categoryName,
    ...(args.articleBody && { articleBody: args.articleBody }),
    ...(wordCount > 0 && { wordCount }),
    ...(args.keywords && args.keywords.length > 0 && { keywords: args.keywords.join(', ') }),
    image: args.image || `${args.siteUrl}/og-image.jpg`,
  };

  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: args.siteUrl },
    ...(args.categorySlug ? [{ '@type': 'ListItem', position: 2, name: args.categoryName, item: `${args.siteUrl}/category/${args.categorySlug}` }] : []),
    { '@type': 'ListItem', position: args.categorySlug ? 3 : 2, name: args.title, item: args.url },
  ];

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  return { article, breadcrumbs };
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const article = await fetchArticleData(params.id);

  if (!article) {
    return {
      title: '404 - المقالة غير موجودة',
      description: 'عذراً، هذه المقالة لم تعد موجودة',
    };
  }

  const url = `${SITE_CONFIG.siteUrl}/article/${params.id}`;
  const title = article.seoTitle?.trim() || `${article.title} | ${SITE_CONFIG.name}`;
  const description = article.seoDescription?.trim() || stripHtml(article.intro);
  const keywords = buildArticleKeywords({
    slug: params.id,
    title: article.title,
    category: article.category,
    intro: article.intro,
    lastUpdate: article.lastUpdate,
    source: article.source,
    explicit: article.seoKeywords,
  });

  const dateModified = article.lastUpdate ? (
    article.lastUpdate.includes('T') ? article.lastUpdate : `${article.lastUpdate}T00:00:00Z`
  ) : new Date().toISOString();

  return {
    title,
    description,
    keywords,
    authors: [{ name: SITE_CONFIG.name }],
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description,
      type: 'article',
      url,
      images: [{ url: article.image || `${SITE_CONFIG.siteUrl}/og-image.jpg`, width: 1200, height: 630, alt: article.title }],
      publishedTime: dateModified,
      modifiedTime: dateModified,
      section: article.category,
      tags: keywords.slice(0, 10),
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: [article.image || `${SITE_CONFIG.siteUrl}/og-image.jpg`],
    },
  };
}

export default async function ArticlePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const article = await fetchArticleData(params.id);

  if (!article) {
    return (
      <main className="min-h-screen flex flex-col">
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
          <h1 className="text-4xl font-bold text-slate-300 mb-4">404</h1>
          <p className="text-xl text-slate-600 mb-8">عذراً، هذا الدليل غير متوفر حالياً.</p>
          <Link href="/" className="bg-primary-600 text-white px-6 py-3 rounded-lg font-bold">العودة للرئيسية</Link>
        </div>
      </main>
    );
  }

  const url = `${SITE_CONFIG.siteUrl}/article/${params.id}`;
  const categorySlug = getCategorySlugFromName(article.category);
  const articleBody = [article.intro, article.details, ...(article.steps || []), ...(article.tips || [])].filter(Boolean).join(' ');
  const keywords = buildArticleKeywords({
    slug: params.id,
    title: article.title,
    category: article.category,
    intro: article.intro,
    lastUpdate: article.lastUpdate,
    source: article.source,
    explicit: article.seoKeywords,
  });

  const jsonLd = buildJsonLd({
    slug: params.id,
    title: article.seoTitle?.trim() || article.title,
    description: article.seoDescription?.trim() || stripHtml(article.intro),
    lastUpdate: article.lastUpdate,
    categoryName: article.category,
    categorySlug,
    url,
    siteName: SITE_CONFIG.name,
    siteUrl: SITE_CONFIG.siteUrl,
    articleBody,
    keywords,
    image: article.image || `${SITE_CONFIG.siteUrl}/og-image.jpg`,
  });

  return (
    <main className="min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.article) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.breadcrumbs) }} />
      <ArticleHydratedView articleData={article} slug={params.id}>
        <ContentHelpfulWidget entityType="article" entityId={params.id} />
        <UniversalComments entityType="article" entityId={params.id} title="نقاش دليل المقال" />
      </ArticleHydratedView>

      <hr className="my-12 border-slate-200 dark:border-slate-800 max-w-4xl mx-auto opacity-50" />
      <RelatedArticles currentArticleId={params.id} category={article.category} />
    </main>
  );
}