import { supabase } from '@/lib/supabaseClient';
import { SITE_CONFIG } from '@/lib/config';
import logger from '@/lib/logger';
import DirectoryContent, { type DirectoryArticle } from './DirectoryContent';

// Explicit ceilings so the hub can never again issue an unbounded select.
// Both sit comfortably above the current row counts (~354 approved articles),
// so nothing is truncated today — they exist to bound the response as the
// tables grow rather than to page the list.
const DIRECTORY_ARTICLE_LIMIT = 600;
const DIRECTORY_SCENARIO_LIMIT = 200;

// Server component: fetch the primary directory content (articles + scenarios)
// on the server so the full list is present in the initial HTML — crawlable by
// Google — instead of being hidden behind a client-side loading spinner. The
// interactive layer (search, expand/collapse, live SWR refresh) hydrates on top
// of this server-rendered list via <DirectoryContent />.
export default async function DirectoryPage() {
  let initialArticles: DirectoryArticle[] = [];

  if (supabase) {
    // The two fetches are deliberately sequential and independently guarded.
    // They used to share a `Promise.all`, so a failure on either side emptied
    // BOTH lists — and the articles side was an unbounded select of every
    // approved row *including the full `intro` body*, which is exactly the
    // shape that falls over on Workers. `intro` is not needed to render the
    // links (the card description degrades to empty, the hrefs do not), so it
    // is no longer pulled server-side; `.limit()` keeps the response bounded
    // even if the table grows.
    let articlesRes: { data: any[] | null; error: any } = { data: null, error: null };
    let scenariosRes: { data: any[] | null; error: any } = { data: null, error: null };

    try {
      articlesRes = await supabase
        .from('articles')
        .select('id, slug, title, category, last_update, created_at, image, status, is_active')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(DIRECTORY_ARTICLE_LIMIT);
    } catch (e) {
      logger.error('Directory: articles fetch threw', e);
    }
    if (articlesRes.error) {
      logger.error('Directory: articles query error', articlesRes.error);
    }

    try {
      scenariosRes = await supabase
        .from('consultant_scenarios')
        .select('id, title, description, category, risk_level, last_update, is_active')
        .limit(DIRECTORY_SCENARIO_LIMIT);
    } catch (e) {
      logger.error('Directory: scenarios fetch threw', e);
    }
    if (scenariosRes.error) {
      logger.error('Directory: scenarios query error', scenariosRes.error);
    }

    try {
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
