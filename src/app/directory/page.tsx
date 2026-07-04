import { supabase } from '@/lib/supabaseClient';
import { SITE_CONFIG } from '@/lib/config';
import logger from '@/lib/logger';
import DirectoryContent, { type DirectoryArticle } from './DirectoryContent';

// Server component: fetch the primary directory content (articles + scenarios)
// on the server so the full list is present in the initial HTML — crawlable by
// Google — instead of being hidden behind a client-side loading spinner. The
// interactive layer (search, expand/collapse, live SWR refresh) hydrates on top
// of this server-rendered list via <DirectoryContent />.
export default async function DirectoryPage() {
  let initialArticles: DirectoryArticle[] = [];

  if (supabase) {
    try {
      const [articlesRes, scenariosRes] = await Promise.all([
        supabase
          .from('articles')
          .select('id, slug, title, intro, category, last_update, created_at, image, status, is_active')
          .eq('status', 'approved'),
        supabase
          .from('consultant_scenarios')
          .select('id, title, description, category, risk_level, last_update, is_active'),
      ]);

      const articleRows = (articlesRes.data ?? [])
        .filter((a: any) => a.is_active !== false)
        .map((a: any): DirectoryArticle => ({
          slug: a.slug || a.id,
          title: a.title,
          intro: a.intro ?? '',
          category: a.category,
          lastUpdate: a.lastUpdate ?? a.last_update ?? '',
          createdAt: a.created_at,
          image: a.image,
          type: 'article',
        }));

      const scenarioRows = (scenariosRes.data ?? [])
        .filter((s: any) => s.is_active !== false)
        .map((s: any): DirectoryArticle => ({
          slug: s.id,
          title: s.title,
          intro: s.desc ?? s.description ?? '',
          category: s.category || 'scenarios',
          lastUpdate: s.lastUpdate ?? s.last_update ?? new Date().toISOString().split('T')[0],
          type: 'scenario',
          risk: s.risk ?? s.risk_level,
        }));

      initialArticles = [...articleRows, ...scenarioRows];
    } catch (e) {
      logger.error('Error loading directory content', e);
    }
  }

  // JSON-LD: ItemList of the article/scenario entries so search engines can
  // read the directory as a structured list of links even before hydration.
  const itemListJsonLd =
    initialArticles.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'الدليل الشامل',
          numberOfItems: initialArticles.length,
          itemListElement: initialArticles.slice(0, 30).map((a, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url:
              a.type === 'scenario'
                ? `${SITE_CONFIG.siteUrl}/consultant?scenario=${a.slug}`
                : `${SITE_CONFIG.siteUrl}/article/${a.slug}`,
            name: a.title,
          })),
        }
      : null;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: SITE_CONFIG.siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'الدليل الشامل',
        item: `${SITE_CONFIG.siteUrl}/directory`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <DirectoryContent initialArticles={initialArticles} />
    </>
  );
}
