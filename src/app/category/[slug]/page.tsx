// import PageHero from '@/components/PageHero';
import { CATEGORY_SLUGS, SITE_CONFIG, getOgImage } from '@/lib/config';
// import { FolderOpen } from 'lucide-react';
import CategoryArticlesList from './CategoryArticlesList';
import { supabase } from '@/lib/supabaseClient';

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import logger from '@/lib/logger';

// 1. السماح بالباراميترات الديناميكية (Dynamic Params)
export const dynamicParams = true;

// Pre-generate every known category and refresh hourly. Without
// generateStaticParams a dynamic route is never built ahead of time even if it
// declares `revalidate`, so these pages were fully dynamic: an uncached
// Supabase read on literally every visit (verified live — the responses came
// back `no-store`). CATEGORY_SLUGS is a static map, so this is free.
export const revalidate = 3600;
export function generateStaticParams() {
  return Object.keys(CATEGORY_SLUGS).map((slug) => ({ slug }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const categoryName = CATEGORY_SLUGS[params.slug];
  const url = `${SITE_CONFIG.siteUrl}/category/${params.slug}`;

  if (!categoryName) {
    return { title: 'قسم غير موجود', robots: { index: false } };
  }

  // Just the category name — the root layout's title template appends
  // "| <brand>" once. Including the brand here produced "name — brand | brand"
  // (doubled), which Google truncates/rewrites and costs CTR.
  const title = categoryName;
  const description = `جميع المقالات والمعلومات المتعلقة بـ ${categoryName} في تركيا. أدلة شاملة ومحدّثة باللغة العربية.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: [{ url: getOgImage(undefined, { title: categoryName }), width: 1200, height: 630, alt: categoryName }],
    },
  };
}

// 2. مكون الصفحة
export default async function CategoryPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const categoryName = CATEGORY_SLUGS[params.slug];

  // جلب المقالات من قاعدة البيانات
  let initialArticles: any[] = [];
  if (supabase && categoryName) {
    try {
      let query = supabase
        .from('articles')
        .select('id, slug, title, intro, last_update, category, image, tags')
        .eq('category', categoryName)
        .eq('status', 'approved');

      const { data } = await query;

      if (data) {
        initialArticles = data.map(a => ({
          slug: a.slug || a.id,
          title: a.title,
          intro: a.intro,
          lastUpdate: a.last_update,
          category: a.category,
          image: a.image,
          tags: a.tags || [],
        }));
      }
    } catch (e) {
      logger.error('Error loading category articles', e);
    }
  }

  if (!categoryName) {
    // Use Next.js built-in notFound() — returns proper 404 status + renders
    // the styled not-found.tsx page. The previous inline JSX 404 was being
    // rendered with a 200 status; worse, any non-ASCII slug that slipped past
    // earlier checks could surface a generic 500 if downstream code touched
    // an undefined categoryName.
    notFound();
  }

  return (
    <main className="flex flex-col min-h-screen">
      {/* JSON-LD: BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "الرئيسية",
                "item": SITE_CONFIG.siteUrl
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": categoryName,
                "item": `${SITE_CONFIG.siteUrl}/category/${params.slug}`
              }
            ]
          })
        }}
      />
      {/* JSON-LD: ItemList — قائمة المقالات في هذا التصنيف */}
      {initialArticles.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": categoryName,
              "numberOfItems": initialArticles.length,
              // No cap. slice(0, 20) left 58 articles out of the structured
              // data across six categories — work 16, kimlik 12, syrians 12,
              // housing 9, official 7, residence 2 — while numberOfItems kept
              // announcing the true total, so the list contradicted its own
              // count. Nothing justified the twenty: enumerating a category is
              // the entire purpose of this block, and thirty-six ListItems of
              // {url, name} is a few kilobytes.
              "itemListElement": initialArticles.map((a: any, i: number) => ({
                "@type": "ListItem",
                "position": i + 1,
                "url": `${SITE_CONFIG.siteUrl}/article/${a.slug}`,
                "name": a.title,
              })),
            })
          }}
        />
      )}

      {/* 🆕 مكون Client لعرض المقالات مع الهيرو والبحث */}
      <CategoryArticlesList
        categoryName={categoryName}
        categorySlug={params.slug}
        initialArticles={initialArticles}
      />


    </main>
  );
}
