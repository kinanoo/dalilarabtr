import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { ARTICLES } from '@/lib/articles';
import { CATEGORY_SLUGS } from '@/lib/data';
import Link from 'next/link';
import { FileText, ArrowLeft, FolderOpen, AlertCircle } from 'lucide-react';

// 1. توليد الصفحات الثابتة (Static Generation)
export async function generateStaticParams() {
  return Object.keys(CATEGORY_SLUGS).map((slug) => ({
    slug: slug,
  }));
}

// 2. مكون الصفحة
export default async function CategoryPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const categoryName = CATEGORY_SLUGS[params.slug]; // تحويل الرابط (residence) لاسم عربي (الإقامة والأوراق)

  // جلب المقالات التابعة لهذا القسم فقط
  const categoryArticles = Object.entries(ARTICLES).filter(
    ([_, data]) => data.category === categoryName
  );

  if (!categoryName) {
    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
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
      <Navbar />

      <PageHero
        title={categoryName}
        description={`دليل شامل لكل ما يتعلق بـ ${categoryName} في تركيا لعام 2025.`}
        icon={
          <div className="inline-flex p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
            <FolderOpen size={32} className="text-accent-400" />
          </div>
        }
      />

      {/* قائمة المقالات */}
      <div className="max-w-screen-2xl mx-auto px-4 py-16">
        {categoryArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryArticles.map(([slug, article]) => (
              <Link key={slug} href={`/article/${slug}`} className="group bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-accent-500 hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-600 transition-colors">
                    <FileText size={24} />
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {article.lastUpdate}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-primary-700 transition-colors">
                  {article.title}
                </h3>
                
                <p className="text-sm text-slate-500 dark:text-slate-300 line-clamp-2 mb-6 flex-grow leading-relaxed">
                  {article.intro}
                </p>
                
                <div className="flex items-center text-accent-600 font-bold text-sm mt-auto group-hover:gap-2 transition-all">
                  قراءة الدليل <ArrowLeft size={16} className="mr-1" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
            <AlertCircle size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-xl text-slate-500 dark:text-slate-300">جاري إضافة مقالات لهذا القسم قريباً...</p>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}