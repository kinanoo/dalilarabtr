import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { ARTICLES } from '@/lib/articles';
import { CATEGORY_SLUGS } from '@/lib/data';
import { FolderOpen } from 'lucide-react';
import CategoryArticlesList from './CategoryArticlesList';

// 1. توليد الصفحات الثابتة (Static Generation)
export async function generateStaticParams() {
  return Object.keys(CATEGORY_SLUGS).map((slug) => ({
    slug: slug,
  }));
}

// 2. مكون الصفحة
export default async function CategoryPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const categoryName = CATEGORY_SLUGS[params.slug];

  // جلب المقالات الثابتة للـ SEO
  const staticArticles = Object.entries(ARTICLES)
    .filter(([_, data]) => data.category === categoryName)
    .map(([slug, data]) => ({
      slug,
      title: data.title,
      intro: data.intro,
      lastUpdate: data.lastUpdate,
      category: data.category,
    }));

  if (!categoryName) {
    return (
      <main className="min-h-screen flex flex-col">

        <div className="flex-grow flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold text-slate-300">404</h1>
          <p>القسم غير موجود</p>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen">


      <PageHero
        title={categoryName}
        description={`دليل شامل لكل ما يتعلق بـ ${categoryName} في تركيا لعام 2025.`}
        icon={
          <div className="inline-flex p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
            <FolderOpen size={32} className="text-accent-400" />
          </div>
        }
      />

      {/* 🆕 مكون Client لعرض المقالات من لوحة التحكم */}
      <CategoryArticlesList
        categoryName={categoryName}
        initialArticles={staticArticles}
      />

      <Footer />
    </main>
  );
}
