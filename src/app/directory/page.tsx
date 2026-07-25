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

  // Articles grouped by category for the server-rendered index at the bottom.
  // Scenarios are excluded on purpose: their links are query strings
  // (/consultant?scenario=…), and this project already treats those as URLs it
  // does not want crawled as separate pages.
  const articleIndex = (() => {
    const byCategory = new Map<string, { slug: string; title: string }[]>();
    for (const a of initialArticles) {
      if (a.type !== 'article' || !a.slug || !a.title) continue;
      const key = a.category || 'أخرى';
      const bucket = byCategory.get(key) ?? [];
      bucket.push({ slug: a.slug, title: a.title });
      byCategory.set(key, bucket);
    }
    return [...byCategory.entries()]
      .map(([category, items]) => [
        category,
        items.sort((x, y) => x.title.localeCompare(y.title, 'ar')),
      ] as const)
      .sort((x, y) => y[1].length - x[1].length);
  })();

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

      {/* Full text index, rendered by the SERVER.
          <DirectoryContent> is a client component whose sections start
          collapsed, so its cards — and their hrefs — exist only after
          hydration: the server HTML carried an ItemList but not one crawlable
          <a href="/article/...">. This index closes that gap without forcing
          every accordion open (which would bury the page under ~360 cards).
          It is deliberately visible rather than hidden: a hidden link dump is
          cloaking, an alphabetically grouped "full contents" list is a normal,
          useful page ending — and it is what lets Google reach the long tail of
          articles that currently sit in "discovered – not indexed". */}
      {articleIndex.length > 0 && (
        <section className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pb-16" dir="rtl">
          <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 mb-1">
            فهرس المحتوى الكامل
          </h2>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-5">
            كل الأدلة والمقالات المنشورة — مرتّبة حسب القسم
          </p>
          <div className="space-y-6">
            {articleIndex.map(([categoryName, items]) => (
              <div key={categoryName}>
                <h3 className="text-[13px] font-black text-emerald-700 dark:text-emerald-400 mb-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  {categoryName}{' '}
                  <span className="text-slate-400 font-bold tabular-nums">({items.length})</span>
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-1.5">
                  {items.map((a) => (
                    <li key={a.slug} className="text-[13px] leading-6">
                      <a
                        href={`/article/${a.slug}`}
                        className="text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors"
                      >
                        {a.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
