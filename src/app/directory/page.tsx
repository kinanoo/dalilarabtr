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

  // Captured once: TypeScript's narrowing of the module-level `supabase` does
  // not survive into the closures below.
  const db = supabase;
  if (db) {
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

    // Column-tolerant fetch. Verified live AFTER the sequential-await +
    // `.limit()` fix deployed: this hub still rendered zero article links while
    // /articles returned 24 through the SAME client — so the failure is not
    // concurrency and not response size. The one column /directory selects that
    // the working queries do not is `is_active`, and PostgREST fails the WHOLE
    // select when any listed column is missing. So: ask for it, and if that
    // errors, retry without it (rows then default to active, which is how the
    // filter below already treats a missing value). This mirrors the fallback
    // /services uses for `is_featured`.
    const ARTICLE_COLS = 'id, slug, title, category, last_update, created_at, image, status';
    const runArticles = (cols: string) =>
      db
        .from('articles')
        .select(cols)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(DIRECTORY_ARTICLE_LIMIT);

    try {
      articlesRes = await runArticles(`${ARTICLE_COLS}, is_active`);
      if (articlesRes.error) {
        logger.error('Directory: articles query error (with is_active)', articlesRes.error);
        articlesRes = await runArticles(ARTICLE_COLS);
        if (articlesRes.error) logger.error('Directory: articles retry failed', articlesRes.error);
      }
    } catch (e) {
      logger.error('Directory: articles fetch threw', e);
    }

    // Same column-tolerant treatment — this table also selects `is_active`.
    const SCENARIO_COLS = 'id, title, description, category, risk_level, last_update';
    const runScenarios = (cols: string) =>
      db.from('consultant_scenarios').select(cols).limit(DIRECTORY_SCENARIO_LIMIT);

    try {
      scenariosRes = await runScenarios(`${SCENARIO_COLS}, is_active`);
      if (scenariosRes.error) {
        logger.error('Directory: scenarios query error (with is_active)', scenariosRes.error);
        scenariosRes = await runScenarios(SCENARIO_COLS);
        if (scenariosRes.error) logger.error('Directory: scenarios retry failed', scenariosRes.error);
      }
    } catch (e) {
      logger.error('Directory: scenarios fetch threw', e);
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
