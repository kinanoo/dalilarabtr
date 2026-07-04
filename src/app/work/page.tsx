import { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import { Briefcase } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import ShareMenu from '@/components/ShareMenu';
import CategoryHubCard from '@/components/CategoryHubCard';
import CrossLinks from '@/components/seo/CrossLinks';
import { getOgImage } from '@/lib/config';
import { SchemaScript, hubCollectionJsonLd } from '@/lib/schemaOrg';

export const revalidate = 3600;

// title + description are inherited from layout.tsx (single source of truth).
// Only page-specific openGraph fields live here.
export const metadata: Metadata = {
  openGraph: {
    title: 'العمل والاستثمار في تركيا',
    images: [{ url: getOgImage(undefined, { title: 'العمل والاستثمار في تركيا' }), width: 1200, height: 630 }],
  },
};

export default async function WorkPage() {
  let articles: any[] = [];

  if (supabase) {
    const { data } = await supabase
      .from('articles')
      .select('id, slug, title, intro, image, created_at, last_update')
      .eq('status', 'approved')
      .in('category', ['العمل والاستثمار', 'العمل والدخل']);

    if (data) {
      articles = data.map(a => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        intro: a.intro,
        image: a.image,
        created_at: a.created_at,
        lastUpdate: a.last_update ? new Date(a.last_update).toISOString().split('T')[0] : '',
      }));
    }
  }

  return (
    <main className="flex flex-col min-h-screen">
      <SchemaScript schema={hubCollectionJsonLd('العمل والاستثمار', 'work', articles)} />
      <PageHero
        title="العمل والاستثمار"
        description="إذن العمل، فتح شركة، الضرائب، والتأمينات الاجتماعية."
        icon={<Briefcase className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      />

      <div className="max-w-screen-2xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.length > 0 ? (
            articles.map((article) => (
              <CategoryHubCard key={article.id} article={article} theme="emerald" />
            ))
          ) : (
            <div className="col-span-3 text-center py-12 text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              لا توجد مقالات مضافة في هذا القسم حالياً.
            </div>
          )}
        </div>
      </div>
      {/* Cross-links — curated internal links for SEO */}
      <div className="w-full max-w-screen-2xl mx-auto px-4 pb-12">
        <CrossLinks context="hub" />
      </div>
      <div className="max-w-screen-2xl mx-auto px-4 pb-12 flex justify-center">
        <ShareMenu title="العمل والاستثمار في تركيا" text="دليلك الشامل لإذن العمل وفتح الشركات في تركيا." />
      </div>
    </main>
  );
}
