// import PageHero from '@/components/PageHero';
import { CATEGORY_SLUGS } from '@/lib/config';
// import { FolderOpen } from 'lucide-react';
import CategoryArticlesList from './CategoryArticlesList';
import { supabase } from '@/lib/supabaseClient';

// 1. السماح بالباراميترات الديناميكية (Dynamic Params)
export const dynamicParams = true;

// 2. مكون الصفحة
export default async function CategoryPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const categoryName = CATEGORY_SLUGS[params.slug];

  // جلب المقالات من قاعدة البيانات
  let initialArticles: any[] = [];
  if (supabase && categoryName) {
    try {
      const { data } = await supabase
        .from('articles')
        .select('id, title, intro, last_update, category, image')
        .eq('category', categoryName);

      if (data) {
        initialArticles = data.map(a => ({
          slug: a.id,
          title: a.title,
          intro: a.intro,
          lastUpdate: a.last_update,
          category: a.category,
          image: a.image
        }));
      }
    } catch (e) {
      console.error('Error loading category articles', e);
    }
  }

  if (!categoryName) {
    return (
      <main className="min-h-screen flex flex-col">

        <div className="flex-grow flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold text-slate-300">404</h1>
          <p>القسم غير موجود</p>
        </div>

      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen">


      {/* 🆕 مكون Client لعرض المقالات مع الهيرو والبحث */}
      <CategoryArticlesList
        categoryName={categoryName}
        initialArticles={initialArticles}
      />


    </main>
  );
}
