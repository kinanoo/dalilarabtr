// src/app/article/[id]/page.tsx
// import {
//   generateArticleSchema,
//   generateBreadcrumbSchema,
// } from '@/lib/schemaOrg';

import { CATEGORY_SLUGS, SITE_CONFIG, getOgImage } from '@/lib/config';
import ArticleHydratedView from '@/components/ArticleHydratedView';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import UniversalComments from '@/components/community/UniversalComments';
import RelatedArticles from '@/components/RelatedArticles';
import AskOnWhatsApp from '@/components/AskOnWhatsApp';
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
        slug: data.slug || '',
        seoTitle: data.seo_title || data.title,
        seoDescription: data.seo_description || '',
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
        // Original publish date — kept SEPARATE from lastUpdate so the Article
        // schema can emit an accurate datePublished (was wrongly equal to
        // dateModified, making every edited article look freshly published).
        createdAt: data.created_at ? new Date(data.created_at).toISOString().split('T')[0] : '',
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
  datePublished?: string;
  categoryName: string;
  categorySlug?: string;
  url: string;
  siteName: string;
  siteUrl: string;
  articleBody?: string;
  keywords?: string[];
  image?: string;
  // Official source URL(s) — emitted as schema.org `citation` so Google sees
  // the article is backed by an authoritative outbound reference (a strong
  // E-E-A-T signal for a YMYL immigration/government-procedure site).
  source?: string;
  // Procedural fields used to emit an additional HowTo schema when the
  // article has explicit step-by-step content. HowTo is rich-snippet-eligible
  // (numbered carousel in Google), so articles with 3+ ordered steps benefit
  // from a separate How-To entity alongside the Article one.
  steps?: string[];
  /** Optional per-step image URLs (zipped by index with `steps`). Google's
      HowTo rich result shows a step image carousel when present. */
  stepImages?: string[];
  totalTimeIso?: string;
}) {
  const wordCount = args.articleBody ? calculateWordCount(args.articleBody) : 0;
  const dateModified = args.lastUpdate.includes('T') ? args.lastUpdate : `${args.lastUpdate}T00:00:00Z`;
  // Fall back to dateModified only when we genuinely have no original date.
  const datePublished = args.datePublished
    ? (args.datePublished.includes('T') ? args.datePublished : `${args.datePublished}T00:00:00Z`)
    : dateModified;

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
      // Editorial methodology page — a Google-recognized E-E-A-T signal that
      // documents who produces the content and how it is verified.
      publishingPrinciples: `${args.siteUrl}/editorial-policy`,
    },
    publisher: {
      '@type': 'Organization',
      name: args.siteName,
      url: args.siteUrl,
      publishingPrinciples: `${args.siteUrl}/editorial-policy`,
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
    // ImageObject (not a bare URL) is Google's preferred shape for Article
    // rich results — it can carry a caption and lets Google treat the image as
    // a first-class entity. Large image previews still require the source file
    // itself to be ≥1200px wide (handled at upload, not here).
    image: {
      '@type': 'ImageObject',
      url: args.image || `${args.siteUrl}/og-banner.jpg`,
    },
    reviewedBy: {
      '@type': 'Organization',
      name: 'فريق دليل العرب القانوني',
      url: args.siteUrl,
    },
    lastReviewed: dateModified,
    // Cite the official government/authority source(s) backing this article.
    ...((() => {
      const cites = (args.source || '')
        .split(/[,\n|]/)
        .map((s) => s.trim())
        .filter((s) => /^https?:\/\//.test(s));
      return cites.length ? { citation: cites } : {};
    })()),
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

  // HowTo schema — only emitted when the article actually has 3+ procedural
  // steps. Below that threshold the schema looks spammy to Google and can
  // suppress the rich result entirely.
  const usableSteps = (args.steps || []).map((s) => s.trim()).filter(Boolean);
  const howTo = usableSteps.length >= 3 ? {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: args.title,
    description: args.description,
    inLanguage: 'ar',
    image: args.image || `${args.siteUrl}/og-banner.jpg`,
    ...(args.totalTimeIso ? { totalTime: args.totalTimeIso } : {}),
    step: usableSteps.map((text, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: text.length > 80 ? text.slice(0, 80) + '…' : text,
      text,
      url: `${args.url}#step-${i + 1}`,
      ...(args.stepImages?.[i] ? { image: args.stepImages[i] } : {}),
    })),
  } : null;

  return { article, breadcrumbs, howTo };
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const article = await fetchArticleData(params.id);

  if (!article) {
    // SEO — REAL 404, not a soft one: the /article segment has a loading.tsx,
    // so once the page starts streaming the 200 status is already committed
    // and the page-level notFound() renders the 404 UI *with HTTP 200*
    // (soft-404 → GSC "Crawled – currently not indexed" across the site's
    // largest URL space). generateMetadata resolves BEFORE the first flush,
    // so throwing notFound() here returns a genuine 404 status.
    notFound();
  }

  // Prefer English slug for canonical URL (SEO best practice)
  const canonicalSlug = article.slug || params.id;
  const canonicalUrl = `${SITE_CONFIG.siteUrl}/article/${canonicalSlug}`;
  // Title hygiene: ~44% of stored seo_title values already end with a (often
  // truncated) brand suffix like "… | دليل العرب في ت". The root layout's
  // title.template then appends the brand AGAIN → a bloated, double-branded,
  // keyword-burying title that Google truncates (e.g. "… | دليل العرب في ت |
  // دليل العرب والسوريين في تركيا"). Strip any embedded brand fragment, append a
  // concise brand ONCE, and return it as `absolute` below so the template never
  // stacks a second brand. Keyword stays first + fully visible in the SERP.
  const BRAND_SUFFIX = 'دليل العرب في تركيا';
  const stripBrand = (s: string) =>
    s.replace(/\s*[|｜–—-]\s*دليل\s+العرب[\s\S]*$/u, '').replace(/\s*[|｜]\s*$/u, '').trim();
  const cleanTitleBase = stripBrand(article.seoTitle?.trim() || article.title || '') || (article.title || '').trim();
  const title = `${cleanTitleBase} | ${BRAND_SUFFIX}`;
  // Build description: prefer seoDescription, then intro, pad with details if too short
  let rawDesc = article.seoDescription?.trim() || stripHtml(article.intro);
  if (rawDesc.length < 120) {
    const extra = stripHtml(article.details);
    if (extra) rawDesc = (rawDesc + ' ' + extra).trim();
  }
  // Trim without cutting mid-word: prefer the last full sentence within 155
  // chars, else the last whole word + ellipsis. Avoids dangling fragments like
  // "… وكيف تعترض. من هيئة…" in SERP snippets and social cards.
  const description = (() => {
    if (rawDesc.length <= 155) return rawDesc;
    const slice = rawDesc.slice(0, 155);
    const sentenceEnd = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('؟ '), slice.lastIndexOf('! '));
    if (sentenceEnd > 90) return slice.slice(0, sentenceEnd + 1).trim();
    const sp = slice.lastIndexOf(' ');
    return (sp > 0 ? slice.slice(0, sp) : slice).trim() + '…';
  })();
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
    // `absolute` bypasses the root layout's "%s | brand" template so the brand
    // appears exactly once (see title-hygiene note above).
    title: { absolute: title },
    description,
    keywords,
    authors: [{ name: SITE_CONFIG.name }],
    alternates: { canonical: canonicalUrl },
    // article:* meta tags (OpenGraph spec) — Facebook / LinkedIn / Google News
    // use these to attribute the author + section + dates separately from the
    // generic Article schema. The og:type=article block below already covers
    // some of this, but a few crawlers only read the meta name="article:*"
    // form, so we emit both.
    other: {
      'article:author': SITE_CONFIG.name,
      'article:published_time': dateModified,
      'article:modified_time': dateModified,
      ...(article.category ? { 'article:section': article.category } : {}),
    },
    openGraph: {
      title: article.title,
      description,
      type: 'article',
      url: canonicalUrl,
      images: [{ url: getOgImage(article.image, { title: article.title }), width: 1200, height: 630, type: 'image/png', alt: article.title }],
      publishedTime: dateModified,
      modifiedTime: dateModified,
      section: article.category,
      tags: keywords.slice(0, 10),
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: [getOgImage(article.image, { title: article.title })],
    },
  };
}

