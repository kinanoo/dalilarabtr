import { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import { HeartPulse, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import ShareMenu from '@/components/ShareMenu';
import CategoryHubCard from '@/components/CategoryHubCard';
import { SITE_CONFIG, getOgImage } from '@/lib/config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'الصحة والتأمين في تركيا | دليل العرب',
  description: 'دليلك الشامل للتأمين الصحي والمستشفيات والخدمات الطبية في تركيا.',
  openGraph: {
    title: 'الصحة والتأمين في تركيا',
    images: [{ url: getOgImage(), width: 1200, height: 630 }],
  },
};

export default async function HealthPage() {
  let articles: any[] = [];

  if (supabase) {
    const { data } = await supabase
      .from('articles')
      .select('id, slug, title, intro, image, created_at, last_update')
      .eq('status', 'approved')
      .eq('category', 'الصحة والتأمين');

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
      <PageHero
        title="الصحة والتأمين"
        description="نظام المشافي، أنواع التأمين الصحي، وأرقام الطوارئ."
        icon={<HeartPulse className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      />

      <div className="max-w-screen-2xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-full text-[11px] font-black tracking-wider uppercase">
            <Sparkles size={12} />
            دليل القسم
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.length > 0 ? (
            articles.map((article) => (
              <CategoryHubCard key={article.id} article={article} theme="rose" />
            ))
          ) : (
            <div className="col-span-3 text-center py-12 text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              لا توجد مقالات مضافة في هذا القسم حالياً.
            </div>
          )}
        </div>
      </div>
      <div className="max-w-screen-2xl mx-auto px-4 pb-12 flex justify-center">
        <ShareMenu title="الصحة والتأمين في تركيا" text="دليلك الشامل للتأمين الصحي والخدمات الطبية في تركيا." />
      </div>
    </main>
  );
}
