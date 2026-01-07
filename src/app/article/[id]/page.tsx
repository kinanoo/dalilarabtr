import {
  SchemaScript,
  generateArticleSchema,
  generateBreadcrumbSchema,
  toISODate,
  toFullUrl,
} from '@/lib/schemaOrg';
import Footer from '@/components/Footer';
import { ARTICLES } from '@/lib/articles';
import { CATEGORY_SLUGS, SITE_CONFIG } from '@/lib/data';
import ArticleHydratedView from '@/components/ArticleHydratedView';
import SuggestionBox from '@/components/ui/SuggestionBox';
import ContributorsList from '@/components/ui/ContributorsList'; // Import added
import Link from 'next/link';
import type { Metadata } from 'next';

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

function inferExtraKeywordsByCategory(categoryName: string): string[] {
  const c = categoryName.toLowerCase();

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

function buildArticleKeywords(args: { slug: string; title: string; category: string; intro: string; lastUpdate: string; source?: string; explicit?: string[] }): string[] {
  const year = (args.lastUpdate || '').slice(0, 4);

  const base = uniqStrings([
    ...(args.explicit || []),
    args.title,
    args.category,
    'الدليل الشامل',
    'تركيا',
    year && year !== '0000' ? year : undefined,
    args.source ? new URL(args.source).hostname : undefined,
  ]);

  const extra = inferExtraKeywordsByCategory(args.category);

  const slugParts = args.slug
    .split(/[-_]/g)
    .map((p) => p.trim())
    .filter(Boolean);

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
}): { article: unknown; breadcrumbs: unknown } {
  const wordCount = args.articleBody ? calculateWordCount(args.articleBody) : 0;

  const dateModified = args.lastUpdate.includes('T')
    ? args.lastUpdate
    : `${args.lastUpdate}T00:00:00Z`;

  const datePublished = dateModified;

  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: args.title,
    description: args.description,
    inLanguage: 'ar',
    datePublished,
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
        url: `${args.siteUrl}/og-image.png`,
      },
    },
    articleSection: args.categoryName,
    ...(args.articleBody && { articleBody: args.articleBody }),
    ...(wordCount > 0 && { wordCount }),
    ...(args.keywords && args.keywords.length > 0 && { keywords: args.keywords.join(', ') }),
    image: args.image || `${args.siteUrl}/og-image.png`,
  };

  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'الرئيسية',
      item: args.siteUrl,
    },
    ...(args.categorySlug
      ? [
        {
          '@type': 'ListItem',
          position: 2,
          name: args.categoryName,
          item: `${args.siteUrl}/category/${args.categorySlug}`,
        },
      ]
      : []),
    {
      '@type': 'ListItem',
      position: args.categorySlug ? 3 : 2,
      name: args.title,
      item: args.url,
    },
  ];

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  return { article, breadcrumbs };
}

export async function generateStaticParams() {
  return Object.keys(ARTICLES).map((slug) => ({
    id: slug,
  }));
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const article = ARTICLES[params.id];

  if (!article) {
    return {
      title: '404 - المقالة غير موجودة',
      description: 'عذراً، هذه المقالة لم تعد موجودة',
    };
  }

  const url = `${SITE_CONFIG.siteUrl}/article/${params.id}`;
  const title = article.seoTitle?.trim() || `${article.title} | ${SITE_CONFIG.name}`;
  const description = article.seoDescription?.trim() || article.intro;
  const keywords = buildArticleKeywords({
    slug: params.id,
    title: article.title,
    category: article.category,
    intro: article.intro,
    lastUpdate: article.lastUpdate,
    source: article.source,
    explicit: article.seoKeywords,
  });

  const articleBody = [article.intro, article.details, ...(article.steps || []), ...(article.tips || [])]
    .filter(Boolean)
    .join(' ');

  const ogImage = `${SITE_CONFIG.siteUrl}/og-image.png`;

  const dateModified = article.lastUpdate.includes('T')
    ? article.lastUpdate
    : `${article.lastUpdate}T00:00:00Z`;

  return {
    title,
    description,
    keywords,
    authors: [{ name: SITE_CONFIG.name }],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: article.title,
      description,
      type: 'article',
      url,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
      publishedTime: dateModified,
      modifiedTime: dateModified,
      section: article.category,
      tags: keywords.slice(0, 10), // أول 10 كلمات مفتاحية
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ArticlePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const article = ARTICLES[params.id];

  if (!article) {
    return (
      <main className="min-h-screen flex flex-col">
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
          <h1 className="text-4xl font-bold text-slate-300 mb-4">404</h1>
          <p className="text-xl text-slate-600 mb-8">عذراً، هذا الدليل غير متوفر حالياً.</p>
          <Link href="/" className="bg-primary-600 text-white px-6 py-3 rounded-lg font-bold">العودة للرئيسية</Link>
        </div>
        <Footer />
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
    description: article.seoDescription?.trim() || article.intro,
    lastUpdate: article.lastUpdate,
    categoryName: article.category,
    categorySlug,
    url,
    siteName: SITE_CONFIG.name,
    siteUrl: SITE_CONFIG.siteUrl,
    articleBody,
    keywords,
    image: `${SITE_CONFIG.siteUrl}/og-image.png`,
  });

  return (
    <main className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.article) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.breadcrumbs) }}
      />
      <ArticleHydratedView initialArticle={article} slug={params.id} />

      {/* Contributors, CTA, and Suggestion Box */}
      <div className="max-w-4xl mx-auto px-4 w-full mt-8 mb-16">
        {/* Contributors List - Shows only if there are approved contributions */}
        <ContributorsList articleId={params.id} />

        {/* CTA */}
        <div className="text-center mb-6 animate-in slide-in-from-bottom-4 duration-700 delay-300">
          <p className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">
            📢 "المحتوى تجربتك، وأنت جزء منه!"
          </p>
          <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            هل مررت بتجربة مختلفة في هذه المعاملة؟ أو تغيرت القوانين مؤخراً؟
            <br />
            <span className="text-emerald-600 font-bold">شاركنا تجربتك في الصندوق بالأسفل</span> لتعم الفائدة على الجميع.
          </p>
        </div>

        <SuggestionBox articleId={params.id} source="article" title={article.title} />
      </div>

      <Footer />
    </main>
  );
}