export default async function ArticlePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const article = await fetchArticleData(params.id);

  if (!article) {
    // Render the shared noindex not-found page instead of an indexable 404
    // body. This stops Google from crawling/indexing endless missing-article
    // URLs and poisoning trust in the /article pattern.
    notFound();
  }

  // Canonicalise the URL: if this article has a short (English) slug and the
  // visitor arrived via its long Arabic id — or any other non-current slug —
  // 308-redirect to the canonical short URL. The id-based lookup in
  // fetchArticleData means the OLD Arabic link keeps working forever; it just
  // forwards to the clean short link now, so shortening an existing article's
  // slug never 404s a shared/indexed URL and consolidates its SEO signals.
  const decodedParam = decodeURIComponent(params.id);
  if (article.slug && decodedParam !== article.slug) {
    permanentRedirect(`/article/${article.slug}`);
  }

  const canonicalSlug = article.slug || params.id;
  const url = `${SITE_CONFIG.siteUrl}/article/${canonicalSlug}`;
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

  // Per-step images for the HowTo rich result: the in-order <img> URLs from
  // the body (illustrated step guides put one screenshot per step).
  const stepImages = (article.details.match(/<img[^>]+src=["']([^"']+)["']/gi) || [])
    .map((m: string) => (m.match(/src=["']([^"']+)["']/i) || [])[1])
    .filter((s: string | undefined): s is string => Boolean(s));

  const jsonLd = buildJsonLd({
    slug: params.id,
    title: article.seoTitle?.trim() || article.title,
    description: (() => { let d = article.seoDescription?.trim() || stripHtml(article.intro); if (d.length < 120) { const extra = stripHtml(article.details); if (extra) d = (d + ' ' + extra).trim(); } return d.length > 155 ? d.substring(0, 155).trim() + '…' : d; })(),
    lastUpdate: article.lastUpdate,
    datePublished: article.createdAt,
    categoryName: article.category,
    categorySlug,
    url,
    siteName: SITE_CONFIG.name,
    siteUrl: SITE_CONFIG.siteUrl,
    articleBody,
    keywords,
    image: article.image || `${SITE_CONFIG.siteUrl}/og-banner.jpg`,
    source: article.source,
    steps: article.steps,
    stepImages,
  });

  // Preload the article hero image — it's almost always the LCP element.
  // Next will hoist this <link> into <head>, so the browser starts the image
  // fetch in parallel with the rest of the document parse. Only emit for
  // images we actually host (http/https); skip the static fallback since
  // every page would emit the same preload (wasted bandwidth) and the
  // image is cached aggressively anyway.
  const lcpPreload = article.image && /^https?:\/\//i.test(article.image)
    ? <link rel="preload" as="image" href={article.image} fetchPriority="high" />
    : null;

  return (
    <main className="min-h-screen flex flex-col">
      {lcpPreload}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.article) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.breadcrumbs) }} />
      {jsonLd.howTo && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.howTo) }} />
      )}
      <ArticleHydratedView articleData={article} slug={params.id}>
        {/* "Didn't understand? message us on WhatsApp" — on every article
            (not the services directory, which has its own contact buttons). */}
        <AskOnWhatsApp topic={article.title} />
        <UniversalComments entityType="article" entityId={params.id} />
      </ArticleHydratedView>
      {/* Related Articles — internal linking helps SEO + keeps users on site */}
      <RelatedArticles currentArticleId={params.id} category={article.category} />
    </main>
  );
}